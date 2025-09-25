"use client";

import perfil from "../ui/perfil/perfil.module.css";
import FollowButton from "./FollowButton";
import FavoritoButton from "./FavoritoButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Posteo } from "@/types/types";
import { useAuth } from "@/context/AuthContext";

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

  if (!isOpen || !selectedImage) return null;

  const isDetallePage = pathname.startsWith(`/posteo/`);
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/posteo/${selectedImage._id}`;

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
              {/* Verificamos si es nuestro propio POSTEO */}
              {isOwnPost ? (
                //  Mostrar solo si no es propio post 
                <>
                  <button className={`${perfil.btn_opciones_publicaciones} text-danger`}>Eliminar</button>
                  <button className={perfil.btn_opciones_publicaciones}>Editar</button>
                </>
              ) : (
                // Si no es nuestro propio POSTEO, mostramos estos botones
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
                      initialFavorito={selectedImage.isFavorito}
                    />
                  </div>
                </>
             )}

              {/* Ir a publicación / Copiar enlace */}
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
