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
