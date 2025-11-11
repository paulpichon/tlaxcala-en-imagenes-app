'use client';

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "../../spinner";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";
// Tiempo en español
import { es } from "date-fns/locale"; 
import { Notificacion } from "@/types/types";



export default function Notificaciones() {
  const { fetchWithAuth } = useAuth();
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // 🟢 Cargar notificaciones con paginación
  const cargarNotificaciones = useCallback(async (pagina = 1) => {
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/notificaciones?page=${pagina}&limit=15`
      );
      if (!res.ok) throw new Error("Error al obtener notificaciones");
      const data = await res.json();
  
      if (pagina === 1) setNotificaciones(data.notificaciones);
      else setNotificaciones((prev) => [...prev, ...data.notificaciones]);
  
      setTotalPages(data.totalPages);
      setPage(pagina);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fetchWithAuth]); // 👈 dependencias del callback

  useEffect(() => {
    cargarNotificaciones(1);
  }, [cargarNotificaciones]);

  // 🟡 Marcar como leída + redirigir
  const handleClickNotificacion = async (id: string, urlUsuario: string) => {
    try {
      await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/notificaciones/marcar-notificacion-leida/${id}`,
        { method: "PATCH" }
      );

      setNotificaciones((prev) =>
        prev.map((n) => (n._id === id ? { ...n, notificacion_leida: true } : n))
      );

      router.push(`/${urlUsuario}`);
    } catch (error) {
      console.error("Error al marcar notificación:", error);
    }
  };

  // 🧠 Agrupar notificaciones por período
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
    <div className="d-flex flex-column vh-100 bg-light">
      <main className="flex-grow-1 overflow-auto">
        <header className="bg-white border-bottom shadow-sm">
          <div className="container">
            <div className="d-flex align-items-center justify-content-center py-3">
              <h1 className="h4 mb-0 fw-bold">Notificaciones</h1>
            </div>
          </div>
        </header>

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
                        <div
                          key={notif._id}
                          className={`list-group-item list-group-item-action d-flex align-items-center gap-3 ${
                            notif.notificacion_leida ? "bg-light text-muted" : "bg-white fw-semibold"
                          }`}
                          onClick={() => handleClickNotificacion(notif._id, notif.emisor.url)}
                          style={{ cursor: "pointer" }}
                        >
                          <Image
                            src={getCloudinaryUrl(
                              notif.emisor.imagen_perfil?.public_id ||
                                "https://res.cloudinary.com/dy9prn3ue/image/upload/v1750995280/tlx-imagenes/assets/no-imagen-usuario_koriq0.webp",
                              "mini"
                            )}
                            alt={notif.emisor.nombre_completo.nombre}
                            width={50}
                            height={50}
                            className="rounded-circle border"
                          />

                          <div className="flex-grow-1">
                            <p className="mb-1">
                              <strong>{notif.emisor.nombre_completo.nombre}</strong>{" "}
                              {notif.mensaje}
                              {!notif.notificacion_leida && (
                                <span className="badge bg-danger ms-2 rounded-pill">No leido.</span>
                              )}
                            </p>
                            <small className="text-muted">
                              {format(new Date(notif.createdAt), "d MMM, HH:mm", { locale: es })}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              )}

              {/* 🔄 Botón para cargar más */}
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
      </main>
    </div>
  );
}
