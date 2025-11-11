"use client";
import { useRouter } from "next/navigation";
import { isToday, isThisWeek, isThisMonth } from "date-fns";
import { Notificacion } from "@/types/types";
import { useNotifications } from "@/app/hooks/useNotifications";
import Spinner from "../../spinner";
import NotificacionItem from "../../notifications/NotificacionItem";

export default function ListaNotificaciones() {
  const router = useRouter();
  const {
    notificaciones,
    page,
    totalPages,
    loading,
    loadingMore,
    cargarNotificaciones,
    marcarComoLeida,
    setLoadingMore,
  } = useNotifications();

  const agruparPorFecha = (notificaciones: Notificacion[]) => {
    const grupos: Record<string, Notificacion[]> = {
      "Hoy": [],
      "Esta semana": [],
      "Este mes": [],
      "Anteriores": [],
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

  if (loading) return <Spinner />;

  return (
    <div className="container py-4">
      {notificaciones.length === 0 ? (
        <p className="text-center text-muted">Aún no tienes notificaciones.</p>
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
                        router.push(`/${urlUsuario}`);
                      }}
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
  );
}
