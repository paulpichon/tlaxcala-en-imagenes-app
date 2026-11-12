"use client";

import { useState } from "react";
import { FiArrowLeft, FiAlertTriangle } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  apiDelete,
  isApiError,
  isApiErrorCode,
  isForbidden,
  isRateLimit,
  isValidationFailed,
  getValidationErrors,
  getUserMessage,
  ApiErrorCode,
} from "@/lib/apiClient";

const MAX_PASSWORD = 128;

export default function EliminarCuenta() {
  const router = useRouter();
  const { fetchWithAuth, logout } = useAuth();
  const [confirmacion, setConfirmacion] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [eliminada, setEliminada] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [errorPassword, setErrorPassword] = useState("");

  const puedeEliminar =
    confirmacion === "ELIMINAR" && password.length > 0 && !loading && !eliminada;

  const eliminarCuenta = async () => {
    if (!puedeEliminar) return;

    setLoading(true);
    setMensaje("");
    setErrorPassword("");

    try {
      const data = await apiDelete<{ msg: string }>(
        fetchWithAuth,
        '/api/usuarios/delete',
        { passwordActual: password }
      );

      setEliminada(true);
      setPassword("");
      setMensaje(data.msg);

      // Esperar un momento y cerrar sesión
      setTimeout(async () => {
        await logout(); // limpia cookies + estado
        router.push("/login");
      }, 2000);

    } catch (error) {
      // Se decide siempre por code, nunca por detail.
      if (isApiErrorCode(error, ApiErrorCode.INVALID_CURRENT_PASSWORD)) {
        setErrorPassword("La contraseña es incorrecta.");
      } else if (isValidationFailed(error)) {
        const campo = getValidationErrors(error)?.find(
          (e) => e.field === "passwordActual"
        );
        if (campo) setErrorPassword(campo.message);
        else setMensaje(getUserMessage(error, 'eliminar_cuenta'));
      } else if (isRateLimit(error)) {
        setMensaje(
          isApiErrorCode(error, ApiErrorCode.PASSWORD_BLOCKED)
            ? "Demasiados intentos con contraseña incorrecta. Espera unos minutos e intenta de nuevo."
            : getUserMessage(error, 'eliminar_cuenta')
        );
      } else if (isForbidden(error)) {
        setMensaje("Tu sesión ya no es válida. Inicia sesión de nuevo para eliminar tu cuenta.");
      } else {
        setMensaje(
          isApiError(error)
            ? getUserMessage(error, 'eliminar_cuenta')
            : "Ocurrió un error al eliminar tu cuenta."
        );
      }
    }
     finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column bg-light vh-100">
      {/* Header */}
      <div className="bg-white border-bottom p-3">
        <div className="d-flex align-items-center justify-content-between">
          <button
            onClick={() => router.back()}
            className="btn btn-link text-dark p-2"
            style={{ fontSize: "24px" }}
          >
            <FiArrowLeft />
          </button>
          <h2 className="h5 mb-0 fw-bold flex-grow-1 text-center pe-5">
            Eliminar cuenta
          </h2>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-grow-1 p-4">
        <div className="container" style={{ maxWidth: '500px' }}>
          <div className="bg-white shadow-sm rounded-4 p-4 border text-center">

            <FiAlertTriangle size={50} className="text-danger mb-3" />

            <h5 className="fw-bold mb-3 text-danger">
              Esta acción es irreversible
            </h5>

            <p className="text-muted mb-4">
              Al eliminar tu cuenta, se borrarán permanentemente tus publicaciones,
              seguidores, mensajes y toda tu información asociada.
            </p>

            <p className="fw-semibold mb-2">
              Para confirmar, escribe: <span className="text-danger">ELIMINAR</span>
            </p>

            <input
              type="text"
              className="form-control text-center mb-3"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="Escribe ELIMINAR"
              disabled={loading || eliminada}
            />

            <p className="fw-semibold mb-2">Ingresa tu contraseña actual</p>

            <input
              type="password"
              className={`form-control text-center ${errorPassword ? "is-invalid" : "mb-4"}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorPassword) setErrorPassword("");
              }}
              placeholder="Contraseña actual"
              autoComplete="current-password"
              maxLength={MAX_PASSWORD}
              disabled={loading || eliminada}
            />
            {errorPassword && (
              <div className="invalid-feedback d-block mb-4">{errorPassword}</div>
            )}

            <button
              disabled={!puedeEliminar}
              onClick={eliminarCuenta}
              className="btn btn-danger w-100 py-2 fw-bold"
            >
              {loading ? "Eliminando..." : "Eliminar definitivamente"}
            </button>

            {mensaje && (
              <p
                className={`mt-3 text-center fw-semibold ${
                  eliminada ? "text-success" : "text-danger"
                }`}
              >
                {mensaje}
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
