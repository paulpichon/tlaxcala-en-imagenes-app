'use client';

import { useState } from "react";
import { Posteo } from "@/types/types";
// CSS
import perfil from "../../ui/perfil/perfil.module.css";
// Next Image
import Image from "next/image";
// Icons
import { FiMoreHorizontal } from "react-icons/fi";
// Modal de opciones
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";
// Botón seguir/favorito
import FollowButton from "../FollowButton";
import FavoritoButton from "../FavoritoButton";

interface PropsImageModal {
  isOpen: boolean;
  selectedImage: Posteo | null;
  onClose: () => void;
}

const ImageModal: React.FC<PropsImageModal> = ({
  isOpen,
  selectedImage,
  onClose,
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
                className={perfil.btn_opciones_modal_perfil}
                aria-label="Options"
                onClick={() => setIsOptionsOpen(true)}
              >
                <FiMoreHorizontal />
              </button>
              {/* Botón para cerrar */}
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
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
              {/* Ejemplo de botón de like/favorito */}
              <FavoritoButton
                posteoId={selectedImage._id}
                autorId={selectedImage._idUsuario._id}
                imagenUrl={selectedImage.img}
                initialFavorito={selectedImage.isFavorito}
              />

              {/* Botón de seguir */}
              <FollowButton
                userId={selectedImage._idUsuario._id}
                initialFollowing={selectedImage.isFollowing}
                className={`${selectedImage.isFollowing ? perfil.btn_dejarSeguir_usuario : perfil.btn_seguir_usuario}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de opciones */}
      <ModalOpcionesPublicacion
        isOpen={isOptionsOpen}
        selectedImage={selectedImage}
        onClose={() => setIsOptionsOpen(false)}
      />
    </>
  );
};

export default ImageModal;
