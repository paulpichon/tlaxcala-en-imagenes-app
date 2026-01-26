// Uso de use client por el uso de useSte
// 'use client';
/**  
 ******* PAGINA CREAR CUENTA
 **/
// Link nextjs
import Link from "next/link";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
import crearCuenta from "../../ui/cuentas/crear-cuenta/CrearCuenta.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Formulario de registro
import { FormularioRegistro } from "./components/FormularioRegistro";
// Footer principal
import FooterMain from "../../components/FooterMain";


export default function CrearCuenta() {
    return (
		<div className="container-fluid container-xl">
			<div className="row justify-content-center contenedor_principal">
				{/* Header principal */}
                <HeaderPrincipalTei />
				<div className="col-sm-9 col-md-7 col-lg-6">
					<div className="text-center">
						<div className={`${crearCuenta.contenedor_titulos}`}>
						<h3 className={crearCuenta.subtitulo_h3}>
							Únete a TlaxApp
						</h3>
						<p className={crearCuenta.descripcion}>
							Comparte y descubre Tlaxcala en imágenes.
						</p>

						</div>
						{/* FormularioRegistro */}
						<FormularioRegistro />
					</div>
				</div>
				<div className="cool-md-12 text-center mt-2">
					<p className={`${crearCuenta.pregunta}`}>¿Tienes una cuenta? 
                        <Link href="/cuentas/login" className={`${crearCuenta.enlace_iniciar_sesion}`}>Entrar</Link>
                    </p>
					<p className="text-center mt-3">
						<Link href="/" className={`text-decoration-none text-black`}>
							Volver al inicio
						</Link>
					</p>
				</div>
				{/* Footer */}
                <FooterMain />
			</div>
	    </div>
    );
}
