# Plan: rediseño del sistema de notificaciones (seguimiento del backend)

Espejo del plan del backend: `login-autenticacion/engineering/working/implementation-plans/2026-11-18-plan-sistema-notificaciones.md`.
Se actualiza al terminar cada fase del backend. Creado: 2026-11-18. Última actualización: 2026-11-19.

## Estado de las fases

| Fase | Qué hace el backend | Estado | Impacto en el frontend |
|---|---|---|---|
| 0 | Corrige bugs críticos: el cron borraba las suscripciones push cada domingo; el filtro borraba suscripciones válidas; `subscribe` idempotente | **Hecha y desplegada (2026-11-18)** | Ninguno obligatorio (ver abajo). Los usuarios dejarán de perder el push. |
| 1 | Servicio central `notificar()` (BD + push + correo) | **Núcleo hecho (2026-11-19), sin deploy** | Ninguno. Payload de push estandarizado (`title`, `body`, `icon`, `badge`, `tag`, `url`, `data.tipo`); el service worker debe usar `tag` y `data.tipo`. |
| 2 | Seguir envía correo; comentar crea notificación en `/notificaciones`; moderación envía push | **Hecha en backend (2026-11-19), sin deploy** | Renderizar el tipo `comentario` en `/notificaciones`. |
| 3 | Likes: notificación agrupada por posteo + push con `tag` (sin correo) | Pendiente | Renderizar el tipo `like` con contador ("X y N más"). |
| 4 | Preferencias por tipo y canal; límite de correos | Pendiente | Pantalla de preferencias en `/configuracion/notificaciones` (`GET/PUT /api/notificaciones/preferencias`). |
| 5 | Marcar todas leídas, borrar todas, filtro por tipo, limpieza de viejas | Pendiente | Botones y filtro en `/notificaciones`. |
| 6 | Tipos nuevos: `reporte_resuelto`, `reporte_descartado`, `nueva_publicacion`, `sistema` | Pendiente | Renderizar los tipos nuevos; los de `sistema` no tienen emisor. |
| 7 | `GET /api/notificaciones/estado`, dispositivos, `subscribe` idempotente | Pendiente | Flujo de activación y arreglo de iOS (ver abajo). |
| 8 | Documentación, Postman, `SPECS-FRONTEND-NOTIFICACIONES.md` | Pendiente | Contrato final. |

## Tipos de notificación (contrato actual y previsto)

| Tipo | Hoy en `/notificaciones` | Previsto |
|---|---|---|
| `follow` | Sí | Sin cambio |
| `comentario` | Sí (render y navegación hechos; se activa al desplegar la Fase 2 del backend) | Fase 2 |
| `like` | No | Fase 3 (agrupado) |
| `posteo_eliminado_moderacion` | Sí (sin emisor) | Sin cambio; se añade push |
| `reporte_resuelto` / `reporte_descartado` | No | Fase 6 |
| `nueva_publicacion` | No | Fase 6 |
| `sistema` | No | Fase 6 |

## Tareas del frontend (se detallan por fase al completarse)

### Activación en iOS (Fase 7; se puede avanzar ya)
1. Web Push en iOS solo funciona con la **PWA instalada** (iOS 16.4 o superior). En una pestaña de Safari `PushManager` no existe.
2. Llamar `Notification.requestPermission()` **directamente dentro del handler de un click**. Si va tras `await`s largos o en un `useEffect`, iOS lo ignora.
3. Si el permiso está en `denied`, no se puede volver a pedir: mostrar cómo habilitarlo en Ajustes > Notificaciones > TlaxApp.
4. Convertir bien la clave VAPID de base64url a `Uint8Array` para `applicationServerKey`.
5. Obtener la clave VAPID **antes** del click; dentro del click: `requestPermission` → `pushManager.subscribe` → `POST /api/notificaciones/subscribe`.
6. Si `POST /subscribe` falla, llamar `subscription.unsubscribe()`. Al abrir la pantalla, reconciliar `getSubscription()` con `GET /estado` (cuando exista).
7. Estados de UI: `no_soportado` → `instalar_pwa` → `permiso_pendiente` → `bloqueado` → `activo`.
8. El service worker debe llamar `showNotification` en **cada** push (iOS revoca la suscripción si recibe pushes silenciosos) y abrir `data.url` en `notificationclick`.

## Decisiones abiertas (se resuelven al llegar a la fase)

| Decisión | Fase |
|---|---|
| Retención de notificaciones | 5 |
| Enlace de baja de un clic en correos | 4 |
| `nueva_publicacion` activada o no por defecto | 6 |
| Correo al reportante por reporte resuelto | 6 |

Decidido: likes = `/notificaciones` + push agrupado, sin correo.

## Fase 0: qué cambió para el frontend

- **Sin cambios de contrato** en `POST /api/notificaciones/subscribe` ni en `/unsubscribe` (misma respuesta `200`).
- `subscribe` ahora es **idempotente**: llamarlo de nuevo con el mismo `endpoint` actualiza la suscripción y reactiva `notificaciones_activadas`, sin duplicar. Es seguro llamarlo al abrir la app para "refrescar" la suscripción.
- Nuevas validaciones (`400`): `endpoint` debe ser una URL `https` de hasta 2048 caracteres, y `keys.p256dh` y `keys.auth` deben ser texto no vacío. Los endpoints reales de FCM, APNs y Mozilla cumplen esto.
- Se conservan máximo 10 dispositivos por usuario; al exceder se descartan los más antiguos.
- **Consecuencia visible:** las suscripciones dejan de perderse cada domingo. Quien ya perdió la suya debe volver a activar las notificaciones. Si `notificaciones_activadas` llega en `false`, mostrar el botón de activar.

## Historial

- 2026-11-18: plan creado.
- 2026-11-18: Fase 0 implementada en el backend y desplegada.
- 2026-11-19: Fase 2 (y núcleo de la Fase 1) implementada en el backend (319/319 tests), pendiente de deploy. Ver la sección «Fase 2» sobre el contrato.

## Fase 2: qué cambia para el frontend

- **`GET /api/notificaciones`** ahora devuelve notificaciones de tipo **`comentario`** (`mensaje: "comentó tu publicación"`, con `emisor` y `referencia` = posteo). El frontend debe renderizarlas y llevar al posteo.
- **Payload de push estándar**: `title`, `body`, `icon`, `badge`, `tag`, `url`, `data.tipo` (+ `data.posteoId`/`data.comentarioId` en comentarios). El service worker debe usar `tag` (reemplaza pushes del mismo origen) y abrir `url` en `notificationclick`.
- **Moderación**: el autor recibe ahora un push genérico (`data.tipo = posteo_eliminado_moderacion`, `url: /notificaciones`).
- **Correos**: seguir y comentar envían correo (máx. 1 de cada tipo cada 15 min por usuario) con enlace a `/configuracion/notificaciones`. Esa ruta debe existir en el frontend.
- Sin cambios en endpoints ni en códigos de respuesta.
- `referencia` (posteo) trae `_id`, `public_id`, `texto` e `imagen_perfil.public_id`, o `null` si el posteo ya no existe.

### Hecho en el frontend (2026-11-19)

- `public/sw.js` (commit `2ab094b`): usa `tag` (+ `renotify`), `badge` y `data.tipo`; muestra siempre la notificación aunque el payload venga vacío o inválido; solo abre `url` del mismo origen; reutiliza la ventana abierta en `notificationclick`.
- `/notificaciones`: el click en una notificación `comentario` abre `/posteo/<referencia._id>`; si `referencia` es `null`, solo la marca como leída. `Notificacion.referencia` tipa `_id`. El texto «comentó tu publicación» ya se renderiza con el nombre del emisor.
- Pendiente: probar de extremo a extremo cuando la Fase 2 se despliegue en el backend.
