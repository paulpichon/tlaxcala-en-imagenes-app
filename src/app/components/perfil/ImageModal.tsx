'use client';

import { useState } from "react";
import { Posteo } from "@/types/types";
// Module CSS
import perfil from "../../ui/perfil/perfil.module.css";
// Image nextjs
import Image from "next/image";
// Iconos
import { FiHeart, FiMoreHorizontal } from "react-icons/fi";
// Modal de opciones
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";

interface PropsImageModal {
  isOpen: boolean;
  selectedImage: Posteo | null;
  onClose: () => void;
  // ya no usaremos onNext para abrir opciones, se reemplaza por modal interno
  updateFollowState: (userId: string, isFollowing: boolean) => void;
  updateFavoritoState: (postId: string, isFavorito: boolean) => void;
}

const ImageModal: React.FC<PropsImageModal> = ({
  isOpen,
  selectedImage,
  onClose,
  updateFollowState,
  updateFavoritoState,
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  if (!isOpen || !selectedImage) return null;

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex={-1}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              {/* Botón opciones */}
              <button
                type="button"
                className={`${perfil.btn_opciones_modal_perfil}`}
                aria-label="Options"
                onClick={() => setIsOptionsOpen(true)}
              >
                <FiMoreHorizontal />
              </button>
              {/* Botón para cerrar la ventana */}
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            <div className="contenedor_imagen_expandida">
              <Image
                src={selectedImage.img}
                alt={`${selectedImage._id}`}
                width={800}
                height={600}
                className="img-fluid"
              />
            </div>

            <div className="footer_publicacion">
              <button
                id="likeButton"
                data-post-id={selectedImage._id}
                className={`${perfil.likeButton}`}
              >
                <FiHeart />
              </button>
              <p id="likeCount" className={`d-inline ${perfil.votaciones}`}>
                10009
              </p>
              <strong>Me gusta</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de opciones */}
      <ModalOpcionesPublicacion
        isOpen={isOptionsOpen}
        selectedImage={selectedImage}
        onClose={() => setIsOptionsOpen(false)}
        updateFollowState={updateFollowState}
        updateFavoritoState={updateFavoritoState}
      />
    </>
  );
};

// Export
export default ImageModal;
