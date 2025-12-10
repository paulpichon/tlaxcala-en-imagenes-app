// app/components/PosteoDetalle.tsx
'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

import { PosteoDetalleResponse, Posteo } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import Spinner from "./spinner";
import PosteoCard from "./PosteoCard";
import { notFound } from "next/navigation"; // 👈 importamos para usar la página not-found.tsx
export default function PosteoDetalle() {
  const params = useParams() as { idposteo?: string } | null;
  const id = params?.idposteo ?? "";
  const { fetchWithAuth } = useAuth();
  
  const [post, setPost] = useState<Posteo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!id) {
      setError("ID del post no proporcionado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/post/${id}`
      );
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        setError(`Error al cargar el posteo. ${res.status} ${text ?? ""}`);
        setLoading(false);
        return;
      }

      const data: PosteoDetalleResponse = await res.json();
      // El endpoint devuelve "posteo" y estados; unificamos (según tu types.ts)
      const posteo = data.posteo;
      
      // Asegurar que los flags estén en el objeto posteo (por si el backend devolvió por separado)
      posteo.isFollowing = data.isFollowing ?? posteo.isFollowing ?? false;
      posteo.isFavorito = data.isFavorito ?? posteo.isFavorito ?? false;

      setPost(posteo);
    } catch (err) {
      console.error("fetchPost error:", err);
      setError("Ocurrió un error cargando el posteo.");
    } finally {
      setLoading(false);
    }
  }, [id, fetchWithAuth]);

  useEffect(() => {
    // Esperar a que el context tenga user/ fetchWithAuth
    if (!fetchWithAuth) return;
    fetchPost();
  }, [fetchPost, fetchWithAuth]);

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner /></div>
  // 👇 Si hubo error de fetch o no existe usuario, mostramos la página not-found
  if (error) return notFound();
  if (!post) return <p className="text-center mt-5">Publicación no encontrada.</p>;

  return (
    <>
      {/* Componente Publicación/Posteo */}
      {/* Se usa FollowContext para saber el estado de isFollowing y tambien de isFavorito*/}
      <PosteoCard
          post={post}
          isDetail={true}
      />
    </>
  );
}
