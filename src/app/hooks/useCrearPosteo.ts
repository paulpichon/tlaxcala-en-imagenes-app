import { useState, useEffect } from "react";
import {
  posteoSchema,
  posteoBaseSchema,
  validarUbicacionPost,
} from "@/lib/validaciones";
import { ZodError } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Posteo, ApiResponse, SeleccionLocalidad } from "@/types/types";
import { useObtenerUbicacion } from "./useObtenerUbicacion";
import {
  apiPost,
  getUserMessage,
  isApiErrorCode,
  getApiErrorMessage,
  ApiErrorCode,
} from "@/lib/apiClient";
import { invalidarCatalogos } from "@/lib/catalogos";

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
    setLocalidad(null);
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
    localidadCercana,
    setMunicipioId,
    setCiudad,
    setEstado,
    setPais,
    setLat,
    setLng,
  } = useObtenerUbicacion();

  // Localidad INEGI seleccionada (por GPS o cascada manual). Se guarda
  // {clave, nombre}: la clave viaja al backend, el nombre alimenta la UI.
  const [localidad, setLocalidad] = useState<SeleccionLocalidad | null>(null);

  // Envuelve al GPS para adoptar la localidad sugerida por el backend.
  // Si no hay sugerencia (localidad_cercana: null) se limpia la selección.
  const detectarUbicacion = async () => {
    const resultado = await obtenerUbicacion();
    const cercana = resultado?.localidadCercana;
    setLocalidad(
      cercana ? { clave: cercana.clave, nombre: cercana.nombre } : null
    );
    return resultado;
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

      // Validación espejo de ubicación (UX; la autoritativa es el backend)
      const errorUbicacion = validarUbicacionPost(
        municipioId,
        localidad?.clave ?? null
      );
      if (errorUbicacion) {
        setErrors([errorUbicacion]);
        return;
      }

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
      // Localidad INEGI (4 dígitos). Requiere municipio; el backend resuelve
      // y valida el nombre contra la colección Municipio.
      if (municipioId && localidad) {
        formData.append("localidadClave", localidad.clave);
      }

      // 🆕 Agregamos las coordenadas si existen
      if (lat) formData.append("lat", String(lat));
      if (lng) formData.append("lng", String(lng));

      const data = await apiPost<ApiResponse<{ posteo: Posteo }>>(fetchWithAuth, "/api/posteos", formData);
      onPostCreated?.(data.data.posteo);

      resetForm();
      onSuccess?.();
    } catch (err) {
      if (err instanceof ZodError) {
        setErrors(err.issues.map((e) => e.message));
      } else if (isApiErrorCode(err, ApiErrorCode.BAD_REQUEST)) {
        // 400 típico: municipio inexistente o localidad ajena al municipio.
        // El catálogo local quedó obsoleto → invalidar y pedir re-selección.
        invalidarCatalogos();
        setErrors([
          getApiErrorMessage(
            err,
            "Datos de ubicación inválidos. Vuelve a seleccionar municipio y localidad"
          ),
        ]);
      } else {
        setErrors([getUserMessage(err, 'crear_posteo')]);
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
    detectarUbicacion,
    lat,
    lng,
    municipioId,
    ciudad,
    estado,
    pais,
    localidad,
    localidadCercana,
    setMunicipioId,
    setCiudad,
    setEstado,
    setPais,
    setLocalidad,
    setLat,
    setLng,
    loadingUbicacion,
    ubicacionError,
  };
}
