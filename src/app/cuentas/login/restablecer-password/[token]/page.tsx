// Página para restablecer la contraseña con token
// Esta página procesa enlaces únicos enviados por email para cambio de contraseña
// El token en la URL valida que el usuario tiene derecho a cambiar su contraseña

// Meta datos NEXTJS
import { Metadata } from "next";
// Componentes
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterMain from "@/app/components/FooterMain";
// La validación del token se hace en el navegador (ver ValidarTokenReset):
// así el backend ve la IP real del usuario y no la del servidor de Next (H5).
import ValidarTokenReset from "../components/ValidarTokenReset";

// ✅ Metadata optimizada para SEO
// ⚠️ IMPORTANTE: Esta página NO debe ser indexada por seguridad
export const metadata: Metadata = {
  // Título genérico (no incluye información sensible)
  title: "Restablecer Contraseña",
  
  // Descripción genérica
  description: "Restablece tu contraseña de TlaxApp de forma segura. Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.",
  
  // ⚠️ CRÍTICO: Esta página NO debe ser indexada
  // Razones:
  // 1. Contiene tokens de seguridad únicos por usuario
  // 2. URLs temporales que expiran
  // 3. Información sensible (restablecimiento de contraseña)
  // 4. Sin valor SEO (nadie busca URLs con tokens)
  robots: {
    index: false, // ❌ NO indexar
    follow: false, // ❌ NO seguir enlaces (máxima restricción)
    noarchive: true, // No guardar en caché
    nosnippet: true, // No mostrar fragmentos
    noimageindex: true, // No indexar imágenes
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
    'referrer': 'no-referrer', // No enviar referrer por seguridad
    'googlebot': 'noindex, nofollow, noarchive, nosnippet',
  },
};

/**
 * Componente principal de la página de Restablecer Contraseña
 * 
 * Flujo de funcionamiento:
 * 1. Usuario solicita recuperación de contraseña en /password-olvidado
 * 2. Sistema envía email con enlace único: /login/[token]
 * 3. Usuario hace clic en el enlace del email
 * 4. Esta página valida el token con la API desde el navegador (Client Component)
 * 5. Si token válido: muestra formulario de nueva contraseña
 * 6. Si token inválido/expirado: muestra mensaje de error y link para solicitar nuevo
 * 7. Usuario ingresa nueva contraseña
 * 8. Sistema actualiza contraseña y redirige a login
 * 
 * Seguridad:
 * - Token de un solo uso (se invalida después de usarse)
 * - Expiración temporal (típicamente 1-24 horas)
 * - Validación en el backend (llamada desde el navegador) antes de mostrar formulario
 * - Un 429 muestra "demasiadas solicitudes", nunca "enlace no válido"
 * - No indexable por buscadores (robots: noindex)
 * 
 * Esta página NO debe ser indexada ni aparecer en resultados de búsqueda
 */
export default async function RestablecerPassword({ 
  params
}: { 
  params: Promise<{ token: string }> 
}) {
  // Extraer el token de la URL
  // El token es un parámetro dinámico en la ruta: /login/[token]
  const { token } = await params;

  return (
    <div className="container-fluid container-xl">
      <div className="row justify-content-center contenedor_principal">
        
        {/* Header principal para visitantes */}
        <HeaderPrincipalTei />

        {/* Contenedor principal: validando / formulario / límite / enlace inválido */}
        <div className="col-sm-9 col-md-7 col-lg-6">
          <ValidarTokenReset token={token} />
        </div>
        {/* Fin contenedor principal */}

        {/* Footer principal */}
        <FooterMain />
        
      </div>
      {/* Fin row contenedor_principal */}
    </div>
    // Fin container
  );
}
