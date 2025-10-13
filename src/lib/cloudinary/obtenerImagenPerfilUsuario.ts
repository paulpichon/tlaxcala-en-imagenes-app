

// Funcion para verificar si viene una imagen de perfil, si no viene, poner una imagen por defecto
// y si viene, obtener la URL optimizada de cloudinary

import { CloudinaryPreset, UsuarioLogueado } from "@/types/types";
import { getCloudinaryUrl } from "./getCloudinaryUrl";


export const obtenerImagenPerfilUsuario = (user: UsuarioLogueado, preset: CloudinaryPreset) => {

    // ✅ Imagen por defecto para usuarios sin imagen de perfil
    const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/dy9prn3ue/image/upload/v1750995280/tlx-imagenes/assets/no-imagen-usuario_koriq0.webp";
    // ✅ Determinamos la imagen de perfil (si existe: public_id)
    const userProfileImage = user?.imagen_perfil?.public_id
      // Si viene public_id quiere decir que tiene imagen de perfil, entonces obtener la URL optimizada 
      ? getCloudinaryUrl(user.imagen_perfil.public_id, preset)
      // Si no existe public_id, quiere decir que no hay imagen de perfil subida por el usuario ponemos por default: DEFAULT_PROFILE_IMAGE
      : DEFAULT_PROFILE_IMAGE;

      return userProfileImage;
}
