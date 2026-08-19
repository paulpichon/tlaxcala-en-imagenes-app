'use client';

import { useEffect } from "react";
import Image from "next/image";
import { LikeUsuario } from "@/types/types";
import Link from "next/link";
// Verificar la imagen de perfil del usuario
import { obtenerImagenPerfilUsuario } from "@/lib/cloudinary/obtenerImagenPerfilUsuario";
import { avatarMiniLoader } from "@/lib/cloudinary/cloudinaryLoader";

interface ModalLikesUsuariosProps {
  isOpen: boolean;
  onClose: () => void;
  usuarios: LikeUsuario[];
}

export default function ModalLikesUsuarios({
  isOpen,
  onClose,
  usuarios,
}: ModalLikesUsuariosProps) {
  // Bloquear scroll cuando el modal está abierto, restaurando el valor previo
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div
      className={`modal fade ${isOpen ? "show d-block" : ""}`}
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title">Personas a las que les gustó</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {usuarios.length === 0 ? (
              <p className="text-muted text-center">Nadie ha dado like aún</p>
            ) : (
                <ul className="list-unstyled">
                  {usuarios.map((like) => (
                    <Link className="text-decoration-none text-dark" href={`/${like._idUsuario.url}`} key={like._idUsuario._id}>
                      <li className="d-flex align-items-center mb-3">
                        <Image
                          src={obtenerImagenPerfilUsuario(like._idUsuario)}
                          loader={avatarMiniLoader}
                          alt={`Imagen de perfil de @${like._idUsuario.url}`}
                          width={40}
                          height={40}
                          className="rounded-circle me-3"
                        />
                        <span>
                          {like._idUsuario.nombre_completo.nombre}{" "}
                          {like._idUsuario.nombre_completo.apellido}
                        </span>
                      </li>
                     </Link>
                  ))}
                </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
