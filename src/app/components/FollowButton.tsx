'use client';

import React from "react";
import Spinner from "./spinner"; // 👈 tu componente spinner
import perfil from "../ui/perfil/perfil.module.css"; // 👈 estilos CSS
import { useFollow } from "../hooks/useFollow";

interface FollowButtonProps {
  userId: string; // ID del usuario dueño de la publicación o perfil
}

const FollowButton: React.FC<FollowButtonProps> = ({ userId }) => {
  const { isFollowing, loading, checkingFollow, toggleFollow } = useFollow(userId);

  return (
    <button
      type="button"
      disabled={loading || checkingFollow}
      className={` ${perfil.btn_opciones_publicaciones} ${
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
