"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { FiFlag } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIAS_REPORTE, reporteSchema, ReporteFormData } from "@/lib/validaciones";
import {
  apiPost,
  ApiErrorCode,
  getApiErrorCode,
  getApiErrorMessage,
  getUserMessage,
} from "@/lib/apiClient";
import { ReporteResponse } from "@/types/types";
import estilos from "@/app/ui/reportes/reporte.module.css";

interface ModalReportePublicacionProps {
  isOpen: boolean;
  posteoId: string;
  /** reported: true si el reporte se guardó. El toast de confirmación lo muestra el padre. */
  onFinish: (reported: boolean) => void;
}

const MAX_DESCRIPCION = 200;

export default function ModalReportePublicacion({
  isOpen,
  posteoId,
  onFinish,
}: ModalReportePublicacionProps) {
  const { fetchWithAuth } = useAuth();

  const [serverError, setServerError] = useState<string | null>(null);

  // Defensa anti-race: si el modal se desmonta mientras el POST viaja
  // (cierre por otra vía), se ignora el resultado tardío.
  // Se resetea a true al montar porque Next.js (StrictMode) desmonta y
  // remontaa el componente en desarrollo; sin el reset el flag quedaría
  // en false y bloquearía onFinish(true) tras un reporte exitoso.
  const activoRef = useRef(true);

  useEffect(() => {
    activoRef.current = true;
    return () => {
      activoRef.current = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReporteFormData>({
    resolver: zodResolver(reporteSchema),
    defaultValues: { categoria: undefined, descripcion: "" },
  });

  // Escape cierra el modal y bloquea el scroll del fondo (patrón ImageModal).
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onFinish(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onFinish]);

  // Autofocus en el primer radio al abrir (mejora la navegación por teclado).
  useEffect(() => {
    if (isOpen) {
      const firstRadio = document.querySelector<HTMLInputElement>(
        'input[name="categoria"]'
      );
      firstRadio?.focus();
    }
  }, [isOpen]);

  const categoria = watch("categoria");
  const descripcion = watch("descripcion") ?? "";
  const mostrarDescripcion = categoria === "otro";

  const onSubmit = async (data: ReporteFormData) => {
    setServerError(null);

    const body: Record<string, string | null> = {
      categoria: data.categoria,
      descripcion: data.categoria === "otro" ? (data.descripcion ?? null) : null,
    };

    try {
      await apiPost<ReporteResponse>(
        fetchWithAuth,
        `/api/reportes/${posteoId}`,
        body
      );

      if (!activoRef.current) return;
      onFinish(true);
    } catch (err) {
      if (!activoRef.current) return;
      const code = getApiErrorCode(err);
      if (code === ApiErrorCode.CONFLICT) {
        setServerError(getApiErrorMessage(err, "Ya reportaste esta publicación"));
      } else {
        const msg = getUserMessage(err, "reportar");
        console.error(msg, err);
        setServerError(msg);
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reporte-titulo"
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75"
            style={{ zIndex: 2000 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isSubmitting) onFinish(false);
            }}
          >
            <motion.div
              className="bg-white rounded-4 p-4 shadow-lg"
              style={{ maxWidth: 500, width: "90%", maxHeight: "90vh", overflowY: "auto" }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 id="reporte-titulo" className="mb-0">
                  <FiFlag size={20} className="me-2 text-danger" style={{ verticalAlign: "-2px" }} />
                  Reportar publicación
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => onFinish(false)}
                  disabled={isSubmitting}
                  aria-label="Cerrar"
                />
              </div>

              <p className="text-muted small mb-3">
                Tu reporte es anónimo. La publicación se ocultará para ti.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Categorías */}
                <fieldset disabled={isSubmitting}>
                  <legend className="visually-hidden">Motivo del reporte</legend>
                  <div className="d-flex flex-column gap-2 mb-3">
                    {CATEGORIAS_REPORTE.map((cat) => (
                      <label
                        key={cat.slug}
                        className={`${estilos.opcion_categoria} ${
                          categoria === cat.slug ? estilos.opcion_categoria_seleccionada : ""
                        }`}
                      >
                        <input
                          type="radio"
                          value={cat.slug}
                          {...register("categoria")}
                        />
                        <span className={estilos.texto_categoria}>{cat.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {errors.categoria && (
                  <p className="text-danger small mt-1">{errors.categoria.message}</p>
                )}

                {/* Descripción condicional para "otro" */}
                {mostrarDescripcion && (
                  <div className="mb-3">
                    <label htmlFor="reporte-descripcion" className="form-label fw-bold small">
                      Describe brevemente el motivo
                    </label>
                    <textarea
                      id="reporte-descripcion"
                      className="form-control"
                      rows={3}
                      maxLength={MAX_DESCRIPCION}
                      placeholder="Escribe el motivo del reporte..."
                      disabled={isSubmitting}
                      {...register("descripcion")}
                    />
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      {errors.descripcion && (
                        <span className="text-danger small">{errors.descripcion.message}</span>
                      )}
                      <span className={estilos.contador_descripcion}>
                        {descripcion.length}/{MAX_DESCRIPCION}
                      </span>
                    </div>
                  </div>
                )}

                {serverError && (
                  <div className="alert alert-danger py-2 px-3 mb-3" role="alert">
                    {serverError}
                  </div>
                )}

                {/* Botones */}
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onFinish(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Enviar reporte"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}