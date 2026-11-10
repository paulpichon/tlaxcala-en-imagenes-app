import { IUsuarioData, ReenviarCorreoResponse, ApiResponse } from "@/types/types";
import {
  apiPost,
  apiGet,
  isApiError,
  isApiErrorCode,
  isForbidden,
  isRateLimit,
  isTokenExpired,
  isUnauthorized,
  getUserMessage,
  ApiErrorCode,
  type Operacion,
} from "@/lib/apiClient";

export function createUsuario(formData: IUsuarioData) {
  const { nombre, apellido, correo, password } = formData;
  return apiPost<{
    success: boolean;
    msg?: string;
    data?: { token: string };
    errores?: Array<{ path: string; msg: string }>;
  }>(fetch, "/api/usuarios", {
    nombre_completo: { nombre, apellido },
    correo,
    password,
  });
}

export async function reenviarCorreo(token: string): Promise<ReenviarCorreoResponse> {
  try {
    await apiPost(fetch, "/api/auth/reenviar-correo", { token });

    return {
      mensaje: "Correo reenviado con éxito",
      esExito: true,
      cuentaVerificada: false,
    };
  } catch (error) {
    // Se decide siempre por code, nunca por detail.
    // `cuentaVerificada: true` = estado terminal: el modal oculta el botón de reenvío.

    // 429: FLOOD_BLOCKED, EMAIL_BLOCKED o el cooldown de 5 min (RATE_LIMIT_EXCEEDED).
    if (isRateLimit(error)) {
      return { mensaje: mensajeLimiteReenvio(error, "reenviar_correo"), esExito: false, cuentaVerificada: false };
    }
    // 401 TOKEN_EXPIRED (H6): el token de sesión del registro venció (1 h).
    if (isTokenExpired(error)) {
      return {
        mensaje: "El token ha expirado. Si no te llego el correo, contacta a soporte.",
        esExito: false,
        cuentaVerificada: true,
      };
    }
    // 403 FORBIDDEN: en este endpoint solo lo produce "Cuenta ya verificada".
    if (isForbidden(error)) {
      return {
        mensaje: "Esta cuenta ya ha sido verificada.",
        esExito: false,
        cuentaVerificada: true,
      };
    }
    // 401 UNAUTHORIZED: la cuenta ya no existe o el token es inválido (H6).
    // En ambos casos no hay nada que reenviar.
    if (isUnauthorized(error)) {
      return {
        mensaje: "No pudimos reenviar el correo. Si el problema persiste, contacta a soporte.",
        esExito: false,
        cuentaVerificada: true,
      };
    }
    // Red caída, 5xx, validación…
    return { mensaje: getUserMessage(error, "reenviar_correo"), esExito: false, cuentaVerificada: false };
  }
}

/**
 * Mensaje para un 429 en los reenvíos de correo.
 *
 * - FLOOD_BLOCKED (techo por red): mensaje propio de `getUserMessage`.
 * - Otro 429: se **muestra** el `detail` del backend porque trae el dato útil
 *   ("Espera 3 minutos antes de reenviar el correo", "…intenta de nuevo en 15
 *   minutos"). Solo se muestra; la decisión ya se tomó por code.
 */
function mensajeLimiteReenvio(error: unknown, operacion: Operacion): string {
  if (isApiErrorCode(error, ApiErrorCode.FLOOD_BLOCKED)) {
    return getUserMessage(error, operacion);
  }
  const detail = isApiError(error) ? error.data.detail : undefined;
  return detail || getUserMessage(error, operacion);
}

export async function reenviarCorreoRestablecerPassword(
  token: string
): Promise<ReenviarCorreoResponse> {
  try {
    await apiPost(fetch, "/api/auth/reenviar-correo-restablecer-password", { token });

    return {
      mensaje: "Correo reenviado con éxito",
      esExito: true,
      cuentaVerificada: false,
    };
  } catch (error) {
    // Anti-enumeración (O1): para un token inexistente, vencido o de una cuenta
    // no elegible, el backend responde el mismo 200 genérico. Este endpoint no
    // distingue "correo no existe" / "cuenta no verificada", y el frontend
    // tampoco debe hacerlo. Solo quedan el 429 y el error genérico.
    if (isRateLimit(error)) {
      return {
        mensaje: mensajeLimiteReenvio(error, "reenviar_correo"),
        esExito: false,
        cuentaVerificada: false,
      };
    }
    // Red caída, 5xx, validación…
    return {
      mensaje: getUserMessage(error, "reenviar_correo"),
      esExito: false,
      cuentaVerificada: false,
    };
  }
}

export async function envioCorreoRestablecerPassword(correo: string) {
  return apiPost<ApiResponse<{ token: string }>>(
    fetch,
    "/api/auth/cuentas/password-olvidado",
    { correo }
  );
}

export interface ValidacionTokenReset {
  valid: boolean;
  /** true si el backend respondió 429: el enlace NO se considera inválido. */
  rateLimited: boolean;
  /**
   * true ante fallo de red o 5xx: no se sabe si el enlace es válido, así que
   * tampoco se trata como inválido (no se ofrece "Solicitar nuevo enlace").
   */
  error: boolean;
  /** true ante `401 TOKEN_EXPIRED`: el enlace venció (distinto de "no válido"). */
  expirado: boolean;
  mensaje: string | null;
}

/**
 * Valida el token del enlace de restablecimiento.
 *
 * Debe llamarse desde el navegador (Client Component) para que el backend vea
 * la IP real del usuario y no la del servidor de Next (H5 en el backend).
 *
 * Un 429 no es `valid: false`: si se mostrara "enlace no válido", el usuario
 * pediría uno nuevo y el backend invalidaría el enlace que seguía vigente.
 * Por la misma razón, un fallo de red o un 5xx tampoco lo es (`error: true`).
 *
 * Clasificación (siempre por status/code, nunca por `detail`):
 * - 2xx                         → `valid` según `data.valid`
 * - 429                         → `rateLimited`
 * - 401 TOKEN_EXPIRED           → `expirado` (H6)
 * - otro 4xx (401 UNAUTHORIZED, 400, 403, 404…) → enlace inválido
 * - 5xx / red / no-JSON         → `error`
 *
 * Usa `fetch` directo (no `fetchWithAuth`): estos 401 son del enlace, no de la
 * sesión, y nunca deben disparar `renovarSesion()`.
 */
export async function validarTokenRestablecerPassword(
  token: string
): Promise<ValidacionTokenReset> {
  try {
    const res = await apiGet<ApiResponse<{ valid: boolean }>>(
      fetch,
      `/api/auth/cuentas/restablecer-password/validar-token-reset-password/${token}`,
      undefined,
      { cache: "no-store" }
    );
    return {
      valid: res.data?.valid === true,
      rateLimited: false,
      error: false,
      expirado: false,
      mensaje: null,
    };
  } catch (error) {
    if (isRateLimit(error)) {
      return {
        valid: false,
        rateLimited: true,
        error: false,
        expirado: false,
        mensaje: getUserMessage(error, "restablecer_password"),
      };
    }

    if (isTokenExpired(error)) {
      return { valid: false, rateLimited: false, error: false, expirado: true, mensaje: null };
    }

    if (isApiError(error) && error.status >= 400 && error.status < 500) {
      return { valid: false, rateLimited: false, error: false, expirado: false, mensaje: null };
    }

    // Red caída, 5xx o respuesta no-JSON (p. ej. 502 HTML del proxy).
    console.error("Error al validar el token:", error);
    return {
      valid: false,
      rateLimited: false,
      error: true,
      expirado: false,
      mensaje: "No pudimos comprobar tu enlace. Revisa tu conexión e intenta de nuevo.",
    };
  }
}
