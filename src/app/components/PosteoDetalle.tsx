// app/components/PosteoDetalle.tsx
'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

import { ApiResponse, Posteo } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import Spinner from "./spinner";
import PosteoCard from "./PosteoCard";
import { notFound } from "next/navigation";
import { apiGet, isNotFound, isValidationFailed, getUserMessage } from "@/lib/apiClient";
export default function PosteoDetalle() {
  const params = useParams() as { idposteo?: string } | null;
  const id = params?.idposteo ?? "";
  const { fetchWithAuth } = useAuth();
  
  const [post, setPost] = useState<Posteo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFoundError, setIsNotFoundError] = useState<boolean>(false);

  const fetchPost = useCallback(async () => {
    if (!id) {
      setError("ID del post no proporcionado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsNotFoundError(false);

    try {
      const data = await apiGet<ApiResponse<{ posteo: Posteo; isFollowing: boolean; isFavorito: boolean }>>(
        fetchWithAuth,
        `/api/posteos/post/${id}`
      );
      const posteo = data.data.posteo;

      // Asegurar que los flags estén en el objeto posteo (por si el backend devolvió por separado)
      posteo.isFollowing = data.data.isFollowing ?? posteo.isFollowing ?? false;
      posteo.isFavorito = data.data.isFavorito ?? posteo.isFavorito ?? false;

      setPost(posteo);
    } catch (err) {
      // Un ID mal formado (VALIDATION_FAILED) es semánticamente equivalente a
      // "no encontrado" desde la perspectiva del usuario: el recurso no existe
      // o no es accesible, por lo que mostramos la página 404 en ambos casos.
      if (isNotFound(err) || isValidationFailed(err)) {
        console.warn("Posteo no encontrado:", id);
        setIsNotFoundError(true);
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
  if (isNotFoundError) return notFound();
  if (error) return <p className="text-center mt-5 text-danger">{error}</p>;
  if (!post) return <p className="text-center mt-5">No se pudo cargar la publicación.</p>;

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
