'use client';

import perfil from "../ui/perfil/perfil.module.css";
import Spinner from "./spinner";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FavoritoButtonProps } from "@/types/types";


const FavoritoButton: React.FC<FavoritoButtonProps> = ({ posteoId, autorId, imagenUrl, initialFavorito, onToggle, }) => {
  const { fetchWithAuth } = useAuth();
  const [esFavorito, setEsFavorito] = useState(initialFavorito);
  const [loading, setLoading] = useState(false);
  
  const toggleFavorito = async () => {
    setLoading(true);
    try {
      // Aquí va tu llamada al backend (añadir/quitar favorito)
      let res;
      if (esFavorito) {
        res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/favoritos/${posteoId}`, { method: "DELETE" });
      } else {
        res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/favoritos/${posteoId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagenUrl, autorId }),
        });        
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

  return (
    <button
      type="button"
      disabled={loading}
      className={`${perfil.btn_opciones_publicaciones}`}
      onClick={toggleFavorito}
    >
      {loading ? <Spinner size="20px" /> : esFavorito ? "Quitar de favoritos" : "Añadir a favoritos"}
    </button>
  );
};

export default FavoritoButton;
