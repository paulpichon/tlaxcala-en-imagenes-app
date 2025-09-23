"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PosteoDetalle from "./PosteoDetalle";

export default function PosteoModal({ isOpen }: { isOpen: boolean }) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center"
        style={{ zIndex: 1050 }}
        onClick={() => router.back()} // 👈 cerrar con click fuera
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded shadow-lg p-3"
          style={{
            width: "90%",
            maxWidth: "800px",
            maxHeight: "90%",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <PosteoDetalle />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
