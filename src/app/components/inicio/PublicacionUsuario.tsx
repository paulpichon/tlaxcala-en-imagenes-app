'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { FiHeart, FiMoreHorizontal } from "react-icons/fi";
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion";
import { useAuth } from "@/context/AuthContext"; // Para usar fetchWithAuth
import { Posteo } from "@/types/types";

export default function PublicacionUsuario() {
  const { fetchWithAuth } = useAuth(); // Usamos tu función personalizada

  const [posteos, setPosteos] = useState<Posteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPost, setSelectedPost] = useState<Posteo | null>(null);
  const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);

  const openFirstModal = (post: Posteo) => {
    setSelectedPost(post);
    setIsFirstModalOpen(true);
  };
  const closeFirstModal = () => setIsFirstModalOpen(false);

  useEffect(() => {
    const fetchPosteos = async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos`
        );

        if (!res.ok) throw new Error("Error al cargar posteos");

        const data = await res.json();
        setPosteos(data.posteos || []);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los posteos");
      } finally {
        setLoading(false);
      }
    };

    fetchPosteos();
  }, [fetchWithAuth]); // Dependencia para evitar problemas con ESLint

  if (loading) {
    return <p className="text-center mt-5">Cargando publicaciones...</p>;
  }

  if (error) {
    return <p className="text-center mt-5 text-danger">{error}</p>;
  }
  return (
    <>
      {posteos.map((post) => (
        <div key={post.idPost} className="contenedor_publicaciones">
          <div className="container-fluid">
            <div className="contenedor_publicacion">
              <div className="contenedor_encabezado_publicacion">
                <div className="row">
                  <div className="col-3 col-lg-2 d-flex justify-content-center align-items-center">
                    <a className="link_perfil_img" href="">
                      <Image
                        src={post.img}
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
                      <a className="link_perfil_usuario" href="">
                        Usuario {post._idUsuario.slice(0, 6)}...
                      </a>
                    </h5>
                    <p className="ubicacion">Tlaxcala, Tlaxcala</p>
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

          {/* Imagen principal */}
          <div className="publicacion_imagen">
            <Image
              src={post.img}
              width={700}
              height={500}
              className="img-fluid img_publicacion"
              alt={post.texto}
            />
          </div>

          {/* Footer */}
          <div className="container-fluid">
            <div className="contenedor_publicacion">
              <div className="footer_publicacion">
                <button
                  id="likeButton"
                  data-post-id={post.idPost}
                  className="like-button"
                >
                  <FiHeart />
                </button>
                <p id="likeCount" className="d-inline votaciones">0</p>
                <strong className="etiqueta_strong">Me gusta</strong>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Modal opciones de publicación */}
      <ModalOpcionesPublicacion
        isOpen={isFirstModalOpen}
        selectedImage={selectedPost}
        onClose={closeFirstModal}
      />
    </>
  );
}

