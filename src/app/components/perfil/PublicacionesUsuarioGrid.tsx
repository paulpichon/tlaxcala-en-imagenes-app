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

// Images para el grid, estas imagenes son estaticas por el momentos, deben cambiarse por las imagenes traidas por la API
const images: ImageData[] = [
  { id: 1, src: "/imagenes_votadas/votadas1.jpg", title: "Imagen 1", description: "Descripción de la imagen 1" },
  { id: 2, src: "/imagenes_votadas/votadas2.jpg", title: "Imagen 2", description: "Descripción de la imagen 2" },
  // Agrega más imágenes según sea necesario
];

export default function PublicacionesUsuarioGrid() {
    // UseState
    const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
    // Manejar el evento al hacer click en una imagen del grid
    const handleImageClick = (image: ImageData) => {
        setSelectedImage(image);
      };
    // Evento para cerrar el modal
    const closeModal = () => {
    setSelectedImage(null);
    };

    return (
        <>
            {images.map((image) => (
                // Debemos poner una KEY al elemento padre
                <div key={image.id} className="col-4">
                    <div className="card" onClick={() => handleImageClick(image)}>
                        <Image 
                            src={image.src}
                            alt={image.title}
                            width={250}
                            height={200}
                            className="imagen_grid_perfil_usuario gallery-image"
                            style={{ cursor: "pointer" }}
                            priority
                        />
                    </div>
                </div>
            ))}

            {/* Modal para la imagen seleccionada */}
            {selectedImage && (
                // Se pasan 2 parametros al componente, la imagen seleccionada y el evento para cerrar el modal
                <ImageModal
                    image={selectedImage}
                    onClose={closeModal}
                />
            )}
            
        </>
    );
}