"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiMonitor,
  FiSmartphone,
} from "react-icons/fi";
import {
  ApiErrorCode,
  getUserMessage,
  getValidationErrors,
  isApiError,
  isApiErrorCode,
  isRateLimit,
  isValidationFailed,
} from "@/lib/apiClient";
import {
  cerrarOtrasSesionesSchema,
  CerrarOtrasSesionesSchema,
  MAX_PASSWORD,
} from "@/lib/validaciones";
import { useSesionesActivas } from "@/app/hooks/useSesionesActivas";
import type { SesionActiva } from "@/types/types";

const MOVIL = /android|ios|iphone|ipad/i;

function ultimaActividad(sesion: SesionActiva): string {
  if (sesion.esActual) return "Activa ahora";
  if (!sesion.lastUsed) return "Sin actividad registrada";
  const fecha = new Date(sesion.lastUsed);
  if (Number.isNaN(fecha.getTime())) return "Sin actividad registrada";
  return `Última actividad ${formatDistanceToNow(fecha, { addSuffix: true, locale: es })}`;
}

export default function SesionesActivas() {
  const router = useRouter();
  const { sesiones, loading, error, clearError, recargar, cerrarSesion, cerrarOtras } =
    useSesionesActivas();

  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [cerrandoId, setCerrandoId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [mostrarFormOtras, setMostrarFormOtras] = useState(false);
  const [enviandoOtras, setEnviandoOtras] = useState(false);
  const [errorOtras, setErrorOtras] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CerrarOtrasSesionesSchema>({
    resolver: zodResolver(cerrarOtrasSesionesSchema),
    defaultValues: { passwordActual: "" },
  });

  const hayOtras = sesiones.some((s) => !s.esActual);

  const onCerrarUna = async (sessionId: string) => {
    setAviso(null);
    setCerrandoId(sessionId);
    const ok = await cerrarSesion(sessionId);
    setCerrandoId(null);
    setConfirmandoId(null);
    if (ok) setAviso("Sesión cerrada. Ese dispositivo deberá iniciar sesión de nuevo.");
  };

  const cancelarFormOtras = () => {
    setMostrarFormOtras(false);
    setErrorOtras("");
    setPasswordVisible(false);
    reset();
  };

  const onCerrarOtras = async (data: CerrarOtrasSesionesSchema) => {
    setErrorOtras("");
    setAviso(null);
    clearError();
    setEnviandoOtras(true);
    try {
      const cerradas = await cerrarOtras(data.passwordActual);
      cancelarFormOtras();
      setAviso(
        cerradas > 0
          ? `Se ${cerradas === 1 ? "cerró 1 sesión" : `cerraron ${cerradas} sesiones`}. Esta sesión sigue activa.`
          : "No había otras sesiones abiertas. Esta sesión sigue activa."
      );
    } catch (err) {
      // Se decide siempre por code, nunca por detail.
      if (isApiErrorCode(err, ApiErrorCode.INVALID_CURRENT_PASSWORD)) {
        setError("passwordActual", { message: "La contraseña actual es incorrecta." });
      } else if (isValidationFailed(err)) {
        const campo = (getValidationErrors(err) ?? []).find(
          (e) => e.field === "passwordActual"
        );
        if (campo) setError("passwordActual", { message: campo.message });
        else setErrorOtras(getUserMessage(err, "cerrar_otras_sesiones"));
      } else if (isRateLimit(err)) {
        setErrorOtras(
          isApiErrorCode(err, ApiErrorCode.PASSWORD_BLOCKED)
            ? "Demasiados intentos con contraseña incorrecta. Espera unos minutos e intenta de nuevo."
            : getUserMessage(err, "cerrar_otras_sesiones")
        );
      } else {
        setErrorOtras(
          isApiError(err)
            ? getUserMessage(err, "cerrar_otras_sesiones")
            : "Ocurrió un error al cerrar las demás sesiones."
        );
      }
    } finally {
      setEnviandoOtras(false);
    }
  };

  const renderSesion = (sesion: SesionActiva) => {
    const nombre = sesion.deviceName ?? "Dispositivo desconocido";
    const Icono = MOVIL.test(nombre) ? FiSmartphone : FiMonitor;
    const confirmando = confirmandoId === sesion.sessionId;
    const cerrando = cerrandoId === sesion.sessionId;

    return (
      <li key={sesion.sessionId} className="list-group-item py-3">
        <div className="d-flex align-items-start gap-3">
          <Icono size={24} className="text-secondary flex-shrink-0 mt-1" aria-hidden />
          <div className="flex-grow-1 text-start">
            <div className="d-flex align-items-center flex-wrap gap-2">
              <span className="fw-semibold">{nombre}</span>
              {sesion.esActual && (
                <span className="badge text-bg-success">Este dispositivo</span>
              )}
            </div>
            {sesion.ipUltima && (
              <div className="small text-secondary">IP {sesion.ipUltima}</div>
            )}
            <div className="small text-secondary">{ultimaActividad(sesion)}</div>

            {!sesion.esActual && confirmando && (
              <div className="d-flex align-items-center flex-wrap gap-2 mt-2">
                <span className="small">¿Cerrar esta sesión?</span>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  disabled={cerrando}
                  onClick={() => onCerrarUna(sesion.sessionId)}
                >
                  {cerrando ? "Cerrando..." : "Sí, cerrar"}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={cerrando}
                  onClick={() => setConfirmandoId(null)}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
          {!sesion.esActual && !confirmando && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger flex-shrink-0"
              disabled={cerrandoId !== null || enviandoOtras}
              onClick={() => {
                setAviso(null);
                setConfirmandoId(sesion.sessionId);
              }}
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="d-flex flex-column bg-light vh-100">
      <div className="bg-white border-bottom p-3">
        <div className="d-flex align-items-center justify-content-between">
          <button
            onClick={() => router.back()}
            className="btn btn-link text-dark p-2"
            style={{ fontSize: "24px" }}
            aria-label="Volver"
          >
            <FiArrowLeft />
          </button>
          <h2 className="h5 mb-0 fw-bold flex-grow-1 text-center pe-5">
            Sesiones activas
          </h2>
        </div>
      </div>

      <div className="flex-grow-1 p-4">
        <div className="container mt-4" style={{ maxWidth: "500px" }}>
          <div className="bg-white shadow-sm rounded-4 p-4 border">
            <p className="text-secondary small text-start">
              Estos son los dispositivos donde tu cuenta tiene una sesión abierta. Si no
              reconoces alguno, ciérralo y cambia tu contraseña.
            </p>

            {aviso && (
              <div className="alert alert-success d-flex align-items-start gap-2" role="status">
                <FiCheckCircle size={20} className="flex-shrink-0 mt-1" />
                <div>{aviso}</div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-secondary" role="status">
                  <span className="visually-hidden">Cargando sesiones...</span>
                </div>
              </div>
            ) : error && sesiones.length === 0 ? (
              <div className="text-center py-3">
                <p className="text-danger fw-semibold">{error}</p>
                <button type="button" className="btn btn-outline-primary" onClick={recargar}>
                  Reintentar
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <p className="text-danger fw-semibold text-center" role="alert">
                    {error}
                  </p>
                )}
                {sesiones.length === 0 ? (
                  <div className="text-center py-3">
                    <p className="text-secondary">No hay sesiones activas para mostrar.</p>
                    <button type="button" className="btn btn-outline-primary" onClick={recargar}>
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <ul className="list-group mb-3">{sesiones.map(renderSesion)}</ul>
                )}

                {hayOtras && !mostrarFormOtras && (
                  <button
                    type="button"
                    className="btn btn-outline-danger w-100 py-2 fw-bold"
                    disabled={cerrandoId !== null}
                    onClick={() => {
                      setAviso(null);
                      setConfirmandoId(null);
                      setMostrarFormOtras(true);
                    }}
                  >
                    Cerrar todas las demás sesiones
                  </button>
                )}

                {mostrarFormOtras && (
                  <form onSubmit={handleSubmit(onCerrarOtras)} noValidate className="border rounded-3 p-3">
                    <p className="small text-start mb-2">
                      Por seguridad, confirma tu contraseña actual. Esta sesión seguirá
                      abierta.
                    </p>
                    <div className="mb-3 text-start">
                      <label className="form-label fw-medium" htmlFor="passwordActual">
                        Contraseña actual
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          id="passwordActual"
                          type={passwordVisible ? "text" : "password"}
                          autoComplete="current-password"
                          maxLength={MAX_PASSWORD}
                          disabled={enviandoOtras}
                          className={`form-control ${errors.passwordActual ? "is-invalid" : ""}`}
                          style={{ paddingRight: "3rem" }}
                          {...register("passwordActual")}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setPasswordVisible((v) => !v)}
                          aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                          style={{
                            position: "absolute",
                            right: "0.75rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#6c757d",
                            padding: "0.25rem",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {passwordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                        </button>
                      </div>
                      {errors.passwordActual && (
                        <div className="invalid-feedback d-block">
                          {errors.passwordActual.message}
                        </div>
                      )}
                    </div>

                    {errorOtras && (
                      <p className="text-danger fw-semibold text-center">{errorOtras}</p>
                    )}

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary flex-fill"
                        disabled={enviandoOtras}
                        onClick={cancelarFormOtras}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn btn-danger flex-fill fw-bold"
                        disabled={enviandoOtras}
                      >
                        {enviandoOtras ? "Cerrando..." : "Cerrar las demás"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
