// Página cuenta verificada
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// estilos de la pagina
import cuentaVerificada from "../../../ui/cuentas/crear-cuenta/cuenta-verificada/CuentaVerificada.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterPrincipal from "@/app/components/FooterMain";

export default function CrearCuenta() {
  return (
        <div className="container-fluid container-xl">
            <div className="row justify-content-center contenedor_principal">
                {/* Header */}
                <HeaderPrincipalTei />
                <div className="col-sm-9 col-md-7 col-lg-6">
                    <div className={cuentaVerificada.contenedor_formulario}>
                        <div className={cuentaVerificada.contenedor_titulos}>
                            <h3 className={cuentaVerificada.subtitulo_h3}>Cuenta verificada</h3>
                            <p className={cuentaVerificada.texto}>Ahora puedes  
                                <a className={cuentaVerificada.link_inciar_sesion} href="/cuentas/login"> iniciar sesión</a>.
                            </p>
                        </div>
                    </div>
                </div>
                {/* footer */}
                <FooterPrincipal />
            </div>
        </div> 
    );
}