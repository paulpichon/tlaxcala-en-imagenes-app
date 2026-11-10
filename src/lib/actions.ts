import { IUsuarioData, ReenviarCorreoResponse, ApiResponse } from "@/types/types";
import {
  apiPost,
  apiGet,
  isApiError,
  isRateLimit,
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
    if (code === ApiErrorCode.INTERNAL_ERROR && data.error === "jwt expired") {
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
    return { valid: res.data?.valid === true, rateLimited: false, mensaje: null };
  } catch (error) {
    if (isRateLimit(error)) {
      return {
        valid: false,
        rateLimited: true,
        mensaje: getUserMessage(error, "restablecer_password"),
      };
    }
    console.error("Error al validar el token:", error);
    return { valid: false, rateLimited: false, mensaje: null };
  }
}
