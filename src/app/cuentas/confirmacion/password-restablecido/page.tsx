// Página password restablecida
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// estilos de la pagin
import "../../../ui/cuentas/confirmacion/password-restablecido/password-restablecido.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderAside";
import FooterPrincipal from "@/app/components/FooterMain";

export default function CrearCuenta() {
  return (
        <div className="container-fluid container-xl">
            <div className="row justify-content-center contenedor_principal">
                < HeaderPrincipalTei />
                <div className="col-sm-9 col-md-7 col-lg-6">
                    <div className="contenedor_formulario ">
                        <div className="contenedor_titulos">
                            <h3 className="subtitulo_h3">Contraseña restablecida</h3>
                            <p className="texto">Ahora puedes iniciar sesión</p>
                        </div>
                        <div className="cool-md-12 text-center mt-2">
                            <p className="pregunta">
                                <a href="iniciar-sesion.html" className="boton_registrarse">Iniciar sesión</a>
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