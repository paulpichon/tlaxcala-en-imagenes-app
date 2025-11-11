"use client";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotificaciones } from "@/context/NotificacionesContext";
import { Notificacion } from "@/types/types";

export function useNotifications() {
  const { fetchWithAuth } = useAuth();
  const { setTotalNoLeidas } = useNotificaciones();

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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

  /**
   * ✅ Corrige el bug: no decrementa el contador si ya estaba leída
   */
  const marcarComoLeida = useCallback(
    async (id: string) => {
      try {
        // 🧩 Verificar si ya estaba leída
        const notificacionActual = notificaciones.find((n) => n._id === id);
        if (!notificacionActual) return;
        if (notificacionActual.notificacion_leida) return; // 👈 evita doble decremento

        // 🔹 Marcar como leída en backend
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/notificaciones/marcar-notificacion-leida/${id}`,
          { method: "PATCH" }
        );
        if (!res.ok) throw new Error("Error al marcar notificación");

        // 🔹 Actualizar estado local
        setNotificaciones((prev) =>
          prev.map((n) => (n._id === id ? { ...n, notificacion_leida: true } : n))
        );

        // 🔹 Actualizar contador global
        setTotalNoLeidas((prev: number) => Math.max(prev - 1, 0));
      } catch (err) {
        console.error("Error marcando como leída:", err);
      }
    },
    [fetchWithAuth, notificaciones, setTotalNoLeidas]
  );

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
    setLoadingMore,
  };
}
