// Pagina de Posteo de usuario
// Muestra la informacion de un posteo en detalle
import { Viewport } from "next";
import HeaderSuperior from "@/app/components/HeaderSuperior";
import MenuPrincipal from "@/app/components/MenuPrincipal";
import ImagenesMasVotadas from "@/app/components/ImagenesMasVotadas";
import Publicidad from "@/app/components/Publicidad";
import FooterSugerencias from "@/app/components/FooterSugerencias";

// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Componente PosteoDelete, traer informacion del POSTEO
import PosteoDetalle from "@/app/components/PosteoDetalle";

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    // Also supported by less commonly used
    // interactiveWidget: 'resizes-visual',
  }


export default async function Posteo() {
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
                        {/* Publicacion de usuario */}
                        <PosteoDetalle />

                    </div>
                    {/* <!-- Contenedor del contenido principal publicacion --> */}
                </div>
                {/* <!--Fin Contenedor Contenido Principal--> */}
   
                {/* <!--Contenedor publicidad/sugerencias--> */}
                <div className="col-xl-4 sugerencias">
                    {/* <!-- Contenedor de contenido --> */}
                    <div className="contenedor_sugerencias sticky-top p-3">
                        {/* <!-- contenedor_sugerencias_seguir --> */}
                        <div className="contenedor_sugerencias_seguir mt-4">
                            <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                                {/* IMAGENES MAS VOTADAS */}
                                <ImagenesMasVotadas />
   
                            </div>
                            {/* <!-- row publicidad --> */}
                            <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                                {/* <!-- Publicidad --> */}
                                <div className="col-8">
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