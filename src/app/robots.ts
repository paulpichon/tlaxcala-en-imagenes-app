import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tlaxapp.com";

  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/api/",
          "/cuentas/",
          "/cuentas/crear-cuenta",
          "/cuentas/login",
          "/cuentas/login/password-olvidado",
          "/cuentas/confirmacion/correo-enviado",
          "/cuentas/confirmacion/correo-enviado-restablecer-password",
          "/cuentas/confirmacion/password-restablecido",
          "/notificaciones/",
          "/configuracion/",
          "/configuracion/editar-perfil",
          "/configuracion/eliminar-cuenta",
          "/configuracion/notificaciones",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
