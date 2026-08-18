"use client";

import Image from "next/image";
import Link from "next/link";
import { FiMoreHorizontal, FiMessageCircle } from "react-icons/fi";
import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import LikeButton from "./LikeButton";
import ModalOpcionesPublicacion from "./ModalOpcionesPublicacion";
import ModalLikesUsuarios from "./ModalLikesUsuarios";
import { Posteo, LikeUsuario, PosteoCardProps, ApiResponse } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import { apiGet, isNotFound, getUserMessage } from "@/lib/apiClient";
import posteoCard from "../ui/posteos/PosteoCard.module.css";
import { obtenerImagenPerfilUsuario } from "@/lib/cloudinary/obtenerImagenPerfilUsuario";
import { avatarPerfilLoader, feedLoader, detalleLoader } from "@/lib/cloudinary/cloudinaryLoader";
import { useComentarios } from "@/app/hooks/useComentarios";
import ComentariosModal from "./ComentariosModal";
import ComentariosSection from "./posteo/ComentariosSection";



export default function PosteoCard({ post, isDetail = false, showUserUrl = false  }: PosteoCardProps) {
  const { fetchWithAuth, user } = useAuth();
  const router = useRouter();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [likesUsuarios, setLikesUsuarios] = useState<LikeUsuario[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [posteoActual, setPosteoActual] = useState<Posteo>(post);

  const { total: totalComentarios } = useComentarios(post._id);
  const [showComments, setShowComments] = useState(false);

  const isPublicView = !user;

  const openLikesModal = async () => {
    if (!user) return;
    try {
      const data = await apiGet<ApiResponse<{ likes_usuarios_posteo: LikeUsuario[] }>>(
        fetchWithAuth,
        `/api/likes/${posteoActual._id}/likes/usuarios`
      );
      setLikesUsuarios(data.data.likes_usuarios_posteo ?? []);
      setIsLikesOpen(true);
    } catch (err) {
      if (isNotFound(err)) {
        console.warn("El posteo no existe al cargar usuarios de likes");
      } else {
        const msg = getUserMessage(err, 'like');
        console.error(msg, err);
      }
    }
  };

  const closeLikesModal = () => setIsLikesOpen(false);
  const openOptions = () => setIsOptionsOpen(true);
  const closeOptions = () => setIsOptionsOpen(false);

  const obtenerTextoUbicacion = () => {
    if (!posteoActual.ubicacion) return null;
  
    const { ciudad, estado, pais } = posteoActual.ubicacion;
  
    return [ciudad, estado, pais].filter(Boolean).join(", ");
  };

  const handlePostDeleted = () => {
    closeOptions();
    if (isDetail && user) {
      router.push(`/${user.url}`);
    }
  };

  const handlePostUpdated = (posteoEditado: Posteo) => {
    setPosteoActual(posteoEditado);
  };

  const fechaFormateada = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(posteoActual.fecha_creacion));

  const postImageLoader = isDetail ? detalleLoader : feedLoader;

  const displayedCommentsCount = isPublicView
    ? (posteoActual.comentariosCount ?? 0)
    : totalComentarios;

  const displayedLikesCount = posteoActual.likesCount ?? 0;

  return (
    <>
      <div
        className={`card shadow-sm mb-4 border-0 rounded-3 overflow-hidden ${
          isDetail ? posteoCard.detalleCard : ""
        }`}
      >
        {/* Header */}
        <div className="card-header bg-light d-flex align-items-center border-0">
          <Link 
            href={`/${posteoActual._idUsuario.url}`}
            aria-label={`Perfil de ${posteoActual._idUsuario.url}`}
            >
            <Image
              src={obtenerImagenPerfilUsuario(posteoActual._idUsuario)}
              loader={avatarPerfilLoader}
              alt={`Foto de perfil de @${posteoActual._idUsuario.url}`}
              width={40}
              height={40}
              className="rounded-circle me-2 border"
            />
          </Link>

          <div className="d-flex flex-column">
          <Link
            className="text-dark text-decoration-none fw-bold"
            href={`/${posteoActual._idUsuario.url}`}
            aria-label={`Perfil de ${posteoActual._idUsuario.url}`}
          >
            {posteoActual._idUsuario.url}
          </Link>
          {showUserUrl && (
            <Link  
                className="text-dark text-decoration-none fw-bold"
                href={`/${posteoActual._idUsuario.url}`}
                aria-label={`Perfil de ${posteoActual._idUsuario.url}`}
              >
              <span className="fw-normal small text-muted">
                {posteoActual._idUsuario.nombre_completo.nombre}{" "}
                {posteoActual._idUsuario.nombre_completo.apellido}
              </span>
            </Link>
          )}

          {obtenerTextoUbicacion() && (
            <span className="text-muted small d-flex align-items-center">
              {obtenerTextoUbicacion()}
            </span>
          )}
        </div>


          <button
            type="button"
            className="btn btn-sm ms-auto"
            aria-label="Options"
            onClick={openOptions}
          >
            <FiMoreHorizontal size={18} />
          </button>
        </div>

        {/* Imagen del post */}
        {isDetail ? (
          <div
            className="d-flex justify-content-center align-items-center bg-black"
            style={{ backgroundColor: "black", maxHeight: "90vh", overflow: "hidden" }}
          >
            <Image
              src={posteoActual.public_id}
              loader={postImageLoader}
              alt={`Fotografía por @${posteoActual._idUsuario.url}, texto: ${posteoActual.texto || "Imagen del post"}`}
              fill={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 600px"
              width={1080}
              height={1080}
              loading="eager"
              className={`${posteoCard.detalleImagen} ${loaded ? posteoCard.fadeIn : posteoCard.hidden}`}
              priority
              onLoad={() => setLoaded(true)}
            />
          </div>
        ) : (
          <Link
            href={`/posteo/${posteoActual._id}`}
            className="ratio ratio-1x1 d-block"
            style={{ "--bs-aspect-ratio": "125%" } as CSSProperties}
            aria-label="Ver publicación completa"
          >
            <Image
              src={posteoActual.public_id}
              loader={postImageLoader}
              alt={`Fotografía por @${posteoActual._idUsuario.url}, texto: ${posteoActual.texto || "Imagen del post"}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 600px"
              loading="eager"
              className={`object-fit-cover ${loaded ? posteoCard.fadeIn : posteoCard.hidden}`}
              onLoad={() => setLoaded(true)}
            />
          </Link>
        )}

        {/* Body */}
        <div className="card-body bg-light">
          <div className="d-flex align-items-center gap-3 mb-2">
            <LikeButton
              postId={posteoActual._id}
              likesCount={posteoActual.likesCount}
              hasLiked={posteoActual.hasLiked}
              onOpenLikesModal={isPublicView ? undefined : openLikesModal}
              readOnly={isPublicView}
            />

            <button
              onClick={() => !isPublicView && setShowComments(true)}
              className="like-button"
              aria-label="Comentar"
              disabled={isPublicView || posteoActual.comentariosActivos === false}
            >
              <FiMessageCircle
                size={24}
                color={
                  isPublicView || posteoActual.comentariosActivos === false
                    ? "#ccc"
                    : "black"
                }
              />
            </button>
            <span
              className={`small ${posteoActual.comentariosActivos === false ? "text-muted" : ""}`}
              style={{ cursor: isPublicView ? "default" : "pointer" }}
              onClick={() => !isPublicView && posteoActual.comentariosActivos !== false && setShowComments(true)}
            >
              {posteoActual.comentariosActivos === false
                ? "Comentarios desactivados"
                : `${displayedCommentsCount} ${displayedCommentsCount === 1 ? "comentario" : "comentarios"}`}
            </span>
          </div>

          <p className="mb-1">
            <Link
              className="link_perfil_usuario text-dark text-decoration-none"
              href={`/${posteoActual._idUsuario.url}`}
              aria-label={`Perfil de ${posteoActual._idUsuario.url}`}
            >
              <strong className="me-1">
                { posteoActual._idUsuario.url }
              </strong>
            </Link>
            {posteoActual.texto}
          </p>
          <p className="text-muted small mb-0">{fechaFormateada}</p>
        </div>
      </div>

      {/* Modales */}
      <ModalOpcionesPublicacion
        isOpen={isOptionsOpen}
        selectedImage={posteoActual}
        onClose={closeOptions}
        onPostDeleted={handlePostDeleted}
        onPostUpdated={handlePostUpdated}
      />

      {!isPublicView && (
        <ModalLikesUsuarios
          isOpen={isLikesOpen}
          onClose={closeLikesModal}
          usuarios={likesUsuarios}
        />
      )}

      {!isDetail && !isPublicView && (
        <ComentariosModal
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          postId={posteoActual._id}
          comentariosActivos={posteoActual.comentariosActivos}
          posteoAutorId={posteoActual._idUsuario._id}
        />
      )}

      {isDetail && !isPublicView && (
        <ComentariosSection
          postId={posteoActual._id}
          comentariosActivos={posteoActual.comentariosActivos}
          posteoAutorId={posteoActual._idUsuario._id}
        />
      )}
    </>
  );
}
