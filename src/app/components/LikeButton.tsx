'use client';

import { useLikes } from "@/app/hooks/useLikes";
import { LikeButtonProps } from "@/types/types";
import { FiHeart } from "react-icons/fi";

export default function LikeButton({ postId, likesCount, hasLiked, onOpenLikesModal, readOnly = false }: LikeButtonProps) {
  const { likeState, toggleLike, loading } = useLikes(postId, likesCount, hasLiked);

  const handleClick = () => {
    if (readOnly) return;
    toggleLike();
  };

  const handleCountClick = () => {
    if (readOnly) return;
    onOpenLikesModal?.();
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading || readOnly}
        className={`like-button ${likeState.hasLiked ? "liked" : ""}`}
        aria-label="Boton like"
      >
        {loading ? (
          <span className="spinner-border spinner-border-sm" role="status" />
        ) : (
          <FiHeart className="cursor-pointer" color={likeState.hasLiked ? "red" : "black"} />
        )}
      </button>

      <div
        className="d-inline"
        onClick={handleCountClick}
        style={{ cursor: readOnly ? "default" : "pointer" }}
      >
        {loading ? (
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
