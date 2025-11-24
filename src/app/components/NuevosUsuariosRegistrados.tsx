"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import FollowButton from "./FollowButton";
// import FollowButton from "@/components/FollowButton"; // 👈 importa tu botón real

interface UsuarioNuevo {
  nombre_completo: { nombre: string; apellido: string };
  imagen_perfil: { secure_url: string };
  url: string;
  _id: string;
  isFollowing: boolean;
};

export default function NuevosUsuariosRegistrados() {
  const [usuarios, setUsuarios] = useState<UsuarioNuevo[]>([]);
  const [loading, setLoading] = useState(true);

  const { fetchWithAuth } = useAuth();

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/usuarios/registrados/nuevos-usuarios-registrados`
        );

        if (!res.ok) throw new Error("Error al cargar nuevos usuarios");

        const data = await res.json();
        setUsuarios(data.nuevosUsuariosRegistrados || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, [fetchWithAuth]);

  const handleToggleFollow = (userId: string, newState: boolean) => {
    setUsuarios((prev) =>
      prev.map((u) =>
        u._id === userId ? { ...u, isFollowing: newState } : u
      )
    );
  };

  return (
    <>
      <h5 className="text-center mt-2 mb-3 titulo_h5_sugerencias_imagenesvotadas">
        Nuevos usuarios
      </h5>

      {loading && <p className="text-center">Cargando...</p>}

      <div className="d-flex flex-column gap-3">
        {usuarios.map((u) => (
          <div
            key={u._id}
            className="d-flex align-items-center gap-3 p-2 user-card"
          >
            {/* Imagen */}
            <a href={`/${u.url}`}>
              <Image
                src={u.imagen_perfil.secure_url}
                alt={u.nombre_completo.nombre}
                width={50}
                height={50}
                className="rounded-circle user-img"
              />
            </a>

            {/* Info */}
            <div className="flex-grow-1">
              <a href={`/${u.url}`} className="text-decoration-none text-dark">
                <p className="mb-0 fw-bold">
                  {u.nombre_completo.nombre} {u.nombre_completo.apellido}
                </p>
                <p className="mb-0 text-muted small">@{u.url}</p>
              </a>
            </div>

            {/* Botón seguir real */}
            <FollowButton
              userId={u._id}
              initialFollowing={u.isFollowing}
              className="btn-sidebar"
              onToggle={(newState) => handleToggleFollow(u._id, newState)}
            />
          </div>
        ))}
      </div>
    </>
  );
}
