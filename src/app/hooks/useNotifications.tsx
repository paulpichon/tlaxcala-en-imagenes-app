"use client";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotificaciones } from "@/context/NotificacionesContext";
import { Notificacion, ApiResponsePaginado } from "@/types/types";
import { apiGet, apiPatch, apiDelete, getUserMessage } from "@/lib/apiClient";

export function useNotifications() {
  const { fetchWithAuth } = useAuth();
  const { setTotalNoLeidas, refrescarNotificaciones } = useNotificaciones();

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // 🔹 Cargar notificaciones con paginación
  const cargarNotificaciones = useCallback(
    async (pagina = 1) => {
      try {
        const data = await apiGet<ApiResponsePaginado<Notificacion>>(
          fetchWithAuth,
          '/api/notificaciones',
          { page: pagina }
        );

        if (pagina === 1) setNotificaciones(data.data);
        else setNotificaciones((prev) => [...prev, ...data.data]);

        setPage(pagina);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        const msg = getUserMessage(err, 'cargar_notificaciones');
        console.error(msg, err);
        setError(msg);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [fetchWithAuth]
  );

  // 🔸 Marcar como leída
  const marcarComoLeida = useCallback(
    async (id: string) => {
      try {
        const notificacionActual = notificaciones.find((n) => n._id === id);
        if (!notificacionActual || notificacionActual.notificacion_leida) return;

        await apiPatch(fetchWithAuth, `/api/notificaciones/marcar-notificacion-leida/${id}`);

        setNotificaciones((prev) =>
          prev.map((n) => (n._id === id ? { ...n, notificacion_leida: true } : n))
        );

        setTotalNoLeidas((prev: number) => Math.max(prev - 1, 0));
      } catch (err) {
        const msg = getUserMessage(err, 'cargar_notificaciones');
        console.error(msg, err);
        setError(msg);
      }
    },
    [fetchWithAuth, notificaciones, setTotalNoLeidas]
  );

  // 🔴 Eliminar notificación
  const eliminarNotificacion = useCallback(
    async (id: string) => {
      try {
        await apiDelete(fetchWithAuth, `/api/notificaciones/eliminar-notificacion/${id}`);

        setNotificaciones((prev) => prev.filter((n) => n._id !== id));

        await refrescarNotificaciones();
      } catch (err) {
        const msg = getUserMessage(err, 'cargar_notificaciones');
        console.error(msg, err);
        setError(msg);
      }
    },
    [fetchWithAuth, refrescarNotificaciones]
  );

  // 🔁 Cargar al iniciar
  useEffect(() => {
    cargarNotificaciones(1);
  }, [cargarNotificaciones]);

  return {
    notificaciones,
    page,
    totalPages,
    loading,
    loadingMore,
    error,
    clearError,
    cargarNotificaciones,
    marcarComoLeida,
    eliminarNotificacion,
    setLoadingMore,
    setNotificaciones,
  };
}
