"use client";

import { useState } from "react";
import Image from "next/image";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Notificacion } from "@/types/types";
import { FiMoreVertical, FiTrash2 } from "react-icons/fi";
import ToastGlobal from "../ToastGlobal";

interface Props {
  notif: Notificacion;
  onClick: (id: string, urlUsuario: string) => void;
  onEliminar: (id: string) => Promise<void>; // 👈 obligatoria ahora
}

export default function NotificacionItem({ notif, onClick, onEliminar }: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "danger" | "creacion" } | null>(null);

  const handleEliminar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (eliminando) return;

    try {
      setEliminando(true);
      await onEliminar(notif._id); // 👈 usamos la función del padre

      setToast({ message: "Notificación eliminada correctamente", type: "success" });
    } catch (error) {
      console.error("Error al eliminar:", error);
      setToast({ message: "No se pudo eliminar la notificación", type: "danger" });
    } finally {
      setEliminando(false);
      setMenuAbierto(false);
    }
  };

  return (
    <>
      <div
        className={`list-group-item list-group-item-action d-flex align-items-center gap-3 position-relative ${
          notif.notificacion_leida ? "bg-light text-muted" : "bg-white fw-semibold"
        }`}
        onClick={() => onClick(notif._id, notif.emisor.url)}
        style={{ cursor: "pointer" }}
      >
        <Image
          src={
            notif.emisor.imagen_perfil?.public_id ?     
            getCloudinaryUrl( notif.emisor.imagen_perfil?.public_id, "mini" )
            : "https://res.cloudinary.com/dy9prn3ue/image/upload/v1750995280/tlx-imagenes/assets/no-imagen-usuario_koriq0.webp"
        }
          alt={notif.emisor.nombre_completo.nombre}
          width={50}
          height={50}
          className="rounded-circle border"
        />

        <div className="flex-grow-1">
          <p className="mb-1">
            <strong>{notif.emisor.nombre_completo.nombre}</strong> {notif.mensaje}
            {!notif.notificacion_leida && (
              <span className="badge bg-danger ms-2 rounded-pill">No leído</span>
            )}
          </p>
          <small className="text-muted">
            {format(new Date(notif.createdAt), "d MMM, HH:mm", { locale: es })}
          </small>
        </div>

        {/* Botón de menú */}
        <div className="ms-auto position-relative" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-sm btn-light rounded-circle"
            onClick={() => setMenuAbierto(!menuAbierto)}
            disabled={eliminando}
            title="Opciones"
          >
            <FiMoreVertical />
          </button>

          {menuAbierto && (
            <div
              className="position-absolute bg-white border rounded shadow-sm p-2"
              style={{
                right: 0,
                top: "120%",
                zIndex: 10,
              }}
            >
              <button
                onClick={handleEliminar}
                disabled={eliminando}
                className="btn btn-link text-danger w-100 d-flex align-items-center gap-2"
                style={{ textDecoration: "none" }}
                title="Eliminar notificación"
              >
                 {eliminando ? "Eliminando..." : <FiTrash2 style={{ fontSize: '20px'}} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <ToastGlobal message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
