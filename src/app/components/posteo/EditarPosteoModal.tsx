// Funcion para editar un posteo
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ToastGlobal from "../ToastGlobal";
import { editarPosteoSchema } from "@/lib/validaciones";
import { AnimatePresence, motion } from "framer-motion";
import { EditarPosteoModalProps } from "@/types/types";

export default function EditarPosteoModal({
  isOpen,
  posteo,
  onClose,
}: EditarPosteoModalProps) {
  const { fetchWithAuth } = useAuth();

  const [texto, setTexto] = useState(posteo?.texto || "");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "danger" | "creacion";
  } | null>(null);

  if (!isOpen || !posteo) return null;

  // -------------------------
  // VALIDACIÓN ZOD
  // -------------------------
  const validarTexto = () => {
    const result = editarPosteoSchema.safeParse({ texto });

    if (!result.success) {
      const mensajeError = result.error.errors[0]?.message || "Campo inválido";
      setToast({ message: mensajeError, type: "danger" });
      return false;
    }

    return true;
  };

  // -------------------------
  // GUARDAR CAMBIOS
  // -------------------------
  const handleGuardar = async () => {
    if (!validarTexto()) return;

    try {
      setLoading(true);

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${posteo._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setToast({
          message: "Publicación actualizada correctamente 🎉",
          type: "success",
        });

        setTimeout(() => {
          onClose(true, texto);
        }, 600);
      } else {
        setToast({
          message: data.msg || "No se pudo actualizar ❌",
          type: "danger",
        });
      }
    } catch (err) {
      console.error("Error al actualizar:", err);
      setToast({ message: "Error interno ❌", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // CONTADOR DE CARACTERES
  // -------------------------
  const maxChars = 200;
//   const charsLeft = maxChars - texto.length;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75"
            style={{ zIndex: 2000 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >

            {/* Modal interno */}
            <motion.div
              className="bg-white rounded-4 p-4 shadow-lg"
              style={{ maxWidth: 420, width: "90%" }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h5 className="mb-3 text-center">Editar publicación</h5>

              {/* TEXTAREA */}
              <textarea
                className="form-control mb-2"
                rows={4}
                maxLength={maxChars}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe algo..."
              />

              {/* CONTADOR */}
              <div className="text-end small mb-3">
                {texto.length}/{maxChars}
              </div>

              {/* BOTONES */}
              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => onClose(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  className="btnGuardarCambiarMedium"
                  disabled={loading}
                  onClick={handleGuardar}
                >
                  {loading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </motion.div>

            {/* TOAST */}
            {toast && (
              <ToastGlobal
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
