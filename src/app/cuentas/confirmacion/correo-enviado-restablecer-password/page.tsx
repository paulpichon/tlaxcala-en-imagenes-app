// Página de Confirmación - Correo Enviado restablecer contraseña
// Muestra mensaje de éxito después de registrarse
// Informa al usuario que debe verificar su email para activar la cuenta para restablcer la contraseña

// Meta datos NEXTJS
import { Metadata } from "next";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Componente
import CorreoEnviado from "../components/CorreoEnviado";

/**
 * ✅ Metadata optimizada para SEO
 * ⚠️ IMPORTANTE: Esta página NO debe ser indexada porque:
 * 1. Es una página de confirmación temporal tras solicitar cambio de clave.
 * 2. No tiene valor SEO (uso interno del flujo de recuperación).
 * 3. Requiere contexto previo (haber solicitado el restablecimiento).
 */
export const metadata: Metadata = {
  // Título que aparecerá en la pestaña del navegador
  title: "Correo Enviado | Restablecer Contraseña",
  
  description: "Hemos enviado las instrucciones para restablecer tu contraseña a tu correo electrónico.",
  
  // Open Graph mínimo (protección ante compartidos accidentales)
  openGraph: {
    title: "Restablecer Contraseña | TlaxApp",
    description: "Revisa tu correo para continuar con el cambio de contraseña.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/confirmacion/correo-enviado-restablecer-password`,
    siteName: "TlaxApp",
    type: "website",
  },

  // Twitter Card
  twitter: {
    card: "summary",
    title: "Restablecer Contraseña | TlaxApp",
    description: "Revisa tu correo para continuar.",
  },

  // Configuración de robots - NIVEL MÁXIMO DE RESTRICCIÓN
  // ⚠️ CRÍTICO: Esta página NO debe ser indexada porque:
  // - Es una página de estado/confirmación temporal
  // - Solo tiene sentido en el contexto del flujo de registro
  // - No tiene contenido valioso para búsquedas
  // - No debe aparecer en resultados de búsqueda
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
  },

  // Metadata adicional de seguridad y bots
  other: {
    'referrer': 'no-referrer',
    'googlebot': 'noindex, nofollow, noarchive, nosnippet',
  },
};

/**
 * Componente principal: Confirmación de Correo Enviado (Password Reset)
 * * Flujo de uso:
 * 1. Usuario olvida su clave y va a /olvide-mi-password
 * 2. Ingresa su correo y el sistema genera un token temporal
 * 3. Sistema envía email con link de recuperación
 * 4. Sistema redirige a esta página actual
 * 5. Usuario es instruido para revisar su bandeja de entrada
 */
export default function RestablecerPasswordEnviadoPage() {
  
  // Schema.org JSON-LD para datos estructurados
  // Define esta página como parte del proceso de recuperación de acceso
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Confirmación de Restablecimiento - TlaxApp',
    description: 'Página de confirmación de envío de correo para cambio de contraseña',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/confirmacion/correo-enviado-restablecer-password`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'TlaxApp',
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: process.env.NEXT_PUBLIC_BASE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Recuperar Acceso',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/restablecer-password`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Confirmación',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/confirmacion/correo-enviado-restablecer-password`,
        },
      ],
    },
    mainEntity: {
      '@type': 'Action',
      name: 'Restablecimiento de Contraseña',
      description: 'Proceso de recuperación de cuenta mediante correo electrónico',
      actionStatus: 'https://schema.org/PotentialActionStatus',
    },
    isAccessibleForFree: false,
  };

  return (
    <>
      {/* JSON-LD para datos estructurados de Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-fluid container-xl">
        <div className="row justify-content-center contenedor_principal">
          {/* Componente CorreoEnviado
            - Muestra el estado de éxito del envío
            - Provee instrucciones para revisar Spam
            - Permite volver a intentar el envío tras un tiempo de espera
          */}
          <CorreoEnviado />
        </div>
      </div>
    </>
  );
}