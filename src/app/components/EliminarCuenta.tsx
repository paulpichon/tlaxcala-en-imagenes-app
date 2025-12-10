"use client";

import { useState } from "react";
import { FiArrowLeft, FiAlertTriangle } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function EliminarCuenta() {
  const router = useRouter();
  const { fetchWithAuth, logout } = useAuth(); // 👈 usamos logout también
  const [confirmacion, setConfirmacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const eliminarCuenta = async () => {
    if (confirmacion !== "ELIMINAR") return;

    setLoading(true);
    setMensaje("");

    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/usuarios/delete`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.msg || "Error al eliminar cuenta");
      }

      // Mostrar mensaje del backend
      setMensaje(data.msg);

      // Esperar un momento y cerrar sesión
      setTimeout(async () => {
        await logout(); // limpia cookies + estado
        router.push("/login");
      }, 2000);

    } catch (error) {
      const mensajeError =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al eliminar tu cuenta.";
    
      setMensaje(mensajeError);
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
      <div className="flex-grow-1 overflow-auto p-4">
        <div className="container" style={{ maxWidth: "480px" }}>
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
              className="form-control text-center mb-4"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="Escribe ELIMINAR"
            />

            <button
              disabled={confirmacion !== "ELIMINAR" || loading}
              onClick={eliminarCuenta}
              className="btn btn-danger w-100 py-2 fw-bold"
            >
              {loading ? "Eliminando..." : "Eliminar definitivamente"}
            </button>

            {mensaje && (
              <p className="mt-3 text-center fw-semibold text-danger">
                {mensaje}
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
