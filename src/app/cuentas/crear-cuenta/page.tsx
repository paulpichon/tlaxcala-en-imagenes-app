/**  
 ******* PÁGINA CREAR CUENTA
 * Permite a nuevos usuarios registrarse en TlaxApp
 * Página pública accesible solo para usuarios NO autenticados
 **/

// Meta datos NEXTJS
import { Metadata } from "next";
// Link nextjs
import Link from "next/link";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Estilos de página
import crearCuenta from "../../ui/cuentas/crear-cuenta/CrearCuenta.module.css";
// Componentes
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import { FormularioRegistro } from "./components/FormularioRegistro";
import FooterMain from "../../components/FooterMain";

// ✅ Metadata optimizada para SEO
// Esta página ES PÚBLICA y DEBE ser indexada para atraer nuevos usuarios
export const metadata: Metadata = {
  // Título usando el template del layout principal: "Crear Cuenta | TlaxApp"
  title: "Crear Cuenta",
  
  // Descripción optimizada para SEO y conversión (155-160 caracteres)
  description: "Únete a TlaxApp gratis. Crea tu cuenta, comparte fotos de Tlaxcala, descubre lugares increíbles y conecta con personas de tu comunidad. Regístrate ahora.",
  
  // Keywords relevantes para búsqueda de registro
  keywords: [
    "crear cuenta TlaxApp",
    "registro TlaxApp",
    "unirse TlaxApp",
    "registrarse TlaxApp",
    "nueva cuenta Tlaxcala",
    "red social Tlaxcala registro",
    "crear perfil TlaxApp",
    "sign up TlaxApp",
    "registro gratuito red social",
    "comunidad Tlaxcala",
  ],
  
  // Información del autor
  authors: [{ name: "TlaxApp" }],
  
  // Open Graph para redes sociales
  openGraph: {
    title: "Únete a TlaxApp | Crea tu Cuenta Gratis",
    description: "Comparte y descubre Tlaxcala en imágenes. Regístrate gratis y forma parte de la comunidad de TlaxApp.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/crear-cuenta`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-signup.png", // Imagen específica para registro
        width: 1200,
        height: 630,
        alt: "Únete a TlaxApp - Registro Gratuito",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Únete a TlaxApp | Crea tu Cuenta Gratis",
    description: "Comparte y descubre Tlaxcala en imágenes. Regístrate ahora.",
    images: ["/assets/og-signup.png"],
  },
  
  // URL canónica
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/crear-cuenta`,
  },
  
  // ✅ IMPORTANTE: Esta página SÍ debe ser indexada (captación de nuevos usuarios)
  robots: {
    index: true, // ✅ Indexar en buscadores
    follow: true, // ✅ Seguir enlaces
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
  
  // Metadata adicional para páginas de registro
  other: {
    'page-type': 'signup',
    'referrer': 'origin-when-cross-origin',
  },
};

/**
 * Componente principal de la página de Crear Cuenta
 * 
 * Funcionalidad:
 * - Formulario de registro con validación
 * - Campos: nombre, email, contraseña, confirmación
 * - Verificación de email
 * - Aceptación de términos y condiciones
 * - Redirección automática si el usuario ya está autenticado
 * 
 * Esta página debe ser PÚBLICA y accesible sin autenticación
 * Es crítica para el crecimiento de la plataforma (adquisición de usuarios)
 */
export default function CrearCuenta() {
  // Schema.org JSON-LD para datos estructurados
  // Identifica esta página como formulario de registro
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Crear Cuenta - TlaxApp',
    description: 'Página de registro para crear una nueva cuenta en TlaxApp',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/crear-cuenta`,
    inLanguage: 'es-MX',
    
    // Indica que es una página de registro
    mainEntity: {
      '@type': 'WebApplication',
      name: 'TlaxApp',
      applicationCategory: 'SocialNetworkingApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'MXN',
      },
      featureList: [
        'Crear perfil personal',
        'Compartir fotos de Tlaxcala',
        'Interactuar con otros usuarios',
        'Descubrir lugares y cultura',
        'Conectar con la comunidad',
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
          item: process.env.NEXT_PUBLIC_BASE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Crear Cuenta',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/crear-cuenta`,
        },
      ],
    },
    
    // Indica que es una página pública y gratuita
    isAccessibleForFree: true,
    
    // Organización responsable
    publisher: {
      '@type': 'Organization',
      name: 'TlaxApp',
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },
    
    // Acción principal de la página
    potentialAction: {
      '@type': 'RegisterAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/crear-cuenta`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      name: 'Crear Cuenta',
    },
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

          {/* Contenedor principal del formulario de registro */}
          <div className="col-sm-9 col-md-7 col-lg-6">
            <div className="text-center">
              
              {/* Títulos y descripción */}
              <div className={`${crearCuenta.contenedor_titulos}`}>
                <h1 className={crearCuenta.subtitulo_h3}>
                  Únete a TlaxApp
                </h1>
                <p className={crearCuenta.descripcion}>
                  Comparte y descubre Tlaxcala en imágenes.
                </p>
              </div>

              {/* 
                FormularioRegistro
                Componente que incluye:
                - Campos de registro (nombre, email, contraseña)
                - Validación de formulario
                - Verificación de email
                - Aceptación de términos y condiciones
                - Manejo de errores y estados de carga
              */}
              <FormularioRegistro />

            </div>
          </div>

          {/* Sección de enlaces adicionales */}
          <div className="cool-md-12 text-center mt-2">
            
            {/* Enlace a iniciar sesión para usuarios existentes */}
            <p className={`${crearCuenta.pregunta}`}>
              ¿Tienes una cuenta?{" "}
              <Link 
                href="/cuentas/login" 
                className={`${crearCuenta.enlace_iniciar_sesion}`}
                aria-label="Iniciar sesión en TlaxApp"
              >
                Entrar
              </Link>
            </p>

            {/* Botón para volver al inicio */}
            <p className="text-center mt-3">
              <Link 
                href="/" 
                className="btn btn-sm"
                aria-label="Volver a la página de inicio"
              >
                ← Volver al inicio
              </Link>
            </p>

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