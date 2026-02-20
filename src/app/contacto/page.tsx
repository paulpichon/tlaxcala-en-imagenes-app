// Página de Contacto
// Página pública que proporciona información de contacto y canales de comunicación
// Accesible sin autenticación para usuarios y visitantes

// Meta datos NEXTJS
import { Metadata } from "next";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Estilos (reutilizamos el mismo módulo de páginas legales)
import contacto from "@/app/ui/legal/PrivacidadTerminosCondiciones.module.css";
// Componentes
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterMain from "@/app/components/FooterMain";
import Link from "next/link";

// ✅ Metadata optimizada para SEO
// Esta página ES PÚBLICA y DEBE ser indexada
export const metadata: Metadata = {
  // Título usando el template del layout principal: "Contacto | TlaxApp"
  title: "Contacto",
  
  // Descripción optimizada para SEO (155-160 caracteres)
  description: "¿Tienes preguntas sobre TlaxApp? Contáctanos. Atendemos dudas, reportes técnicos, solicitudes de cuenta y ejercicio de derechos ARCO. Respuesta en 3-5 días hábiles.",
  
  // Keywords relevantes para búsqueda
  keywords: [
    "contacto TlaxApp",
    "soporte TlaxApp",
    "contactar TlaxApp Tlaxcala",
    "ayuda TlaxApp",
    "atención al cliente",
    "reportar problema TlaxApp",
    "soporte técnico red social",
    "ARCO TlaxApp",
    "servicio al cliente Tlaxcala",
    "email contacto TlaxApp",
  ],
  
  // Información del autor
  authors: [{ name: "TlaxApp" }],
  
  // Open Graph para redes sociales
  openGraph: {
    title: "Contacto | TlaxApp",
    description: "¿Necesitas ayuda con TlaxApp? Contáctanos para dudas, reportes técnicos o ejercicio de derechos ARCO. Respuesta en 3-5 días hábiles.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/contacto`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-image.png", // Imagen específica de contacto
        width: 1200,
        height: 630,
        alt: "Contacto TlaxApp - Soporte y Atención al Cliente",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Contacto | TlaxApp",
    description: "¿Necesitas ayuda con TlaxApp? Contáctanos para soporte técnico, dudas o reportes.",
    images: ["/assets/og-image.png"],
  },
  
  // URL canónica
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/contacto`,
  },
  
  // ✅ IMPORTANTE: Esta página SÍ debe ser indexada (es pública)
  robots: {
    index: true, // ✅ Indexar en buscadores
    follow: true, // ✅ Seguir enlaces
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1, // Permitir fragmentos largos
      'max-image-preview': 'large', // Permitir vista previa de imágenes grandes
      'max-video-preview': -1, // Permitir vista previa de videos
    },
  },
  
  // Metadata adicional
  other: {
    'contact-email': 'contacto@tlaxapp.com', // Metadato personalizado
  },
};

/**
 * Componente principal de la página de Contacto
 * 
 * Proporciona información sobre:
 * - Canales de contacto disponibles (email, formulario)
 * - Tipos de solicitudes que se pueden hacer
 * - Tiempos de respuesta estimados (3-5 días hábiles)
 * - Ejercicio de derechos ARCO
 * - Uso responsable del canal de contacto
 * 
 * Esta es una página PÚBLICA que debe ser indexada por buscadores
 * para que las personas puedan encontrar cómo contactarnos.
 */
export default function Contacto() {
  // Schema.org JSON-LD para datos estructurados
  // Ayuda a Google a entender que esta es una página de contacto
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contacto - TlaxApp',
    description: 'Página de contacto de TlaxApp con información sobre canales de comunicación y soporte al cliente',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/contacto`,
    
    // Información de la organización
    mainEntity: {
      '@type': 'Organization',
      name: 'TlaxApp',
      alternateName: 'TlaxApp - Red Social de Tlaxcala',
      url: process.env.NEXT_PUBLIC_BASE_URL,
      logo: `${process.env.NEXT_PUBLIC_BASE_URL}/assets/logo.png`,
      
      // Información de contacto estructurada
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '', // Agregar cuando esté disponible
          contactType: 'customer support',
          email: 'contacto@tlaxapp.com', // ← Reemplaza con tu email real
          areaServed: 'MX',
          availableLanguage: ['Spanish', 'es'],
          contactOption: 'TollFree',
          // Horario de atención (agregar cuando esté definido)
          // hoursAvailable: {
          //   '@type': 'OpeningHoursSpecification',
          //   dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          //   opens: '09:00',
          //   closes: '18:00',
          // },
        },
      ],
      
      // Redes sociales (descomentar y agregar cuando estén disponibles)
      sameAs: [
        // 'https://facebook.com/tlaxapp',
        // 'https://instagram.com/tlaxapp',
        // 'https://twitter.com/tlaxapp',
        // 'https://www.linkedin.com/company/tlaxapp',
      ],
      
      // Ubicación (si tienes oficina física)
      // address: {
      //   '@type': 'PostalAddress',
      //   addressLocality: 'Tlaxcala',
      //   addressRegion: 'Tlaxcala',
      //   addressCountry: 'MX',
      // },
    },
    
    // Breadcrumb para navegación
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: process.env.NEXT_PUBLIC_BASE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Contacto',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/contacto`,
        },
      ],
    },
    
    // FAQs comunes sobre contacto (opcional pero útil para SEO)
    mainEntityOfPage: {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Cómo puedo contactar a TlaxApp?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Puedes contactarnos a través de nuestro formulario de contacto en la plataforma o enviando un correo electrónico a contacto@tlaxapp.com',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cuánto tiempo tarda la respuesta?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Generalmente respondemos en un plazo de 3 a 5 días hábiles. Las solicitudes de derechos ARCO pueden tomar hasta 20 días hábiles.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué tipo de consultas puedo hacer?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Puedes contactarnos para dudas generales, reportes técnicos, solicitudes de cuenta, ejercicio de derechos ARCO, reportes de contenido inapropiado y sugerencias.',
          },
        },
      ],
    },
    
    // Indica que es una página pública
    isAccessibleForFree: true,
    inLanguage: 'es-MX',
  };

  return (
    <>
      {/* JSON-LD para datos estructurados de Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-fluid container-xl">
        <div className="row justify-content-center contenedor_principal">
          
          {/* Header principal para visitantes */}
          <HeaderPrincipalTei />

          {/* Contenedor principal del contenido */}
          <div className="col-sm-12 col-md-10 col-lg-8">
            <div className={contacto.contenedor_formulario}>
              
              {/* Encabezado con título y fecha de actualización */}
              <div className={contacto.contenedor_titulos}>
                <h1 className={contacto.titulo}>Contacto</h1>
                <p className={contacto.fecha}>
                  Última actualización: <strong>Enero 2026</strong>
                </p>
              </div>

              {/* Contenido principal */}
              <div className={contacto.contenido}>
                
                {/* Introducción */}
                <p>
                  En <strong>TlaxApp</strong> valoramos la comunicación con
                  nuestra comunidad. Si tienes dudas, comentarios o necesitas
                  apoyo relacionado con el uso de la Plataforma, puedes ponerte
                  en contacto con nosotros a través de los siguientes medios.
                </p>

                {/* Sección: Tipos de consultas */}
                <h2>¿Para qué puedo contactarlos?</h2>
                <ul>
                  <li>
                    <strong>Dudas generales</strong> sobre el funcionamiento de la
                    Plataforma
                  </li>
                  <li>
                    <strong>Reportes de errores</strong> o fallos técnicos
                  </li>
                  <li>
                    <strong>Solicitudes relacionadas con tu cuenta</strong>{" "}
                    (recuperación, cambios, etc.)
                  </li>
                  <li>
                    <strong>Ejercicio de derechos ARCO</strong> (Acceso,
                    Rectificación, Cancelación, Oposición de datos personales)
                  </li>
                  <li>
                    <strong>Reportes de contenido</strong> o conductas inapropiadas
                  </li>
                  <li>
                    <strong>Comentarios o sugerencias</strong> para mejorar TlaxApp
                  </li>
                  <li>
                    <strong>Consultas sobre privacidad</strong> y protección de datos
                  </li>
                </ul>

                {/* Sección: Canales de contacto */}
                <h2>Medios de contacto disponibles</h2>
                <ul>
                  <li>
                    <strong>Formulario de contacto:</strong> Disponible dentro de
                    la Plataforma (requiere iniciar sesión)
                  </li>
                  <li>
                    <strong>Correo electrónico:</strong>{" "}
                    <a 
                      href="mailto:contacto@tlaxapp.com"
                      className="text-primary"
                      aria-label="Enviar correo a TlaxApp"
                    >
                      contacto@tlaxapp.com
                    </a>
                    {/* ☝️ Reemplazar con el email real cuando esté disponible */}
                  </li>
                  {/* 
                    Opcional: Descomentar cuando estén disponibles
                    
                  <li>
                    <strong>WhatsApp:</strong>{" "}
                    <a 
                      href="https://wa.me/522461234567" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary"
                    >
                      +52 246 123 4567
                    </a>
                  </li>
                  <li>
                    <strong>Redes sociales:</strong> Síguenos en{" "}
                    <a href="https://facebook.com/tlaxapp" target="_blank" rel="noopener noreferrer">Facebook</a>,{" "}
                    <a href="https://instagram.com/tlaxapp" target="_blank" rel="noopener noreferrer">Instagram</a> y{" "}
                    <a href="https://twitter.com/tlaxapp" target="_blank" rel="noopener noreferrer">Twitter</a>
                    {" "}(las respuestas en redes sociales no son inmediatas)
                  </li>
                  */}
                </ul>
                
                <p className="text-muted small">
                  <em>
                    Nota: Para una atención más rápida y personalizada, te
                    recomendamos usar el correo electrónico o el formulario de
                    contacto.
                  </em>
                </p>

                {/* Sección: Tiempos de respuesta */}
                <h2>Tiempos de respuesta</h2>
                <p>
                  Nos esforzamos por atender todas las solicitudes en un plazo
                  razonable. El tiempo de respuesta puede variar dependiendo del
                  tipo de solicitud:
                </p>
                <ul>
                  <li>
                    <strong>Consultas generales:</strong> 3 a 5 días hábiles
                  </li>
                  <li>
                    <strong>Reportes técnicos urgentes:</strong> 1 a 2 días hábiles
                  </li>
                  <li>
                    <strong>Solicitudes ARCO:</strong> Hasta 20 días hábiles
                    (conforme a la Ley Federal de Protección de Datos Personales)
                  </li>
                </ul>
                <p className="alert alert-info" role="alert">
                  💡 <strong>Tip:</strong> Para agilizar tu solicitud, incluye
                  todos los detalles relevantes en tu primer mensaje (capturas de
                  pantalla, descripción del problema, pasos para reproducirlo,
                  etc.).
                </p>

                {/* Sección: Horarios de atención (opcional) */}
                <h2>Horario de atención</h2>
                <p>
                  Nuestro equipo de soporte revisa los mensajes de{" "}
                  <strong>lunes a viernes de 9:00 AM a 6:00 PM</strong> (horario
                  del centro de México). Los mensajes recibidos fuera de este
                  horario serán atendidos el siguiente día hábil.
                </p>
                {/* 
                  ☝️ Ajusta estos horarios según tu disponibilidad real
                  Si no tienes horarios definidos, puedes eliminar esta sección
                */}

                {/* Sección: Uso responsable */}
                <h2>Uso responsable del canal de contacto</h2>
                <p>
                  El canal de contacto debe utilizarse de forma respetuosa y
                  adecuada. <strong>No se atenderán</strong> mensajes ofensivos,
                  spam o que no estén relacionados con el uso de la Plataforma.
                </p>
                <p>
                  Te recordamos que toda comunicación debe realizarse con respeto
                  y profesionalismo. Nos reservamos el derecho de no responder a
                  solicitudes que no cumplan con estas condiciones o que violen
                  nuestros{" "}
                  <Link href="/legal/terminos-y-condiciones" className="text-primary">
                    Términos y Condiciones
                  </Link>
                  .
                </p>

                {/* Sección: Preguntas frecuentes */}
                <h2>¿No encontraste lo que buscabas?</h2>
                <p>
                  Antes de contactarnos, te recomendamos revisar nuestra sección
                  de{" "}
                  <Link href="/legal/preguntas-frecuentes" className="text-primary">
                    Preguntas Frecuentes (FAQ)
                  </Link>{" "}
                  donde podrás encontrar respuestas a las dudas más comunes sobre:
                </p>
                <ul>
                  <li>Cómo crear y configurar tu cuenta</li>
                  <li>Cómo publicar fotos y compartir contenido</li>
                  <li>Cómo reportar contenido inapropiado</li>
                  <li>Cómo cambiar tu contraseña</li>
                  <li>Políticas de privacidad y uso de datos</li>
                </ul>
                {/* 
                  ☝️ Si no tienes página de FAQ, puedes eliminar esta sección
                  o crear una página /ayuda con preguntas frecuentes
                */}

                {/* Sección: Información adicional */}
                <h2>Información importante sobre tu solicitud</h2>
                <div className="alert alert-warning" role="alert">
                  <strong>⚠️ Protección de datos:</strong> Nunca te solicitaremos
                  tu contraseña por correo electrónico o cualquier otro medio. Si
                  recibes un mensaje sospechoso, repórtalo inmediatamente.
                </div>
                
                <p>
                  Al contactarnos, aceptas que procesemos la información que nos
                  proporciones de acuerdo con nuestra{" "}
                  <Link href="/legal/politica-de-privacidad" className="text-primary">
                    Política de Privacidad
                  </Link>
                  . Tus datos personales serán utilizados exclusivamente para
                  atender tu solicitud y mejorar nuestros servicios.
                </p>

              </div>
              {/* Fin contenido */}

            </div>
            {/* Fin contenedor_formulario */}
          </div>
          {/* Fin columna principal */}

          {/* Botón para volver al inicio */}
          <div className="text-center mt-4 mb-5">
            <Link 
              href="/" 
              className="btn btn-outline-secondary btn-sm"
              aria-label="Volver a la página de inicio"
            >
              ← Volver al inicio
            </Link>
          </div>

          {/* Footer principal */}
          <FooterMain />
          
        </div>
        {/* Fin row contenedor_principal */}
      </div>
      {/* Fin container */}
    </>
  );
}