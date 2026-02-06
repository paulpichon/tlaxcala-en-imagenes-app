// Página de Política de Privacidad
// Página pública que detalla cómo TlaxApp recopila, usa y protege los datos personales
// Cumple con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)

// Meta datos NEXTJS
import { Metadata } from "next";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Estilos de página
import politica from "@/app/ui/legal/PrivacidadTerminosCondiciones.module.css";
// Componentes
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterMain from "@/app/components/FooterMain";
import Link from "next/link";

// ✅ Metadata optimizada para SEO
// Esta página ES PÚBLICA y DEBE ser indexada (requisito legal)
export const metadata: Metadata = {
  // Título usando el template del layout principal: "Política de Privacidad | TlaxApp"
  title: "Política de Privacidad",
  
  // Descripción optimizada para SEO (155-160 caracteres)
  description: "Consulta la Política de Privacidad de TlaxApp. Conoce cómo protegemos tus datos personales conforme a la LFPDPPP. Derechos ARCO, cookies y seguridad de información.",
  
  // Keywords relevantes para búsqueda legal
  keywords: [
    "política de privacidad TlaxApp",
    "protección de datos TlaxApp",
    "privacidad datos personales",
    "LFPDPPP",
    "derechos ARCO",
    "aviso de privacidad México",
    "cookies TlaxApp",
    "seguridad datos personales",
    "política privacidad red social",
    "tratamiento datos personales",
  ],
  
  // Información del autor
  authors: [{ name: "TlaxApp" }],
  
  // Open Graph para redes sociales
  openGraph: {
    title: "Política de Privacidad | TlaxApp",
    description: "Conoce cómo TlaxApp protege y trata tus datos personales conforme a la legislación mexicana (LFPDPPP).",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/legal/politica-de-privacidad`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-legal.png", // Imagen genérica para páginas legales
        width: 1200,
        height: 630,
        alt: "Política de Privacidad - TlaxApp",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Twitter Card
  twitter: {
    card: "summary",
    title: "Política de Privacidad | TlaxApp",
    description: "Consulta nuestra política de privacidad y protección de datos personales.",
    images: ["/assets/og-legal.png"],
  },
  
  // URL canónica
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/legal/politica-de-privacidad`,
  },
  
  // ✅ IMPORTANTE: Esta página SÍ debe ser indexada (requisito legal y transparencia)
  robots: {
    index: true, // ✅ Indexar en buscadores
    follow: true, // ✅ Seguir enlaces
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1, // Permitir fragmentos largos para contenido legal
      'max-image-preview': 'large',
    },
  },
  
  // Metadata adicional para documentos legales
  other: {
    'document-type': 'legal',
    'last-modified': '2026-01',
    'language': 'es-MX',
  },
};

/**
 * Componente principal de la página de Política de Privacidad
 * 
 * Documento legal que describe:
 * - Responsable del tratamiento de datos personales
 * - Tipos de datos recopilados (identificación, uso, ubicación opcional)
 * - Finalidades del tratamiento (primarias y secundarias)
 * - Uso de cookies y tecnologías similares
 * - Política de transferencias de datos
 * - Derechos ARCO del usuario
 * - Proceso de eliminación de cuenta
 * - Medidas de seguridad implementadas
 * - Política de cambios y actualizaciones
 * 
 * Esta página debe ser PÚBLICA y accesible sin autenticación
 * Es un requisito legal tener esta información disponible
 */
export default function PoliticaDePrivacidad() {
  // Schema.org JSON-LD para datos estructurados
  // Identifica este documento como una página de política de privacidad
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Política de Privacidad - TlaxApp',
    description: 'Política de Privacidad de TlaxApp conforme a la LFPDPPP',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/legal/politica-de-privacidad`,
    inLanguage: 'es-MX',
    
    // Información del documento legal
    mainEntity: {
      '@type': 'Article',
      headline: 'Política de Privacidad de TlaxApp',
      datePublished: '2026-01-01',
      dateModified: '2026-01-01',
      author: {
        '@type': 'Organization',
        name: 'TlaxApp',
        url: process.env.NEXT_PUBLIC_BASE_URL,
      },
      publisher: {
        '@type': 'Organization',
        name: 'TlaxApp',
        logo: {
          '@type': 'ImageObject',
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/assets/logo.png`,
        },
      },
      // Indica que es un documento legal
      genre: 'Legal Document',
      about: {
        '@type': 'Thing',
        name: 'Protección de Datos Personales',
        description: 'Política de privacidad conforme a la LFPDPPP',
      },
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
          name: 'Legal',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/legal`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Política de Privacidad',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/legal/politica-de-privacidad`,
        },
      ],
    },
    
    // Indica que es una página pública y accesible
    isAccessibleForFree: true,
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

          {/* Contenedor principal del contenido legal */}
          <div className="col-sm-12 col-md-10 col-lg-8">
            <div className={politica.contenedor_formulario}>
              
              {/* Encabezado con título y fecha de actualización */}
              <div className={politica.contenedor_titulos}>
                <h1 className={politica.titulo}>Política de Privacidad</h1>
                <p className={politica.fecha}>
                  Última actualización: <strong>Enero 2026</strong>
                </p>
              </div>

              {/* Contenido principal del documento legal */}
              <div className={politica.contenido}>
                
                {/* Introducción */}
                <p>
                  <strong>TlaxApp</strong> (en adelante, "la Plataforma") es una
                  aplicación web de carácter social que permite a los usuarios
                  registrarse, crear perfiles, subir imágenes, interactuar mediante
                  seguidores, likes y comentarios, y compartir contenido
                  relacionado con experiencias, lugares y estilo de vida,
                  principalmente dentro del estado de Tlaxcala, México.
                </p>

                <p>
                  La presente Política de Privacidad se emite en cumplimiento de la{" "}
                  <strong>
                    Ley Federal de Protección de Datos Personales en Posesión de los
                    Particulares (LFPDPPP)
                  </strong>
                  , su Reglamento y demás disposiciones aplicables en los Estados
                  Unidos Mexicanos.
                </p>

                {/* Sección 1: Responsable */}
                <h2>1. Responsable del tratamiento de los datos personales</h2>
                <p>
                  El responsable del tratamiento de los datos personales recabados
                  a través de la Plataforma es{" "}
                  <strong>TlaxApp</strong> (
                  <a 
                    href="mailto:legal@tlaxapp.com"
                    className="text-primary"
                    aria-label="Contacto legal de TlaxApp"
                  >
                    legal@tlaxapp.com
                  </a>
                  ), quien actúa como responsable conforme a la LFPDPPP.
                </p>

                {/* Sección 2: Datos recopilados */}
                <h2>2. Datos personales que se recaban</h2>

                <h3>a) Datos de identificación</h3>
                <ul>
                  <li>Nombre y apellidos</li>
                  <li>Nombre de usuario (URL personalizada)</li>
                  <li>Correo electrónico</li>
                  <li>Imagen de perfil</li>
                </ul>

                <h3>b) Datos de uso y actividad</h3>
                <ul>
                  <li>Publicaciones (imágenes, descripciones y metadatos)</li>
                  <li>Interacciones dentro de la Plataforma (likes, comentarios, seguidores)</li>
                  <li>Historial básico de actividad</li>
                </ul>

                <h3>c) Datos de ubicación (opcionales)</h3>
                <ul>
                  <li>
                    Estado, municipio o ciudad asociados a una publicación, cuando
                    el usuario los proporciona voluntariamente
                  </li>
                </ul>

                <p>
                  TlaxApp <strong>no recaba datos personales sensibles</strong>{" "}
                  conforme a la LFPDPPP (origen racial o étnico, estado de salud,
                  información genética, creencias religiosas, filosóficas y morales,
                  afiliación sindical, opiniones políticas, preferencia sexual).
                </p>

                {/* Sección 3: Finalidades */}
                <h2>3. Finalidades del tratamiento</h2>

                <h3>Finalidades primarias (necesarias para el servicio)</h3>
                <ul>
                  <li>Crear y administrar la cuenta del usuario</li>
                  <li>Permitir la autenticación y seguridad de sesión</li>
                  <li>Mostrar perfiles y contenido generado por usuarios</li>
                  <li>
                    Habilitar funciones sociales (seguir usuarios, dar like, comentar)
                  </li>
                  <li>Gestión de verificación y recuperación de cuenta</li>
                </ul>

                <h3>Finalidades secundarias</h3>
                <ul>
                  <li>Mejorar la experiencia de usuario mediante análisis de uso</li>
                  <li>Análisis interno de uso de la Plataforma</li>
                  <li>
                    Envío de promociones, publicidad o eventos relacionados con el
                    comercio local en Tlaxcala
                  </li>
                </ul>

                {/* Sección 4: Cookies */}
                <h2>4. Cookies y tecnologías similares</h2>
                <p>
                  TlaxApp utiliza cookies y tecnologías similares para:
                </p>
                <ul>
                  <li>Mantener la sesión activa del usuario</li>
                  <li>Garantizar la seguridad de la cuenta</li>
                  <li>Mejorar el funcionamiento general de la Plataforma</li>
                  <li>Recordar preferencias de usuario</li>
                </ul>
                <p>
                  Puedes configurar tu navegador para rechazar cookies, aunque esto
                  puede afectar la funcionalidad de la Plataforma.
                </p>

                {/* Sección 5: Transferencias */}
                <h2>5. Transferencias de datos personales</h2>
                <p>
                  TlaxApp <strong>no vende ni comercializa</strong> datos
                  personales de los usuarios. Los datos personales solo podrán
                  compartirse en los siguientes casos:
                </p>
                <ul>
                  <li>
                    Cuando sea requerido por autoridades competentes conforme a la
                    legislación aplicable
                  </li>
                  <li>
                    Para el funcionamiento técnico del servicio (proveedores de
                    hosting, servicios en la nube)
                  </li>
                  <li>
                    Con el consentimiento expreso del titular de los datos
                  </li>
                </ul>
                <p>
                  En caso de transferencias a terceros, se garantizará que estos
                  mantengan medidas de seguridad adecuadas.
                </p>

                {/* Sección 6: Derechos ARCO */}
                <h2>6. Derechos ARCO</h2>
                <p>
                  Como titular de tus datos personales, tienes derecho a:
                </p>
                <ul>
                  <li>
                    <strong>Acceder</strong> a tus datos personales en posesión de
                    TlaxApp
                  </li>
                  <li>
                    <strong>Rectificar</strong> tus datos cuando sean inexactos o
                    incompletos
                  </li>
                  <li>
                    <strong>Cancelar</strong> tus datos cuando consideres que no se
                    requieren para alguna de las finalidades
                  </li>
                  <li>
                    <strong>Oponerte</strong> al tratamiento de tus datos para
                    fines específicos
                  </li>
                </ul>
                <p>
                  Para ejercer tus derechos ARCO, puedes contactarnos a través de:{" "}
                  <a href="mailto:legal@tlaxapp.com" className="text-primary">
                    legal@tlaxapp.com
                  </a>{" "}
                  o mediante los canales de contacto indicados en{" "}
                  <Link href="/contacto" className="text-primary">
                    nuestra página de contacto
                  </Link>
                  .
                </p>
                <p className="text-muted small">
                  <em>
                    Tiempo de respuesta: Hasta 20 días hábiles conforme a la
                    LFPDPPP.
                  </em>
                </p>

                {/* Sección 7: Eliminación de cuenta */}
                <h2>7. Eliminación de cuenta</h2>
                <p>
                  El usuario podrá solicitar la eliminación de su cuenta en
                  cualquier momento a través de la configuración de su perfil o
                  contactando directamente con nosotros.
                </p>
                <p>
                  Al eliminar tu cuenta:
                </p>
                <ul>
                  <li>
                    Tu perfil, publicaciones y datos asociados serán eliminados
                    permanentemente
                  </li>
                  <li>
                    Cierta información podrá conservarse de forma temporal
                    únicamente para cumplir obligaciones legales (ej: registros de
                    auditoría, prevención de fraude)
                  </li>
                  <li>
                    El proceso de eliminación puede tardar hasta 30 días en
                    completarse
                  </li>
                </ul>
                <p className="alert alert-warning" role="alert">
                  ⚠️ <strong>Importante:</strong> La eliminación de cuenta es
                  irreversible. Una vez procesada, no podrás recuperar tu
                  información.
                </p>

                {/* Sección 8: Seguridad */}
                <h2>8. Seguridad de la información</h2>
                <p>
                  TlaxApp implementa medidas de seguridad administrativas,
                  técnicas y físicas razonables para proteger los datos personales
                  contra:
                </p>
                <ul>
                  <li>Daño, pérdida, alteración o destrucción</li>
                  <li>Acceso, uso o divulgación no autorizados</li>
                  <li>Cualquier otro tratamiento indebido</li>
                </ul>
                <p>
                  Sin embargo, ningún sistema de seguridad es completamente
                  infalible. Te recomendamos:
                </p>
                <ul>
                  <li>Usar contraseñas seguras y únicas</li>
                  <li>No compartir tus credenciales de acceso</li>
                  <li>Cerrar sesión en dispositivos compartidos</li>
                  <li>
                    Reportar cualquier actividad sospechosa inmediatamente
                  </li>
                </ul>

                {/* Sección 9: Cambios */}
                <h2>9. Cambios a la Política de Privacidad</h2>
                <p>
                  Esta Política de Privacidad podrá ser modificada, actualizada o
                  complementada en cualquier momento para:
                </p>
                <ul>
                  <li>Cumplir con cambios en la legislación aplicable</li>
                  <li>Reflejar cambios en nuestras prácticas de tratamiento</li>
                  <li>Mejorar la claridad y transparencia de la información</li>
                </ul>
                <p>
                  Cualquier modificación será publicada en esta misma página con
                  la fecha de "Última actualización" correspondiente. Te
                  recomendamos revisar periódicamente esta política.
                </p>
                <p>
                  Los cambios sustanciales serán notificados a través de la
                  Plataforma o por correo electrónico cuando sea aplicable.
                </p>

                {/* Sección 10: Aceptación */}
                <h2>10. Aceptación de la Política de Privacidad</h2>
                <p>
                  El uso de TlaxApp implica la aceptación expresa de la presente
                  Política de Privacidad. Si no estás de acuerdo con alguno de sus
                  términos, te pedimos no utilizar la Plataforma.
                </p>
                <p>
                  Al crear una cuenta y usar nuestros servicios, manifiestas que:
                </p>
                <ul>
                  <li>Has leído y comprendido esta Política de Privacidad</li>
                  <li>
                    Aceptas el tratamiento de tus datos personales conforme a lo
                    establecido
                  </li>
                  <li>Eres mayor de edad o cuentas con el consentimiento de tus padres o tutores</li>
                </ul>

                {/* Información de contacto adicional */}
                <div className="alert alert-secondary mt-4" role="alert">
                  <h3 className="h6 mb-2">
                    <strong>Contacto para temas de privacidad</strong>
                  </h3>
                  <p className="mb-1">
                    <strong>Email:</strong>{" "}
                    <a href="mailto:legal@tlaxapp.com" className="text-primary">
                      legal@tlaxapp.com
                    </a>
                  </p>
                  <p className="mb-0">
                    <strong>Más información:</strong>{" "}
                    <Link href="/contacto" className="text-primary">
                      Página de contacto
                    </Link>
                  </p>
                </div>

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