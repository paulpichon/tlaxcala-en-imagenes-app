'use client';

import { useState, useEffect } from "react";
import { useInfinitePosts } from "@/app/hooks/useInfinitePosts";
import Spinner from "../spinner";
import PosteoCard from "../PosteoCard";
import ToastGlobal from "../ToastGlobal";
import { Posteo } from "@/types/types";
import { MENSAJE_REPORTE_EXITOSO } from "@/lib/validaciones";

export default function PublicacionUsuario() {
  const {
    posts,
    loading,
    observerRef,
    finished,
    error,
    clearError,
    updatePost,
    removePost,
  } = useInfinitePosts(
    `${process.env.NEXT_PUBLIC_API_URL}/api/posteos`,
  );

  const [toast, setToast] = useState<{ message: string; type?: "success" | "danger" | "creacion" } | null>(null);

  // 🚩 Toast post-navegación: al reportar desde /posteo/[id] se redirige aquí
  useEffect(() => {
    const flag = sessionStorage.getItem("reporteExitoso");
    if (flag) {
      sessionStorage.removeItem("reporteExitoso");
      setToast({ message: MENSAJE_REPORTE_EXITOSO, type: "success" });
    }
  }, []);

  const handlePostUpdated = (posteoEditado: Posteo) =>
    updatePost(posteoEditado._id, posteoEditado);

  const handlePostDeleted = (postId: string) => {
    removePost(postId);
    setToast({ message: "Publicación eliminada correctamente", type: "success" });
  };

  const handlePostReported = (postId: string) => {
    removePost(postId);
    setToast({ message: MENSAJE_REPORTE_EXITOSO, type: "success" });
  };

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
        <h4 className="mb-2">No hay publicaciones para mostrar</h4>
        <p className="text-muted">
          Las publicaciones aparecerán aquí cuando estén disponibles.
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="alert alert-danger mx-3 mt-3" role="alert">
          {error}
          <button
            type="button"
            className="btn btn-sm btn-outline-dark ms-3"
            onClick={clearError}
          >
            Cerrar
          </button>
        </div>
      )}
      {posts.map((post) => (
        <PosteoCard
          key={post._id}
          post={post}
          onPostUpdated={handlePostUpdated}
          onPostDeleted={handlePostDeleted}
          onPostReported={handlePostReported}
        />
      ))}
      <div ref={observerRef} />
      {loading && !finished && <div className="d-flex justify-content-center align-items-center mb-5 pb-5"><Spinner /></div>}
      {finished && posts.length > 0 && (
        <p className="text-center mt-3 mb-5 pb-5 text-muted">
          No hay más publicaciones
        </p>
      )}

      {toast && (
        <ToastGlobal
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}