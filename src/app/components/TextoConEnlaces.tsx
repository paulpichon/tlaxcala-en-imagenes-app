import { Fragment } from "react";
import { dividirTextoConEnlaces } from "@/lib/enlaces";

interface TextoConEnlacesProps {
  texto?: string | null;
}

/**
 * Muestra un texto de posteo o comentario convirtiendo en enlace solo las URLs
 * de mapas permitidas (Google Maps). Todo lo demás se renderiza como texto
 * plano, sin `dangerouslySetInnerHTML`.
 */
export default function TextoConEnlaces({ texto }: TextoConEnlacesProps) {
  if (!texto) return null;

  return (
    <>
      {dividirTextoConEnlaces(texto).map((segmento, i) =>
        segmento.tipo === "enlace" ? (
          <a
            key={i}
            href={segmento.href}
            title={segmento.href}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            onClick={(e) => e.stopPropagation()}
          >
            📍 Ver en Google Maps
          </a>
        ) : (
          <Fragment key={i}>{segmento.valor}</Fragment>
        )
      )}
    </>
  );
}
