// fUNCION PARA OBTENER LA UBICACIÓN DEL USUARIO
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function useObtenerUbicacion() {
  const { fetchWithAuth } = useAuth();

  const [loadingUbicacion, setLoadingUbicacion] = useState(false);
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);

  const [municipioId, setMunicipioId] = useState<string | null>(null);
  const [ciudad, setCiudad] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [pais, setPais] = useState<string | null>(null);

  // ⚡ Función reutilizable
  const obtenerUbicacion = async () => {
    try {
      setLoadingUbicacion(true);
      setUbicacionError(null);

      // 1️⃣ Obtener coordenadas del navegador
      const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      });

      // 2️⃣ Consultar tu backend para convertir coords → municipio
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ubicacion/reverse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: coords.latitude,
            lng: coords.longitude,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.msg || "Error al obtener ubicación");

      // 3️⃣ Guardar valores
      setMunicipioId(data.municipio?._id || null);
      setCiudad(data.municipio?.nombreMunicipio || null);
      setEstado(data.municipio?.nombreEntidad || null);
      setPais(data.pais || null);

      return {
        municipioId: data.municipio?._id || null,
        ciudad: data.municipio?.nombreMunicipio || null,
        estado: data.municipio?.nombreEntidad || null,
        pais: data.pais || null,
      };
    } catch (error) {
      console.error(error);
      setUbicacionError("No se pudo obtener ubicación automáticamente");
      return null;
    } finally {
      setLoadingUbicacion(false);
    }
  };

  return {
    obtenerUbicacion,
    loadingUbicacion,
    ubicacionError,

    municipioId,
    ciudad,
    estado,
    pais,
    setMunicipioId,
    setCiudad,
    setEstado,
    setPais,
  };
}
