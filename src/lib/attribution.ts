/**
 * Captura la atribución de un influencer desde los parámetros de la URL y la
 * envía al backend para que firme una cookie HttpOnly. Fire-and-forget: un
 * fallo aquí no debe afectar el funcionamiento del formulario de acceso
 * anticipado.
 */
export function captureAttributionFromUrl(): void {
  if (typeof window === "undefined") return;

  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return;

    const utmSource = params.get("utm_source") ?? undefined;
    const utmContent = params.get("utm_content") ?? undefined;

    const query = new URLSearchParams();
    query.set("ref", ref);
    if (utmSource) query.set("utm_source", utmSource);
    if (utmContent) query.set("utm_content", utmContent);

    void fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/early-access/atribucion?${query.toString()}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      },
    ).catch(() => {
      // Ignora errores de red y el 429 del limiter (ATRIBUCION_BLOCKED):
      // la atribución es opcional y nunca afecta la landing.
    });
  } catch {
    // La atribución es opcional; no bloqueamos la experiencia por un error de captura.
  }
}
