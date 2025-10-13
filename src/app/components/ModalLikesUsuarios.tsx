'use client';

import { useEffect } from "react";
import Image from "next/image";
import { LikeUsuario } from "@/types/types";
import Link from "next/link";
// Verificar la imagen de perfil del usuario
import { obtenerImagenPerfilUsuario } from "@/lib/cloudinary/obtenerImagenPerfilUsuario";

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
  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Restaurar siempre al desmontar
    return () => {
      document.body.style.overflow = "";
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
                          src={
                            // Se verifica si la imagen viene por default o si el usuario ya ha subido alguna imagen de perfil, despues llama a getCloudinaryUrl para obtener la URL optimizada
                            // obtenerImagenPerfilUsuario(usuarioLogueado, preset)
                            obtenerImagenPerfilUsuario(like._idUsuario, "mini")
                          }
                          alt={`${like._idUsuario.nombre_completo.nombre}`}
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

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btnCerrarModal" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
