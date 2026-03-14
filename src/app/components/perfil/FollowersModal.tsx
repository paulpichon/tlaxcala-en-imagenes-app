// Modal para mostrar la lista de seguidores de un usuario
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import FollowButton from "../FollowButton";
import { useAuth } from "@/context/AuthContext";
import { FollowerUserItemProps } from "@/types/types";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import Link from "next/link";

interface Props {
  userId: string;
  loggedUserId?: string; 
  show: boolean;
  onClose: () => void;
}


export default function FollowersModal({ userId, loggedUserId, show, onClose }: Props) {
  const { fetchWithAuth } = useAuth();
  const [followers, setFollowers] = useState<FollowerUserItemProps[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/followers/usuario/lista-followers/${userId}`
        );

        const data = await res.json();

        setFollowers(data.seguidores); // incluye isFollowing
      } catch (error) {
        console.error("Error obteniendo seguidores", error);
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
          className="followers-backdrop"
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
            className="followers-modal"
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
            <h4 className="mb-3 text-center">Seguidores</h4>

            {loading && <p className="text-center">Cargando...</p>}

            {!loading && followers.length === 0 && (
              <p className="text-center text-muted">Aún no tiene seguidores.</p>
            )}

            {!loading &&
              followers.map((item) => {
                const follower = item.follower;

                const imageSrc = follower.imagen_perfil?.public_id
                  ? getCloudinaryUrl(follower.imagen_perfil.public_id, "mini")
                  : follower.imagen_perfil?.secure_url || "/default-profile.png";

                return (
                  <div
                    key={follower._id}
                    className="d-flex justify-content-between align-items-center mb-3"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <Link href={`/${follower.url}`}>
                        <Image
                          src={imageSrc}
                          width={45}
                          height={45}
                          className="rounded-circle"
                          alt={follower.url}
                        />
                      </Link>
                      <Link href={`/${follower.url}`} className="link_perfil_usuario text-dark text-decoration-none">
                      <div className="d-flex flex-column">
                          <span className="fw-bold">{follower.url}</span>
                          <span className="text-muted" style={{ fontSize: "14px" }}>
                            {follower.nombre_completo.nombre}{" "}
                            {follower.nombre_completo.apellido}
                          </span>
                        </div>
                      </Link>
                    </div>
                    {/* Follow button usando isFollowing */}
                    {loggedUserId !== follower._id && (
                    <FollowButton
                      userId={follower._id}
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
