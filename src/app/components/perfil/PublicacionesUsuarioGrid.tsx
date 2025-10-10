"use client";

import { useEffect, useState, useRef } from "react";
import perfil from "../../ui/perfil/perfil.module.css";
import Image from "next/image";
import ImageModal from "./ImageModal";
import ImagePreloader from "../ImagePreloader"; // 👈 Importar preloader
import { Posteo, PosteoDetalleResponse, PublicacionesUsuarioProps } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";



export default function PublicacionesUsuarioGrid({ usuarioId, refreshTrigger }: PublicacionesUsuarioProps) {
  const { fetchWithAuth } = useAuth();
  const [posteos, setPosteos] = useState<Posteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFirstLoad = useRef(true); // 👈 Para evitar warning de ESLint

  const [selectedImage, setSelectedImage] = useState<Posteo | null>(null);
  const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);

  useEffect(() => {
    if (!usuarioId) return;

    const fetchPosteos = async () => {
      // 👇 Primera carga: loading completo
      if (isFirstLoad.current) {
        setLoading(true);
      } else {
        // 👇 Refresh: solo spinner pequeño
        setRefreshing(true);
      }

      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/posteos/usuario/${usuarioId}`
        );
        if (!res.ok) throw new Error("Error al obtener posteos");
        const data = await res.json();
        setPosteos(data.posteos || []);
        
        // 👇 Marcar que ya no es primera carga
        if (isFirstLoad.current) {
          isFirstLoad.current = false;
        }
      } catch (error) {
        console.error("Error al cargar posteos:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchPosteos();
  }, [usuarioId, fetchWithAuth, refreshTrigger]);

  // 👇 Loading inicial (primera carga)
  if (loading && posteos.length === 0) {
    return <p className="text-center mt-3">Cargando publicaciones...</p>;
  }

  // 👇 Sin publicaciones
  if (!loading && !posteos.length) {
    return <p className="text-center mt-3">Este usuario no tiene publicaciones</p>;
  }

  const openFirstModal = async (posteo: Posteo) => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posteos/post/${posteo._id}`
      );
      if (!res.ok) throw new Error("Error al obtener detalle del posteo");
      const data: PosteoDetalleResponse = await res.json();

      const posteoDetalle: Posteo = {
        ...data.posteo,
        isFollowing: data.isFollowing,
        isFavorito: data.isFavorito,
      };

      setSelectedImage(posteoDetalle);
      setIsFirstModalOpen(true);
    } catch (err) {
      console.error("Error al cargar detalle del posteo:", err);
    }
  };

  return (
    <>
      {/* 👇 Precargar todas las imágenes en segundo plano */}
      <ImagePreloader images={posteos.map(p => p.secure_url)} />

      {/* 👇 Spinner pequeño durante refresh */}
      {refreshing && (
        <div className="text-center py-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Actualizando...</span>
          </div>
          <small className="text-muted ms-2">Actualizando publicaciones...</small>
        </div>
      )}

      {/* 👇 Grid de publicaciones (siempre visible durante refresh) */}
      <div className="row g-0" style={{ opacity: refreshing ? 0.6 : 1, transition: 'opacity 0.3s' }}>
        {posteos.map((posteo) => (
          <div key={posteo._id} className="col-6 col-sm-6 col-md-4 col-lg-4">
            <div className="card">
              <Image
                src={
                  getCloudinaryUrl(posteo.public_id, "grid")
                }
                alt={posteo.texto}
                width={200}
                height={200}
                className={`${perfil.imagen_grid_perfil_usuario} gallery-image`}
                style={{ cursor: "pointer" }}
                onClick={() => openFirstModal(posteo)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Modal de imagen */}
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