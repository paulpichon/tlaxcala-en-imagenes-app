import { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.css";
import "../ui/inicio/inicio.css";

// Componentes
import MenuPrincipal from "../components/MenuPrincipal";
import HeaderSuperior from "../components/HeaderSuperior";
import PublicacionUsuario from "../components/inicio/PublicacionUsuario";
import NuevosUsuariosRegistrados from "../components/NuevosUsuariosRegistrados";
import Publicidad from "../components/Publicidad";
import FooterSugerencias from "../components/FooterSugerencias";

// ✅ Metadata optimizada para la página de inicio
export const metadata: Metadata = {
  title: "Inicio", // Usará el template: "Inicio | TlaxApp"
  description: "Explora las últimas publicaciones de Tlaxcala. Descubre fotos, historias y lugares compartidos por personas de tu comunidad en TlaxApp.",
  
  keywords: [
    "TlaxApp",
    "inicio TlaxApp",
    "feed Tlaxcala",
    "publicaciones Tlaxcala",
    "red social Tlaxcala",
    "comunidad Tlaxcala",
    "fotos Tlaxcala",
    "lugares Tlaxcala",
  ],
  
  openGraph: {
    title: "Inicio | TlaxApp",
    description: "Explora las últimas publicaciones de Tlaxcala. Descubre fotos, historias y lugares compartidos por tu comunidad.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/inicio`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-image.png", // Crea esta imagen específica
        width: 1200,
        height: 630,
        alt: "TlaxApp - La red social de Tlaxcala.",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Inicio | TlaxApp",
    description: "Explora las últimas publicaciones de Tlaxcala.",
    images: ["/assets/og-image.png"],
  },
  
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/inicio`,
  },
  
  robots: {
    index: false, // 👈 No indexar porque requiere login
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
  
  // Metadata específica para apps
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

// ✅ Server Component con JSON-LD
export default function Inicio() {
  return (
    <>
      {/* Contenedor Principal */}
      <div className="contenedor_principal">
        <div className="row g-0">
          {/* Contenedor menu */}
          <div className="col-md-2 col-lg-2 col-xl-2">
            <div className="contenedor_menu_lateral_inferior fixed-bottom">
              <MenuPrincipal />
            </div>
          </div>

          {/* Contenedor Contenido Principal */}
          <div className="col-md-10 col-lg-10 col-xl-6 contenedor_central_contenido">
            <div className="contenedor_menu_superior sticky-top">
              <HeaderSuperior />
            </div>
            
            <div className="contenedor_contenido_principal">
              <PublicacionUsuario />
            </div>
          </div>

          {/* Contenedor publicidad/sugerencias */}
          <div className="col-xl-4 sugerencias">
            <div className="contenedor_sugerencias sticky-top p-3">
              <div className="contenedor_sugerencias_seguir mt-4">
                <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                  <NuevosUsuariosRegistrados />
                </div>
                
                <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                  <div className="col-8">
                    <Publicidad />
                  </div>
                </div>

                <div className="row d-flex justify-content-center mt-4">
                  <div className="col-12">
                    <div className="text-center mt-3">
                      <FooterSugerencias />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}