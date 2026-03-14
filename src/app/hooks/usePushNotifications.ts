import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

type EstadoNotificacion = "idle" | "pending" | "enabled" | "disabled" | "error";

export function usePushNotifications() {
  const { user, fetchWithAuth } = useAuth();
  const [estado, setEstado] = useState<EstadoNotificacion>("idle");
  const isRegistering = useRef(false);

  /**
   * 🧩 Detectar si ya hay una suscripción activa al cargar la app
   */
  useEffect(() => {
    if (!user) return;

    async function checkExistingSubscription() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setEstado("disabled");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();

        if (existingSub) {
          setEstado("enabled");
          // console.log("🔔 Ya existe una suscripción activa");
        } else {
          setEstado("disabled");
          // console.log("🔕 No hay suscripción activa");
        }
      } catch (err) {
        console.error("Error verificando suscripción existente:", err);
        setEstado("error");
      }
    }

    checkExistingSubscription();
  }, [user]);

  /**
   * 🔔 Activar notificaciones manualmente
   */
  const activarNotificaciones = useCallback(async () => {
    if (!user) {
      console.warn("⚠️ Debes iniciar sesión para activar notificaciones");
      return;
    }
    if (isRegistering.current) return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Tu navegador no soporta notificaciones push.");
      return;
    }

    isRegistering.current = true;
    setEstado("pending");

    try {
      // 1️⃣ Registrar Service Worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // 2️⃣ Solicitar permiso explícitamente
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEstado("disabled");
        alert("Permiso de notificaciones denegado.");
        return;
      }

      // 3️⃣ Obtener clave pública VAPID
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notificaciones/vapidPublicKey`
      );
      if (!res.ok) throw new Error("No se pudo obtener clave pública VAPID");

      const { key } = await res.json();

      // 4️⃣ Crear suscripción
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });

      // 5️⃣ Enviar suscripción al backend
      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notificaciones/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription }),
        }
      );

      if (!response.ok) throw new Error("Error registrando suscripción en el servidor");

      // ✅ Mostrar notificación de confirmación
      new Notification("🔔 Notificaciones activadas", {
        body: "Recibirás avisos cuando tengas nuevos seguidores o actividad.",
        icon: "/public/assets/icono-tlaxapp-blanco.png",
      });

      setEstado("enabled");
    } catch (err) {
      console.error("❌ Error activando notificaciones:", err);
      setEstado("error");
    } finally {
      isRegistering.current = false;
    }
  }, [user, fetchWithAuth]);

  /**
   * 🚫 Desactivar notificaciones (solo en este dispositivo)
   */
  const desactivarNotificaciones = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;

        // 1️⃣ Eliminar suscripción localmente
        await subscription.unsubscribe();
        console.log("🔕 Notificaciones desactivadas en este dispositivo");

        // 2️⃣ Avisar al backend (eliminas solo esta suscripción)
        await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/notificaciones/unsubscribe`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint }),
          }
        );

        setEstado("disabled");
      }
    } catch (err) {
      console.error("Error al desactivar notificaciones:", err);
      setEstado("error");
    }
  }, [fetchWithAuth]);

  return {
    estado,
    activarNotificaciones,
    desactivarNotificaciones,
  };
}

/**
 * Convierte la clave pública VAPID Base64URL a Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
