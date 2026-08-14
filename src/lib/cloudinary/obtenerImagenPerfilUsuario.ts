

// Funcion para obtener la referencia de la imagen de perfil:
// - Si el usuario tiene public_id, se devuelve ese public_id (el loader de Cloudinary lo transforma al vuelo).
// - Si no, se devuelve la URL del avatar por defecto (pre-optimizada).

export const DEFAULT_PROFILE_IMAGE = `${process.env.NEXT_PUBLIC_IMAGEN_PERFIL_DEFAULT}`;

type ImagenPerfilOwner = {
  imagen_perfil?: { public_id?: string } | null;
};

export const obtenerImagenPerfilUsuario = (
  user: ImagenPerfilOwner | null | undefined
) => {
  return user?.imagen_perfil?.public_id ?? DEFAULT_PROFILE_IMAGE;
}
