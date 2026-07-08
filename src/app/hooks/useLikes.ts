// hooks/useLikes.ts
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

type LikeState = {
  count: number;
  hasLiked: boolean;
};

export function useLikes(
  postId: string,
  initialCount?: number,
  initialHasLiked?: boolean
) {
  const { fetchWithAuth } = useAuth();
  const [likeState, setLikeState] = useState<LikeState>({
    count: initialCount ?? 0,
    hasLiked: initialHasLiked ?? false,
  });

  const toggleLike = async () => {
    try {
      // Endpoint: api/likes/${postId}/like --> Dar/Quitar LIKE a un posteo
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/likes/${postId}/like`,
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

  return { likeState, toggleLike, loading: false };
}
