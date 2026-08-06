"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const anuncios = [
    {
      id: 1,
      imagen: `${process.env.NEXT_PUBLIC_IMAGEN_PUBLICIDAD_UNO}`,
      // titulo: "Explora las fotos mejor votadas del mes",
      url: "https://linktr.ee/olivarestaurantetlax?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGna3nkdD9iJMzC-Sd_mzqe6jp2zKhCXhbe8m9MRRf6K6X4lPfdWJTdhDN8rmU_aem_Oyx2DT5GsY8eL37XYXDMYg"
    },
    {
      id: 2,
      imagen: `${process.env.NEXT_PUBLIC_IMAGEN_PUBLICIDAD_DOS}`,
      // titulo: "Descubre los lugares más visitados",
      url: "https://lenayolivo.com.mx"
    },
    {
      id: 3,
      imagen: `${process.env.NEXT_PUBLIC_IMAGEN_PUBLICIDAD_TRES}`,
      // titulo: "Participa subiendo tu mejor foto",
      url: "https://www.instagram.com/brindisi_panaderiaartesanal/"
    }
  ];

interface PublicidadContextType {
  anuncioActual: (typeof anuncios)[number];
  indice: number;
  pausar: () => void;
  reanudar: () => void;
}

const PublicidadContext = createContext<PublicidadContextType | null>(null);

export function PublicidadProvider({ children }: { children: React.ReactNode }) {
  const [indice, setIndice] = useState(0);
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);

  const pausar = useCallback(() => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
  }, []);

  const reanudar = useCallback(() => {
    pausar();
    intervaloRef.current = setInterval(() => {
      setIndice((prev) => (prev + 1) % anuncios.length);
    }, 8000);
  }, [pausar]);

  useEffect(() => {
    reanudar();
    return pausar;
  }, [reanudar, pausar]);

  return (
    <PublicidadContext.Provider
      value={{
        anuncioActual: anuncios[indice],
        indice,
        pausar,
        reanudar
      }}
    >
      {children}
    </PublicidadContext.Provider>
  );
}

export function usePublicidad() {
  const context = useContext(PublicidadContext);
  if (!context) throw new Error("usePublicidad debe usarse dentro de PublicidadProvider");
  return context;
}
