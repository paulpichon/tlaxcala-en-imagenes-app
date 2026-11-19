import { isApiError } from "@/lib/apiClient";

/** Espera si el 429 no trae `Retry-After` / `RateLimit-Reset` (p. ej. backend anterior al despliegue). */
export const ESPERA_MINIMA_429_MS = 30_000;
/** Tope de la espera que se respeta aunque el servidor indique más. */
export const ESPERA_MAXIMA_429_MS = 15 * 60_000;
/** Distancia mínima entre un fetch previo y el que dispara volver a la pestaña. */
export const INTERVALO_MIN_VISIBILIDAD_MS = 10_000;

/**
 * Milisegundos que el polling debe esperar tras un error 429.
 * Usa la espera del servidor (acotada a `ESPERA_MAXIMA_429_MS`) y, si no viene, `ESPERA_MINIMA_429_MS`.
 */
export function esperaPorRateLimit(err: unknown): number {
  const ms = isApiError(err) ? err.retryAfterMs : undefined;
  if (ms === undefined) return ESPERA_MINIMA_429_MS;
  return Math.min(Math.max(ms, 1_000), ESPERA_MAXIMA_429_MS);
}

/** Varía `ms` ±`porcentaje` para que muchas pestañas no sincronicen sus peticiones. */
export function conJitter(ms: number, porcentaje = 0.1): number {
  const factor = 1 + (Math.random() * 2 - 1) * porcentaje;
  return Math.round(ms * factor);
}
