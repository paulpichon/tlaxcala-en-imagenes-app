// Archivo: PublicacionUsuario.tsx
// Renderiza las publicaciones de los usuarios con likes y modales
'use client';

import { useState } from "react";
import { useInfinitePosts } from "@/app/hooks/useInfinitePosts";
import { Posteo } from "@/types/types";
import Spinner from "../spinner";
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";
import ModalLikesUsuarios from "../ModalLikesUsuarios";
import { useLikesModal } from "@/app/hooks/useLikesModal";
import PosteoCard from "../PosteoCard";

export default function PublicacionUsuario() {
  // Hook para cargar publicaciones con scroll infinito
  const {
    posts,
    loading,
    observerRef,
    finished,
    updateFollowState,
    updateFavoritoState,
  } = useInfinitePosts(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos`);

  // Estado para modal de opciones de publicación
  const [selectedPost, setSelectedPost] = useState<Posteo | null>(null);
  const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);

  // Abrir modal con usuarios que dieron like
  const {
    isLikesOpen,
    likesUsuarios,
    loading: likesLoading,
    openLikesModal,
    closeLikesModal,
  } = useLikesModal();

  const closeFirstModal = () => setIsFirstModalOpen(false);

  if (loading && posts.length === 0)
    return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner /></div>;

  return (
    <>
      {posts.map((post) => (
        <PosteoCard
          key={post._id}
          post={post}
          updateFollowState={updateFollowState}
          updateFavoritoState={updateFavoritoState}
        />
      ))}


      {/* Div invisible usado por IntersectionObserver para el scroll infinito */}
      <div ref={observerRef} />

      {/* Spinner mientras carga más posts */}
      {loading && !finished && <Spinner />}

      {/* Mensaje cuando no hay más publicaciones */}
      {finished && posts.length > 0 && (
        <p className="text-center mt-3 mb-5 pb-5 text-muted">
          No hay más publicaciones
        </p>
      )}

      {/* Modal de opciones de publicación */}
      <ModalOpcionesPublicacion
        isOpen={isFirstModalOpen}
        selectedImage={selectedPost}
        onClose={closeFirstModal}
        updateFollowState={updateFollowState}
        updateFavoritoState={updateFavoritoState}
      />

      {/* Modal con la lista de usuarios que dieron like */}
      <ModalLikesUsuarios
        isOpen={isLikesOpen}
        onClose={closeLikesModal}
        usuarios={likesUsuarios}
      />
    </>
  );
}
