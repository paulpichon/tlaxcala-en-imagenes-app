'use client';

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Comentario, ApiResponse, ApiResponsePaginado, ComentariosCountResponse } from "@/types/types";
import {
  apiGet,
  apiPost,
  apiDelete,
  isNotFound,
  getUserMessage,
} from "@/lib/apiClient";

export function useComentarios(postId: string) {
  const { fetchWithAuth, user } = useAuth();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchTotal = useCallback(async () => {
    if (!postId) return;
    try {
      const data = await apiGet<ApiResponse<ComentariosCountResponse>>(
        fetchWithAuth,
        `/api/comentarios/${postId}/comentarios/count`
      );
      setTotal(data.data.count);
    } catch (err) {
      if (isNotFound(err)) {
        console.warn("El posteo no existe al contar comentarios:", postId);
      } else {
        const msg = getUserMessage(err, 'cargar_comentarios');
        console.error(msg, err);
        setError(msg);
      }
    }
  }, [postId, fetchWithAuth]);

  useEffect(() => {
    if (postId && user) fetchTotal();
  }, [fetchTotal, postId, user]);

  const fetchComentarios = useCallback(async () => {
    if (!postId) return;
    setLoadingList(true);
    setComentarios([]);
    setNextUrl(null);
    try {
      const data = await apiGet<ApiResponsePaginado<Comentario>>(
        fetchWithAuth,
        `/api/comentarios/${postId}/comentarios`
      );
      setComentarios(data.data);
      setTotal(data.pagination.total);
      setNextUrl(data.pagination.next);
    } catch (err) {
      if (isNotFound(err)) {
        console.warn("El posteo no existe al cargar comentarios:", postId);
      } else {
        const msg = getUserMessage(err, 'cargar_comentarios');
        console.error(msg, err);
        setError(msg);
      }
    } finally {
      setLoadingList(false);
    }
  }, [postId, fetchWithAuth]);

  const cargarMasComentarios = useCallback(async () => {
    if (!nextUrl || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await apiGet<ApiResponsePaginado<Comentario>>(fetchWithAuth, nextUrl);
      setComentarios((prev) => [...prev, ...data.data]);
      setNextUrl(data.pagination.next);
    } catch (err) {
      if (isNotFound(err)) {
        console.warn("El posteo no existe al cargar más comentarios:", postId);
      } else {
        const msg = getUserMessage(err, 'cargar_comentarios');
        console.error(msg, err);
        setError(msg);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [nextUrl, loadingMore, fetchWithAuth]);

  const agregarComentario = useCallback(async (texto: string): Promise<boolean> => {
    if (!user) return false;

    const trimmedTexto = texto.trim();
    if (!trimmedTexto) return false;

    const tempId = `temp_${Date.now()}`;
    const tempComment: Comentario = {
      _id: tempId,
      texto: trimmedTexto,
      createdAt: new Date().toISOString(),
      autorId: {
        _id: user.uid,
        nombre_completo: user.nombre_completo,
        imagen_perfil: user.imagen_perfil?.public_id
          ? { public_id: user.imagen_perfil.public_id }
          : undefined,
        url: user.url,
      },
    };

    setComentarios((prev) => [tempComment, ...prev]);
    setTotal((prev) => prev + 1);

    try {
      const data = await apiPost<ApiResponse<{ comentario: { _id: string; createdAt: string } }>>(
        fetchWithAuth,
        `/api/comentarios/${postId}/comentarios`,
        { texto: trimmedTexto }
      );

      setComentarios((prev) =>
        prev.map((c) =>
          c._id === tempId
            ? { ...c, _id: data.data.comentario._id, createdAt: data.data.comentario.createdAt }
            : c
        )
      );

      return true;
    } catch (err) {
      const msg = getUserMessage(err, 'comentar');
      console.error(msg, err);
      setError(msg);
      setComentarios((prev) => prev.filter((c) => c._id !== tempId));
      setTotal((prev) => Math.max(0, prev - 1));
      return false;
    }
  }, [postId, fetchWithAuth, user]);

  const eliminarComentario = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      await apiDelete(fetchWithAuth, `/api/comentarios/${commentId}`);
      setComentarios((prev) => prev.filter((c) => c._id !== commentId));
      setTotal((prev) => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      const msg = getUserMessage(err, 'eliminar_comentario');
      console.error(msg, err);
      setError(msg);
      return false;
    }
  }, [fetchWithAuth]);

  return {
    comentarios,
    total,
    loadingList,
    loadingMore,
    hasMore: !!nextUrl,
    error,
    clearError,
    fetchComentarios,
    fetchTotal,
    cargarMasComentarios,
    agregarComentario,
    eliminarComentario,
  };
}
