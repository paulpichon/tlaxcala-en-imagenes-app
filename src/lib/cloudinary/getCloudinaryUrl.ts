// lib/cloudinary/getCloudinaryUrl.ts

export type CloudinaryPreset = "feed" | "detalle" | "perfil" | "grid" | "mini" | "custom";

export interface CloudinaryCustomOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "limit" | "fit" | "scale" | "thumb";
  gravity?: "auto" | "face" | "center";
  quality?: "auto" | number;
  format?: "auto" | "jpg" | "webp" | "avif" | "png";
}

/**
 * Genera una URL de Cloudinary con transformaciones predefinidas o personalizadas.
 * @param publicId public_id de Cloudinary (ej: tlaxcala-en-imagenes/usuarios/1234/abcd-efgh)
 * @param preset Nombre del preset o "custom" para opciones manuales
 * @param options Opciones personalizadas (si preset = "custom")
 */
export function getCloudinaryUrl(
  publicId: string,
  preset: CloudinaryPreset = "feed",
  options: CloudinaryCustomOptions = {}
): string {
  if (!publicId) return "";

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
  if (!cloudName) {
    console.warn("⚠️ Falta NEXT_PUBLIC_CLOUDINARY_NAME en el .env");
    return "";
  }

  // 🎨 Presets predefinidos (ajustables)
  const presets: Record<Exclude<CloudinaryPreset, "custom">, CloudinaryCustomOptions> = {
    feed: {
      width: 600,
      height: 600,
      crop: "fill",
      gravity: "auto",
      quality: "auto",
      format: "auto",
    },
    detalle: {
      width: 1080,
      crop: "limit",
      gravity: "auto",
      quality: "auto",
      format: "auto",
    },
    perfil: {
      width: 80,
      height: 80,
      crop: "fill",
      gravity: "face",
      quality: "auto",
      format: "auto",
    },
    grid: {
      width: 300,
      height: 300,
      crop: "fill",
      gravity: "auto",
      quality: "auto",
      format: "auto",
    },
    mini: {
      width: 40,
      height: 40,
      crop: "fill",
      gravity: "face",
      quality: "auto",
      format: "auto",
    },
  };

  const config = preset === "custom" ? options : presets[preset];

  const {
    width,
    height,
    crop = "fill",
    gravity = "auto",
    quality = "auto",
    format = "auto",
  } = config;

  const transformations = [
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
    crop ? `c_${crop}` : null,
    gravity ? `g_${gravity}` : null,
    quality ? `q_${quality}` : null,
    format ? `f_${format}` : null,
  ]
    .filter(Boolean)
    .join(",");

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}.jpg`;
}
