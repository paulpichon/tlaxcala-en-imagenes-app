// Archivo: PublicacionUsuario.tsx
// Renderiza las publicaciones de los usuarios con likes y modales
'use client';

import { useInfinitePosts } from "@/app/hooks/useInfinitePosts";
import Spinner from "../spinner";

import PosteoCard from "../PosteoCard";

export default function PublicacionUsuario() {
  // Hook para cargar publicaciones con scroll infinito
  const {
    posts,
    loading,
    observerRef,
    finished
  } = useInfinitePosts(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos`);

  if (loading && posts.length === 0)
    return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner /></div>;

  return (
    <>
      {posts.map((post) => (
        <PosteoCard
          key={post._id}
          post={post}
        />
      ))}
      <div ref={observerRef} />
      {loading && !finished && <Spinner />}
      {finished && posts.length > 0 && (
        <p className="text-center mt-3 mb-5 pb-5 text-muted">
          No hay más publicaciones
        </p>
      )}
    </>
  );
}
