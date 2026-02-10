// Página Password Olvidado - Server Component wrapper
// Este archivo permite exportar metadata mientras renderiza un Client Component

import { Metadata } from "next";
import PasswordOlvidadaClient from "../components/PasswordOlvidadaClient";

// ✅ Metadata optimizada para SEO
// Esta página ES PÚBLICA y DEBE ser indexada (funcionalidad útil)
export const metadata: Metadata = {
  // Título usando el template del layout principal: "Recuperar Contraseña | TlaxApp"
  title: "Recuperar Contraseña",
  
  // Descripción optimizada para SEO y usuarios (155-160 caracteres)
  description: "¿Olvidaste tu contraseña de TlaxApp? Recupérala fácilmente. Te enviaremos un correo con instrucciones para restablecer tu contraseña de forma segura.",
  
  // Keywords relevantes para búsqueda de recuperación
  keywords: [
    "recuperar contraseña TlaxApp",
    "olvidé mi contraseña TlaxApp",
    "restablecer contraseña TlaxApp",
    "password olvidado TlaxApp",
    "cambiar contraseña TlaxApp",
    "resetear contraseña",
    "recuperar acceso TlaxApp",
    "contraseña perdida",
    "forgot password TlaxApp",
    "ayuda contraseña",
  ],
  
  // Información del autor
  authors: [{ name: "TlaxApp" }],
  
  // Open Graph para redes sociales
  openGraph: {
    title: "Recuperar Contraseña | TlaxApp",
    description: "¿Olvidaste tu contraseña? Recupérala fácilmente. Te enviaremos un correo con instrucciones.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/login/password-olvidado`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-password-recovery.png", // Imagen específica
        width: 1200,
        height: 630,
        alt: "Recuperar Contraseña - TlaxApp",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Twitter Card
  twitter: {
    card: "summary",
    title: "Recuperar Contraseña | TlaxApp",
    description: "¿Olvidaste tu contraseña? Recupérala fácilmente.",
    images: ["/assets/og-password-recovery.png"],
  },
  
  // URL canónica
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/login/password-olvidado`,
  },
  
  // ✅ IMPORTANTE: Esta página SÍ debe ser indexada (funcionalidad útil)
  robots: {
    index: true, // ✅ Indexar en buscadores
    follow: true, // ✅ Seguir enlaces
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
  
  // Metadata adicional
  other: {
    'page-type': 'password-recovery',
  },
};

/**
 * Server Component wrapper para la página de recuperación de contraseña
 * 
 * Este componente permite:
 * - Exportar metadata para SEO (solo posible en Server Components)
 * - Renderizar el Client Component que contiene la lógica interactiva
 * 
 * Patrón recomendado por Next.js para páginas que necesitan:
 * - SEO (metadata)
 * - Interactividad del cliente (hooks, eventos, estados)
 */
export default function PasswordOlvidadaPage() {
  return <PasswordOlvidadaClient />;
}