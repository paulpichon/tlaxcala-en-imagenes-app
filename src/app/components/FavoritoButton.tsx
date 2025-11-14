"use client";

import { FavoritoButtonProps } from "@/types/types";
import Spinner from "./spinner";
import { useFavorito } from "@/context/FavoritoContext";
import { FiHeart } from "react-icons/fi";

const FavoritoButton: React.FC<FavoritoButtonProps> = ({
  posteoId,
  autorId,
  initialFavorito,
  className,
  onRemoved,
  iconOnly = false,
}) => {
  const { favoritosMap, loadingMap, toggleFavorito } = useFavorito();

  const esFavorito = favoritosMap[posteoId] ?? initialFavorito;
  const loading = loadingMap[posteoId] ?? false;

  const handleClick = async () => {
    await toggleFavorito(posteoId, autorId, initialFavorito);
    const ahoraEsFavorito = favoritosMap[posteoId] ?? !initialFavorito;
    if (!ahoraEsFavorito && onRemoved) {
      onRemoved(posteoId);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleClick}
      className={className}
      title={esFavorito ? "Quitar de favoritos" : "Añadir a favoritos"}
    >
      {loading ? (
        <Spinner size="18px" />
      ) : iconOnly ? (
        <FiHeart 
          size={20}
          strokeWidth={2.2}
          color={esFavorito ? "red" : "red"}
          fill={esFavorito ? "red" : "red"} // 👈 sólido si es favorito
        />
      ) : esFavorito ? (
        "Quitar de favoritos"
      ) : (
        "Añadir a favoritos"
      )}
    </button>
  );
};

export default FavoritoButton;
