'use client';

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

import { ApiResponse, Posteo } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import Spinner from "./spinner";
import PosteoCard from "./PosteoCard";
import { notFound } from "next/navigation";
import Link from "next/link";
import { apiGet, isNotFound, isValidationFailed, isUnauthorized, getUserMessage } from "@/lib/apiClient";
import { FiLock } from "react-icons/fi";

export default function PosteoDetalle() {
  const params = useParams() as { idposteo?: string } | null;
  const id = params?.idposteo ?? "";
  const { fetchWithAuth, user } = useAuth();
  
  const [post, setPost] = useState<Posteo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFoundError, setIsNotFoundError] = useState<boolean>(false);
  const [isAuthRequired, setIsAuthRequired] = useState<boolean>(false);

  const fetchPost = useCallback(async () => {
    if (!id) {
      setError("ID del post no proporcionado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIsNotFoundError(false);
    setIsAuthRequired(false);

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
      if (isUnauthorized(err)) {
        // 401 AUTHENTICATION_ERROR: el posteo es 'perfil' y no hay sesión.
        // No es un error fatal; exige iniciar sesión para verlo.
        console.warn("Posteo restringido, requiere sesión:", id);
        setIsAuthRequired(true);
      } else if (isNotFound(err) || isValidationFailed(err)) {
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
  if (isAuthRequired)
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center px-4 mt-5">
        <FiLock size={40} style={{ color: "#EBCA9A" }} />
        <h5 className="mt-3 mb-1">Inicia sesión para ver este posteo</h5>
        <p className="text-muted small mb-3">
          Este posteo está configurado como "Solo perfil" y solo puede verse dentro de TlaxApp con una sesión iniciada.
        </p>
        <Link
          href="/cuentas/login"
          style={{
            backgroundColor: "#EBCA9A",
            border: "2px solid #EBCA9A",
            color: "#FFFFFF",
            borderRadius: "999px",
            padding: "0.4rem 1.4rem",
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.3s ease",
          }}
        >
          Ir a login
        </Link>
      </div>
    );
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
