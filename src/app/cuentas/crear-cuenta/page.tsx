/**  
 ******* PAGINA CREAR CUENTA
 **/
// viewport
import type { Viewport } from 'next';
// Link nextjs
import Link from "next/link";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
import "../../ui/cuentas/crear-cuenta/crear-cuenta.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterMain from "../../components/FooterMain";

// ViewPort
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Also supported by less commonly used
  // interactiveWidget: 'resizes-visual',
}

export default function CrearCuenta() {
    return (
		<div className="container-fluid container-xl">
			<div className="row justify-content-center contenedor_principal">
				{/* Header principal */}
                <HeaderPrincipalTei />
				<div className="col-sm-9 col-md-7 col-lg-6">
					<div className="contenedor_formulario ">
						<div className="contenedor_titulos">
							<h3 className="subtitulo_h3">Crear cuenta</h3>
						</div>
						<div className="contenedor_formulario">
                            {/* Existe un error debido a que falta el action del form */}
							<form id="crear_cuenta" className="formulario_crear_cuenta">
								<div className="contenedor_input">
								  <input type="text" className="form-control inputs_crear_cuenta" id="nombre_usuario" aria-describedby="nombre" placeholder="Nombre completo" />
								</div>
								<div className="contenedor_input">
								  <input type="text" className="form-control inputs_crear_cuenta" id="correo" aria-describedby="correo" placeholder="Correo electrónico" />
								</div>
								<div className="contenedor_input">
								  <input type="password" className="form-control inputs_crear_cuenta" id="password" placeholder="Contraseña" />
								</div>
								<button type="submit" className="boton_registrarse">Registrarse</button>
							</form>
						</div>
					</div>
				</div>
				<div className="cool-md-12 text-center mt-2">
					<p className="pregunta">¿Tienes una cuenta? 
                        <Link href="/cuentas/login" className="enlace_iniciar_sesion">Entrar</Link>
                    </p>
				</div>
				{/* Footer */}
                <FooterMain />
			</div>
	    </div>
    );
}
