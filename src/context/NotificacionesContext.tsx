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

interface NotificacionesContextType {
    totalNoLeidas: number;
    // setTotalNoLeidas: (valor: number) => void;
    setTotalNoLeidas: React.Dispatch<React.SetStateAction<number>>;
    refrescarNotificaciones: () => Promise<void>;
}

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { fetchWithAuth, user } = useAuth();

  const [totalNoLeidas, setTotalNoLeidas] = useState<number>(0);

  /**
   * 🔄 Función para obtener el total de notificaciones no leídas
   */
  const refrescarNotificaciones = useCallback(async () => {
    if (!user) return; // Si no hay usuario logueado, no hacemos nada
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notificaciones/nuevas-notificaciones`
      );

      if (!res.ok) throw new Error("Error al obtener notificaciones");

      const data = await res.json();
      setTotalNoLeidas(data.totalNoLeidas || 0);
    } catch (error) {
      console.error("Error al refrescar notificaciones:", error);
    }
  }, [fetchWithAuth, user]);

  /**
   * 🧠 Efecto: al iniciar sesión o recargar la página, obtener notificaciones
   */
  useEffect(() => {
    if (user) refrescarNotificaciones();
  }, [user, refrescarNotificaciones]);

  /**
   * ⏱️ Efecto opcional: actualiza automáticamente cada 60 segundos
   * (puedes aumentar o reducir este tiempo según tus necesidades)
   */
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
