# Notificaciones (`/api/notificaciones`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:135` (prefijo `/api/notificaciones`, `models/server.js:43`). Router: `routes/notificaciones.js` (**13 rutas**). Modelos: `models/Notificacion.js` (in-app) y `models/Usuario.js` (`pushSubscriptions`, `notificaciones_activadas`, `preferencias_notificaciones`, `ultimo_correo_notificacion`, `firmas_dispositivo`, `ultima_difusion_publicacion`). Servicio central: `helpers/notificar.js`. Web Push: `helpers/enviar-push.js`.

> **Revisión 2026-11-26 (cableado de rate limiting de 5 escrituras).** `POST /subscribe`, `POST /unsubscribe`, `DELETE /dispositivos/:id`, `PATCH /marcar-notificacion-leida/:id` y `DELETE /eliminar-notificacion/:id` pasan de `floodLecturaIpLimiter` a `floodEscrituraIpLimiter` (15 min / **600** por IP, env `FLOOD_ESCRITURA_IP_MAX`, `FLOOD_BLOCKED`) en `routes/notificaciones.js:24,31,58,85,104` (§9 del plan de notificaciones). **Sin cambio de contrato** de request/response ni de rutas; las citas `archivo:línea` del router no se desplazaron. Detalle en `2026-11-26_12-53-18_documentacion-endpoints.md`.

> **Revisión 2026-11-25 (Fases 3–7 de notificaciones).** Este archivo se reescribió por completo: pasa de 7 a **13 endpoints** (`/estado`, `/preferencias` GET y PUT, `/dispositivos/:id`, `/marcar-todas-leidas`, `DELETE /` son nuevos; `subscribe`, `unsubscribe`, `vapidPublicKey`, `GET /`, `eliminar-notificacion/:id` y `nuevas-notificaciones` cambiaron). Detalle con citas en `2026-11-25_20-27-06_documentacion-endpoints.md`.

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## Tipos, canales y comportamiento (contexto para el frontend)

### Enum real de `Notificacion.tipo`

`models/Notificacion.js:28-31` — **9 valores**:

`follow`, `like`, `comentario`, `nueva_publicacion`, `posteo_eliminado_moderacion`, `reporte_resuelto`, `reporte_descartado`, `seguridad`, `sistema`.

### Canales por tipo

La `Notificacion` in-app **se crea siempre** (excepto en `nueva_publicacion`, que es opt-in, ver abajo). Las preferencias (`preferencias_notificaciones`) solo gobiernan **push** y **correo** (`helpers/preferencias-notificaciones.js:1-3,50-53`).

| `tipo` | In-app | Push | Correo | ¿Silenciable? | Productor |
|---|---|---|---|---|---|
| `follow` | Sí | Sí | Sí, con cooldown | Sí: `push.follow`, `correo.follow` | `controllers/followers.js:54-75` |
| `comentario` | Sí | Sí | Sí, con cooldown | Sí: `push.comentario`, `correo.comentario` | `controllers/comentarios.js:63-87` |
| `like` | Sí (agrupada) | Sí, limitado por posteo | **No** | Sí: `push.like` | `controllers/likes.js:26-43` |
| `nueva_publicacion` | **Solo si la activó** | Sí | **No** | Sí: `push.nueva_publicacion` (**default `false`**) | `helpers/difundir-publicacion.js:134-205` |
| `posteo_eliminado_moderacion` | Sí | Sí | Sí (correo propio, fuera de `notificar`) | **No** | `admin/controllers/moderacion.js:433-446` |
| `reporte_resuelto` | Sí | Sí | **No** | **No** | `admin/controllers/moderacion.js:343-356,451` |
| `reporte_descartado` | Sí | Sí | **No** | **No** | `admin/controllers/moderacion.js:343-356,528` |
| `seguridad` | Sí | Sí | Sí, **sin cooldown** | **No** | `helpers/avisos-cuenta.js:32-106` |
| `sistema` | Sí | **No** | Sí, sin cooldown | Sí: `correo.sistema` (`push.sistema` existe pero no se usa) | `helpers/avisos-cuenta.js:115-133` |

Reglas transversales (`helpers/notificar.js:183-261`):

- **Emisor propio**: si `emisor === receptor`, no se crea nada (`omitida: 'propia'`, `:196-198`). El like propio no notifica.
- **Receptor elegible**: `estatus: 1` por defecto; `soloActivos: false` permite estatus 2/3 (avisos de moderación y de seguridad). Nunca cuentas `isDeleted` ni estatus 4 (`:203-205`).
- **Orden**: `Notificacion` en BD → push → correo. Best-effort: nunca lanza (`:257-260`). Se invoca **después** de responder al cliente.
- **Push**: exige `push` definido en la llamada, preferencia del canal y `notificaciones_activadas` con al menos una suscripción (`:228-229`). Payload: `{ title, body, icon, badge, tag, url, data: { tipo, ... } }` (`:83-91`); `icon`/`badge` caen a `ICONO_SISTEMA_TLAXAPP` y `tag` al `tipo` si no se indican.
- **Correo**: exige `correo` definido, `usuario.correo` y preferencia del canal (`:245`). Cooldown por usuario y tipo: `NOTIF_CORREO_COOLDOWN_MIN` (default **15** min) sobre `Usuario.ultimo_correo_notificacion.<tipo>` con reserva atómica (`:19-45`); `cooldown: false` envía siempre (avisos de cuenta y bienvenida).

### Defaults de preferencias

`helpers/preferencias-notificaciones.js:18-21`:

```json
{
  "push": { "follow": true, "comentario": true, "like": true, "nueva_publicacion": false, "sistema": true },
  "correo": { "follow": true, "comentario": true, "sistema": true }
}
```

Claves válidas: **push** `follow`, `comentario`, `like`, `nueva_publicacion`, `sistema`; **correo** `follow`, `comentario`, `sistema` (`:9-12`). Los tipos sin clave (`posteo_eliminado_moderacion`, `reporte_resuelto`, `reporte_descartado`, `seguridad`) **no se pueden silenciar**: `canalPermitido` devuelve `true` para ellos (`:50-53`).

### Agrupación de `like` (Fase 3)

- Una sola `Notificacion` viva por `(receptor, tipo: 'like', referencia)`; índice único parcial `like_agrupado_unico` sobre `isDeleted: false` (`models/Notificacion.js:99-102`).
- `contador` = **emisores distintos**; `emisor` = el último; `createdAt` = la última actividad; `mensaje` = `"le dio me gusta a tu publicación"` o `"y N−1 más dieron me gusta a tu publicación"` (`helpers/notificar.js:104-145`).
- `emisores` (hasta 1000) solo deduplica: **nunca se expone** (`select: false`, `models/Notificacion.js:61-65`).
- Push: como mucho uno por notificación cada `NOTIF_LIKE_PUSH_COOLDOWN_MIN` (default **10** min), `tag: like-<posteoId>` (`helpers/notificar.js:57-58,153-160`; `controllers/likes.js:34-42`).
- Quitar el like **no** modifica ni borra la notificación (`controllers/likes.js:66-71`).

### `nueva_publicacion` (Fase 6)

- Solo posteos `visibilidad: 'publico'` recién creados (`helpers/difundir-publicacion.js:139`). Editar de `perfil` a `publico` **no** difunde (la difusión solo se invoca en el alta, `controllers/posteos.js:439`).
- **Opt-in**: solo seguidores con `push.nueva_publicacion: true`; a los demás **no se les crea ni la notificación in-app** (`helpers/difundir-publicacion.js:81-86`).
- Topes: una difusión cada `NOTIF_NUEVA_PUBLICACION_AUTOR_MIN` (default **60** min) por autor (`:30-31,147-148`) y `NOTIF_NUEVA_PUBLICACION_RECEPTOR_MAX_DIA` (default **10**) avisos en 24 h por receptor (`:33-34,89-102`).
- Por lotes de 200 con push concurrente 20 (`:25-26`); sin correo.

### `seguridad` y `sistema` (Fase 6)

- `seguridad`: cambio de contraseña (`controllers/usuarios.js:299`), restablecimiento por correo (`controllers/auth.js:425`) e inicio de sesión desde un navegador/OS nuevo (`controllers/auth.js:227-231`). In-app + push + correo **sin cooldown**; `soloActivos: false`. El aviso de login solo se dispara si `registrarDispositivoLogin` confirma una firma nueva; la primera vez que la cuenta tiene `firmas_dispositivo` se **siembra sin avisar** (`helpers/dispositivos-conocidos.js:22-59`).
- `sistema`: bienvenida al verificar el correo, una sola vez (`controllers/auth.js:48`; `helpers/avisos-cuenta.js:115-133`). In-app + correo; **sin push** (en ese momento la cuenta aún no tiene dispositivos).

### Retención (Fase 5)

`helpers/retencion-notificaciones.js:15-40` + cron diario a las **05:00** (`jobs/limpiar-notificaciones-antiguas.js:5-6` → `jobs/functions/cron-jobs-functions.js`, `limpiarNotificacionesAntiguas`):

| Situación | Plazo | Variable |
|---|---|---|
| Leídas | 90 días desde `createdAt` | `NOTIF_RETENCION_LEIDAS_DIAS` |
| No leídas | 180 días desde `createdAt` | `NOTIF_RETENCION_NO_LEIDAS_DIAS` |
| Eliminadas por el usuario (soft delete) | 30 días desde `deletedAt` | `NOTIF_ELIMINADAS_DIAS` |

Las ramas por antigüedad exigen `isDeleted: false`, así una notificación eliminada solo se purga por su propio plazo (`:34-40`).

### Forma de la notificación en la API

- Las notificaciones de sistema (`emisor: null`) **no traen el campo `emisor`** en el JSON (el `$lookup` + `$arrayElemAt` lo omite).
- `referencia` solo se resuelve para `tipoReferencia: 'Posteo'`; si no aplica (p. ej. `follow`, `seguridad`), **el campo se omite** (derivado del `$arrayElemAt` sobre array vacío, `controllers/notificaciones.js:294-306,327-328`).
- `contador` solo es significativo en `like` agrupados.
- El campo de leído real es **`notificacion_leida`**; la proyección también pide `leida`, que no existe en el modelo y por tanto no aparece (`controllers/notificaciones.js:321`; `models/Notificacion.js:48-51`).

---

## [POST] /api/notificaciones/subscribe

**Descripción:** Registra (o refresca) la suscripción Web Push de un navegador. Es **idempotente y reactivador**: si el `endpoint` ya existe actualiza claves, `userAgent` y `lastUsedAt`; si no, la agrega. Antes de registrar, **quita ese `endpoint` de cualquier otra cuenta** (un endpoint pertenece a una sola cuenta, por privacidad) y activa `notificaciones_activadas`. Devuelve el `id` del dispositivo.
**Archivo de ruta:** `routes/notificaciones.js:24`
**Controlador:** `controllers/notificaciones.js` — `subscribirNotificacionesWebPush` (línea 11)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`).
- Cadena de middlewares, en orden: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `subscribirNotificacionesWebPush`. Sin `validarCampos`: la validación es manual en el controlador.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`, mensaje "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde".
  - `notificacionesUsuarioLimiter` (`:325-330`), 15 min / 120 por usuario, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `subscription` | objeto | Sí | Debe existir (`controllers/notificaciones.js:16-23`) |
| body | `subscription.endpoint` | string | Sí | `endpointPushValido`: string, `length <= 2048`, regex `^https:\/\/[^\s]+$` (`helpers/enviar-push.js`) |
| body | `subscription.keys.p256dh` | string | Sí | `typeof === 'string'` y no vacío |
| body | `subscription.keys.auth` | string | Sí | `typeof === 'string'` y no vacío |
| body | `userAgent` | string | No | Si falta (o es falsy) se usa la cabecera `User-Agent`; se recorta a 512 caracteres (`:27`) |
| — | campos extra de `subscription` | — | No | **Se ignoran**: solo se persisten `endpoint` y `keys` (`:28`) |

Tope: **10 dispositivos** por cuenta; al agregar uno nuevo se conservan los 10 más recientes por `createdAt` (`:55,68-69`).

### Ejemplo de request
```http
POST /api/notificaciones/subscribe
Content-Type: application/json
Cookie: accessToken=…

{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/abc…",
    "expirationTime": null,
    "keys": { "p256dh": "BNc…", "auth": "t8…" }
  },
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) …"
}
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Suscripción registrada correctamente",
  "data": { "id": "6651f0a1f0c2a3b4c5d6e7f8" }
}
```
`data.id` es el `_id` de la suscripción dentro de `Usuario.pushSubscriptions`; se usa para cerrarla con `DELETE /api/notificaciones/dispositivos/:id`. Puede ser `null` en una carrera muy concreta (otra petición registró el endpoint y el `findOne` posterior no lo encuentra, `controllers/notificaciones.js:89-97`).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:325-330` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 400 | `BAD_REQUEST` | Bad Request | "Suscripción inválida" (falta `subscription`, `endpoint` inválido o claves ausentes) | `controllers/notificaciones.js:22` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/notificaciones.js:81` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al guardar suscripción" (incluye fallo de `desvincularEndpointDeOtrasCuentas`) | `controllers/notificaciones.js:101` |

### Notas para el Frontend
- Encabezados: `Content-Type: application/json` + cookies con `credentials: 'include'`.
- Envía `PushSubscription.toJSON()` del navegador dentro de `subscription`.
- **Privacidad:** al registrar, el endpoint se elimina de cualquier otra cuenta que lo tuviera; las cuentas que se quedan sin dispositivos pasan a `notificaciones_activadas: false` (`helpers/dispositivos-push.js:42-63`). Por eso el mismo endpoint no puede estar en dos cuentas a la vez.
- Es idempotente: repetir la llamada refresca `lastUsedAt` y reactiva el switch; no duplica.
- Guarda `data.id` para cerrar después ese dispositivo concreto (`DELETE /dispositivos/:id`) o reconciliar con `GET /estado`.

---

## [POST] /api/notificaciones/unsubscribe

**Descripción:** Elimina la suscripción Web Push del navegador identificada por su `endpoint`. Idempotente. Si la cuenta se queda sin dispositivos, apaga `notificaciones_activadas`.
**Archivo de ruta:** `routes/notificaciones.js:31`
**Controlador:** `controllers/notificaciones.js` — `unsubscribeNotificacionesWebPush` (línea 216)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `unsubscribeNotificacionesWebPush`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), `FLOOD_BLOCKED`, mensaje "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde".
  - `notificacionesUsuarioLimiter` (`:325-330`), 15 min / 120 por usuario, `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `endpoint` | string | Sí | Si falta → 400 "Falta el endpoint de la suscripción" (`:221-223`); si no pasa `endpointPushValido` → 400 "Endpoint de suscripción inválido" (`:225-227`) |

### Ejemplo de request
```http
POST /api/notificaciones/unsubscribe
Content-Type: application/json
Cookie: accessToken=…

{ "endpoint": "https://fcm.googleapis.com/fcm/send/abc…" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Suscripción eliminada correctamente" }
```
Si el `endpoint` no existía, la respuesta es idéntica.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:325-330` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 400 | `BAD_REQUEST` | Bad Request | "Falta el endpoint de la suscripción" | `controllers/notificaciones.js:222` |
| 400 | `BAD_REQUEST` | Bad Request | "Endpoint de suscripción inválido" (no es `https://…`, supera 2048 caracteres o no es string) | `controllers/notificaciones.js:226` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/notificaciones.js:238` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al desactivar notificaciones" | `controllers/notificaciones.js:249` |

### Notas para el Frontend
- El `endpoint` **debe** ser la URL real de la suscripción (`subscription.endpoint`), no el `id` del dispositivo; para cerrar por `id` está `DELETE /dispositivos/:id`.
- Llamarlo en el logout es lo recomendado por el producto (antes de `POST /api/auth/logout`, best-effort). Si la sesión ya no vale, el endpoint muerto se limpia en el siguiente envío con el `404`/`410` del proveedor push.
- Un 400 aquí no debe bloquear el cierre de sesión local.

---

## [GET] /api/notificaciones/vapidPublicKey

**Descripción:** Devuelve la clave pública VAPID (`applicationServerKey`) para suscribirse a Web Push.
**Archivo de ruta:** `routes/notificaciones.js:42`
**Controlador:** `controllers/notificaciones.js` — `getVapidPublicKey` (línea 253)

### Autenticación y permisos
- Requiere token: **No**. Es público a propósito: iOS exige pedir el permiso dentro del gesto del usuario, así que el frontend debe poder obtener la clave antes (comentario en `routes/notificaciones.js:38-41`).
- Cadena de middlewares: `floodLecturaIpLimiter` → `getVapidPublicKey`. **Sin `verificarTokenSesion` ni limiter por usuario.**
- Rate limiter: `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / 3000 por IP, `FLOOD_BLOCKED`.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/notificaciones/vapidPublicKey
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "data": { "key": "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U" } }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:270-279` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Falta la clave pública VAPID" (variable `VAPID_PUBLIC_KEY` vacía o ausente) | `controllers/notificaciones.js:257` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener la clave VAPID" | `controllers/notificaciones.js:261` |

### Notas para el Frontend
- La clave es **`data.key`**, no `publicKey`.
- Ya **no** requiere sesión: se puede pedir al cargar la pantalla de ajustes, antes del click que abre el permiso. No envía `Authorization` ni hace falta `credentials`, pero enviarlas no rompe nada.
- Un 500 aquí suele significar configuración del servidor (`VAPID_PUBLIC_KEY`), no un problema del cliente.

---

## [GET] /api/notificaciones/estado

**Descripción:** Estado de las notificaciones push de la cuenta: si están activas, los dispositivos suscritos (sin exponer endpoints ni claves) y las preferencias efectivas.
**Archivo de ruta:** `routes/notificaciones.js:44`
**Controlador:** `controllers/notificaciones.js` — `obtenerEstadoNotificaciones` (línea 107)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `obtenerEstadoNotificaciones`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / 3000 por IP, `FLOOD_BLOCKED`.
  - `notificacionesUsuarioLimiter` (`:325-330`), 15 min / 120 por usuario, `READ_BLOCKED`.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/notificaciones/estado
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "data": {
    "activadas": true,
    "dispositivos": [
      {
        "id": "6651f0a1f0c2a3b4c5d6e7f8",
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) …",
        "creadoAt": "2026-11-20T10:00:00.000Z",
        "ultimoUso": "2026-11-25T18:12:00.000Z",
        "endpointHash": "3f2c8b…64 hex…"
      }
    ],
    "preferencias": {
      "push": { "follow": true, "comentario": true, "like": true, "nueva_publicacion": false, "sistema": true },
      "correo": { "follow": true, "comentario": true, "sistema": true }
    }
  }
}
```
`dispositivos` va **del más reciente al más antiguo** por `ultimoUso` (`controllers/notificaciones.js:118-120`). `activadas = Boolean(notificaciones_activadas) && dispositivos.length > 0` (`:125`).

`endpointHash` es el SHA-256 hex del `endpoint` (`helpers/dispositivos-push.js:13`): el frontend calcula la misma huella de `pushManager.getSubscription().endpoint` para reconciliar su estado con la BD. **Nunca** viajan `endpoint` ni `keys` (`helpers/dispositivos-push.js:15-27`).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:270-279` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:325-330` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/notificaciones.js:114` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener el estado de las notificaciones" | `controllers/notificaciones.js:132` |

### Notas para el Frontend
- `dispositivos[].creadoAt` / `ultimoUso` pueden ser `null` en suscripciones antiguas (`helpers/dispositivos-push.js:24-25`).
- Para saber si **este** navegador ya está registrado: compara `endpointHash` con `sha256(subscription.endpoint)`; no compares `userAgent` (no es único).
- `activadas` es derivado: si hay `notificaciones_activadas: true` pero no quedan dispositivos, llega `false`.
- Enviar `push` a una cuenta con 0 dispositivos no ocurre (`helpers/notificar.js:228-229`).

---

## [GET] /api/notificaciones/preferencias

**Descripción:** Devuelve las preferencias de notificación **efectivas** (lo guardado sobre los defaults).
**Archivo de ruta:** `routes/notificaciones.js:49`
**Controlador:** `controllers/notificaciones.js` — `obtenerPreferencias` (línea 138)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `obtenerPreferencias`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / 3000 por IP, `FLOOD_BLOCKED`.
  - `notificacionesUsuarioLimiter` (`:325-330`), 15 min / 120 por usuario, `READ_BLOCKED`.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/notificaciones/preferencias
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "data": {
    "preferencias": {
      "push": { "follow": true, "comentario": true, "like": true, "nueva_publicacion": false, "sistema": true },
      "correo": { "follow": true, "comentario": true, "sistema": true }
    }
  }
}
```
Siempre llegan **las 8 claves** (5 de push + 3 de correo), con el default aplicado si el usuario no las guardó (`helpers/preferencias-notificaciones.js:30-39`).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:270-279` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:325-330` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/notificaciones.js:145` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener las preferencias de notificaciones" | `controllers/notificaciones.js:153` |

### Notas para el Frontend
- Renderiza los toggles desde esta respuesta (no desde constantes locales): así respetas defaults y claves futuras.
- No hay endpoint para «tipos no silenciables»; están fijados en el backend (ver la tabla de tipos). No muestres toggles para `posteo_eliminado_moderacion`, `reporte_resuelto`, `reporte_descartado` ni `seguridad`.

---

## [PUT] /api/notificaciones/preferencias

**Descripción:** Actualiza preferencias de forma **parcial y estricta**: solo canales `push`/`correo`, solo claves conocidas del canal, solo booleanos, al menos una clave. Devuelve las preferencias efectivas completas.
**Archivo de ruta:** `routes/notificaciones.js:53`
**Controlador:** `controllers/notificaciones.js` — `actualizarPreferencias` (línea 159); validador `helpers/preferencias-notificaciones.js:63-85`

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `actualizarPreferencias`. Sin `validarCampos`: devuelve **400**, no 422.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), `FLOOD_BLOCKED`.
  - `notificacionesUsuarioLimiter` (`:325-330`), 15 min / 120 por usuario, `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | (objeto raíz) | objeto | Sí | Debe ser objeto no nulo y no array → "El cuerpo debe ser un objeto" |
| body | `push` | objeto | No | Debe ser objeto → "El canal push debe ser un objeto" |
| body | `push.follow` | boolean | No | Boolean estricto → "push.follow debe ser booleano" |
| body | `push.comentario` | boolean | No | Ídem |
| body | `push.like` | boolean | No | Ídem |
| body | `push.nueva_publicacion` | boolean | No | Ídem (default `false`) |
| body | `push.sistema` | boolean | No | Ídem |
| body | `correo` | objeto | No | Debe ser objeto → "El canal correo debe ser un objeto" |
| body | `correo.follow` | boolean | No | "correo.follow debe ser booleano" |
| body | `correo.comentario` | boolean | No | Ídem |
| body | `correo.sistema` | boolean | No | Ídem |

Errores de validación (todos **400 `BAD_REQUEST`**, `helpers/preferencias-notificaciones.js:63-85`):
- `"El cuerpo debe ser un objeto"`
- `"Canal no válido: <canal>"` (cualquier canal distinto de `push`/`correo`, incluidos `constructor` o `__proto__`)
- `"El canal <canal> debe ser un objeto"`
- `"Preferencia no válida: <canal>.<clave>"`
- `"<canal>.<clave> debe ser booleano"`
- `"Indica al menos una preferencia"` (body `{}` o con canales vacíos)

### Ejemplo de request
```http
PUT /api/notificaciones/preferencias
Content-Type: application/json
Cookie: accessToken=…

{ "push": { "nueva_publicacion": true } }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Preferencias actualizadas correctamente",
  "data": {
    "preferencias": {
      "push": { "follow": true, "comentario": true, "like": true, "nueva_publicacion": true, "sistema": true },
      "correo": { "follow": true, "comentario": true, "sistema": true }
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:325-330` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 400 | `BAD_REQUEST` | Bad Request | Uno de los 6 mensajes de validación listados arriba | `controllers/notificaciones.js:163` (mensaje de `helpers/preferencias-notificaciones.js:63-85`) |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/notificaciones.js:173` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al actualizar las preferencias de notificaciones" | `controllers/notificaciones.js:182` |

### Notas para el Frontend
- **400, no 422.** Es el único endpoint de notificaciones con validación manual de body; distinguir por `code` (`BAD_REQUEST`), no por el texto.
- El body es **parcial**: envía solo lo que cambia. `{}` o `{"push":{}}` → 400 "Indica al menos una preferencia".
- Las preferencias **no silencian la notificación in-app**: la `Notificacion` se crea siempre. Solo apagan push y correo de ese tipo/canal.
- Tipos sin clave (`posteo_eliminado_moderacion`, `reporte_resuelto`, `reporte_descartado`, `seguridad`) no se pueden silenciar: enviar su clave da 400 "Preferencia no válida: …".
- `push.nueva_publicacion` arranca en `false`: es el único opt-in del sistema (difusión a seguidores).

---

## [DELETE] /api/notificaciones/dispositivos/:id

**Descripción:** Cierra una suscripción push concreta de la cuenta. Si era el último dispositivo, apaga `notificaciones_activadas`.
**Archivo de ruta:** `routes/notificaciones.js:58`
**Controlador:** `controllers/notificaciones.js` — `eliminarDispositivo` (línea 188)

### Autenticación y permisos
- Requiere token: **Sí**. Solo dispositivos propios: un id ajeno responde 404 (no 403).
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `check('id').isMongoId()` → `validarCampos` → `eliminarDispositivo`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), `FLOOD_BLOCKED`, mensaje "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde".
  - `notificacionesUsuarioLimiter` (`:325-330`), 15 min / 120 por usuario, `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; mensaje `"El id del dispositivo debe ser un MongoId válido"` (`routes/notificaciones.js:61`) → 422 `VALIDATION_FAILED` |

### Ejemplo de request
```http
DELETE /api/notificaciones/dispositivos/6651f0a1f0c2a3b4c5d6e7f8
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Dispositivo eliminado correctamente" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:325-330` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El id del dispositivo debe ser un MongoId válido"; `detail` = "La solicitud contiene errores de validación" | `routes/notificaciones.js:61` → `middlewares/validar-campos.js:28` |
| 404 | `NOT_FOUND` | Resource Not Found | "Dispositivo no encontrado" (id inexistente o de otra cuenta) | `controllers/notificaciones.js:201` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al eliminar el dispositivo" | `controllers/notificaciones.js:212` |

### Notas para el Frontend
- Usa el `id` que devuelve `POST /subscribe` o `GET /estado`, no el endpoint push.
- Si el frontend ya desuscribió en el navegador (`subscription.unsubscribe()`), llamar igual aquí es correcto: limpia la fila de la BD. Si la fila ya no está, responde 404; trátalo como éxito idempotente.
- Borrar el último dispositivo deja `activadas: false` en `GET /estado`.

---

## [GET] /api/notificaciones

**Descripción:** Notificaciones in-app del usuario autenticado, paginadas y ordenadas por `createdAt` descendente, con datos del emisor y de la referencia (solo posteos). Filtro opcional por `tipo`.
**Archivo de ruta:** `routes/notificaciones.js:65`
**Controlador:** `controllers/notificaciones.js` — `obtenerNotificaciones` (línea 266)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `check('tipo').optional().isIn(<enum del modelo>)` → `validarCampos` → `obtenerNotificaciones`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / 3000 por IP, `FLOOD_BLOCKED`.
  - `notificacionesUsuarioLimiter` (`:325-330`), 15 min / 120 por usuario, `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | `page` | number | No (default 1) | `parseInt`; inválido → 1; clamp mínimo 1 (`:269`) |
| query | `limite` | number | No (default **20**) | `parseInt`; inválido → 20; mínimo 1; **máximo 100** (clamp silencioso, `:272`) |
| query | `limit` | number | No | Alias de compatibilidad de `limite` (`:272`) |
| query | `tipo` | string | No | `optional().isIn(Notificacion.schema.path('tipo').enumValues)`; mensaje `"El tipo de notificación no es válido"` (`routes/notificaciones.js:71`) → 422 |

### Ejemplo de request
```http
GET /api/notificaciones?page=1&limite=20&tipo=like
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "data": [
    {
      "_id": "6651e0…",
      "tipo": "like",
      "mensaje": "y 3 más dieron me gusta a tu publicación",
      "notificacion_leida": false,
      "createdAt": "2026-11-25T18:00:00.000Z",
      "contador": 4,
      "emisor": {
        "_id": "6650b2…",
        "nombre_completo": { "nombre": "Luis", "apellido": "Pérez" },
        "imagen_perfil": { "secure_url": "https://res.cloudinary.com/…", "public_id": "…" },
        "url": "luis-perez-9d4e0"
      },
      "referencia": { "_id": "6650d4…", "public_id": "…", "texto": "…", "imagen_perfil": { "public_id": "…" } }
    },
    {
      "_id": "6651e1…",
      "tipo": "seguridad",
      "mensaje": "Nuevo inicio de sesión desde Chrome en Windows.",
      "notificacion_leida": false,
      "createdAt": "2026-11-24T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1, "limit": 20, "total": 42, "totalPages": 3,
    "next": "/api/notificaciones?page=2&limite=20&tipo=like",
    "prev": null
  }
}
```
- `emisor` **se omite** cuando es `null` (notificaciones de sistema).
- `referencia` **se omite** cuando el `tipoReferencia` no es `Posteo` o el posteo ya no existe (derivado de `$arrayElemAt`, `controllers/notificaciones.js:294-306`).
- `contador` solo aparece en `like` agrupados; `emisores` nunca se expone.
- Los links `next`/`prev` conservan `tipo` vía `extraQuery` (`:344-345`) y **siempre usan `limite`**, no `limit` (`helpers/responder.js:38-44`).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:270-279` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:325-330` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El tipo de notificación no es válido"; `detail` = "La solicitud contiene errores de validación" | `routes/notificaciones.js:71` → `middlewares/validar-campos.js:28` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener notificaciones" | `controllers/notificaciones.js:350` |

### Notas para el Frontend
- ⚠ **`leida` no existe**: usa `notificacion_leida`. La proyección pide `leida`, pero el campo real es `notificacion_leida` (`controllers/notificaciones.js:321`).
- `tipo` inválido es **422**, no se ignora. Valida en el cliente contra los 9 valores del enum.
- `limite` tiene tope 100 (clamp silencioso, sin error). `page` inválido se normaliza a 1.
- Sin `emisor` (campo ausente) = notificación de sistema o de seguridad: renderízala sin avatar ni enlace a perfil.
- En `like` agrupados: el título lo pone el frontend con el nombre del **último** emisor + `mensaje` («Ana y 3 más dieron me gusta…»). `contador` es el número de personas distintas.
- Solo se devuelven notificaciones con `isDeleted: false`.

---

## [PATCH] /api/notificaciones/marcar-notificacion-leida/:id

**Descripción:** Marca una notificación propia como leída. Idempotente.
**Archivo de ruta:** `routes/notificaciones.js:85`
**Controlador:** `controllers/notificaciones.js` — `marcarNotificacionLeida` (línea 354)

### Autenticación y permisos
- Requiere token: **Sí**. Solo la notificación del propio usuario (`receptor`) y no eliminada.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `check('id').isMongoId()` → `validarCampos` → `marcarNotificacionLeida`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), `FLOOD_BLOCKED`, mensaje "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde".
  - `notificacionesUsuarioLimiter` (`:325-330`), 15 min / 120 por usuario, `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; mensaje `"El id de la notificación es obligatorio"` (`routes/notificaciones.js:91`) → 422 |

### Ejemplo de request
```http
PATCH /api/notificaciones/marcar-notificacion-leida/6651e0a1f0c2a3b4c5d6e7f8
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Notificación marcada como leída" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:325-330` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El id de la notificación es obligatorio"; `detail` = "La solicitud contiene errores de validación" | `routes/notificaciones.js:91` → `middlewares/validar-campos.js:28` |
| 404 | `NOT_FOUND` | Resource Not Found | "Notificación no encontrada" (inexistente, ajena o ya eliminada) | `controllers/notificaciones.js:377` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al marcar notificación como leída" | `controllers/notificaciones.js:383` |

### Notas para el Frontend
- Una notificación ajena responde 404 (no 403): no se revela su existencia.
- Es idempotente: marcar dos veces responde 200 ambas.
- Una notificación con soft delete (`isDeleted: true`) responde 404.
- Tras el éxito, `GET /nuevas-notificaciones` baja el contador en 1.

---

## [GET] /api/notificaciones/nuevas-notificaciones

**Descripción:** Cantidad de notificaciones no leídas y no eliminadas del usuario (contador de la campana). Endpoint de polling.
**Archivo de ruta:** `routes/notificaciones.js:97`
**Controlador:** `controllers/notificaciones.js` — `obtenerTotalNotificacionesNoLeidas` (línea 389)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `pollingIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `obtenerTotalNotificacionesNoLeidas`.
- Rate limiters:
  - `pollingIpLimiter` (`middlewares/rate-limiter.js:297-306`), 15 min / 3000 por IP (env `POLLING_IP_MAX`), `FLOOD_BLOCKED`. **Cubo propio de polling**, separado de `floodLecturaIpLimiter`.
  - `notificacionesUsuarioLimiter` (`:325-330`), 15 min / 120 por usuario, `READ_BLOCKED`.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/notificaciones/nuevas-notificaciones
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "data": { "totalNoLeidas": 3 } }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:297-306` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:325-330` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener notificaciones no leídas" | `controllers/notificaciones.js:405` |

### Notas para el Frontend
- Es la clave `data.totalNoLeidas`.
- Cuenta solo `notificacion_leida: false` **y** `isDeleted: false` (`:396-400`).
- Usa **`pollingIpLimiter`** (cubo propio): el polling de muchas pestañas de una misma red ya no consume el cupo del feed ni de las lecturas interactivas. Aun así, evita intervalos por debajo de 30 s.
- Consulta con `hint` del índice `{ receptor, notificacion_leida, isDeleted }` (`:400`): si ese índice cambia, puede fallar con 500 (derivado).

---

## [PATCH] /api/notificaciones/marcar-todas-leidas

**Descripción:** Marca como leídas todas las notificaciones no leídas y no eliminadas del usuario. Devuelve cuántas cambió.
**Archivo de ruta:** `routes/notificaciones.js:75`
**Controlador:** `controllers/notificaciones.js` — `marcarTodasLeidas` (línea 436)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `marcarTodasLeidas`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / 600 por IP, `FLOOD_BLOCKED`.
  - `notificacionesUsuarioLimiter` (`:325-330`), 15 min / 120 por usuario, `READ_BLOCKED`.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
PATCH /api/notificaciones/marcar-todas-leidas
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Notificaciones marcadas como leídas",
  "data": { "actualizadas": 7 }
}
```
`actualizadas` es `modifiedCount`: solo cuenta las que estaban **no leídas** y no eliminadas (`:438-445`). Puede ser `0`.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:325-330` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al marcar las notificaciones como leídas" | `controllers/notificaciones.js:448` |

### Notas para el Frontend
- Tras el éxito puedes poner el contador de la campana a `0` sin volver a consultar `GET /nuevas-notificaciones`.
- No afecta al push ya enviado ni a los correos.

---

## [DELETE] /api/notificaciones

**Descripción:** Elimina **lógicamente** (soft delete) todas las notificaciones del usuario. El cron las purga físicamente a los 30 días.
**Archivo de ruta:** `routes/notificaciones.js:80`
**Controlador:** `controllers/notificaciones.js` — `eliminarTodasNotificaciones` (línea 454)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `eliminarTodasNotificaciones`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / 600 por IP, `FLOOD_BLOCKED`.
  - `notificacionesUsuarioLimiter` (`:325-330`), 15 min / 120 por usuario, `READ_BLOCKED`.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
DELETE /api/notificaciones
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Notificaciones eliminadas correctamente",
  "data": { "eliminadas": 42 }
}
```
`eliminadas` es `modifiedCount` de las que pasaron de `isDeleted: false` a `true` (`:456-463`).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:325-330` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al eliminar las notificaciones" | `controllers/notificaciones.js:466` |

### Notas para el Frontend
- Es soft delete: tras la respuesta, `GET /` devuelve lista vacía y `nuevas-notificaciones` devuelve `0`.
- No se puede deshacer desde la API (no hay restauración).
- **No** hay confirmación de contraseña ni step-up: una sesión válida basta.

---

## [DELETE] /api/notificaciones/eliminar-notificacion/:id

**Descripción:** Elimina lógicamente (soft delete) una notificación propia. El cron la purga físicamente a los 30 días de `deletedAt`.
**Archivo de ruta:** `routes/notificaciones.js:104`
**Controlador:** `controllers/notificaciones.js` — `eliminarNotificacion` (línea 409)

> **Cambio 2026-11-25:** ya **no** es borrado físico (`findOneAndDelete`). Ahora hace `$set: { isDeleted: true, deletedAt }` acotado a `receptor` y `isDeleted: false` (`controllers/notificaciones.js:417-421`).

### Autenticación y permisos
- Requiere token: **Sí**. Solo notificaciones propias.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `check('id').notEmpty()` → `check('id').isMongoId()` → `validarCampos` → `eliminarNotificacion`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), `FLOOD_BLOCKED`, mensaje "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde".
  - `notificacionesUsuarioLimiter` (`:325-330`), 15 min / 120 por usuario, `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `notEmpty()` → `"El id de la notificación es obligatorio"` (`routes/notificaciones.js:110`); `isMongoId()` → `"El id debe ser un MongoId valido"` (`:112`) → 422 |

### Ejemplo de request
```http
DELETE /api/notificaciones/eliminar-notificacion/6651e0a1f0c2a3b4c5d6e7f8
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Notificación eliminada correctamente" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:325-330` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El id de la notificación es obligatorio" / "El id debe ser un MongoId valido"; `detail` = "La solicitud contiene errores de validación" | `routes/notificaciones.js:110,112` → `middlewares/validar-campos.js:28` |
| 404 | `NOT_FOUND` | Resource Not Found | "Notificación no encontrada" (ajena, inexistente **o ya eliminada**) | `controllers/notificaciones.js:424` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al eliminar la notificación" | `controllers/notificaciones.js:430` |

### Notas para el Frontend
- Segunda llamada sobre la misma notificación → **404** (ya está `isDeleted: true`). Trátalo como éxito idempotente al hacer limpieza de UI.
- Es soft delete: la notificación desaparece de `GET /` y deja de contar en `nuevas-notificaciones`.
- Eliminar una notificación no afecta a correos o push ya entregados.
