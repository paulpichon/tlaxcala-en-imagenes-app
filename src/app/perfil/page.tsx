// Perfil de usuario
// Recordar que el nombre de este archivo debe ser [], investigar en REACT o NEXT la estrcutura del nombre de este archivo ya que es dinamico, debe ser con el nombre del usuario
// Image NESTJS
import Image from "next/image";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
// import styles from "./ui/page.module.css";
import "../ui/perfil/perfil.css";
// viewport
import type { Viewport } from 'next';
// Componentes
// Menu principal
import MenuPrincipal from "../components/MenuPrincipal";
// Header superior
import HeaderSuperior from "../components/HeaderSuperior";
// Publicaciones de usuarios
// import PublicacionUsuario from "../components/inicio/PublicacionUsuario";
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
							<div className="contenedor_info_usuario">
								<div className="row">
									<div className="col-4 col-sm-3 text-center">
										<Image 
											src="/usuarios/tania.jpg" 
											width={100}
											height={200}
											className="img_perfil_usuario rounded-circle"
											alt="Magaly Jimenez"
										/>
									</div>
									<div className="col-5 col-sm-7">
										<div className="informacion_usuario text-center">
											<h6 className="nombre_usuario_perfil">Magaly Jimenez</h6>
											<div className="row">
												<div className="col-12 col-sm-6 col-lg-6">
													<p className="cantidad_imagenes_publicaciones"><span className="cantidad_numero">124</span> imágenes</p>
												</div>
												<div className="col-12 col-sm-6 col-lg-6">
													<p className="cantidad_seguidores"><span className="cantidad_numero">1492</span> seguidores</p>
												</div>
											</div>
											<p className="cantidad_likes"><i data-feather="heart"></i> <span className="cantidad_numero">929</span> Yóllotls</p>
										</div>
									</div>
									<div className="col-3 col-sm-2">
										<div className="seguir_usuario text-center">
											<button className="btn_seguir_usuario" id="" >Seguir</button>
										</div>
  									</div>
								</div>
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
												<h6 className="titulo_publicaciones pt-3 pb-3">PUBLICACIONES</h6>
											</div>
											<div className="row g-1">
												<div className="col-4">
													<Image 
														src="/imagenes_votadas/votadas1.jpg" 
														width={250}
														height={200}
														className="imagen_grid_perfil_usuario gallery-image"
														alt="Magaly Jimenez"
														loading="lazy"
													/>
												</div>
											
												<div className="col-4">
													<Image 
														src="/imagenes_votadas/votadas2.jpg" 
														width={250}
														height={200}
														className="imagen_grid_perfil_usuario gallery-image"
														alt="Magaly Jimenez"
														loading="lazy"
													/>
												</div>
											
												<div className="col-4">
													<Image 
														src="/imagenes_votadas/votadas3.jpg" 
														width={250}
														height={200}
														className="imagen_grid_perfil_usuario gallery-image"
														alt="Magaly Jimenez"
														loading="lazy"
													/>
												</div>
												<div className="col-4">
													<Image 
														src="/imagenes_votadas/votadas2.jpg" 
														width={250}
														height={200}
														className="imagen_grid_perfil_usuario gallery-image"
														alt="Magaly Jimenez"
														loading="lazy"
													/>
												</div>
												<div className="col-4">
													<Image 
														src="/imagenes_votadas/votadas1.jpg" 
														width={250}
														height={200}
														className="imagen_grid_perfil_usuario gallery-image"
														alt="Magaly Jimenez"
														loading="lazy"
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="col-xl-4 sugerencias">
					<div className="contenedor_sugerencias sticky-top p-3">
						<div className="contenedor_titulo_h5">
							<h5 className="text-center">Imagénes más votadas</h5>
						</div>	
						<div className="contenedor_sugerencias_seguir mt-4">
							<div className="row d-flex justify-content-center">
								{/* Imagenes mas votadas */}
								<ImagenesMasVotadas />
							</div>
							<div className="row d-flex justify-content-center">
								<div className="col-8 mt-4">
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


		// <div className="modal fade" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
		// 	<div className="modal-dialog modal-dialog-centered  modal-lg ">
		// 		<div className="modal-content">
		// 			<div className="modal-header">
		// 				<button type="button" className="btn_opciones_modal" id="modalOpcionesPublicacion">
		// 					<i  data-feather="more-horizontal"></i>
		// 				</button>
		// 				<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
		// 			</div>
		// 			<div className="contenedor_imagen_expandida">
		// 			<img id="modalImage" src="" className="img-fluid">
		// 			</div>
		// 			<div className="footer_publicacion">
		// 				<button id="likeButton" data-post-id="POST_ID" className="like-button">
		// 					<i data-feather="heart"></i>
		// 				</button>
		// 				<p id="likeCount" className="d-inline votaciones">10009</p>
		// 				<strong>Me gusta</strong>
		// 			</div>
		// 		</div>
		// 	</div>
		// </div> 
		// <div className="modal fade" id="modalOpciones" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
		// 	<div className="modal-dialog modal-dialog-centered">
		// 	  <div className="modal-content">
		// 		<div className="modal-body">
		// 			<div className="row text-center">
		// 				<div className="col-md-12">
		// 					<a id="seguir_usuario" type="button" className="btn_opciones_publicaciones btn_seguir" href="#">
		// 						Seguir
		// 					</a>
		// 				</div>
		// 				<div className="col-md-12">
		// 					<a type="button" className="btn_opciones_publicaciones btn_rojo" data-toggle="modal" data-target="#modalDenuncia">
		// 						Denunciar
		// 					</a>
		// 				</div>
		// 				<div className="col-md-12">
		// 					<a type="button" className="btn_opciones_publicaciones" href="#">
		// 						Añadir a favoritos
		// 					</a>
		// 				</div>
		// 				<div className="col-md-12">
		// 					<a href="#" type="button" className="btn_opciones_publicaciones">
		// 						Ir a la publicación
		// 					</a>
		// 				</div>
		// 				<div className="col-md-12">
		// 					<a type="button" className="btn_opciones_publicaciones" data-bs-dismiss="modal">Cancelar</a>
		// 				</div>
		// 			</div>
		// 		</div>
		// 	  </div>
		// 	</div>
		// </div>
		

    );
}
