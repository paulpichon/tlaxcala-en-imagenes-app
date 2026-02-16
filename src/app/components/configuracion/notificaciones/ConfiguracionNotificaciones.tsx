'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiBell, FiBellOff } from "react-icons/fi";
import { usePushNotifications } from "@/app/hooks/usePushNotifications";
import ToastGlobal from "../../ToastGlobal";
import notificacionesdStyles from "@/app/ui/configuracion/notificaciones/Notificaciones.module.css"

export default function ConfiguracionNotificaciones() {
  const router = useRouter();
  const { estado, activarNotificaciones, desactivarNotificaciones } = usePushNotifications();

  // ✅ Alineado con tu ToastGlobalProps
  const [toast, setToast] = useState<{ message: string; type?: "success" | "danger" }>({
    message: "",
    type: undefined,
  });

  const manejarCambio = async () => {
    try {
      if (estado === "enabled") {
        await desactivarNotificaciones();
        setToast({
          message: "🔕 Has desactivado las notificaciones.",
          type: "success",
        });
      } else {
        await activarNotificaciones();
        setToast({
          message: "🔔 Has activado las notificaciones.",
          type: "success",
        });
      }
    } catch (error) {
      console.error(error);
      setToast({
        message: "Ocurrió un error al cambiar la configuración.",
        type: "danger", // ✅ corregido
      });
    }
  };

  return (
    <div className="d-flex flex-column bg-light vh-100">
      {/* Toast de estado */}
      {toast.message && (
        <ToastGlobal
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: undefined })}
        />
      )}

      {/* Header superior */}
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
            Notificaciones
          </h2>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-grow-1 overflow-auto p-4">
        <div className="container" style={{ maxWidth: "448px" }}>
          <div className="bg-white shadow-sm rounded-4 p-4 border text-center">
            <div className="mb-3">
              {estado === "enabled" ? (
                <FiBell size={40} className={`${notificacionesdStyles.icono_notificaciones}`} />
              ) : (
                <FiBellOff size={40} className="text-muted" />
              )}
            </div>

            <h5 className="fw-bold mb-3">Notificaciones del sitio</h5>
            <p className="text-muted mb-4">
              Activa las notificaciones para recibir alertas cuando las personas que sigues publiquen nuevo contenido.
            </p>

            <div className="form-check form-switch d-flex justify-content-center align-items-center gap-2">
              <input
                className={`form-check-input ${notificacionesdStyles.check_notificaciones}`}
                type="checkbox"
                role="switch"
                id="switchNotificaciones"
                checked={estado === "enabled"}
                onChange={manejarCambio}
                disabled={estado === "pending"}
                style={{ transform: "scale(1.3)" }}
              />
              <label
                className="form-check-label fw-semibold"
                htmlFor="switchNotificaciones"
              >
                {estado === "pending"
                  ? "Activando..."
                  : estado === "enabled"
                  ? "Activadas"
                  : "Desactivadas"}
              </label>
            </div>

            {estado === "error" && (
              <div className="alert alert-danger mt-3 p-2 small">
                No se pudieron inicializar las notificaciones.  
                Revisa los permisos del navegador.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
