'use client';

import { useEffect, useState, useRef } from "react";
import { FiSend } from "react-icons/fi";
import { useComentarios } from "@/app/hooks/useComentarios";
import { comentarioSchema } from "@/lib/validaciones";
import ComentarioItem from "../ComentarioItem";
import styles from "../../ui/posteos/ComentariosSection.module.css";
import ToastGlobal from "../ToastGlobal";

interface ComentariosSectionProps {
  postId: string;
  comentariosActivos?: boolean;
  posteoAutorId?: string;
}

export default function ComentariosSection({
  postId,
  comentariosActivos,
  posteoAutorId,
}: ComentariosSectionProps) {
  const {
    comentarios,
    total,
    loadingList,
    loadingMore,
    hasMore,
    fetchComentarios,
    cargarMasComentarios,
    agregarComentario,
    eliminarComentario,
  } = useComentarios(postId);

  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "danger" } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComentarios();
  }, [fetchComentarios]);

  const handleSend = async () => {
    const result = comentarioSchema.safeParse({ texto });
    if (!result.success) {
      setToast({
        message: result.error.issues[0]?.message || "Comentario inválido",
        type: "danger",
      });
      return;
    }

    setSending(true);
    const ok = await agregarComentario(result.data.texto);
    setSending(false);

    if (ok) {
      setTexto("");
      if (inputRef.current) inputRef.current.focus();
    } else {
      setToast({ message: "Error al publicar comentario", type: "danger" });
    }
  };

  const handleEliminar = async (commentId: string) => {
    const ok = await eliminarComentario(commentId);
    if (!ok) {
      setToast({ message: "Error al eliminar comentario", type: "danger" });
    }
    return ok;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (comentariosActivos === false) {
    return <div className={styles.disabledText}>Los comentarios están desactivados</div>;
  }

  return (
    <>
      <div className={styles.section}>
        <div className="px-3 pt-2 pb-1">
          <small className="fw-bold text-muted">
            {total} {total === 1 ? "comentario" : "comentarios"}
          </small>
        </div>

        <div className={styles.scrollArea}>
          {loadingList ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-secondary" role="status" />
            </div>
          ) : comentarios.length === 0 ? (
            <p className="text-muted text-center small py-2">
              No hay comentarios aún. Sé el primero en comentar.
            </p>
          ) : (
            <>
              {comentarios.map((c) => (
                <ComentarioItem
                  key={c._id}
                  comentario={c}
                  onDelete={handleEliminar}
                  posteoAutorId={posteoAutorId}
                />
              ))}
              {hasMore && (
                <div className="text-center py-2">
                  <button
                    onClick={cargarMasComentarios}
                    disabled={loadingMore}
                    className="btn btn-sm btn-outline-secondary"
                  >
                    {loadingMore ? (
                      <span className="spinner-border spinner-border-sm" role="status" />
                    ) : (
                      "Cargar más"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.inputArea}>
          <textarea
            ref={inputRef}
            className={styles.inputField}
            rows={1}
            maxLength={250}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comentario..."
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={sending || !texto.trim()}
            className={styles.sendBtn}
            aria-label="Enviar comentario"
          >
            {sending ? (
              <span className="spinner-border spinner-border-sm" role="status" />
            ) : (
              <FiSend size={18} />
            )}
          </button>
        </div>
      </div>

      {toast && (
        <ToastGlobal
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
