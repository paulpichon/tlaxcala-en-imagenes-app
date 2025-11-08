'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "../../spinner";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";

type Notificacion = {
  _id: string;
  tipo: "follow" | "like" | "comentario" | "nueva_publicacion";
  mensaje: string;
  createdAt: string;
  notificacion_leida: boolean;
  emisor: {
    _id: string;
    nombre_completo: { nombre: string; apellido: string };
    url: string;
    imagen_perfil?: { public_id: string };
  };
};

export default function Notificaciones() {
  const { fetchWithAuth } = useAuth();
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  // 🟢 Cargar notificaciones
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

  // 🟡 Manejar clic en una notificación
  const handleClickNotificacion = async (idNotificacion: string, urlUsuario: string) => {
    try {
      // Marcar como leída en el backend
      await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/notificaciones/marcar-notificacion-leida/${idNotificacion}`,
        { method: "PATCH" }
      );

      // Actualizar visualmente en frontend
      setNotificaciones((prev) =>
        prev.map((n) =>
          n._id === idNotificacion ? { ...n, notificacion_leida: true } : n
        )
      );

      // Redirigir al perfil del usuario emisor
      router.push(`/${urlUsuario}`);
    } catch (error) {
      console.error("Error al marcar notificación:", error);
    }
  };

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
            <div className="list-group shadow-sm">
              {notificaciones.map((notif) => (
                <div
                  key={notif._id}
                  className={`list-group-item list-group-item-action d-flex align-items-center gap-3 ${
                    notif.notificacion_leida ? "bg-light text-muted" : "bg-white fw-semibold"
                  }`}
                  onClick={() => handleClickNotificacion(notif._id, notif.emisor.url)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Imagen del usuario que generó la notificación */}
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

                  {/* Texto y fecha */}
                  <div className="flex-grow-1">
                    <p className="mb-1">
                      <strong>{notif.emisor.nombre_completo.nombre}</strong>{" "}
                      {notif.mensaje}
                      {!notif.notificacion_leida && (
                        <span className="badge bg-danger ms-2 rounded-pill">Notificación sin leer</span>
                      )}
                    </p>
                    <small className="text-muted">
                      {new Date(notif.createdAt).toLocaleString("es-MX", {
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
      </main>
    </div>
  );
}
