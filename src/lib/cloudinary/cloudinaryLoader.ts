// src/lib/cloudinary/cloudinaryLoader.ts
// Loader de next/image que construye URLs de Cloudinary transformadas al vuelo
// usando los presets existentes. Se usa por <Image> con el prop `loader`.

import type { ImageLoaderProps } from "next/image";
import { CloudinaryPreset } from "@/types/types";
import { getCloudinaryUrl } from "./getCloudinaryUrl";

type CloudinaryLoaderOptions = {
  // Si es true, fuerza h = w (recortes/pads cuadrados).
  square?: boolean;
  // Ancho máximo solicitado a Cloudinary (protege contra srcset muy grandes).
  cap?: number;
};

/**
 * Crea un loader de next/image ligado a un preset de Cloudinary.
 * - Si `src` es una URL completa (http/https), un blob (preview) o data URI, lo devuelve tal cual.
 * - Si `src` es un `public_id`, construye la URL con el preset y transformaciones automáticas.
 */
export function createCloudinaryLoader(
  preset: CloudinaryPreset,
  { square = false, cap }: CloudinaryLoaderOptions = {}
) {
  return ({ src, width }: ImageLoaderProps): string => {
    if (!src || /^(https?:|blob:|data:|\/)/i.test(src)) return src;

    const w = cap ? Math.min(width, cap) : width;

    return getCloudinaryUrl(src, preset, {
      width: w,
      height: square ? w : undefined,
      quality: "auto",
      format: "auto",
      useAutoTransforms: true,
    });
  };
}

// ✅ Loaders listos para avatares (perfil y miniaturas)
export const avatarPerfilLoader = createCloudinaryLoader("perfil", {
  square: true,
  cap: 200,
});

export const avatarMiniLoader = createCloudinaryLoader("mini", {
  square: true,
  cap: 120,
});
