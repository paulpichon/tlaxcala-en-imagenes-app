// Iniciar Sesión
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.css";

// Styles
import login from "../../ui/cuentas/login/login.module.css";

// Components
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FormularioLogin from "./components/FormularioLogin";
import FooterMain from "../../components/FooterMain";

export default function IniciarSesion() {
  return (
    <div className="container-fluid container-xl">
      <div className="row justify-content-center contenedor_principal">
        {/* Header */}
        <HeaderPrincipalTei />

        {/* Formulario */}
        <div className="col-sm-9 col-md-7 col-lg-6">
          <div className={login.contenedor_formulario}>
            <div className={login.contenedor_titulos}>
              <h3 className={login.subtitulo_h3}>Bienvenido de vuelta</h3>
              <p className={login.descripcion}>
                Inicia sesión para seguir descubriendo Tlaxcala.
              </p>
            </div>

            <FormularioLogin />

            <div className="text-center mt-3">
              <Link
                href="/cuentas/login/password-olvidado"
                className={login.enlace_recuperar_password}
              >
                ¿Olvidaste tu contraseña?
              </Link>
              <p className="text-center mt-3">
								<Link href="/" className={`${login.enlace_recuperar_password}`}>
									Volver al inicio
								</Link>
							</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <FooterMain />
      </div>
    </div>
  );
}
