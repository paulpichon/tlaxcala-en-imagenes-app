/**
 * Recursos de PWA para iOS.
 *
 * iOS ignora el `background_color` y los iconos del manifest al abrir una web
 * app instalada: sin una imagen de arranque (`apple-touch-startup-image`) que
 * coincida EXACTAMENTE con la pantalla del dispositivo, muestra solo blanco.
 * Las imágenes (logo beige centrado sobre blanco, solo vertical) viven en
 * `public/assets/splash/`. Los modelos que no estén en esta lista (o el modo
 * horizontal) verán el fondo blanco por defecto.
 *
 * Al añadir un modelo nuevo: generar el PNG de `ancho*dpr` × `alto*dpr` y
 * agregar su fila aquí.
 */

export const ICONO_APPLE_TOUCH = "/assets/pwa/apple-touch-icon-180.png";

// [ancho CSS, alto CSS, device-pixel-ratio, archivo]
const PANTALLAS_IOS: ReadonlyArray<readonly [number, number, number, string]> = [
  [440, 956, 3, "iphone-16-pro-max-1320x2868.png"],
  [430, 932, 3, "iphone-15-pro-max-1290x2796.png"],
  [428, 926, 3, "iphone-14-plus-1284x2778.png"],
  [420, 912, 3, "iphone-air-1260x2736.png"],
  [402, 874, 3, "iphone-16-pro-1206x2622.png"],
  [393, 852, 3, "iphone-15-1179x2556.png"],
  [390, 844, 3, "iphone-14-1170x2532.png"],
  [414, 896, 3, "iphone-11-pro-max-1242x2688.png"],
  [414, 896, 2, "iphone-11-828x1792.png"],
  [375, 812, 3, "iphone-x-1125x2436.png"],
  [414, 736, 3, "iphone-8-plus-1242x2208.png"],
  [375, 667, 2, "iphone-8-750x1334.png"],
  [320, 568, 2, "iphone-se1-640x1136.png"],
  [1032, 1376, 2, "ipad-pro-13-2064x2752.png"],
  [1024, 1366, 2, "ipad-pro-12-9-2048x2732.png"],
  [834, 1210, 2, "ipad-pro-11-m4-1668x2420.png"],
  [834, 1194, 2, "ipad-pro-11-1668x2388.png"],
  [834, 1112, 2, "ipad-pro-10-5-1668x2224.png"],
  [820, 1180, 2, "ipad-air-1640x2360.png"],
  [810, 1080, 2, "ipad-10-2-1620x2160.png"],
  [768, 1024, 2, "ipad-9-7-1536x2048.png"],
  [744, 1133, 2, "ipad-mini-1488x2266.png"],
];

/** Valor para `metadata.appleWebApp.startupImage` de Next. */
export const IMAGENES_ARRANQUE_IOS = PANTALLAS_IOS.map(([ancho, alto, dpr, archivo]) => ({
  url: `/assets/splash/${archivo}`,
  media: `(device-width: ${ancho}px) and (device-height: ${alto}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
}));
