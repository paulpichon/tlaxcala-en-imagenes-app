'use client';

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Comentario, ComentariosResponse, ComentariosCountResponse } from "@/types/types";

export function useComentarios(postId: string) {
  const { fetchWithAuth, user } = useAuth();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);

  const fetchTotal = useCallback(async () => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/comentarios/${postId}/comentarios/count`
      );
      if (res.ok) {
        const data: ComentariosCountResponse = await res.json();
        setTotal(data.count);
      }
    } catch (err) {
      console.error("Error al obtener total de comentarios:", err);
    }
  }, [postId, fetchWithAuth]);

  useEffect(() => {
    fetchTotal();
  }, [fetchTotal]);

  const fetchComentarios = useCallback(async () => {
    setLoadingList(true);
    setComentarios([]);
    setNextUrl(null);
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/comentarios/${postId}/comentarios`
      );
      if (res.ok) {
        const data: ComentariosResponse = await res.json();
        setComentarios(data.comentarios);
        setTotal(data.total);
        setNextUrl(data.next);
      }
    } catch (err) {
      console.error("Error al cargar comentarios:", err);
    } finally {
      setLoadingList(false);
    }
  }, [postId, fetchWithAuth]);

  const cargarMasComentarios = useCallback(async () => {
    if (!nextUrl || loadingMore) return;
    setLoadingMore(true);
    try {
      const url = nextUrl.startsWith("http")
        ? nextUrl
        : `${process.env.NEXT_PUBLIC_API_URL_LOCAL}${nextUrl}`;
      const res = await fetchWithAuth(url);
      if (res.ok) {
        const data: ComentariosResponse = await res.json();
        setComentarios((prev) => [...prev, ...data.comentarios]);
        setNextUrl(data.next);
      }
    } catch (err) {
      console.error("Error al cargar más comentarios:", err);
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
      autor: {
        _id: user.uid,
        nombre_completo: user.nombre_completo,
        imagen_perfil: user.imagen_perfil
          ? { secure_url: user.imagen_perfil.secure_url }
          : undefined,
        url: user.url,
      },
    };

    setComentarios((prev) => [tempComment, ...prev]);
    setTotal((prev) => prev + 1);

    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/comentarios/${postId}/comentarios`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto: trimmedTexto }),
        }
      );

      if (!res.ok) throw new Error("Error al crear comentario");

      const data = await res.json();

      setComentarios((prev) =>
        prev.map((c) =>
          c._id === tempId
            ? { ...c, _id: data.comentario._id, createdAt: data.comentario.createdAt }
            : c
        )
      );

      return true;
    } catch {
      setComentarios((prev) => prev.filter((c) => c._id !== tempId));
      setTotal((prev) => Math.max(0, prev - 1));
      return false;
    }
  }, [postId, fetchWithAuth, user]);

  const eliminarComentario = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/comentarios/${commentId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Error al eliminar comentario");

      setComentarios((prev) => prev.filter((c) => c._id !== commentId));
      setTotal((prev) => Math.max(0, prev - 1));
      return true;
    } catch {
      return false;
    }
  }, [fetchWithAuth]);

  return {
    comentarios,
    total,
    loadingList,
    loadingMore,
    hasMore: !!nextUrl,
    fetchComentarios,
    fetchTotal,
    cargarMasComentarios,
    agregarComentario,
    eliminarComentario,
  };
}
