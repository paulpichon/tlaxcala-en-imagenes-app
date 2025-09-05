'use client';

import { PropsModalOpcionesPublicacion } from "@/types/types";
import perfil from "../ui/perfil/perfil.module.css";
import FollowButton from "./FollowButton";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Spinner from "./spinner";

const ModalOpcionesPublicacion: React.FC<PropsModalOpcionesPublicacion> = ({
  isOpen,
  selectedImage,
  onClose,
}) => {
  const { fetchWithAuth } = useAuth();
  const [loadingFav, setLoadingFav] = useState(false);
  const [esFavorito, setEsFavorito] = useState(false);

  const [loadingCheckFav, setLoadingCheckFav] = useState(false);
  // 🟢 Cada vez que se abre el modal y hay un post seleccionado,
  // verificamos si ya está en favoritos
  useEffect(() => {
    setLoadingCheckFav(true);
    const checkFavorito = async () => {
      if (!isOpen || !selectedImage) return;
      // Reset antes de pedir al backend
      setEsFavorito(false);
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/favoritos/${selectedImage.idPost}`,
          { method: "GET" }
        );

        if (res.ok) {
          const data = await res.json();
          setEsFavorito(data.esFavorito || false);
        } else {
          setEsFavorito(false);
        }
      } catch (err) {
        console.error("Error verificando favorito:", err);
        setEsFavorito(false);
      } finally {
        setLoadingCheckFav(false);
      }
    };

    checkFavorito();
  }, [isOpen, selectedImage, fetchWithAuth]);

  // 🟢 Handler para alternar favoritos (añadir / quitar)
  const handleToggleFavorito = async () => {
    if (!selectedImage) return;
    setLoadingFav(true);
  
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/favoritos/${selectedImage.idPost}`;
      const res = await fetchWithAuth(url, {
        method: esFavorito ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: !esFavorito
          ? JSON.stringify({
              imagenUrl: selectedImage.img,   // 👈 desde la imagen seleccionada
              autorId: selectedImage._idUsuario._id // 👈 autor del post
            })
          : undefined, // 👈 si es DELETE no mandamos body
      });
  
      const data = await res.json();
  
      if (res.ok) {
        if (data.msg === "Agregado en Favoritos") {
          setEsFavorito(true);
        } else if (data.msg === "Eliminado de Favoritos") {
          setEsFavorito(false);
        }
      } else {
        console.error("❌ Error en favoritos:", data);
      }
    } catch (err) {
      console.error("Error en handleToggleFavorito:", err);
    } finally {
      setLoadingFav(false);
    }
  };
  

  if (!isOpen || !selectedImage) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body">
            <div className="row text-center">
              <div className="col-md-12">
                <FollowButton userId={selectedImage._idUsuario._id} />
              </div>

              {/* 🟢 Botón Añadir/Quitar de favoritos */}
              <div className="col-md-12">
              <button
                type="button"
                onClick={handleToggleFavorito}
                className={`${perfil.btn_opciones_publicaciones}`}
                disabled={loadingFav || loadingCheckFav}
              >
                {loadingFav
                  ? <Spinner size="20px" />
                  : loadingCheckFav
                  ? <Spinner size="20px" />
                  : esFavorito
                  ? "Quitar de favoritos"
                  : "Añadir a favoritos"}
              </button>
              </div>

              <div className="col-md-12">
                <a
                  href="#"
                  type="button"
                  className={`${perfil.btn_opciones_publicaciones}`}
                >
                  Ir a la publicación
                </a>
              </div>

              <div className="col-md-12">
                <a
                  type="button"
                  className={`${perfil.btn_opciones_publicaciones} ${perfil.btn_rojo}`}
                  data-toggle="modal"
                  data-target="#modalDenuncia"
                >
                  Denunciar
                </a>
              </div>

              <div className="col-md-12">
                <a
                  type="button"
                  className={`${perfil.btn_opciones_publicaciones}`}
                  onClick={onClose}
                >
                  Cerrar
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalOpcionesPublicacion;
