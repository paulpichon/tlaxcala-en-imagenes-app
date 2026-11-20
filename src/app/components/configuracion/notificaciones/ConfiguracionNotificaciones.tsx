'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiBell, FiBellOff } from "react-icons/fi";
import { usePushNotifications } from "@/app/hooks/usePushNotifications";
import ToastGlobal from "../../ToastGlobal";
import notificacionesdStyles from "@/app/ui/configuracion/notificaciones/Notificaciones.module.css"

type ToastState = { message: string; type?: "success" | "danger" | "warning" };

export default function ConfiguracionNotificaciones() {
  const router = useRouter();
  const {
    estado,
    esIOS,
    procesando,
    error,
    clearError,
    activarNotificaciones,
    desactivarNotificaciones,
  } = usePushNotifications();

  const [toast, setToast] = useState<ToastState>({ message: "", type: undefined });

  // IMPORTANTE (iOS): este handler debe llamar a `activarNotificaciones` de forma
  // directa; no anteponer `await`s ni mover la llamada a un useEffect.
  const manejarCambio = async () => {
    if (estado === "activo") {
      const ok = await desactivarNotificaciones();
      if (ok) setToast({ message: "🔕 Has desactivado las notificaciones.", type: "success" });
      return;
    }

    const resultado = await activarNotificaciones();
    if (resultado === "activado") {
      setToast({ message: "🔔 Has activado las notificaciones.", type: "success" });
    } else if (resultado === "cancelado") {
      setToast({ message: "No se activaron las notificaciones.", type: "warning" });
    }
    // "bloqueado" cambia la pantalla a las instrucciones; "error" se muestra en el alert.
  };

  const puedeAlternar = estado === "permiso_pendiente" || estado === "activo";

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
      <div className="flex-grow-1 p-4">
        <div className="container" style={{ maxWidth: '500px' }}>
          <div className="bg-white shadow-sm rounded-4 p-4 border text-center">
            <div className="mb-3">
              {estado === "activo" ? (
                <FiBell size={40} className={`${notificacionesdStyles.icono_notificaciones}`} />
              ) : (
                <FiBellOff size={40} className="text-muted" />
              )}
            </div>

            <h5 className="fw-bold mb-3">Notificaciones del sitio</h5>
            <p className="text-muted mb-4">
              Activa las notificaciones para enterarte cuando alguien te siga o comente tus publicaciones.
            </p>

            {estado === "cargando" && (
              <p className="text-muted small mb-0">Comprobando el estado de las notificaciones…</p>
            )}

            {puedeAlternar && (
              <div className="form-check form-switch d-flex justify-content-center align-items-center gap-2">
                <input
                  className={`form-check-input ${notificacionesdStyles.check_notificaciones}`}
                  type="checkbox"
                  role="switch"
                  id="switchNotificaciones"
                  checked={estado === "activo"}
                  onChange={manejarCambio}
                  disabled={procesando}
                  style={{ transform: "scale(1.3)" }}
                />
                <label
                  className="form-check-label fw-semibold"
                  htmlFor="switchNotificaciones"
                >
                  {procesando
                    ? "Un momento..."
                    : estado === "activo"
                    ? "Activadas en este dispositivo"
                    : "Desactivadas"}
                </label>
              </div>
            )}

            {estado === "instalar_pwa" && (
              <div className="alert alert-warning text-start small mb-0" role="status">
                <p className="fw-semibold mb-2">Instala TlaxApp para recibir notificaciones</p>
                <p className="mb-2">
                  En iPhone y iPad las notificaciones solo funcionan con la app instalada
                  (iOS 16.4 o superior):
                </p>
                <ol className="mb-0 ps-3">
                  <li>Abre esta página en <strong>Safari</strong>.</li>
                  <li>Toca el botón <strong>Compartir</strong>.</li>
                  <li>Elige <strong>Añadir a pantalla de inicio</strong>.</li>
                  <li>Abre <strong>TlaxApp</strong> desde su icono y vuelve a esta pantalla.</li>
                </ol>
              </div>
            )}

            {estado === "bloqueado" && (
              <div className="alert alert-warning text-start small mb-0" role="status">
                <p className="fw-semibold mb-2">Las notificaciones están bloqueadas</p>
                {esIOS ? (
                  <p className="mb-0">
                    Ve a <strong>Ajustes &gt; Notificaciones &gt; TlaxApp</strong>, activa{" "}
                    <strong>Permitir notificaciones</strong> y vuelve a esta pantalla.
                  </p>
                ) : (
                  <p className="mb-0">
                    Permite las notificaciones de este sitio en los ajustes de tu navegador
                    (por ejemplo, desde el candado junto a la dirección) y vuelve a esta pantalla.
                  </p>
                )}
              </div>
            )}

            {estado === "no_soportado" && (
              <div className="alert alert-secondary text-start small mb-0" role="status">
                Este navegador no admite notificaciones push. Prueba con una versión reciente de
                Chrome, Edge, Firefox o Safari
                {esIOS ? " (en iPhone y iPad se requiere iOS 16.4 o superior)" : ""}.
              </div>
            )}

            {error && (
              <div className="alert alert-danger mt-3 p-2 small mb-0" role="alert">
                {error}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark ms-2"
                  onClick={clearError}
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
