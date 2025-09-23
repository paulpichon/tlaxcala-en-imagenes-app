'use client';

import { useState, useEffect } from "react";
import Spinner from "./spinner";
import { FollowButtonProps } from "@/types/types";
import perfil from "../ui/perfil/perfil.module.css";
import { useFollow } from "@/context/FollowContext";
import { useAuth } from "@/context/AuthContext";

interface Props extends FollowButtonProps {
  className?: string; // estilos custom opcionales
}

const FollowButton: React.FC<Props> = ({ userId, className }) => {
  const { followState, toggleFollow, setFollowState } = useFollow();
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const isFollowing = followState[userId] ?? false;

  // Inicializa el estado del usuario si aún no existe
  useEffect(() => {
    if (userId && followState[userId] === undefined) {
      setFollowState(userId, false); // Puedes reemplazar false por estado inicial desde tu API
    }
  }, [userId, followState, setFollowState]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await fetchWithAuth(`/api/follow/${userId}`, { method: "POST" });
      toggleFollow(userId); // actualiza el estado global para todos los FollowButton
    } catch (err) {
      console.error("Error siguiendo/dejando de seguir:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      className={className ?? `${isFollowing ? perfil.btn_dejarSeguir_usuario : perfil.btn_seguir_usuario}`}
      onClick={handleToggle}
      style={{ minWidth: "120px" }}
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
