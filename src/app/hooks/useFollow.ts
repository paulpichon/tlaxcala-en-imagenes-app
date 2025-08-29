'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function useFollow(userId?: string, isOpen: boolean = true) {
  const { fetchWithAuth } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(true);

  // ✅ Verificar si YA sigue al usuario
  useEffect(() => {
    const checkIfFollowing = async () => {
      if (!isOpen || !userId) return;
      setCheckingFollow(true);

      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/followers/is-following/${userId}`
        );

        if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.sigueUsuario); // { "sigueUsuario": true/false }
        } else {
          console.warn("No se pudo verificar follow");
          setIsFollowing(false);
        }
      } catch (error) {
        console.error("Error verificando follow:", error);
        setIsFollowing(false);
      } finally {
        setCheckingFollow(false);
      }
    };

    checkIfFollowing();
  }, [userId, isOpen, fetchWithAuth]);

  // ✅ Toggle seguir / dejar de seguir
  const toggleFollow = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      let res;
      if (isFollowing) {
        // 🔴 Dejar de seguir
        res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/followers/unfollow/${userId}`,
          { method: "DELETE" }
        );
      } else {
        // 🟢 Seguir
        res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/followers/follow/${userId}`,
          { method: "POST" }
        );
      }

      if (!res.ok) throw new Error("Error en follow/unfollow");
      await res.json();

      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error follow/unfollow:", error);
    } finally {
      setLoading(false);
    }
  };

  return { isFollowing, loading, checkingFollow, toggleFollow };
}
