'use client';

import { useInfinitePosts } from "@/app/hooks/useInfinitePosts";
import Spinner from "../spinner";
import PosteoCard from "../PosteoCard";

interface Props {
  refreshTrigger?: number;
}

export default function PublicacionUsuario({ refreshTrigger }: Props) {
  const {
    posts,
    loading,
    observerRef,
    finished
  } = useInfinitePosts(
    `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos`,
    refreshTrigger
  );

  // Loading inicial
  if (loading && posts.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner />
      </div>
    );
  }

  // No hay posts en toda la BD
  if (!loading && posts.length === 0 && finished) {
    return (
      <div className="text-center mt-5 p-4">
        <div className="mb-3" style={{ fontSize: '4rem' }}>📭</div>
        <h4 className="mb-2">Aún no hay publicaciones</h4>
        <p className="text-muted">
          Sé el primero en compartir algo con la comunidad
        </p>
      </div>
    );
  }

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