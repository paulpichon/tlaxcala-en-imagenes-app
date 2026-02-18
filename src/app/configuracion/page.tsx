// Página de Configuración
// Permite al usuario modificar su perfil, privacidad, notificaciones y preferencias de cuenta

// Meta datos NEXTJS
import { Metadata } from "next";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";

// Componentes
import MenuPrincipal from "../components/MenuPrincipal";
import HeaderSuperior from "../components/HeaderSuperior";
import NuevosUsuariosRegistrados from "../components/NuevosUsuariosRegistrados";
import Publicidad from "../components/Publicidad";
import FooterSugerencias from "../components/FooterSugerencias";
import Configuraciones from "../components/Configuraciones";

// ✅ Metadata optimizada para SEO
// Nota: Esta página NO debe ser indexada por buscadores porque:
// 1. Requiere autenticación
// 2. Contiene información privada del usuario
// 3. No aporta valor en resultados de búsqueda
export const metadata: Metadata = {
  // Título que aparecerá en la pestaña del navegador
  // Usará el template del layout principal: "Configuración | TlaxApp"
  title: "Configuración",
  
  // Descripción para navegadores (no aparecerá en resultados de búsqueda por robots: index false)
  description: "Gestiona tu cuenta de TlaxApp. Configura tu perfil, privacidad, notificaciones y preferencias personales.",
  
  // Keywords relacionadas (aunque no serán indexadas, ayudan a la estructura semántica)
  keywords: [
    "configuración TlaxApp",
    "ajustes de cuenta",
    "privacidad",
    "preferencias usuario",
    "editar perfil",
  ],
  
  // Open Graph para compartir en redes sociales (si alguien comparte la URL)
  openGraph: {
    title: "Configuración | TlaxApp",
    description: "Personaliza tu experiencia en TlaxApp. Ajusta tu perfil, privacidad y notificaciones.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-image.png", // Imagen específica para configuración
        width: 1200,
        height: 630,
        alt: "Configuración - TlaxApp",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Configuración | TlaxApp",
    description: "Gestiona tu cuenta y preferencias en TlaxApp.",
    images: ["/assets/og-image.png"],
  },
  
  // URL canónica para evitar contenido duplicado
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion`,
  },
  
  // Configuración de robots
  // ⚠️ CRÍTICO: Esta página NO debe ser indexada porque:
  // - Requiere autenticación obligatoria
  // - Contiene información privada del usuario
  // - No tiene valor SEO en resultados de búsqueda
  robots: {
    index: false, // No indexar en ningún buscador
    follow: true, // Seguir enlaces dentro de la página
    noarchive: true, // No guardar en caché de buscadores
    nosnippet: true, // No mostrar fragmentos en resultados
    googleBot: {
      index: false, // No indexar específicamente en Google
      follow: true, // Seguir enlaces
      noarchive: true, // No guardar en Google Cache
      nosnippet: true, // No mostrar vista previa
    },
  },
  
  // Metadata adicional para apps móviles
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    // Evitar que los buscadores muestren esta página en sus resultados
    'googlebot': 'noindex, nofollow, noarchive, nosnippet',
  },
};

/**
 * Componente principal de la página de Configuración
 * Server Component con datos estructurados JSON-LD
 * Permite a los usuarios gestionar:
 * - Información del perfil (nombre, foto, bio)
 * - Configuración de privacidad
 * - Preferencias de notificaciones
 * - Gestión de cuenta (cambio de contraseña, eliminar cuenta)
 */
export default function ConfiguracionPage() {
  // Schema.org JSON-LD para datos estructurados
  // Define la estructura semántica de la página para buscadores
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Configuración - TlaxApp',
    description: 'Panel de configuración de cuenta para usuarios de TlaxApp',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'TlaxApp',
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
    // Indica que esta página es un formulario de configuración
    mainEntity: {
      '@type': 'Action',
      name: 'Configurar Cuenta',
      description: 'Gestionar configuración de cuenta de usuario',
      // Requiere que el usuario esté autenticado
      actionStatus: 'https://schema.org/PotentialActionStatus',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
    },
    // Indica que requiere autenticación
    accessMode: 'textual',
    accessModeSufficient: 'textual',
    // Esta página no es pública
    isAccessibleForFree: false,
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
            
            {/* Contenedor del contenido principal - Panel de configuración */}
            <div className="contenedor_contenido_principal">
              {/* Componente de configuraciones (perfil, privacidad, notificaciones, cuenta) */}
              <Configuraciones />
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