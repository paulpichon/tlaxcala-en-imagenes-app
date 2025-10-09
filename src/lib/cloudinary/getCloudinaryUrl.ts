// src/lib/cloudinary/getCloudinaryUrl.ts
// Función para generar URLs de Cloudinary con presets y opciones seguras
// ?: Documentacion de cloudinary para mas informacion
//* https://cloudinary.com/documentation/face_detection_based_transformations

import { CloudinaryCustomOptions } from "@/types/types";
// Tipos de presets disponibles
export type CloudinaryPreset =
  | "feed"
  | "detalle"
  | "perfil"
  | "grid"
  | "mini"
  | "custom";
  
/**
 * ✅ Genera una URL transformada de Cloudinary según un preset o configuración custom.
 * - Evita el bug de imágenes rotas por combinación g_auto,q_auto,f_auto.
 * - Usa configuraciones seguras por preset.
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

  // 1️⃣ Limpiar extensión (por si viene con .jpg, .png, etc.)
  const withoutExt = publicId.replace(/\.(jpe?g|png|gif|webp|avif|bmp|tiff)$/i, "");

  // 2️⃣ Codificar segmentos del path manteniendo '/'
  const safePublicId = withoutExt.split("/").map(encodeURIComponent).join("/");

  // 3️⃣ Presets definidos
  const presets: Record<Exclude<CloudinaryPreset, "custom">, CloudinaryCustomOptions> = {
    // Feed (cuadrado tipo Instagram)
    feed: {
      width: 600,
      height: 600,
      crop: "fill",
      gravity: "face", // centrado en rostro si es posible
      quality: 85,
      format: null, // ❌ sin f_auto (evita bug)
      useAutoTransforms: false,
    },
    // Detalle (grande, sin recorte y con fondo gris oscuro)
    detalle: {
      width: 1080,
      height: 1080,
      crop: "pad",
      gravity: "auto",
      background: "auto",
      quality: 85,
      format: null, // ❌ sin f_auto
      useAutoTransforms: false,
    },
    // Foto de perfil
    perfil: {
      width: 300,
      height: 300,
      crop: "thumb",
      gravity: "center", // centrado en rostro
      quality:85,
      format: null,
      useAutoTransforms: false,
    },
    // Cuadrícula de publicaciones
    grid: {
      width: 300,
      height: 300,
      crop: "fill",
      gravity: "face", // centrado en rostro
      quality: 85,
      format: null,
      useAutoTransforms: false,
    },
    // Íconos o miniaturas
    mini: {
      width: 60,
      height: 60,
      crop: "fill",
      gravity: "face", // centrado en rostro
      quality: 85,
      format: null,
      useAutoTransforms: false,
    },
  };

  const config = preset === "custom" ? options : presets[preset];

  const {
    width,
    height,
    crop,
    gravity,
    background,
    quality,
    format,
    useAutoTransforms = false,
  } = config;

  // 4️⃣ Construcción de transformaciones seguras
  const parts: string[] = [];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (crop) parts.push(`c_${crop}`);
  if (gravity && gravity !== "auto") parts.push(`g_${gravity}`);
  if (background) parts.push(`b_${background}`);

  // Solo añadimos los flags automáticos seguros
  if (useAutoTransforms) {
    if (gravity === "auto") parts.push("g_auto");
    if (quality === "auto") parts.push("q_auto");
    if (format === "auto") parts.push("f_auto");
  } else {
    if (typeof quality === "number" || quality === "auto") parts.push(`q_${quality}`);
    if (format && format !== "auto") parts.push(`f_${format}`);
  }

  const transformation = parts.filter(Boolean).join(",");

  // 5️⃣ URL final
  const url = transformation
    ? `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${safePublicId}`
    : `https://res.cloudinary.com/${cloudName}/image/upload/${safePublicId}`;

  return url;
}
