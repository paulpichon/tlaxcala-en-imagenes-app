"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { isToday, isThisWeek, isThisMonth } from "date-fns";
import { Notificacion } from "@/types/types";
import { useNotifications, FiltroNotificaciones } from "@/app/hooks/useNotifications";
import Spinner from "../spinner";
import NotificacionItem from "./NotificacionItem";

// `like` y `nueva_publicacion` aún no se renderizan (Fases 3 y 6 del backend): se
// añaden aquí cuando existan.
const FILTROS: { valor: FiltroNotificaciones; etiqueta: string }[] = [
  { valor: null, etiqueta: "Todas" },
  { valor: "follow", etiqueta: "Seguidores" },
  { valor: "comentario", etiqueta: "Comentarios" },
  { valor: "posteo_eliminado_moderacion", etiqueta: "Moderación" },
];

export default function ListaNotificaciones() {
  const router = useRouter();
  const {
    notificaciones,
    page,
    totalPages,
    loading,
    loadingMore,
    error,
    clearError,
    cargarNotificaciones,
    marcarComoLeida,
    eliminarNotificacion,
    setLoadingMore,
    filtro,
    procesandoMasivo,
    cambiarFiltro,
    marcarTodasLeidas,
    eliminarTodas,
  } = useNotifications();

  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  const onEliminarTodas = async () => {
    await eliminarTodas();
    setConfirmandoBorrado(false);
  };

  const agruparPorFecha = (notificaciones: Notificacion[]) => {
    const grupos: Record<string, Notificacion[]> = {
      Hoy: [],
      "Esta semana": [],
      "Este mes": [],
      Anteriores: [],
    };
    notificaciones.forEach((notif) => {
      const fecha = new Date(notif.createdAt);
      if (isToday(fecha)) grupos["Hoy"].push(notif);
      else if (isThisWeek(fecha, { weekStartsOn: 1 })) grupos["Esta semana"].push(notif);
      else if (isThisMonth(fecha)) grupos["Este mes"].push(notif);
      else grupos["Anteriores"].push(notif);
    });
    return grupos;
  };

  const grupos = agruparPorFecha(notificaciones);

  // Spinner de pantalla completa solo en la carga inicial; al cambiar de filtro se
  // conservan el encabezado y los chips.
  if (loading && filtro === null && notificaciones.length === 0)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner />
      </div>
    );

  return (
    <div className="d-flex flex-column vh-100 bg-light">
      <main className="flex-grow-1 overflow-auto">
        <header className="bg-white border-bottom shadow-sm">
          <div className="container">
            <div className="d-flex align-items-center justify-content-center py-3">
              <h1 className="h4 mb-0 fw-bold">Notificaciones</h1>
              <div style={{ width: '32px' }}></div>
            </div>
          </div>
        </header>

        <div className="container-fluid pt-3">
          <div className="d-flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
            {FILTROS.map((f) => (
              <button
                key={f.etiqueta}
                type="button"
                className={`btn btn-sm rounded-pill ${
                  filtro === f.valor ? "btn-dark" : "btn-outline-secondary"
                }`}
                aria-pressed={filtro === f.valor}
                disabled={procesandoMasivo}
                onClick={() => cambiarFiltro(f.valor)}
              >
                {f.etiqueta}
              </button>
            ))}
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
            {confirmandoBorrado ? (
              <>
                <span className="small">
                  ¿Eliminar <strong>todas</strong> tus notificaciones? No se puede deshacer.
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  disabled={procesandoMasivo}
                  onClick={onEliminarTodas}
                >
                  {procesandoMasivo ? "Eliminando..." : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={procesandoMasivo}
                  onClick={() => setConfirmandoBorrado(false)}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={procesandoMasivo || notificaciones.every((n) => n.notificacion_leida)}
                  onClick={marcarTodasLeidas}
                >
                  Marcar todas como leídas
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  disabled={procesandoMasivo || (notificaciones.length === 0 && filtro === null)}
                  onClick={() => setConfirmandoBorrado(true)}
                >
                  Eliminar todas
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mx-3 mt-3" role="alert">
            {error}
            <button
              type="button"
              className="btn btn-sm btn-outline-dark ms-3"
              onClick={clearError}
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="container-fluid py-4">
          <div className="d-flex flex-column gap-3">
          {loading ? (
            <div className="d-flex justify-content-center py-4">
              <Spinner />
            </div>
          ) : notificaciones.length === 0 ? (
            <p className="text-center text-muted">
              {filtro === null
                ? "Aún no tienes notificaciones."
                : "No tienes notificaciones de este tipo."}
            </p>
          ) : (
            <>
              {Object.entries(grupos).map(([titulo, notifs]) =>
                notifs.length > 0 ? (
                  <div key={titulo} className="mb-4">
                    <h5 className="fw-bold text-secondary mb-3">{titulo}</h5>
                    <div className="list-group shadow-sm">
                      {notifs.map((notif) => (
                        <NotificacionItem
                          key={notif._id}
                          notif={notif}
                          onClick={(id, urlUsuario) => {
                            marcarComoLeida(id);
                            // Comentario: abre el posteo comentado. Si el posteo ya no
                            // existe (referencia null), no navega.
                            if (notif.tipo === "comentario") {
                              const posteoId = notif.referencia?._id;
                              if (posteoId) router.push(`/posteo/${posteoId}`);
                              return;
                            }
                            // Notificación de sistema (sin emisor): no navegar a un perfil.
                            if (urlUsuario) router.push(`/${urlUsuario}`);
                          }}
                          onEliminar={eliminarNotificacion} // 👈 pasamos la función al hijo
                        />
                      ))}
                    </div>
                  </div>
                ) : null
              )}

              {page < totalPages && (
                <div className="text-center mt-3">
                  <button
                    className="btn btn-outline-secondary"
                    disabled={loadingMore}
                    onClick={() => {
                      setLoadingMore(true);
                      cargarNotificaciones(page + 1);
                    }}
                  >
                    {loadingMore ? "Cargando..." : "Ver más"}
                  </button>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
