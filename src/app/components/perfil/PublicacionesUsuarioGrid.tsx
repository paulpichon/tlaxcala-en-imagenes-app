"use client";

import { useEffect, useRef, useState } from "react";
import { Posteo, PublicacionesUsuarioProps, PosteoDetalleResponse } from "@/types/types";
// import { usePosteosUsuario } from "@/hooks/usePosteosUsuario";
import ImageModal from "./ImageModal";
import ImagePreloader from "../ImagePreloader";
// import PublicacionesUsuarioGridItem from "./PublicacionesUsuarioGridItem";
import { useAuth } from "@/context/AuthContext";
import { usePosteosUsuario } from "@/app/hooks/usePosteosUsuario";
import PublicacionesUsuarioGridItem from "../PublicacionesUsuarioGridItem";

export default function PublicacionesUsuarioGrid({
  usuarioId,
  refreshTrigger,
}: PublicacionesUsuarioProps) {
  const { fetchWithAuth } = useAuth();

  const observerRef = useRef<HTMLDivElement | null>(null);

  const {
    posteos,
    nextUrl,
    loading,
    loadingMore,
    refreshing,
    fetchPosteos,
    fetchedPages,
  } = usePosteosUsuario(usuarioId);

  const [selectedImage, setSelectedImage] = useState<Posteo | null>(null);
  const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);

  const fetchedPagesRef = fetchedPages; // referencia estable
  const isFetchingRef = useRef(false); // evita llamadas múltiples rápidas

  // 🖼 Modal de detalle
  const openFirstModal = async (posteo: Posteo) => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/post/${posteo._id}`
      );
      if (!res.ok) return;

      const data: PosteoDetalleResponse = await res.json();
      setSelectedImage({
        ...data.posteo,
        isFollowing: data.isFollowing,
        isFavorito: data.isFavorito,
      });
      setIsFirstModalOpen(true);
    } catch (err) {
      console.error("Error al abrir modal de posteo:", err);
    }
  };

  // 🧩 Carga inicial o actualización
  useEffect(() => {
    fetchedPagesRef.current.clear();
    fetchPosteos();
  }, [usuarioId, refreshTrigger, fetchPosteos, fetchedPagesRef]);

  // 📜 Scroll infinito
  useEffect(() => {
    if (!nextUrl || loadingMore) return; // si no hay siguiente página, no observar

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          nextUrl &&
          !loadingMore &&
          !isFetchingRef.current && // 🚫 evita duplicaciones
          !fetchedPagesRef.current.has(nextUrl)
        ) {
          isFetchingRef.current = true; // marca que está cargando
          fetchPosteos(nextUrl).finally(() => {
            isFetchingRef.current = false; // libera después de cargar
          });
        }
      },
      { rootMargin: "300px", threshold: 0.1 }
    );

    const currentRef = observerRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
      observer.disconnect();
    };
  }, [nextUrl, loadingMore, fetchPosteos, fetchedPagesRef]);

  // 🌀 Estado inicial
  if (loading && posteos.length === 0)
    return <p className="text-center mt-3">Cargando publicaciones...</p>;

  if (!loading && posteos.length === 0)
    return <p className="text-center mt-3">Este usuario no tiene publicaciones</p>;

  return (
    <>
      <ImagePreloader images={posteos.map((p) => p.secure_url)} />

      {refreshing && (
        <div className="text-center py-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status" />
          <small className="text-muted ms-2">Actualizando publicaciones...</small>
        </div>
      )}

      <div
        className="row g-0"
        style={{ opacity: refreshing ? 0.6 : 1, transition: "opacity 0.3s" }}
      >
        {posteos.map((posteo) => (
          <PublicacionesUsuarioGridItem
            key={posteo._id}
            posteo={posteo}
            onClick={openFirstModal}
          />
        ))}
      </div>

      {nextUrl ? (
        <div ref={observerRef} className="text-center my-3">
          {loadingMore && (
            <>
              <div className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2">Cargando más publicaciones...</p>
            </>
          )}
        </div>
      ) : (
        posteos.length > 0 && (
          <p className="text-center text-muted mt-3">
            No hay más publicaciones para mostrar.
          </p>
        )
      )}

      {selectedImage && (
        <ImageModal
          isOpen={isFirstModalOpen}
          selectedImage={selectedImage}
          onClose={() => setIsFirstModalOpen(false)}
        />
      )}
    </>
  );
}
