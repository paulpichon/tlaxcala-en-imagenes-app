// Link nextjs
import Link from "next/link";
// Image next
import Image from "next/image";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
// import styles from "./ui/page.module.css";
import "./ui/home.css";

import type { Viewport } from 'next'
// Footer principal
import FooterPrincipal from "./components/FooterPrincipal";
// viewport
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Also supported by less commonly used
  // interactiveWidget: 'resizes-visual',
}

export default function Home() {
  return (
      <div className="container-fluid container-xl">
      <div className="row d-flex align-items-center contenedor_principal">
        <div className="col-md-5">
          <div className="contenedor_tei_index">
            <h1 className="titulo_principal_h1">TLAXCALA EN <span className="d-block">IMÁGENES</span></h1>
            <h6 className="subtitulo_h6">por <span className="span_tad d-block">T A D</span></h6>
          </div>
        </div>
        <div className="col-md-7">
          <div className="contenedor_enlaces_index">
            <div className="contenedor_titulos">
              <h3 className="subtitulo_h3">Una imagen vale más que mil palabras</h3>
              <h4 className="subtitulo_h4">Únete Hoy</h4>
            </div>
            <div className="contenedor_enlaces">
              <div className="boton boton_registrarse_google">
              <Link className="a_links" href="/google-sign-in">
                  <Image 
                    src="/google-icone-symbole-logo-png.ico"
                    className="google_icon"
                    width={25}
                    height={25}
                    alt="Google Icon"
                  >
                  </Image>
                  Registrarse con Google
              </Link>
                
              </div>
              <div className="boton boton_crear_cuenta">
              <Link className="a_links" href="/cuentas/crear-cuenta">
                Crear una cuenta
              </Link>
              </div>
              <span className="span_o">O</span>
              <div className="boton boton_inciar_sesion">
                <Link className="a_links" href="iniciar-sesion">
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* componente footer principal*/}
        <FooterPrincipal />
      </div>
    </div>
  );
}
