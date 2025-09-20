'use client';

import { useFollowButton } from "../hooks/useFollow";
import Spinner from "./spinner";
import { FollowButtonProps } from "@/types/types";
import perfil from "../ui/perfil/perfil.module.css";
// esta interface extiende de FollowButtonProps para agregar className opcional
interface Props extends FollowButtonProps {
  className?: string; // estilos custom opcionales
}

const FollowButton: React.FC<Props> = ({ userId, initialFollowing, onToggle, className }) => {
  const { isFollowing, loading, toggleFollow } = useFollowButton(userId, initialFollowing, onToggle);

  return (
    <button
      type="button"
      disabled={loading}
      className={className ?? `${isFollowing ? `${perfil.btn_dejarSeguir_usuario}` : `${perfil.btn_seguir_usuario}`}`}
      onClick={toggleFollow}
      style={{ minWidth: "120px" }} // 👈 evita que el botón se achique al mostrar el spinner
    >
      {loading ? (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <Spinner size="18px" />
        </div>
      ) : (
        isFollowing ? "Dejar de seguir" : "Seguir"
      )}
    </button>
  );
};

export default FollowButton;
