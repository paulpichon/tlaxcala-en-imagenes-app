const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export type FetchFunction = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response>;

export const ApiErrorCode = {
  // Errores HTTP estándar
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // Rate limiters específicos
  LOGIN_BLOCKED: 'LOGIN_BLOCKED',
  RECOVERY_BLOCKED: 'RECOVERY_BLOCKED',
  EMAIL_BLOCKED: 'EMAIL_BLOCKED',
  REGISTER_BLOCKED: 'REGISTER_BLOCKED',
  POSTEO_BLOCKED: 'POSTEO_BLOCKED',
  SOPORTE_BLOCKED: 'SOPORTE_BLOCKED',
  READ_BLOCKED: 'READ_BLOCKED',
  COMENTARIO_BLOCKED: 'COMENTARIO_BLOCKED',
  REFRESH_BLOCKED: 'REFRESH_BLOCKED',

  // Otros
  FILE_ERROR: 'FILE_ERROR',
  INVALID_JSON: 'INVALID_JSON',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export interface ApiErrorData {
  code?: ApiErrorCode | string;
  msg?: string;
  detail?: string;
  error?: string;
  message?: string;
  status?: number;
  title?: string;
  type?: string;
  instance?: string;
  trace_id?: string;
  retry_after?: number;
  errors?: Array<{ field: string; code: string; message: string }>;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  data: ApiErrorData;

  constructor(status: number, data: ApiErrorData) {
    super(String(data.detail ?? data.error ?? data.message ?? 'Error desconocido'));
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function getApiErrorCode(err: unknown): string | undefined {
  return isApiError(err) ? err.data?.code : undefined;
}

export function isApiErrorCode(err: unknown, code: string): boolean {
  return getApiErrorCode(err) === code;
}

export function isNotFound(err: unknown): boolean {
  return isApiErrorCode(err, ApiErrorCode.NOT_FOUND);
}

export function isUnauthorized(err: unknown): boolean {
  return isApiErrorCode(err, ApiErrorCode.UNAUTHORIZED);
}

export function isForbidden(err: unknown): boolean {
  return isApiErrorCode(err, ApiErrorCode.FORBIDDEN);
}

export function isAuthError(err: unknown): boolean {
  const code = getApiErrorCode(err);
  return code === ApiErrorCode.UNAUTHORIZED || code === ApiErrorCode.FORBIDDEN;
}

export function isValidationFailed(err: unknown): boolean {
  return isApiErrorCode(err, ApiErrorCode.VALIDATION_FAILED);
}

export function isRateLimit(err: unknown): boolean {
  const code = getApiErrorCode(err);
  if (!code) return false;
  return code === ApiErrorCode.RATE_LIMIT_EXCEEDED || code.endsWith('_BLOCKED');
}

export function getApiErrorMessage(
  err: unknown,
  fallback = 'Ocurrió un error inesperado. Intenta de nuevo.'
): string {
  if (isApiError(err)) {
    return String(err.data.detail ?? err.data.message ?? err.data.error ?? fallback);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export type Operacion =
  | 'comentar'
  | 'eliminar_comentario'
  | 'crear_posteo'
  | 'editar_posteo'
  | 'eliminar_posteo'
  | 'like'
  | 'follow'
  | 'favorito'
  | 'cargar_publicaciones'
  | 'cargar_comentarios'
  | 'cargar_notificaciones'
  | 'cargar_perfil'
  | 'cargar_seguidores'
  | 'cargar_seguidos'
  | 'actualizar_perfil'
  | 'obtener_ubicacion'
  | 'notificaciones_push'
  | 'recuperar_password'
  | 'restablecer_password'
  | 'registro'
  | 'soporte'
  | 'eliminar_cuenta'
  | 'default';

const MENSAJES_POR_DEFECTO: Record<Operacion, string> = {
  comentar: 'No se pudo publicar el comentario. Intenta de nuevo.',
  eliminar_comentario: 'No se pudo eliminar el comentario. Intenta de nuevo.',
  crear_posteo: 'No se pudo crear la publicación. Intenta de nuevo.',
  editar_posteo: 'No se pudo editar la publicación. Intenta de nuevo.',
  eliminar_posteo: 'No se pudo eliminar la publicación. Intenta de nuevo.',
  like: 'No se pudo guardar el like. Intenta de nuevo.',
  follow: 'No se pudo actualizar el seguimiento. Intenta de nuevo.',
  favorito: 'No se pudo guardar en favoritos. Intenta de nuevo.',
  cargar_publicaciones: 'No se pudieron cargar las publicaciones. Intenta de nuevo.',
  cargar_comentarios: 'No se pudieron cargar los comentarios. Intenta de nuevo.',
  cargar_notificaciones: 'No se pudieron cargar las notificaciones. Intenta de nuevo.',
  cargar_perfil: 'No se pudo cargar el perfil de usuario. Intenta de nuevo.',
  cargar_seguidores: 'No se pudieron cargar los seguidores. Intenta de nuevo.',
  cargar_seguidos: 'No se pudieron cargar los seguidos. Intenta de nuevo.',
  actualizar_perfil: 'No se pudo actualizar el perfil. Intenta de nuevo.',
  obtener_ubicacion: 'No se pudo obtener la ubicación automáticamente.',
  notificaciones_push: 'No se pudieron activar las notificaciones. Intenta de nuevo.',
  recuperar_password: 'No se pudo procesar la solicitud. Intenta de nuevo.',
  restablecer_password: 'No se pudo restablecer la contraseña. Intenta de nuevo.',
  registro: 'No se pudo completar el registro. Intenta de nuevo.',
  soporte: 'No se pudo enviar la solicitud de soporte. Intenta de nuevo.',
  eliminar_cuenta: 'No se pudo eliminar la cuenta. Intenta de nuevo.',
  default: 'Ocurrió un error inesperado. Intenta de nuevo.',
};

export function getUserMessage(err: unknown, operacion: Operacion): string {
  if (isNotFound(err)) {
    return 'El recurso al que intentas acceder ya no existe o fue eliminado.';
  }
  if (isRateLimit(err)) {
    return 'Has hecho demasiadas solicitudes. Espera un momento e intenta de nuevo.';
  }
  if (isApiError(err)) {
    const detail = err.data.detail;
    if (detail) return detail;
  }
  return MENSAJES_POR_DEFECTO[operacion];
}

export function getValidationErrors(
  err: unknown
): Array<{ field: string; message: string }> | undefined {
  if (!isApiError(err)) return undefined;
  const errors = err.data.errors;
  if (!Array.isArray(errors)) return undefined;
  return errors
    .filter((e) => typeof e.field === 'string' && typeof e.message === 'string')
    .map((e) => ({ field: e.field, message: e.message }));
}

export async function handleApiResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new ApiError(res.status, {
      msg: `Respuesta inesperada del servidor (${res.status})`,
    });
  }

  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data as T;
}

export async function apiGet<T>(
  fetchFn: FetchFunction,
  path: string,
  params?: Record<string, string | number | undefined>,
  init?: Omit<RequestInit, 'method'>
): Promise<T> {
  const searchParams = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  const url = path.startsWith('http') ? path : `${apiUrl(path)}${searchParams}`;
  const res = await fetchFn(url, { credentials: 'include', ...init });
  return handleApiResponse<T>(res);
}

export async function apiPost<T>(
  fetchFn: FetchFunction,
  path: string,
  body?: unknown,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<T> {
  const isFormData = body instanceof FormData;
  const res = await fetchFn(apiUrl(path), {
    method: 'POST',
    credentials: 'include',
    ...(isFormData || body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' } }),
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });
  return handleApiResponse<T>(res);
}

export async function apiPut<T>(
  fetchFn: FetchFunction,
  path: string,
  body?: unknown,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<T> {
  const isFormData = body instanceof FormData;
  const res = await fetchFn(apiUrl(path), {
    method: 'PUT',
    credentials: 'include',
    ...(isFormData || body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' } }),
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });
  return handleApiResponse<T>(res);
}

export async function apiPatch<T>(
  fetchFn: FetchFunction,
  path: string,
  body?: unknown,
  init?: Omit<RequestInit, 'method' | 'body'>
): Promise<T> {
  const res = await fetchFn(apiUrl(path), {
    method: 'PATCH',
    credentials: 'include',
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    ...init,
  });
  return handleApiResponse<T>(res);
}

export async function apiDelete<T>(
  fetchFn: FetchFunction,
  path: string,
  init?: Omit<RequestInit, 'method'>
): Promise<T> {
  const res = await fetchFn(apiUrl(path), {
    method: 'DELETE',
    credentials: 'include',
    ...init,
  });
  return handleApiResponse<T>(res);
}
