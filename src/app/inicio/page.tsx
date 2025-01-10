// Inicio de la pagina principal de la APP
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
// import styles from "./ui/page.module.css";
import "../ui/inicio/inicio.css";
// viewport
import type { Viewport } from 'next';
// Componentes
// Menu principal
import MenuPrincipal from "../components/MenuPrincipal";
// Header superior
import HeaderSuperior from "../components/HeaderSuperior";
// Publicaciones de usuarios
import PublicacionUsuario from "../components/inicio/PublicacionUsuario";
// Imagenes mas votadas por usuarios
import ImagenesMasVotadas from "../components/ImagenesMasVotadas";
// Publicidad dentro del div sugerencias
import Publicidad from "../components/Publicidad";
// Footer sugerencias
import FooterSugerencias from "../components/FooterSugerencias";


export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Also supported by less commonly used
  // interactiveWidget: 'resizes-visual',
}

export default function Inicio() {
    return (
        // <!--Contenedor-->
		<div className="contenedor_principal">
			{/* <!--Row--> */}
			<div className="row g-0">
				{/* <!--Contenedor menu--> */}
				<div className="col-md-2 col-lg-2 col-xl-2">
					<div className="contenedor_menu_lateral_inferior fixed-bottom">
						{/* Menu principal */}
						<MenuPrincipal />
					</div>
				</div>
				{/* <!--Fin Contenedor menu--> */}


				{/* <!--Contenedor Contenido Principal--> */}
				<div className="col-md-10 col-lg-10  col-xl-6 contenedor_central_contenido">
					{/* <!--Contenedor menu prinicpal--> */}
						<div className="contenedor_menu_superior sticky-top">
							{/* <!--Header Superior--> */}
							<HeaderSuperior />
							{/* <!--Fin Header Superior--> */}
						</div>
					{/* <!--Fin Contenedor menu prinicpal--> */}
					
					{/* <!-- Contenedor del contenido principal publicacion --> */}
					<div className="contenedor_contenido_principal">
						
						{/* Publicaciones de usuarios */}
						<PublicacionUsuario />

					</div>
					{/* <!-- Contenedor del contenido principal publicacion --> */}
				</div>
				{/* <!--Fin Contenedor Contenido Principal--> */}

				{/* <!--Contenedor publicidad/sugerencias--> */}
				<div className="col-xl-4 sugerencias">
					{/* <!-- Contenedor de contenido --> */}
					<div className="contenedor_sugerencias sticky-top p-3">
						{/* <!-- contenedor titulo --> */}
						<div className="contenedor_titulo_h5">
							{/* <!-- titulo principal de sugerencias --> */}
							<h5 className="text-center">Imagénes más votadas</h5>
						</div>	
						{/* <!--fin contenedor titulo -->					 */}
						{/* <!-- contenedor_sugerencias_seguir --> */}
						<div className="contenedor_sugerencias_seguir mt-4">
							<div className="row d-flex justify-content-center">
								{/* IMAGENES MAS VOTADAS */}
								<ImagenesMasVotadas />

							</div>
							{/* <!-- row publicidad --> */}
							<div className="row d-flex justify-content-center">
								{/* <!-- Publicidad --> */}
								<div className="col-8 mt-4">
									{/* <!-- publicidad --> */}
									<Publicidad />
									{/* <!-- fin publicidad --> */}
								</div>
								{/* <!-- Publicidad --> */}
							</div>
							{/* <!-- Fin row publicidad --> */}

							<div className="row d-flex justify-content-center mt-4">
								{/* <!-- Publicidad --> */}
								<div className="col-12">
									<div className="text-center mt-3">
										{/* Footer del div sugerencias */}
										<FooterSugerencias />
									</div>
								</div>
								{/* <!-- Publicidad --> */}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

    );
}
