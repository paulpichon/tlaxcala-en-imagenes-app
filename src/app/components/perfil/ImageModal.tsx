'use client';

import { useState } from "react";
import { Posteo, LikeUsuario } from "@/types/types";
import perfil from "../../ui/perfil/perfil.module.css";
import Image from "next/image";
import { FiMoreHorizontal } from "react-icons/fi";
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";
import LikeButton from "../LikeButton";
import ModalLikesUsuarios from "../ModalLikesUsuarios";
// import { AuthContext } from "@/context/AuthContext"; // <-- importa tu contexto
import { useAuth } from "@/context/AuthContext";
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
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [usuariosLikes, setUsuariosLikes] = useState<LikeUsuario[]>([]);

  // const { fetchWithAuth } = useContext(AuthContext); // <-- obtiene fetchWithAuth
  const { fetchWithAuth } = useAuth();
  if (!isOpen || !selectedImage) return null;

  const openLikesModal = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/likes/${selectedImage._id}`
      );
      if (!res.ok) throw new Error("Error al obtener usuarios que dieron like");
      const data = await res.json();
      setUsuariosLikes(data.usuarios || []);
      setIsLikesModalOpen(true);
    } catch (err) {
      console.error("Error al cargar likes:", err);
    }
  };

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex={-1}
        onClick={onClose}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          zIndex: 1040,
          overflowY: "auto",
        }}
      >
        <div
          className="modal-dialog modal-dialog-centered modal-xl"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: 1100 }}
        >
          <div
            className="modal-content"
            style={{
              borderRadius: 10,
              overflow: "hidden",
              display: "flex",
              minHeight: 500,
            }}
          >
            <div className="row g-0" style={{ width: "100%" }}>
              {/* Imagen izquierda */}
              <div className="col-md-7 bg-dark d-flex align-items-center justify-content-center">
                <Image
                  src={selectedImage.img}
                  alt={`${selectedImage._id}`}
                  width={900}
                  height={700}
                  className="img-fluid"
                  style={{ objectFit: "contain", maxHeight: "80vh" }}
                />
              </div>

              {/* Panel derecho */}
              <div
                className="col-md-5 d-flex flex-column"
                style={{ maxHeight: "80vh", overflow: "hidden" }}
              >
                {/* Header usuario */}
                <div
                  className="d-flex justify-content-between align-items-center p-3 border-bottom"
                  style={{ flex: "0 0 auto" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <Image
                      src={
                        selectedImage._idUsuario.imagen_perfil?.url ||
                        "/default.png"
                      }
                      alt="perfil"
                      width={40}
                      height={40}
                      className="rounded-circle"
                    />
                    <span className="fw-bold">
                      {selectedImage._idUsuario.nombre_completo?.nombre}{" "}
                      {selectedImage._idUsuario.nombre_completo?.apellido}
                    </span>
                  </div>

                  <div className="d-flex gap-2 align-items-center">
                    <button
                      type="button"
                      className={perfil.btn_opciones_modal_perfil}
                      aria-label="Options"
                      onClick={() => setIsOptionsOpen(true)}
                    >
                      <FiMoreHorizontal />
                    </button>
                  </div>
                </div>

                {/* Contenido / caption y scroll */}
                <div style={{ overflowY: "auto", padding: 16, flex: "1 1 auto" }}>
                  <p style={{ whiteSpace: "pre-wrap" }}>{selectedImage.texto}</p>
                </div>

                {/* Footer con acciones */}
                <div className="p-3 border-top" style={{ flex: "0 0 auto" }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <LikeButton
                        postId={selectedImage._id}
                        onOpenLikesModal={openLikesModal}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 2000,
              borderRadius: "50%",
              background: "#ffffff",
              border: "none",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>✕</span>
          </button>
        </div>
      </div>

      {/* Modales */}
      <ModalOpcionesPublicacion
        isOpen={isOptionsOpen}
        selectedImage={selectedImage}
        onClose={() => setIsOptionsOpen(false)}
      />
      <ModalLikesUsuarios
        isOpen={isLikesModalOpen}
        onClose={() => setIsLikesModalOpen(false)}
        usuarios={usuariosLikes}
      />
    </>
  );
};

export default ImageModal;
