// Hook para manejar el estado del modal de likes y la carga de usuarios que dieron like
// app/hooks/useLikesModal.ts
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LikeUsuario, LikesUsuariosResponse } from "@/types/types";

export function useLikesModal() {
  const { fetchWithAuth } = useAuth();

  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [likesUsuarios, setLikesUsuarios] = useState<LikeUsuario[]>([]);
  const [loading, setLoading] = useState(false);

  const openLikesModal = async (postId: string) => {
    setLoading(true);
    try {
      // Endpoint: api/likes/${postId}/likes/usuarios --> Mostrar usuarios que dieron LIKE a un posteo
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/likes/${postId}/likes/usuarios`
      );
      if (!res.ok) {
        console.error("No se pudieron cargar los likes:", res.status);
        return;
      }

      const data: LikesUsuariosResponse = await res.json();
      setLikesUsuarios(data.likes_usuarios_posteo ?? []);
      setIsLikesOpen(true);
    } catch (err) {
      console.error("Error cargando usuarios de likes:", err);
    } finally {
      setLoading(false);
    }
  };

  const closeLikesModal = () => setIsLikesOpen(false);

  return {
    isLikesOpen,
    likesUsuarios,
    loading,
    openLikesModal,
    closeLikesModal,
  };
}
