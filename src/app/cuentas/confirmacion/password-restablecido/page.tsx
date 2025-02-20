// Página password restablecida
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// estilos de la pagina CSS modules
import styPassRes from "../../../ui/cuentas/confirmacion/password-restablecido/PasswordRestablecido.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterPrincipal from "@/app/components/FooterMain";

export default function CrearCuenta() {
  return (
        <div className="container-fluid container-xl">
            <div className="row justify-content-center contenedor_principal">
                {/* Header principal */}
                < HeaderPrincipalTei />
                <div className="col-sm-9 col-md-7 col-lg-6">
                    <div className={`${styPassRes.contenedor_formulario}`}>
                        <div className={`${ styPassRes.contenedor_titulos}`}>
                            <h3 className={`${ styPassRes.subtitulo_h3}`}>Contraseña restablecida</h3>
                            <p className={`${ styPassRes.texto}`}>Ahora puedes iniciar sesión</p>
                        </div>
                        <div className="cool-md-12 text-center mt-2">
                            <p className={`${ styPassRes.pregunta}`}>
                                <a href="/cuentas/login" className={`${ styPassRes.boton_registrarse}`}>Iniciar sesión</a>
                            </p>
                        </div>
                    </div>
                </div>
                {/* Footer principal */}
                <FooterPrincipal />
            </div>
        </div>
    );
}