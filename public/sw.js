// Service worker de notificaciones push.
//
// Payload estándar del backend (helpers/notificar.js):
//   { title, body, icon, badge, tag, url, data: { tipo, ... } }
//
// Reglas:
// - Se llama a `showNotification` en CADA push, aunque el payload venga vacío o
//   inválido: iOS revoca la suscripción si recibe pushes sin notificación visible.
// - `url` solo se abre si es del mismo origen; si no, se usa la raíz.

const ICONO_POR_DEFECTO = "/assets/icono-tlaxapp-beige.png";
const TITULO_POR_DEFECTO = "TlaxApp";

function leerPayload(event) {
  if (!event.data) return {};
  try {
    const payload = event.data.json();
    return payload && typeof payload === "object" ? payload : {};
  } catch {
    // Texto plano u otro formato: se usa como cuerpo.
    try {
      return { body: event.data.text() };
    } catch {
      return {};
    }
  }
}

// Devuelve una URL absoluta del mismo origen, o la raíz si no es válida.
function resolverUrlSegura(url) {
  try {
    const destino = new URL(url, self.location.origin);
    return destino.origin === self.location.origin ? destino.href : self.location.origin + "/";
  } catch {
    return self.location.origin + "/";
  }
}

self.addEventListener("push", (event) => {
  const payload = leerPayload(event);
  const tipo = payload.data && payload.data.tipo;

  const options = {
    body: payload.body || "",
    icon: payload.icon || ICONO_POR_DEFECTO,
    badge: payload.badge || payload.icon || ICONO_POR_DEFECTO,
    data: { ...(payload.data || {}), tipo, url: resolverUrlSegura(payload.url) },
  };

  // Con `tag` el navegador reemplaza la notificación anterior con el mismo tag
  // (p. ej. likes agrupados). `renotify` vuelve a avisar al usuario en el reemplazo.
  if (payload.tag) {
    options.tag = payload.tag;
    options.renotify = true;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || TITULO_POR_DEFECTO, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = resolverUrlSegura(event.notification.data && event.notification.data.url);

  event.waitUntil(
    (async () => {
      const ventanas = await clients.matchAll({ type: "window", includeUncontrolled: true });

      // Reutiliza una pestaña/PWA abierta en vez de crear otra.
      for (const ventana of ventanas) {
        if (new URL(ventana.url).origin === self.location.origin && "focus" in ventana) {
          await ventana.focus();
          if ("navigate" in ventana) {
            try {
              await ventana.navigate(destino);
            } catch {
              // Si navigate falla, la ventana ya quedó enfocada.
            }
          }
          return;
        }
      }

      await clients.openWindow(destino);
    })()
  );
});
