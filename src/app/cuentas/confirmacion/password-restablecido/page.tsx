// Página de Confirmación de que la contraseña ha sido cambiada con éxito
// Server Component wrapper que permite exportar metadata
// El Client Component contiene la lógica de redirección y validación

import { Metadata } from "next";
import ConfirmacionPasswordRestablecidoClient from "../components/ConfirmacionPasswordRestablecidoClient";
// import ConfirmacionPasswordRestablecidoClient from "./ConfirmacionPasswordRestablecidoClient";

// ✅ Metadata optimizada para SEO
// ⚠️ IMPORTANTE: Esta página NO debe ser indexada porque:
// 1. Es una página de confirmación temporal (solo se ve después de solicitar recuperación)
// 2. No tiene valor SEO (nadie busca "correo enviado restablecer password")
// 3. Es parte de un flujo de recuperación, no contenido independiente
// 4. Requiere contexto previo (haber solicitado restablecimiento)
export const metadata: Metadata = {
  // Título que aparecerá en la pestaña del navegador
  // Usará el template del layout principal: "Email Enviado | TlaxApp"
  title: "Contraseña Restablecida",
  
  // Descripción genérica (no aparecerá en resultados de búsqueda)
  description: "Página de confirmación para que el usuario sepa que ha restablecido su contraseña.",
  
  // Open Graph mínimo (por si alguien comparte accidentalmente)
  openGraph: {
    title: "Contraseña Restablecida | TlaxApp",
    description: "Revisa tu correo para restablecer tu contraseña.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/confirmacion/correo-enviado-restablecer-password`,
    siteName: "TlaxApp",
    type: "website",
  },
  
  // Twitter Card mínimo
  twitter: {
    card: "summary",
    title: "Contraseña Restablecida | TlaxApp",
    description: "Confirmación de contraseña restablecida con éxito",
  },
  
  // Configuración de robots - NIVEL MÁXIMO DE RESTRICCIÓN
  // ⚠️ CRÍTICO: Esta página NO debe ser indexada porque:
  // - Es una página de estado/confirmación temporal
  // - Solo tiene sentido en el contexto del flujo de recuperación
  // - Requiere haber pasado por /password-olvidado primero
  // - No tiene contenido valioso para búsquedas
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
  
  // Metadata adicional de seguridad
  other: {
    'referrer': 'no-referrer', // No enviar referrer
    'googlebot': 'noindex, nofollow, noarchive, nosnippet',
  },
};

/**
 * Server Component wrapper para la página de confirmación de email enviado
 * 
 * Este componente permite:
 * - Exportar metadata para SEO (solo posible en Server Components)
 * - Renderizar el Client Component que contiene la lógica de validación y redirección
 * 
 * Flujo:
 * 1. Usuario solicita recuperación en /password-olvidado
 * 2. Sistema envía email con enlace de restablecimiento
 * 3. Sistema crea token en sessionStorage
 * 4. Sistema redirige a ESTA página
 * 5. Usuario ve confirmación
 * 6. Usuario revisa su email
 * 7. Usuario hace clic en enlace del email
 * 8. Sistema valida token y muestra formulario de nueva contraseña
 */
export default function CorreoEnviadoRestablecerPage() {
  return <ConfirmacionPasswordRestablecidoClient />;
}