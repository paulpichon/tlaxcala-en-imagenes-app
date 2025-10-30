"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface FollowContextType {
  isFollowingMap: Record<string, boolean>; // clave = userId
  loadingMap: Record<string, boolean>;
  toggleFollow: (userId: string, initialFollowing?: boolean) => Promise<void>;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export function FollowProvider({ children }: { children: ReactNode }) {
  const { fetchWithAuth } = useAuth();

  const [isFollowingMap, setIsFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const toggleFollow = async (userId: string, initialFollowing?: boolean) => {
    if (!userId) return;

    setLoadingMap((prev) => ({ ...prev, [userId]: true }));

    try {
      // Usa el estado local si existe, si no, cae en el initialFollowing que viene del prop
      const current = isFollowingMap[userId] ?? initialFollowing ?? false;

      const url = `${process.env.NEXT_PUBLIC_API_URL_LOCAL_LOCAL}/api/followers/${current ? "unfollow" : "follow"}/${userId}`;
      const method = current ? "DELETE" : "POST";

      const res = await fetchWithAuth(url, { method });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Error al actualizar follow (${res.status}): ${errorText}`);
      }

      // Si todo salió bien, actualizamos el estado global
      setIsFollowingMap((prev) => ({
        ...prev,
        [userId]: !current,
      }));
    } catch (error) {
      console.error("Error en toggleFollow:", error);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <FollowContext.Provider value={{ isFollowingMap, loadingMap, toggleFollow }}>
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error("useFollow debe usarse dentro de un FollowProvider");
  }
  return context;
}
