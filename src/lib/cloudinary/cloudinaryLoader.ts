// src/lib/cloudinary/cloudinaryLoader.ts
// Loader de next/image que construye URLs de Cloudinary transformadas al vuelo
// usando los presets existentes. Se usa por <Image> con el prop `loader`.

import type { ImageLoaderProps } from "next/image";
import { CloudinaryPreset, CloudinaryCustomOptions } from "@/types/types";
import { getCloudinaryUrl } from "./getCloudinaryUrl";

type CloudinaryLoaderOptions = {
  // Si es true, fuerza h = w (recortes/pads cuadrados).
  square?: boolean;
  // Proporción alto/ancho para el recorte (ej. 1.25 = 4:5 tipo Instagram).
  aspectRatio?: number;
  // Ancho máximo solicitado a Cloudinary (protege contra srcset muy grandes).
  cap?: number;
  // Overrides de crop/background para presets custom (ej. ImageModal).
  crop?: CloudinaryCustomOptions["crop"];
  gravity?: CloudinaryCustomOptions["gravity"];
  background?: string;
};

/**
 * Crea un loader de next/image ligado a un preset de Cloudinary.
 * - Si `src` es una URL completa (http/https), un blob (preview) o data URI, lo devuelve tal cual.
 * - Si `src` es un `public_id`, construye la URL con el preset y transformaciones automáticas.
 */
export function createCloudinaryLoader(
  preset: CloudinaryPreset,
  {
    square = false,
    aspectRatio,
    cap,
    crop,
    gravity,
    background,
  }: CloudinaryLoaderOptions = {}
) {
  return ({ src, width }: ImageLoaderProps): string => {
    if (!src || /^(https?:|blob:|data:|\/)/i.test(src)) return src;

    const w = cap ? Math.min(width, cap) : width;
    const height = aspectRatio
      ? Math.round(w * aspectRatio)
      : square
        ? w
        : undefined;

    return getCloudinaryUrl(src, preset, {
      width: w,
      height,
      crop,
      gravity,
      background,
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

// ✅ Loaders para posteos
export const feedLoader = createCloudinaryLoader("feed", {
  aspectRatio: 1.25,
  cap: 1080,
  gravity: "auto",
});

export const detalleLoader = createCloudinaryLoader("detalle", {
  square: true,
  cap: 1080,
});

export const gridLoader = createCloudinaryLoader("grid", {
  square: true,
  cap: 400,
});

export const imageModalLoader = createCloudinaryLoader("custom", {
  square: false,
  cap: 1920,
  crop: "limit",
  background: "black",
});
