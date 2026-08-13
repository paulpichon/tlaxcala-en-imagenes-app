// FUFUFU
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import perfil from "../../ui/perfil/perfil.module.css";
import Image from "next/image";
import ImageModal from "./ImageModal";
import ImagePreloader from "../ImagePreloader";
import {
  Posteo,
  ApiResponse,
  ApiResponsePaginado,
  PublicacionesUsuarioProps,
} from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import ToastGlobal from "../ToastGlobal";
import { apiGet, isNotFound, getUserMessage } from "@/lib/apiClient";

type NextResponse = string | { url?: string } | null | undefined;

export default function PublicacionesUsuarioGrid({
  usuarioId,
  refreshTrigger,
  onPostCountChange
}: PublicacionesUsuarioProps) {
  const { fetchWithAuth } = useAuth();
  const [posteos, setPosteos] = useState<Posteo[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const isFirstLoad = useRef(true);
  const fetchedPages = useRef<Set<string>>(new Set());

  const [selectedImage, setSelectedImage] = useState<Posteo | null>(null);
  const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);

  // 🧁 Toast Global
  const [toast, setToast] = useState<{ message: string; type?: "success" | "danger" | "creacion" } | null>(null);

  // 🧠 Normaliza el next devuelto por el backend
  const normalizarNext = (next: NextResponse): string | null => {
    if (!next) return null;
    if (typeof next === "string" && next.trim() !== "") return next;
    if (typeof next === "object" && next.url) return next.url;
    return null;
  };

  // 📦 Función para obtener posteos
  const fetchPosteos = useCallback(
    async (url?: string | null) => {
      if (!usuarioId) return;

      // Solo bloqueamos si es un next ya conocido o vacío
      if (url !== undefined && (url === null || url === "" || fetchedPages.current.has(url))) {
        setNextUrl(null);
        return;
      }

      const isInitialLoad = isFirstLoad.current && !url;

      if (isInitialLoad) setLoading(true);
      else if (!url) setRefreshing(true);
      else setLoadingMore(true);

      try {
        const endpoint =
          url || `/api/posteos/usuario/${usuarioId}`;

        const data = await apiGet<ApiResponsePaginado<Posteo>>(
          fetchWithAuth,
          endpoint
        );
        const nuevosPosteos = data.data || [];

        if (nuevosPosteos.length === 0) {
          setNextUrl(null);
          return;
        }
    
        setPosteos((prev) => {
          const combinados = url ? [...prev, ...nuevosPosteos] : nuevosPosteos;
          const unicos = combinados.filter(
            (post: Posteo, index: number, self: Posteo[]) =>
              index === self.findIndex((p: Posteo) => p._id === post._id)
          );
          return unicos;
        });

        const siguiente = normalizarNext(data.pagination.next);

        if (!siguiente) {
          setNextUrl(null);
        } else {
          setNextUrl(siguiente);
          if (url) fetchedPages.current.add(url);
        }

        if (!url) {
          onPostCountChange?.(data.pagination.total);
        }

        if (isFirstLoad.current) isFirstLoad.current = false;
      } catch (err) {
        const msg = getUserMessage(err, 'cargar_publicaciones');
        console.error(msg, err);
        if (isNotFound(err)) {
          setToast({ message: "El usuario no fue encontrado", type: "danger" });
        } else {
          setToast({ message: msg, type: "danger" });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [usuarioId, fetchWithAuth]
  );

  // 🧩 Carga inicial
  useEffect(() => {
    fetchedPages.current.clear();
    setPosteos([]);
    setNextUrl(null);
    isFirstLoad.current = true;
    fetchPosteos();
  }, [usuarioId, refreshTrigger, fetchPosteos]);

  // 📜 Scroll infinito
  useEffect(() => {
    if (!nextUrl || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loadingMore && nextUrl) {
          if (!fetchedPages.current.has(nextUrl)) {
            fetchPosteos(nextUrl);
          }
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );

    const currentRef = observerRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
      observer.disconnect();
    };
  }, [nextUrl, loadingMore, fetchPosteos]);

  // 🖼 Modal abrir detalle
  const openFirstModal = async (posteo: Posteo) => {
    try {
      const data = await apiGet<ApiResponse<{ posteo: Posteo; isFollowing: boolean; isFavorito: boolean }>>(
        fetchWithAuth,
        `/api/posteos/post/${posteo._id}`
      );
      setSelectedImage({
        ...data.data.posteo,
        isFollowing: data.data.isFollowing,
        isFavorito: data.data.isFavorito,
      });
      setIsFirstModalOpen(true);
    } catch (err) {
      const msg = getUserMessage(err, 'cargar_publicaciones');
      console.error(msg, err);
      if (isNotFound(err)) {
        setToast({ message: "La publicación ya no está disponible", type: "danger" });
      } else {
        setToast({ message: msg, type: "danger" });
      }
    }
  };

  // 🗑️ Eliminar post del estado local tras confirmación
  const handlePostDeleted = (postId: string) => {
    setPosteos((prev) => prev.filter((p) => p._id !== postId));
    onPostCountChange?.(posteos.length - 1);
    setIsFirstModalOpen(false);
    setSelectedImage(null);
    setToast({ message: "Publicación eliminada correctamente", type: "success" });
  };

  // 🌀 Estado inicial
  if (loading && posteos.length === 0) {
    return <p className="text-center mt-3">Cargando publicaciones...</p>;
  }

  if (!loading && posteos.length === 0) {
    return <p className="text-center mt-3">Este usuario no tiene publicaciones</p>;
  }

  return (
    <>
      <ImagePreloader images={posteos.map((p) => getCloudinaryUrl(p.public_id, "grid"))} />

      {refreshing && (
        <div className="text-center py-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status" />
          <small className="text-muted ms-2">Actualizando publicaciones...</small>
        </div>
      )}

      {/* 🧩 Grid de publicaciones */}
      <div
        className="row g-0"
        style={{ opacity: refreshing ? 0.6 : 1, transition: "opacity 0.3s" }}
      >
        {posteos.map((posteo) => (
          <div key={posteo._id} className="col-6 col-sm-6 col-md-4 col-lg-4">
            <div className="card">
              <Image
                src={getCloudinaryUrl(posteo.public_id, "grid")}
                alt={`Publicación de usuario: ${posteo._id}`}
                width={200}
                height={200}
                className={`${perfil.imagen_grid_perfil_usuario} gallery-image`}
                style={{ cursor: "pointer" }}
                onClick={() => openFirstModal(posteo)}
                priority
              />
            </div>
          </div>
        ))}
      </div>

      {/* Scroll infinito */}
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

      {/* Modal de imagen */}
      <ImageModal
        key={selectedImage?._id || "no-image"}
        isOpen={isFirstModalOpen}
        selectedImage={selectedImage}
        onClose={() => setIsFirstModalOpen(false)}
        onPostDeleted={handlePostDeleted}
      />

      {/* ✅ Toast visual global */}
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
