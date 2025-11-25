"use client";

import Image from "next/image";
// import FollowButton from "@/components/FollowButton";
import { useNuevosUsuarios } from "@/context/NuevosUsuariosContext";
import FollowButton from "./FollowButton";

export default function NuevosUsuariosRegistrados() {
  const { usuarios, loading } = useNuevosUsuarios();

  return (
    <>
      <h5 className="text-center mt-2 mb-3 titulo_h5_sugerencias_imagenesvotadas">
        Nuevos usuarios
      </h5>

      {loading && <p className="text-center">Cargando...</p>}

      <div className="d-flex flex-column gap-3">
        {usuarios.map((u) => (
          <div key={u._id} className="d-flex align-items-center gap-3 p-2 user-card">
            <a href={`/${u.url}`}>
              <Image
                src={u.imagen_perfil.secure_url}
                alt={u.nombre_completo.nombre}
                width={50}
                height={50}
                className="rounded-circle user-img"
              />
            </a>

            <div className="flex-grow-1">
              <a href={`/${u.url}`} className="text-decoration-none text-dark">
                <p className="mb-0 fw-bold">
                  {u.nombre_completo.nombre} {u.nombre_completo.apellido}
                </p>
                <p className="mb-0 text-muted small">@{u.url}</p>
              </a>
            </div>

            <FollowButton
              userId={u._id}
              initialFollowing={u.isFollowing}
              className="btn-sidebar"
            />
          </div>
        ))}
      </div>
    </>
  );
}
