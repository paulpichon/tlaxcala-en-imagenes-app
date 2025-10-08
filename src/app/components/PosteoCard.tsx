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
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";

interface PosteoCardProps {
  post: Posteo;
  isDetail?: boolean;
}

export default function PosteoCard({
  post,
  isDetail = false,
}: PosteoCardProps) {
  const { fetchWithAuth } = useAuth();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [likesUsuarios, setLikesUsuarios] = useState<LikeUsuario[]>([]);

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

  const fechaFormateada = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(post.fecha_creacion));

  // ✅ Generar URL dinámica para la imagen del posteo
  const postImageUrl = getCloudinaryUrl(post.public_id, isDetail ? "detalle" : "feed");
  // ✅ Generar URL optimizada para imagen de perfil
  const perfilImageUrl = getCloudinaryUrl(post._idUsuario.imagen_perfil!.public_id, "perfil");

  return (
    <>
      <div className="card shadow-sm mb-4 border-0 rounded-3 overflow-hidden">
        {/* Header */}
        <div className="card-header bg-white d-flex align-items-center border-0">
          <Link className="link_perfil_img" href={`/${post._idUsuario.url}`}>
            <Image
              src={perfilImageUrl}
              alt={post.texto}
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
        <div className="ratio ratio-1x1">
          <Image
            src={postImageUrl}
            alt={post.texto}
            fill
            className="object-fit-cover"
          />
        </div>

        <div className="card-body">
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

      <ModalOpcionesPublicacion
        isOpen={isOptionsOpen}
        selectedImage={post}
        onClose={closeOptions}
      />
      <ModalLikesUsuarios
        isOpen={isLikesOpen}
        onClose={closeLikesModal}
        usuarios={likesUsuarios}
      />
    </>
  );
}
