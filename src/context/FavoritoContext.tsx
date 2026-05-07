"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface FavoritoContextType {
  favoritosMap: Record<string, boolean>; // clave = posteoId
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

      let res;
      if (current) {
        res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/favoritos/${posteoId}`,
          { method: "DELETE" }
        );
      } else {
        res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/favoritos/${posteoId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ autorId }),
          }
        );
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `Error al actualizar favorito (${res.status}): ${text}`
        );
      }

      const data = await res.json();

      if (data.msg === "Agregado en Favoritos") {
        setFavoritosMap((prev) => ({ ...prev, [posteoId]: true }));
      } else if (data.msg === "Eliminado de Favoritos") {
        setFavoritosMap((prev) => ({ ...prev, [posteoId]: false }));
      }
    } catch (error) {
      console.error("Error en toggleFavorito:", error);
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
