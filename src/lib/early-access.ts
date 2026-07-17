import type { ApiResult, ApiErrorResponse } from "./api-errors";

export async function registerEarlyAccess(
  contacto: string,
): Promise<ApiResult> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/early-access`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacto }),
    },
  );

  const data = await res.json();

  if (!res.ok) {
    return {
      ok: false,
      error: data as ApiErrorResponse,
    };
  }

  return {
    ok: true,
    data,
  };
}
