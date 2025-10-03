"use client";

import perfil from "../ui/perfil/perfil.module.css";
import FollowButton from "./FollowButton";
import FavoritoButton from "./FavoritoButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Posteo } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import { useFavorito } from "@/context/FavoritoContext";

interface ModalOpcionesPublicacionProps {
  isOpen: boolean;
  selectedImage: Posteo | null;
  onClose: () => void;
}

const ModalOpcionesPublicacion: React.FC<ModalOpcionesPublicacionProps> = ({
  isOpen,
  selectedImage,
  onClose,
}) => {
  const { user } = useAuth(); // Usuario logueado
  const pathname = usePathname();
  const { favoritosMap } = useFavorito(); // ✅ usamos el FavoritoContext

  if (!isOpen || !selectedImage) return null;

  const isDetallePage = pathname.startsWith(`/posteo/`);
  // Link para comparti, pero debemos checar en produccion si el link esta funcional
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/posteo/${selectedImage._id}/?fuente=tlx_web_link_copiado`;
  // const link = `http://192.168.1.141:3000/posteo/${selectedImage._id}?fuente=tlx_web_link_copiado`;
  
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      alert("✅ Enlace copiado al portapapeles");
    } catch {
      alert("❌ No se pudo copiar el enlace");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mira esta publicación",
          text: selectedImage.texto ?? "Publicación interesante",
          url: link,
        });
      } catch (err) {
        console.warn("El usuario canceló el compartir o hubo un error:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  // ✅ Determinar si el posteo pertenece al usuario logueado
  const isOwnPost = user?.uid === selectedImage._idUsuario._id;

  // ✅ El estado global de favorito
  const esFavoritoGlobal =
    favoritosMap[selectedImage._id] ?? selectedImage.isFavorito;

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
              {isOwnPost ? (
                // 🔹 Si el post es del usuario logueado → mostrar opciones propias
                <>
                  <button
                    className={`${perfil.btn_opciones_publicaciones} text-danger`}
                  >
                    Eliminar
                  </button>
                  <button className={perfil.btn_opciones_publicaciones}>
                    Editar
                  </button>
                </>
              ) : (
                // 🔹 Si NO es del usuario logueado → mostrar botones de interacción
                <>
                  <div className="col-md-12 mb-2">
                    <FollowButton
                      userId={selectedImage._idUsuario._id}
                      initialFollowing={selectedImage.isFollowing}
                      className={perfil.btn_opciones_publicaciones}
                    />
                  </div>

                  <div className="col-md-12 mb-2">
                    <FavoritoButton
                      posteoId={selectedImage._id}
                      autorId={selectedImage._idUsuario._id}
                      imagenUrl={selectedImage.img}
                      initialFavorito={esFavoritoGlobal} // ✅ ahora se conecta al contexto
                      className={perfil.btn_opciones_publicaciones}
                    />
                  </div>
                </>
              )}

              {/* Ir a publicación / Compartir */}
              <div className="col-md-12 mb-2">
                {!isDetallePage ? (
                  <Link
                    href={`/posteo/${selectedImage._id}/`}
                    className={`${perfil.btn_opciones_publicaciones}`}
                  >
                    Ir a la publicación
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`${perfil.btn_opciones_publicaciones}`}
                    onClick={handleShare}
                  >
                    {"share" in navigator
                      ? "Compartir publicación"
                      : "Copiar enlace de la publicación"}
                  </button>
                )}
              </div>

              {/* Denunciar */}
              <div className="col-md-12 mb-2">
                <button
                  type="button"
                  className={`${perfil.btn_opciones_publicaciones} ${perfil.btn_rojo}`}
                >
                  Denunciar
                </button>
              </div>

              {/* Cerrar */}
              <div className="col-md-12">
                <button
                  type="button"
                  className={`${perfil.btn_opciones_publicaciones}`}
                  onClick={onClose}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalOpcionesPublicacion;
