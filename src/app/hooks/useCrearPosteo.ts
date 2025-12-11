// hooks/useCrearPosteo.ts
import { useState, useEffect } from "react";
import { posteoSchema, posteoBaseSchema } from "@/lib/validaciones";
import { ZodError } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Posteo } from "@/types/types";

export function useCrearPosteo(
  onPostCreated?: (newPost?: Posteo) => void,
  onSuccess?: () => void
) {
  const { fetchWithAuth } = useAuth();

  /*
  ─────────────────────────────────────
  📌 ESTADOS PRINCIPALES DEL FORMULARIO
  ─────────────────────────────────────
  */
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [posteoPublico, setPosteoPublico] = useState(true);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  /*
  ─────────────────────────────────────
  🌍 UBICACIÓN
  ─────────────────────────────────────
  */
  const [municipio, setMunicipio] = useState<string | null>(null);
  const [ciudad, setCiudad] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [pais, setPais] = useState<string | null>(null);
  const [loadingUbicacion, setLoadingUbicacion] = useState(false);
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);

  /*
  ─────────────────────────────────────
  📱 DETECTAR MÓVIL
  ─────────────────────────────────────
  */
  useEffect(() => {
    const checkMobile = () =>
      /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(navigator.userAgent) ||
      window.innerWidth <= 768;

    setIsMobile(checkMobile());

    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /*
  ─────────────────────────────────────
  🔄 RESETEAR FORMULARIO
  ─────────────────────────────────────
  */
  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setTexto("");
    setPosteoPublico(true);
    setErrors([]);

    // Reset ubicación
    setMunicipio(null);
    setCiudad(null);
    setEstado(null);
    setPais(null);
    setUbicacionError(null);
  };

  /*
  ─────────────────────────────────────
  🖼 VALIDAR Y PROCESAR IMAGEN (INMEDIATO)
  ─────────────────────────────────────
  */
  const processFile = (f: File | null) => {
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }

    // Validación inmediata con Zod
    const result = posteoBaseSchema.pick({ file: true }).safeParse({ file: f });

    if (!result.success) {
      setErrors(result.error.errors.map((e) => e.message));
      setFile(null);
      setPreview(null);
      return;
    }

    // Si cambia de imagen → reseteamos campos de texto/ubicación
    resetForm();
    setErrors([]);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  /*
  ─────────────────────────────────────
  🌍 OBTENER UBICACIÓN AUTOMÁTICAMENTE
  ─────────────────────────────────────
  */
  const obtenerUbicacion = async () => {
    try {
      setLoadingUbicacion(true);
      setUbicacionError(null);

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

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/ubicacion/reverse`,
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

      if (!res.ok) {
        throw new Error(data.error || data.msg || "Error al obtener ubicación");
      }

      // Ajustado a lo que realmente envía tu backend
      setCiudad(data.municipio?.nombreMunicipio || null);
      setEstado(data.municipio?.nombreEntidad || null);
      setPais(data.pais || null);
      setMunicipio(data.municipio?._id || null);
    } catch (e) {
      console.error(e);
      setUbicacionError("No se pudo obtener ubicación automáticamente");
    } finally {
      setLoadingUbicacion(false);
    }
  };

  /*
  ─────────────────────────────────────
  📤 ENVIAR FORMULARIO (CREAR POSTEO)
  ─────────────────────────────────────
  */
  const handleSubmit = async () => {
    try {
      // Validación completa antes de enviar
      posteoSchema.parse({ texto, file, posteo_publico: posteoPublico });
      setErrors([]);

      if (!file) return;

      setLoading(true);

      const formData = new FormData();
      formData.append("img", file);
      formData.append("texto", texto);
      formData.append("posteo_publico", String(posteoPublico));

      // Ubicación opcional
      if (municipio) formData.append("municipio", municipio);
      if (ciudad) formData.append("ciudad", ciudad);
      if (estado) formData.append("estado", estado);
      if (pais) formData.append("pais", pais);

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Error al crear posteo");

      const newPost = await res.json();
      onPostCreated?.(newPost);

      resetForm();
      onSuccess?.();
    } catch (err) {
      if (err instanceof ZodError) {
        setErrors(err.errors.map((e) => e.message));
      } else {
        setErrors(["Ocurrió un error al crear la publicación"]);
      }
    } finally {
      setLoading(false);
    }
  };

  /*
  ─────────────────────────────────────
  📤 EXPORT DEL HOOK
  ─────────────────────────────────────
  */
  return {
    file,
    preview,
    texto,
    posteoPublico,
    loading,
    showConfirmDiscard,
    errors,
    isMobile,

    // setters
    setTexto,
    setPosteoPublico,
    setShowConfirmDiscard,
    processFile,
    handleSubmit,
    resetForm,

    // ubicación
    obtenerUbicacion,
    municipio,
    ciudad,
    estado,
    pais,
    setMunicipio,
    setCiudad,
    setEstado,
    setPais,
    loadingUbicacion,
    ubicacionError,
  };
}
