"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { apiGet, getUserMessage } from "@/lib/apiClient";
import { ApiResponse } from "@/types/types";

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

  const refrescarNotificaciones = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiGet<ApiResponse<{ totalNoLeidas: number }>>(
        fetchWithAuth,
        "/api/notificaciones/nuevas-notificaciones"
      );
      setTotalNoLeidas(data.data.totalNoLeidas || 0);
    } catch (err) {
      const msg = getUserMessage(err, 'cargar_notificaciones');
      console.error(msg, err);
      setError(msg);
    }
  }, [fetchWithAuth, user]);

  useEffect(() => {
    if (user) refrescarNotificaciones();
  }, [user, refrescarNotificaciones]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refrescarNotificaciones, 60000);
    return () => clearInterval(interval);
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
