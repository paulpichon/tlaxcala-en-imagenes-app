'use client';
// UseState
import { useState } from "react";
// Image next
import Image from "next/image";
// Feather Icons
// https://react-icons.github.io/react-icons/icons/fi/
import { FiHeart, FiMoreHorizontal } from "react-icons/fi";
// Modal toldo
// import ModalOpciones from "./ModalOpciones";
// Types/interface
import ImageData from "@/app/types/types";
// Modal opciones de publicación
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";

// Images para el grid, estas imagenes son estaticas por el momentos, deben cambiarse por las imagenes traidas por la API
const images: ImageData[] = [
  { id: 1, src: "/imagenes_votadas/votadas1.jpg", title: "Tania Vaquez", description: "Descripción de la imagen 1" },
  { id: 2, src: "/imagenes_votadas/votadas2.jpg", title: "Magaly Jimenez", description: "Descripción de la imagen 2" },
];

export default function PublicacionUsuario() {
    // UseState
    const [selectedImage, setSelectedImage] = useState<{ id: number; src: string } | null>(null);

    // PRIMER MODAL
    const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);

    // Abre el primer modal, con la imagen seleccionada por el usuario
    // Al mismo tiempo que habre el primer modal
    const openFirstModal = (image: ImageData) => {
        setSelectedImage(image); // Selecciona la imagen
        setIsFirstModalOpen(true); // Abre el primer modal
    };
    // Cierra el primer modal
    const closeFirstModal = () => setIsFirstModalOpen(false);

    return (
        <>
            {images.map((image) => (

                <div key={image.id} className="contenedor_publicaciones">
                    <div className="container-fluid">
                        <div className="contenedor_publicacion">
                            <div className="contenedor_encabezado_publicacion">
                                <div className="row">
                                    <div className="col-3 col-lg-2 d-flex justify-content-center align-items-center">
                                        <a className="link_perfil_img" href="">
                                            <Image 
                                                src={image.src}
                                                className="rounded-circle"
                                                width={500}
                                                height={500}
                                                alt={image.title}
                                                title={image.title}
                                            />
                                        </a>
                                    </div>
                                    <div className="col-7 col-lg-8">
                                        <h5 className="nombre_usuario_publicacion">
                                            <a className="link_perfil_usuario" href="">{image.title}</a>
                                        </h5>
                                        <p className="ubicacion">Tlaxcala, Tlaxcala</p>
                                    </div>
                                    <div className="col-2 col-lg-2 d-flex justify-content-center align-items-center">
                                        {/* boton opciones de publicacion */}
                                        <button
                                            type="button"
                                            className="btn_opciones_modal"
                                            aria-label="Options"
                                            // onClick={onNext}
                                            onClick={() => openFirstModal(image)}
                                        >
                                            <FiMoreHorizontal />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="publicacion_imagen">
                        <Image 
                            src={image.src}
                            width={700}
                            height={500}
                            className="img-fluid img_publicacion"
                            alt={image.title}
                        />
                    </div>
                    <div className="container-fluid">
                        <div className="contenedor_publicacion">
                            <div className="footer_publicacion">
                                <button id="likeButton" data-post-id="POST_ID" className="like-button">
                                    <FiHeart />
                                </button>
                                <p id="likeCount" className="d-inline votaciones">10009</p>
                                <strong className="etiqueta_strong">Me gusta</strong>
                            </div>
                        </div>
                    </div>
                </div>

            ))}

            {/* Modal de opciones de publicación */}
            <ModalOpcionesPublicacion 
                isOpen={isFirstModalOpen}
                selectedImage={selectedImage}
                onClose={closeFirstModal}
            />
        </>
    );

}