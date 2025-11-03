import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

export function usePushNotifications() {
  const { user, fetchWithAuth } = useAuth();
  const isRegistering = useRef(false); // ✅ Evita ejecuciones concurrentes
  const hasRegistered = useRef(false); // ✅ Evita re-registros

  useEffect(() => {
    // ✅ Salir si no hay usuario, ya se registró o está en proceso
    if (!user || hasRegistered.current || isRegistering.current) return;

    async function registerPush() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("🚫 Este navegador no soporta notificaciones push");
        return;
      }

      isRegistering.current = true; // ✅ Marcar como "en proceso"

      try {
        // 1️⃣ Registrar Service Worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        // console.log("✅ Service Worker registrado");

        // 2️⃣ Solicitar permiso
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
        //   console.warn("⚠️ Permiso de notificaciones denegado");
          isRegistering.current = false;
          return;
        }

        // 3️⃣ Verificar si ya existe una suscripción
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
        //   console.log("ℹ️ Ya existe una suscripción activa");
          hasRegistered.current = true; // ✅ Marcar como registrado
          isRegistering.current = false;
          return;
        }

        // 4️⃣ Obtener clave VAPID
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/notificaciones/vapidPublicKey`
        );
        
        if (!res.ok) {
          throw new Error("Error obteniendo clave VAPID");
        }
        
        const { key } = await res.json();

        // 5️⃣ Crear suscripción
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });

        // 6️⃣ Enviar al backend
        const response = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/notificaciones/subscribe`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription }),
          }
        );

        if (!response.ok) {
          throw new Error("Error registrando suscripción en el servidor");
        }

        hasRegistered.current = true; // ✅ Marcar como completado exitosamente
        // console.log("✅ Notificaciones push registradas correctamente");
        // 7️⃣ Mostrar mensaje informativo una sola vez
        if (Notification.permission === "granted") {
          new Notification("🔔 Notificaciones activadas", {
            body: "Recibirás avisos cuando tengas nuevos seguidores o actividad.",
            icon: "/icon-192x192.png",
          });
        }
      } catch (err) {
        console.error("❌ Error registrando notificaciones push:", err);
      } finally {
        isRegistering.current = false; // ✅ Liberar flag
      }
    }

    registerPush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // ✅ Solo depende de user
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}