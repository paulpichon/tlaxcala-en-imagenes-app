// Página cuenta verificada
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// estilos de la pagina
import "../../../ui/cuentas/crear-cuenta/cuenta-verificada/cuenta-verificada.css";
// Header principal
// import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipal";
// Footer principal
import FooterPrincipal from "@/app/components/FooterMain";

export default function CrearCuenta() {
  return (
        <div className="container-fluid container-xl">
            <div className="row justify-content-center contenedor_principal">
                <div className="col-md-12">
                    <div className="contenedor_tei_index">
                        <h1 className="titulo_principal_h1">TLAXCALA EN <span className="d-block">IMÁGENES</span></h1>
                        <h6 className="subtitulo_h6">por <span className="span_tad d-block">T A D</span></h6>
                    </div>
                </div>
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