// app/components/PosteoCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { FiMoreHorizontal } from "react-icons/fi";
import { useState } from "react";
import LikeButton from "./LikeButton";
import ModalOpcionesPublicacion from "./ModalOpcionesPublicacion";
import ModalLikesUsuarios from "./ModalLikesUsuarios";
import { Posteo, LikeUsuario } from "@/types/types";
import { useAuth } from "@/context/AuthContext";

interface PosteoCardProps {
  post: Posteo;
  updateFollowState: (userId: string, isFollowing: boolean) => void;
  updateFavoritoState: (postId: string, isFavorito: boolean) => void;
  isDetail?: boolean; // 👈 para diferenciar entre feed y vista detalle
}

export default function PosteoCard({
  post,
  updateFollowState,
  updateFavoritoState,
  isDetail = false, // por defecto es feed
}: PosteoCardProps) {
  const { fetchWithAuth } = useAuth();

  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [likesUsuarios, setLikesUsuarios] = useState<LikeUsuario[]>([]);

  // Abrir modal de likes
  const openLikesModal = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${post._id}/likes/usuarios`
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

  // Abrir/cerrar modal de opciones
  const openOptions = () => setIsOptionsOpen(true);
  const closeOptions = () => setIsOptionsOpen(false);

  // ✅ Formatear la fecha (ej: 11 de septiembre de 2025, 15:30)
  // Por el momento solo tendremos fecha sin hora
  const fechaFormateada = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    // hour: "2-digit",
    // minute: "2-digit",
  }).format(new Date(post.fecha_creacion));

  return (
    <>
      <div className="card shadow-sm mb-4 border-0 rounded-3 overflow-hidden">
        {/* Header */}
        <div className="card-header bg-white d-flex align-items-center border-0">
          <Link className="link_perfil_img" href={`/${post._idUsuario.url}`}>
            <Image
              src={post._idUsuario.imagen_perfil!.url}
              alt={post.texto}
              title={post.texto}
              width={40}
              height={40}
              className="rounded-circle me-2 border"
            />
          </Link>
          <strong>
            <Link
              className="link_perfil_usuario text-dark text-decoration-none"
              href={`/${post._idUsuario.url}`}
            >
              {post._idUsuario.nombre_completo.nombre}{" "}
              {post._idUsuario.nombre_completo.apellido}
            </Link>
          </strong>

          {/* Botón opciones */}
          <button
            type="button"
            className="btn btn-sm ms-auto"
            aria-label="Options"
            onClick={openOptions}
          >
            <FiMoreHorizontal size={18} />
          </button>
        </div>

        {/* Imagen */}
        <div className="ratio ratio-1x1">
          <Image
            src={post.img}
            alt={post.texto}
            fill
            className="object-fit-cover"
          />
        </div>

        {/* Body */}
        <div className="card-body">
          {/* Likes + acciones */}
          <div className="d-flex align-items-center mb-2">
            <LikeButton postId={post._id} onOpenLikesModal={openLikesModal} />

            {/* {isDetail && (
              <>
                <FiMessageCircle size={22} className="me-3 ms-2 cursor-pointer" />
                <FiSend size={22} className="me-3 cursor-pointer" />
                <FiBookmark size={22} className="cursor-pointer ms-auto" />
              </>
            )} */}
          </div>

          {/* Texto */}
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

          {/* Ubicación solo en detalle */}
          {isDetail && post.texto && (
            <p className="text-muted small mb-1">{post.texto}</p>
          )}

          {/* Fecha */}
          <p className="text-muted small mb-0">{fechaFormateada}</p>
        </div>
      </div>

      {/* Modales */}
      <ModalOpcionesPublicacion
        isOpen={isOptionsOpen}
        selectedImage={post}
        onClose={closeOptions}
        updateFollowState={updateFollowState}
        updateFavoritoState={updateFavoritoState}
      />

      <ModalLikesUsuarios
        isOpen={isLikesOpen}
        onClose={closeLikesModal}
        usuarios={likesUsuarios}
      />
    </>
  );
}
