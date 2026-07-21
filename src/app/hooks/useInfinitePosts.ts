import { ApiResponsePosteos, Posteo } from "@/types/types";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiGet, getUserMessage } from "@/lib/apiClient";

export function useInfinitePosts(initialUrl: string) {
  const { fetchWithAuth } = useAuth();
  const [posts, setPosts] = useState<Posteo[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(initialUrl);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!nextUrl || loading || finished) return;

    setLoading(true);

    try {
      const data = await apiGet<ApiResponsePosteos>(fetchWithAuth, nextUrl);

      if (!data.posteosConEstado || data.posteosConEstado.length === 0) {
        setFinished(true);
        setNextUrl(null);
        return;
      }

      setPosts((prev) => [...prev, ...data.posteosConEstado]);
      setNextUrl(data.next || null);

      if (!data.next) setFinished(true);
    } catch (err) {
      const msg = getUserMessage(err, 'cargar_publicaciones');
      console.error(msg, err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [nextUrl, loading, finished, fetchWithAuth]);

  // Función para actualizar follow
  const updateFollowState = useCallback((userId: string, newState: boolean) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._idUsuario._id === userId
          ? { ...post, isFollowing: newState }
          : post
      )
    );
  }, []);

  // Función para actualizar favorito
  const updateFavoritoState = useCallback((postId: string, newState: boolean) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { ...post, isFavorito: newState }
          : post
      )
    );
  }, []);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    if (loading || finished) return;
    const currentRef = observerRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchPosts();
        }
      },
      {
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [fetchPosts, loading, finished]);

  return {
    posts,
    loading,
    observerRef,
    finished,
    error,
    clearError,
    updateFollowState,
    updateFavoritoState,
  };
}