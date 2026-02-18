// Página de Iniciar Sesión
// Permite a usuarios existentes acceder a su cuenta en TlaxApp
// Página pública accesible solo para usuarios NO autenticados

// Meta datos NEXTJS
import { Metadata } from "next";
// Link nextjs
import Link from "next/link";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Estilos de página
import login from "../../ui/cuentas/login/login.module.css";
// Componentes
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FormularioLogin from "./components/FormularioLogin";
import FooterMain from "../../components/FooterMain";

// ✅ Metadata optimizada para SEO
// Esta página ES PÚBLICA y DEBE ser indexada (punto de entrada crítico)
export const metadata: Metadata = {
  // Título usando el template del layout principal: "Iniciar Sesión | TlaxApp"
  title: "Iniciar Sesión",
  
  // Descripción optimizada para SEO y usuarios (155-160 caracteres)
  description: "Inicia sesión en TlaxApp. Accede a tu cuenta, comparte fotos de Tlaxcala, descubre lugares increíbles y conecta con tu comunidad. Entra ahora.",
  
  // Keywords relevantes para búsqueda de login
  keywords: [
    "iniciar sesión TlaxApp",
    "login TlaxApp",
    "entrar TlaxApp",
    "acceder TlaxApp",
    "ingresar TlaxApp",
    "mi cuenta TlaxApp",
    "sign in TlaxApp",
    "acceso usuario Tlaxcala",
    "red social Tlaxcala login",
    "entrar a mi cuenta",
  ],
  
  // Información del autor
  authors: [{ name: "TlaxApp" }],
  
  // Open Graph para redes sociales
  openGraph: {
    title: "Iniciar Sesión | TlaxApp",
    description: "Accede a tu cuenta de TlaxApp y sigue descubriendo Tlaxcala.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/login`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-image.png", // Imagen específica para login
        width: 1200,
        height: 630,
        alt: "Iniciar Sesión en TlaxApp",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Iniciar Sesión | TlaxApp",
    description: "Accede a tu cuenta de TlaxApp.",
    images: ["/assets/og-image.png"],
  },
  
  // URL canónica
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/login`,
  },
  
  // ✅ IMPORTANTE: Esta página SÍ debe ser indexada (punto de entrada crítico)
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
  
  // Metadata adicional para páginas de autenticación
  other: {
    'page-type': 'login',
    'referrer': 'origin-when-cross-origin',
  },
};

/**
 * Componente principal de la página de Iniciar Sesión
 * 
 * Funcionalidad:
 * - Formulario de login con email/usuario y contraseña
 * - Validación de credenciales
 * - Manejo de sesiones con cookies/tokens
 * - Enlace a recuperación de contraseña
 * - Redirección automática si el usuario ya está autenticado
 * - Redirección a /inicio después de login exitoso
 * 
 * Seguridad:
 * - Validación de credenciales en servidor
 * - Protección contra fuerza bruta (rate limiting)
 * - Tokens de sesión seguros
 * - HTTPS obligatorio en producción
 * 
 * Esta página debe ser PÚBLICA y accesible sin autenticación
 * Es un punto de entrada crítico para usuarios existentes
 */
export default function IniciarSesion() {
  // Schema.org JSON-LD para datos estructurados
  // Identifica esta página como formulario de inicio de sesión
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Iniciar Sesión - TlaxApp',
    description: 'Página de inicio de sesión para acceder a TlaxApp',
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/login`,
    inLanguage: 'es-MX',
    
    // Indica que es una página de inicio de sesión
    mainEntity: {
      '@type': 'WebApplication',
      name: 'TlaxApp',
      applicationCategory: 'SocialNetworkingApplication',
      operatingSystem: 'Web',
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
          name: 'Iniciar Sesión',
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/login`,
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
      '@type': 'LoginAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_BASE_URL}/cuentas/login`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      name: 'Iniciar Sesión',
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

          {/* Contenedor principal del formulario de login */}
          <div className="col-sm-9 col-md-7 col-lg-6">
            <div className={login.contenedor_formulario}>
              
              {/* Títulos y descripción */}
              <div className={login.contenedor_titulos}>
                <h1 className={login.subtitulo_h3}>
                  Bienvenido de vuelta
                </h1>
                <p className={login.descripcion}>
                  Inicia sesión para seguir descubriendo Tlaxcala.
                </p>
              </div>

              {/* 
                FormularioLogin
                Componente que incluye:
                - Campos de login (email/usuario y contraseña)
                - Validación de formulario
                - Manejo de errores (credenciales incorrectas, cuenta bloqueada, etc.)
                - Estados de carga durante autenticación
                - Redirección a /inicio después de login exitoso
                - Opción de "Recordar sesión" (opcional)
              */}
              <FormularioLogin />

              {/* Enlaces adicionales y navegación */}
              <div className="text-center mt-3">
                {/* Enlace a recuperación de contraseña */}
                <Link
                  href="/cuentas/login/password-olvidado"
                  className={login.enlace_recuperar_password}
                  aria-label="Recuperar contraseña olvidada"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
                <p className="mt-3">
                  ¿No tienes cuenta?{" "}
                  <Link href="/cuentas/crear-cuenta" className={login.enlace_recuperar_password}>
                    Regístrate gratis
                  </Link>
                </p>

                {/* Botón para volver al inicio */}
                <div className="text-center mt-1">
                  <Link 
                    href="/" 
                    className="btn btn-sm"
                    aria-label="Volver a la página de inicio"
                  >
                    ← Volver al inicio
                  </Link>
                </div>
              </div>

            </div>
            {/* Fin contenedor_formulario */}
          </div>
          {/* Fin columna principal */}

          {/* Footer principal */}
          <FooterMain />
          
        </div>
        {/* Fin row contenedor_principal */}
      </div>
      {/* Fin container */}
    </>
  );
}