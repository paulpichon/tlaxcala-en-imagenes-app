// app/context/FollowContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface FollowContextType {
  followState: Map<string, boolean>;
  toggleFollow: (userId: string, shouldFollow: boolean) => Promise<void>;
  isFollowing: (userId: string) => boolean;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const FollowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { fetchWithAuth } = useAuth();

  const [followState, setFollowState] = useState<Map<string, boolean>>(new Map());

  const toggleFollow = async (userId: string, shouldFollow: boolean) => {
    try {
      const endpoint = shouldFollow
        ? `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/follows/${userId}`
        : `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/follows/${userId}/unfollow`;

      const res = await fetchWithAuth(endpoint, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Error al actualizar follow");
      }

      // Actualizamos estado global
      setFollowState((prev) => {
        const newState = new Map(prev);
        newState.set(userId, shouldFollow);
        return newState;
      });
    } catch (error) {
      console.error("Error en toggleFollow:", error);
    }
  };

  const isFollowing = (userId: string) => {
    return followState.get(userId) ?? false;
  };

  return (
    <FollowContext.Provider value={{ followState, toggleFollow, isFollowing }}>
      {children}
    </FollowContext.Provider>
  );
};

export const useFollow = (): FollowContextType => {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error("useFollow debe usarse dentro de un FollowProvider");
  }
  return context;
};
