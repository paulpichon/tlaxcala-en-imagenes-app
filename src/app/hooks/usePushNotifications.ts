import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPost, getUserMessage } from "@/lib/apiClient";
import { ApiResponse } from "@/types/types";

/**
 * Estados de la activación de Web Push (ver plan de notificaciones, Fase 7):
 * - cargando: detectando soporte, permiso y suscripción.
 * - no_soportado: el navegador (o la versión) no admite Web Push.
 * - instalar_pwa: iOS en una pestaña de Safari; hay que instalar la PWA.
 * - permiso_pendiente: se puede activar (permiso `default`, o `granted` sin suscripción).
 * - bloqueado: permiso `denied`; solo se rehabilita desde los ajustes del sistema.
 * - activo: permiso concedido y suscripción registrada en este dispositivo.
 */
export type EstadoPush =
  | "cargando"
  | "no_soportado"
  | "instalar_pwa"
  | "permiso_pendiente"
  | "bloqueado"
  | "activo";

export type ResultadoActivacion = "activado" | "cancelado" | "bloqueado" | "error";

const ICONO_CONFIRMACION = "/assets/icono-tlaxapp-beige.png";

export function usePushNotifications() {
  const { user, fetchWithAuth } = useAuth();
  const [estado, setEstado] = useState<EstadoPush>("cargando");
  const [esIOS, setEsIOS] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registro del SW y clave VAPID se preparan ANTES del click: iOS exige que
  // `requestPermission` se llame casi directamente dentro del gesto del usuario.
  const registroRef = useRef<ServiceWorkerRegistration | null>(null);
  const claveRef = useRef<Uint8Array | null>(null);
  const enCursoRef = useRef(false);
  const fetchRef = useRef(fetchWithAuth);
  fetchRef.current = fetchWithAuth;

  const obtenerClave = useCallback(async (): Promise<Uint8Array> => {
    if (claveRef.current) return claveRef.current;
    const { data } = await apiGet<ApiResponse<{ key: string }>>(
      fetchRef.current,
      "/api/notificaciones/vapidPublicKey"
    );
    claveRef.current = urlBase64ToUint8Array(data.key);
    return claveRef.current;
  }, []);

  /**
   * Detección inicial: soporte → permiso → suscripción existente.
   */
  useEffect(() => {
    if (!user) return;
    let cancelado = false;

    async function inicializar() {
      const ios = detectarIOS();
      setEsIOS(ios);

      // iOS en pestaña de Safari: PushManager no existe; hay que instalar la PWA.
      if (ios && !estaInstalada()) {
        setEstado("instalar_pwa");
        return;
      }

      if (!soportaPush()) {
        setEstado("no_soportado");
        return;
      }

      try {
        // `register` es idempotente. Se hace aquí (no en el click) para que el
        // gesto del usuario no pase por esperas largas.
        await navigator.serviceWorker.register("/sw.js");
        const registro = await navigator.serviceWorker.ready;
        if (cancelado) return;
        registroRef.current = registro;

        if (Notification.permission === "denied") {
          setEstado("bloqueado");
          return;
        }

        const suscripcion = await registro.pushManager.getSubscription();
        if (cancelado) return;

        if (Notification.permission === "granted" && suscripcion) {
          setEstado("activo");
          // `subscribe` es idempotente: refresca claves/lastUsedAt y reactiva
          // `notificaciones_activadas` si el backend había perdido la suscripción.
          apiPost(fetchRef.current, "/api/notificaciones/subscribe", {
            subscription: suscripcion,
          }).catch((err) => console.warn("No se pudo refrescar la suscripción:", err));
        } else {
          setEstado("permiso_pendiente");
          // Precarga de la clave VAPID (best-effort; si falla se pide en el click).
          obtenerClave().catch(() => {});
        }
      } catch (err) {
        if (cancelado) return;
        console.error("Error inicializando notificaciones push:", err);
        setEstado("no_soportado");
      }
    }

    inicializar();
    return () => {
      cancelado = true;
    };
  }, [user, obtenerClave]);

  /**
   * Si el usuario habilita el permiso desde los ajustes del sistema y vuelve a
   * la app, se sale de «bloqueado» sin recargar.
   */
  useEffect(() => {
    if (estado !== "bloqueado") return;
    const alVolver = () => {
      if (document.visibilityState === "visible" && Notification.permission !== "denied") {
        setEstado("permiso_pendiente");
      }
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, [estado]);

  /**
   * 🔔 Activar notificaciones. Debe llamarse directamente desde un click.
   */
  const activarNotificaciones = useCallback(async (): Promise<ResultadoActivacion> => {
    if (estado !== "permiso_pendiente" || enCursoRef.current) return "cancelado";

    enCursoRef.current = true;
    setProcesando(true);
    setError(null);

    try {
      // 1️⃣ Permiso: primera operación asíncrona dentro del click (requisito de iOS).
      const permiso = await Notification.requestPermission();
      if (permiso === "denied") {
        setEstado("bloqueado");
        return "bloqueado";
      }
      if (permiso !== "granted") return "cancelado"; // cerró el diálogo sin decidir

      // 2️⃣ Suscripción con la clave ya precargada.
      const registro = registroRef.current ?? (await navigator.serviceWorker.ready);
      const clave = await obtenerClave();
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: clave as BufferSource,
      });

      // 3️⃣ Registrar en el backend; si falla, no dejar el navegador suscrito sin registro.
      try {
        await apiPost(fetchRef.current, "/api/notificaciones/subscribe", {
          subscription: suscripcion,
        });
      } catch (err) {
        await suscripcion.unsubscribe().catch(() => {});
        throw err;
      }

      setEstado("activo");

      // 4️⃣ Confirmación (best-effort). `new Notification()` no existe en móviles:
      // se usa el SW. Un fallo aquí no debe invalidar la activación.
      registro
        .showNotification("🔔 Notificaciones activadas", {
          body: "Recibirás avisos cuando tengas nuevos seguidores o actividad.",
          icon: ICONO_CONFIRMACION,
          tag: "notificaciones-activadas",
        })
        .catch(() => {});

      return "activado";
    } catch (err) {
      console.error("Error activando notificaciones:", err);
      setError(getUserMessage(err, "notificaciones_push"));
      return "error";
    } finally {
      enCursoRef.current = false;
      setProcesando(false);
    }
  }, [estado, obtenerClave]);

  /**
   * 🚫 Desactivar notificaciones (solo en este dispositivo).
   */
  const desactivarNotificaciones = useCallback(async (): Promise<boolean> => {
    if (enCursoRef.current) return false;

    enCursoRef.current = true;
    setProcesando(true);
    setError(null);

    try {
      const registro = registroRef.current ?? (await navigator.serviceWorker.ready);
      const suscripcion = await registro.pushManager.getSubscription();

      if (suscripcion) {
        const endpoint = suscripcion.endpoint;
        await suscripcion.unsubscribe();
        // Si el backend falla, queda una suscripción muerta que se limpia sola
        // (404/410 en el siguiente envío); no se revierte nada en el navegador.
        await apiPost(fetchRef.current, "/api/notificaciones/unsubscribe", { endpoint }).catch(
          (err) => console.warn("No se pudo avisar al backend de la baja:", err)
        );
      }

      // El permiso sigue concedido: reactivar no vuelve a mostrar el diálogo.
      setEstado("permiso_pendiente");
      return true;
    } catch (err) {
      console.error("Error desactivando notificaciones:", err);
      setError(getUserMessage(err, "notificaciones_push"));
      return false;
    } finally {
      enCursoRef.current = false;
      setProcesando(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    estado,
    esIOS,
    procesando,
    error,
    clearError,
    activarNotificaciones,
    desactivarNotificaciones,
  };
}

/** Web Push disponible en este navegador. */
function soportaPush(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** iPhone/iPad (incluye iPadOS, que se identifica como Mac con pantalla táctil). */
function detectarIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** La app corre como PWA instalada (pantalla de inicio). */
function estaInstalada(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
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
