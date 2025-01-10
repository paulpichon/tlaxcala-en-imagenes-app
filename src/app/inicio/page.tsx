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

// Menu principal
import MenuPrincipal from "../components/MenuPrincipal";
// Header superior
import HeaderSuperior from "../components/HeaderSuperior";
// Publicaciones de usuarios
import PublicacionUsuario from "../components/inicio/PublicacionUsuario";


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
