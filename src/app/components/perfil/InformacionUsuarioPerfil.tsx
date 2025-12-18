"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import perfil from "../../ui/perfil/perfil.module.css";
import { UsuarioPerfil } from "@/types/types";
import FollowButton from "../FollowButton";
import { useAuth } from "@/context/AuthContext";
import { obtenerImagenPerfilUsuario } from "@/lib/cloudinary/obtenerImagenPerfilUsuario";
import CambiarImagenModal from "../CambiarImagenModal";
import FollowersModal from "./FollowersModal";
import { FiCamera } from "react-icons/fi";
import FollowingModal from "./FollowingModal";

interface Props {
  usuario: UsuarioPerfil;
  totalPosteos?: number;
}

export default function InformacionUsuarioPerfil({ usuario, totalPosteos }: Props) {
  const { user } = useAuth();
  const isOwnProfile = user?.uid === usuario._id;

  const [imagenPerfil, setImagenPerfil] = useState(
    obtenerImagenPerfilUsuario(usuario, "perfil")
  );
  const [showModal, setShowModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [hover, setHover] = useState(false);
  const [totalPublicaciones, setTotalPublicaciones] = useState(usuario.totaltPosteos);
  const [showFollowingModal, setShowFollowingModal] = useState(false);


  useEffect(() => {
    if (typeof totalPosteos === "number") {
      setTotalPublicaciones(totalPosteos);
    }
  }, [totalPosteos]);

  return (
    <div className={perfil.contenedor_info_usuario}>
      {/* Modal cambiar imagen */}
      <CambiarImagenModal
        usuario={usuario}
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={(newUrl) => setImagenPerfil(newUrl)}
      />

      {/* Modal de seguidores */}
      <FollowersModal
        userId={usuario._id}
        loggedUserId={user?.uid}
        show={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
      />
      {/* Modal de Seguidos */}
      <FollowingModal
        userId={usuario._id}
        loggedUserId={user?.uid}
        show={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
      />


      <div className="container mt-4">
        <div className="row align-items-center">
          {/* Imagen perfil */}
          <div className="col-sm-12 col-md-4 text-center">
            <div
              className="position-relative d-inline-block"
              style={{
                width: "150px",
                height: "150px",
                cursor: isOwnProfile ? "pointer" : "default",
              }}
              onClick={() => isOwnProfile && setShowModal(true)}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              <Image
                priority
                src={imagenPerfil}
                width={150}
                height={150}
                className={`rounded-circle object-cover`}
                alt={`Imagen de perfil de @${usuario.url}`}
              />

              {isOwnProfile && hover && (
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center rounded-circle"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    transition: "opacity 0.3s ease",
                  }}
                >
                  <FiCamera color="white" size={28} />
                  <span
                    style={{
                      color: "white",
                      fontSize: "13px",
                      marginTop: "4px",
                      fontWeight: 500,
                    }}
                  >
                    Cambiar foto
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Información usuario */}
          <div className="col-sm-12 col-md-8">
            <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
              <h2 className="mb-0 fw-normal">{usuario.url || usuario.correo}</h2>

              {!isOwnProfile && (
                <FollowButton
                  userId={usuario._id}
                  initialFollowing={usuario.isFollowing}
                  className={`${perfil.btn_base_usuario}`}
                />
              )}
            </div>

            {/* Estadísticas */}
            <div className="d-flex flex-wrap gap-4 mb-2">
              <span>
                <strong>{totalPublicaciones}</strong> publicaciones
              </span>

              <span
                role="button"
                style={{ cursor: "pointer" }}
                onClick={() => setShowFollowersModal(true)}
              >
                <strong>{usuario.totalSeguidores}</strong> seguidores
              </span>

              <span
                role="button"
                style={{ cursor: "pointer" }}
                onClick={() => setShowFollowingModal(true)}
              >
                <strong>{usuario.totalSeguidos}</strong> seguidos
              </span>
            </div>

            {/* Nombre + ubicación */}
            <div>
              <p className="mb-0 fw-bold">
                {usuario.nombre_completo.nombre} {usuario.nombre_completo.apellido}
              </p>
              <p className="text-muted">
                {usuario.lugar_radicacion?.nombreEntidad || "Sin ubicación"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
