// Perfil de usuario
// Recordar que el nombre de este archivo debe ser [], investigar en REACT o NEXT la estrcutura del nombre de este archivo ya que es dinamico, debe ser con el nombre del usuario
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
// import styles from "./ui/page.module.css";
import perfil from "../ui/perfil/perfil.module.css";
// viewport
import type { Viewport } from 'next';
// Componentes
// Menu principal
import MenuPrincipal from "../components/MenuPrincipal";
// Header superior
import HeaderSuperior from "../components/HeaderSuperior";
// Informacion del usuario
import InformacionUsuarioPerfil from "../components/perfil/InformacionUsuarioPerfil";
// Publicaciones Grid de usuarios
import PublicacionesUsuarioGrid from "../components/perfil/PublicacionesUsuarioGrid";
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
		<div className="contenedor_principal">
			<div className="row g-0">
				<div className="col-md-2 col-lg-2 col-xl-2">
					<div className="contenedor_menu_lateral_inferior fixed-bottom">
						{/* Menu principal */}
						<MenuPrincipal />
					</div>
				</div>
				
				<div className="col-md-10 col-lg-10  col-xl-6 contenedor_central_contenido">
					<div className="contenedor_menu_superior sticky-top">
						{/* Menu principal superior */}
						<HeaderSuperior />
					</div>
					<div className="contenedor_contenido_principal">

						<div className="container-fluid">
							<div className={`${perfil.contenedor_info_usuario}`}>
								{/* Como parametro se debe pasar la informacion de la URL del usuario */}
								{/* Componente informacion de usuario */}
								<InformacionUsuarioPerfil />
							</div>
						</div>
					</div>
					<div className="publicaciones_usuario">
						
						<div className="container-fluid">
							<div className="row">
								<div className="col-12">
									<div className="contenedor_publicacion_usuario mb-5">
										<div className=" mt-3">
											<div className="titulo_contenedor text-center">
												<h6 className={`${perfil.titulo_publicaciones} pt-3 pb-3`}>PUBLICACIONES</h6>
											</div>
											{/* Publicaciones de usuario en GRID */}
											<PublicacionesUsuarioGrid />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="col-xl-4 sugerencias">
					<div className="contenedor_sugerencias sticky-top p-3">
						<div className="contenedor_sugerencias_seguir mt-4">
							<div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
								{/* Imagenes mas votadas */}
								<ImagenesMasVotadas />
							</div>
							<div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
								<div className="col-8">
									{/* Publicidas */}
									<Publicidad />
								</div>
							</div>

							<div className="row d-flex justify-content-center mt-4">
								<div className="col-12">
									<div className="text-center mt-3">
										{/* Footer DEL DIV SUGERENCIAS */}
										<FooterSugerencias />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
    );
}
