'use client';

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function useFavoritoButton(
  posteoId: string,
  autorId: string,
  imagenUrl: string,
  initialFavorito: boolean,
  onToggle?: (newState: boolean) => void
) {
  const { fetchWithAuth } = useAuth();
  const [esFavorito, setEsFavorito] = useState(initialFavorito);
  const [loading, setLoading] = useState(false);

  const toggleFavorito = async () => {
    setLoading(true);
    try {
      let res;
      if (esFavorito) {
        res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/favoritos/${posteoId}`,
          { method: "DELETE" }
        );
      } else {
        res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/favoritos/${posteoId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imagenUrl, autorId }),
          }
        );
      }

      if (res.ok) {
        const data = await res.json();
        if (data.msg === "Agregado en Favoritos") {
          setEsFavorito(true);
          onToggle?.(true);
        } else if (data.msg === "Eliminado de Favoritos") {
          setEsFavorito(false);
          onToggle?.(false);
        }
      }
    } catch (err) {
      console.error("Error en toggleFavorito:", err);
    } finally {
      setLoading(false);
    }
  };

  return { esFavorito, loading, toggleFavorito };
}
