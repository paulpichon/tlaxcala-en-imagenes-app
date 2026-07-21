// app/components/PosteoDetalle.tsx
'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

import { PosteoDetalleResponse, Posteo } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import Spinner from "./spinner";
import PosteoCard from "./PosteoCard";
import { notFound } from "next/navigation";
import { apiGet, isNotFound, getUserMessage } from "@/lib/apiClient";
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
      const data = await apiGet<PosteoDetalleResponse>(
        fetchWithAuth,
        `/api/posteos/post/${id}`
      );
      const posteo = data.posteo;
      
      // Asegurar que los flags estén en el objeto posteo (por si el backend devolvió por separado)
      posteo.isFollowing = data.isFollowing ?? posteo.isFollowing ?? false;
      posteo.isFavorito = data.isFavorito ?? posteo.isFavorito ?? false;

      setPost(posteo);
    } catch (err) {
      if (isNotFound(err)) {
        console.warn("Posteo no encontrado:", id);
        setError("La publicación no fue encontrada.");
      } else {
        const msg = getUserMessage(err, 'cargar_publicaciones');
        console.error(msg, err);
        setError(msg);
      }
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
  // 👇 Solo mostramos not-found cuando el posteo no existe (404)
  if (error === "La publicación no fue encontrada.") return notFound();
  if (error) return <p className="text-center mt-5 text-danger">{error}</p>;
  if (!post) return <p className="text-center mt-5">Publicación no encontrada.</p>;

  return (
    <>
      {/* Componente Publicación/Posteo */}
      {/* Se usa FollowContext para saber el estado de isFollowing y tambien de isFavorito*/}
      <PosteoCard
          post={post}
          isDetail={true}
          showUserUrl={true}
      />
    </>
  );
}
