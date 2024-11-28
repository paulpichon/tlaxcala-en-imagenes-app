// Iniciar Sesion
// Link nextjs
// import Link from "next/link";
// Image next
// import Image from "next/image";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
// import styles from "./ui/page.module.css";
import "../../ui/cuentas/crear-cuenta.css";
// Header principal
// import { HeaderPrincipalTei } from "@/app/components/headerPrincipalTei";
// Footer principal
// import FooterPrincipal from "../../components/footerPrincipal";
// viewport
import type { Viewport } from 'next';
// Link nextjs
// import Link from "next/link";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Also supported by less commonly used
  // interactiveWidget: 'resizes-visual',
}

export default function IniciarSesion() {
    return (
		<div className="container-fluid container-xl">
			<div className="row justify-content-center contenedor_principal">
				<div className="col-md-12">
					<div className="contenedor_tei_index">
						<h1 className="titulo_principal_h1">TLAXCALA EN <span className="d-block">IMÁGENES</span></h1>
						<h6 className="subtitulo_h6">por <span className="span_tad d-block">T A D</span></h6>
					</div>
				</div>
				<div className="col-sm-9 col-md-7 col-lg-6">
					<div className="contenedor_formulario ">
						<div className="contenedor_titulos">
							<h3 className="subtitulo_h3">Iniciar sesión</h3>
						</div>
						<div className="contenedor_formulario">
							<form className="formulario_crear_cuenta" id="iniciar_sesion">
								<div className="mb-3">
								  <input type="text" className="form-control inputs_crear_cuenta" id="correo" aria-describedby="correo" placeholder="Correo electrónico" />
								</div>
								<div className="mb-3">
								  <input type="password" className="form-control inputs_crear_cuenta" id="password" placeholder="Contraseña" />
								</div>
								<div className="cool-md-12 text-center mt-2">
									<p className="pregunta">
										<a href="recuperar-contraseña.html" className="enlace_recuperar_password">¿Se te olvidó la contraseña?</a>
									</p>
								</div>
								<button type="submit" className="boton_registrarse">Iniciar sesión</button>
							  </form>
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
