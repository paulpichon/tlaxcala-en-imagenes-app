"use client";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotificaciones } from "@/context/NotificacionesContext";
import { Notificacion } from "@/types/types";
import { apiGet, apiPatch, apiDelete } from "@/lib/apiClient";

export function useNotifications() {
  const { fetchWithAuth } = useAuth();
  const { setTotalNoLeidas, refrescarNotificaciones } = useNotificaciones();

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 🔹 Cargar notificaciones con paginación
  const cargarNotificaciones = useCallback(
    async (pagina = 1) => {
      try {
        const data = await apiGet<{
          notificaciones: Notificacion[];
          totalPages: number;
        }>(fetchWithAuth, '/api/notificaciones', { page: pagina, limit: 15 });

        if (pagina === 1) setNotificaciones(data.notificaciones);
        else setNotificaciones((prev) => [...prev, ...data.notificaciones]);

        setPage(pagina);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error("Error cargando notificaciones:", err);
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
        console.error("Error marcando como leída:", err);
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
        console.error("Error eliminando notificación:", err);
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
    cargarNotificaciones,
    marcarComoLeida,
    eliminarNotificacion, // 👈 exportamos la nueva función
    setLoadingMore,
    setNotificaciones, // opcional, útil si algún día se necesita refrescar manualmente
  };
}
