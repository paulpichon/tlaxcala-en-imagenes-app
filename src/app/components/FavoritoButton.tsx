'use client';

import { useFavoritoButton } from "../hooks/useFavorito";
import perfil from "../ui/perfil/perfil.module.css";
import Spinner from "./spinner";
import { FavoritoButtonProps } from "@/types/types";

const FavoritoButton: React.FC<FavoritoButtonProps> = ({
  posteoId,
  autorId,
  imagenUrl,
  initialFavorito,
  onToggle,
}) => {
  const { esFavorito, loading, toggleFavorito } = useFavoritoButton(
    posteoId,
    autorId,
    imagenUrl,
    initialFavorito,
    onToggle
  );

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
