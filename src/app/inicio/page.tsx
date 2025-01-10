// Inicio
// Link nextjs
// import Link from "next/link";
// Image next
import Image from "next/image";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
// import styles from "./ui/page.module.css";
import "../ui/inicio/inicio.css";
// viewport
import type { Viewport } from 'next';
// Feather Icons
// https://react-icons.github.io/react-icons/icons/fi/
import { FiHome, 
		FiBell, 
		FiPlusCircle, 
		FiSliders, 
		FiUser, 
		FiHeart
} from "react-icons/fi";
// Modal toldo
import ModalOpciones from "../components/inicio/ModalOpciones";

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
						<ul className="nav justify-content-center menu_inferior_lateral">
							<li className="nav-item">
								<a className="nav-link opciones_menu" aria-current="page" data-bs-toggle="tooltip" data-bs-placement="top" title="Inicio" href="#">
									{/* <!--https://feathericons.com/--> */}
									{/* <i  data-feather="home"></i> */}
									<FiHome className="icono_menu" />
									<span className="nombre_opciones_menu">Home</span>
								</a>
							</li>
							<li className="nav-item">
							  	<a className="nav-link opciones_menu" data-bs-toggle="tooltip" data-bs-placement="right" title="Notificaciones" href="#">
									{/* <!--https://feathericons.com/--> */}
									{/* <i  data-feather="bell"></i> */}
									<FiBell className="icono_menu" />
									<span className="nombre_opciones_menu">Notificaciones</span>
								</a>
							</li>
							<li className="nav-item">
							  	<a className="nav-link opciones_menu postear" data-bs-toggle="tooltip" data-bs-placement="right" title="Postear una imágen" href="#">
									{/* <!--https://feathericons.com/--> */}
									{/* <i  data-feather="plus-circle"></i> */}
									<FiPlusCircle className="icono_menu" />
									<span className="nombre_opciones_menu">Postear</span>
								</a>
							</li>
							<li className="nav-item">
							  	<a className="nav-link opciones_menu" data-bs-toggle="tooltip" data-bs-placement="right" title="Configuraciones" href="#">
									{/* <!--https://feathericons.com/--> */}
									{/* <i  data-feather="sliders"></i> */}
									<FiSliders className="icono_menu" />
									<span className="nombre_opciones_menu">Configuración</span>
								</a>
							</li>
							<li className="nav-item">
								<a className="nav-link opciones_menu" data-bs-toggle="tooltip" data-bs-placement="right" title="Perfil de usuario" href="#">
									{/* <!--https://feathericons.com/--> */}
									{/* <i  data-feather="user"></i> */}
									<FiUser className="icono_menu" />
									<span className="nombre_opciones_menu">Magaly Jimenez</span>
								</a>
							</li>
						</ul>
					</div>
				</div>
				{/* <!--Fin Contenedor menu--> */}


				{/* <!--Contenedor Contenido Principal--> */}
				<div className="col-md-10 col-lg-10  col-xl-6 contenedor_central_contenido">
					{/* <!--Contenedor menu prinicpal--> */}
						<div className="contenedor_menu_superior sticky-top">
							{/* <!--Menu superior--> */}
							<nav className="navbar-expand-lg menu_superior_central">
								<h1 className="titulo_principal_h1">TLAXCALA EN <span className="display_inline_titulo">IMÁGENES</span></h1>
								<h6 className="subtitulo_h6 por_tad">por <span className="span_tad d-block" data-bs-toggle="tooltip" data-bs-placement="right" title="Tlaxcala Al Descubierto">T A D</span></h6>
							</nav>
							{/* <!--Fin Menu superior--> */}
						</div>
					{/* <!--Fin Contenedor menu prinicpal--> */}
					
					{/* <!-- Contenedor del contenido principal publicacion --> */}
					<div className="contenedor_contenido_principal">

						{/* <!-- div contenedor publicaciones --> */}
						<div className="contenedor_publicaciones">
							{/* <!--Publicacion--> */}
							<div className="container-fluid">
								<div className="contenedor_publicacion">
									<div className="contenedor_encabezado_publicacion">
										<div className="row">
											<div className="col-3 col-lg-2 d-flex justify-content-center align-items-center">
												<a className="link_perfil_img" href="">
                                                    <Image 
                                                        src="/usuarios/tania.jpg"
														className="rounded-circle"
                                                        width={500}
                                                        height={500}
                                                        alt="Tania Vazquez"
                                                        title="Tania Vazquez"
                                                    />
												</a>
											</div>
											<div className="col-7 col-lg-8">
												<h5 className="nombre_usuario_publicacion">
													<a className="link_perfil_usuario" href="">Tania Vazquez</a>
												</h5>
												<p className="ubicacion">Tlaxcala, Tlaxcala</p>
											</div>
											<div className="col-2 col-lg-2 d-flex justify-content-center align-items-center">
												{/* Modal creado con TOLDO : https://toldo.vercel.app/ */}
												{/* En teoria se debe pasar parametros a este componente */}
												<ModalOpciones />
											</div>
										</div>
									</div>
								</div>
							</div>
							{/* <!--Imagen publicacion--> */}
							<div className="publicacion_imagen">
                                <Image 
                                    src="/publicaciones/publicacion.jpg"
									width={700}
                                    height={500}
									className="img-fluid img_publicacion"
									alt="Tania Vazquez"
                                />
							</div>
							{/* <!--Fin Publicaciones--> */}
							<div className="container-fluid">
								<div className="contenedor_publicacion">
									<div className="footer_publicacion">
										{/* <!-- Boton para dar like a la publicacion --> */}
										<button id="likeButton" data-post-id="POST_ID" className="like-button">
											{/* <!--https://feathericons.com/--> */}
											{/* <i data-feather="heart"></i> */}
											<FiHeart />
										</button>
										<p id="likeCount" className="d-inline votaciones">10009</p>
										{/* <!-- Yollots --> */}
										<strong className="etiqueta_strong">Me gusta</strong>
									</div>
								</div>
							</div>
							{/* <!--Fin Publicacion--> */}
						</div>
						{/* <!-- div contenedor publicaciones --> */}
						
						{/* <!-- div contenedor publicaciones --> */}
						<div className="contenedor_publicaciones">
							{/* <!--Publicacion--> */}
							<div className="container-fluid">
								<div className="contenedor_publicacion">
									<div className="contenedor_encabezado_publicacion">
										<div className="row">
											<div className="col-3 col-lg-2 d-flex justify-content-center align-items-center">
												<a className="link_perfil_img" href="">
                                                    <Image 
                                                        src="/usuarios/tania.jpg"
														className="rounded-circle"
                                                        width={500}
                                                        height={500}
                                                        alt="Tania Vazquez"
                                                        title="Tania Vazquez"
                                                    />
												</a>
											</div>
											<div className="col-7 col-lg-8">
												<h5 className="nombre_usuario_publicacion">
													<a className="link_perfil_usuario" href="">Tania Vazquez</a>
												</h5>
												<p className="ubicacion">Tlaxcala, Tlaxcala</p>
											</div>
											<div className="col-2 col-lg-2 d-flex justify-content-center align-items-center">
												{/* Modal creado con TOLDO : https://toldo.vercel.app/ */}
												{/* En teoria se debe pasar parametros a este componente */}
												<ModalOpciones />
											</div>
										</div>
									</div>
								</div>
							</div>
							{/* <!--Imagen publicacion--> */}
							<div className="publicacion_imagen">
                                <Image 
                                    src="/publicaciones/publicacion.jpg"
									width={700}
                                    height={500}
									className="img-fluid img_publicacion"
									alt="Tania Vazquez"
                                />
							</div>
							{/* <!--Fin Publicaciones--> */}
							<div className="container-fluid">
								<div className="contenedor_publicacion">
									<div className="footer_publicacion">
										{/* <!-- Boton para dar like a la publicacion --> */}
										<button id="likeButton" data-post-id="POST_ID" className="like-button">
											{/* <!--https://feathericons.com/--> */}
											{/* <i data-feather="heart"></i> */}
											<FiHeart />
										</button>
										<p id="likeCount" className="d-inline votaciones">10009</p>
										{/* <!-- Yollots --> */}
										<strong className="etiqueta_strong">Me gusta</strong>
									</div>
								</div>
							</div>
							{/* <!--Fin Publicacion--> */}
						</div>
						{/* <!-- div contenedor publicaciones --> */}
						
						

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
								{/* <!-- imagenes mas votadas --> */}
								<div className="col-4">
									<div className="sugerencias_para_seguir">
										<a className="link_imagen_mas_votadas" href="">
											<div className="card text-center">
                                                <Image 
                                                    src="/imagenes_votadas/votadas1.jpg" 
                                                    width={100}
                                                    height={100}
													className="card-img-top"
                                                    alt="Card image cap"
                                                />
												<div className="p-1">
												  <h6 className="titulo_card">Samantha Flowers</h6>
												  <p className="numero_me_gustas">1872 Me gusta</p>
												</div>
											</div>
										</a>
									</div>
								</div>
								{/* <!-- fin imagenes mas votadas -->
								 <!-- imagenes mas votadas --> */}
								<div className="col-4">
									<div className="sugerencias_para_seguir">
										<a className="link_imagen_mas_votadas" href="">
											<div className="card text-center">
                                                <Image 
                                                    src="/imagenes_votadas/votadas2.jpg" 
                                                    width={100}
                                                    height={100}
													className="card-img-top"
                                                    alt="Card image cap"
                                                />
												<div className="p-1">
												  <h6 className="titulo_card">Samantha Flowers</h6>
												  <p className="numero_me_gustas">1872 Me gusta</p>
												</div>
											</div>
										</a>
									</div>
								</div>
								{/* <!-- fin imagenes mas votadas --> */}
								 {/* <!-- imagenes mas votadas --> */}
								<div className="col-4">
									<div className="sugerencias_para_seguir">
										<a className="link_imagen_mas_votadas" href="">
											<div className="card text-center">
                                                <Image 
                                                    src="/imagenes_votadas/votadas3.jpg" 
                                                    width={100}
                                                    height={100}
													className="card-img-top"
                                                    alt="Card image cap"
                                                />
												<div className="p-1">
												  <h6 className="titulo_card">Samantha Flowers</h6>
												  <p className="numero_me_gustas">1872 Me gusta</p>
												</div>
											</div>
										</a>
									</div>
								</div>
								{/* <!-- fin imagenes mas votadas --> */}
							</div>
							{/* <!-- row publicidad --> */}
							<div className="row d-flex justify-content-center">
								{/* <!-- Publicidad --> */}
								<div className="col-8 mt-4">
									{/* <!-- sugerencias_para_seguir --> */}
									<div className="sugerencias_para_seguir">
										{/* <!-- leyenda publicidad --> */}
											<p className="m-0 publicidad">Publicidad...</p>
										{/* <!-- fin leyenda publicidad --> */}
										<a href="http://">
											<div className="card">
                                                <Image 
                                                    src="/publicidad/votadas1.jpg" 
                                                    width={100}
                                                    height={200}
													className="card-img-top"
													alt="Card image cap"
                                                />
												{/* <img className="card-img-top" src="img/imagenes_relleno/275700409_335093695238277_3060717699969997284_n.jpg" alt="Card image cap" /> */}
											</div>
										</a>
									</div>
									{/* <!-- fin sugerencias_para_seguir --> */}
								</div>
								{/* <!-- Publicidad --> */}
							</div>
							{/* <!-- Fin row publicidad --> */}

							<div className="row d-flex justify-content-center mt-4">
								{/* <!-- Publicidad --> */}
								<div className="col-12">
									<div className="text-center mt-3">
										<div className="enlaces_informacion_general">
											<a className="enlaces_footer_sugerencias" href="">Condiciones de servicio</a>
											<br />
											<a className="enlaces_footer_sugerencias" href="">Política de Privacidad</a>
											<br />
											<a className="enlaces_footer_sugerencias" href="">Información sobre Tlaxcala en Imagénes</a>
											<br />
											<h6 className="tei_footer_sugerencias mt-5">© 2024 Tlaxcala En Imágenes</h6>
										</div>
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
