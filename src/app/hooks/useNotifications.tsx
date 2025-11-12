"use client";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotificaciones } from "@/context/NotificacionesContext";
import { Notificacion } from "@/types/types";

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
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/notificaciones?page=${pagina}&limit=15`
        );
        if (!res.ok) throw new Error("Error al obtener notificaciones");
        const data = await res.json();

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

        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/notificaciones/marcar-notificacion-leida/${id}`,
          { method: "PATCH" }
        );
        if (!res.ok) throw new Error("Error al marcar notificación");

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
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/notificaciones/eliminar-notificacion/${id}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Error al eliminar notificación");

        // ✅ Quitarla del estado local
        setNotificaciones((prev) => prev.filter((n) => n._id !== id));

        // ✅ Refrescar el contador global
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
