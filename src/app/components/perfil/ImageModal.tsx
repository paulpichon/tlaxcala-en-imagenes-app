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
import Link from "next/link";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import { obtenerImagenPerfilUsuario } from "@/lib/cloudinary/obtenerImagenPerfilUsuario";

interface PropsImageModal {
  isOpen: boolean;
  selectedImage: Posteo | null;
  onClose: () => void;
  onPostDeleted?: (id: string) => void; // ✅ nueva prop
}

const ImageModal: React.FC<PropsImageModal> = ({ isOpen, selectedImage, onClose, onPostDeleted }) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [usuariosLikes, setUsuariosLikes] = useState<LikeUsuario[]>([]);
  const { fetchWithAuth } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isOpen || !selectedImage) return null;

  const fechaFormateada = new Date(selectedImage.fecha_creacion).toLocaleDateString();

  // ✅ Imagen principal del post (versión responsiva, sin recortes)
  const postImageUrl = getCloudinaryUrl(selectedImage.public_id, "custom", {
    width: 1400,
    height: 1400,
    crop: "limit",
    background: "black",
    quality: 90,
    useAutoTransforms: false,
  });
  // 🔹 Abrir modal de usuarios que dieron like
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
        style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="btn btn-dark position-absolute"
          style={{ top: "15px", right: "25px", zIndex: 1050 }}
        >
          <FiX size={28} />
        </button>

        {/* Contenedor modal principal */}
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
          onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          {/* Header móvil arriba de la imagen */}
          {isMobile && (
            <div className="d-flex justify-content-between align-items-center p-2 border-bottom bg-white">
              <div className="d-flex align-items-center gap-2">
                <Image
                  // Se verifica si la imagen viene por default o si el usuario ya ha subido alguna imagen de perfil, despues llama a getCloudinaryUrl para obtener la URL optimizada
                  // obtenerImagenPerfilUsuario(usuarioLogueado, preset)
                  src={obtenerImagenPerfilUsuario(selectedImage._idUsuario, "mini")}
                  alt={selectedImage.texto}
                  width={40}
                  height={40}
                  className="rounded-circle me-2 border"
                />
                <span className="fw-bold text-dark">
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
          <div
            className="flex-grow-1 bg-black position-relative d-flex justify-content-center align-items-center"
            style={{
              width: isMobile ? "100%" : "auto",
              height: isMobile ? "100%" : "100%",
              minHeight: isMobile ? "250px" : "400px",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-100 h-100 position-relative"
            >
              <Image
                src={postImageUrl}
                alt={selectedImage.texto}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-contain"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </motion.div>
          </div>

          {/* Columna derecha: Info (solo escritorio) */}
          {!isMobile && (
            <div
              className="d-flex flex-column p-3 bg-white"
              style={{ width: "350px", borderLeft: "1px solid #ddd", height: "100%" }}
            >
              {/* Parte superior: Header y texto */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="position-relative" style={{ width: 35, height: 35 }}>
                      <Image
                        src={obtenerImagenPerfilUsuario(selectedImage._idUsuario, "mini")}
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

                <p className="mb-2">
                  <Link
                    className="link_perfil_usuario text-dark text-decoration-none"
                    href={`/${selectedImage._idUsuario.url}`}
                  >
                    <strong className="me-1">
                      {selectedImage._idUsuario.nombre_completo.nombre}{" "}
                      {selectedImage._idUsuario.nombre_completo.apellido}
                    </strong>
                  </Link>
                  {selectedImage.texto}
                </p>
              </div>

              {/* Parte inferior: Like y fecha */}
              <div className="mt-auto">
                <div className="d-flex gap-3 align-items-center mb-2">
                  <LikeButton postId={selectedImage._id} onOpenLikesModal={openLikesModal} />
                </div>
                <p className="text-muted small mb-0">{fechaFormateada}</p>
              </div>
            </div>
          )}

          {/* Footer móvil debajo de la imagen */}
          {isMobile && (
            <div className="p-3 border-top bg-white">
              <div className="d-flex gap-3 align-items-center mb-2">
                <LikeButton postId={selectedImage._id} onOpenLikesModal={openLikesModal} />
              </div>
              <p className="mb-1">
                <Link
                  className="link_perfil_usuario text-dark text-decoration-none"
                  href={`/${selectedImage._idUsuario.url}`}
                >
                  <strong className="me-1">
                    {selectedImage._idUsuario.nombre_completo.nombre}{" "}
                    {selectedImage._idUsuario.nombre_completo.apellido}
                  </strong>
                </Link>
                {selectedImage.texto}
              </p>
              <p className="text-muted small mb-0">{fechaFormateada}</p>
            </div>
          )}
        </motion.div>

        <ModalOpcionesPublicacion
          isOpen={isOptionsOpen}
          selectedImage={selectedImage}
          onClose={() => setIsOptionsOpen(false)}
          onPostDeleted={() => {
            setIsOptionsOpen(false);
            onClose(); // ✅ cerrar modal principal
            if (onPostDeleted && selectedImage?._id) {
              onPostDeleted(selectedImage._id); // ✅ notificar al padre para quitarlo del grid
            }
          }}
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
