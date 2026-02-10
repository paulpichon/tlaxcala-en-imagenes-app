// Página de Favoritos
// Muestra las publicaciones que el usuario ha guardado como favoritas
// Permite acceso rápido a contenido que el usuario quiere volver a ver

// Meta datos NEXTJS
import { Metadata } from "next";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Estilos de página
import "../ui/inicio/inicio.css";

// ⚠️ IMPORTANTE: viewport NO se define aquí
// El viewport ya está configurado en src/app/layout.tsx (layout raíz)
// Definirlo aquí causaría duplicación y conflictos

// Componentes
import MenuPrincipal from "../components/MenuPrincipal";
import HeaderSuperior from "../components/HeaderSuperior";
import NuevosUsuariosRegistrados from "../components/NuevosUsuariosRegistrados";
import Publicidad from "../components/Publicidad";
import FooterSugerencias from "../components/FooterSugerencias";
import Favoritos from "../components/favoritos/Favoritos";

// ✅ Metadata optimizada para SEO
// Nota: Esta página NO debe ser indexada por buscadores porque:
// 1. Requiere autenticación obligatoria
// 2. Muestra contenido personalizado del usuario (favoritos privados)
// 3. Es una página de gestión personal sin valor para búsquedas públicas
export const metadata: Metadata = {
  // Título que aparecerá en la pestaña del navegador
  // Usará el template del layout principal: "Favoritos | TlaxApp"
  title: "Favoritos",
  
  // Descripción para navegadores (no aparecerá en resultados de búsqueda por robots: index false)
  description: "Accede a tus publicaciones favoritas guardadas en TlaxApp. Revisa fotos de lugares de Tlaxcala que has marcado para volver a ver más tarde.",
  
  // Keywords relacionadas (aunque no serán indexadas, ayudan a la estructura semántica)
  keywords: [
    "favoritos TlaxApp",
    "publicaciones guardadas",
    "mis favoritos Tlaxcala",
    "contenido guardado",
    "fotos favoritas",
  ],
  
  // Open Graph para compartir en redes sociales (si alguien comparte la URL)
  openGraph: {
    title: "Favoritos | TlaxApp",
    description: "Mis publicaciones favoritas guardadas en TlaxApp.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/favoritos`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-inicio.png", // Reutilizar imagen genérica de la app
        width: 1200,
        height: 630,
        alt: "Favoritos - TlaxApp",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Favoritos | TlaxApp",
    description: "Mis publicaciones favoritas guardadas.",
    images: ["/assets/og-inicio.png"],
  },
  
  // URL canónica para evitar contenido duplicado
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/favoritos`,
  },
  
  // Configuración de robots
  // ⚠️ IMPORTANTE: Esta página NO debe ser indexada porque:
  // - Requiere autenticación obligatoria
  // - Muestra contenido personalizado del usuario
  // - Es una página de gestión personal sin valor SEO
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
 * Componente principal de la página de Favoritos
 * Server Component con datos estructurados JSON-LD
 * 
 * Funcionalidad:
 * - Muestra las publicaciones que el usuario ha guardado como favoritas
 * - Permite ver, ordenar y filtrar contenido guardado
 * - Permite eliminar publicaciones de favoritos
 * - Acceso rápido a contenido de interés del usuario
 * 
 * Características:
 * - Lista de publicaciones guardadas con sus imágenes
 * - Información del autor de cada publicación
 * - Fecha en que se guardó como favorito
 * - Botón para eliminar de favoritos
 * - Vista en grid o lista (según preferencia)
 * - Ordenamiento (más recientes, más antiguos, por autor)
 * - Búsqueda dentro de favoritos
 * 
 * Esta página requiere autenticación y NO debe ser indexada
 */
export default function FavoritoPage() {
  // Schema.org JSON-LD para datos estructurados
  // Define la estructura semántica de la página para buscadores
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Favoritos - TlaxApp',
    description: 'Página de publicaciones favoritas guardadas por el usuario',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/favoritos`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'TlaxApp',
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
    // Breadcrumb para navegación
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/inicio`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Favoritos',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/favoritos`,
        },
      ],
    },
    // Indica que esta página es una colección personal
    mainEntity: {
      '@type': 'CollectionPage',
      name: 'Colección de Favoritos',
      description: 'Publicaciones guardadas por el usuario',
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
            
            {/* Contenedor del contenido principal - Publicaciones favoritas */}
            <div className="contenedor_contenido_principal">
              {/* 
                Componente Favoritos
                
                Muestra y gestiona las publicaciones favoritas del usuario:
                - Lista de publicaciones guardadas
                - Imágenes y descripción de cada publicación
                - Información del autor (nombre, foto de perfil)
                - Fecha de la publicación
                - Botón para eliminar de favoritos
                - Navegación a la publicación completa
                - Estado vacío si no hay favoritos guardados
                
                Interacciones:
                - Click en publicación: ver detalles completos
                - Click en autor: ir a su perfil
                - Click en icono corazón: eliminar de favoritos
                - Scroll infinito: cargar más favoritos
              */}
              <Favoritos />
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