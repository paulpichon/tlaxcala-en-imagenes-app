"use client";

import { useEffect, useState } from "react";
import perfil from "../../ui/perfil/perfil.module.css";
import Image from "next/image";
import ImageModal from "./ImageModal";
import { Posteo, PosteoDetalleResponse } from "@/types/types";
import { useAuth } from "@/context/AuthContext";

export default function PublicacionesUsuarioGrid({ usuarioId }: { usuarioId: string }) {
  const { fetchWithAuth } = useAuth();
  const [posteos, setPosteos] = useState<Posteo[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState<Posteo | null>(null);
  const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);

  useEffect(() => {
    if (!usuarioId) return;

    const fetchPosteos = async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/usuario/${usuarioId}`
        );
        if (!res.ok) throw new Error("Error al obtener posteos");
        const data = await res.json();
        setPosteos(data.posteos || []);
      } catch (error) {
        console.error("Error al cargar posteos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosteos();
  }, [usuarioId, fetchWithAuth]);

  if (loading) return <p className="text-center mt-3">Cargando publicaciones...</p>;
  if (!posteos.length) return <p className="text-center mt-3">Este usuario no tiene publicaciones</p>;

  const openFirstModal = async (posteo: Posteo) => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/post/${posteo._id}`
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

  const updateFollowState = (userId: string, isFollowing: boolean) => {
    if (!selectedImage) return;
    setSelectedImage({ ...selectedImage, isFollowing });
  };

  const updateFavoritoState = (postId: string, isFavorito: boolean) => {
    if (!selectedImage) return;
    setSelectedImage({ ...selectedImage, isFavorito });
  };

  return (
    <div className="row g-1">
      {posteos.map((posteo) => (
        <div key={posteo._id} className="col-4">
          <div className="card">
            <Image
              src={posteo.img}
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

      {/* Modal de imagen (que incluye opciones dentro) */}
      {selectedImage && (
        <ImageModal
          isOpen={isFirstModalOpen}
          selectedImage={selectedImage}
          onClose={() => setIsFirstModalOpen(false)}
          updateFollowState={updateFollowState}
          updateFavoritoState={updateFavoritoState}
        />
      )}
    </div>
  );
}
