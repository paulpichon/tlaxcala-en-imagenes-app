'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
// import Spinner from "../Spinner";
import { useAuth } from "@/context/AuthContext";
import Spinner from "../../spinner";

type Notificacion = {
  _id: string;
  tipo: "nuevo_seguidor" | "nueva_publicacion";
  mensaje: string;
  fecha: string;
  usuarioOrigen: {
    _id: string;
    nombre_completo: { nombre: string; apellido: string };
    url: string;
    imagen_perfil?: { url: string };
  };
};

export default function Notificaciones() {
  const { fetchWithAuth } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarNotificaciones = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/notificaciones`);
        if (!res.ok) throw new Error("Error al obtener notificaciones");
        const data = await res.json();
        setNotificaciones(data.notificaciones || []);
      } catch (error) {
        console.error("Error cargando notificaciones:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarNotificaciones();
  }, [fetchWithAuth]);

  if (loading) return <Spinner />;

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
            <div className="container py-4">
            {notificaciones.length === 0 ? (
                <p className="text-center text-muted">Aún no tienes notificaciones.</p>
            ) : (
                <div className="list-group shadow-sm">
                {notificaciones.map((notif) => (
                    <div
                    key={notif._id}
                    className="list-group-item list-group-item-action d-flex align-items-center gap-3"
                    >
                    {/* Imagen del usuario que generó la notificación */}
                    <Image
                        src={notif.usuarioOrigen.imagen_perfil?.url || "/default-profile.png"}
                        alt={notif.usuarioOrigen.nombre_completo.nombre}
                        width={50}
                        height={50}
                        className="rounded-circle"
                    />

                    {/* Texto y enlace */}
                    <div className="flex-grow-1">
                        <p className="mb-1">
                        <strong>{notif.usuarioOrigen.nombre_completo.nombre}</strong> {notif.mensaje}
                        </p>
                        <small className="text-muted">
                        {new Date(notif.fecha).toLocaleString("es-MX", {
                            dateStyle: "short",
                            timeStyle: "short",
                        })}
                        </small>
                    </div>
                    </div>
                ))}
                </div>
            )}
            </div>
        </ main>
    </ div>
  );
}
