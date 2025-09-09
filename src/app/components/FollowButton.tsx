'use client';

import { useFollowButton } from "../hooks/useFollow";
import perfil from "../ui/perfil/perfil.module.css";
import Spinner from "./spinner";
import { FollowButtonProps } from "@/types/types";

const FollowButton: React.FC<FollowButtonProps> = ({ userId, initialFollowing, onToggle }) => {
  const { isFollowing, loading, toggleFollow } = useFollowButton(userId, initialFollowing, onToggle);

  return (
    <button
      type="button"
      disabled={loading}
      className={`${perfil.btn_opciones_publicaciones} ${
        isFollowing ? perfil.btn_rojo : perfil.btn_seguir
      }`}
      onClick={toggleFollow}
    >
      {loading ? <Spinner size="20px" /> : isFollowing ? "Dejar de seguir" : "Seguir"}
    </button>
  );
};

export default FollowButton;
