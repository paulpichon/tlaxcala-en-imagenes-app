'use client';

import { PropsModalOpcionesPublicacion } from "@/types/types";
import perfil from "../ui/perfil/perfil.module.css";
import FollowButton from "./FollowButton";

const ModalOpcionesPublicacion: React.FC<PropsModalOpcionesPublicacion> = ({ isOpen, selectedImage, onClose }) => {

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
              {/* Componente buton seguir/dejar de seguir */}
              <FollowButton userId={selectedImage._idUsuario._id} />
              {/* Componente buton seguir/dejar de seguir */}
              </div>
              <div className="col-md-12">
                <a type="button" className={`${perfil.btn_opciones_publicaciones}`} href="#">
                  Añadir a favoritos
                </a>
              </div>
              <div className="col-md-12">
                <a href="#" type="button" className={`${perfil.btn_opciones_publicaciones}`}>
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
                <a
                  type="button"
                  className={`${perfil.btn_opciones_publicaciones}`}
                  onClick={onClose}
                >
                  Cerrar
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export
export default ModalOpcionesPublicacion;
