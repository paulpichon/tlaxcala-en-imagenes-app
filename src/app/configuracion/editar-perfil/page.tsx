// Página de Editar Perfil
// Permite al usuario modificar su información personal: nombre, bio, foto, portada, ubicación, etc.

// Meta datos NEXTJS
import { Metadata } from "next";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Estilos específicos de la página
import "../../ui/configuracion/editar-perfil/editarPerfil.css";

// ⚠️ IMPORTANTE: viewport NO se define aquí
// El viewport ya está configurado en src/app/layout.tsx (layout raíz)
// Definirlo aquí causaría duplicación y conflictos

// Componentes
import MenuPrincipal from "../../components/MenuPrincipal";
import HeaderSuperior from "../../components/HeaderSuperior";
import Publicidad from "../../components/Publicidad";
import FooterSugerencias from "../../components/FooterSugerencias";
import EditarPerfil from "@/app/components/EditarPerfil";
import NuevosUsuariosRegistrados from "../../components/NuevosUsuariosRegistrados";

// ✅ Metadata optimizada para SEO
// Nota: Esta página NO debe ser indexada por buscadores porque:
// 1. Requiere autenticación obligatoria
// 2. Contiene formulario de edición de información privada del usuario
// 3. No aporta valor en resultados de búsqueda
// 4. Es una página de gestión interna de cuenta
export const metadata: Metadata = {
  // Título que aparecerá en la pestaña del navegador
  // Usará el template del layout principal: "Editar Perfil | TlaxApp"
  title: "Editar Perfil",
  
  // Descripción para navegadores (no aparecerá en resultados de búsqueda por robots: index false)
  description: "Edita tu perfil de TlaxApp. Actualiza tu foto, nombre, biografía, ubicación y personaliza cómo te ven otros usuarios de la comunidad.",
  
  // Keywords relacionadas (aunque no serán indexadas, ayudan a la estructura semántica)
  keywords: [
    "editar perfil TlaxApp",
    "actualizar perfil",
    "cambiar foto de perfil",
    "editar biografía",
    "personalizar perfil",
    "configurar cuenta",
  ],
  
  // Open Graph para compartir en redes sociales (si alguien comparte la URL)
  // Aunque poco probable, es buena práctica incluirlo
  openGraph: {
    title: "Editar Perfil | TlaxApp",
    description: "Personaliza tu perfil en TlaxApp. Actualiza tu información y destaca en la comunidad de Tlaxcala.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/editar-perfil`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-image.png", // Imagen específica para edición de perfil
        width: 1200,
        height: 630,
        alt: "Editar Perfil - TlaxApp",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Editar Perfil | TlaxApp",
    description: "Actualiza tu información personal en TlaxApp.",
    images: ["/assets/og-image.png"],
  },
  
  // URL canónica para evitar contenido duplicado
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/editar-perfil`,
  },
  
  // Configuración de robots - NIVEL MÁXIMO DE RESTRICCIÓN
  // ⚠️ CRÍTICO: Esta página NO debe ser indexada porque:
  // - Requiere autenticación obligatoria
  // - Contiene formulario de edición de datos personales del usuario
  // - Información sensible que NO debe aparecer en buscadores
  // - No tiene valor SEO en resultados de búsqueda
  robots: {
    index: false, // No indexar en ningún buscador
    follow: true, // Seguir enlaces dentro de la página
    noarchive: true, // No guardar en caché de buscadores
    nosnippet: true, // No mostrar fragmentos en resultados
    noimageindex: true, // No indexar imágenes de esta página
    googleBot: {
      index: false, // No indexar específicamente en Google
      follow: true, // Seguir enlaces
      noarchive: true, // No guardar en Google Cache
      nosnippet: true, // No mostrar vista previa
      noimageindex: true, // No indexar imágenes en Google Imágenes
    },
  },
  
  // Metadata adicional para apps móviles
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    // Evitar que los buscadores muestren esta página en sus resultados
    'googlebot': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  },
};

/**
 * Componente principal de la página de Editar Perfil
 * Server Component con datos estructurados JSON-LD
 * 
 * Funcionalidad:
 * - Formulario de edición de información personal
 * - Subida de foto de perfil y portada
 * - Edición de nombre, biografía, ubicación
 * - Configuración de redes sociales
 * - Vista previa en tiempo real de cambios
 */
export default function EditarPerfilPage() {
  // Schema.org JSON-LD para datos estructurados
  // Define la estructura semántica de la página para buscadores
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Editar Perfil - TlaxApp',
    description: 'Formulario de edición de perfil de usuario en TlaxApp',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/editar-perfil`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'TlaxApp',
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
    // Indica que esta página es un formulario de edición
    mainEntity: {
      '@type': 'Action',
      name: 'Editar Información de Perfil',
      description: 'Actualizar información personal del usuario',
      // Requiere que el usuario esté autenticado
      actionStatus: 'https://schema.org/PotentialActionStatus',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/editar-perfil`,
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
            
            {/* Contenedor del contenido principal - Formulario de edición de perfil */}
            <div className="contenedor_contenido_principal">
              {/* Componente de edición de perfil (foto, nombre, bio, ubicación, redes sociales) */}
              <EditarPerfil />
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