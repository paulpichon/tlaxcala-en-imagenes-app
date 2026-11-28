// Política de enlaces en el texto de posteos y comentarios.
//
// Espejo de `helpers/enlaces-permitidos.js` del backend, que es quien manda:
// solo se permiten enlaces de Google Maps para indicar la ubicación de un
// lugar. Si se agrega un dominio, hay que agregarlo en ambos lados.

// Candidatos a URL: palabras que empiezan con http(s):// o con "www.".
const CANDIDATO_URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"]+/giu;

// Puntuación pegada al final de una URL en un texto ("aquí: https://...).").
const PUNTUACION_FINAL_REGEX = /[.,;:!?¡¿)\]}»"'”’…]+$/u;

const MAX_LONGITUD_URL = 2048;

// host → regla de ruta. `true` = cualquier ruta; RegExp = la ruta debe cumplirla.
const HOSTS_MAPAS = new Map<string, true | RegExp>([
  ['maps.app.goo.gl', true],
  ['goo.gl', /^\/maps(\/|$)/],
  ['maps.google.com', true],
  ['maps.google.com.mx', true],
  ['google.com', /^\/maps(\/|$)/],
  ['www.google.com', /^\/maps(\/|$)/],
  ['google.com.mx', /^\/maps(\/|$)/],
  ['www.google.com.mx', /^\/maps(\/|$)/],
]);

export const MENSAJE_URL_NO_PERMITIDA =
  'Solo se permiten enlaces de Google Maps (https://maps.app.goo.gl/...)';

/** Leyenda bajo la descripción al crear/editar un posteo. */
export const AYUDA_ENLACE_MAPAS =
  '¿Es un negocio o un lugar? Pega su enlace de Google Maps (https://maps.app.goo.gl/...) para que otros lo encuentren.';

/**
 * Devuelve la URL normalizada si apunta a un mapa permitido, o `null`.
 * Exige https, sin credenciales ni puerto, y compara el host ya normalizado por
 * `URL` (así `maps.app.goo.gl.evil.com` o `https://maps.app.goo.gl@evil.com` no pasan).
 */
export function urlMapaPermitida(url: string): string | null {
  if (url.length > MAX_LONGITUD_URL) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password || parsed.port) return null;

  const regla = HOSTS_MAPAS.get(parsed.hostname);
  if (!regla) return null;
  const valida = regla === true
    ? parsed.pathname.length > 1 || parsed.search.length > 1
    : regla.test(parsed.pathname);
  return valida ? parsed.href : null;
}

/** Indica si el texto contiene alguna URL fuera de la lista permitida. */
export function tieneUrlsNoPermitidas(texto: string): boolean {
  const candidatos = texto.match(CANDIDATO_URL_REGEX) ?? [];
  return candidatos.some((c) => {
    const url = c.replace(PUNTUACION_FINAL_REGEX, '');
    return url !== '' && urlMapaPermitida(url) === null;
  });
}

export type SegmentoTexto =
  | { tipo: 'texto'; valor: string }
  | { tipo: 'enlace'; valor: string; href: string };

/**
 * Divide un texto en trozos de texto plano y enlaces de mapas permitidos.
 * Las URLs no permitidas se quedan como texto plano (nunca clicables).
 */
export function dividirTextoConEnlaces(texto: string): SegmentoTexto[] {
  const segmentos: SegmentoTexto[] = [];
  let ultimo = 0;

  const empujarTexto = (valor: string) => {
    if (!valor) return;
    const previo = segmentos[segmentos.length - 1];
    if (previo?.tipo === 'texto') previo.valor += valor;
    else segmentos.push({ tipo: 'texto', valor });
  };

  for (const match of texto.matchAll(CANDIDATO_URL_REGEX)) {
    const inicio = match.index ?? 0;
    const url = match[0].replace(PUNTUACION_FINAL_REGEX, '');
    const href = url ? urlMapaPermitida(url) : null;
    if (!href) continue;

    empujarTexto(texto.slice(ultimo, inicio));
    segmentos.push({ tipo: 'enlace', valor: url, href });
    ultimo = inicio + url.length;
  }
  empujarTexto(texto.slice(ultimo));
  return segmentos;
}
