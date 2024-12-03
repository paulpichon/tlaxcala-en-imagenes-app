// Iniciar Sesion
// Link nextjs
import Link from "next/link";
// Image next
// import Image from "next/image";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
// import styles from "./ui/page.module.css";
import "../../ui/cuentas/iniciar-sesion/iniciar-sesion.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterPrincipal from "../../components/FooterPrincipal";
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
				{/* Header principal */}
                <HeaderPrincipalTei />
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
								<button type="submit" className="boton_registrarse">Iniciar sesión</button>
							</form>
                            <div className="cool-md-12 text-center mt-2">
                                <p className="pregunta">
                                    <Link href="/cuentas/iniciar-sesion" className="enlace_recuperar_password">
                                    ¿Se te olvidó la contraseña?
                                    </Link>
                                </p>
                            </div>
						</div>
					</div>
				</div>
				{/* Footer */}
                <FooterPrincipal />
			</div>
		</div>
    );
}
