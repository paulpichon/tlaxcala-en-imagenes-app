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
import { Posteo, LikeUsuario } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import posteoCard from "../ui/posteos/PosteoCard.module.css";
import { obtenerImagenPerfilUsuario } from "@/lib/cloudinary/obtenerImagenPerfilUsuario";

interface PosteoCardProps {
  post: Posteo;
  isDetail?: boolean;
}

export default function PosteoCard({ post, isDetail = false }: PosteoCardProps) {
  const { fetchWithAuth, user } = useAuth();
  const router = useRouter();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [likesUsuarios, setLikesUsuarios] = useState<LikeUsuario[]>([]);
  const [loaded, setLoaded] = useState(false);

  const openLikesModal = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/likes/${post._id}/likes/usuarios`
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

  //! AGREGADO
  const obtenerTextoUbicacion = () => {
    if (!post.ubicacion) return null;
  
    const { ciudad, estado, pais } = post.ubicacion;
  
    // Puedes ajustar el orden como más te guste
    return [ciudad, estado, pais].filter(Boolean).join(", ");
  };
  //! FIN AGREGADO

  // 🚀 Callback cuando el post fue eliminado
  const handlePostDeleted = () => {
    closeOptions();
    if (isDetail && user) {
      router.push(`/${user.url}`); // 🔄 redirige al perfil del usuario logueado
    }
  };

  const fechaFormateada = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(post.fecha_creacion));

  const postImageUrl = getCloudinaryUrl(
    post.public_id,
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
          <Link href={`/${post._idUsuario.url}`}>
            <Image
              src={obtenerImagenPerfilUsuario(post._idUsuario, "perfil")}
              alt={`Foto de perfil de @${post._idUsuario.url}`}
              width={40}
              height={40}
              className="rounded-circle me-2 border"
            />
          </Link>

          <div className="d-flex flex-column">

            {/* Nombre del usuario */}
            <Link
              className="link_perfil_usuario text-dark text-decoration-none fw-bold"
              href={`/${post._idUsuario.url}`}
            >
              {post._idUsuario.nombre_completo.nombre}{" "}
              {post._idUsuario.nombre_completo.apellido}
            </Link>

            {/* 📍 Mostrar ubicación si existe */}
            {obtenerTextoUbicacion() && (
              <span className="text-muted small d-flex align-items-center">
                <span className="me-1">📍</span>
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
            alt={`Fotografía por @${post._idUsuario.url}, texto: ${post.texto || "Imagen del post"}`  }
            fill={!isDetail}
            width={isDetail ? 1080 : undefined}
            height={isDetail ? 1080 : undefined}
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
            <LikeButton postId={post._id} onOpenLikesModal={openLikesModal} />
          </div>

          <p className="mb-1">
            <Link
              className="link_perfil_usuario text-dark text-decoration-none"
              href={`/${post._idUsuario.url}`}
            >
              <strong className="me-1">
                {post._idUsuario.nombre_completo.nombre}{" "}
                {post._idUsuario.nombre_completo.apellido}
              </strong>
            </Link>
            {post.texto}
          </p>
          <p className="text-muted small mb-0">{fechaFormateada}</p>
        </div>
      </div>

      {/* Modales */}
      <ModalOpcionesPublicacion
        isOpen={isOptionsOpen}
        selectedImage={post}
        onClose={closeOptions}
        onPostDeleted={handlePostDeleted} // ✅ importante
      />

      <ModalLikesUsuarios
        isOpen={isLikesOpen}
        onClose={closeLikesModal}
        usuarios={likesUsuarios}
      />
    </>
  );
}
