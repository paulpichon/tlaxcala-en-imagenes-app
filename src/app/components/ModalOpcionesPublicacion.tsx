// 📌 ModalOpcionesPublicacion.tsx
'use client';

import { PropsModalOpcionesPublicacion } from "@/types/types";
import perfil from "../ui/perfil/perfil.module.css";
import FollowButton from "./FollowButton";
import FavoritoButton from "./FavoritoButton";

interface ModalOpcionesPublicacionProps extends PropsModalOpcionesPublicacion {
  updateFollowState: (userId: string, isFollowing: boolean) => void;
  updateFavoritoState: (postId: string, isFavorito: boolean) => void;
}

const ModalOpcionesPublicacion: React.FC<ModalOpcionesPublicacionProps> = ({
  isOpen,
  selectedImage,
  onClose,
  updateFollowState,
  updateFavoritoState,
}) => {
  if (!isOpen || !selectedImage) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body">
            <div className="row text-center">
              <div className="col-md-12">
                {/* Botón Seguir/Dejar de seguir */}
                <FollowButton
                  userId={selectedImage._idUsuario._id}
                  initialFollowing={selectedImage.isFollowing}
                  onToggle={(newState) =>
                    updateFollowState(selectedImage._idUsuario._id, newState)
                  }
                />
              </div>

              <div className="col-md-12">
                {/* Botón Añadir/Quitar de favoritos */}
                <FavoritoButton
                  posteoId={selectedImage._id}
                  autorId={selectedImage._idUsuario._id}
                  imagenUrl={selectedImage.img}
                  initialFavorito={selectedImage.isFavorito}
                  onToggle={(newState) =>
                    updateFavoritoState(selectedImage._id, newState)
                  }
                />
              </div>

              <div className="col-md-12">
                <a
                  href={`post/${selectedImage._id}`}
                  type="button"
                  className={`${perfil.btn_opciones_publicaciones}`}
                >
                  Ir a la publicación
                </a>
              </div>

              <div className="col-md-12">
                <a
                  type="button"
                  className={`${perfil.btn_opciones_publicaciones} ${perfil.btn_rojo}`}
                  data-toggle="modal"
                  data-target="#modalDenuncia"
                >
                  Denunciar
                </a>
              </div>

              <div className="col-md-12">
                <button
                  type="button"
                  className={`${perfil.btn_opciones_publicaciones}`}
                  onClick={onClose}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalOpcionesPublicacion;
