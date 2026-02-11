import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tlaxapp.com";

  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/api/",
          "/posteo/",
          "/configuracion/",
          "/notificaciones/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
