// Archivo: PublicacionUsuario.tsx
// Renderiza las publicaciones de los usuarios con likes y modales
'use client';

import Image from "next/image";
import { FiMoreHorizontal } from "react-icons/fi";
import { useState } from "react";
import { useInfinitePosts } from "@/app/hooks/useInfinitePosts";
import { Posteo, LikeUsuario, LikesUsuariosResponse } from "@/types/types";
import Spinner from "../spinner";
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";
import { useAuth } from "@/context/AuthContext";
import ModalLikesUsuarios from "../ModalLikesUsuarios";
import LikeButton from "../LikeButton"; // 👈 Nuevo componente reutilizable

export default function PublicacionUsuario() {
  // Hook para cargar publicaciones con scroll infinito
  const {
    posts,
    loading,
    observerRef,
    finished,
    updateFollowState,
    updateFavoritoState,
  } = useInfinitePosts(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos`);

  const { fetchWithAuth } = useAuth();

  // Estado para modal de opciones de publicación
  const [selectedPost, setSelectedPost] = useState<Posteo | null>(null);
  const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);

  // Estado para modal de usuarios que dieron like
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [likesUsuarios, setLikesUsuarios] = useState<LikeUsuario[]>([]);

  // Abrir modal con usuarios que dieron like
  const openLikesModal = async (postId: string) => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${postId}/likes/usuarios`
      );
      if (!res.ok) return;

      const data: LikesUsuariosResponse = await res.json();
      setLikesUsuarios(data.likes_usuarios_posteo);
      setIsLikesModalOpen(true);
    } catch (err) {
      console.error("Error cargando usuarios de likes:", err);
    }
  };

  const closeLikesModal = () => setIsLikesModalOpen(false);

  // Abrir/cerrar modal de opciones de publicación
  const openFirstModal = (post: Posteo) => {
    setSelectedPost(post);
    setIsFirstModalOpen(true);
  };
  const closeFirstModal = () => setIsFirstModalOpen(false);

  if (loading && posts.length === 0)
    return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner /></div>;

  return (
    <>
      {posts.map((post) => (
        <div key={post._id} className="contenedor_publicaciones">
          {/* Encabezado con info del usuario */}
          <div className="container-fluid">
            <div className="contenedor_publicacion">
              <div className="contenedor_encabezado_publicacion">
                <div className="row">
                  {/* Imagen de perfil */}
                  <div className="col-3 col-lg-2 d-flex justify-content-center align-items-center">
                    <a
                      className="link_perfil_img"
                      href={`perfil/${post._idUsuario.url}`}
                    >
                      <Image
                        src={post._idUsuario.imagen_perfil!.url}
                        className="rounded-circle"
                        width={500}
                        height={500}
                        alt={post.texto}
                        title={post.texto}
                      />
                    </a>
                  </div>
                  {/* Nombre y texto */}
                  <div className="col-7 col-lg-8">
                    <h5 className="nombre_usuario_publicacion">
                      <a
                        className="link_perfil_usuario"
                        href={`perfil/${post._idUsuario.url}`}
                      >
                        {post._idUsuario.nombre_completo.nombre +
                          " " +
                          post._idUsuario.nombre_completo.apellido}
                      </a>
                    </h5>
                    <p className="ubicacion">{post.texto}</p>
                  </div>
                  {/* Botón de opciones */}
                  <div className="col-2 col-lg-2 d-flex justify-content-center align-items-center">
                    <button
                      type="button"
                      className="btn_opciones_modal"
                      aria-label="Options"
                      onClick={() => openFirstModal(post)}
                    >
                      <FiMoreHorizontal />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Imagen de la publicación */}
          <div className="publicacion_imagen">
            <Image
              src={post.img}
              width={700}
              height={500}
              className="img-fluid img_publicacion"
              alt={post.texto}
            />
          </div>

          {/* Footer con likes */}
          <div className="container-fluid">
            <div className="contenedor_publicacion">
              <div className="footer_publicacion">
                <LikeButton
                  postId={post._id}
                  onOpenLikesModal={() => openLikesModal(post._id)}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Div invisible usado por IntersectionObserver para el scroll infinito */}
      <div ref={observerRef} />

      {/* Spinner mientras carga más posts */}
      {loading && !finished && <Spinner />}

      {/* Mensaje cuando no hay más publicaciones */}
      {finished && posts.length > 0 && (
        <p className="text-center mt-3 mb-5 pb-5 text-muted">
          No hay más publicaciones
        </p>
      )}

      {/* Modal de opciones de publicación */}
      <ModalOpcionesPublicacion
        isOpen={isFirstModalOpen}
        selectedImage={selectedPost}
        onClose={closeFirstModal}
        updateFollowState={updateFollowState}
        updateFavoritoState={updateFavoritoState}
      />

      {/* Modal con la lista de usuarios que dieron like */}
      <ModalLikesUsuarios
        isOpen={isLikesModalOpen}
        onClose={closeLikesModal}
        usuarios={likesUsuarios}
      />
    </>
  );
}
