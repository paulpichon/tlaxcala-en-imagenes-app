// Página de Confirmación - Correo Enviado
// Muestra mensaje de éxito después de registrarse
// Informa al usuario que debe verificar su email para activar la cuenta

// Meta datos NEXTJS
import { Metadata } from "next";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Componente
import CorreoEnviado from "../components/CorreoEnviado";

// ✅ Metadata optimizada para SEO
// ⚠️ IMPORTANTE: Esta página NO debe ser indexada porque:
// 1. Es una página de confirmación temporal (solo se ve después de registrarse)
// 2. No tiene valor SEO (nadie busca "correo enviado TlaxApp")
// 3. Es parte de un flujo de registro, no contenido independiente
// 4. Requiere contexto previo (haber completado el registro)
export const metadata: Metadata = {
  // Título que aparecerá en la pestaña del navegador
  // Usará el template del layout principal: "Cuenta Registrada | TlaxApp"
  title: "Cuenta Registrada",
  
  // Descripción genérica (no aparecerá en resultados de búsqueda)
  description: "Tu cuenta ha sido creada exitosamente en TlaxApp. Verifica tu correo electrónico para activar tu cuenta y comenzar a compartir Tlaxcala.",
  
  // Open Graph mínimo (por si alguien comparte accidentalmente)
  openGraph: {
    title: "Cuenta Registrada | TlaxApp",
    description: "Verifica tu correo para activar tu cuenta.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/confirmacion/correo-enviado`,
    siteName: "TlaxApp",
    type: "website",
  },
  
  // Twitter Card mínimo
  twitter: {
    card: "summary",
    title: "Cuenta Registrada | TlaxApp",
    description: "Verifica tu correo para activar tu cuenta.",
  },
  
  // Configuración de robots - NIVEL MÁXIMO DE RESTRICCIÓN
  // ⚠️ CRÍTICO: Esta página NO debe ser indexada porque:
  // - Es una página de estado/confirmación temporal
  // - Solo tiene sentido en el contexto del flujo de registro
  // - No tiene contenido valioso para búsquedas
  // - No debe aparecer en resultados de búsqueda
  robots: {
    index: false, // ❌ NO indexar
    follow: false, // ❌ NO seguir enlaces (máxima restricción)
    noarchive: true, // No guardar en caché
    nosnippet: true, // No mostrar fragmentos
    nocache: true, // No cachear
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
  },
  
  // Metadata adicional
  other: {
    'referrer': 'no-referrer', // No enviar referrer
    'googlebot': 'noindex, nofollow, noarchive, nosnippet',
  },
};

/**
 * Componente principal de la página de Confirmación - Correo Enviado
 * 
 * Flujo de uso:
 * 1. Usuario completa el formulario de registro en /crear-cuenta
 * 2. Sistema crea la cuenta pero la marca como "no verificada"
 * 3. Sistema envía email de verificación con enlace único
 * 4. Sistema redirige a esta página
 * 5. Usuario ve mensaje de confirmación con instrucciones
 * 6. Usuario revisa su email y hace clic en el enlace de verificación
 * 7. Sistema verifica el token y activa la cuenta
 * 8. Usuario puede iniciar sesión
 * 
 * Propósito:
 * - Confirmar que el registro fue exitoso
 * - Informar que se envió un email de verificación
 * - Dar instrucciones sobre qué hacer después
 * - Ofrecer opciones si no recibió el email
 * - Prevenir confusión del usuario
 * 
 * Seguridad:
 * - No revela información sensible
 * - No permite acciones sin verificar email
 * - Tokens de verificación únicos y temporales
 * - Email debe coincidir con el registrado
 * 
 * Esta página NO debe ser indexada por buscadores
 * Es una página de estado temporal en el flujo de registro
 */
export default function CorreoEnviadoPage() {
  // Schema.org JSON-LD para datos estructurados
  // Define esta página como parte del proceso de registro
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Confirmación de Registro - TlaxApp',
    description: 'Página de confirmación después del registro exitoso',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/confirmacion/correo-enviado`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'TlaxApp',
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
    // Breadcrumb para navegación
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
          name: 'Crear Cuenta',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/crear-cuenta`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Confirmación',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/confirmacion/correo-enviado`,
        },
      ],
    },
    // Indica que es parte de un proceso de registro
    mainEntity: {
      '@type': 'Action',
      name: 'Verificación de Email',
      description: 'Proceso de verificación de correo electrónico para activar cuenta',
      actionStatus: 'https://schema.org/PotentialActionStatus',
    },
    // Esta página no es pública ni independiente
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
          {/* 
            Componente CorreoEnviado
            
            Contenido típico que debe mostrar:
            - ✅ Icono de éxito (✓ o sobre de correo)
            - ✅ Título: "¡Cuenta creada exitosamente!"
            - ✅ Mensaje: "Te enviamos un correo de verificación"
            - ✅ Email al que se envió (parcialmente oculto: u***@g***.com)
            - ✅ Instrucciones: "Revisa tu bandeja de entrada y spam"
            - ✅ Botón: "Reenviar correo" (con rate limiting)
            - ✅ Enlace: "Cambiar email" o "Usar otro correo"
            - ✅ Enlace: "Volver al inicio"
            - ✅ Ayuda: "¿No recibiste el correo? Revisa spam"
            - ✅ Tiempo de expiración del enlace (ej: 24 horas)
            
            Interacciones:
            - Reenviar correo: solo permitido después de 5 minutos
            - Cambiar email: volver a formulario de registro
            - Volver al inicio: ir a landing page
            
            Estados:
            - Correo enviado exitosamente (normal)
            - Reenviando correo... (loading)
            - Correo reenviado (success)
            - Error al reenviar (error con retry)
          */}
          <CorreoEnviado />
        </div>
      </div>
    </>
  );
}