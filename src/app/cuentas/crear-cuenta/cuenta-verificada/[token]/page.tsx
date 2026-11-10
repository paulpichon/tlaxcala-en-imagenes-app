// Página Cuenta Verificada
// Procesa el token de verificación de email del usuario
// Muestra éxito o error según la validez del token

// Meta datos NEXTJS
import { Metadata } from "next";
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterPrincipal from "@/app/components/FooterMain";
// La verificación se hace en el navegador (ver VerificacionCuenta): así el
// backend ve la IP real del usuario y no la del servidor de Next (H5).
import VerificacionCuenta from "../../components/VerificacionCuenta";

// ✅ Metadata optimizada para SEO
// ⚠️ IMPORTANTE: Esta página NO debe ser indexada por seguridad
// Razones:
// 1. Contiene tokens de verificación únicos por usuario
// 2. URLs temporales que expiran después de verificar
// 3. Información sensible (proceso de verificación de cuenta)
// 4. Sin valor SEO (nadie busca URLs con tokens de verificación)
export const metadata: Metadata = {
  // Título genérico (no incluye información sensible)
  title: "Cuenta Verificada",
  
  // Descripción genérica
  description: "Cuenta verifica en TlaxApp. Cuuenta verificada para comenzar a compartir y descubrir Tlaxcala.",
  
  // ⚠️ CRÍTICO: Esta página NO debe ser indexada
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
  
  // Open Graph mínimo (por si alguien comparte accidentalmente)
  openGraph: {
    title: "Cuenta Verificada | TlaxApp",
    description: "Cuenta Verificada TlaxApp.",
    type: "website",
  },
  
  // Metadata adicional de seguridad
  other: {
    'referrer': 'no-referrer', // No enviar referrer por seguridad
    'googlebot': 'noindex, nofollow, noarchive, nosnippet',
  },
};

/**
 * Componente principal de la página Cuenta Verificada
 * 
 * Flujo de funcionamiento:
 * 1. Usuario se registra en /crear-cuenta
 * 2. Sistema crea cuenta como "no verificada"
 * 3. Sistema envía email con enlace único: /cuenta-verificada/[token]
 * 4. Usuario hace clic en el enlace del email
 * 5. Esta página valida el token con la API desde el navegador (Client Component)
 * 6. Si token válido: marca cuenta como "verificada" y muestra éxito
 * 7. Si token inválido/expirado: muestra mensaje de error
 * 8. Usuario puede iniciar sesión después de verificar
 * 
 * Seguridad:
 * - Token de un solo uso (se invalida después de usarse)
 * - Expiración temporal (típicamente 24 horas)
 * - Validación en servidor antes de activar cuenta
 * - No indexable por buscadores (robots: noindex)
 * - Token debe coincidir con el email registrado
 * 
 * Estados posibles:
 * - ✅ Cuenta verificada exitosamente
 * - ⏳ Verificando (mientras responde la API)
 * - ❌ Token inválido o expirado
 * - 🚦 Demasiadas solicitudes (429): el enlace sigue siendo válido
 * - ❌ Error de conexión con API
 * 
 * Esta página NO debe ser indexada ni aparecer en resultados de búsqueda
 */
export default async function CuentaVerificadaPage({ 
  params
}: { 
  params: Promise<{ token: string }> 
}) {
  // Extraer el token de verificación de la URL
  // El token es un parámetro dinámico en la ruta: /cuenta-verificada/[token]
  const { token } = await params;

  return (
    <div className="container-fluid container-xl">
      <div className="row justify-content-center contenedor_principal">

        {/* Header principal para visitantes */}
        <HeaderPrincipalTei />

        {/* Contenedor principal: verificando / éxito / límite / inválido / error */}
        <div className="col-sm-9 col-md-7 col-lg-6">
          <VerificacionCuenta token={token} />
        </div>
        {/* Fin columna */}

        {/* Footer principal */}
        <FooterPrincipal />

      </div>
      {/* Fin row */}
    </div>
    // Fin container
  );
}
