'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  UsuarioLogueado,
  IAuthContext,
  ApiResponse,
  MotivoCierreSesion,
} from '@/types/types';
import {
  apiPost,
  apiGet,
  isApiError,
  getApiErrorCode,
  ApiErrorCode,
} from '@/lib/apiClient';

const AuthContext = createContext<IAuthContext | undefined>(undefined);

/**
 * Lock compartido entre pestañas del mismo origen (Web Locks API).
 * `/api/auth/refresh` **rota** el refreshToken: dos pestañas que envían el mismo
 * token a la vez provocan un `409` de carrera o, fuera de la gracia de 30 s, un
 * reuso que revoca la sesión.
 */
const LOCK_REFRESH = 'tlaxapp:auth-refresh';

/** Reintentos ante fallos de red (no ante respuestas HTTP de error). */
const INTENTOS_RED = 3;

/**
 * Códigos de `401` que **no** son una sesión vencida y no deben disparar
 * `renovarSesion()` (rotaría las cookies sin motivo).
 * - `TOKEN_EXPIRED`: enlace de correo vencido (verificación / reset), H6.
 * - `INVALID_CURRENT_PASSWORD`: contraseña actual incorrecta (cambio de
 *   contraseña / borrado de cuenta); refrescar gastaría `refreshLimiter`.
 * - `SESSION_REVOKED`: la sesión ya no existe en el servidor; un refresh no la
 *   recupera. Además cierra la sesión local (ver `MOTIVO_POR_CODIGO`).
 */
const CODIGOS_401_SIN_REFRESH: ReadonlySet<string> = new Set([
  ApiErrorCode.TOKEN_EXPIRED,
  ApiErrorCode.INVALID_CURRENT_PASSWORD,
  ApiErrorCode.SESSION_REVOKED,
]);

/**
 * Códigos con los que el backend da la sesión por terminada (F8 y F5). Se
 * decide por `code`, nunca por `detail`. Ninguno dispara un refresh: el `403`
 * nunca lo hace y `SESSION_REVOKED` está en `CODIGOS_401_SIN_REFRESH`.
 */
const MOTIVO_POR_CODIGO: Readonly<Record<string, MotivoCierreSesion>> = {
  [ApiErrorCode.SESSION_REVOKED]: 'sesion_revocada',
  [ApiErrorCode.ACCOUNT_RESTRICTED]: 'cuenta_restringida',
};

const motivoDeCodigo = (codigo: string | undefined): MotivoCierreSesion | undefined =>
  codigo ? MOTIVO_POR_CODIGO[codigo] : undefined;

/** Persiste el motivo para que el login lo muestre aunque se recargue la página. */
const CLAVE_MOTIVO_CIERRE = 'motivoCierreSesion';

const esMotivoCierre = (valor: string | null): valor is MotivoCierreSesion =>
  valor === 'sesion_revocada' || valor === 'cuenta_restringida';

/** Revalidación al volver a la pestaña (F8c): como mucho una cada 30 s. */
const INTERVALO_REVALIDACION_MS = 30_000;

/**
 * Lee el `code` de una respuesta de error sin consumir el body original (usa
 * `clone()`). Si el body no es JSON o no se puede leer, devuelve `undefined` y
 * se sigue el flujo normal.
 */
async function codigoDeRespuesta(response: Response): Promise<string | undefined> {
  if (!(response.headers.get('content-type') || '').includes('application/json')) {
    return undefined;
  }
  try {
    const body: unknown = await response.clone().json();
    const code = (body as { code?: unknown } | null)?.code;
    return typeof code === 'string' ? code : undefined;
  } catch {
    return undefined;
  }
}

/** Motivo de cierre de una respuesta `401`/`403`, si lo hay. */
async function motivoDeRespuesta(response: Response): Promise<MotivoCierreSesion | undefined> {
  if (response.status !== 401 && response.status !== 403) return undefined;
  return motivoDeCodigo(await codigoDeRespuesta(response));
}

/**
 * Claves de `sessionStorage` que pertenecen a la sesión. Se limpian al cerrar
 * sesión para evitar que un usuario distinto en el mismo navegador herede
 * tokens de confirmación o avisos pendientes del anterior.
 */
const CLAVES_SESION = [
  'registroToken',
  'passForgetToken',
  'passwordResetSuccess',
  'reporteExitoso',
  CLAVE_MOTIVO_CIERRE,
] as const;

/**
 * Resultado de intentar renovar la sesión.
 * - `ok`: cookies rotadas (o ya renovadas por otra pestaña).
 * - `sesion_invalida`: el backend rechazó el refresh (`401`/`403`). Procede
 *   cerrar sesión; `motivo` indica si fue revocación o cuenta restringida.
 * - `error`: no hubo respuesta concluyente (red caída, 5xx, 429). La sesión
 *   **no** está invalidada: no se debe expulsar al usuario.
 */
type EstadoRefresh = 'ok' | 'sesion_invalida' | 'error';

interface ResultadoSesion {
  estado: EstadoRefresh;
  /** Motivo del rechazo, solo con `sesion_invalida`. */
  motivo?: MotivoCierreSesion;
  /** Respuesta ya válida obtenida al reintentar dentro del lock. */
  response?: Response;
}

const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Un fallo de red no produce `ApiError` (solo las respuestas HTTP lo hacen).
 * Se usa para distinguir "el servidor no contestó" de "el servidor dijo no".
 */
const esErrorDeRed = (err: unknown) => !isApiError(err);

/** Espera tras un `409` del refresh antes de reintentar la petición original. */
const ESPERA_CARRERA_MS = 300;

/** `carrera`: `409` del refresh; otra solicitud ya renovó la sesión (gracia de 30 s). */
interface ResultadoPedido {
  estado: EstadoRefresh | 'carrera';
  motivo?: MotivoCierreSesion;
}

/** Pide un refresh. Distingue el rechazo de sesión de un fallo transitorio. */
async function pedirRefresh(): Promise<ResultadoPedido> {
  try {
    await apiPost(fetch, '/api/auth/refresh');
    return { estado: 'ok' };
  } catch (err) {
    // 409 = carrera legítima: otra solicitud ya rotó la sesión y el backend no
    // emite cookies nuevas en esta respuesta. No es red ni sesión inválida.
    if (isApiError(err) && err.status === 409) return { estado: 'carrera' };
    // 401 = sesión revocada/vencida (SESSION_REVOKED), sin cookie o expirada.
    // 403 = cuenta restringida (ACCOUNT_RESTRICTED), no activada o firma inválida.
    if (isApiError(err) && (err.status === 401 || err.status === 403)) {
      return { estado: 'sesion_invalida', motivo: motivoDeCodigo(getApiErrorCode(err)) };
    }
    return { estado: 'error' };
  }
}

/**
 * Ejecuta `fn` bajo el lock de refresco compartido entre pestañas. Si el
 * navegador no soporta Web Locks (o el contexto no es seguro), ejecuta `fn`
 * directamente: la promesa en memoria sigue deduplicando dentro de la pestaña.
 */
async function conLockDeRefresco<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks?.request) return fn();
  return locks.request(LOCK_REFRESH, fn) as Promise<T>;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UsuarioLogueado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [motivoCierreSesion, setMotivoCierreSesion] = useState<MotivoCierreSesion | null>(null);

  /** Respaldo sin Web Locks: un único refresh en vuelo por pestaña. */
  const refreshPromise = useRef<Promise<ResultadoSesion> | null>(null);

  /** Evita repetir el cierre forzado cuando varias peticiones lo detectan a la vez. */
  const cierreForzado = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const clearMotivoCierreSesion = useCallback(() => {
    setMotivoCierreSesion(null);
    sessionStorage.removeItem(CLAVE_MOTIVO_CIERRE);
  }, []);

  // Recupera el motivo tras recargar la página (se lee aquí y no en el estado
  // inicial para no desalinear la hidratación).
  useEffect(() => {
    const guardado = sessionStorage.getItem(CLAVE_MOTIVO_CIERRE);
    if (esMotivoCierre(guardado)) setMotivoCierreSesion(guardado);
  }, []);

  /**
   * Cierre de sesión decidido por el backend (`SESSION_REVOKED` o
   * `ACCOUNT_RESTRICTED`). Limpia el estado local, guarda el motivo para el
   * login y pide al backend que borre las cookies httpOnly: desde E1d
   * `/api/auth/logout` funciona sin sesión válida. Sin ese paso, cada recarga
   * volvería a recibir el mismo error.
   */
  const cerrarSesionPorMotivo = useCallback((motivo: MotivoCierreSesion) => {
    setUser(null);
    setError(null);
    setMotivoCierreSesion(motivo);
    if (cierreForzado.current) return;
    cierreForzado.current = true;

    CLAVES_SESION.forEach((clave) => sessionStorage.removeItem(clave));
    sessionStorage.setItem(CLAVE_MOTIVO_CIERRE, motivo);
    apiPost(fetch, '/api/auth/logout').catch(() => {
      // Best-effort: el estado local ya está cerrado.
    });
  }, []);

  /** Reintenta la petición ante errores de red con backoff lineal. */
  const fetchConReintentos = useCallback(
    async (doFetch: () => Promise<Response>): Promise<Response> => {
      for (let attempt = 0; ; attempt++) {
        try {
          return await doFetch();
        } catch (err) {
          if (attempt >= INTENTOS_RED - 1) throw err;
          await esperar(1000 * (attempt + 1));
        }
      }
    },
    []
  );

  /**
   * Renueva la sesión con doble serialización (entre pestañas con Web Locks y
   * dentro de la pestaña con `refreshPromise`).
   *
   * Si se pasa `reintentar`, **primero** se reintenta la petición original: si
   * devuelve algo distinto de 401, otra pestaña ya renovó la cookie y no hace
   * falta un refresh (evita consumir el rate limit y un falso reuso).
   */
  const renovarSesion = useCallback(
    (reintentar?: () => Promise<Response>): Promise<ResultadoSesion> => {
      // Un segundo llamante comparte la renovación pero **no** la respuesta
      // reintentada: esa pertenece a la petición que inició el refresh.
      if (refreshPromise.current) {
        return refreshPromise.current.then(({ estado, motivo }) => ({ estado, motivo }));
      }

      const ejecucion = conLockDeRefresco(async (): Promise<ResultadoSesion> => {
        if (reintentar) {
          const respuesta = await fetchConReintentos(reintentar);
          if (respuesta.status !== 401) return { estado: 'ok', response: respuesta };
        }

        let pedido = await pedirRefresh();

        if (pedido.estado === 'carrera') {
          // Otra solicitud ya renovó: esperar a que sus cookies se asienten y
          // reintentar la petición original una sola vez con ellas.
          await esperar(ESPERA_CARRERA_MS);
          if (!reintentar) return { estado: 'ok' };

          const respuesta = await fetchConReintentos(reintentar);
          if (respuesta.status !== 401) return { estado: 'ok', response: respuesta };

          // Sigue en 401: un único refresh más. Un segundo 409 consecutivo se
          // trata como error (no se cierra sesión ni se encadenan reintentos).
          pedido = await pedirRefresh();
          if (pedido.estado === 'carrera') return { estado: 'error' };
        }

        if (pedido.estado !== 'ok') return { estado: pedido.estado, motivo: pedido.motivo };

        if (reintentar) {
          return { estado: 'ok', response: await fetchConReintentos(reintentar) };
        }
        return { estado: 'ok' };
      }).finally(() => {
        refreshPromise.current = null;
      });

      refreshPromise.current = ejecucion;
      return ejecucion;
    },
    [fetchConReintentos]
  );

  const fetchWithAuth = useCallback(
    async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      const doFetch = () => fetch(input, { ...init, credentials: 'include' });

      /** Cierra la sesión si la respuesta trae un motivo de cierre (F8 / F5). */
      const revisarCierre = async (respuesta: Response) => {
        const motivo = await motivoDeRespuesta(respuesta);
        if (motivo) cerrarSesionPorMotivo(motivo);
        return respuesta;
      };

      const response = await fetchConReintentos(doFetch);
      if (response.status !== 401) return revisarCierre(response);

      // 401 que no es de sesión vencida (enlace de correo vencido, contraseña
      // incorrecta, sesión revocada): sin renovar. Se decide por code.
      const codigo = await codigoDeRespuesta(response);
      if (codigo && CODIGOS_401_SIN_REFRESH.has(codigo)) return revisarCierre(response);

      // 401: se asume access token vencido y se reintenta una sola vez.
      const resultado = await renovarSesion(doFetch);
      if (resultado.response) return revisarCierre(resultado.response);

      if (resultado.estado === 'ok') {
        // Otra petición de la misma pestaña/pestaña hermana ya renovó: reintentar.
        return revisarCierre(await fetchConReintentos(doFetch));
      }

      if (resultado.estado === 'sesion_invalida') {
        if (resultado.motivo) {
          cerrarSesionPorMotivo(resultado.motivo);
        } else {
          setUser(null);
          setError(null);
        }
      } else {
        // Red caída / 5xx / 429: la sesión no está invalidada.
        setError('No pudimos renovar tu sesión por un problema de conexión. Intenta de nuevo.');
      }

      // Se devuelve el 401 original para que la capa superior decida la UI.
      return response;
    },
    [fetchConReintentos, renovarSesion, cerrarSesionPorMotivo]
  );

  const login = useCallback((user: UsuarioLogueado) => {
    setUser(user);
    setError(null);
    setMotivoCierreSesion(null);
    cierreForzado.current = false;
    sessionStorage.removeItem(CLAVE_MOTIVO_CIERRE);
    localStorage.removeItem('lastPasswordRequest');
    localStorage.removeItem('bloqueoReenvioCorreo');
    sessionStorage.removeItem('passForgetToken');
    sessionStorage.removeItem('registroToken');
  }, []);

  const updateUser = useCallback((newData: Partial<UsuarioLogueado>) => {
    setUser((prev) => (prev ? { ...prev, ...newData } : prev));
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost(fetch, '/api/auth/logout');
    } catch {
      // Desde E1d el logout siempre limpia las cookies; si falla la red, la
      // limpieza local sigue cortando la sesión en el cliente.
    } finally {
      setUser(null);
      setError(null);
      setMotivoCierreSesion(null);
      // Evita que un usuario distinto en el mismo navegador herede estado.
      CLAVES_SESION.forEach((clave) => sessionStorage.removeItem(clave));
    }
  }, []);

  useEffect(() => {
    let cancelado = false;

    const inicializar = async () => {
      const obtenerMe = () =>
        apiGet<ApiResponse<{ usuario: UsuarioLogueado }>>(fetch, '/api/auth/me');

      for (let attempt = 0; attempt < INTENTOS_RED; attempt++) {
        try {
          const data = await obtenerMe();
          if (cancelado) return;
          setUser(data.data.usuario);
          setLoading(false);
          return;
        } catch (err) {
          if (cancelado) return;

          // Sesión revocada o cuenta restringida: sin refresh (F8 / F5).
          const motivo = motivoDeCodigo(getApiErrorCode(err));
          if (motivo) {
            cerrarSesionPorMotivo(motivo);
            setLoading(false);
            return;
          }

          if (isApiError(err) && err.status === 401) {
            // Sin sesión o access token vencido: se intenta renovar una vez.
            const resultado = await renovarSesion();
            if (cancelado) return;

            if (resultado.estado === 'ok') {
              try {
                const data = await obtenerMe();
                if (cancelado) return;
                setUser(data.data.usuario);
              } catch (errMe) {
                if (cancelado) return;
                const motivoMe = motivoDeCodigo(getApiErrorCode(errMe));
                if (motivoMe) cerrarSesionPorMotivo(motivoMe);
                else setUser(null);
              }
              setLoading(false);
              return;
            }

            if (resultado.estado === 'sesion_invalida') {
              if (resultado.motivo) cerrarSesionPorMotivo(resultado.motivo);
              else setUser(null);
              setLoading(false);
              return;
            }
            // Error de red al renovar: cae al backoff y se reintenta.
          } else if (isApiError(err) && err.status >= 500) {
            // 5xx (p. ej. fallo de BD al validar la sesión desde E4): no es
            // sesión inválida; cae al backoff y se reintenta.
          } else if (!esErrorDeRed(err)) {
            // Respuesta HTTP de error no relacionada con la sesión.
            setUser(null);
            setLoading(false);
            return;
          }

          if (attempt < INTENTOS_RED - 1) await esperar(1000 * (attempt + 1));
        }
      }

      // Se agotaron los reintentos por red/5xx: no se expulsa al usuario a login.
      if (!cancelado) {
        setError('No pudimos verificar tu sesión por un problema de conexión. Intenta de nuevo.');
        setLoading(false);
      }
    };

    inicializar();

    return () => {
      cancelado = true;
    };
  }, [renovarSesion, cerrarSesionPorMotivo]);

  // F8c: al volver a la pestaña se revalida la sesión para que una pestaña en
  // segundo plano no espere a la siguiente acción para enterarse de que la
  // revocaron. Pasa por fetchWithAuth (Web Lock, sin refresh ante
  // SESSION_REVOKED); un fallo de red o 5xx no cierra la sesión.
  const haySesion = user !== null;
  useEffect(() => {
    if (!haySesion) return;
    let ultimaRevalidacion = Date.now();

    const alCambiarVisibilidad = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - ultimaRevalidacion < INTERVALO_REVALIDACION_MS) return;
      ultimaRevalidacion = Date.now();
      apiGet(fetchWithAuth, '/api/auth/me').catch(() => {
        // Los cierres por SESSION_REVOKED / ACCOUNT_RESTRICTED ya los aplicó
        // fetchWithAuth; cualquier otro error se ignora.
      });
    };

    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => document.removeEventListener('visibilitychange', alCambiarVisibilidad);
  }, [haySesion, fetchWithAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        clearError,
        motivoCierreSesion,
        clearMotivoCierreSesion,
        login,
        logout,
        fetchWithAuth,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
