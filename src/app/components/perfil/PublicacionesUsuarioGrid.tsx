"use client";

import { useEffect, useState } from "react";
import perfil from "../../ui/perfil/perfil.module.css";
import Image from "next/image";
import ImageModal from "./ImageModal";
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";
import { Posteo } from "@/types/types";
import { useAuth } from "@/context/AuthContext";


export default function PublicacionesUsuarioGrid({ usuarioId }: { usuarioId: string }) {
    const { fetchWithAuth } = useAuth(); // 👈 usamos fetchWithAuth
    const [posteos, setPosteos] = useState<Posteo[]>([]);
    const [loading, setLoading] = useState(true);
  
    const [selectedImage, setSelectedImage] = useState<Posteo | null>(null);
    const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);
    const [isSecondModalOpen, setIsSecondModalOpen] = useState(false);
  
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

  const openFirstModal = (posteo: Posteo) => {
    setSelectedImage(posteo);
    setIsFirstModalOpen(true);
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

      {/* Modal de imagen */}
      {selectedImage && (
        <ImageModal
          isOpen={isFirstModalOpen}
          selectedImage={{ id: selectedImage._id, src: selectedImage.img }}
          onClose={() => setIsFirstModalOpen(false)}
          onNext={() => setIsSecondModalOpen(true)}
        />
      )}

      {/* Modal opciones */}
      <ModalOpcionesPublicacion
        isOpen={isSecondModalOpen}
        selectedImage={selectedImage ? { id: selectedImage._id, src: selectedImage.img } : null}
        onClose={() => setIsSecondModalOpen(false)}
      />
    </div>
  );
}
