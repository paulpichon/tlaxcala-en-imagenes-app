// Link nextjs
import Link from "next/link";
// Fonts
import { FcGoogle } from "react-icons/fc";
// Viewport
import type { Viewport } from 'next';
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
import home from "./ui/Home.module.css";
// Footer principal
import FooterMain from "./components/FooterMain";
import AlreadyAuthRedirect from "@/components/AlreadyAuthRedirect";
// viewport
export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	// Also supported by less commonly used
	// interactiveWidget: 'resizes-visual',
}

export default function Home() {
	return (
		<AlreadyAuthRedirect>
			<div className="container-fluid container-xl">
				<div className={`row d-flex align-items-center ${home.contenedor_principal}`}>
					<div className="col-md-5">
						<div className="contenedor_tei_index">
							<h1 className="titulo_principal_h1">TLAXAPP</h1>
							<h6 className="subtitulo_h6">Tlaxcala, en una sola app.</h6>
						</div>
					</div>
					<div className="col-md-7">
						<div className={`${home.contenedor_enlaces_index}`}>
							<div className={`${home.contenedor_titulos}`}>
								<h3 className={`${home.subtitulo_h3}`}>Una imagen vale más que mil palabras</h3>
								<h4 className={`${home.subtitulo_h4}`}>Únete Hoy</h4>
							</div>
							<div className={`${home.contenedor_enlaces}`}>
								<div className={`${home.boton} ${home.boton_registrarse_google}`}>
								<Link className={`${ home.a_links}`} href="/google-sign-in">
										{/* React icons */}
										<FcGoogle  className={`${home.google_icon}`} />
										Registrarse con Google
								</Link>
									
								</div>
								<div className={`${home.boton} ${ home.boton_crear_cuenta}`}>
								<Link className={`${ home.a_links}`} href="/cuentas/crear-cuenta">
									Crear una cuenta
								</Link>
								</div>
								<span className={`${home.span_o}`}>O</span>
								<div className={`${home.boton } ${ home.boton_inciar_sesion}`}>
									<Link className={`${ home.a_links}`} href="/cuentas/login">
										Iniciar sesión
									</Link>
								</div>
							</div>
						</div>
					</div>
					{/* componente footer principal*/}
					<FooterMain />
				</div>
			</div>
		</AlreadyAuthRedirect>
	);
}
