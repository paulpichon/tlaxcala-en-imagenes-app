'use client';

import { useFavorito } from "../hooks/useFavorito";
import perfil from "../ui/perfil/perfil.module.css";
import Spinner from "./spinner";

interface Props {
  posteoId: string;
  autorId: string;
  imagenUrl: string;
  isOpen: boolean;
}

const FavoritoButton: React.FC<Props> = ({ posteoId, autorId, imagenUrl, isOpen }) => {
  const { esFavorito, loadingFav, loadingCheckFav, toggleFavorito } = useFavorito(
    posteoId,
    autorId,
    imagenUrl,
    isOpen,
  );

  return (
    <button
      type="button"
      disabled={loadingFav || loadingCheckFav}
      className={`${perfil.btn_opciones_publicaciones}`}
      onClick={toggleFavorito}
    >
      {loadingFav || loadingCheckFav ? (
        <Spinner size="20px" />
      ) : esFavorito ? (
        "Quitar de favoritos"
      ) : (
        "Añadir a favoritos"
      )}
    </button>
  );
}

export default FavoritoButton;
