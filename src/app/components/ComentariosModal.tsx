'use client';

import { useEffect, useState, useRef } from "react";
import { FiSend, FiMessageCircle } from "react-icons/fi";
import { useComentarios } from "@/app/hooks/useComentarios";
import { comentarioSchema } from "@/lib/validaciones";
import ComentarioItem from "./ComentarioItem";
import styles from "../ui/posteos/ComentariosModal.module.css";
import ToastGlobal from "./ToastGlobal";

interface ComentariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  comentariosActivos?: boolean;
  posteoAutorId?: string;
}

export default function ComentariosModal({
  isOpen,
  onClose,
  postId,
  comentariosActivos,
  posteoAutorId,
}: ComentariosModalProps) {
  const {
    comentarios,
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
  const hasFetched = useRef(false);

  useEffect(() => {
    if (isOpen && !hasFetched.current) {
      hasFetched.current = true;
      fetchComentarios();
    }
    if (!isOpen) {
      hasFetched.current = false;
      setTexto("");
    }
  }, [isOpen, fetchComentarios]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const desactivados = comentariosActivos === false;

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <FiMessageCircle className="me-2" />
                Comentarios
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar" />
            </div>

            <div className={`modal-body ${styles.comentariosList}`}>
              {loadingList ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-secondary" role="status" />
                </div>
              ) : desactivados ? (
                <p className="text-muted text-center py-4">
                  Los comentarios están desactivados
                </p>
              ) : comentarios.length === 0 ? (
                <p className="text-muted text-center py-4">
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

            {!desactivados && (
              <div className={`${styles.comentariosInput} d-flex align-items-center p-3`}>
                <textarea
                  ref={inputRef}
                  className="form-control border-0 shadow-none"
                  rows={1}
                  maxLength={250}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un comentario..."
                  style={{ resize: "none", fontSize: "0.9rem" }}
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
                    <FiSend size={20} />
                  )}
                </button>
              </div>
            )}
          </div>
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
