import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.tlaxapp.com";

  return [
    {
      url: baseUrl,
      priority: 1,
    },
    {
      url: `${baseUrl}/que-es-tlaxapp`,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contacto`,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/politica-de-privacidad`,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/terminos-y-condiciones`,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/preguntas-frecuentes`,
      priority: 0.3,
    },
  ];
}
