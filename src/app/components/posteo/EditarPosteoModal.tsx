// Funcion para editar un posteo
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ToastGlobal from "../ToastGlobal";
import { editarPosteoSchema } from "@/lib/validaciones";
import { AnimatePresence, motion } from "framer-motion";
import { Posteo } from "@/types/types";
import { FiMapPin } from "react-icons/fi";
import { useObtenerUbicacion } from "@/app/hooks/useObtenerUbicacion";
import ManualMunicipioSelector from "../ManualMunicipioSelector";

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
  } = useObtenerUbicacion();

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posteo]);

  if (!isOpen || !posteo) return null;

  const validarTexto = () => {
    const result = editarPosteoSchema.safeParse({ texto });

    if (!result.success) {
      const mensajeError = result.error.errors[0]?.message || "Campo inválido";
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
  };

  const handleGuardar = async () => {
    if (!validarTexto()) return;

    try {
      setLoading(true);

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posteos/${posteo._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texto,
            ubicacion: municipioId
              ? {
                  municipio: municipioId,
                  ciudad,
                  estado,
                  pais,
                }
              : null,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setToastMessage("Publicación actualizada correctamente 🎉");
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
              }
            : undefined,
        };

        setTimeout(() => {
          onClose(true, posteoActualizado); // ✅ Devolver posteo completo
        }, 600);
      } else {
        setToastMessage(data.msg || "No se pudo actualizar ❌");
        setToastType("danger");
      }
    } catch (err) {
      console.error("Error al actualizar:", err);
      setToastMessage("Error interno ❌");
      setToastType("danger");
    } finally {
      setLoading(false);
    }
  };

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
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">📍 Ubicación</h6>

                  {!ciudad && !loadingUbicacion && (
                    <button
                      onClick={obtenerUbicacion}
                      className="iconLocationBtn"
                      title="Detectar ubicación automáticamente"
                    >
                      <FiMapPin size={20} />
                    </button>
                  )}

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
                    <div className="small text-muted">
                      {posteo.ubicacion
                        ? "Ubicación editada"
                        : "Detectada automáticamente"}
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
                  onSelect={(id, data) => {
                    setMunicipioId(id);
                    setCiudad(data.ciudad);
                    setEstado(data.estado);
                    setPais(data.pais);
                  }}
                />
              </div>

              {/* ====================== */}
              {/* 📝 SECCIÓN DESCRIPCIÓN */}
              {/* ====================== */}

              <div className="border rounded p-3 mb-3 bg-light">
                <h6 className="fw-bold mb-2">📝 Descripción</h6>

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