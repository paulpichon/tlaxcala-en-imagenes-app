// Funcion para editar un posteo
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ToastGlobal from "../ToastGlobal";
import { editarPosteoSchema } from "@/lib/validaciones";
import { AnimatePresence, motion } from "framer-motion";
import { EditarPosteoModalProps } from "@/types/types";
import { FiMapPin } from "react-icons/fi";
import { useObtenerUbicacion } from "@/app/hooks/useObtenerUbicacion";
import ManualMunicipioSelector from "../ManualMunicipioSelector";

export default function EditarPosteoModal({
  isOpen,
  posteo,
  onClose,
}: EditarPosteoModalProps) {
  const { fetchWithAuth } = useAuth();

  const [texto, setTexto] = useState(posteo?.texto || "");
  const [loading, setLoading] = useState(false);

  // 📍 Hook reutilizable
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

  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "danger" | "creacion";
  } | null>(null);

  // -------------------------
  // CARGAR UBICACIÓN INICIAL
  // -------------------------
  useEffect(() => {
    if (posteo?.ubicacion) {
      setMunicipioId(posteo.ubicacion.municipio || null);
      setCiudad(posteo.ubicacion.ciudad || null);
      setEstado(posteo.ubicacion.estado || null);
      setPais(posteo.ubicacion.pais || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posteo]);

  // Este return evita errores cuando el modal está cerrado o no hay posteo
  // Debe ejecutarse después del useEffect de arriba
  if (!isOpen || !posteo) return null;
  
  // -------------------------
  // VALIDACIÓN ZOD
  // -------------------------
  const validarTexto = () => {
    const result = editarPosteoSchema.safeParse({ texto });

    if (!result.success) {
      const mensajeError = result.error.errors[0]?.message || "Campo inválido";
      setToast({ message: mensajeError, type: "danger" });
      return false;
    }

    return true;
  };

  // -------------------------
  // 📍 QUITAR UBICACIÓN
  // -------------------------
  const eliminarUbicacion = () => {
    setMunicipioId(null);
    setCiudad(null);
    setEstado(null);
    setPais(null);
  };

  // -------------------------
  // GUARDAR CAMBIOS (PUT)
  // -------------------------
  const handleGuardar = async () => {
    if (!validarTexto()) return;

    try {
      setLoading(true);

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos/${posteo._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texto,
            // Si hay municipio → enviamos ubicación completa
            // Si no → enviar null para eliminarla
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
        setToast({
          message: "Publicación actualizada correctamente 🎉",
          type: "success",
        });

        setTimeout(() => {
          onClose(true, texto);
        }, 600);
      } else {
        setToast({
          message: data.msg || "No se pudo actualizar ❌",
          type: "danger",
        });
      }
    } catch (err) {
      console.error("Error al actualizar:", err);
      setToast({ message: "Error interno ❌", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // CONTADOR DE CARACTERES
  // -------------------------
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
            {/* MODAL */}
            <motion.div
              className="bg-white rounded-4 p-4 shadow-lg"
              style={{ maxWidth: 420, width: "90%" }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h5 className="mb-3 text-center">Editar publicación</h5>

              {/* ====================== */}
              {/* 📍 SECCIÓN UBICACIÓN   */}
              {/* ====================== */}

              <div className="mt-1 border rounded p-3 bg-light">
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
                  <p className="small text-muted">Obteniendo ubicación…</p>
                )}

                {ciudad && (
                  <div className="alert alert-success py-2 px-3">
                    <strong>{ciudad}</strong>, {estado}, {pais}
                    <div className="small text-muted">
                      {posteo.ubicacion
                        ? "Ubicación editada"
                        : "Detectada automáticamente"}
                    </div>
                  </div>
                )}

                {ubicacionError && (
                  <div className="alert alert-warning py-2 px-3">
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
              {/* 📝 TEXTO               */}
              {/* ====================== */}

              <textarea
                className="form-control mt-3"
                rows={4}
                maxLength={maxChars}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe algo..."
              />

              <div className="text-end small mb-3">
                {texto.length}/{maxChars}
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
                  className="btnGuardarCambiarMedium"
                  disabled={loading}
                  onClick={handleGuardar}
                >
                  {loading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </motion.div>

            {/* TOAST */}
            {toast && (
              <ToastGlobal
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
