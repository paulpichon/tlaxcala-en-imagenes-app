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
import posteoCard from "../ui/posteos/PosteoCard.module.css";
import { obtenerImagenPerfilUsuario } from "@/lib/cloudinary/obtenerImagenPerfilUsuario";

interface PosteoCardProps {
  post: Posteo;
  isDetail?: boolean;
}

export default function PosteoCard({ post, isDetail = false }: PosteoCardProps) {
  const { fetchWithAuth } = useAuth();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [likesUsuarios, setLikesUsuarios] = useState<LikeUsuario[]>([]);
  const [loaded, setLoaded] = useState(false);

  const openLikesModal = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/likes/${post._id}/likes/usuarios`
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

  // ✅ URLs optimizadas de Cloudinary
  const postImageUrl = getCloudinaryUrl(
    post.public_id,
    isDetail ? "detalle" : "feed"
  );
  // const perfilImageUrl = getCloudinaryUrl(
  //   post._idUsuario.imagen_perfil!.public_id,
  //   "perfil"
  // );

  return (
    <>
      <div
        className={`card shadow-sm mb-4 border-0 rounded-3 overflow-hidden ${
          isDetail ? posteoCard.detalleCard : ""
        }`}
      >
        {/* Header */}
        <div className="card-header bg-white d-flex align-items-center border-0">
          <Link href={`/${post._idUsuario.url}`}>
            <Image
              // Se verifica si la imagen viene por default o si el usuario ya ha subido alguna imagen de perfil, despues llama a getCloudinaryUrl para obtener la URL optimizada
              // obtenerImagenPerfilUsuario(usuarioLogueado, preset)
              src={obtenerImagenPerfilUsuario(post._idUsuario, "perfil")}
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
            alt={post.texto}
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
        <div className="card-body bg-white">
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
      />
      <ModalLikesUsuarios
        isOpen={isLikesOpen}
        onClose={closeLikesModal}
        usuarios={likesUsuarios}
      />
    </>
  );
}
