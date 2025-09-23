"use client";

import { useEffect, useState } from "react";
import perfil from "../../ui/perfil/perfil.module.css";
import Image from "next/image";
import { Posteo } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
// import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PublicacionesUsuarioGrid({ usuarioId }: { usuarioId: string }) {
  const { fetchWithAuth } = useAuth();
  const [posteos, setPosteos] = useState<Posteo[]>([]);
  const [loading, setLoading] = useState(true);
  // const router = useRouter();

  useEffect(() => {
    if (!usuarioId) return;

    const fetchPosteos = async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/usuario/${usuarioId}`
        );
        if (!res.ok) throw new Error("Error al obtener posteos");
        const data = await res.json();
        setPosteos(data.posteos || []);
      } catch (error) {
        console.error("Error al cargar posteos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosteos();
  }, [usuarioId, fetchWithAuth]);

  if (loading) return <p className="text-center mt-3">Cargando publicaciones...</p>;
  if (!posteos.length) return <p className="text-center mt-3">Este usuario no tiene publicaciones</p>;

  return (
    <div className="row g-1">
      {posteos.map((posteo) => (
        <div key={posteo._id} className="col-4">
          <div className="card">
          <Link 
            href={`/posteo/${posteo._id}?modal=true`} 
            scroll={false} // 👈 importante: no hace scroll top
          >
            <Image
              src={posteo.img}
              alt={posteo.texto}
              width={200}
              height={200}
              className={`${perfil.imagen_grid_perfil_usuario} gallery-image`}
              style={{ cursor: "pointer" }}
            />
          </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
