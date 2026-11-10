import { IUsuarioData, ReenviarCorreoResponse, ApiResponse } from "@/types/types";
import {
  apiPost,
  apiGet,
  isApiError,
  isRateLimit,
  isTokenExpired,
  getUserMessage,
  ApiErrorCode,
  ApiError,
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
    if (!isApiError(error)) {
      return { esExito: false, cuentaVerificada: false };
    }

    const { data } = error as ApiError;
    const code = data.code;
    const detail = data.detail;

    if (code === ApiErrorCode.UNAUTHORIZED && detail === "Correo no existe") {
      return {
        mensaje: "El correo no esta asociado a ninguna cuenta.",
        esExito: false,
        cuentaVerificada: true,
      };
    }
    if (code === ApiErrorCode.FORBIDDEN && detail === "Cuenta ya verificada") {
      return {
        mensaje: "Esta cuenta ya ha sido verificada.",
        esExito: false,
        cuentaVerificada: true,
      };
    }
    // 401 TOKEN_EXPIRED (H6): se decide por code, nunca por detail.
    if (isTokenExpired(error)) {
      return {
        mensaje: "El token ha expirado. Si no te llego el correo, contacta a soporte.",
        esExito: false,
        cuentaVerificada: true,
      };
    }
    // Cualquier 429 (EMAIL_BLOCKED, FLOOD_BLOCKED, …): getUserMessage distingue el techo por red.
    if (isRateLimit(error)) {
      return { mensaje: getUserMessage(error, "registro"), esExito: false, cuentaVerificada: false };
    }
    return { esExito: false, cuentaVerificada: false };
  }
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
    if (!isApiError(error)) {
      return { esExito: false, cuentaVerificada: false };
    }

    const { data } = error as ApiError;
    const code = data.code;
    const detail = data.detail;

    if (code === ApiErrorCode.UNAUTHORIZED && detail === "Correo no existe") {
      return {
        mensaje: "El correo no esta asociado a ninguna cuenta.",
        esExito: false,
        cuentaVerificada: true,
      };
    }
    if (code === ApiErrorCode.FORBIDDEN && detail === "Cuenta no verificada") {
      return {
        mensaje: "Esta cuenta no ha sido verificada.",
        esExito: false,
        cuentaVerificada: true,
      };
    }
    if (code === ApiErrorCode.FORBIDDEN && detail === "Cuenta no activada") {
      return {
        mensaje: "Esta cuenta esta desactivada, contactar a soporte.",
        esExito: false,
        cuentaVerificada: true,
      };
    }
    if (code === ApiErrorCode.INTERNAL_ERROR && data.error === "jwt expired") {
      return {
        mensaje: "Reinicia el proceso para restablecer contraseña.",
        esExito: false,
        cuentaVerificada: true,
      };
    }
    // Cualquier 429 (RECOVERY_BLOCKED, FLOOD_BLOCKED, …): getUserMessage distingue el techo por red.
    if (isRateLimit(error)) {
      return {
        mensaje: getUserMessage(error, "recuperar_password"),
        esExito: false,
        cuentaVerificada: false,
      };
    }
    return { esExito: false, cuentaVerificada: false };
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
