"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LikeUsuario, LikesUsuariosResponse } from "@/types/types";
import { apiGet, ApiError } from "@/lib/apiClient";

export function useLikesModal() {
  const { fetchWithAuth } = useAuth();

  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [likesUsuarios, setLikesUsuarios] = useState<LikeUsuario[]>([]);
  const [loading, setLoading] = useState(false);

  const openLikesModal = async (postId: string) => {
    setLoading(true);
    try {
      const data = await apiGet<LikesUsuariosResponse>(
        fetchWithAuth,
        `/api/likes/${postId}/likes/usuarios`
      );
      setLikesUsuarios(data.likes_usuarios_posteo ?? []);
      setIsLikesOpen(true);
    } catch (err) {
      if (err instanceof ApiError && err.data?.code === 'NOT_FOUND') {
        console.warn("El posteo no existe al cargar usuarios de likes");
      } else {
        console.error("Error cargando usuarios de likes:", err);
      }
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
