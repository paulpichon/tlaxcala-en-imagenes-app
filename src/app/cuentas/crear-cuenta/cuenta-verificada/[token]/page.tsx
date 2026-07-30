// Página Cuenta Verificada
// Procesa el token de verificación de email del usuario
// Muestra éxito o error según la validez del token

// Meta datos NEXTJS
import { Metadata } from "next";
import cuentaVerificada from "../../../../ui/cuentas/crear-cuenta/cuenta-verificada/CuentaVerificada.module.css";
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterPrincipal from "@/app/components/FooterMain";
import Link from "next/link";
import { apiGet, isUnauthorized } from "@/lib/apiClient";

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
 * 5. Esta página valida el token con la API
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
 * - ❌ Token inválido o expirado
 * - ❌ Error de conexión con API
 * 
 * Esta página NO debe ser indexada ni aparecer en resultados de búsqueda
 */
export default async function CuentaVerificadaPage({ 
  params
}: { 
  params: Promise<{ token: string }> 
}) {
  try {
    // Extraer el token de verificación de la URL
    // El token es un parámetro dinámico en la ruta: /cuenta-verificada/[token]
    const { token } = await params;

    // Validar el token con la API de autenticación
    // Esta petición verifica si el token es válido y no ha expirado
    // Si es válido, también marca la cuenta como verificada en la base de datos
    await apiGet(
      fetch,
      `/api/auth/verificar-correo/${token}`,
      undefined,
      { cache: "no-store" }
    );

    return (
      <div className="container-fluid container-xl">
        <div className="row justify-content-center contenedor_principal">
          
          {/* Header principal para visitantes */}
          <HeaderPrincipalTei />

          {/* Contenedor principal del mensaje */}
          <div className="col-sm-9 col-md-7 col-lg-6">
            <div className={cuentaVerificada.contenedor_formulario}>
              
              <div className={cuentaVerificada.contenedor_titulos}>
                <h1>¡Tu cuenta ha sido verificada!</h1>
                <p>
                  Ya puedes iniciar sesión y comenzar a usar TlaxApp para 
                  descubrir y compartir los mejores lugares de Tlaxcala.
                </p>

                <div 
                  className={cuentaVerificada.icono}
                  role="img" 
                  aria-label="Cuenta verificada exitosamente"
                >
                  ✅
                </div>

                <Link
                  href="/cuentas/login"
                  className={cuentaVerificada.boton_login}
                  aria-label="Ir a iniciar sesión"
                >
                  Iniciar sesión
                </Link>

                <p className="text-muted small mt-3">
                  ¡Bienvenido a la comunidad de TlaxApp!
                </p>
              </div>

            </div>
            {/* Fin contenedor_formulario */}
          </div>
          {/* Fin columna */}

          {/* Footer principal */}
          <FooterPrincipal />
          
        </div>
        {/* Fin row */}
      </div>
      // Fin container
    );
  } catch (error) {
    console.error("Error verificando cuenta:", error);

    if (isUnauthorized(error)) {
      return (
        <div className="container-fluid container-xl">
          <div className="row justify-content-center contenedor_principal">
            <HeaderPrincipalTei />

            <div className="col-sm-9 col-md-7 col-lg-6">
              <div className={cuentaVerificada.contenedor_formulario}>
                <div className={cuentaVerificada.contenedor_titulos}>
                  <h2>Este enlace ya no es válido</h2>

                  <p>
                    Por seguridad, los enlaces de verificación tienen un tiempo 
                    limitado y solo pueden usarse una vez.
                  </p>

                  <div className="alert alert-warning mt-3" role="alert">
                    <p className="mb-2"><strong>Posibles causas:</strong></p>
                    <ul className="mb-0 text-start small">
                      <li>El enlace ya fue usado anteriormente</li>
                      <li>Han pasado más de 24 horas desde que se envió</li>
                      <li>El enlace está incompleto o fue modificado</li>
                    </ul>
                  </div>

                  <div className="mt-4">
                    <p className="mb-3">¿Qué puedes hacer?</p>

                    <p className={cuentaVerificada.texto}>
                      <Link 
                        className={cuentaVerificada.link_inciar_sesion} 
                        href="/cuentas/login"
                        aria-label="Intentar iniciar sesión"
                      >
                        Intentar iniciar sesión
                      </Link>
                    </p>

                    <p className="text-muted small">
                      ¿Necesitas un nuevo enlace?{" "}
                      <Link 
                        href="/contacto" 
                        className="text-primary"
                        aria-label="Contactar a soporte"
                      >
                        Contacta a soporte
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <FooterPrincipal />
          </div>
        </div>
      );
    }

    return (
      <div className="container-fluid container-xl">
        <div className="row justify-content-center contenedor_principal">
          <HeaderPrincipalTei />

          <div className="col-sm-9 col-md-7 col-lg-6">
            <div className={cuentaVerificada.contenedor_formulario}>
              <div className={cuentaVerificada.contenedor_titulos}>
                <h2>Error al verificar la cuenta</h2>
                <p>
                  Hubo un problema al procesar tu solicitud. 
                  Por favor, intenta nuevamente más tarde.
                </p>

                <div className="text-center my-4" style={{ fontSize: '4rem' }}>
                  ⚠️
                </div>

                <div className="mt-4">
                  <Link 
                    href="/cuentas/login" 
                    className={cuentaVerificada.boton_login}
                    aria-label="Volver a inicio de sesión"
                  >
                    Volver a inicio de sesión
                  </Link>

                  <p className="text-muted small mt-3">
                    Si el problema persiste,{" "}
                    <Link href="/contacto" className="text-primary">
                      contacta a soporte
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <FooterPrincipal />
        </div>
      </div>
    );
  }
}