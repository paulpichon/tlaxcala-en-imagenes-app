
'use client';
// Image next
import Image from "next/image";
// Feather Icons
// https://react-icons.github.io/react-icons/icons/fi/
import { FiHeart } from "react-icons/fi";
// Modal toldo
import ModalOpciones from "./ModalOpciones";
// import ModalOpciones from "../components/inicio/ModalOpciones";

export default function PublicacionUsuario() {

    return (
        <>
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
        </>
    );

}