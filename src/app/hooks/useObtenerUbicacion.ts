"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiPost } from "@/lib/apiClient";

export function useObtenerUbicacion() {
  const { fetchWithAuth } = useAuth();

  const [loadingUbicacion, setLoadingUbicacion] = useState(false);
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);

  const [municipioId, setMunicipioId] = useState<string | null>(null);
  const [ciudad, setCiudad] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [pais, setPais] = useState<string | null>(null);

  // Guardar coordenadas y datos de ubicacion en el estado del componente
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

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
      // ! NUEVO 
      // Guardamos las coordenadas locales
      setLat(coords.latitude);
      setLng(coords.longitude);

      // 2️⃣ Consultar tu backend para convertir coords → municipio
      const data = await apiPost<{
        municipio?: { _id: string; nombreMunicipio: string; nombreEntidad: string };
      }>(fetchWithAuth, "/api/ubicacion/reverse", {
        lat: coords.latitude,
        lng: coords.longitude,
      });

      // 3️⃣ Guardar valores
      setMunicipioId(data.municipio?._id || null);
      setCiudad(data.municipio?.nombreMunicipio || null);
      setEstado(data.municipio?.nombreEntidad || null);
      setPais("México"); // Asumimos que siempre sera Mexico, ya que el servicio solo devuelve municipios mexicanos

      return {
        lat: coords.latitude, 
        lng: coords.longitude,
        municipioId: data.municipio?._id || null,
        ciudad: data.municipio?.nombreMunicipio || null,
        estado: data.municipio?.nombreEntidad || null,
        pais: "México", // Asumimos que siempre sera Mexico, ya que el servicio solo devuelve municipios mexicanos
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
    lat,
    lng,
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
    setLat,
    setLng,
  };
}
