// Página cuenta verificada
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// estilos de la pagina
import "../../../ui/cuentas/crear-cuenta/cuenta-verificada/cuenta-verificada.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipal";
// Footer principal
import FooterPrincipal from "@/app/components/FooterMain";

export default function CrearCuenta() {
  return (
        <div className="container-fluid container-xl">
            <div className="row justify-content-center contenedor_principal">
                {/* Header */}
                <HeaderPrincipalTei />
                <div className="col-sm-9 col-md-7 col-lg-6">
                    <div className="contenedor_formulario ">
                        <div className="contenedor_titulos">
                            <h3 className="subtitulo_h3">Cuenta verificada</h3>
                            <p className="texto">Ahora puedes <a className="link_inciar_sesion" href="iniciar-sesion.html">iniciar sesión</a>.</p>
                        </div>
                    </div>
                </div>
                {/* footer */}
                <FooterPrincipal />
            </div>
        </div> 
    );
}