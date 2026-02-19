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
  <div className="row align-items-start">
    
    {/* FOTO */}
    <div className="col-12 col-md-4 text-center mb-3 mb-md-0">
      <div
        className="position-relative d-inline-block"
        style={{
          width: "100px",
          height: "100px",
          cursor: isOwnProfile ? "pointer" : "default",
        }}
        onClick={() => isOwnProfile && setShowModal(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Image
          priority
          src={imagenPerfil}
          width={100}
          height={100}
          className="rounded-circle object-cover"
          alt={`Imagen de perfil de @${usuario.url}`}
        />
      </div>
    </div>

    {/* INFO */}
    <div className="col-12 col-md-8">

      {/* USERNAME + BOTON */}
      <div className="d-flex align-items-center flex-wrap gap-3 mb-2">
        <h2 className="mb-0 fw-semibold">
          {usuario.url}
        </h2>

        {!isOwnProfile && (
          <FollowButton
            userId={usuario._id}
            initialFollowing={usuario.isFollowing}
          />
        )}
      </div>

      {/* NOMBRE Y UBICACION */}
      <div className="mb-3">
        <p className="mb-0 fw-bold">
          {usuario.nombre_completo.nombre}{" "}
          {usuario.nombre_completo.apellido}
        </p>
        <p className="text-muted small">
          {usuario.lugar_radicacion?.nombreMunicipio || ""}
        </p>
      </div>

      {/* ESTADISTICAS */}
      <div className="d-flex gap-4 border-top pt-3">
        <div className="stat-item">
          <strong>{totalPublicaciones}</strong>
          <div className="text-muted small">Publicaciones</div>
        </div>

        <div
          className="stat-item cursor-pointer"
          onClick={() => setShowFollowersModal(true)}
        >
          <strong>{usuario.totalSeguidores}</strong>
          <div className="text-muted small">Seguidores</div>
        </div>

        <div
          className="stat-item cursor-pointer"
          onClick={() => setShowFollowingModal(true)}
        >
          <strong>{usuario.totalSeguidos}</strong>
          <div className="text-muted small">Siguiendo</div>
        </div>
      </div>

    </div>
  </div>
</div>

    </div>
  );
}
