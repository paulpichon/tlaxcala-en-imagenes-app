// Se intenta impolementar la funcionalidad de compartir usando la Web Share API, si el navegador no la soporta, se copia el enlace al portapapeles como fallback.
// Para que funcione al parecer se debe servir la app sobre HTTPS (excepto en localhost para desarrollo).
// para mas informacion: https://chatgpt.com/c/68c33ef8-60b4-8329-ad4f-3bb056557a13
'use client';

import { PropsModalOpcionesPublicacion } from "@/types/types";
import perfil from "../ui/perfil/perfil.module.css";
import FollowButton from "./FollowButton";
import FavoritoButton from "./FavoritoButton";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ModalOpcionesPublicacionProps extends PropsModalOpcionesPublicacion {
  updateFollowState: (userId: string, isFollowing: boolean) => void;
  updateFavoritoState: (postId: string, isFavorito: boolean) => void;
}

const ModalOpcionesPublicacion: React.FC<ModalOpcionesPublicacionProps> = ({
  isOpen,
  selectedImage,
  onClose,
  updateFollowState,
  updateFavoritoState,
}) => {
  const pathname = usePathname();
  if (!isOpen || !selectedImage) return null;

  const isDetallePage = pathname.startsWith(`/posteo/`);
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/posteo/${selectedImage._id}`;

  // Copiar enlace al portapapeles
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      alert("✅ Enlace copiado al portapapeles");
    } catch {
      alert("❌ No se pudo copiar el enlace");
    }
  };

  // Compartir con Web Share API
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
      // fallback: copiar al portapapeles
      handleCopyLink();
    }
  };

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
                {/* Se pasa className como parametro para cambiar el estilo dle boton de cuando esta en Perfil de usuario o en opciones del modal */}
                <FollowButton
                  userId={selectedImage._idUsuario._id}
                  initialFollowing={selectedImage.isFollowing}
                  className={`${perfil.btn_opciones_publicaciones} ${
                    selectedImage.isFollowing ? perfil.btn_rojo : perfil.btn_seguir
                  }`}
                  onToggle={(newState) =>
                    updateFollowState(selectedImage._idUsuario._id, newState)
                  }
                />
              </div>

              <div className="col-md-12">
                <FavoritoButton
                  posteoId={selectedImage._id}
                  autorId={selectedImage._idUsuario._id}
                  imagenUrl={selectedImage.img}
                  initialFavorito={selectedImage.isFavorito}
                  onToggle={(newState) =>
                    updateFavoritoState(selectedImage._id, newState)
                  }
                />
              </div>

              {!isDetallePage ? (
                <div className="col-md-12">
                  <Link
                    href={`/posteo/${selectedImage._id}/`}
                    className={`${perfil.btn_opciones_publicaciones}`}
                  >
                    Ir a la publicación
                  </Link>
                </div>
              ) : (
                <div className="col-md-12">
                  <button
                    type="button"
                    className={`${perfil.btn_opciones_publicaciones}`}
                    onClick={handleShare}
                  >
                    {"share" in navigator
                      ? "Compartir publicación"
                      : "Copiar enlace de la publicación"}
                  </button>

                </div>
              )}

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
