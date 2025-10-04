// components/ui/ToastGlobal.tsx
'use client';

import { motion, AnimatePresence } from "framer-motion";

interface ToastGlobalProps {
  message: string;
  type?: "success" | "danger" | "creacion";
  onClose?: () => void;
}

export default function ToastGlobal({ message, type = "creacion", onClose }: ToastGlobalProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.3 }}
          className="position-fixed top-0 start-50 translate-middle-x mt-3 z-50"
          style={{ zIndex: 4000 }}
        >
          <div
            className={`toast align-items-center text-bg-${type} border-0 shadow-lg show px-4 py-2 rounded-pill`}
            role="alert"
            style={{
              background:
                type === "success"
                  ? "#28a745"
                  : type === "danger"
                  ? "#dc3545"
                  : type === "creacion"
                  ? "#EBCA9A"
                  : "#6c757d",
              color: "white",
              fontWeight: 500,
              minWidth: "250px",
              textAlign: "center",
            }}
          >
            <div className="d-flex justify-content-between align-items-center gap-3">
              <span>{message}</span>
              {onClose && (
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={onClose}
                  aria-label="Cerrar"
                ></button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
