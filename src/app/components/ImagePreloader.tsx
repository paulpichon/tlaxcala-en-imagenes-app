"use client";

import { useEffect } from 'react';

interface Props {
  images: string[]; // URLs de las imágenes a precargar
}

export default function ImagePreloader({ images }: Props) {
  useEffect(() => {
    if (!images || images.length === 0) return;

    // Precargar imágenes en segundo plano
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  return null; // Este componente no renderiza nada
}

// También puedes exportar una función helper
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = async (sources: string[]): Promise<void> => {
  await Promise.all(sources.map(src => preloadImage(src)));
};