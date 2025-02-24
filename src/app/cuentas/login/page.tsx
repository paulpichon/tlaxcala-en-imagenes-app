// Iniciar Sesion
// Link nextjs
import Link from "next/link";
// viewport
import type { Viewport } from 'next';
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
import login from "../../ui/cuentas/login/login.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterMain from "../../components/FooterMain";


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
					<div className={`${login.contenedor_formulario}`}>
						<div className={`${login.contenedor_titulos}`}>
							<h3 className={`${login.subtitulo_h3}`}>Iniciar sesión</h3>
						</div>
						<div className={`${login.contenedor_formulario}`}>
							<form className="formulario_crear_cuenta" id="iniciar_sesion">
								<div className={`${login.contenedor_inputs_login}`}>
								  <input type="text" className={`form-control ${login.inputs_crear_cuenta}`} id="correo" aria-describedby="correo" placeholder="Correo electrónico" />
								</div>
								<div className={`${login.contenedor_inputs_login}`}>
								  <input type="password" className={`form-control ${login.inputs_crear_cuenta}`} id="password" placeholder="Contraseña" />
								</div>
								<button type="submit" className={`${login.boton_registrarse}`}>Iniciar sesión</button>
							</form>
                            <div className="cool-md-12 text-center">
                                <p className={`${login.pregunta}`}>
                                    <Link href="/cuentas/login/password-olvidado" className={`${login.enlace_recuperar_password}`}>
                                    ¿Se te olvidó la contraseña?
                                    </Link>
                                </p>
                            </div>
						</div>
					</div>
				</div>
				{/* Footer */}
                <FooterMain />
			</div>
		</div>
    );
}
