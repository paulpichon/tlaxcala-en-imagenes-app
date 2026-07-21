"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiPost, apiDelete, isNotFound, getUserMessage } from "@/lib/apiClient";

interface FollowContextType {
  isFollowingMap: Record<string, boolean>;
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
      const current = isFollowingMap[userId] ?? initialFollowing ?? false;

      if (current) {
        await apiDelete(fetchWithAuth, `/api/followers/unfollow/${userId}`);
      } else {
        await apiPost(fetchWithAuth, `/api/followers/follow/${userId}`);
      }

      setIsFollowingMap((prev) => ({
        ...prev,
        [userId]: !current,
      }));
    } catch (err) {
      if (isNotFound(err)) {
        console.warn("El usuario no existe:", userId);
      } else {
        const msg = getUserMessage(err, 'follow');
        console.error(msg, err);
      }
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
