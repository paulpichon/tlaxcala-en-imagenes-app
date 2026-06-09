'use client';

import { useState, useEffect } from "react";
import { Posteo, LikeUsuario, LikesUsuariosResponse } from "@/types/types";
import perfil from "../../ui/perfil/perfil.module.css";
import Image from "next/image";
import { FiMoreHorizontal, FiX, FiSend } from "react-icons/fi";
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";
import LikeButton from "../LikeButton";
import ModalLikesUsuarios from "../ModalLikesUsuarios";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import { obtenerImagenPerfilUsuario } from "@/lib/cloudinary/obtenerImagenPerfilUsuario";
import { useComentarios } from "@/app/hooks/useComentarios";
import ComentarioItem from "../ComentarioItem";
import { comentarioSchema } from "@/lib/validaciones";
import ToastGlobal from "../ToastGlobal";

interface PropsImageModal {
  isOpen: boolean;
  selectedImage: Posteo | null;
  onClose: () => void;
  onPostDeleted?: (id: string) => void;
  onPostUpdated?: (posteo: Posteo) => void; // ✅ Nueva prop para actualizar posteo
}

const ImageModal: React.FC<PropsImageModal> = ({ 
  isOpen, 
  selectedImage, 
  onClose, 
  onPostDeleted,
  onPostUpdated 
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [usuariosLikes, setUsuariosLikes] = useState<LikeUsuario[]>([]);
  const { fetchWithAuth } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  // ✅ Estado local para el posteo (se actualiza cuando se edita)
  const [posteoActual, setPosteoActual] = useState<Posteo | null>(selectedImage);

  // ✅ Sincronizar cuando cambia selectedImage
  useEffect(() => {
    setPosteoActual(selectedImage);
  }, [selectedImage]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fechaFormateada = posteoActual
    ? new Date(posteoActual.fecha_creacion).toLocaleDateString()
    : "";

  const postImageUrl = posteoActual
    ? getCloudinaryUrl(posteoActual.public_id, "custom", {
        width: 1400,
        height: 1400,
        crop: "limit",
        background: "black",
        quality: 90,
        useAutoTransforms: false,
      })
    : "";

  const openLikesModal = async () => {
    if (!posteoActual) return;
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/likes/${posteoActual._id}/likes/usuarios`
      );
      if (!res.ok) throw new Error("Error al obtener usuarios que dieron like");

      const data: LikesUsuariosResponse = await res.json();
      setUsuariosLikes(data.likes_usuarios_posteo || []);
      setIsLikesModalOpen(true);
    } catch (err) {
      console.error("Error al cargar likes:", err);
    }
  };

  const obtenerTextoUbicacion = () => {
    if (!posteoActual?.ubicacion) return null;
  
    const { ciudad, estado, pais } = posteoActual.ubicacion;
  
    return [ciudad, estado, pais].filter(Boolean).join(", ");
  };

  const {
    comentarios,
    total,
    loadingList,
    loadingMore,
    hasMore,
    fetchComentarios,
    cargarMasComentarios,
    agregarComentario,
    eliminarComentario,
  } = useComentarios(posteoActual?._id || "");

  const [comentarioTexto, setComentarioTexto] = useState("");
  const [sendingComentario, setSendingComentario] = useState(false);
  const [toastComentario, setToastComentario] = useState<{ message: string; type: "success" | "danger" } | null>(null);

  useEffect(() => {
    if (isOpen && posteoActual?._id) {
      fetchComentarios();
    }
  }, [isOpen, fetchComentarios]);

  const handleEliminarComentario = async (commentId: string) => {
    const ok = await eliminarComentario(commentId);
    if (!ok) {
      setToastComentario({ message: "Error al eliminar comentario", type: "danger" });
    }
    return ok;
  };

  const handleEnviarComentario = async () => {
    const result = comentarioSchema.safeParse({ texto: comentarioTexto });
    if (!result.success) {
      setToastComentario({
        message: result.error.issues[0]?.message || "Comentario inválido",
        type: "danger",
      });
      return;
    }

    setSendingComentario(true);
    const ok = await agregarComentario(result.data.texto);
    setSendingComentario(false);

    if (ok) {
      setComentarioTexto("");
    } else {
      setToastComentario({ message: "Error al publicar comentario", type: "danger" });
    }
  };

  const handleKeyDownComentario = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviarComentario();
    }
  };

  const renderComentariosList = () => {
    if (loadingList) {
      return <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-secondary" role="status" /></div>;
    }
    if (comentarios.length === 0) {
      return <p className="text-muted small text-center py-2">Sin comentarios</p>;
    }
    return (
      <>
        {comentarios.map((c) => (
          <ComentarioItem key={c._id} comentario={c} onDelete={handleEliminarComentario} posteoAutorId={posteoActual?._idUsuario._id} />
        ))}
        {hasMore && (
          <div className="text-center py-2">
            <button
              onClick={cargarMasComentarios}
              disabled={loadingMore}
              className="btn btn-sm btn-outline-secondary"
            >
              {loadingMore ? (
                <span className="spinner-border spinner-border-sm" role="status" />
              ) : (
                "Cargar más"
              )}
            </button>
          </div>
        )}
      </>
    );
  };

  // ✅ Función para actualizar el posteo localmente
  const handlePosteoActualizado = (posteoEditado: Posteo) => {
    setPosteoActual(posteoEditado);
    // ✅ Propagar al componente padre si existe el callback
    if (onPostUpdated) {
      onPostUpdated(posteoEditado);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && posteoActual && (
        <motion.div
          key="image-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}
        >
        <button
          onClick={onClose}
          className="btn btn-dark position-absolute"
          style={{ top: "15px", right: "25px", zIndex: 1050 }}
        >
          <FiX size={28} />
        </button>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded shadow-lg d-flex flex-column flex-md-row"
          style={{
            width: isMobile ? "95%" : "90%",
            maxWidth: isMobile ? "500px" : "1000px",
            height: isMobile ? "85%" : "90%",
            overflow: "hidden",
          }}
          onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          {isMobile ? (
            <div className="d-flex flex-column" style={{ height: "100%", overflow: "hidden" }}>
              <div className="d-flex justify-content-between align-items-center p-2 border-bottom bg-white flex-shrink-0">
                <div className="d-flex align-items-center gap-2">
                  <Image
                    priority
                    key={posteoActual._id}
                    src={obtenerImagenPerfilUsuario(posteoActual._idUsuario, "mini")}
                    alt={`Imagen de perfil de @${posteoActual._idUsuario.url}`}
                    width={40}
                    height={40}
                    className="rounded-circle me-2 border"
                  />
                  <span className="text-dark text-decoration-none fw-bold">
                    {posteoActual._idUsuario.url}
                  </span>
                  {obtenerTextoUbicacion() && (
                    <span className="text-muted small d-flex align-items-center ms-2">
                      {obtenerTextoUbicacion()}
                    </span>
                  )}
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

              <div
                className="bg-black position-relative d-flex justify-content-center align-items-center flex-shrink-0"
                style={{ width: "100%", height: "35vh", overflow: "hidden" }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-100 h-100 position-relative"
                >
                  <Image
                    src={postImageUrl}
                    alt={`Posteo de @${posteoActual._idUsuario.url}, texto: ${posteoActual.texto || "Imagen del post"}`}
                    fill
                    priority
                    sizes="100vw"
                    className="object-contain"
                    style={{ objectFit: "contain" }}
                  />
                </motion.div>
              </div>

              <div className="bg-white px-3 py-2 border-bottom flex-shrink-0">
                <div className="d-flex gap-3 align-items-center mb-2">
                  <LikeButton postId={posteoActual._id} onOpenLikesModal={openLikesModal} />
                </div>
                <p className="mb-1">
                  <span className="fw-bold text-dark">
                      {posteoActual._idUsuario.url} {" "}
                  </span>
                  {posteoActual.texto}
                </p>
                <p className="text-muted small mb-0">{fechaFormateada}</p>
              </div>

              {posteoActual.comentariosActivos !== false && (
                <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }} className="bg-white px-3">
                  <small className="fw-bold text-muted d-block py-1">
                    {total} {total === 1 ? "comentario" : "comentarios"}
                  </small>
                  {renderComentariosList()}
                </div>
              )}

              {posteoActual.comentariosActivos !== false && (
                <div className="d-flex align-items-center bg-white px-3 py-2 border-top flex-shrink-0">
                  <input
                    className="form-control form-control-sm border-0 shadow-none"
                    placeholder="Escribe un comentario..."
                    maxLength={250}
                    value={comentarioTexto}
                    onChange={(e) => setComentarioTexto(e.target.value)}
                    onKeyDown={handleKeyDownComentario}
                    disabled={sendingComentario}
                    style={{ fontSize: "0.85rem" }}
                  />
                  <button
                    onClick={handleEnviarComentario}
                    disabled={sendingComentario || !comentarioTexto.trim()}
                    className="btn btn-sm"
                    style={{ background: "none", border: "none", color: "#EBCA9A" }}
                  >
                    {sendingComentario ? (
                      <span className="spinner-border spinner-border-sm" role="status" />
                    ) : (
                      <FiSend size={18} />
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div
                className="flex-grow-1 bg-black position-relative d-flex justify-content-center align-items-center"
                style={{ width: "auto", height: "100%", minHeight: "400px", maxHeight: "90vh", overflow: "hidden" }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-100 h-100 position-relative"
                >
                  <Image
                    src={postImageUrl}
                    alt={`Posteo de @${posteoActual._idUsuario.url}, texto: ${posteoActual.texto || "Imagen del post"}`}
                    fill
                    priority
                    sizes="60vw"
                    className="object-contain"
                    style={{ objectFit: "contain" }}
                  />
                </motion.div>
              </div>

              <div
                className="d-flex flex-column bg-white"
                style={{ width: "350px", borderLeft: "1px solid #ddd", height: "100%" }}
              >
                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className="position-relative" style={{ width: 35, height: 35 }}>
                        <Image
                          priority
                          key={posteoActual._id}
                          src={obtenerImagenPerfilUsuario(posteoActual._idUsuario, "mini")}
                          alt={`Imagen de perfil de @${posteoActual._idUsuario.url}`}
                          width={40}
                          height={40}
                          className="rounded-circle me-2 border"
                        />
                      </div>
                      <div className="d-flex flex-column">
                        <span className="text-dark text-decoration-none fw-bold">
                          {posteoActual._idUsuario.url}
                        </span>
                        {obtenerTextoUbicacion() && (
                          <span className="text-muted small d-flex align-items-center">
                            {obtenerTextoUbicacion()}
                          </span>
                        )}
                      </div>
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

                  <p className="mb-1">
                    <span className="fw-bold text-dark">
                        {posteoActual._idUsuario.url} {" "}
                    </span>
                    {posteoActual.texto}
                  </p>
                </div>

                {posteoActual.comentariosActivos !== false && (
                  <div className="flex-grow-1 overflow-auto px-3" style={{ minHeight: 0 }}>
                    <small className="fw-bold text-muted d-block mb-1">
                      {total} {total === 1 ? "comentario" : "comentarios"}
                    </small>
                    {renderComentariosList()}
                  </div>
                )}

                {posteoActual.comentariosActivos !== false && (
                  <div className="d-flex align-items-center px-3 py-2 border-top">
                    <input
                      className="form-control form-control-sm border-0 shadow-none"
                      placeholder="Escribe un comentario..."
                      maxLength={250}
                      value={comentarioTexto}
                      onChange={(e) => setComentarioTexto(e.target.value)}
                      onKeyDown={handleKeyDownComentario}
                      disabled={sendingComentario}
                      style={{ fontSize: "0.85rem" }}
                    />
                    <button
                      onClick={handleEnviarComentario}
                      disabled={sendingComentario || !comentarioTexto.trim()}
                      className="btn btn-sm"
                      style={{ background: "none", border: "none", color: "#EBCA9A" }}
                    >
                      {sendingComentario ? (
                        <span className="spinner-border spinner-border-sm" role="status" />
                      ) : (
                        <FiSend size={18} />
                      )}
                    </button>
                  </div>
                )}

                <div className={`px-3 py-2 ${posteoActual.comentariosActivos !== false ? "border-top" : ""}`}>
                  <div className="d-flex gap-3 align-items-center mb-2">
                    <LikeButton postId={posteoActual._id} onOpenLikesModal={openLikesModal} />
                  </div>
                  <p className="text-muted small mb-0">{fechaFormateada}</p>
                </div>
              </div>
            </>
          )}
        </motion.div>

        <ModalOpcionesPublicacion
          isOpen={isOptionsOpen}
          selectedImage={posteoActual}
          onClose={() => setIsOptionsOpen(false)}
          onPostDeleted={() => {
            setIsOptionsOpen(false);
            onClose();
            if (onPostDeleted && posteoActual?._id) {
              onPostDeleted(posteoActual._id);
            }
          }}
          onPostUpdated={handlePosteoActualizado} // ✅ Pasar callback
        />

        <ModalLikesUsuarios
          isOpen={isLikesModalOpen}
          onClose={() => setIsLikesModalOpen(false)}
          usuarios={usuariosLikes}
        />

        {toastComentario && (
          <ToastGlobal
            message={toastComentario.message}
            type={toastComentario.type}
            onClose={() => setToastComentario(null)}
          />
        )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageModal;