"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import perfil from "../../ui/perfil/perfil.module.css";
import { Posteo, LikeUsuario } from "@/types/types";
import Image from "next/image";
import LikeButton from "../LikeButton";
import ModalLikesUsuarios from "../ModalLikesUsuarios";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface ImageModalProps {
  isOpen: boolean;
  selectedImage: Posteo | null;
  onClose: () => void;
  onNext: () => void;
  updateFollowState?: (userId: string, isFollowing: boolean) => void;
  updateFavoritoState?: (postId: string, isFavorito: boolean) => void;
}

export default function ImageModal({
  isOpen,
  selectedImage,
  onClose,
  onNext,
}: ImageModalProps) {
  const { fetchWithAuth } = useAuth();
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [likesUsuarios, setLikesUsuarios] = useState<LikeUsuario[]>([]);

  if (!isOpen || !selectedImage) return null;
  const autor = selectedImage._idUsuario;

  // 📌 Abrir modal de usuarios que dieron like
  const openLikesModal = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/likes/${selectedImage._id}/likes/usuarios`
      );
      if (!res.ok) return;
      const data = await res.json();
      setLikesUsuarios(data.likes_usuarios_posteo ?? []);
      setIsLikesOpen(true);
    } catch (err) {
      console.error("Error cargando usuarios de likes:", err);
    }
  };
  const closeLikesModal = () => setIsLikesOpen(false);

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
        {/* Botón cerrar fuera del modal */}
        <button
          onClick={onClose}
          className="btn btn-dark position-absolute"
          style={{ top: "15px", right: "25px", zIndex: 2000 }}
        >
          <FiX size={28} />
        </button>

        {/* Contenido principal del modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded shadow-lg d-flex flex-column flex-md-row"
          style={{
            width: "90%",
            maxWidth: "1000px",
            height: "90%",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
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

          {/* Columna derecha: Info */}
          <div
            className="d-flex flex-column p-3"
            style={{ width: "350px", borderLeft: "1px solid #ddd" }}
          >
            {/* Header usuario */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="position-relative" style={{ width: 35, height: 35 }}>
                  <Image
                    src={autor.imagen_perfil?.url || "/default-profile.png"}
                    alt={autor.nombre_completo.nombre}
                    fill
                    className="rounded-circle object-cover"
                  />
                </div>
                <span className="fw-bold">
                  {autor.nombre_completo.nombre} {autor.nombre_completo.apellido}
                </span>
              </div>

              {/* Botón opciones */}
              <button
                className={`${perfil.btn_opciones_publicaciones} btn btn-sm`}
                onClick={onNext}
              >
                ···
              </button>
            </div>

            {/* Texto de la publicación */}
            {selectedImage.texto && (
              <p className="mb-3">{selectedImage.texto}</p>
            )}

            {/* Botones de interacción */}
            <div className="d-flex gap-3 align-items-center mb-3">
              <LikeButton
                postId={selectedImage._id}
                onOpenLikesModal={openLikesModal}
              />
            </div>

            {/* Footer */}
            <div>
              <p
                className="small text-muted mb-1 cursor-pointer"
                onClick={openLikesModal}
              >
                Ver quiénes dieron like ❤️
              </p>
              <p className="small text-muted">
                Publicado el{" "}
                {new Date(selectedImage.fecha_creacion).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Modal de likes */}
        <ModalLikesUsuarios
          isOpen={isLikesOpen}
          onClose={closeLikesModal}
          usuarios={likesUsuarios}
        />
      </motion.div>
    </AnimatePresence>
  );
}
