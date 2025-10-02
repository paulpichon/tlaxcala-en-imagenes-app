import { ApiResponsePosteos, Posteo } from "@/types/types";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export function useInfinitePosts(initialUrl: string) {
  const { fetchWithAuth } = useAuth();
  const [posts, setPosts] = useState<Posteo[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(initialUrl);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const observerRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!nextUrl || loading || finished) return;

    setLoading(true);

    try {
      const res = await fetchWithAuth(
        nextUrl.startsWith("http")
          ? nextUrl
          : `${process.env.NEXT_PUBLIC_API_URL}${nextUrl}`
      );

      if (!res.ok) throw new Error("Error al cargar los posteos");

      const data: ApiResponsePosteos = await res.json();

      if (!data.posteosConEstado || data.posteosConEstado.length === 0) {
        setFinished(true);
        setNextUrl(null);
        return;
      }

      setPosts((prev) => [...prev, ...data.posteosConEstado]);
      setNextUrl(data.next || null);

      if (!data.next) setFinished(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [nextUrl, loading, finished, fetchWithAuth]);

  // 🔹 Función para actualizar follow
  const updateFollowState = useCallback((userId: string, newState: boolean) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._idUsuario._id === userId
          ? { ...post, isFollowing: newState  }
          : post
      )
    );
  }, []);

  // 🔹 Función para actualizar favorito
  const updateFavoritoState = useCallback((postId: string, newState: boolean) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { ...post, isFavorito: newState  }
          : post
      )
    );
  }, []);

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
    updateFollowState,   // 👈 expuesto
    updateFavoritoState, // 👈 expuesto
  };
}
