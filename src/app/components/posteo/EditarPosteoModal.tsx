// Funcion para editar un posteo
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ToastGlobal from "../ToastGlobal";
import { editarPosteoSchema, validarUbicacionPost } from "@/lib/validaciones";
import { AnimatePresence, motion } from "framer-motion";
import { ApiResponse, Posteo, SeleccionLocalidad, Visibilidad } from "@/types/types";
import { FiEdit3, FiLock, FiMapPin, FiNavigation } from "react-icons/fi";
import { useObtenerUbicacion } from "@/app/hooks/useObtenerUbicacion";
import ManualMunicipioSelector from "../ManualMunicipioSelector";
import {
  apiPut,
  apiDelete,
  isNotFound,
  isForbidden,
  getUserMessage,
  isApiErrorCode,
  getApiErrorMessage,
  ApiErrorCode,
  type Operacion,
} from "@/lib/apiClient";
import { invalidarCatalogos } from "@/lib/catalogos";

// Ubicación normalizada para comparar el formulario contra lo guardado en el posteo
type SnapshotUbicacion = {
  municipioId: string | null;
  ciudad: string | null;
  estado: string | null;
  pais: string | null;
  localidadClave: string | null;
  lat: number | null;
  lng: number | null;
};

// Las escrituras (POST/PUT/DELETE) pueden devolver `ubicacion.municipio` poblado
// como objeto ({ _id, nombreMunicipio, ... }) en lugar del string ObjectId que
// traen los GETs. Se reduce siempre a string|null para no romper los selects.
type UbicacionNormalizada = Omit<NonNullable<Posteo["ubicacion"]>, "municipio"> & {
  municipio?: string | null;
};

function normalizarUbicacionBackend(
  u?: Posteo["ubicacion"]
): UbicacionNormalizada | undefined {
  if (!u) return u;
  const municipio = u.municipio;
  return {
    ...u,
    municipio:
      typeof municipio === "string"
        ? municipio
        : (municipio?._id as string | undefined) || null,
  };
}

function snapshotDesdePosteo(u?: Posteo["ubicacion"]): SnapshotUbicacion {
  const normalizada = normalizarUbicacionBackend(u);
  const coords = normalizada?.coordinates?.coordinates;
  return {
    municipioId: normalizada?.municipio || null,
    ciudad: normalizada?.ciudad || null,
    estado: normalizada?.estado || null,
    pais: normalizada?.pais || null,
    localidadClave: normalizada?.localidadClave || null,
    lat: coords && coords.length >= 2 ? coords[1] : null,
    lng: coords && coords.length >= 2 ? coords[0] : null,
  };
}

const esMismaUbicacion = (a: SnapshotUbicacion, b: SnapshotUbicacion): boolean =>
  a.municipioId === b.municipioId &&
  a.ciudad === b.ciudad &&
  a.estado === b.estado &&
  a.pais === b.pais &&
  a.localidadClave === b.localidadClave &&
  a.lat === b.lat &&
  a.lng === b.lng;

// Campos que la edición puede sincronizar desde la respuesta del backend.
// `_idUsuario` SIEMPRE viene poblado en las escrituras (idéntico a los GETs);
// los flags de sesión (likesCount, hasLiked, isFavorito, isFollowing) NO se
// computan en escrituras (solo GETs con sesión) y se conservan del estado
// previo por construcción. `comentariosCount` SÍ viene autoritativo.
const CAMPOS_EDICION = [
  "texto",
  "ubicacion",
  "visibilidad",
  "fecha_actualizacion",
  "comentariosCount",
] as const;

// Merge selectivo: aplica SOLO los campos de edición presentes en `cambios`,
// conservando intacto el resto del posteo original (autor poblado, likes, etc.)
function fusionarCambios(base: Posteo, cambios?: Partial<Posteo>): Posteo {
  if (!cambios) return base;
  const resultado: Posteo = { ...base };
  for (const campo of CAMPOS_EDICION) {
    if (campo in cambios) {
      const valor =
        campo === "ubicacion"
          ? normalizarUbicacionBackend(cambios[campo])
          : cambios[campo];
      (resultado as unknown as Record<string, unknown>)[campo] = valor;
    }
  }
  return resultado;
}

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
  const [visibilidad, setVisibilidad] = useState<Visibilidad>(
    posteo?.visibilidad ?? "publico"
  );

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
    setVisibilidad(posteo?.visibilidad ?? "publico");
    if (posteo?.ubicacion) {
      const ubicacionNormalizada = normalizarUbicacionBackend(posteo.ubicacion);
      if (!ubicacionNormalizada) return;
      setMunicipioId(ubicacionNormalizada.municipio || null);
      setCiudad(ubicacionNormalizada.ciudad || null);
      setEstado(ubicacionNormalizada.estado || null);
      setPais(ubicacionNormalizada.pais || null);

      // Localidad guardada (posts antiguos: null)
      const { localidadClave, localidadNombre } = ubicacionNormalizada;
      setLocalidad(
        localidadClave && localidadNombre
          ? { clave: localidadClave, nombre: localidadNombre }
          : null
      );

      // ✅ Verificación ultra-segura
      // Comprobamos que existan las coordenadas y que el array interno no sea null
      const coordsArray = ubicacionNormalizada.coordinates?.coordinates;
  
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
    const result = editarPosteoSchema.safeParse({ texto, visibilidad });
  
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

    let operacionError: Operacion = "editar_posteo";

    try {
      setLoading(true);

      const inicial = snapshotDesdePosteo(posteo.ubicacion);
      const actual: SnapshotUbicacion = {
        municipioId,
        ciudad,
        estado,
        pais,
        localidadClave: localidad?.clave ?? null,
        lat,
        lng,
      };

      const huboCambiosUbicacion = !esMismaUbicacion(inicial, actual);
      const ubicacionElegida = Boolean(municipioId);

      // Regla de Oro (spec): enviar campos de ubicación SOLO si el usuario los modificó.
      // Los vacíos en el PUT significan "no tocar", nunca borrar la ubicación guardada.
      const putConUbicacion = ubicacionElegida && huboCambiosUbicacion;

      // Formulario sin ubicación + posteo con ubicación guardada => quitar al guardar
      const eliminarUbicacionGuardada =
        !ubicacionElegida && Boolean(posteo.ubicacion) && huboCambiosUbicacion;

      const textoCambio = texto.trim() !== (posteo.texto || "");
      const visibilidadCambio =
        visibilidad !== (posteo.visibilidad ?? "publico");
      const soloEliminarUbicacion = eliminarUbicacionGuardada && !textoCambio && !visibilidadCambio;

      let posteoFinal: Posteo = posteo;

      if (!soloEliminarUbicacion) {
        const body: Record<string, unknown> = { texto: texto.trim() };

        if (visibilidadCambio) {
          body.visibilidad = visibilidad;
        }

        if (putConUbicacion) {
          body.municipio = municipioId;
          body.ciudad = ciudad;
          body.estado = estado;
          body.pais = pais;
          // Clave INEGI; el backend valida que pertenezca al municipio
          if (localidad) {
            body.localidadClave = localidad.clave;
          }
          if (lat !== null && lng !== null) {
            body.lat = lat;
            body.lng = lng;
          }
        }

        const resp = await apiPut<ApiResponse<{ posteo: Partial<Posteo> }>>(
          fetchWithAuth,
          `/api/posteos/${posteo._id}`,
          body
        );
        // Merge selectivo: solo campos de edición presentes en la respuesta.
        // El documento crudo puede venir sin _idUsuario poblado ni flags de
        // sesión; nunca debe pisar los datos ya cargados en memoria.
        if (resp.data?.posteo) {
          posteoFinal = fusionarCambios(posteoFinal, resp.data.posteo);
        }
      }

      if (eliminarUbicacionGuardada) {
        operacionError = "quitar_ubicacion";
        const resp = await apiDelete<ApiResponse<{ posteo: Partial<Posteo> }>>(
          fetchWithAuth,
          `/api/posteos/${posteo._id}/ubicacion`
        );
        if (resp.data?.posteo) {
          posteoFinal = fusionarCambios(posteoFinal, resp.data.posteo);
        }
      }

      setToastMessage(
        soloEliminarUbicacion
          ? "Ubicación eliminada correctamente"
          : "Publicación actualizada correctamente"
      );
      setToastType("success");

      setTimeout(() => {
        onClose(true, posteoFinal);
      }, 600);
    } catch (err) {
      if (isNotFound(err)) {
        setToastMessage("La publicación ya no existe");
        setToastType("danger");
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
      } else if (isForbidden(err)) {
        setToastMessage(
          getApiErrorMessage(err, "No tienes permiso para modificar esta publicación")
        );
        setToastType("danger");
      } else {
        const msg = getUserMessage(err, operacionError);
        console.error(msg, err);
        setToastMessage(msg);
        setToastType("danger");
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
                <div className="d-flex flex-column align-items-center gap-2 mb-2">
                  <h6 className="fw-bold mb-0">
                    <FiMapPin size={18} style={{ color: "#EBCA9A" }} className="me-1" />
                    Ubicación <small className="text-muted">(opcional)</small>
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
                <h6 className="text-center fw-bold mb-2">
                  <FiEdit3 size={18} style={{ color: "#EBCA9A" }} className="me-1" />
                  Descripción <small className="text-muted">(opcional)</small>
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

              {/* ====================== */}
              {/* 🔐 SECCIÓN VISIBILIDAD   */}
              {/* ====================== */}

              <div className="border rounded p-3 mb-3 bg-light">
                <h6 className="text-center fw-bold mb-3">
                  <FiLock size={18} style={{ color: "#EBCA9A" }} className="me-1" />
                  Visibilidad
                </h6>

                <div className="d-flex gap-3">
                  {/* Público */}
                  <div
                    className={`p-3 rounded border flex-fill btn ${
                      visibilidad === "publico" ? "border-primary bg-white shadow-sm" : "bg-light"
                    }`}
                    onClick={() => setVisibilidad("publico")}
                  >
                    <div className="fw-bold">Público</div>
                    <small className="text-muted">
                      Aparecerá en el inicio de todos los usuarios y en tu perfil.
                    </small>
                  </div>

                  {/* Solo perfil */}
                  <div
                    className={`p-3 rounded border flex-fill btn ${
                      visibilidad === "perfil" ? "border-primary bg-white shadow-sm" : "bg-light"
                    }`}
                    onClick={() => setVisibilidad("perfil")}
                  >
                    <div className="fw-bold">Solo perfil</div>
                    <small className="text-muted">
                      Solo se muestra en tu perfil; no aparece en el inicio.
                    </small>
                  </div>
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