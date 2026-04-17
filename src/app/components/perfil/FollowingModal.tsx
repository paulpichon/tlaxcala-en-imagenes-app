"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import FollowButton from "../FollowButton";
import { useAuth } from "@/context/AuthContext";
import { FollowingUserItemProps } from "@/types/types";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import Link from "next/link";

interface Props {
  userId: string;        // usuario del perfil visitado
  loggedUserId?: string; // usuario logueado
  show: boolean;
  onClose: () => void;
}

export default function FollowingModal({ userId, loggedUserId, show, onClose }: Props) {
  const { fetchWithAuth } = useAuth();
  const [following, setFollowing] = useState<FollowingUserItemProps[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/followers/usuario/lista-followings/${userId}`
        );

        const data = await res.json();
        setFollowing(data.siguiendo);
      } catch (error) {
        console.error("Error obteniendo seguidos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [show, userId, fetchWithAuth]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="following-backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <motion.div
            className="following-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{
              width: "400px",
              maxHeight: "500px",
              background: "white",
              borderRadius: "14px",
              overflowY: "auto",
              padding: "20px",
            }}
          >
            <h4 className="mb-3 text-center">Seguidos</h4>

            {loading && <p className="text-center">Cargando...</p>}

            {!loading && following.length === 0 && (
              <p className="text-center text-muted">Aún no sigue a nadie.</p>
            )}

            {!loading &&
              following.map((item) => {
                const user = item.following;

                const imageSrc = user.imagen_perfil?.public_id
                  ? getCloudinaryUrl(user.imagen_perfil.public_id, "mini")
                  : user.imagen_perfil?.secure_url || "/default-profile.png";

                return (
                  <div
                    key={user._id}
                    className="d-flex justify-content-between align-items-center mb-3"
                  >
                    {/* Avatar + Info */}
                    <div className="d-flex align-items-center gap-2">
                      <Link href={`/${user.url}`}>
                        <Image
                          src={imageSrc}
                          width={45}
                          height={45}
                          className="rounded-circle"
                          alt={user.url}
                        />
                      </Link>

                      <Link
                        href={`/${user.url}`}
                        className="link_perfil_usuario text-dark text-decoration-none"
                      >
                        <div className="d-flex flex-column">
                          <span className="fw-bold">{user.url}</span>
                          <span className="text-muted" style={{ fontSize: "14px" }}>
                            {user.nombre_completo.nombre} {user.nombre_completo.apellido}
                          </span>
                        </div>
                      </Link>
                    </div>

                    {/* 🔥 Ocultar botón si es el usuario logueado */}
                    {loggedUserId !== user._id && (
                      <FollowButton
                        userId={user._id}
                        initialFollowing={item.isFollowing ?? false}
                      />
                    )}
                  </div>
                );
              })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
