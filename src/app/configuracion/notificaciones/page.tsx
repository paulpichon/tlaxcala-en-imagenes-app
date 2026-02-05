// Página de Configuración de Notificaciones
// Permite al usuario personalizar las preferencias de notificaciones:
// - Notificaciones push, email y en la app
// - Tipos de notificaciones (likes, comentarios, seguidores, mensajes, etc.)
// - Frecuencia y horarios de notificaciones

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
import ConfiguracionNotificaciones from "@/app/components/configuracion/notificaciones/ConfiguracionNotificaciones";
import NuevosUsuariosRegistrados from "../../components/NuevosUsuariosRegistrados";

// ✅ Metadata optimizada para SEO
// Nota: Esta página NO debe ser indexada por buscadores porque:
// 1. Requiere autenticación obligatoria
// 2. Contiene configuración personal de notificaciones del usuario
// 3. Es una página de ajustes internos sin valor para búsquedas públicas
// 4. Configuración específica de cada usuario (no contenido público)
export const metadata: Metadata = {
  // Título que aparecerá en la pestaña del navegador
  // Usará el template del layout principal: "Notificaciones | TlaxApp"
  title: "Notificaciones",
  
  // Descripción para navegadores (no aparecerá en resultados de búsqueda por robots: index false)
  description: "Configura tus preferencias de notificaciones en TlaxApp. Controla cuándo y cómo quieres recibir alertas de likes, comentarios, nuevos seguidores y mensajes.",
  
  // Keywords relacionadas (aunque no serán indexadas, ayudan a la estructura semántica)
  keywords: [
    "configurar notificaciones TlaxApp",
    "ajustes de notificaciones",
    "alertas push",
    "notificaciones email",
    "preferencias de avisos",
    "gestión de notificaciones",
  ],
  
  // Open Graph para compartir en redes sociales (si alguien comparte la URL)
  openGraph: {
    title: "Configuración de Notificaciones | TlaxApp",
    description: "Personaliza cómo y cuándo recibes notificaciones en TlaxApp.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/notificaciones`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-configuracion.png", // Reutilizar imagen de configuración
        width: 1200,
        height: 630,
        alt: "Configuración de Notificaciones - TlaxApp",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Configuración de Notificaciones | TlaxApp",
    description: "Controla tus preferencias de notificaciones.",
    images: ["/assets/og-configuracion.png"],
  },
  
  // URL canónica para evitar contenido duplicado
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/notificaciones`,
  },
  
  // Configuración de robots
  // ⚠️ IMPORTANTE: Esta página NO debe ser indexada porque:
  // - Requiere autenticación obligatoria
  // - Contiene configuración personal de notificaciones
  // - Es una página de ajustes internos sin valor SEO
  // - No debe aparecer en resultados de búsqueda
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
 * Componente principal de la página de Configuración de Notificaciones
 * Server Component con datos estructurados JSON-LD
 * 
 * Funcionalidad:
 * - Configurar notificaciones push (móvil/web)
 * - Configurar notificaciones por email
 * - Configurar notificaciones en la app
 * - Seleccionar tipos de notificaciones:
 *   · Likes en publicaciones
 *   · Comentarios en publicaciones
 *   · Nuevos seguidores
 *   · Menciones
 *   · Mensajes directos
 *   · Publicaciones de personas que sigues
 * - Configurar frecuencia (inmediato, resumen diario, resumen semanal)
 * - Configurar horarios de No Molestar
 * - Silenciar notificaciones temporalmente
 */
export default function ConfiguracionNotificacionesPage() {
  // Schema.org JSON-LD para datos estructurados
  // Define la estructura semántica de la página para buscadores
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Configuración de Notificaciones - TlaxApp',
    description: 'Panel de configuración de preferencias de notificaciones para usuarios de TlaxApp',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/notificaciones`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'TlaxApp',
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
    // Indica que esta página es un formulario de configuración
    mainEntity: {
      '@type': 'Action',
      name: 'Configurar Preferencias de Notificaciones',
      description: 'Gestionar configuración de notificaciones push, email y en la app',
      // Requiere que el usuario esté autenticado
      actionStatus: 'https://schema.org/PotentialActionStatus',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/notificaciones`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      // Opciones disponibles
      object: {
        '@type': 'Thing',
        name: 'Preferencias de Notificación',
        description: 'Controles para likes, comentarios, seguidores, mensajes y más',
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
            
            {/* Contenedor del contenido principal - Panel de configuración de notificaciones */}
            <div className="contenedor_contenido_principal">
              {/* 
                Componente de configuración de notificaciones
                
                Permite al usuario controlar:
                - Notificaciones Push (navegador/móvil)
                - Notificaciones por Email
                - Notificaciones en la App
                
                Tipos de notificaciones configurables:
                - Likes en mis publicaciones
                - Comentarios en mis publicaciones
                - Nuevos seguidores
                - Menciones (@usuario)
                - Mensajes directos
                - Publicaciones de personas que sigo
                - Sugerencias de personas para seguir
                
                Opciones avanzadas:
                - Frecuencia (inmediato, resumen diario, semanal)
                - Horarios de No Molestar
                - Silenciar temporalmente (1h, 8h, 1 semana)
                - Notificaciones solo de amigos cercanos
              */}
              <ConfiguracionNotificaciones />
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