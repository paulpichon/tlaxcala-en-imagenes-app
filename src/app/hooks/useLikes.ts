// hooks/useLikes.ts
import { useState, useEffect } from "react";
import { LikesUsuariosResponse } from "@/types/types";
import { useAuth } from "@/context/AuthContext";

type LikeState = {
  count: number;
  hasLiked: boolean;
};

export function useLikes(postId: string) {
  const { fetchWithAuth, user } = useAuth();
  const [likeState, setLikeState] = useState<LikeState>({
    count: 0,
    hasLiked: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !postId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${postId}/likes/usuarios`
        );
        if (!res.ok) return;

        const data: LikesUsuariosResponse = await res.json();
        if (cancelled) return;

        const count = data.likes_usuarios_posteo.length;

        // ✅ Comparación más robusta
        const hasLiked = data.likes_usuarios_posteo.some(
          (like) =>
            like._idUsuario?.uid === user.uid ||
            like._idUsuario?._id === user.uid
        );

        setLikeState({ count, hasLiked });
      } catch (err) {
        console.error("Error cargando likes:", err);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId, user, fetchWithAuth]);

  const toggleLike = async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${postId}/like`,
        { method: "POST" }
      );
      if (!res.ok) return;

      const data = await res.json();
      setLikeState((prev) => {
        if (data.msg === "Like añadido") {
          return { count: prev.count + 1, hasLiked: true };
        } else if (data.msg === "Like eliminado") {
          return { count: Math.max(prev.count - 1, 0), hasLiked: false };
        }
        return prev;
      });
    } catch (err) {
      console.error("Error al dar like:", err);
    }
  };

  return { likeState, toggleLike, loading };
}
