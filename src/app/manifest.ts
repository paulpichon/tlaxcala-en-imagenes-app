import type { MetadataRoute } from "next";

/**
 * Web App Manifest.
 *
 * Requisito de Web Push en iOS (16.4+): la app añadida a la pantalla de inicio
 * debe abrirse como web app (`display: standalone`); en una pestaña de Safari
 * `PushManager` no existe.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TlaxApp",
    short_name: "TlaxApp",
    description: "La red social de Tlaxcala.",
    lang: "es-MX",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#EBCA9A",
    // Con 192 y 512 px Chrome/Android ofrece instalar la app y arma su pantalla
    // de arranque con `background_color` + icono. iOS usa `src/lib/pwa.ts`.
    icons: [
      { src: "/assets/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/assets/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/assets/pwa/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
