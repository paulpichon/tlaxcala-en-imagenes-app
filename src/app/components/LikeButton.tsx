// Componentes de LikeButton
// Archivo: components/LikeButton.tsx
'use client';
// Hook personalizado para manejar likes
import { useLikes } from "@/app/hooks/useLikes";
import { LikeButtonProps } from "@/types/types";
import { FiHeart } from "react-icons/fi";

export default function LikeButton({ postId, onOpenLikesModal }: LikeButtonProps) {
  const { likeState, toggleLike, loading } = useLikes(postId);

  const handleClick = () => {
    toggleLike();
  };

  return (
    <div className="d-flex align-items-center gap-2">
      {/* Botón corazón */}
      <button
        onClick={handleClick}
        disabled={loading}
        className={`like-button ${likeState.hasLiked ? "liked" : ""}`}
      >
        {loading ? (
          <span className="spinner-border spinner-border-sm" role="status" />
        ) : (
          <FiHeart className="cursor-pointer" color={likeState.hasLiked ? "red" : "black"} />
        )}
      </button>

      {/* Contador de likes */}
      <div
        className="d-inline"
        onClick={onOpenLikesModal}
        style={{ cursor: "pointer" }}
      >
        {loading ? (
          // spinner pequeño de Bootstrap mientras carga
          <span className="spinner-border spinner-border-sm align-middle" role="status" />
        ) : (
          <>
            <p className="d-inline votaciones mb-0">{likeState.count}</p>{" "}
            <strong className="etiqueta_strong">Me gusta</strong>
          </>
        )}
      </div>

    </div>
  );
}
