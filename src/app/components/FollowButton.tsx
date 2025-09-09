'use client';

import perfil from "../ui/perfil/perfil.module.css";
import Spinner from "./spinner";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FollowButtonProps } from "@/types/types";

const FollowButton: React.FC<FollowButtonProps> = ({ userId, initialFollowing, onToggle }) => {
  const { fetchWithAuth } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async () => {
    setLoading(true);
    try {
      let res;
      if (isFollowing) {
        res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/followers/unfollow/${userId}`, { method: "DELETE" });
      } else {
        res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/followers/follow/${userId}`, { method: "POST" });
      }

      if (res.ok) {
        const newState = !isFollowing;
        setIsFollowing(newState);
        onToggle?.(newState); // 👈 notifica al hook
      }
    } catch (error) {
      console.error("Error follow/unfollow:", error);
    } finally {
      setLoading(false);
    }
  };

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
