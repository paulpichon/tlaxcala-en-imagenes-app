# Notificaciones (`/api/notificaciones`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:131`. Modelos: `models/Notificacion.js` (in-app) y `models/Usuario.js` (`pushSubscriptions`, `notificaciones_activadas`). Web Push: `helpers/web-push.js`.

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

**Tipos de notificación** (`models/Notificacion.js:23`): `follow`, `like`, `comentario`, `nueva_publicacion`, `posteo_eliminado_moderacion`. **Verificado con búsqueda en `*.js`: en el código actual solo se persisten `follow` (`controllers/followers.js:49-52`) y `posteo_eliminado_moderacion` (`admin/controllers/moderacion.js:383-385`)**. El valor `comentario` aparece únicamente en el payload de Web Push (`controllers/comentarios.js:71`), no como documento de `Notificacion`. `like`, `nueva_publicacion` y `comentario` están en el enum sin escritura.

---

## [POST] /api/notificaciones/subscribe

**Descripción:** Registra una suscripción de Web Push del navegador del usuario (hasta 10 dispositivos; al superar el límite se elimina la más antigua) y activa `notificaciones_activadas`.
**Archivo de ruta:** `routes/notificaciones.js:16`
**Controlador:** `controllers/notificaciones.js` — `subscribirNotificacionesWebPush` (línea 8)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `subscribirNotificacionesWebPush`. Sin `validarCampos`: la validación es manual.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `subscription` | objeto | Sí | Validación manual: `subscription.endpoint`, `subscription.keys.p256dh` y `subscription.keys.auth` deben existir |
| body | `subscription.endpoint` | string | Sí | Ver arriba |
| body | `subscription.keys.p256dh` | string | Sí | Ver arriba |
| body | `subscription.keys.auth` | string | Sí | Ver arriba |
| body | `userAgent` | string | No | Si falta se usa la cabecera `User-Agent` |

### Ejemplo de request
```http
POST /api/notificaciones/subscribe
Content-Type: application/json
Cookie: accessToken=…

{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/abc…",
    "keys": { "p256dh": "BNc…", "auth": "t8…" }
  },
  "userAgent": "Mozilla/5.0 …"
}
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Suscripción registrada correctamente" }
```
Si la suscripción ya existía, la respuesta es igual (no se duplica).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 400 | `BAD_REQUEST` | Bad Request | "Suscripción inválida" | `controllers/notificaciones.js:19` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/notificaciones.js:25` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al guardar suscripción" | `controllers/notificaciones.js:63` |

### Notas para el Frontend
- Envía el objeto `PushSubscription.toJSON()` del navegador dentro de `subscription`.
- Tras el registro, el backend pone `notificaciones_activadas: true`. Si el usuario revoca el permiso del navegador, usa `unsubscribe`.

---

## [POST] /api/notificaciones/unsubscribe

**Descripción:** Elimina una suscripción de Web Push identificada por su `endpoint`. Si no quedan suscripciones, desactiva `notificaciones_activadas`.
**Archivo de ruta:** `routes/notificaciones.js:21`
**Controlador:** `controllers/notificaciones.js` — `unsubscribeNotificacionesWebPush` (línea 67)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `unsubscribeNotificacionesWebPush`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `endpoint` | string | Sí | Validación manual: si falta → 400 |

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

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 400 | `BAD_REQUEST` | Bad Request | "Falta el endpoint de la suscripción" | `controllers/notificaciones.js:73` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/notificaciones.js:85` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al desactivar notificaciones" | `controllers/notificaciones.js:96` |

### Notas para el Frontend
- Es idempotente: si el endpoint no existe, responde 200 igual.

---

## [GET] /api/notificaciones/vapidPublicKey

**Descripción:** Devuelve la clave pública VAPID necesaria para suscribirse a Web Push (`applicationServerKey`).
**Archivo de ruta:** `routes/notificaciones.js:27`
**Controlador:** `controllers/notificaciones.js` — `getVapidPublicKey` (línea 100)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `getVapidPublicKey`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/notificaciones/vapidPublicKey
Cookie: accessToken=…
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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Falta la clave pública VAPID" (variable `VAPID_PUBLIC_KEY` vacía) | `controllers/notificaciones.js:104` |

### Notas para el Frontend
- La clave es **`data.key`**, no `publicKey`.
- Requiere sesión, aunque la clave es pública. Solo la pide un usuario autenticado.

---

## [GET] /api/notificaciones

**Descripción:** Notificaciones in-app del usuario autenticado, paginadas, con datos del emisor y de la referencia (posteo).
**Archivo de ruta:** `routes/notificaciones.js:32`
**Controlador:** `controllers/notificaciones.js` — `obtenerNotificaciones` (línea 113)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `obtenerNotificaciones`. **Sin validadores**: parámetros no válidos se normalizan en silencio.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | `page` | number | No (default 1) | `parseInt`; valores inválidos → 1; mínimo 1 |
| query | `limite` | number | No (default **20**) | `parseInt`; valores inválidos → 20; mínimo 1. **Sin máximo.** |
| query | `limit` | number | No | Alias de compatibilidad |

### Ejemplo de request
```http
GET /api/notificaciones?page=1&limite=20
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
      "tipo": "follow",
      "mensaje": "comenzó a seguirte",
      "notificacion_leida": false,
      "createdAt": "2026-10-27T19:10:34.000Z",
      "emisor": {
        "_id": "6650b2…",
        "nombre_completo": { "nombre": "Luis", "apellido": "Pérez" },
        "imagen_perfil": { "secure_url": "https://res.cloudinary.com/…", "public_id": "…" },
        "url": "luis-perez-9d4e0"
      }
    },
    {
      "_id": "6651e1…",
      "tipo": "posteo_eliminado_moderacion",
      "mensaje": "Tu publicacion fue eliminada por infringir nuestras normas de contenido: Spam o publicidad no autorizada",
      "notificacion_leida": false,
      "createdAt": "2026-10-26T10:00:00.000Z",
      "referencia": { "_id": "6650d4…", "public_id": "…", "texto": "…" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1, "next": null, "prev": null }
}
```
En notificaciones de sistema (`emisor: null`) el campo `emisor` **no aparece** en el JSON.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener notificaciones" | `controllers/notificaciones.js:189` |

### Notas para el Frontend
- ⚠ **`leida` no existe**: la proyección pide `leida`, pero el campo real es `notificacion_leida`. Usa `notificacion_leida`.
- Sin `emisor` = notificación de sistema (moderación): muéstrala sin avatar ni enlace al perfil.
- `referencia` puede ser `null` si el posteo fue eliminado físicamente.
- Default `limite` **20** (no 15).
- Entrada no válida (`page=abc`) no da error: se normaliza.

---

## [PATCH] /api/notificaciones/marcar-notificacion-leida/:id

**Descripción:** Marca una notificación propia como leída. Idempotente.
**Archivo de ruta:** `routes/notificaciones.js:37`
**Controlador:** `controllers/notificaciones.js` — `marcarNotificacionLeida` (línea 193)

### Autenticación y permisos
- Requiere token: **Sí**. Solo la notificación del propio usuario (`receptor`).
- Cadena de middlewares: `verificarTokenSesion` → `check('id').isMongoId()` → `validarCampos` → `marcarNotificacionLeida`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El id de la notificación es obligatorio"` → 422 |

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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El id de la notificación es obligatorio" | `routes/notificaciones.js:41` |
| 404 | `NOT_FOUND` | Resource Not Found | "Notificación no encontrada" (inexistente, ajena o eliminada) | `controllers/notificaciones.js:216` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al marcar notificación como leída" | `controllers/notificaciones.js:222` |

### Notas para el Frontend
- Una notificación ajena responde 404 (no 403): no se revela su existencia.

---

## [GET] /api/notificaciones/nuevas-notificaciones

**Descripción:** Cantidad de notificaciones no leídas del usuario (para el contador de la campana).
**Archivo de ruta:** `routes/notificaciones.js:46`
**Controlador:** `controllers/notificaciones.js` — `obtenerTotalNotificacionesNoLeidas` (línea 228)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `obtenerTotalNotificacionesNoLeidas`.
- Rate limiter: **ninguno**.

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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener notificaciones no leídas" | `controllers/notificaciones.js:244` |

### Notas para el Frontend
- Se consulta con `hint` de índice compuesto. Si cambia el índice, puede fallar con 500 (derivado).
- Es la clave `data.totalNoLeidas`.

---

## [DELETE] /api/notificaciones/eliminar-notificacion/:id

**Descripción:** Borra físicamente una notificación propia (`findOneAndDelete` por `_id` y `receptor`).
**Archivo de ruta:** `routes/notificaciones.js:51`
**Controlador:** `controllers/notificaciones.js` — `eliminarNotificacion` (línea 248)

### Autenticación y permisos
- Requiere token: **Sí**. Solo notificaciones propias.
- Cadena de middlewares: `verificarTokenSesion` → `check('id').notEmpty()` → `check('id').isMongoId()` → `validarCampos` → `eliminarNotificacion`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `notEmpty()` → `"El id de la notificación es obligatorio"`; `isMongoId()` → `"El id debe ser un MongoId valido"` → 422 |

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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El id debe ser un MongoId valido" / "El id de la notificación es obligatorio" | `routes/notificaciones.js:55,57` |
| 404 | `NOT_FOUND` | Resource Not Found | "Notificación no encontrada" | `controllers/notificaciones.js:262` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al eliminar la notificación" | `controllers/notificaciones.js:268` |

### Notas para el Frontend
- Es un borrado físico, aunque el modelo tenga campos de soft delete.
- Eliminar una notificación de moderación la quita para siempre; el aviso por correo no se puede deshacer.
