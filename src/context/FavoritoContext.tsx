"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiPost, apiDelete, isNotFound, getUserMessage } from "@/lib/apiClient";

interface FavoritoContextType {
  favoritosMap: Record<string, boolean>;
  loadingMap: Record<string, boolean>;
  toggleFavorito: (
    posteoId: string,
    autorId: string,
    initialFavorito?: boolean
  ) => Promise<void>;
}

const FavoritoContext = createContext<FavoritoContextType | undefined>(
  undefined
);

export function FavoritoProvider({ children }: { children: ReactNode }) {
  const { fetchWithAuth } = useAuth();

  const [favoritosMap, setFavoritosMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const toggleFavorito = async (
    posteoId: string,
    autorId: string,
    initialFavorito?: boolean
  ) => {
    if (!posteoId) return;

    setLoadingMap((prev) => ({ ...prev, [posteoId]: true }));

    try {
      const current = favoritosMap[posteoId] ?? initialFavorito ?? false;

      let data: { msg: string };
      if (current) {
        data = await apiDelete<{ msg: string }>(
          fetchWithAuth,
          `/api/favoritos/${posteoId}`
        );
      } else {
        data = await apiPost<{ msg: string }>(
          fetchWithAuth,
          `/api/favoritos/${posteoId}`,
          { autorId }
        );
      }

      if (data.msg === "Agregado en Favoritos") {
        setFavoritosMap((prev) => ({ ...prev, [posteoId]: true }));
      } else if (data.msg === "Eliminado de Favoritos") {
        setFavoritosMap((prev) => ({ ...prev, [posteoId]: false }));
      }
    } catch (err) {
      if (isNotFound(err)) {
        console.warn("El posteo no existe:", posteoId);
      } else {
        const msg = getUserMessage(err, 'favorito');
        console.error(msg, err);
      }
    } finally {
      setLoadingMap((prev) => ({ ...prev, [posteoId]: false }));
    }
  };

  return (
    <FavoritoContext.Provider
      value={{ favoritosMap, loadingMap, toggleFavorito }}
    >
      {children}
    </FavoritoContext.Provider>
  );
}

export function useFavorito() {
  const context = useContext(FavoritoContext);
  if (!context) {
    throw new Error("useFavorito debe usarse dentro de un FavoritoProvider");
  }
  return context;
}
