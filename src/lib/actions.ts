import { IUsuarioData, ReenviarCorreoResponse } from "@/types/types";
import { apiPost, handleApiResponse, apiUrl } from "@/lib/apiClient";

export function createUsuario(formData: IUsuarioData) {
  const { nombre, apellido, correo, password } = formData;
  return apiPost<{ status: number; token: string; msg?: string; errores?: Array<{ path: string; msg: string }>; data?: { field?: keyof import("@/lib/validaciones").UsuarioSchema; message?: string } }>(
    fetch,
    '/api/usuarios',
    { nombre_completo: { nombre, apellido }, correo, password }
  );
}

export async function reenviarCorreo(token: string): Promise<ReenviarCorreoResponse> {
  try {
    const data = await apiPost<ReenviarCorreoResponse>(fetch, '/api/auth/reenviar-correo', { token });

    return {
      mensaje: "Correo reenviado con éxito",
      esExito: true,
      cuentaVerificada: false,
    };
  } catch (error: any) {
    if (error?.status === 401 && error?.data?.msg === 'Correo no existe') {
      return { mensaje: "El correo no esta asociado a ninguna cuenta.", esExito: false, cuentaVerificada: true };
    }
    if (error?.status === 403 && error?.data?.msg === 'Cuenta ya verificada') {
      return { mensaje: "Esta cuenta ya ha sido verificada.", esExito: false, cuentaVerificada: true };
    }
    if (error?.status === 500 && error?.data?.error === 'jwt expired') {
      return { mensaje: "El token ha expirado. Si no te llego el correo, contacta a soporte.", esExito: false, cuentaVerificada: true };
    }
    if (error?.status === 429) {
      return { mensaje: error?.data?.msg, esExito: false, cuentaVerificada: false };
    }
    return { esExito: false, cuentaVerificada: false };
  }
}

export async function reenviarCorreoRestablecerPassword(token: string): Promise<ReenviarCorreoResponse> {
  try {
    const data = await apiPost<ReenviarCorreoResponse>(fetch, '/api/auth/reenviar-correo-restablecer-password', { token });

    return {
      mensaje: "Correo reenviado con éxito",
      esExito: true,
      cuentaVerificada: false,
    };
  } catch (error: any) {
    if (error?.status === 401 && error?.data?.msg === 'Correo no existe') {
      return { mensaje: "El correo no esta asociado a ninguna cuenta.", esExito: false, cuentaVerificada: true };
    }
    if (error?.status === 403 && error?.data?.msg === 'Cuenta no verificada') {
      return { mensaje: "Esta cuenta no ha sido verificada.", esExito: false, cuentaVerificada: true };
    }
    if (error?.status === 403 && error?.data?.msg === 'Cuenta no activada') {
      return { mensaje: "Esta cuenta esta desactivada, contactar a soporte.", esExito: false, cuentaVerificada: true };
    }
    if (error?.status === 500 && error?.data?.error === 'jwt expired') {
      return { mensaje: "Reinicia el proceso para restablecer contraseña.", esExito: false, cuentaVerificada: true };
    }
    if (error?.status === 429) {
      return { mensaje: error?.data?.msg, esExito: false, cuentaVerificada: false };
    }
    return { esExito: false, cuentaVerificada: false };
  }
}

export async function envioCorreoRestablecerPassword(correo: string) {
  return apiPost<{ status: number; token: string; msg?: string }>(
    fetch,
    '/api/auth/cuentas/password-olvidado',
    { correo }
  );
}

export async function validarTokenRestablecerPassword(token: string) {
  try {
    const respuesta = await fetch(
      apiUrl(`/api/auth/cuentas/restablecer-password/validar-token-reset-password/${token}`),
      { cache: "no-store" }
    );
    return handleApiResponse<{ valid: boolean }>(respuesta);
  } catch (error) {
    console.error("Error al validar el token:", error);
    return { valid: false };
  }
}
