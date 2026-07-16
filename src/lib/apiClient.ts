const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export type FetchFunction = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response>;

export interface ApiErrorData {
  code?: string;
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
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const searchParams = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  const url = path.startsWith('http') ? path : `${apiUrl(path)}${searchParams}`;
  const res = await fetchFn(url, { credentials: 'include' });
  return handleApiResponse<T>(res);
}

export async function apiPost<T>(
  fetchFn: FetchFunction,
  path: string,
  body?: unknown
): Promise<T> {
  const isFormData = body instanceof FormData;
  const res = await fetchFn(apiUrl(path), {
    method: 'POST',
    credentials: 'include',
    ...(isFormData || body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' } }),
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleApiResponse<T>(res);
}

export async function apiPut<T>(
  fetchFn: FetchFunction,
  path: string,
  body?: unknown
): Promise<T> {
  const isFormData = body instanceof FormData;
  const res = await fetchFn(apiUrl(path), {
    method: 'PUT',
    credentials: 'include',
    ...(isFormData || body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' } }),
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleApiResponse<T>(res);
}

export async function apiPatch<T>(
  fetchFn: FetchFunction,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetchFn(apiUrl(path), {
    method: 'PATCH',
    credentials: 'include',
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  return handleApiResponse<T>(res);
}

export async function apiDelete<T>(
  fetchFn: FetchFunction,
  path: string
): Promise<T> {
  const res = await fetchFn(apiUrl(path), { method: 'DELETE', credentials: 'include' });
  return handleApiResponse<T>(res);
}
