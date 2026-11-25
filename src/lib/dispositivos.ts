import { apiPost, type FetchFunction } from "@/lib/apiClient";

/**
 * Utilidades para la lista de dispositivos con notificaciones push
 * (`GET /api/notificaciones/estado`, Fase 7 del backend).
 */

/**
 * SHA-256 hexadecimal en minúsculas del `endpoint` de la suscripción push.
 * Es el valor que el backend devuelve como `dispositivos[].endpointHash`.
 * Devuelve `null` si `crypto.subtle` no está disponible (contexto no seguro).
 */
export async function hashEndpoint(endpoint: string): Promise<string | null> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return null;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

/** Convierte un `User-Agent` en algo legible, p. ej. «Safari en iPhone». */
export function describirUserAgent(ua: string | null | undefined): {
  nombre: string;
  movil: boolean;
} {
  if (!ua) return { nombre: "Dispositivo desconocido", movil: false };

  const navegador = /Edg(e|A|iOS)?\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
    ? "Opera"
    : /SamsungBrowser/.test(ua)
    ? "Samsung Internet"
    : /Firefox\/|FxiOS\//.test(ua)
    ? "Firefox"
    : /Chrome\/|CriOS\//.test(ua)
    ? "Chrome"
    : /Safari\//.test(ua)
    ? "Safari"
    : null;

  const sistema = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
    ? "iPad"
    : /Android/.test(ua)
    ? "Android"
    : /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X|Macintosh/.test(ua)
    ? "Mac"
    : /CrOS/.test(ua)
    ? "ChromeOS"
    : /Linux/.test(ua)
    ? "Linux"
    : null;

  const movil = sistema === "iPhone" || sistema === "iPad" || sistema === "Android";

  if (navegador && sistema) return { nombre: `${navegador} en ${sistema}`, movil };
  return { nombre: navegador ?? sistema ?? "Dispositivo desconocido", movil };
}

/** Tope para la baja del push al cerrar sesión: nunca debe retrasar el logout. */
const TIMEOUT_BAJA_PUSH_MS = 3000;

/**
 * Da de baja la suscripción push de ESTE navegador al cerrar sesión, para que
 * el dispositivo deje de recibir los avisos de la cuenta que salió (privacidad
 * en dispositivos compartidos). Llamar ANTES de `POST /api/auth/logout`,
 * mientras la sesión sigue siendo válida, para que el backend pueda quitar el
 * endpoint de la cuenta. Si el aviso al backend falla (p. ej. sesión ya
 * revocada), la baja en el navegador basta: el endpoint queda muerto y el
 * backend lo borra al recibir 404/410 en el siguiente envío.
 *
 * Best-effort: nunca lanza y como mucho espera `TIMEOUT_BAJA_PUSH_MS`.
 */
export async function darDeBajaPushDelDispositivo(fetchFn: FetchFunction): Promise<void> {
  const baja = async () => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    // `getRegistration` (no `ready`): `ready` no resuelve nunca si no hay SW.
    const registro = await navigator.serviceWorker.getRegistration();
    const suscripcion = await registro?.pushManager?.getSubscription();
    if (!suscripcion) return;

    await apiPost(fetchFn, "/api/notificaciones/unsubscribe", {
      endpoint: suscripcion.endpoint,
    }).catch(() => {});
    await suscripcion.unsubscribe().catch(() => {});
  };

  try {
    await Promise.race([
      baja(),
      new Promise<void>((resolver) => setTimeout(resolver, TIMEOUT_BAJA_PUSH_MS)),
    ]);
  } catch {
    // Best-effort: el logout sigue aunque falle la baja del push.
  }
}
