import { ApiResponsePosteos, Posteo } from "@/types/types";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export function useInfinitePosts(initialUrl: string, refreshTrigger?: number) {
  const { fetchWithAuth } = useAuth();
  const [posts, setPosts] = useState<Posteo[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(initialUrl);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const isInitialMount = useRef(true);

  const observerRef = useRef<HTMLDivElement | null>(null);

  // Función para resetear y cargar desde cero
  const resetAndFetch = useCallback(async () => {
    setLoading(true);
    setPosts([]);
    setNextUrl(initialUrl);
    setFinished(false);

    try {
      const res = await fetchWithAuth(
        initialUrl.startsWith("http")
          ? initialUrl
          : `${process.env.NEXT_PUBLIC_API_URL_LOCAL}${initialUrl}`
      );

      if (!res.ok) throw new Error("Error al cargar los posteos");

      const data: ApiResponsePosteos = await res.json();

      if (!data.posteosConEstado || data.posteosConEstado.length === 0) {
        setFinished(true);
        setNextUrl(null);
        setPosts([]);
        return;
      }

      setPosts(data.posteosConEstado);
      setNextUrl(data.next || null);

      if (!data.next) setFinished(true);
    } catch (error) {
      console.error(error);
      setFinished(true);
    } finally {
      setLoading(false);
    }
  }, [initialUrl, fetchWithAuth]);

  // Carga inicial (solo una vez)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      resetAndFetch();
    }
  }, [resetAndFetch]);

  // Efecto para refresh cuando cambia refreshTrigger
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0 && !isInitialMount.current) {
      resetAndFetch();
    }
  }, [refreshTrigger, resetAndFetch]);

  // Función para cargar más posts (scroll infinito)
  const fetchPosts = useCallback(async () => {
    if (!nextUrl || loading || finished) return;

    setLoading(true);

    try {
      const res = await fetchWithAuth(
        nextUrl.startsWith("http")
          ? nextUrl
          : `${process.env.NEXT_PUBLIC_API_URL_LOCAL}${nextUrl}`
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
    updateFollowState,
    updateFavoritoState,
  };
}