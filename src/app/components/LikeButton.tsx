// Archivo: components/LikeButton.tsx
// Botón de Like reutilizable con contador y modal opcional

'use client';

import { FiHeart } from "react-icons/fi";
import { useLikes } from "@/app/hooks/useLikes";

interface LikeButtonProps {
  postId: string;
  onOpenLikesModal?: () => void; // opcional: abre el modal con usuarios
}

export default function LikeButton({ postId, onOpenLikesModal }: LikeButtonProps) {
  const { likeState, toggleLike, loading } = useLikes(postId);

  if (loading) return null; // opcional: puedes poner un Spinner aquí

  return (
    <div className="d-flex align-items-center gap-2">
      {/* Botón corazón */}
      <button
        onClick={toggleLike}
        className={`like-button ${likeState.hasLiked ? "liked" : ""}`}
      >
        <FiHeart color={likeState.hasLiked ? "red" : "black"} />
      </button>

      {/* Contador de likes (abre modal si existe onOpenLikesModal) */}
      <div
        className="d-inline"
        onClick={onOpenLikesModal}
        style={{ cursor: "pointer" }}
      >
        <p className="d-inline votaciones mb-0">{likeState.count}</p>{" "}
        <strong className="etiqueta_strong">Me gusta</strong>
      </div>
    </div>
  );
}
