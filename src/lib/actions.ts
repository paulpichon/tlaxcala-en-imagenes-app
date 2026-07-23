import { IUsuarioData, ReenviarCorreoResponse, ApiResponse } from "@/types/types";
import {
  apiPost,
  apiGet,
  isApiError,
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
    if (code === ApiErrorCode.RATE_LIMIT_EXCEEDED || code === ApiErrorCode.EMAIL_BLOCKED) {
      return { mensaje: detail, esExito: false, cuentaVerificada: false };
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
    if (code === ApiErrorCode.RATE_LIMIT_EXCEEDED || code === ApiErrorCode.RECOVERY_BLOCKED) {
      return { mensaje: detail, esExito: false, cuentaVerificada: false };
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

export async function validarTokenRestablecerPassword(token: string) {
  try {
    return await apiGet<ApiResponse<{ valid: boolean }>>(
      fetch,
      `/api/auth/cuentas/restablecer-password/validar-token-reset-password/${token}`,
      undefined,
      { cache: "no-store" }
    );
  } catch (error) {
    console.error("Error al validar el token:", error);
    return { success: false, data: { valid: false } };
  }
}
