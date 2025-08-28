'use client';

import { useState, useEffect } from "react";
import { PropsModalOpcionesPublicacion } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
// Module CSS
import perfil from "../ui/perfil/perfil.module.css";
import Spinner from "./spinner";

const ModalOpcionesPublicacion: React.FC<PropsModalOpcionesPublicacion> = ({ isOpen, selectedImage, onClose }) => {
  const { fetchWithAuth } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(true); // para evitar parpadeo

  // ✅ Al abrir el modal, consultamos si YA sigue al usuario
  useEffect(() => {
    const checkIfFollowing = async () => {
      if (!isOpen || !selectedImage?._idUsuario) return;
      setCheckingFollow(true);

    	try {
			const res = await fetchWithAuth(
			`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/followers/is-following/${selectedImage._idUsuario._id}`
			);
			if (res.ok) {
			const data = await res.json();
			
			setIsFollowing(data.sigueUsuario); // true o false
			} else {
			console.warn("No se pudo verificar follow");
			setIsFollowing(false);
			}
		} catch (error) {
			console.error("Error verificando follow:", error);
			setIsFollowing(false);
		} finally {
			setCheckingFollow(false);
		}
    };

    checkIfFollowing();
  }, [isOpen, selectedImage?._idUsuario, fetchWithAuth]);

  const handleToggleFollow = async () => {
    if (!selectedImage?._idUsuario) return;
    setLoading(true);

    try {
      let res;
      if (isFollowing) {
        // 🔴 Dejar de seguir
        res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/followers/unfollow/${selectedImage._idUsuario._id}`,
          {
            method: "DELETE",
          }
        );
      } else {
        // 🟢 Seguir
        res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/followers/follow/${selectedImage._idUsuario._id}`,
          {
            method: "POST",
          }
        );
      }

      	if (!res.ok) throw new Error("Error en follow/unfollow");
    	// const data = await res.json();
    	await res.json();
      	setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error follow/unfollow:", error);
    } finally {
      setLoading(false);
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
                <button
                  id="seguir_usuario"
                  type="button"
                  disabled={loading || checkingFollow}
                  className={` ${perfil.btn_opciones_publicaciones} ${isFollowing ? perfil.btn_rojo : perfil.btn_seguir}`}
                  onClick={handleToggleFollow}
                >
                  {loading
                    ? <Spinner size="20px" />
                    : checkingFollow
                    ? <Spinner size="20px" />
                    : isFollowing
                    ? "Dejar de seguir"
                    : "Seguir"}
                </button>
              </div>
              <div className="col-md-12">
                <a type="button" className={`${perfil.btn_opciones_publicaciones}`} href="#">
                  Añadir a favoritos
                </a>
              </div>
              <div className="col-md-12">
                <a href="#" type="button" className={`${perfil.btn_opciones_publicaciones}`}>
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

// Export
export default ModalOpcionesPublicacion;
