// Publicaciones de usuario en Grid
"use client";
// UseState
import { useState } from "react";
// Types/interface
import ImageData from "@/app/types/types";
// Image NEXTJS
import Image from "next/image";
// Modal de imagen
import ImageModal from "./ImageModal";
// Segundo modal
import SecondModal from "./SecondModal";

// Images para el grid, estas imagenes son estaticas por el momentos, deben cambiarse por las imagenes traidas por la API
const images: ImageData[] = [
  { id: 1, src: "/imagenes_votadas/votadas1.jpg", title: "Imagen 1", description: "Descripción de la imagen 1" },
  { id: 2, src: "/imagenes_votadas/votadas2.jpg", title: "Imagen 2", description: "Descripción de la imagen 2" },
  // Agrega más imágenes según sea necesario
];

export default function PublicacionesUsuarioGrid() {
    // UseState
    const [selectedImage, setSelectedImage] = useState<{ id: number; src: string } | null>(null);
    
    // codigo nuevo
    const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);
    const [isSecondModalOpen, setIsSecondModalOpen] = useState(false);

    const openFirstModal = (image: ImageData) => {
        setSelectedImage(image); // Selecciona la imagen
        setIsFirstModalOpen(true); // Abre el primer modal
    };
    const closeFirstModal = () => setIsFirstModalOpen(false);
    // const closeFirstModal = () => setIsFirstModalOpen(false);
    
    // const openSecondModal = () => {
    // setIsFirstModalOpen(false); 
    // setIsSecondModalOpen(true); 
    // };
    
    const openSecondModal = () => setIsSecondModalOpen(true);
  
    const closeSecondModal = () => setIsSecondModalOpen(false);

    return (
        <>
            {images.map((image) => (
                // Debemos poner una KEY al elemento padre
                <div key={image.id} className="col-4">
                    <div className="card">
                        <Image 
                            src={image.src}
                            alt={image.title}
                            width={250}
                            height={200}
                            className="imagen_grid_perfil_usuario gallery-image"
                            style={{ cursor: "pointer" }}
                            priority
                            onClick={() => openFirstModal(image)}
                        />
                    </div>
                </div>
            ))}

            {/* Modal para la imagen seleccionada */}
            {selectedImage && (
                // Se pasan 2 parametros al componente, la imagen seleccionada y el evento para cerrar el modal
                <ImageModal
                    isOpen={isFirstModalOpen}
                    selectedImage={selectedImage}
                    onClose={closeFirstModal}
                    onNext={openSecondModal}
                />
            )}
            <SecondModal 
                isOpen={isSecondModalOpen}
                selectedImage={selectedImage}
                onClose={closeSecondModal}
            />
            
        </>
    );
}