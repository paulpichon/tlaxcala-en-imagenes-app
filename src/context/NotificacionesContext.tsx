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
import { apiGet } from "@/lib/apiClient";

interface NotificacionesContextType {
    totalNoLeidas: number;
    setTotalNoLeidas: React.Dispatch<React.SetStateAction<number>>;
    refrescarNotificaciones: () => Promise<void>;
}

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { fetchWithAuth, user } = useAuth();

  const [totalNoLeidas, setTotalNoLeidas] = useState<number>(0);

  const refrescarNotificaciones = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiGet<{ totalNoLeidas: number }>(
        fetchWithAuth,
        "/api/notificaciones/nuevas-notificaciones"
      );
      setTotalNoLeidas(data.totalNoLeidas || 0);
    } catch (error) {
      console.error("Error al refrescar notificaciones:", error);
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
      value={{ totalNoLeidas, setTotalNoLeidas, refrescarNotificaciones }}
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
