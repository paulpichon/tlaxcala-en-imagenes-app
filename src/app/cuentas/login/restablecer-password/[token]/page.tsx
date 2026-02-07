// Página para restablecer la contraseña con token
// Esta página procesa enlaces únicos enviados por email para cambio de contraseña
// El token en la URL valida que el usuario tiene derecho a cambiar su contraseña

// Meta datos NEXTJS
import { Metadata } from "next";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Estilos de página
import restaPasssword from "@/app/ui/cuentas/login/restablecer-password/RestablecerPassword.module.css";
// Componentes
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterMain from "@/app/components/FooterMain";
import FormularioNuevaPassword from "../components/Formulario";
// Importar la función para validar el token
import { validarTokenRestablecerPassword } from "@/lib/actions";
import Link from "next/link";

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
 * 4. Esta página valida el token con la API
 * 5. Si token válido: muestra formulario de nueva contraseña
 * 6. Si token inválido/expirado: muestra mensaje de error y link para solicitar nuevo
 * 7. Usuario ingresa nueva contraseña
 * 8. Sistema actualiza contraseña y redirige a login
 * 
 * Seguridad:
 * - Token de un solo uso (se invalida después de usarse)
 * - Expiración temporal (típicamente 1-24 horas)
 * - Validación en servidor antes de mostrar formulario
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

  // Función para verificar el token en el servidor
  // La función validarTokenRestablecerPassword hace petición a la API
  // para validar si el token que está en la URL es válido o no
  // Verifica: token existe, no ha expirado, no ha sido usado
  const res = await validarTokenRestablecerPassword(token);
  
  // Respuesta de la API con información del token
  const data = await res.json();
  
  // Verificar si la respuesta es exitosa y si el data.valid es válido
  // tokenValido será true solo si:
  // - La petición HTTP fue exitosa (res.ok = true)
  // - El token es válido según la API (data.valid = true)
  const tokenValido = res.ok && data.valid;

  return (
    <div className="container-fluid container-xl">
      <div className="row justify-content-center contenedor_principal">
        
        {/* Header principal para visitantes */}
        <HeaderPrincipalTei />

        {/* Contenedor principal del formulario o mensaje de error */}
        <div className="col-sm-9 col-md-7 col-lg-6">
          
          {/* Renderizado condicional según validez del token */}
          {tokenValido ? (
            // ✅ Token válido: Mostrar formulario de nueva contraseña
            <div className={`${restaPasssword.contenedor_formulario}`}>
              
              {/* Títulos y descripción */}
              <div className={`${restaPasssword.contenedor_titulos}`}>
                <h1 className={`${restaPasssword.subtitulo_h3}`}>
                  Restablecer contraseña
                </h1>
                <div className={restaPasssword.icono} role="img" aria-label="Candado">
                  🔒
                </div>
                <p className={restaPasssword.texto}>
                  Elige una nueva contraseña segura para tu cuenta.
                </p>
              </div>

              {/* 
                Formulario para restablecer la contraseña
                
                Props:
                - token: Token de validación extraído de la URL
                
                Funcionamiento:
                - Se le pasa el token como prop al formulario
                - El formulario hace petición a la API para restablecer la contraseña
                - El formulario valida el token y el nuevo password
                - El formulario muestra los errores si los hay
                - El formulario redirige al usuario a /login si todo sale bien
                
                Validaciones típicas:
                - Contraseña mínimo 8 caracteres
                - Contraseña y confirmación deben coincidir
                - Token debe ser válido (verificado previamente)
              */}
              <FormularioNuevaPassword token={token} />
              
            </div>
          ) : (
            // ❌ Token inválido o expirado: Mostrar mensaje de error
            <div className="text-center mt-5">
              <h2>Este enlace ya no es válido</h2>
              <p className="text-muted mt-3">
                Por seguridad, los enlaces para cambiar contraseña solo 
                funcionan por tiempo limitado y se invalidan después de usarse.
              </p>
              
              {/* Botón para solicitar un nuevo enlace */}
              <Link 
                className="btn btn-primary mt-3" 
                href="/cuentas/login/password-olvidado"
                aria-label="Solicitar nuevo enlace para restablecer contraseña"
              >
                Solicitar nuevo enlace
              </Link>
              
              {/* Enlace alternativo a login */}
              <p className="mt-3">
                <Link 
                  className="text-decoration-none text-secondary" 
                  href="/cuentas/login"
                  aria-label="Volver a iniciar sesión"
                >
                  ← Volver a iniciar sesión
                </Link>
              </p>
            </div>
          )}
          
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