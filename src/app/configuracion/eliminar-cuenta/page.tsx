// Página de Eliminar Cuenta
// Permite al usuario eliminar permanentemente su cuenta y todos sus datos de TlaxApp
// ⚠️ ACCIÓN IRREVERSIBLE - Requiere confirmación explícita del usuario

// Meta datos NEXTJS
import { Metadata } from "next";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Estilos específicos de la página
import "../../ui/configuracion/editar-perfil/editarPerfil.css";

// Componentes
import MenuPrincipal from "../../components/MenuPrincipal";
import HeaderSuperior from "../../components/HeaderSuperior";
import Publicidad from "../../components/Publicidad";
import FooterSugerencias from "../../components/FooterSugerencias";
import NuevosUsuariosRegistrados from "../../components/NuevosUsuariosRegistrados";
import EliminarCuenta from "@/app/components/EliminarCuenta";

// ✅ Metadata optimizada para SEO
// Nota: Esta página NO debe ser indexada por buscadores porque:
// 1. Requiere autenticación obligatoria
// 2. Contiene formulario de eliminación PERMANENTE de cuenta
// 3. Información extremadamente sensible
// 4. No debe aparecer en resultados de búsqueda bajo ninguna circunstancia
// 5. Es una acción crítica e irreversible
export const metadata: Metadata = {
  // Título que aparecerá en la pestaña del navegador
  // Usará el template del layout principal: "Eliminar Cuenta | TlaxApp"
  title: "Eliminar Cuenta",
  
  // Descripción para navegadores (no aparecerá en resultados de búsqueda por robots: index false)
  description: "Elimina permanentemente tu cuenta de TlaxApp. Esta acción eliminará todos tus datos, publicaciones, seguidores y no se puede deshacer.",
  
  // Keywords relacionadas (aunque no serán indexadas, ayudan a la estructura semántica)
  keywords: [
    "eliminar cuenta TlaxApp",
    "borrar cuenta",
    "cerrar cuenta",
    "eliminar perfil",
    "desactivar cuenta",
    "datos personales",
  ],
  
  // Open Graph para compartir en redes sociales (extremadamente improbable, pero por consistencia)
  openGraph: {
    title: "Eliminar Cuenta | TlaxApp",
    description: "Gestión de eliminación de cuenta en TlaxApp.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/eliminar-cuenta`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-eliminar-cuenta.png", // Imagen genérica de configuración
        width: 1200,
        height: 630,
        alt: "Eliminar Cuenta - TlaxApp",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary",
    title: "Eliminar Cuenta | TlaxApp",
    description: "Gestión de eliminación de cuenta.",
    images: ["/assets/og-eliminar-cuenta.png"],
  },
  
  // URL canónica para evitar contenido duplicado
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/eliminar-cuenta`,
  },
  
  // Configuración de robots - NIVEL MÁXIMO DE RESTRICCIÓN
  // ⚠️ EXTREMADAMENTE CRÍTICO: Esta página NO debe ser indexada porque:
  // - Requiere autenticación obligatoria
  // - Permite eliminar permanentemente la cuenta del usuario
  // - Contiene proceso de confirmación de acción irreversible
  // - Información altamente sensible
  // - NUNCA debe aparecer en resultados de búsqueda
  // - No debe guardarse en caché bajo ninguna circunstancia
  robots: {
    index: false, // No indexar en ningún buscador
    follow: false, // ⚠️ NO seguir enlaces (máxima restricción)
    noarchive: true, // No guardar en caché de buscadores
    nosnippet: true, // No mostrar fragmentos en resultados
    noimageindex: true, // No indexar imágenes de esta página
    nocache: true, // No cachear esta página
    googleBot: {
      index: false, // No indexar específicamente en Google
      follow: false, // ⚠️ NO seguir enlaces
      noarchive: true, // No guardar en Google Cache
      nosnippet: true, // No mostrar vista previa
      noimageindex: true, // No indexar imágenes
    },
  },
  
  // Metadata adicional para apps móviles
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    // Evitar que los buscadores muestren esta página en sus resultados
    'googlebot': 'noindex, nofollow, noarchive, nosnippet, noimageindex, nocache',
    // Directiva adicional para Bing
    'bingbot': 'noindex, nofollow, noarchive, nosnippet',
    // Prevenir captura en Wayback Machine
    'archive': 'noarchive',
  },
};

/**
 * Componente principal de la página de Eliminar Cuenta
 * Server Component con datos estructurados JSON-LD
 * 
 * ⚠️ FUNCIONALIDAD CRÍTICA:
 * - Permite al usuario eliminar PERMANENTEMENTE su cuenta
 * - Elimina todos los datos: publicaciones, fotos, seguidores, mensajes
 * - Proceso irreversible que requiere confirmación explícita
 * - Debe mostrar advertencias claras sobre las consecuencias
 * - Puede requerir re-autenticación por seguridad
 * 
 * Flujo típico:
 * 1. Usuario ve advertencias sobre la eliminación permanente
 * 2. Usuario confirma que entiende las consecuencias
 * 3. Usuario ingresa contraseña para confirmar identidad
 * 4. Usuario confirma eliminación final
 * 5. Cuenta y datos se eliminan permanentemente
 */
export default function EliminarCuentaPage() {
  // Schema.org JSON-LD para datos estructurados
  // Define la estructura semántica de la página para buscadores
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Eliminar Cuenta - TlaxApp',
    description: 'Página de eliminación permanente de cuenta de usuario',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/eliminar-cuenta`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'TlaxApp',
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
    // Indica que esta página es una acción destructiva
    mainEntity: {
      '@type': 'Action',
      name: 'Eliminar Cuenta de Usuario',
      description: 'Proceso de eliminación permanente e irreversible de cuenta',
      // Acción potencial que requiere autenticación
      actionStatus: 'https://schema.org/PotentialActionStatus',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/eliminar-cuenta`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      // Advertencia sobre la naturaleza irreversible
      result: {
        '@type': 'Thing',
        name: 'Eliminación Permanente',
        description: 'La cuenta y todos los datos asociados serán eliminados permanentemente',
      },
    },
    // Indica que requiere autenticación
    accessMode: 'textual',
    accessModeSufficient: 'textual',
    // Esta página no es pública
    isAccessibleForFree: false,
    // Advertencia de contenido sensible
    isFamilyFriendly: true,
    // Nivel de riesgo alto
    typicalAgeRange: '18-',
  };

  return (
    <>
      {/* JSON-LD para datos estructurados de Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Contenedor Principal */}
      <div className="contenedor_principal">
        {/* Row principal con grid de Bootstrap */}
        <div className="row g-0">
          
          {/* Contenedor menu lateral */}
          <div className="col-md-2 col-lg-2 col-xl-2">
            <div className="contenedor_menu_lateral_inferior fixed-bottom">
              {/* Menu principal de navegación */}
              <MenuPrincipal />
            </div>
          </div>
          {/* Fin Contenedor menu */}

          {/* Contenedor Contenido Principal */}
          <div className="col-md-10 col-lg-10 col-xl-6 contenedor_central_contenido">
            
            {/* Contenedor menu superior */}
            <div className="contenedor_menu_superior sticky-top">
              {/* Header Superior con búsqueda y perfil */}
              <HeaderSuperior />
            </div>
            {/* Fin Contenedor menu principal */}
            
            {/* Contenedor del contenido principal - Formulario de eliminación de cuenta */}
            <div className="contenedor_contenido_principal">
              {/* 
                Componente de eliminación de cuenta
                ⚠️ ACCIÓN CRÍTICA E IRREVERSIBLE
                
                Este componente debe:
                - Mostrar advertencias claras sobre la eliminación permanente
                - Explicar qué datos se eliminarán (publicaciones, fotos, seguidores, etc.)
                - Requerir confirmación explícita del usuario
                - Solicitar contraseña para verificar identidad
                - Ofrecer alternativa de desactivación temporal si está disponible
                - Confirmar la eliminación una vez más antes de ejecutar
                - Proporcionar período de gracia si es aplicable (ej: 30 días)
              */}
              <EliminarCuenta />
            </div>
            {/* Fin Contenedor del contenido principal */}
            
          </div>
          {/* Fin Contenedor Contenido Principal */}

          {/* Contenedor publicidad/sugerencias - Solo visible en pantallas XL */}
          <div className="col-xl-4 sugerencias">
            
            {/* Contenedor de contenido lateral */}
            <div className="contenedor_sugerencias sticky-top p-3">
              
              {/* Contenedor de sugerencias */}
              <div className="contenedor_sugerencias_seguir mt-4">
                
                {/* Sección: Nuevos usuarios registrados */}
                <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                  {/* Widget de nuevos usuarios para seguir */}
                  <NuevosUsuariosRegistrados />
                </div>
                
                {/* Sección: Publicidad */}
                <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                  <div className="col-8">
                    {/* Banner publicitario */}
                    <Publicidad />
                  </div>
                </div>
                {/* Fin row publicidad */}

                {/* Sección: Footer con enlaces y información */}
                <div className="row d-flex justify-content-center mt-4">
                  <div className="col-12">
                    <div className="text-center mt-3">
                      {/* Footer del div sugerencias (Términos, Privacidad, Ayuda, etc.) */}
                      <FooterSugerencias />
                    </div>
                  </div>
                </div>
                
              </div>
              {/* Fin contenedor_sugerencias_seguir */}
              
            </div>
            {/* Fin contenedor_sugerencias */}
            
          </div>
          {/* Fin Contenedor publicidad/sugerencias */}
          
        </div>
        {/* Fin Row */}
      </div>
      {/* Fin Contenedor Principal */}
    </>
  );
}