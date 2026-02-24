// app/components/PosteoCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { FiMoreHorizontal } from "react-icons/fi";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LikeButton from "./LikeButton";
import ModalOpcionesPublicacion from "./ModalOpcionesPublicacion";
import ModalLikesUsuarios from "./ModalLikesUsuarios";
import { Posteo, LikeUsuario, PosteoCardProps } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import posteoCard from "../ui/posteos/PosteoCard.module.css";
import { obtenerImagenPerfilUsuario } from "@/lib/cloudinary/obtenerImagenPerfilUsuario";



export default function PosteoCard({ post, isDetail = false, showUserUrl = false  }: PosteoCardProps) {
  const { fetchWithAuth, user } = useAuth();
  const router = useRouter();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [likesUsuarios, setLikesUsuarios] = useState<LikeUsuario[]>([]);
  const [loaded, setLoaded] = useState(false);

  // ✅ Estado local para el posteo (se actualiza cuando se edita)
  const [posteoActual, setPosteoActual] = useState<Posteo>(post);

  const openLikesModal = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/likes/${posteoActual._id}/likes/usuarios`
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
  const openOptions = () => setIsOptionsOpen(true);
  const closeOptions = () => setIsOptionsOpen(false);

  const obtenerTextoUbicacion = () => {
    if (!posteoActual.ubicacion) return null;
  
    const { ciudad, estado, pais } = posteoActual.ubicacion;
  
    return [ciudad, estado, pais].filter(Boolean).join(", ");
  };

  // 🚀 Callback cuando el post fue eliminado
  const handlePostDeleted = () => {
    closeOptions();
    if (isDetail && user) {
      router.push(`/${user.url}`);
    }
  };

  // ✅ Callback cuando el post fue actualizado
  const handlePostUpdated = (posteoEditado: Posteo) => {
    setPosteoActual(posteoEditado);
  };

  const fechaFormateada = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(posteoActual.fecha_creacion));

  const postImageUrl = getCloudinaryUrl(
    posteoActual.public_id,
    isDetail ? "detalle" : "feed"
  );

  return (
    <>
      <div
        className={`card shadow-sm mb-4 border-0 rounded-3 overflow-hidden ${
          isDetail ? posteoCard.detalleCard : ""
        }`}
      >
        {/* Header */}
        <div className="card-header bg-light d-flex align-items-center border-0">
          <Link href={`/${posteoActual._idUsuario.url}`}>
            <Image
              src={obtenerImagenPerfilUsuario(posteoActual._idUsuario, "perfil")}
              alt={`Foto de perfil de @${posteoActual._idUsuario.url}`}
              width={40}
              height={40}
              className="rounded-circle me-2 border"
            />
          </Link>

          <div className="d-flex flex-column">
          {/* mostrar URL de usuario */}
          <Link
            className="text-dark text-decoration-none fw-bold"
            href={`/${posteoActual._idUsuario.url}`}
          >
            {posteoActual._idUsuario.url}
          </Link>
          <Link  
              className="text-dark text-decoration-none fw-bold"
              href={`/${posteoActual._idUsuario.url}`}
            >
          {/* 👇 Mostrar Nombre del usuario solo si se indica */}
          {showUserUrl && (
            <span className="fw-normal small text-muted">
              {posteoActual._idUsuario.nombre_completo.nombre}{" "}
              {posteoActual._idUsuario.nombre_completo.apellido}
            </span>
          )}
          </Link>

          {/* Ubicación */}
          {obtenerTextoUbicacion() && (
            <span className="text-muted small d-flex align-items-center">
              {/* <span className="me-1">📍</span> // No estoy seguro de poner esto */   } 
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
        <div
          className={`${
            isDetail
              ? "d-flex justify-content-center align-items-center bg-black"
              : "ratio ratio-1x1"
          }`}
          style={
            isDetail
              ? {
                  backgroundColor: "black",
                  maxHeight: "90vh",
                  overflow: "hidden",
                }
              : {}
          }
        >
          <Image
            src={postImageUrl}
            alt={`Fotografía por @${posteoActual._idUsuario.url}, texto: ${posteoActual.texto || "Imagen del post"}`}
            fill={!isDetail}
            width={isDetail ? 1080 : undefined}
            height={isDetail ? 1080 : undefined}
            loading="eager" //Carga inmediatamente
            className={`${
              isDetail ? posteoCard.detalleImagen : "object-fit-cover"
            } ${loaded ? posteoCard.fadeIn : posteoCard.hidden}`}
            priority={isDetail}
            onLoad={() => setLoaded(true)}
          />
        </div>

        {/* Body */}
        <div className="card-body bg-light">
          <div className="d-flex align-items-center mb-2">
            <LikeButton postId={posteoActual._id} onOpenLikesModal={openLikesModal} />
          </div>

          <p className="mb-1">
            <Link
              className="link_perfil_usuario text-dark text-decoration-none"
              href={`/${posteoActual._idUsuario.url}`}
            >
              {/* Mostramos el nombre del usuario(URL del usuario) en todos lados donde se muestre*/}
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
        onPostUpdated={handlePostUpdated} // ✅ Pasar callback
      />

      <ModalLikesUsuarios
        isOpen={isLikesOpen}
        onClose={closeLikesModal}
        usuarios={likesUsuarios}
      />
    </>
  );
}