"use client";

import { useState } from "react";
import Image from "next/image";
import { obtenerImagenPerfilUsuario } from "@/lib/cloudinary/obtenerImagenPerfilUsuario";
import { avatarMiniLoader } from "@/lib/cloudinary/cloudinaryLoader";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Notificacion } from "@/types/types";
import { FiMoreVertical, FiTrash2, FiShield, FiHeart, FiLock, FiFlag, FiBell } from "react-icons/fi";
import type { IconType } from "react-icons";
import ToastGlobal from "../ToastGlobal";

// Tipos 100% sistema (sin emisor): el `mensaje` ya es la frase completa y no se
// antepone nombre. Cada uno lleva su icono en lugar del avatar.
const ICONOS_SISTEMA: Partial<Record<Notificacion["tipo"], { Icono: IconType; color: string }>> = {
  posteo_eliminado_moderacion: { Icono: FiShield, color: "#856404" },
  reporte_resuelto: { Icono: FiFlag, color: "#856404" },
  reporte_descartado: { Icono: FiFlag, color: "#856404" },
  seguridad: { Icono: FiLock, color: "#0d6efd" },
  sistema: { Icono: FiBell, color: "#6c757d" },
};

interface Props {
  notif: Notificacion;
  onClick: (id: string, urlUsuario: string) => void;
  onEliminar: (id: string) => Promise<void>; // 👈 obligatoria ahora
}

export default function NotificacionItem({ notif, onClick, onEliminar }: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "danger" | "creacion" } | null>(null);

  // Notificación de sistema (100% backend): sin identidad de emisor.
  // Ej.: 'posteo_eliminado_moderacion' y, desde la Fase 6, 'reporte_resuelto',
  // 'reporte_descartado', 'seguridad' y 'sistema' (mensaje completo, no se
  // antepone nombre).
  // CONTRATO: `emisor` puede llegar undefined y `referencia` puede llegar
  // null/ausente (el cron de hard-delete borra el posteo referenciado pasado el
  // plazo). Este render usa SOLO `mensaje`, `createdAt` y `notificacion_leida`.
  // Si en el futuro se añade miniatura/preview, comprobar `notif.referencia?.public_id`
  // con optional chaining y fallback, sin renderizar "undefined".
  const iconoSistema = ICONOS_SISTEMA[notif.tipo];
  const esSistema = iconoSistema !== undefined;
  // Like (Fase 3): una notificación por posteo; `mensaje` ya trae «y N−1 más…»,
  // así que el texto no usa `contador`.
  const esLike = notif.tipo === "like";

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
        onClick={() => onClick(notif._id, notif.emisor?.url ?? "")}
        style={{ cursor: "pointer" }}
      >
        {iconoSistema ? (
          <div
            className="d-flex align-items-center justify-content-center rounded-circle border bg-light flex-shrink-0"
            style={{ width: 50, height: 50, color: iconoSistema.color }}
            aria-hidden="true"
          >
            <iconoSistema.Icono size={24} />
          </div>
        ) : (
          <div className="position-relative flex-shrink-0" style={{ width: 50, height: 50 }}>
            <Image
              src={obtenerImagenPerfilUsuario(notif.emisor)}
              loader={avatarMiniLoader}
              alt={notif.emisor?.nombre_completo?.nombre ?? "Usuario"}
              width={50}
              height={50}
              className="rounded-circle border"
            />
            {/* Like agrupado: corazón sobre el avatar de la última persona. */}
            {esLike && (
              <span
                className="position-absolute d-flex align-items-center justify-content-center rounded-circle bg-white border"
                style={{ width: 22, height: 22, right: -4, bottom: -4, color: "#dc3545" }}
                aria-hidden="true"
              >
                <FiHeart size={12} fill="currentColor" />
              </span>
            )}
          </div>
        )}

        <div className="flex-grow-1">
          <p className="mb-1">
            {esSistema ? (
              notif.mensaje
            ) : (
              <>
                <strong>{notif.emisor?.nombre_completo?.nombre}</strong> {notif.mensaje}
              </>
            )}
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
