"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import perfil from "../../ui/perfil/perfil.module.css";
import { Favorito, ApiResponseFavoritos } from "@/types/types";
import Spinner from "../spinner";
import FavoritoButton from "../FavoritoButton";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import { useFavorito } from "@/context/FavoritoContext";

export default function Favoritos() {
  const { fetchWithAuth } = useAuth();
  const { favoritosMap } = useFavorito();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);
  const [next, setNext] = useState<string | null>(null);

  const obtenerFavoritos = useCallback(
    async (url?: string) => {
      try {
        setLoading(true);
        const endpoint =
          url ||
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/favoritos?limite=10`;

        const res = await fetchWithAuth(endpoint);
        if (!res.ok) throw new Error("Error al obtener favoritos");

        const data: ApiResponseFavoritos = await res.json();

        setFavoritos((prev) => {
          const nuevos = data.favoritos.filter(
            (nuevo) => !prev.some((existente) => existente._id === nuevo._id)
          );
          return [...prev, ...nuevos];
        });

        setNext(data.next);
      } catch (error) {
        console.error("Error cargando favoritos:", error);
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth]
  );

  useEffect(() => {
    obtenerFavoritos();
  }, [obtenerFavoritos]);

  // ✅ Cuando se quita un favorito, eliminarlo del grid
  const handleRemoveFavorito = (posteoId: string) => {
    setFavoritos((prev) => prev.filter((fav) => fav.posteoId._id !== posteoId));
  };

  const cargarMas = () => {
    if (next) obtenerFavoritos(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}${next}`);
  };

  if (loading && favoritos.length === 0)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner />
      </div>
    );

  if (!favoritos.length && !loading)
    return <p className="text-center mt-5">Aún no tienes favoritos guardados.</p>;

  return (
    <div className="container mt-4">
      <h5 className="text-center mb-4">Tus Favoritos</h5>

      <div className="row g-3">
        {favoritos.map((fav) => {
          const esFavorito = favoritosMap[fav.posteoId._id] ?? true;
          return (
            <div key={fav._id} className="col-6 col-md-4 col-lg-3">
              <div
                className={`${perfil.contenedor_publicacion_usuario} position-relative`}
              >
                {/* Imagen */}
                <Link
                  href={`/posteo/${fav.posteoId._id}`}
                  title={`Ver posteo de ${fav.autorId.nombre_completo.nombre} ${fav.autorId.nombre_completo.apellido}`}
                >
                  <Image
                    src={getCloudinaryUrl(fav.posteoId.public_id, "grid")}
                    alt={`Favorito de ${fav.autorId.nombre_completo.nombre}`}
                    width={400}
                    height={400}
                    className="img-fluid rounded-3"
                    // style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                </Link>

                {/* 🔸 Botón abajo a la derecha */}
                <div
                  className="position-absolute bottom-0 end-0 m-1"
                  style={{ zIndex: 5 }}
                >
                  <FavoritoButton
                    posteoId={fav.posteoId._id}
                    autorId={fav.autorId.uid}
                    initialFavorito={esFavorito}
                    iconOnly
                    className="btn p-1"
                    onRemoved={handleRemoveFavorito}
                  />
                </div>


                {/* Información del autor */}
                <div className="position-absolute bottom-0 start-0 p-2 text-white bg-dark bg-opacity-50 rounded-bottom w-100">
                  <Link
                    href={`/${fav.autorId.url}`}
                    className="text-white text-decoration-none"
                    title={`Ver perfil de ${fav.autorId.nombre_completo.nombre} ${fav.autorId.nombre_completo.apellido}`}
                  >
                    <small>
                      {fav.autorId.nombre_completo.nombre}{" "}
                      {fav.autorId.nombre_completo.apellido}
                    </small>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {next && (
        <div className="text-center mt-4">
          <button
            onClick={cargarMas}
            disabled={loading}
            className="btn btn-outline-primary btn-sm"
          >
            {loading ? <Spinner size="20px" /> : "Cargar más"}
          </button>
        </div>
      )}
    </div>
  );
}
