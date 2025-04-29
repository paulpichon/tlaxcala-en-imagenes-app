// Iniciar Sesion
// Link nextjs
import Link from "next/link";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
import login from "../../ui/cuentas/login/login.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Formulario de registro
import FormularioLogin from "./components/FormularioLogin";
// Footer principal
import FooterMain from "../../components/FooterMain";


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
							{/* Componente Formualrio del Login */}
							<FormularioLogin/>
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
