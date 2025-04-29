// Pagina restablecer password
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
import restaPasssword from "../../../ui/cuentas/login/restablecer-password/RestablecerPassword.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterMain from "../../../../components/FooterMain";

export default function RestablecerPassword() {
	return (
		<div className="container-fluid container-xl">
			<div className="row justify-content-center contenedor_principal">
				<HeaderPrincipalTei />
				<div className="col-sm-9 col-md-7 col-lg-6">
					<div className={`${restaPasssword.contenedor_formulario}`}>
						<div className={`${restaPasssword.contenedor_titulos}`}>
							<h3 className={`${restaPasssword.subtitulo_h3}`}>Reestablecer contraseña</h3>
                            <p className={`${restaPasssword.texto}`}>Introduce tu nueva contraseña</p>
						</div>
						<div className={`${restaPasssword.contenedor_formulario}`}>
							<form className="formulario_crear_cuenta" id="iniciar_sesion">
								<div className="mb-4">
									<input type="password" className={`form-control ${restaPasssword.inputs_crear_cuenta}`} id="password" placeholder="Nueva contraseña" />
								</div>
								<button type="submit" className={`${restaPasssword.boton_registrarse}`}>Confirmar</button>
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
