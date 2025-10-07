"use client";

import { UsuarioPerfil } from "@/types/types";
import perfil from "../../ui/perfil/perfil.module.css";
import FollowButton from "../FollowButton";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

interface Props {
  usuario: UsuarioPerfil;
}

export default function InformacionUsuarioPerfil({ usuario }: Props) {
  const { user } = useAuth();
  const isOwnProfile = user?.uid === usuario._id;
  return (
    <div className={perfil.contenedor_info_usuario}>
      <div className="container mt-4">
        <div className="row align-items-center">
          {/* Imagen de perfil */}
          <div className="col-4 col-md-3 text-center">
            <Image
              src={usuario.imagen_perfil?.secure_url || "/default-profile.png"}
              width={150}
              height={150}
              className={`${perfil.img_perfil_usuario} rounded-circle`}
              alt={usuario.nombre_completo.nombre}
            />
          </div>

          {/* Info del usuario */}
          <div className="col-8 col-md-9">
            {/* Primera fila: nombre + botón */}
            <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
              <h2 className="mb-0 fw-normal">{usuario.url || usuario.correo}</h2>

              {/* 👇 Solo mostrar si NO es su propio perfil */}
              {!isOwnProfile && (
                // Se puede pasar className como parametro para cambiar el estilo del boton de cuando esta en Perfil de usuario o en opciones del modal
                <FollowButton
                  userId={usuario._id}
                  initialFollowing={usuario.isFollowing} 
                  // className={`${usuario.isFollowing ? `${perfil.btn_dejarSeguir_usuario}` : `${perfil.btn_seguir_usuario}`}`}
                  className={`${ perfil.btn_base_usuario }`}
                />
              )}
            </div>

            {/* Segunda fila: estadísticas */}
            <div className="d-flex flex-wrap gap-4 mb-2">
              <span><strong>{usuario.totaltPosteos}</strong> publicaciones</span>
              <span><strong>{usuario.totalSeguidores}</strong> seguidores</span>
              <span><strong>{usuario.totalSeguidos}</strong> seguidos</span>
            </div>

            {/* Tercera fila: nombre completo y ubicación */}
            <div>
              <p className="mb-0 fw-bold">
                {usuario.nombre_completo.nombre} {usuario.nombre_completo.apellido}
              </p>
              <p className="text-muted">{usuario.lugar_radicacion?.nombre_estado || "Sin ubicación"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
