'use client';

import { useState, useEffect } from "react";
import { Posteo, LikeUsuario, LikesUsuariosResponse } from "@/types/types";
import perfil from "../../ui/perfil/perfil.module.css";
import Image from "next/image";
import { FiMoreHorizontal, FiX } from "react-icons/fi";
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";
import LikeButton from "../LikeButton";
import ModalLikesUsuarios from "../ModalLikesUsuarios";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isMobile, setIsMobile] = useState(false);

  const { fetchWithAuth } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  if (!isOpen || !selectedImage) return null;

  // Función para abrir modal de usuarios que dieron like
  const openLikesModal = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/likes/${selectedImage._id}/likes/usuarios`
      );
      if (!res.ok) throw new Error("Error al obtener usuarios que dieron like");

      const data: LikesUsuariosResponse = await res.json();
      setUsuariosLikes(data.likes_usuarios_posteo || []);
      setIsLikesModalOpen(true);
    } catch (err) {
      console.error("Error al cargar likes:", err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.8)",
          zIndex: 1050,
        }}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="btn btn-dark position-absolute"
          style={{ top: "15px", right: "25px", zIndex: 2000 }}
        >
          <FiX size={28} />
        </button>

        {/* Contenido modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded shadow-lg d-flex flex-column flex-md-row"
          style={{
            width: isMobile ? "95%" : "90%",
            maxWidth: isMobile ? "500px" : "1000px",
            height: isMobile ? "70%" : "90%",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header móvil arriba de la imagen */}
          {isMobile && (
            <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <div className="position-relative" style={{ width: 35, height: 35 }}>
                  <Image
                    src={selectedImage._idUsuario.imagen_perfil?.url || "/default.png"}
                    alt="perfil"
                    fill
                    className="rounded-circle object-cover"
                  />
                </div>
                <span className="fw-bold">
                  {selectedImage._idUsuario.nombre_completo.nombre}{" "}
                  {selectedImage._idUsuario.nombre_completo.apellido}
                </span>
              </div>
              <button
                type="button"
                className={perfil.btn_opciones_modal_perfil}
                aria-label="Options"
                onClick={() => setIsOptionsOpen(true)}
              >
                <FiMoreHorizontal />
              </button>
            </div>
          )}

          {/* Columna izquierda: Imagen */}
          <div className="flex-grow-1 bg-black position-relative">
            <Image
              src={selectedImage.img}
              alt={selectedImage.texto}
              fill
              priority
              className="object-contain"
            />
          </div>

          {/* Columna derecha: Info (solo en escritorio) */}
          {!isMobile && (
            <div
              className="d-flex flex-column p-3"
              style={{ width: "350px", borderLeft: "1px solid #ddd" }}
            >
              {/* Header usuario */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="position-relative" style={{ width: 35, height: 35 }}>
                    <Image
                      src={selectedImage._idUsuario.imagen_perfil?.url || "/default.png"}
                      alt="perfil"
                      fill
                      className="rounded-circle object-cover"
                    />
                  </div>
                  <span className="fw-bold">
                    {selectedImage._idUsuario.nombre_completo.nombre}{" "}
                    {selectedImage._idUsuario.nombre_completo.apellido}
                  </span>
                </div>

                {/* Botón opciones */}
                <button
                  type="button"
                  className={perfil.btn_opciones_modal_perfil}
                  aria-label="Options"
                  onClick={() => setIsOptionsOpen(true)}
                >
                  <FiMoreHorizontal />
                </button>
              </div>

              {/* Texto publicación */}
              {selectedImage.texto && <p className="mb-3">{selectedImage.texto}</p>}

              {/* Botones interacción */}
              <div className="d-flex gap-3 align-items-center mb-3">
                <LikeButton
                  postId={selectedImage._id}
                  onOpenLikesModal={openLikesModal}
                />
              </div>

              {/* Footer */}
              <div>
                <p className="small text-muted">
                  Publicado el{" "}
                  {new Date(selectedImage.fecha_creacion).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Footer móvil debajo de la imagen */}
          {isMobile && (
            <div className="p-2 border-top">
              {selectedImage.texto && <p className="mb-2">{selectedImage.texto}</p>}
              <div className="d-flex gap-3 align-items-center mb-2">
                <LikeButton
                  postId={selectedImage._id}
                  onOpenLikesModal={openLikesModal}
                />
              </div>
              <p className="small text-muted mb-0">
                Publicado el{" "}
                {new Date(selectedImage.fecha_creacion).toLocaleDateString()}
              </p>
            </div>
          )}
        </motion.div>

        {/* Modales secundarios */}
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
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageModal;
