'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { UsuarioLogueado, IAuthContext, ApiResponse } from '@/types/types';
import { apiPost, apiGet, isApiError } from '@/lib/apiClient';

const AuthContext = createContext<IAuthContext | undefined>(undefined);

/**
 * Lock compartido entre pestañas del mismo origen (Web Locks API).
 * `/api/auth/refresh` **rota** el refreshToken: si dos pestañas envían el mismo
 * token, el backend lo interpreta como reuso y cierra todas las sesiones.
 */
const LOCK_REFRESH = 'tlaxapp:auth-refresh';

/** Reintentos ante fallos de red (no ante respuestas HTTP de error). */
const INTENTOS_RED = 3;

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
] as const;

/**
 * Resultado de intentar renovar la sesión.
 * - `ok`: cookies rotadas (o ya renovadas por otra pestaña).
 * - `sesion_invalida`: el backend rechazó el refresh (expirado, reuso,
 *   "Sesión comprometida"…). Procede cerrar sesión.
 * - `error`: no hubo respuesta concluyente (red caída, 5xx, 429). La sesión
 *   **no** está invalidada: no se debe expulsar al usuario.
 */
type EstadoRefresh = 'ok' | 'sesion_invalida' | 'error';

interface ResultadoSesion {
  estado: EstadoRefresh;
  /** Respuesta ya válida obtenida al reintentar dentro del lock. */
  response?: Response;
}

const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Un fallo de red no produce `ApiError` (solo las respuestas HTTP lo hacen).
 * Se usa para distinguir "el servidor no contestó" de "el servidor dijo no".
 */
const esErrorDeRed = (err: unknown) => !isApiError(err);

/** Pide un refresh. Distingue el rechazo de sesión de un fallo transitorio. */
async function pedirRefresh(): Promise<EstadoRefresh> {
  try {
    await apiPost(fetch, '/api/auth/refresh');
    return 'ok';
  } catch (err) {
    // 401 = refresh expirado, sin registro o reuso detectado.
    // 403 = token no registrado (firma inválida).
    if (isApiError(err) && (err.status === 401 || err.status === 403)) {
      return 'sesion_invalida';
    }
    return 'error';
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

  /** Respaldo sin Web Locks: un único refresh en vuelo por pestaña. */
  const refreshPromise = useRef<Promise<ResultadoSesion> | null>(null);

  const clearError = useCallback(() => setError(null), []);

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
        return refreshPromise.current.then(({ estado }) => ({ estado }));
      }

      const ejecucion = conLockDeRefresco(async (): Promise<ResultadoSesion> => {
        if (reintentar) {
          const respuesta = await fetchConReintentos(reintentar);
          if (respuesta.status !== 401) return { estado: 'ok', response: respuesta };
        }

        const estado = await pedirRefresh();
        if (estado !== 'ok') return { estado };

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

      const response = await fetchConReintentos(doFetch);
      if (response.status !== 401) return response;

      // 401: se asume access token vencido y se reintenta una sola vez.
      const resultado = await renovarSesion(doFetch);
      if (resultado.response) return resultado.response;

      if (resultado.estado === 'ok') {
        // Otra petición de la misma pestaña/pestaña hermana ya renovó: reintentar.
        return fetchConReintentos(doFetch);
      }

      if (resultado.estado === 'sesion_invalida') {
        setUser(null);
        setError(null);
      } else {
        // Red caída / 5xx / 429: la sesión no está invalidada.
        setError('No pudimos renovar tu sesión por un problema de conexión. Intenta de nuevo.');
      }

      // Se devuelve el 401 original para que la capa superior decida la UI.
      return response;
    },
    [fetchConReintentos, renovarSesion]
  );

  const login = useCallback((user: UsuarioLogueado) => {
    setUser(user);
    setError(null);
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
      // El backend no invalida el access token hasta que expira (H24), así que
      // la limpieza local es la que realmente corta la sesión en el cliente.
    } finally {
      setUser(null);
      setError(null);
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
          if (isApiError(err) && err.status === 401) {
            // Sin sesión o access token vencido: se intenta renovar una vez.
            const resultado = await renovarSesion();
            if (cancelado) return;

            if (resultado.estado === 'ok') {
              try {
                const data = await obtenerMe();
                if (cancelado) return;
                setUser(data.data.usuario);
              } catch {
                if (!cancelado) setUser(null);
              }
              if (!cancelado) setLoading(false);
              return;
            }

            if (resultado.estado === 'sesion_invalida') {
              setUser(null);
              setLoading(false);
              return;
            }
            // Error de red al renovar: cae al backoff y se reintenta.
          } else if (!esErrorDeRed(err)) {
            // Respuesta HTTP de error no relacionada con la sesión.
            if (!cancelado) {
              setUser(null);
              setLoading(false);
            }
            return;
          }

          if (attempt < INTENTOS_RED - 1) await esperar(1000 * (attempt + 1));
        }
      }

      // Se agotaron los reintentos por red: no se expulsa al usuario a login.
      if (!cancelado) {
        setError('No pudimos verificar tu sesión por un problema de conexión. Intenta de nuevo.');
        setLoading(false);
      }
    };

    inicializar();

    return () => {
      cancelado = true;
    };
  }, [renovarSesion]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        clearError,
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
