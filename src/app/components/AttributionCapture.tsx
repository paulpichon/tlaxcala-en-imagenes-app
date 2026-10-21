"use client";

import { useEffect } from "react";
import { captureAttributionFromUrl } from "@/lib/attribution";

/**
 * Componente invisible que dispara la captura de atribución al cargar la
 * página. Se monta en el layout raíz para cubrir cualquier ruta de aterrizaje.
 */
export default function AttributionCapture() {
  useEffect(() => {
    captureAttributionFromUrl();
  }, []);

  return null;
}
