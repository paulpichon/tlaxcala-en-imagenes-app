'use client';

import perfil from "../ui/perfil/perfil.module.css";
import Spinner from "./spinner";
import { useFollow } from "../hooks/useFollow";

interface FollowButtonProps {
  userId: string;
  isOpen: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({ userId, isOpen }) => {
  const { isFollowing, loading, checkingFollow, toggleFollow } = useFollow(userId, isOpen);

  return (
    <button
      type="button"
      disabled={loading || checkingFollow}
      className={`${perfil.btn_opciones_publicaciones} ${
        isFollowing ? perfil.btn_rojo : perfil.btn_seguir
      }`}
      onClick={toggleFollow}
    >
      {loading || checkingFollow ? (
        <Spinner size="20px" />
      ) : isFollowing ? (
        "Dejar de seguir"
      ) : (
        "Seguir"
      )}
    </button>
  );
};

export default FollowButton;
