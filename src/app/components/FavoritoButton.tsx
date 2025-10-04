"use client";

import { FavoritoButtonProps } from "@/types/types";
import perfil from "../ui/perfil/perfil.module.css";
import Spinner from "./spinner";
import { useFavorito } from "@/context/FavoritoContext";

const FavoritoButton: React.FC<FavoritoButtonProps> = ({
  posteoId,
  autorId,
  imagenUrl,
  initialFavorito,
  className,
}) => {
  const { favoritosMap, loadingMap, toggleFavorito } = useFavorito();

  const esFavorito = favoritosMap[posteoId] ?? initialFavorito;
  const loading = loadingMap[posteoId] ?? false;

  const handleClick = () => {
    toggleFavorito(posteoId, autorId, imagenUrl, initialFavorito);
  };

  return (
    <button
      type="button"
      disabled={loading}
      className={className ?? perfil.btn_opciones_publicaciones}
      onClick={handleClick}
      style={{ minWidth: "140px" }}
    >
      {loading ? (
        <Spinner size="20px" />
      ) : esFavorito ? (
        "Quitar de favoritos"
      ) : (
        "Añadir a favoritos"
      )}
    </button>
  );
};

export default FavoritoButton;
