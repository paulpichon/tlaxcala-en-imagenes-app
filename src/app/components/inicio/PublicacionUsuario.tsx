// Archivo: Se renderizan las publicaciones de los usuarios con likes y modales
'use client'; // 👈 Indica a Next.js que este componente es del lado del cliente

// Importaciones necesarias
import Image from "next/image"; // Para imágenes optimizadas en Next.js
import { FiHeart, FiMoreHorizontal } from "react-icons/fi"; // Íconos de Feather (corazón y opciones)
import { useState, useEffect } from "react"; // Hooks de React
import { useInfinitePosts } from "@/app/hooks/useInfinitePosts"; // Hook para cargar posts con scroll infinito
import { Posteo, LikesUsuariosResponse, LikeUsuario } from "@/types/types"; // Tipos de TypeScript
import Spinner from "../spinner"; // Spinner de carga
import ModalOpcionesPublicacion from "../ModalOpcionesPublicacion"; // Modal para opciones de una publicación
import { useAuth } from "@/context/AuthContext"; // Contexto de autenticación (usuario logueado + fetch con auth)
import ModalLikesUsuarios from "../ModalLikesUsuarios"; // Modal para mostrar usuarios que dieron like

// Componente principal
export default function PublicacionUsuario() {
  // Hook que trae publicaciones de la API y maneja scroll infinito
  const { posts, loading, observerRef, finished } = useInfinitePosts(
    `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos`
  );

  // Trae funciones y datos del contexto de autenticación
  const { fetchWithAuth, user } = useAuth();

  // Estado para manejar el modal de opciones de publicación
  const [selectedPost, setSelectedPost] = useState<Posteo | null>(null);
  const [isFirstModalOpen, setIsFirstModalOpen] = useState(false);

  // Estado local para likes por cada post
  // Ejemplo: { "idDelPost": { count: 5, hasLiked: true } }
  const [likesState, setLikesState] = useState<
    Record<string, { count: number; hasLiked: boolean }>
  >({});

  // Estado para manejar el modal de usuarios que dieron like
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [likesUsuarios, setLikesUsuarios] = useState<LikeUsuario[]>([]);

  // 🟢 useEffect: Inicializa el estado de likes de cada post cuando se cargan posts o cambia el usuario logueado
  useEffect(() => {
    if (!user || posts.length === 0) return; // Si no hay usuario o posts, no hacer nada

    let cancelled = false; // Flag para cancelar si el componente se desmonta

    (async () => {
      try {
        // Para cada post, obtenemos los usuarios que dieron like
        const pairs = await Promise.all(
          posts.map(async (post) => {
            const resUsers = await fetchWithAuth(
              `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${post.idPost}/likes/usuarios`
            );
            if (!resUsers.ok) return null;

            const dataUsers: LikesUsuariosResponse = await resUsers.json();

            // Número total de likes
            const count = dataUsers.likes_usuarios_posteo.length || 0;

            // Verificamos si el usuario actual está en la lista de likes
            const hasLiked = dataUsers.likes_usuarios_posteo.some(
              (like) => like._idUsuario._id === user.uid // 👈 compara el uid del usuario logueado con los de la lista
            );

            // Devolvemos un par: [idPost, { count, hasLiked }]
            return [post.idPost, { count, hasLiked }] as const;
          })
        );

        if (cancelled) return; // Si el componente se desmontó, no actualizamos estado

        // Filtramos null y convertimos el array en objeto para setLikesState
        const entries = pairs
          .filter(Boolean) as [string, { count: number; hasLiked: boolean }][];
        setLikesState((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      } catch (err) {
        console.error("Error cargando likes:", err);
      }
    })();

    // Cleanup → si el componente se desmonta, cancelamos la actualización
    return () => {
      cancelled = true;
    };
  }, [posts, user, fetchWithAuth]);

  // 🟢 Función para dar o quitar like a un post
  const toggleLike = async (postId: string) => {
    try {
      // Llamada al endpoint para dar/quitar like
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${postId}/like`,
        { method: "POST" } 
      );
      if (!res.ok) return;

      const data = await res.json();

      // Actualizamos el estado local según la respuesta
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
            [postId]: { count: Math.max(prevData.count - 1, 0), hasLiked: false },
          };
        }
        return prev;
      });
    } catch (err) {
      console.error("Error al dar like:", err);
    }
  };

  // 🟢 Abre el modal con la lista de usuarios que dieron like a un post
  const openLikesModal = async (postId: string) => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${postId}/likes/usuarios`
      );
      if (!res.ok) return;

      const data: LikesUsuariosResponse = await res.json();

      // Guardamos los usuarios en el estado y abrimos el modal
      setLikesUsuarios(data.likes_usuarios_posteo);
      setIsLikesModalOpen(true);
    } catch (err) {
      console.error("Error cargando usuarios de likes:", err);
    }
  };

  // Cierra el modal de likes
  const closeLikesModal = () => setIsLikesModalOpen(false);

  // 🟢 Funciones para abrir/cerrar modal de opciones de publicación
  const openFirstModal = (post: Posteo) => {
    setSelectedPost(post);
    setIsFirstModalOpen(true);
  };
  const closeFirstModal = () => setIsFirstModalOpen(false);

  // 🟢 Si está cargando y aún no hay posts, mostramos un mensaje
  if (loading && posts.length === 0)
    return <p className="text-center mt-5">Cargando publicaciones...</p>;

  // 🟢 Render principal
  return (
    <>
      {posts.map((post) => {
        // Recuperamos info de likes del estado local
        const likeInfo = likesState[post.idPost] || {
          count: 0,
          hasLiked: false,
        };

        return (
          <div key={post.idPost} className="contenedor_publicaciones">
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
                  {/* Botón de like */}
                  <button
                    onClick={() => toggleLike(post.idPost)}
                    className={`like-button ${
                      likeInfo.hasLiked ? "liked" : ""
                    }`}
                  >
                    <FiHeart color={likeInfo.hasLiked ? "red" : "black"} />
                  </button>

                  {/* Número de likes + palabra "Me gusta" → abre modal */}
                  <div
                    className="d-inline"
                    onClick={() => openLikesModal(post.idPost)}
                    style={{cursor:"pointer"}}
                  >
                    <p className="d-inline votaciones mb-0">{likeInfo.count}</p>{" "}
                    <strong className="etiqueta_strong">Me gusta</strong>
                  </div>

                </div>
              </div>
            </div>
          </div>
        );
      })}

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
