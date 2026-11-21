"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotificaciones } from "@/context/NotificacionesContext";
import { Notificacion, ApiResponsePaginado, TipoNotificacion } from "@/types/types";
import {
  apiGet,
  apiPatch,
  apiDelete,
  getUserMessage,
  isNotFound,
} from "@/lib/apiClient";

/** Filtro de la lista: `null` = todas. */
export type FiltroNotificaciones = TipoNotificacion | null;

export function useNotifications() {
  const { fetchWithAuth } = useAuth();
  const { setTotalNoLeidas, refrescarNotificaciones } = useNotificaciones();

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroNotificaciones>(null);
  const [procesandoMasivo, setProcesandoMasivo] = useState(false);

  // El filtro se lee desde un ref para que «Ver más» use siempre el vigente, y
  // `solicitudRef` descarta respuestas de una carga anterior (cambio rápido de filtro).
  const filtroRef = useRef<FiltroNotificaciones>(null);
  const solicitudRef = useRef(0);

  const clearError = useCallback(() => setError(null), []);

  // 🔹 Cargar notificaciones con paginación (y filtro por tipo opcional)
  const cargarNotificaciones = useCallback(
    async (pagina = 1) => {
      const solicitud = ++solicitudRef.current;
      try {
        const data = await apiGet<ApiResponsePaginado<Notificacion>>(
          fetchWithAuth,
          '/api/notificaciones',
          { page: pagina, tipo: filtroRef.current ?? undefined }
        );
        if (solicitud !== solicitudRef.current) return;

        if (pagina === 1) setNotificaciones(data.data);
        else setNotificaciones((prev) => [...prev, ...data.data]);

        setPage(pagina);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        if (solicitud !== solicitudRef.current) return;
        const msg = getUserMessage(err, 'cargar_notificaciones');
        console.error(msg, err);
        setError(msg);
      } finally {
        if (solicitud === solicitudRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [fetchWithAuth]
  );

  // 🔎 Cambiar el filtro por tipo: reinicia la paginación desde la página 1
  const cambiarFiltro = useCallback(
    (nuevo: FiltroNotificaciones) => {
      if (filtroRef.current === nuevo) return;
      filtroRef.current = nuevo;
      setFiltro(nuevo);
      setNotificaciones([]);
      setPage(1);
      setTotalPages(1);
      setLoading(true);
      cargarNotificaciones(1);
    },
    [cargarNotificaciones]
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

  // 🔴 Eliminar notificación. Es un soft delete: un 404 significa que ya estaba
  // eliminada (otra pestaña, otro dispositivo o la limpieza) y se trata como éxito.
  const eliminarNotificacion = useCallback(
    async (id: string) => {
      try {
        await apiDelete(fetchWithAuth, `/api/notificaciones/eliminar-notificacion/${id}`);
      } catch (err) {
        if (!isNotFound(err)) {
          const msg = getUserMessage(err, 'cargar_notificaciones');
          console.error(msg, err);
          setError(msg);
          return;
        }
      }
      setNotificaciones((prev) => prev.filter((n) => n._id !== id));
      await refrescarNotificaciones();
    },
    [fetchWithAuth, refrescarNotificaciones]
  );

  // ✅ Marcar todas como leídas (aplica a todas, no solo al filtro activo)
  const marcarTodasLeidas = useCallback(async (): Promise<boolean> => {
    if (procesandoMasivo) return false;
    setProcesandoMasivo(true);
    try {
      await apiPatch(fetchWithAuth, '/api/notificaciones/marcar-todas-leidas');
      setNotificaciones((prev) => prev.map((n) => ({ ...n, notificacion_leida: true })));
      setTotalNoLeidas(0);
      return true;
    } catch (err) {
      const msg = getUserMessage(err, 'marcar_todas_leidas');
      console.error(msg, err);
      setError(msg);
      return false;
    } finally {
      setProcesandoMasivo(false);
    }
  }, [fetchWithAuth, procesandoMasivo, setTotalNoLeidas]);

  // 🗑️ Eliminar todas (aplica a todas, no solo al filtro activo)
  const eliminarTodas = useCallback(async (): Promise<boolean> => {
    if (procesandoMasivo) return false;
    setProcesandoMasivo(true);
    try {
      await apiDelete(fetchWithAuth, '/api/notificaciones');
      setNotificaciones([]);
      setPage(1);
      setTotalPages(1);
      setTotalNoLeidas(0);
      return true;
    } catch (err) {
      const msg = getUserMessage(err, 'eliminar_todas_notificaciones');
      console.error(msg, err);
      setError(msg);
      return false;
    } finally {
      setProcesandoMasivo(false);
    }
  }, [fetchWithAuth, procesandoMasivo, setTotalNoLeidas]);

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
    filtro,
    procesandoMasivo,
    cambiarFiltro,
    cargarNotificaciones,
    marcarComoLeida,
    marcarTodasLeidas,
    eliminarTodas,
    eliminarNotificacion,
    setLoadingMore,
    setNotificaciones,
  };
}
