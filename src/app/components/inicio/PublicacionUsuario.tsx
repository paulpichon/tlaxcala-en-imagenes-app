'use client';

import Image from "next/image";
import { FiHeart } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useInfinitePosts } from "@/app/hooks/useInfinitePosts";
import { LikesUsuariosResponse, Posteo } from "@/types/types";
import Spinner from "../spinner";
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";
import { useAuth } from "@/context/AuthContext";

export default function PublicacionUsuario() {
  const { posts, loading, observerRef, finished } = useInfinitePosts(
    `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos`
  );

  const { fetchWithAuth, user } = useAuth();

  const [selectedPost, setSelectedPost] = useState<Posteo | null>(null);
  const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);

  // Estado de likes para cada post
  const [likesState, setLikesState] = useState<Record<string, { count: number; hasLiked: boolean }>>({});

  // Inicializa el estado de likes al cargar posts
useEffect(() => {
  posts.forEach(async (post) => {
    try {
      // Número total de likes
      const resCount = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${post.idPost}/likes`
      );
      if (!resCount.ok) return;
      const dataCount = await resCount.json();
      // Lista de usuarios que dieron like
      const resUsers = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${post.idPost}/likes/usuarios`
      );
      if (!resUsers.ok) return;
      const dataUsers: LikesUsuariosResponse = await resUsers.json();

      const alreadyLiked = dataUsers.likes_usuarios_posteo.some(
        (like) => like._idUsuario.uid === user?.uid
      );

      setLikesState((prev) => ({
        ...prev,
        [post.idPost]: { count: dataCount.likes, hasLiked: alreadyLiked },
      }));
    } catch (err) {
      console.error("Error cargando likes:", err);
    }
  });
}, [posts, user, fetchWithAuth]);

  // Función para dar / quitar like
  const toggleLike = async (postId: string) => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${postId}/like`,
        { method: "PUT" }
      );
      const data = await res.json();
      setLikesState((prev) => {
        const prevData = prev[postId] || { count: 0, hasLiked: false };
        if (data.msg === "Like añadido") {
          return {
            ...prev,
            [postId]: { count: prevData.count + 1, hasLiked: true },
          };
        } else if (data.msg === "Like eliminado") {
          return {
            ...prev,
            [postId]: { count: prevData.count - 1, hasLiked: false },
          };
        }
        return prev;
      });
    } catch (err) {
      console.error("Error al dar like:", err);
    }
  };

  const openFirstModal = (post: Posteo) => {
    setSelectedPost(post);
    setIsFirstModalOpen(true);
  };
  const closeFirstModal = () => setIsFirstModalOpen(false);

  if (loading && posts.length === 0)
    return <p className="text-center mt-5">Cargando publicaciones...</p>;

  return (
    <>
      {posts.map((post) => {
        const likeInfo = likesState[post.idPost] || { count: 0, hasLiked: false };

        return (
          <div key={post.idPost} className="contenedor_publicaciones">
            {/* Encabezado */}
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
                        ⋮
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Imagen */}
            <div className="publicacion_imagen">
              <Image
                src={post.img}
                width={700}
                height={500}
                className="img-fluid img_publicacion"
                alt={post.texto}
              />
            </div>

            {/* Footer: Likes */}
            <div className="container-fluid">
              <div className="contenedor_publicacion">
                <div className="footer_publicacion">
                  <button
                    onClick={() => toggleLike(post.idPost)}
                    className={`like-button ${likeInfo.hasLiked ? "liked" : ""}`}
                  >
                    <FiHeart color={likeInfo.hasLiked ? "red" : "black"} />
                  </button>
                  <p className="d-inline votaciones">{likeInfo.count}</p>
                  <strong className="etiqueta_strong">Me gusta</strong>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Observer */}
      <div ref={observerRef} />

      {loading && !finished && <Spinner />}
      {finished && posts.length > 0 && (
        <p className="text-center mt-3 mb-5 pb-5 text-muted">No hay más publicaciones</p>
      )}

      <ModalOpcionesPublicacion
        isOpen={isFirstModalOpen}
        selectedImage={selectedPost}
        onClose={closeFirstModal}
      />
    </>
  );
}
