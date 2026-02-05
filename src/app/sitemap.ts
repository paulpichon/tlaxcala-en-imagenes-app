// Sitemap paginas publicas
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tlaxapp.com';
  try {    
    return [
        {
          url: baseUrl,
          priority: 1,
        },
        {
          url: `${baseUrl}/cuentas/login`,
          priority: 0.6,
        },
        {
          url: `${baseUrl}/cuentas/login/password-olvidado`,
          priority: 0.6,
        },
        {
          url: `${baseUrl}/cuentas/crear-cuenta`,
          priority: 0.6,
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
          url: `${baseUrl}/contacto`,
          priority: 0.3,
        },
    ];
      
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}