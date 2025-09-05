'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function useFavorito(posteoId?: string, autorId?: string, imagenUrl?: string, isOpen: boolean = true) {
  const { fetchWithAuth } = useAuth();
  const [loadingFav, setLoadingFav] = useState(false);
  const [loadingCheckFav, setLoadingCheckFav] = useState(true);
  const [esFavorito, setEsFavorito] = useState(false);

  // ✅ Verificar si ya es favorito al abrir modal
  useEffect(() => {
    const checkFavorito = async () => {
      if (!isOpen || !posteoId) return;
      setLoadingCheckFav(true);

      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/favoritos/${posteoId}`,
        );

        if (res.ok) {
          const data = await res.json();
          setEsFavorito(data.esFavorito);
        } else {
          setEsFavorito(false);
        }
      } catch (err) {
        console.error("Error verificando favorito:", err);
        setEsFavorito(false);
      } finally {
        setLoadingCheckFav(false);
      }
    };

    checkFavorito();
  }, [isOpen, posteoId, fetchWithAuth]);

  // ✅ Alternar favorito
  const toggleFavorito = async () => {
    if (!posteoId) return;
    setLoadingFav(true);

    try {
      let res;
      if (esFavorito) {
        // 🔴 Eliminar favorito
        res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/favoritos/${posteoId}`,
          { method: "DELETE" }
        );
      } else {
        // 🟢 Agregar favorito
        res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/favoritos/${posteoId}`,
          { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imagenUrl, autorId })
          },
        );
      }

      if (!res.ok) throw new Error("Error en añadir/eliminar favorito");
      const data = await res.json();

      if (data.msg === "Agregado en Favoritos") {
        setEsFavorito(true);
      } else if (data.msg === "Eliminado de Favoritos") {
        setEsFavorito(false);
      }
    } catch (err) {
      console.error("Error en toggleFavorito:", err);
    } finally {
      setLoadingFav(false);
    }
  };

  return { esFavorito, loadingFav, loadingCheckFav, toggleFavorito };
};
