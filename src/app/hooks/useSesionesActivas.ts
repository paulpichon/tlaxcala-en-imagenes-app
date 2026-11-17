'use client';

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiDelete, isNotFound, getUserMessage } from "@/lib/apiClient";
import type { ApiResponse, SesionActiva } from "@/types/types";

/**
 * Sesiones activas del usuario (F6, backend E6 — SPECS-SESIONES §6).
 *
 * Los tres endpoints comparten `sesionesUsuarioLimiter` (30 / 15 min por
 * usuario), así que la lista se carga una sola vez al montar y solo se recarga
 * tras una acción o con `recargar()`: nunca al volver a la pestaña.
 *
 * Los cierres por `401 SESSION_REVOKED` / `403 ACCOUNT_RESTRICTED` ya los
 * aplica `fetchWithAuth` (F8 / F5); aquí solo se refleja el error en la UI.
 */
export function useSesionesActivas() {
  const { fetchWithAuth } = useAuth();
  const [sesiones, setSesiones] = useState<SesionActiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiGet<ApiResponse<SesionActiva[]>>(
        fetchWithAuth,
        "/api/auth/sesiones"
      );
      const lista = Array.isArray(resp.data) ? resp.data : [];
      // La actual primero; el resto conserva el orden del backend (lastUsed desc).
      setSesiones([
        ...lista.filter((s) => s.esActual),
        ...lista.filter((s) => !s.esActual),
      ]);
    } catch (err) {
      setError(getUserMessage(err, "cargar_sesiones"));
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /**
   * Cierra una sesión que no es la actual. Un `404` significa que ya no existía
   * (cerrada desde otro lado o vencida): se quita de la lista y se recarga, sin
   * tratarlo como error. Devuelve `true` si la sesión ya no está activa.
   */
  const cerrarSesion = useCallback(
    async (sessionId: string): Promise<boolean> => {
      setError(null);
      try {
        await apiDelete(
          fetchWithAuth,
          `/api/auth/sesiones/${encodeURIComponent(sessionId)}`
        );
        setSesiones((prev) => prev.filter((s) => s.sessionId !== sessionId));
        return true;
      } catch (err) {
        if (isNotFound(err)) {
          setSesiones((prev) => prev.filter((s) => s.sessionId !== sessionId));
          await cargar();
          return true;
        }
        setError(getUserMessage(err, "cerrar_sesion"));
        return false;
      }
    },
    [fetchWithAuth, cargar]
  );

  /**
   * Cierra todas las sesiones menos la actual (step-up con la contraseña).
   * Devuelve cuántas se cerraron. Los errores se relanzan para que el
   * formulario los asigne a su campo (`INVALID_CURRENT_PASSWORD`, `422`, `429`).
   */
  const cerrarOtras = useCallback(
    async (passwordActual: string): Promise<number> => {
      const resp = await apiDelete<ApiResponse<{ cerradas?: number }>>(
        fetchWithAuth,
        "/api/auth/sesiones/otras",
        { passwordActual }
      );
      setSesiones((prev) => prev.filter((s) => s.esActual));
      return resp.data?.cerradas ?? 0;
    },
    [fetchWithAuth]
  );

  return {
    sesiones,
    loading,
    error,
    clearError,
    recargar: cargar,
    cerrarSesion,
    cerrarOtras,
  };
}
