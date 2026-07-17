export type ErrorCode =
  | "VALIDATION_FAILED"
  | "CONFLICT"
  | "EARLY_ACCESS_BLOCKED"
  | "INTERNAL_ERROR";

export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: ErrorCode;
  trace_id: string;
  errors: FieldError[];
}

export interface ApiSuccessResponse {
  ok: true;
  contacto: string;
  msg: string;
}

export type ApiResult<T = ApiSuccessResponse> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorResponse };
