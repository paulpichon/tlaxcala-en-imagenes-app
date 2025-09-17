// app/components/PosteoDetalle.tsx
'use client';

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiMoreHorizontal } from "react-icons/fi";

// import Spinner from "./spinner";
import LikeButton from "./LikeButton";
import ModalOpcionesPublicacion from "./ModalOpcionesPublicacion";
import ModalLikesUsuarios from "./ModalLikesUsuarios";

import { PosteoDetalleResponse, Posteo } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import Spinner from "./spinner";
import { useLikesModal } from "../hooks/useLikesModal";

export default function PosteoDetalle() {
  const params = useParams() as { idposteo?: string } | null;
  const id = params?.idposteo ?? "";
  const { fetchWithAuth } = useAuth();
  
  const [post, setPost] = useState<Posteo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const fetchPost = useCallback(async () => {
    if (!id) {
      setError("ID del post no proporcionado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/post/${id}`
      );
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        setError(`Error al cargar el posteo. ${res.status} ${text ?? ""}`);
        setLoading(false);
        return;
      }

      const data: PosteoDetalleResponse = await res.json();
      // El endpoint devuelve "posteo" y estados; unificamos (según tu types.ts)
      const posteo = data.posteo;
      
      // Asegurar que los flags estén en el objeto posteo (por si el backend devolvió por separado)
      posteo.isFollowing = data.isFollowing ?? posteo.isFollowing ?? false;
      posteo.isFavorito = data.isFavorito ?? posteo.isFavorito ?? false;

      setPost(posteo);
    } catch (err) {
      console.error("fetchPost error:", err);
      setError("Ocurrió un error cargando el posteo.");
    } finally {
      setLoading(false);
    }
  }, [id, fetchWithAuth]);

  useEffect(() => {
    // Esperar a que el context tenga user/ fetchWithAuth
    if (!fetchWithAuth) return;
    fetchPost();
  }, [fetchPost, fetchWithAuth]);

  // Abrir modal de likes (carga usuarios que dieron like)
  const {
    isLikesOpen,
    likesUsuarios,
    loading: likesLoading,
    openLikesModal,
    closeLikesModal,
  } = useLikesModal();
  
  // Abrir/cerrar modal de opciones
  const openOptions = () => setIsOptionsOpen(true);
  const closeOptions = () => setIsOptionsOpen(false);

  // Estos update... son pasados al ModalOpcionesPublicacion para sincronizar estado localmente
  const updateFollowState = (userId: string, isFollowing: boolean) => {
    if (!post) return;
    // El flag isFollowing está en el objeto post a nivel top según tus types
    setPost({ ...post, isFollowing });
  };

  const updateFavoritoState = (postId: string, isFavorito: boolean) => {
    if (!post) return;
    setPost({ ...post, isFavorito });
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner /></div>
  if (error) return <p className="text-center text-danger mt-5">{error}</p>;
  if (!post) return <p className="text-center mt-5">Publicación no encontrada.</p>;

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
          <Link className="link_perfil_img" href={`perfil/${post._idUsuario.url}`}>
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
            <Link className="link_perfil_usuario text-dark text-decoration-none" href={`perfil/${post._idUsuario.url}`}>
              {post._idUsuario.nombre_completo.nombre}{" "}
              {post._idUsuario.nombre_completo.apellido}
            </Link>
          </strong>
          {/* Botón opciones alineado a la derecha */}
          <button
            type="button"
            className="btn btn-sm ms-auto"
            aria-label="Options"
            onClick={openOptions}
          >
            <FiMoreHorizontal size={18} />
          </button>
        </div>

        {/* Imagen principal */}
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
          {/* Likes */}
          <div className="d-flex align-items-center mb-2">
            {/* Boton LIKE */}
            <LikeButton
              postId={post._id}
              onOpenLikesModal={() => openLikesModal(post._id)}
            />
            {/* Botones a mediano plazo */}
            {/* <FiHeart size={24} className="me-3 cursor-pointer" />
            <FiMessageCircle size={24} className="me-3 cursor-pointer" />
            <FiSend size={24} className="me-auto cursor-pointer" />
            <FiBookmark size={24} className="cursor-pointer" /> */}
          </div>

          {/* Texto */}
          <p className="mb-1">
            {/* <strong className="me-1">@{post._idUsuario.url}</strong> */}
            <strong className="me-1">
              {post._idUsuario.nombre_completo.nombre}{" "}
              {post._idUsuario.nombre_completo.apellido}
            </strong>
            {post.texto}
          </p>

          {/* Fecha */}
          <p className="text-muted small mb-0">{fechaFormateada}</p>
        </div>
      </div>

      {/* Modal de opciones (reutiliza tu ModalOpcionesPublicacion) */}
      <ModalOpcionesPublicacion
        isOpen={isOptionsOpen}
        selectedImage={post}
        onClose={closeOptions}
        updateFollowState={updateFollowState}
        updateFavoritoState={updateFavoritoState}
      />

      {/* Modal de Likes usuarios */}
      <ModalLikesUsuarios
        isOpen={isLikesOpen}
        onClose={closeLikesModal}
        usuarios={likesUsuarios}
      />
    </>
  );
}
