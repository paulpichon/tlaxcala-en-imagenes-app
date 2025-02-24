// Publicaciones de usuario en Grid
"use client";
// UseState
import { useState } from "react";
// Module CSS
import perfil from "../../ui/perfil/perfil.module.css";
// Types/interface
import ImageData from "@/app/types/types";
// Image NEXTJS
import Image from "next/image";
// Modal de imagen
import ImageModal from "./ImageModal";
// Modal de opciones de la publicacion: segundo modal
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";

// Images para el grid, estas imagenes son estaticas por el momentos, deben cambiarse por las imagenes traidas por la API
const images: ImageData[] = [
  { id: 1, src: "/imagenes_votadas/votadas1.jpg", title: "Imagen 1", description: "Descripción de la imagen 1" },
  { id: 2, src: "/imagenes_votadas/votadas2.jpg", title: "Imagen 2", description: "Descripción de la imagen 2" },
  // Agrega más imágenes según sea necesario
];

export default function PublicacionesUsuarioGrid() {
    // UseState
    const [selectedImage, setSelectedImage] = useState<{ id: number; src: string } | null>(null);
    
    // PRIMER MODAL
    const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);
    // SEGUNDO MODAL
    const [isSecondModalOpen, setIsSecondModalOpen] = useState(false);
    // Abre el primer modal, con la imagen seleccionada por el usuario
    // Al mismo tiempo que habre el primer modal
    const openFirstModal = (image: ImageData) => {
        setSelectedImage(image); // Selecciona la imagen
        setIsFirstModalOpen(true); // Abre el primer modal
    };
    // Cierra el primer modal
    const closeFirstModal = () => setIsFirstModalOpen(false);
    // Abre el segundo modal
    const openSecondModal = () => setIsSecondModalOpen(true);
    // Cierra el segundo modal
    const closeSecondModal = () => setIsSecondModalOpen(false);

    return (
        <div className="row g-1">
            {images.map((image) => (
                // Debemos poner una KEY al elemento padre
                <div key={image.id} className="col-4">
                    <div className="card">
                        <Image 
                            src={image.src}
                            alt={image.title}
                            width={200}
                            height={200}
                            className={`${perfil.imagen_grid_perfil_usuario} gallery-image`}
                            style={{ cursor: "pointer" }}
                            priority
                            // Se pasa la imagen seleccionada al modal
                            onClick={() => openFirstModal(image)}
                        />
                    </div>
                </div>
            ))}

            {/* Modal para la imagen seleccionada */}
            {selectedImage && (
                // Se pasan 4 parametros al modal
                <ImageModal
                    isOpen={isFirstModalOpen}
                    selectedImage={selectedImage}
                    onClose={closeFirstModal}
                    onNext={openSecondModal}
                />
            )}
            {/* Modal de opciones de publicación */}
            <ModalOpcionesPublicacion 
                isOpen={isSecondModalOpen}
                selectedImage={selectedImage}
                onClose={closeSecondModal}
            />
            
        </div>
    );
}