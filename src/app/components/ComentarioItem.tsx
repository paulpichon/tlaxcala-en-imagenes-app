'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiTrash2 } from "react-icons/fi";
import { Comentario } from "@/types/types";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_PROFILE = process.env.NEXT_PUBLIC_IMAGEN_PERFIL_DEFAULT || "";

interface ComentarioItemProps {
  comentario: Comentario;
  onDelete?: (commentId: string) => Promise<boolean>;
  posteoAutorId?: string;
}

export default function ComentarioItem({ comentario, onDelete, posteoAutorId }: ComentarioItemProps) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const puedeEliminar = !!(user && (user.uid === comentario.autorId._id || user.uid === posteoAutorId));
  const avatarUrl = comentario.autorId.imagen_perfil?.secure_url || DEFAULT_PROFILE;

  const fecha = new Date(comentario.createdAt);
  const fechaFormateada = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);

  const handleDelete = async () => {
    if (!onDelete || deleting) return;
    setDeleting(true);
    await onDelete(comentario._id);
    setDeleting(false);
  };

  return (
    <div className="d-flex gap-2 py-2">
      <Link href={`/${comentario.autorId.url}`}>
        <Image
          src={avatarUrl}
          alt={`@${comentario.autorId.url}`}
          width={32}
          height={32}
          className="rounded-circle border flex-shrink-0"
          style={{ objectFit: "cover" }}
        />
      </Link>

      <div className="flex-grow-1 min-w-0">
        <div className="d-flex align-items-center gap-1 flex-wrap">
          <Link
            href={`/${comentario.autorId.url}`}
            className="text-dark text-decoration-none fw-bold small"
          >
            {comentario.autorId.nombre_completo.nombre}{" "}
            {comentario.autorId.nombre_completo.apellido}
          </Link>
          <span className="text-muted" style={{ fontSize: "0.7rem" }}>
            {fechaFormateada}
          </span>
        </div>

        <p className="mb-0 small" style={{ wordBreak: "break-word" }}>
          {comentario.texto}
        </p>
      </div>

      {puedeEliminar && onDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn btn-sm p-0 text-muted flex-shrink-0"
          style={{ background: "none", border: "none", height: "fit-content" }}
          aria-label="Eliminar comentario"
        >
          {deleting ? (
            <span className="spinner-border spinner-border-sm" role="status" />
          ) : (
            <FiTrash2 size={14} />
          )}
        </button>
      )}
    </div>
  );
}
