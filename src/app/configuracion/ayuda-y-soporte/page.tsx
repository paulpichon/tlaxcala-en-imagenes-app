// Página de Ayuda y Soporte - Configuración
// Permite al usuario acceder a recursos de ayuda, FAQs, contactar soporte
// y obtener información sobre cómo usar TlaxApp

// Meta datos NEXTJS
import { Metadata } from "next";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Estilos de página
import "../../ui/inicio/inicio.css";
// Componentes
import MenuPrincipal from "@/app/components/MenuPrincipal";
import HeaderSuperior from "@/app/components/HeaderSuperior";
import NuevosUsuariosRegistrados from "@/app/components/NuevosUsuariosRegistrados";
import Publicidad from "@/app/components/Publicidad";
import FooterSugerencias from "@/app/components/FooterSugerencias";
import AyudaSoporte from "@/app/components/configuracion/ayuda-y-soporte/AyudaSoporte";

// ✅ Metadata optimizada para SEO
// Esta página tiene un caso especial:
// - Requiere autenticación PERO tiene valor SEO
// - Los usuarios buscan "ayuda TlaxApp" antes de crear cuenta
// - Decisión: Indexar pero con robots restringidos
export const metadata: Metadata = {
  // Título usando el template del layout principal: "Ayuda y Soporte | TlaxApp"
  title: "Ayuda y Soporte",
  
  // Descripción optimizada para SEO (155-160 caracteres)
  description: "Centro de ayuda de TlaxApp. Encuentra respuestas a preguntas frecuentes, guías de uso, contacto de soporte y recursos para resolver problemas con tu cuenta.",
  
  // Keywords relevantes para búsqueda de ayuda
  keywords: [
    "ayuda TlaxApp",
    "soporte TlaxApp",
    "FAQ TlaxApp",
    "preguntas frecuentes",
    "centro de ayuda",
    "problemas con cuenta",
    "contactar soporte",
    "guía de uso TlaxApp",
    "tutoriales TlaxApp",
    "resolver problemas",
  ],
  
  // Información del autor
  authors: [{ name: "TlaxApp" }],
  
  // Open Graph para redes sociales
  openGraph: {
    title: "Ayuda y Soporte | TlaxApp",
    description: "Centro de ayuda y soporte de TlaxApp. Encuentra respuestas y contacta al equipo de soporte.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/ayuda-y-soporte`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-ayuda.png", // Imagen específica de ayuda
        width: 1200,
        height: 630,
        alt: "Ayuda y Soporte - TlaxApp",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Twitter Card
  twitter: {
    card: "summary",
    title: "Ayuda y Soporte | TlaxApp",
    description: "Centro de ayuda y soporte de TlaxApp.",
    images: ["/assets/og-ayuda.png"],
  },
  
  // URL canónica
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/ayuda-y-soporte`,
  },
  
  // ⚠️ Configuración de robots - Caso especial
  // Esta página requiere autenticación PERO queremos que aparezca en búsquedas
  // porque los usuarios buscan "ayuda TlaxApp" antes de tener cuenta
  // 
  // Estrategia:
  // - index: true (para que aparezca en búsquedas de ayuda)
  // - follow: true (seguir enlaces a contacto, FAQ, etc.)
  // - noarchive: true (no guardar en caché por ser contenido dinámico)
  robots: {
    index: true, // ✅ SÍ indexar (usuarios buscan ayuda antes de registrarse)
    follow: true, // ✅ Seguir enlaces (FAQ, contacto, términos)
    noarchive: true, // No guardar en caché (contenido puede cambiar)
    googleBot: {
      index: true,
      follow: true,
      noarchive: true,
      'max-snippet': -1, // Permitir fragmentos completos (útil para FAQs)
      'max-image-preview': 'large',
    },
  },
  
  // Metadata adicional
  other: {
    'page-type': 'help-center',
  },
};

/**
 * Componente principal de la página de Ayuda y Soporte
 * Server Component con datos estructurados JSON-LD
 * 
 * Funcionalidad típica del componente AyudaSoporte:
 * - Sección de Preguntas Frecuentes (FAQ)
 *   · ¿Cómo crear una cuenta?
 *   · ¿Cómo publicar fotos?
 *   · ¿Cómo seguir a otros usuarios?
 *   · ¿Cómo recuperar mi contraseña?
 *   · ¿Cómo eliminar mi cuenta?
 * 
 * - Guías de Uso
 *   · Tutorial de primeros pasos
 *   · Cómo usar los filtros de búsqueda
 *   · Cómo configurar privacidad
 *   · Cómo reportar contenido inapropiado
 * 
 * - Contacto de Soporte
 *   · Formulario de contacto
 *   · Email de soporte
 *   · Horarios de atención
 *   · Tiempo de respuesta estimado
 * 
 * - Recursos Adicionales
 *   · Términos y Condiciones
 *   · Política de Privacidad
 *   · Normas de la Comunidad
 *   · Reportar un problema
 * 
 * - Categorías de Ayuda
 *   · Cuenta y Perfil
 *   · Publicaciones
 *   · Privacidad y Seguridad
 *   · Problemas Técnicos
 *   · Pagos y Facturación (si aplica)
 * 
 * Esta página SÍ debe ser indexada porque:
 * - Los usuarios buscan "ayuda TlaxApp" incluso sin tener cuenta
 * - Reduce tickets de soporte si encuentran respuestas en FAQs
 * - Mejora experiencia de usuario (encuentran ayuda fácilmente)
 * - Genera confianza (transparencia en soporte)
 */
export default function AyudaSoportePage() {
  // Schema.org JSON-LD para datos estructurados
  // Identifica esta página como centro de ayuda con FAQs
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Ayuda y Soporte - TlaxApp',
    description: 'Centro de ayuda y soporte técnico de TlaxApp',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/ayuda-y-soporte`,
    inLanguage: 'es-MX',
    
    // Información de la página
    mainEntity: {
      '@type': 'FAQPage',
      name: 'Preguntas Frecuentes - TlaxApp',
      description: 'Respuestas a las preguntas más comunes sobre TlaxApp',
      // Lista de preguntas frecuentes (agregar las más comunes)
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Cómo crear una cuenta en TlaxApp?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Para crear una cuenta en TlaxApp, haz clic en "Registrarse", completa el formulario con tu nombre, email y contraseña, y verifica tu correo electrónico.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo publicar fotos en TlaxApp?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Una vez dentro de tu cuenta, haz clic en el botón "+" o "Nueva Publicación", selecciona tu foto, agrega una descripción y ubicación opcional, y presiona "Publicar".',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo recupero mi contraseña?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'En la página de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?", ingresa tu correo electrónico y recibirás instrucciones para restablecerla.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo eliminar mi cuenta?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ve a Configuración > Eliminar Cuenta. Esta acción es permanente e irreversible. Todos tus datos serán eliminados.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo contacto a soporte?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Puedes contactarnos a través del formulario de contacto en esta página, o enviando un correo a soporte@tlaxapp.com. Respondemos en 3-5 días hábiles.',
          },
        },
      ],
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
          name: 'Configuración',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Ayuda y Soporte',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/ayuda-y-soporte`,
        },
      ],
    },
    
    // Información de la organización
    publisher: {
      '@type': 'Organization',
      name: 'TlaxApp',
      url: process.env.NEXT_PUBLIC_BASE_URL,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'soporte@tlaxapp.com',
        areaServed: 'MX',
        availableLanguage: ['Spanish', 'es'],
      },
    },
    
    // Indica que es una página pública (aunque requiere login)
    isAccessibleForFree: false, // Requiere cuenta
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
            
            {/* Contenedor del contenido principal - Centro de Ayuda */}
            <div className="contenedor_contenido_principal">
              {/* 
                Componente AyudaSoporte
                
                Funcionalidad típica:
                - Sección de bienvenida con buscador de ayuda
                - Categorías de ayuda (Cuenta, Publicaciones, Privacidad, Técnico)
                - Preguntas Frecuentes (FAQ) con acordeón expandible
                - Guías paso a paso con capturas de pantalla
                - Formulario de contacto a soporte
                - Información de contacto (email, horarios)
                - Enlaces a recursos adicionales (Términos, Privacidad)
                - Artículos de ayuda organizados por tema
                - Buscador interno de artículos de ayuda
                - Botón de chat en vivo (si está disponible)
                - Valoración de artículos (¿Te fue útil? Sí/No)
                
                Interacciones:
                - Buscar artículo: filtrar por palabra clave
                - Expandir FAQ: ver respuesta completa
                - Enviar formulario: contactar soporte
                - Ver guía: abrir artículo en modal o página
                - Valorar: dar feedback sobre utilidad del artículo
              */}
              <AyudaSoporte />
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