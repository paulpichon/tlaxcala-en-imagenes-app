"use client";

import perfil from "../ui/perfil/perfil.module.css";
import FollowButton from "./FollowButton";
import FavoritoButton from "./FavoritoButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsModalOpcionesPublicacion } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import { useFavorito } from "@/context/FavoritoContext";
import { useState } from "react";
import ToastGlobal from "./ToastGlobal";
// se agrega onPostDeleted como prop opcional
interface ModalOpcionesPublicacionProps extends PropsModalOpcionesPublicacion {
  onPostDeleted?: (postId: string) => void; // ✅ Nuevo callback opcional
}

const ModalOpcionesPublicacion: React.FC<ModalOpcionesPublicacionProps> = ({
  isOpen,
  selectedImage,
  onClose,
  onPostDeleted,
}) => {
  const { user, fetchWithAuth } = useAuth();
  const pathname = usePathname();
  const { favoritosMap } = useFavorito();

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "danger" | "creacion" } | null>(null);

  if (!isOpen || !selectedImage) return null;

  const isDetallePage = pathname.startsWith(`/posteo/`);
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/posteo/${selectedImage._id}/?fuente=tlx_web_link_copiado`;
  const isOwnPost = user?.uid === selectedImage._idUsuario._id;
  const esFavoritoGlobal = favoritosMap[selectedImage._id] ?? selectedImage.isFavorito;

  // 📋 Copiar enlace sin alert()
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setToast({ message: "Enlace copiado al portapapeles ✅", type: "success" });
    } catch {
      setToast({ message: "No se pudo copiar el enlace ❌", type: "danger" });
    }
  };

  // 📤 Compartir
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mira esta publicación",
          text: selectedImage.texto ?? "Publicación interesante",
          url: link,
        });
      } catch {
        // si cancela, no pasa nada
      }
    } else {
      handleCopyLink();
    }
  };

  // 🗑️ Eliminar publicación con toast
  const handleDeletePost = async () => {
    if (!selectedImage?._id) return;
    setIsDeleting(true);
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${selectedImage._id}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      if (res.ok) {
        setToast({ message: data.msg || "Publicación eliminada correctamente", type: "success" });
        setShowConfirmDelete(false);
        onClose?.();
        onPostDeleted?.(selectedImage._id);
      } else {
        setToast({ message: data.msg || "Error al eliminar la publicación", type: "danger" });
      }
    } catch (err) {
      console.error("Error al eliminar posteo:", err);
      setToast({ message: "Error interno al eliminar la publicación", type: "danger" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Modal principal */}
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
                  <>
                    <button
                      className={`${perfil.btn_opciones_publicaciones} text-danger`}
                      onClick={() => setShowConfirmDelete(true)}
                    >
                      Eliminar
                    </button>
                    <button className={perfil.btn_opciones_publicaciones}>
                      Editar
                    </button>
                  </>
                ) : (
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
                        initialFavorito={esFavoritoGlobal}
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

      {/* Modal confirmación eliminar */}
      {showConfirmDelete && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center">
              <div className="modal-header">
                <h5 className="modal-title">Eliminar publicación</h5>
              </div>
              <div className="modal-body">
                <p className="mb-0">¿Seguro que deseas eliminar esta publicación?</p>
                <p className="text-danger small mt-1">
                  Se eliminará también la imagen asociada.
                </p>
              </div>
              <div className="modal-footer justify-content-center">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Toast visual */}
      {toast && (
        <ToastGlobal
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default ModalOpcionesPublicacion;
