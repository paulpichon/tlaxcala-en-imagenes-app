// import Image from "next/image";
// import styles from "./ui/page.module.css";
// Image next
import Image from "next/image";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
// import styles from "./ui/page.module.css";
import "./ui/home.css";

import type { Viewport } from 'next'
 
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
                <a className="a_links" href="">
                  <Image 
                    src="/google-icone-symbole-logo-png.ico"
                    className="google_icon"
                    width={25}
                    height={25}
                    alt="Google Icon"
                  >

                  </Image>
                  {/* <img className="google_icon" src="img/index/google-icone-symbole-logo-png.ico" alt="Google Icon"> */}
                  Registrarse con Google
                </a>
              </div>
              <div className="boton boton_crear_cuenta">
                <a className="a_links" href="">Crear una cuenta</a>
              </div>
              <span className="span_o">O</span>
              <div className="boton boton_inciar_sesion">
                <a className="a_links" href="">Iniciar sesión</a>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-12">
          <div className="pie_pagina_index fixed-bottom">
            <ul className="nav justify-content-center">
              <li className="nav-item">
                <a className="nav-link pie_pagina_links tad active" aria-current="page" href="#">Tlaxcala Al Descubierto</a>
              </li>
              <li className="nav-item">
                <a className="nav-link pie_pagina_links" href="#">Información</a>
              </li>
              <li className="nav-item">
                <a className="nav-link pie_pagina_links" href="#">Política de Privacidad</a>
              </li>
              <li className="nav-item">
                <a className="nav-link pie_pagina_links" href="#">Condiciones de Servicio</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
