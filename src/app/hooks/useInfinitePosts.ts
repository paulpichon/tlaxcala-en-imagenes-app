import { ApiResponsePosteos, Posteo } from "@/types/types";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";


export function useInfinitePosts(initialUrl: string) {
  const { fetchWithAuth } = useAuth();
  const [posts, setPosts] = useState<Posteo[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(initialUrl);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false); // ✅ nuevo estado para indicar que ya no hay más posts

  const observerRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async () => {
    // ✅ Si no hay URL, ya cargamos todos los posts, o ya estamos cargando, no hacemos nada
    if (!nextUrl || loading || finished) return;

    setLoading(true);

    try {
      const res = await fetchWithAuth(
        nextUrl.startsWith("http") ? nextUrl : `${process.env.NEXT_PUBLIC_API_URL_LOCAL}${nextUrl}`
      );

      if (!res.ok) throw new Error("Error al cargar los posteos");

      const data: ApiResponsePosteos = await res.json();

      // ✅ Si la respuesta viene vacía, indicamos que ya terminamos
      if (!data.posteos || data.posteos.length === 0) {
        setFinished(true);
        setNextUrl(null);
        return;
      }

      setPosts((prev) => [...prev, ...data.posteos]);
      setNextUrl(data.next || null);

      // Si la próxima página es null, marcamos finished
      if (!data.next) setFinished(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [nextUrl, loading, finished, fetchWithAuth]);

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
      { threshold: 1.0 }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [fetchPosts, loading, finished]);

  return { posts, loading, observerRef, finished };
}
