"use client";
import Image from "next/image";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Notificacion } from "@/types/types";

interface Props {
  notif: Notificacion;
  onClick: (id: string, urlUsuario: string) => void;
}

export default function NotificacionItem({ notif, onClick }: Props) {
  return (
    <div
      className={`list-group-item list-group-item-action d-flex align-items-center gap-3 ${
        notif.notificacion_leida ? "bg-light text-muted" : "bg-white fw-semibold"
      }`}
      onClick={() => onClick(notif._id, notif.emisor.url)}
      style={{ cursor: "pointer" }}
    >
      <Image
        src={getCloudinaryUrl(
          notif.emisor.imagen_perfil?.public_id ||
            "https://res.cloudinary.com/dy9prn3ue/image/upload/v1750995280/tlx-imagenes/assets/no-imagen-usuario_koriq0.webp",
          "mini"
        )}
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
    </div>
  );
}
