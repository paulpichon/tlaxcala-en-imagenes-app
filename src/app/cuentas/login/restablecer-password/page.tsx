// Pagina restablecer password
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
import "../../../ui/cuentas/login/restablecer-password/restablecer-password.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderAside";
// Footer principal
import FooterMain from "../../../components/FooterMain";
// viewport
import type { Viewport } from 'next';

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	// Also supported by less commonly used
	// interactiveWidget: 'resizes-visual',
}

export default function RestablecerPassword() {
		return (
		<div className="container-fluid container-xl">
			<div className="row justify-content-center contenedor_principal">
				<HeaderPrincipalTei />
				<div className="col-sm-9 col-md-7 col-lg-6">
					<div className="contenedor_formulario ">
						<div className="contenedor_titulos">
							<h3 className="subtitulo_h3">Reestablecer contraseña</h3>
                            <p className="texto">Introduce tu nueva contraseña</p>
						</div>
						<div className="contenedor_formulario">
							<form className="formulario_crear_cuenta" id="iniciar_sesion">
								<div className="mb-4">
									<input type="password" className="form-control inputs_crear_cuenta" id="password" placeholder="Nueva contraseña" />
								</div>
								<button type="submit" className="boton_registrarse">Confirmar</button>
							  </form>
						</div>
					</div>
				</div>
				{/* Footer */}
				<FooterMain />
			</div>
		</div>
		);
}
