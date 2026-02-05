// Página de Notificaciones
// Muestra las notificaciones del usuario autenticado (likes, comentarios, nuevos seguidores, etc.)

// Meta datos NEXTJS
import { Metadata } from "next";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Estilos de página
import "../ui/inicio/inicio.css";

// Componentes
import MenuPrincipal from "../components/MenuPrincipal";
import HeaderSuperior from "../components/HeaderSuperior";
import Publicidad from "../components/Publicidad";
import FooterSugerencias from "../components/FooterSugerencias";
import Notificaciones from "../components/notifications/Notificaciones";
import NuevosUsuariosRegistrados from "../components/NuevosUsuariosRegistrados";

// ✅ Metadata optimizada para SEO
// Nota: Esta página NO debe ser indexada por buscadores porque requiere autenticación
export const metadata: Metadata = {
  // Título que aparecerá en la pestaña del navegador
  // Usará el template del layout principal: "Notificaciones | TlaxApp"
  title: "Notificaciones",
  
  // Descripción para navegadores (no aparecerá en resultados de búsqueda por robots: index false)
  description: "Mantente al día con tus notificaciones en TlaxApp. Revisa quién te ha seguido, comentado o dado like a tus publicaciones en la comunidad de Tlaxcala.",
  
  // Keywords relacionadas (aunque no serán indexadas, ayudan a la estructura semántica)
  keywords: [
    "notificaciones TlaxApp",
    "alertas Tlaxcala",
    "actividad TlaxApp",
    "nuevos seguidores",
    "interacciones",
  ],
  
  // Open Graph para compartir en redes sociales (si alguien comparte la URL)
  openGraph: {
    title: "Notificaciones | TlaxApp",
    description: "Revisa tus notificaciones y mantente conectado con la comunidad de Tlaxcala.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/notificaciones`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-notificaciones.png", // Imagen específica para notificaciones
        width: 1200,
        height: 630,
        alt: "Notificaciones - TlaxApp",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Notificaciones | TlaxApp",
    description: "Mantente al día con tu actividad en TlaxApp.",
    images: ["/assets/og-notificaciones.png"],
  },
  
  // URL canónica para evitar contenido duplicado
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/notificaciones`,
  },
  
  // Configuración de robots
  // ⚠️ IMPORTANTE: Esta página NO debe ser indexada porque requiere autenticación
  robots: {
    index: false, // No indexar en buscadores
    follow: true, // Seguir enlaces dentro de la página
    googleBot: {
      index: false, // No indexar específicamente en Google
      follow: true, // Seguir enlaces
    },
  },
  
  // Metadata adicional para apps móviles
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

/**
 * Componente principal de la página de Notificaciones
 * Server Component con datos estructurados JSON-LD
 */
export default function NotificacionesPage() {
  // Schema.org JSON-LD para datos estructurados
  // Define la estructura semántica de la página para buscadores
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Notificaciones - TlaxApp',
    description: 'Centro de notificaciones para usuarios de TlaxApp',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/notificaciones`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'TlaxApp',
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
    // Indica que esta página requiere autenticación
    potentialAction: {
      '@type': 'ViewAction',
      target: `${process.env.NEXT_PUBLIC_BASE_URL}/notificaciones`,
      name: 'Ver Notificaciones',
      // Requiere que el usuario esté autenticado
      actionStatus: 'https://schema.org/PotentialActionStatus',
    },
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
            
            {/* Contenedor del contenido principal - Lista de notificaciones */}
            <div className="contenedor_contenido_principal">
              {/* Componente de notificaciones (likes, comentarios, seguidores, etc.) */}
              <Notificaciones />
            </div>
            {/* Fin Contenedor del contenido principal */}
            
          </div>
          {/* Fin Contenedor Contenido Principal */}

          {/* Contenedor publicidad/sugerencias - Solo visible en pantallas XL */}
          <div className="col-xl-4 sugerencias">
            
            {/* Contenedor de contenido lateral */}
            <div className="contenedor_sugerencias sticky-top p-3">
              
              {/* Contenedor de sugerencias para seguir */}
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
                      {/* Footer del div sugerencias (Términos, Privacidad, etc.) */}
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