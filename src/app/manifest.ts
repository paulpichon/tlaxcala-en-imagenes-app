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
    icons: [
      {
        src: "/assets/icono-tlaxapp-beige.png",
        sizes: "500x500",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
