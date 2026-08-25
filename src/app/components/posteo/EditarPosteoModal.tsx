// Funcion para editar un posteo
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ToastGlobal from "../ToastGlobal";
import { editarPosteoSchema, validarUbicacionPost } from "@/lib/validaciones";
import { AnimatePresence, motion } from "framer-motion";
import { Posteo, SeleccionLocalidad } from "@/types/types";
import { FiEdit3, FiMapPin, FiNavigation } from "react-icons/fi";
import { useObtenerUbicacion } from "@/app/hooks/useObtenerUbicacion";
import ManualMunicipioSelector from "../ManualMunicipioSelector";
import {
  apiPut,
  isNotFound,
  getUserMessage,
  isApiErrorCode,
  getApiErrorMessage,
  ApiErrorCode,
} from "@/lib/apiClient";
import { invalidarCatalogos } from "@/lib/catalogos";

// ✅ Actualizar la interfaz del callback
interface EditarPosteoModalProps {
  isOpen: boolean;
  posteo: Posteo;
  onClose: (updated: boolean, posteoActualizado?: Posteo) => void; // ✅ Devolver posteo completo
}

export default function EditarPosteoModal({
  isOpen,
  posteo,
  onClose,
}: EditarPosteoModalProps) {
  const { fetchWithAuth } = useAuth();

  const [texto, setTexto] = useState(posteo?.texto || "");
  const [loading, setLoading] = useState(false);

  const {
    lat,
    lng,
    obtenerUbicacion,
    loadingUbicacion,
    ubicacionError,
    municipioId,
    ciudad,
    estado,
    pais,
    localidadCercana,
    setMunicipioId,
    setCiudad,
    setEstado,
    setPais,
    setLat,
    setLng,
  } = useObtenerUbicacion();

  // Localidad INEGI vigente ({clave, nombre}): la clave viaja en el PUT,
  // el nombre alimenta la etiqueta y el objeto optimista.
  const [localidad, setLocalidad] = useState<SeleccionLocalidad | null>(null);

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "danger" | "creacion">("success");

  // Limpiar toast automáticamente
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (posteo?.ubicacion) {
      setMunicipioId(posteo.ubicacion.municipio || null);
      setCiudad(posteo.ubicacion.ciudad || null);
      setEstado(posteo.ubicacion.estado || null);
      setPais(posteo.ubicacion.pais || null);

      // Localidad guardada (posts antiguos: null)
      const { localidadClave, localidadNombre } = posteo.ubicacion;
      setLocalidad(
        localidadClave && localidadNombre
          ? { clave: localidadClave, nombre: localidadNombre }
          : null
      );

      // ✅ Verificación ultra-segura
      // Comprobamos que existan las coordenadas y que el array interno no sea null
      const coordsArray = posteo.ubicacion.coordinates?.coordinates;
  
      if (Array.isArray(coordsArray) && coordsArray.length >= 2) {
        setLng(coordsArray[0]); // Longitud
        setLat(coordsArray[1]); // Latitud
      } else {
        // Si no hay coordenadas exactas, nos aseguramos de limpiar el estado
        setLat(null);
        setLng(null);
      }
    } else {
      // Si el posteo no tiene ninguna ubicación, reseteamos todo
      eliminarUbicacion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posteo]);
  
  if (!isOpen || !posteo) return null;

  const validarTexto = () => {
    // Ahora aceptará "" o texto válido
    const result = editarPosteoSchema.safeParse({ texto });
  
    if (!result.success) {
      const mensajeError = result.error.issues[0]?.message || "Campo inválido";
      setToastMessage(mensajeError);
      setToastType("danger");
      return false;
    }
  
    return true;
  };

  const eliminarUbicacion = () => {
    setMunicipioId(null);
    setCiudad(null);
    setEstado(null);
    setPais(null);
    setLocalidad(null);
    setLat(null);
    setLng(null);
  };

  // Envuelve al GPS para adoptar la localidad sugerida por el backend
  const detectarUbicacion = async () => {
    const resultado = await obtenerUbicacion();
    const cercana = resultado?.localidadCercana;
    setLocalidad(
      cercana ? { clave: cercana.clave, nombre: cercana.nombre } : null
    );
    return resultado;
  };

  const handleGuardar = async () => {
    if (!validarTexto()) return;

    // Validación espejo de ubicación (UX; la autoritativa es el backend)
    const errorUbicacion = validarUbicacionPost(
      municipioId,
      localidad?.clave ?? null
    );
    if (errorUbicacion) {
      setToastMessage(errorUbicacion);
      setToastType("danger");
      return;
    }

    try {
      setLoading(true);

      // Preparamos el body
      const body: any = {
        texto: texto.trim(), // Enviamos el texto (aunque sea "")
      };

      // Lógica de ubicación (el backend reconstruye ubicacion completa)
      if (municipioId) {
        body.municipio = municipioId;
        body.ciudad = ciudad;
        body.estado = estado;
        body.pais = pais;
        // Clave INEGI; el backend valida que pertenezca al municipio
        if (localidad) {
          body.localidadClave = localidad.clave;
        }
        if (lat && lng) {
          body.lat = lat;
          body.lng = lng;
        }
      } else {
        // Quitar ubicación por completo (sin residuos de coordenadas ni localidad)
        body.municipio = null;
        body.lat = null;
        body.lng = null;
      }

      const data = await apiPut<{ msg: string }>(
        fetchWithAuth,
        `/api/posteos/${posteo._id}`,
        body
      );

      setToastMessage("Publicación actualizada correctamente");
      setToastType("success");

        // ✅ Crear objeto posteo actualizado
        const posteoActualizado: Posteo = {
          ...posteo,
          texto,
          ubicacion: municipioId
            ? {
                municipio: municipioId,
                ciudad: ciudad || "",
                estado: estado || "",
                pais: pais || "",
                ...(localidad
                  ? { localidadClave: localidad.clave, localidadNombre: localidad.nombre }
                  : { localidadClave: null, localidadNombre: null }),
                coordinates:
                  lat && lng
                    ? { type: "Point", coordinates: [lng, lat] }
                    : posteo.ubicacion?.coordinates,
              }
            : undefined,
        };

        setTimeout(() => {
          onClose(true, posteoActualizado);
        }, 600);
    } catch (err) {
      const msg = getUserMessage(err, 'editar_posteo');
      console.error(msg, err);
      if (isNotFound(err)) {
        setToastMessage("La publicación ya no existe");
      } else if (isApiErrorCode(err, ApiErrorCode.BAD_REQUEST)) {
        // 400 típico: municipio inexistente o localidad ajena al municipio.
        // Catálogo obsoleto → invalidar y pedir re-selección.
        invalidarCatalogos();
        setToastMessage(
          getApiErrorMessage(
            err,
            "Datos de ubicación inválidos. Vuelve a seleccionar municipio y localidad"
          )
        );
        setToastType("danger");
      } else {
        setToastMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };
  // Maximmo de caracteres para la descripcion
  const maxChars = 200;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75"
            style={{ zIndex: 2000 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-4 p-4 shadow-lg"
              style={{ maxWidth: 500, width: "90%" }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Editar publicación</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => onClose(false)}
                  disabled={loading}
                ></button>
              </div>

              {/* ====================== */}
              {/* 📍 SECCIÓN UBICACIÓN   */}
              {/* ====================== */}

              <div className="border rounded p-3 mb-3 bg-light">
                <div className="d-flex flex-column align-items-start gap-2 mb-2">
                  <h6 className="fw-bold mb-0">
                    <FiMapPin size={18} style={{ color: "#EBCA9A" }} className="me-1" />
                    Ubicación
                  </h6>

                  {/* Si no hay una ciudad seleccionada/detectada, mostrar botón de GPS */}
                  {!ciudad && !loadingUbicacion && (
                    <button
                      onClick={detectarUbicacion}
                      className="iconLocationBtn"
                      title="Detectar ubicación automáticamente"
                    >
                      <FiNavigation size={16} />
                      Detectar mi ubicación
                    </button>
                  )}

                  {/* Si ya hay datos, mostrar botón de quitar */}
                  {(ciudad || municipioId) && (
                    <button
                      onClick={eliminarUbicacion}
                      className="btn btn-sm btn-outline-danger"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                {loadingUbicacion && (
                  <p className="small text-muted mb-0">Obteniendo ubicación…</p>
                )}

                {ciudad && (
                  <div className="alert alert-success py-2 px-3 mb-2">
                    <strong>{ciudad}</strong>, {estado}, {pais}
                    {/* Sugerencia del reverse geocoding (informativa;
                        la localidad vigente es la del select) */}
                    {lat && lng && localidadCercana && (
                      <span className="d-block small mt-1">
                        📍 Cerca de <strong>{localidadCercana.nombre}</strong> (~{Math.round(localidadCercana.distancia_metros)} m)
                      </span>
                    )}
                    <div className="small text-muted">
                      {/* Lógica dinámica para el origen de la ubicación */}
                      {lat && lng ? (
                        <span className="text-success">✨ Detectada automáticamente</span>
                      ) : (
                        <span className="text-success">🖐️ Selección manual</span>
                      )}
                    </div>
                  </div>
                )}

                {ubicacionError && (
                  <div className="alert alert-warning py-2 px-3 mb-2">
                    No se pudo detectar la ubicación automáticamente
                  </div>
                )}

                <ManualMunicipioSelector
                  municipio={municipioId}
                  localidadClave={localidad?.clave ?? null}
                  onSelect={(id, data, localidadSel) => {
                    // Cambiar de municipio abandona el GPS detectado.
                    // Cambiar sólo la localidad conserva lat/lng (esExacta: true).
                    if (id !== municipioId) {
                      setLat(null);
                      setLng(null);
                    }
                    setMunicipioId(id);
                    setCiudad(data.ciudad);
                    setEstado(data.estado);
                    setPais(data.pais);
                    setLocalidad(localidadSel);
                  }}
                />
              </div>

              {/* ====================== */}
              {/* 📝 SECCIÓN DESCRIPCIÓN */}
              {/* ====================== */}

              <div className="border rounded p-3 mb-3 bg-light">
                <h6 className="fw-bold mb-2">
                  <FiEdit3 size={18} style={{ color: "#EBCA9A" }} className="me-1" />
                  Descripción
                </h6>

                <textarea
                  className="form-control"
                  rows={4}
                  maxLength={maxChars}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escribe algo..."
                />

                <div className="text-end small text-muted mt-1">
                  {texto.length}/{maxChars}
                </div>
              </div>

              {/* BOTONES */}
              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => onClose(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  className="btnPublicarDescartar"
                  disabled={loading}
                  onClick={handleGuardar}
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Toast siempre se renderiza fuera del modal */}
      <ToastGlobal
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />
    </>
  );
}