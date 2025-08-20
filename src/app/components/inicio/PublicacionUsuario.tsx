'use client';

import Image from "next/image";
import { FiHeart, FiMoreHorizontal } from "react-icons/fi";
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";
import { useState } from "react";
import { useInfinitePosts } from "@/app/hooks/useInfinitePosts";
import { Posteo } from "@/types/types";
// Spinner de carga de publicaciones
import Spinner from "../spinner";

export default function PublicacionUsuario() {
  const { posts, loading, observerRef, finished } = useInfinitePosts(
    `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos`
  );

  const [selectedPost, setSelectedPost] = useState<Posteo | null>(null);
  const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);

  const openFirstModal = (post: Posteo) => {
    setSelectedPost(post);
    setIsFirstModalOpen(true);
  };
  const closeFirstModal = () => setIsFirstModalOpen(false);

  if (loading && posts.length === 0)
    return <p className="text-center mt-5">Cargando publicaciones...</p>;

  return (
    <>
      {posts.map((post) => (
        <div key={post.idPost} className="contenedor_publicaciones">
          {/* Contenido de la publicación */}
          <div className="container-fluid">
            <div className="contenedor_publicacion">
              <div className="contenedor_encabezado_publicacion">
                <div className="row">
                  <div className="col-3 col-lg-2 d-flex justify-content-center align-items-center">
                    <a className="link_perfil_img" href={`perfil/${post._idUsuario.url}`}>
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
                  <div className="col-7 col-lg-8">
                    <h5 className="nombre_usuario_publicacion">
                      <a className="link_perfil_usuario" href={`perfil/${post._idUsuario.url}`}>
                        {post._idUsuario.nombre_completo.nombre + " " + post._idUsuario.nombre_completo.apellido}
                      </a>
                    </h5>
                    <p className="ubicacion">{post.texto}</p>
                  </div>
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

          <div className="publicacion_imagen">
            <Image
              src={post.img}
              width={700}
              height={500}
              className="img-fluid img_publicacion"
              alt={post.texto}
            />
          </div>

          <div className="container-fluid">
            <div className="contenedor_publicacion">
              <div className="footer_publicacion">
                <button id="likeButton" data-post-id={post.idPost} className="like-button">
                  <FiHeart />
                </button>
                <p id="likeCount" className="d-inline votaciones">0</p>
                <strong className="etiqueta_strong">Me gusta</strong>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Div invisible para Intersection Observer */}
      <div ref={observerRef} />

      {/* Spinner mientras se cargan más publicaciones */}
      {loading && !finished && <Spinner />}

      {/* Mensaje cuando ya no hay más publicaciones */}
      {finished && posts.length > 0 && (
        <p className="text-center mt-3 mb-5 pb-5 text-muted">No hay más publicaciones</p>
      )}

      {/* Modal opciones */}
      <ModalOpcionesPublicacion
        isOpen={isFirstModalOpen}
        selectedImage={selectedPost}
        onClose={closeFirstModal}
      />
    </>
  );
}
