"use client";

import React from "react";
import perfil from "../ui/perfil/perfil.module.css";
import Spinner from "./spinner";
import { useFollow } from "@/context/FollowContext";
import { FollowButtonProps } from "@/types/types";

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  initialFollowing,
  className = "",
}) => {
  const { isFollowingMap, loadingMap, toggleFollow } = useFollow();

  // Estado actual: prioriza el contexto, si no usa initialFollowing
  const isFollowing = isFollowingMap[userId] ?? initialFollowing;
  const loading = loadingMap[userId] ?? false;

  const handleClick = () => {
    toggleFollow(userId, isFollowing); // usar el estado actual
  };

  // Combina clase base con color según isFollowing
  const buttonClass = `${className} ${
    isFollowing 
    ? perfil.btn_dejarSeguir_usuario 
    : perfil.btn_seguir_usuario}`;

  return (
    <button
      type="button"
      disabled={loading}
      className={buttonClass}
      onClick={handleClick}
      style={{ minWidth: "120px" }} // evita que se achique con el spinner
    >
      {loading ? (
        <div className="d-flex align-items-center justify-content-center gap-2">
          <Spinner size="18px" />
        </div>
      ) : isFollowing ? (
        "Dejar de seguir"
      ) : (
        "Seguir"
      )}
    </button>
  );
};

export default FollowButton;
