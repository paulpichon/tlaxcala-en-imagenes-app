"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { apiGet, getUserMessage, isRateLimit } from "@/lib/apiClient";
import { ApiResponse } from "@/types/types";
import {
  conJitter,
  esperaPorRateLimit,
  INTERVALO_MIN_VISIBILIDAD_MS,
} from "@/lib/polling";

const INTERVALO_POLLING_MS = 60_000;

interface NotificacionesContextType {
    totalNoLeidas: number;
    setTotalNoLeidas: React.Dispatch<React.SetStateAction<number>>;
    error: string | null;
    clearError: () => void;
    refrescarNotificaciones: () => Promise<void>;
}

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { fetchWithAuth, user } = useAuth();

  const [totalNoLeidas, setTotalNoLeidas] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);
  // Tras un 429 no se consulta hasta esta marca (Retry-After / RateLimit-Reset).
  const noAntesDeRef = useRef(0);
  const ultimoFetchRef = useRef(0);

  const refrescarNotificaciones = useCallback(async () => {
    if (!user) return;
    if (Date.now() < noAntesDeRef.current) return;
    ultimoFetchRef.current = Date.now();
    try {
      const data = await apiGet<ApiResponse<{ totalNoLeidas: number }>>(
        fetchWithAuth,
        "/api/notificaciones/nuevas-notificaciones"
      );
      setTotalNoLeidas(data.data.totalNoLeidas || 0);
    } catch (err) {
      // El 429 del polling es transitorio y ocurre en background: se degrada a warn
      // para no dejar un error persistente en el contexto. No se vuelve a consultar
      // hasta que pase la espera indicada por el servidor.
      if (isRateLimit(err)) {
        noAntesDeRef.current = Date.now() + esperaPorRateLimit(err);
        console.warn("Polling de notificaciones limitado (429); reintenta en el próximo ciclo.", err);
        return;
      }
      const msg = getUserMessage(err, 'cargar_notificaciones');
      console.error(msg, err);
      setError(msg);
    }
  }, [fetchWithAuth, user]);

  useEffect(() => {
    if (user) refrescarNotificaciones();
  }, [user, refrescarNotificaciones]);

  // Polling cada 60 s (con jitter). Se pausa con la pestaña oculta y, al volver,
  // hace un fetch inmediato si el último tiene más de INTERVALO_MIN_VISIBILIDAD_MS.
  useEffect(() => {
    if (!user) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const startPolling = () => {
      if (intervalId === undefined) {
        intervalId = setInterval(refrescarNotificaciones, conJitter(INTERVALO_POLLING_MS));
      }
    };

    const stopPolling = () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (Date.now() - ultimoFetchRef.current >= INTERVALO_MIN_VISIBILIDAD_MS) {
          refrescarNotificaciones();
        }
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (document.visibilityState === 'visible') startPolling();

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refrescarNotificaciones]);

  return (
    <NotificacionesContext.Provider
      value={{ totalNoLeidas, setTotalNoLeidas, error, clearError, refrescarNotificaciones }}
    >
      {children}
    </NotificacionesContext.Provider>
  );
}

export const useNotificaciones = () => {
  const context = useContext(NotificacionesContext);
  if (!context)
    throw new Error("useNotificaciones debe usarse dentro de NotificacionesProvider");
  return context;
};
