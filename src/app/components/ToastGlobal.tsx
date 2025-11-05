'use client';

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastGlobalProps } from "@/types/types";

/**
 * ToastGlobal — Componente de notificación flotante global
 * Tipos permitidos: "success" | "danger" | "creacion"
 */

export default function ToastGlobal({
  message,
  type = "creacion",
  onClose,
}: ToastGlobalProps) {
  // Cerrar automáticamente después de unos segundos
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onClose?.(), 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  // Mapa de colores según tipo
  const colorMap: Record<string, { bg: string; text: string }> = {
    success: { bg: "#28a745", text: "#ffffff" },
    danger: { bg: "#dc3545", text: "#ffffff" },
    creacion: { bg: "#EBCA9A", text: "#000000" },
  };

  const { bg, text } = colorMap[type] ?? colorMap.creacion;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.25 }}
          className="position-fixed top-0 start-50 translate-middle-x mt-3"
          style={{ zIndex: 4000 }}
        >
          <div
            className="px-4 py-2 rounded-pill shadow-lg d-flex align-items-center gap-3"
            style={{
              background: bg,
              color: text,
              fontWeight: 600,
              minWidth: 260,
              textAlign: "center",
            }}
          >
            <span style={{ flex: 1 }}>{message}</span>
            {onClose && (
              <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                className="btn btn-sm"
                style={{
                  background: "transparent",
                  border: "none",
                  color: text,
                  fontSize: "16px",
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
