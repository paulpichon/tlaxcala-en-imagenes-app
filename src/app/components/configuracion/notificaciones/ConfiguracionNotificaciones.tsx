'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { FiArrowLeft, FiBell, FiBellOff, FiMonitor, FiSmartphone } from "react-icons/fi";
import { usePushNotifications } from "@/app/hooks/usePushNotifications";
import { usePreferenciasNotificaciones } from "@/app/hooks/usePreferenciasNotificaciones";
import { describirUserAgent } from "@/lib/dispositivos";
import type { CanalNotificacion, DispositivoPush } from "@/types/types";
import ToastGlobal from "../../ToastGlobal";
import notificacionesdStyles from "@/app/ui/configuracion/notificaciones/Notificaciones.module.css"

type ToastState = { message: string; type?: "success" | "danger" | "warning" };

/**
 * Tipos con interruptor. Solo se listan los que el backend ya produce:
 * `nueva_publicacion` y `sistema` (Fase 6) se añaden al implementarse para no
 * ofrecer un ajuste que aún no tiene efecto. Moderación no se lista: no se puede
 * silenciar. `like` solo tiene push (no existe `correo.like`): su celda de correo
 * queda vacía.
 */
const TIPOS_PREFERENCIA: {
  tipo: "follow" | "comentario" | "like";
  etiqueta: string;
  soloPush?: boolean;
}[] = [
  { tipo: "follow", etiqueta: "Nuevos seguidores" },
  { tipo: "comentario", etiqueta: "Comentarios en tus publicaciones" },
  { tipo: "like", etiqueta: "Me gusta en tus publicaciones", soloPush: true },
];

const CANALES: { canal: CanalNotificacion; etiqueta: string }[] = [
  { canal: "push", etiqueta: "Push" },
  { canal: "correo", etiqueta: "Correo" },
];

function ultimoUso(d: DispositivoPush): string {
  const iso = d.ultimoUso ?? d.creadoAt;
  const fecha = iso ? new Date(iso) : null;
  if (!fecha || Number.isNaN(fecha.getTime())) return "Sin actividad registrada";
  return `Último uso ${formatDistanceToNow(fecha, { addSuffix: true, locale: es })}`;
}

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
    dispositivos,
    cargandoDispositivos,
    errorDispositivos,
    clearErrorDispositivos,
    cerrarDispositivo,
  } = usePushNotifications();
  const {
    preferencias,
    cargando: cargandoPreferencias,
    disponible: preferenciasDisponibles,
    guardando: guardandoPreferencia,
    error: errorPreferencias,
    clearError: clearErrorPreferencias,
    cambiarPreferencia,
  } = usePreferenciasNotificaciones();

  const [toast, setToast] = useState<ToastState>({ message: "", type: undefined });
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [cerrandoId, setCerrandoId] = useState<string | null>(null);

  const onCerrarDispositivo = async (id: string) => {
    setCerrandoId(id);
    const ok = await cerrarDispositivo(id);
    setCerrandoId(null);
    setConfirmandoId(null);
    if (ok) setToast({ message: "Dispositivo desactivado.", type: "success" });
  };

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
    <div className="d-flex flex-column bg-light min-vh-100">
      {/* Toast de estado */}
      {toast.message && (
        <ToastGlobal
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: undefined })}
        />
      )}

      {/* Header superior: queda «pegado» bajo el HeaderSuperior (56 px, z-index 1020
          de `sticky-top`), mismo patrón que /notificaciones. */}
      <div
        className="bg-white border-bottom p-3"
        style={{ position: "sticky", top: 56, zIndex: 1010 }}
      >
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

          {/* Preferencias por tipo y canal (Fase 4). Se oculta si el backend aún no la tiene. */}
          {preferenciasDisponibles && (
            <div className="bg-white shadow-sm rounded-4 p-4 border mt-3">
              <h6 className="fw-bold mb-1">Qué te avisamos</h6>
              <p className="text-secondary small mb-3">
                Elige por qué medio quieres enterarte de cada cosa. En la sección
                Notificaciones de la app siempre verás todo.
              </p>

              {errorPreferencias && (
                <div className="alert alert-danger p-2 small" role="alert">
                  {errorPreferencias}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark ms-2"
                    onClick={clearErrorPreferencias}
                  >
                    Cerrar
                  </button>
                </div>
              )}

              {cargandoPreferencias && (
                <p className="text-muted small mb-0">Cargando tus preferencias…</p>
              )}

              {preferencias && (
                <>
                  <div className="d-flex align-items-center pb-2 border-bottom small text-secondary fw-semibold">
                    <span className="flex-grow-1">Aviso</span>
                    {CANALES.map(({ canal, etiqueta }) => (
                      <span
                        key={canal}
                        className={`text-center ${notificacionesdStyles.columna_canal}`}
                      >
                        {etiqueta}
                      </span>
                    ))}
                  </div>

                  <ul className="list-unstyled mb-0">
                    {TIPOS_PREFERENCIA.map(({ tipo, etiqueta, soloPush }) => (
                      <li key={tipo} className="d-flex align-items-center py-3 border-bottom">
                        <span className="flex-grow-1 pe-2">{etiqueta}</span>
                        {CANALES.map(({ canal, etiqueta: etiquetaCanal }) =>
                          canal === "correo" && soloPush ? (
                            // Sin correo para este tipo: celda vacía para alinear columnas.
                            <span
                              key={canal}
                              className={notificacionesdStyles.columna_canal}
                              aria-hidden="true"
                            />
                          ) : (
                            <div
                              key={canal}
                              className={`form-check form-switch d-flex justify-content-center m-0 p-0 ${notificacionesdStyles.columna_canal}`}
                            >
                              <input
                                className={`form-check-input m-0 ${notificacionesdStyles.check_notificaciones}`}
                                type="checkbox"
                                role="switch"
                                aria-label={`${etiquetaCanal}: ${etiqueta}`}
                                checked={
                                  (preferencias[canal] as Record<string, boolean>)[tipo]
                                }
                                disabled={guardandoPreferencia}
                                onChange={(e) =>
                                  canal === "push"
                                    ? cambiarPreferencia("push", tipo, e.target.checked)
                                    : cambiarPreferencia(
                                        "correo",
                                        tipo as "follow" | "comentario",
                                        e.target.checked
                                      )
                                }
                              />
                            </div>
                          )
                        )}
                      </li>
                    ))}
                  </ul>

                  <p className="text-secondary small mt-3 mb-0">
                    Los avisos push solo llegan a los dispositivos donde activaste las
                    notificaciones. Los avisos sobre la moderación de tus publicaciones
                    siempre se envían.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Dispositivos con notificaciones registrados en el backend */}
          {!cargandoDispositivos && (dispositivos.length > 0 || errorDispositivos) && (
            <div className="bg-white shadow-sm rounded-4 p-4 border mt-3">
              <h6 className="fw-bold mb-1">Dispositivos con notificaciones</h6>
              <p className="text-secondary small mb-3">
                Dispositivos que reciben avisos de tu cuenta. Desactiva los que ya no uses.
              </p>

              {errorDispositivos && (
                <div className="alert alert-danger p-2 small" role="alert">
                  {errorDispositivos}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark ms-2"
                    onClick={clearErrorDispositivos}
                  >
                    Cerrar
                  </button>
                </div>
              )}

              <ul className="list-group list-group-flush">
                {dispositivos.map((d) => {
                  const { nombre, movil } = describirUserAgent(d.userAgent);
                  const Icono = movil ? FiSmartphone : FiMonitor;
                  const confirmando = confirmandoId === d.id;
                  const cerrando = cerrandoId === d.id;
                  return (
                    <li key={d.id} className="list-group-item px-0 py-3">
                      <div className="d-flex align-items-start gap-3">
                        <Icono size={22} className="text-secondary flex-shrink-0 mt-1" aria-hidden />
                        <div className="flex-grow-1 text-start">
                          <div className="d-flex align-items-center flex-wrap gap-2">
                            <span className="fw-semibold">{nombre}</span>
                            {d.esEste && <span className="badge text-bg-success">Este dispositivo</span>}
                          </div>
                          <div className="small text-secondary">{ultimoUso(d)}</div>

                          {!d.esEste && confirmando && (
                            <div className="d-flex align-items-center flex-wrap gap-2 mt-2">
                              <span className="small">¿Desactivar este dispositivo?</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                disabled={cerrando}
                                onClick={() => onCerrarDispositivo(d.id)}
                              >
                                {cerrando ? "Desactivando..." : "Sí, desactivar"}
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
                        {!d.esEste && !confirmando && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger flex-shrink-0"
                            disabled={cerrandoId !== null}
                            onClick={() => setConfirmandoId(d.id)}
                          >
                            Desactivar
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
