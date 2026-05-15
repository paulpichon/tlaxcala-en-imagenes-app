// hooks/useCrearPosteo.ts
import { useState, useEffect } from "react";
import { posteoSchema, posteoBaseSchema } from "@/lib/validaciones";
import { ZodError } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Posteo } from "@/types/types";
import { useObtenerUbicacion } from "./useObtenerUbicacion";

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
    setMunicipioId(null);
    setCiudad(null);
    setEstado(null);
    setPais(null);
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
      setErrors(result.error.issues.map((e) => e.message));
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
  🌍 OBTENER UBICACIÓN
  ─────────────────────────────────────
  */
  const {
    obtenerUbicacion,
    loadingUbicacion,
    ubicacionError,
    municipioId,
    ciudad,
    estado,
    pais,
    lat,
    lng,
    setMunicipioId,
    setCiudad,
    setEstado,
    setPais,
    setLat,
    setLng,
  } = useObtenerUbicacion();
  
  

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
      if (municipioId) formData.append("municipio", municipioId);
      if (ciudad) formData.append("ciudad", ciudad);
      if (estado) formData.append("estado", estado);
      if (pais) formData.append("pais", pais);

      // 🆕 Agregamos las coordenadas si existen
      if (lat) formData.append("lat", String(lat));
      if (lng) formData.append("lng", String(lng));

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
        setErrors(err.issues.map((e) => e.message));
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
    lat,
    lng,
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
    loadingUbicacion,
    ubicacionError,
  };
}
