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
  const { fetchWithAuth, user } = useAuth();
  
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
      const data = await apiGet<ApiResponse<{ posteo: Posteo; isFollowing?: boolean; isFavorito?: boolean }>>(
        user ? fetchWithAuth : fetch,
        `/api/posteos/post/${id}`
      );
      const posteo = data.data.posteo;

      posteo.isFollowing = data.data.isFollowing ?? false;
      posteo.isFavorito = data.data.isFavorito ?? false;
      posteo.hasLiked = posteo.hasLiked ?? false;

      setPost(posteo);
    } catch (err) {
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
  }, [id, fetchWithAuth, user]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner /></div>
  if (isNotFoundError) return notFound();
  if (error) return <p className="text-center mt-5 text-danger">{error}</p>;
  if (!post) return <p className="text-center mt-5">No se pudo cargar la publicación.</p>;

  return (
    <PosteoCard
        post={post}
        isDetail={true}
        showUserUrl={true}
    />
  );
}
