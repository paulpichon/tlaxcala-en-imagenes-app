"use client";

import Image from "next/image";
import { usePublicidad } from "@/context/PublicidadContext";

export default function Publicidad() {
  const { anuncioActual, pausar, reanudar } = usePublicidad();

  return (
    <a
      href={anuncioActual.url}
      target="_blank"
      className="text-decoration-none"
      onMouseEnter={pausar}
      onMouseLeave={reanudar}
    >
      <div
        className="position-relative rounded overflow-hidden shadow-sm publicidad-fade"
        style={{
          height: "260px",
          cursor: "pointer",
          borderRadius: "18px",
          transition: "opacity 0.6s ease-in-out"
        }}
      >
        <Image
          key={anuncioActual.id}
          src={anuncioActual.imagen}
          alt="Publicidad"
          fill
          priority
          style={{ objectFit: "cover" }}
        />

        <span
          className="position-absolute top-2 start-2 px-2 py-1 rounded text-white"
          style={{
            background: "rgba(0,0,0,0.55)",
            fontSize: "12px",
            backdropFilter: "blur(3px)"
          }}
        >
          Patrocinado
        </span>

        <div
          className="position-absolute bottom-0 w-100 p-3"
          style={{
            background: "linear-gradient(transparent, rgba(0,0,0,0.7))"
          }}
        >
          {/* <p className="text-white fw-semibold mb-2" style={{ fontSize: "15px" }}>
            {anuncioActual.titulo}
          </p> */}

          {/* <button
            className="btn btn-light btn-sm"
            style={{
              borderRadius: "20px",
              padding: "4px 14px",
              fontSize: "13px"
            }}
          >
            Ver más
          </button> */}
        </div>
      </div>
    </a>
  );
}
