# Comentarios (`/api/comentarios`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

> **Actualizado 2026-11-10:** el hallazgo "Toggle de comentarios con strings" está **mitigado en el código**: `routes/comentarios.js:61` usa `isBoolean({ strict: true })` y solo un booleano JSON real pasa la validación; strings y números reciben 422 `VALIDATION_FAILED` (verificado en ejecución con `express-validator` 7.3.2 + `validator` 13.15.35). Ver notas del [toggle](#put-apicomentariosposteoidcomentariostoggle).

Montaje: `models/server.js:138`. Modelo: `models/Comentario.js` (soft delete, `timestamps`). Validación de texto compartida: `middlewares/validar-texto.js` (`crearValidadorTexto({ opcional: false, max: 250 })`).

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [POST] /api/comentarios/:posteoId/comentarios

**Descripción:** Crea un comentario en un posteo. Si el posteo tiene comentarios activos, guarda el comentario, incrementa `comentariosCount` y responde. **Después de responder** (best-effort) notifica al autor: `Notificacion` in-app `comentario`, Web Push y correo con cooldown.
**Archivo de ruta:** `routes/comentarios.js:20`
**Controlador:** `controllers/comentarios.js` — `agregarComentario` (línea 10)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares, en orden:
  1. `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282`)
  2. `verificarTokenSesion`
  3. `comentarioUsuarioLimiter` (`middlewares/rate-limiter.js:357`)
  4. `check('posteoId').isMongoId()`
  5. `validarTextoComentario` (`middlewares/validar-texto.js`, `opcional: false`, `max: 250`)
  6. `validarCampos`
  7. `validarIdPosteo`
  8. `agregarComentario`
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `comentarioUsuarioLimiter`, **1 min / 10**, código `COMENTARIO_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | ObjectId | Sí | `isMongoId()`; `"El ID del posteo no es válido"` → 422 |
| body | `texto` | string | Sí | `trim()` → `notEmpty()` (`"El texto es obligatorio."`) → regex Unicode `^[\p{L}\p{N}\p{P}\p{S}\p{M}\p{Z}\t\n\r\u200D\uFE0F\uFE0E]*$` (`"El campo de texto contiene caracteres no permitidos."`) → `isLength({max: 250})` (`"El texto no puede exceder 250 caracteres."`) → solo enlaces de Google Maps (`errors[].code: "URL_NOT_ALLOWED"`, `helpers/enlaces-permitidos.js`). Longitud en unidades UTF-16 |

### Ejemplo de request
```http
POST /api/comentarios/6650d4a1f0c2a3b4c5d6e7f8/comentarios
Content-Type: application/json
Cookie: accessToken=…

{ "texto": "¡Qué buena foto! 📸" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `201`
```json
{
  "success": true,
  "msg": "Comentario agregado",
  "data": {
    "comentario": {
      "_id": "6651c8…",
      "texto": "¡Qué buena foto! 📸",
      "posteoId": "6650d4a1f0c2a3b4c5d6e7f8",
      "autorId": "6650a1f0c2a3b4c5d6e7f8a9",
      "isDeleted": false,
      "eliminadoPor": null,
      "deleteReason": null,
      "deletedAt": null,
      "createdAt": "2026-10-27T19:10:34.000Z",
      "updatedAt": "2026-10-27T19:10:34.000Z"
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `COMENTARIO_BLOCKED` | Rate Limit Exceeded | "Demasiados comentarios, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:357-362` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del posteo no es válido" | `routes/comentarios.js:23` + `middlewares/validar-campos.js:28` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El campo de texto contiene caracteres no permitidos" (`errors[].message`: "El texto es obligatorio.", "El campo de texto contiene caracteres no permitidos.", "El texto no puede exceder 250 caracteres.", "Solo se permiten enlaces de Google Maps (https://maps.app.goo.gl/...).") | `middlewares/validar-texto.js:73` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 404 | `NOT_FOUND` | Resource Not Found | "El posteo no existe" / "El posteo ha sido eliminado" (defensivos) | `controllers/comentarios.js:21,25` |
| 403 | `FORBIDDEN` | Forbidden | "Los comentarios están desactivados en este posteo" | `controllers/comentarios.js:29` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al agregar comentario" | `controllers/comentarios.js:92` |

### Notas para el Frontend
- El `detail` de 422 es siempre "El campo de texto contiene caracteres no permitidos", incluso si el motivo es la longitud. Muestra `errors[].message`.
- Límite de 250 caracteres UTF-16. Un emoji simple cuenta 2; una familia ZWJ puede contar 11.
- El texto se recorta (`trim`) antes de guardar. Un texto de solo espacios cuenta como vacío y responde 422.
- Solo se aceptan URLs de Google Maps (`https://maps.app.goo.gl/…`, `https://www.google.com/maps/…`, `https://goo.gl/maps/…`, `https://maps.google.com/…`). Cualquier otra URL responde 422 con `errors[].code: "URL_NOT_ALLOWED"`; usa ese `code`, no el texto.
- `comentarioLimiter` cuenta todos los intentos, incluidos los rechazados por validación.
- ⚠ Tras responder `201`, el controlador ejecuta la notificación (`await notificar(...)`, `controllers/comentarios.js:63-87`) dentro del mismo `try`. `notificar()` **nunca lanza** (`helpers/notificar.js:257-260`), así que hoy no puede llamarse `next(InternalError)` con la respuesta ya enviada; el riesgo existía con el código anterior (H20 residual). Si un efecto posterior empieza a lanzar, vuelve a aplicar.
- **Notificación (2026-11-25):** el autor del posteo recibe `Notificacion` in-app `tipo: "comentario"` (`mensaje: "comentó tu publicación"`), push (`tag: comentario-<posteoId>`) y **correo con cooldown de 15 min por usuario y tipo** (`NOTIF_CORREO_COOLDOWN_MIN`). **Ya no** es «solo el primer comentario»: lo limita el cooldown. Canales silenciables con `push.comentario` / `correo.comentario` (`controllers/comentarios.js:59-87`).
- El autor no se notifica a sí mismo (`controllers/comentarios.js:50-52`; `helpers/notificar.js:196-198`).
- **Web Push:** el `icon` del payload es `autor.imagen_perfil.secure_url` y, si falta, `ICONO_SISTEMA_TLAXAPP`. Ya **no** existe el fallback relativo `/public/assets/...` (rompía el icono cross-origin); si tampoco hay variable, el payload va sin `icon` y el servicio push usa el suyo por defecto. `followers.md` usa el mismo criterio.
- `autorId` llega como id sin poblar. Para mostrar el autor usa la lista de comentarios, que sí lo puebla.
- Un posteo oculto por moderación devuelve 404 a quien no es el autor.

---

## [GET] /api/comentarios/:posteoId/comentarios

**Descripción:** Lista paginada de comentarios activos de un posteo, con el autor poblado (`nombre_completo`, `imagen_perfil`, `url`). Orden por `_id`: `orden=desc` (default, más recientes primero) u `orden=asc` (más antiguos primero, recomendado para leer la conversación). Paginación por cursor.
**Archivo de ruta:** `routes/comentarios.js:29`
**Controlador:** `controllers/comentarios.js` — `obtenerComentarios` (línea 113)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `comentariosUsuarioLimiter` → `check('posteoId')` → `check('orden').optional().isIn(['asc','desc'])` → `check('cursor').optional().isMongoId()` → `check('page'|'limite'|'limit').optional().isNumeric()` → `validarCampos` → `validarIdPosteo` → `obtenerComentarios`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / **3000** por IP (env `FLOOD_LECTURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `comentariosUsuarioLimiter`, 15 min / 300, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | ObjectId | Sí | `isMongoId()`; `"El ID del posteo no es válido"` → 422 |
| query | `orden` | string | No (default `desc`) | `optional().isIn(['asc','desc'])`; `"El orden debe ser \"asc\" o \"desc\""` → 422 |
| query | `cursor` | ObjectId | No | `optional().isMongoId()`; `"El cursor no es válido"` → 422. `_id` del último comentario recibido; no se construye a mano, viene en `pagination.next` |
| query | `page` | number | No (default 1) | `optional().isNumeric()`; `"La página debe ser numérica"` → 422. Clamp mínimo 1. Sin `cursor` se usa como `skip` (compatibilidad); con `cursor` solo se devuelve como dato |
| query | `limite` | number | No (default **10**) | `optional().isNumeric()`; `"El límite debe ser numérico"` → 422. Clamp 1–**100** |
| query | `limit` | number | No | Alias; `"El límite debe ser numérico"` → 422 |

### Ejemplo de request
```http
GET /api/comentarios/6650d4a1f0c2a3b4c5d6e7f8/comentarios?orden=asc&limite=10
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
      "_id": "6651c8…",
      "texto": "¡Qué buena foto! 📸",
      "createdAt": "2026-10-27T19:10:34.000Z",
      "autorId": {
        "_id": "6650a1f0c2a3b4c5d6e7f8a9",
        "nombre_completo": { "nombre": "Ana", "apellido": "López" },
        "imagen_perfil": { "secure_url": "https://res.cloudinary.com/…", "public_id": "…" },
        "url": "ana-lopez-3f9a1"
      }
    }
  ],
  "pagination": {
    "page": 1, "limit": 10, "total": 12, "totalPages": 2, "orden": "asc",
    "next": "/api/comentarios/6650d4a1f0c2a3b4c5d6e7f8/comentarios/?page=2&limite=10&orden=asc&cursor=6651c8…",
    "prev": null
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:317-322` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:270-279` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del posteo no es válido" / "El orden debe ser \"asc\" o \"desc\"" / "El cursor no es válido" / "La página debe ser numérica" / "El límite debe ser numérico" | `routes/comentarios.js:32-37` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener comentarios" | `controllers/comentarios.js:186` |

### Notas para el Frontend
- Default `limite` **10** en esta ruta (en posteos y favoritos es 15; en notificaciones, 20). No asumas un valor.
- `limite` se limita a 100 en silencio (sin error).
- `next` incluye una barra final antes del `?` (`/comentarios/?page=…`): Express la acepta; no la quites si concatenas.
- `autorId` puede ser `null` si el usuario autor ya no existe.
- **Paginación por cursor**: sigue siempre `pagination.next` tal cual (lleva `orden`, `cursor` y `limite`); es `null` cuando no hay más. Con cursor, altas o bajas durante la lectura no duplican ni saltan comentarios. `prev` es `null` al paginar por cursor (solo se avanza).
- Pide `orden=asc` en la primera llamada para mostrar la conversación en orden cronológico; el comentario recién creado va al final de la lista. El default `desc` se mantiene por compatibilidad y pasará a `asc` cuando el frontend lo adopte.
- `pagination.orden` devuelve el orden aplicado.

---

## [GET] /api/comentarios/:posteoId/comentarios/count

**Descripción:** Número de comentarios de un posteo, leído del contador `comentariosCount` (no cuenta documentos).
**Archivo de ruta:** `routes/comentarios.js:42`
**Controlador:** `controllers/comentarios.js` — `obtenerCountComentarios` (línea 190)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `comentariosUsuarioLimiter` → `check('posteoId').isMongoId()` → `validarCampos` → `validarIdPosteo` → `obtenerCountComentarios`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / **3000** por IP (env `FLOOD_LECTURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `comentariosUsuarioLimiter`, 15 min / 300, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | ObjectId | Sí | `isMongoId()`; `"El ID del posteo no es válido"` → 422 |

### Ejemplo de request
```http
GET /api/comentarios/6650d4a1f0c2a3b4c5d6e7f8/comentarios/count
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "data": { "count": 3 } }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:317-322` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:270-279` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del posteo no es válido" | `routes/comentarios.js:45` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 404 | `NOT_FOUND` | Resource Not Found | "El posteo no existe" (defensivo) | `controllers/comentarios.js:201` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener contador" | `controllers/comentarios.js:209` |

### Notas para el Frontend
- El valor viene del contador denormalizado: puede diferir del número real si una operación previa falló a medias (derivado del código).

---

## [DELETE] /api/comentarios/:comentarioId

**Descripción:** Elimina lógicamente un comentario (`isDeleted: true`, `deleteReason: "manual"`) y decrementa el contador del posteo. Puede hacerlo el autor del comentario o el dueño del posteo.
**Archivo de ruta:** `routes/comentarios.js:50`
**Controlador:** `controllers/comentarios.js` — `eliminarComentario` (línea 213)

### Autenticación y permisos
- Requiere token: **Sí**. Autor del comentario **o** dueño del posteo.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `comentarioUsuarioLimiter` → `check('comentarioId').isMongoId()` → `validarCampos` → `eliminarComentario`.
- **No** aplica `validarIdPosteo`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `comentarioUsuarioLimiter`, 1 min / 10, código `COMENTARIO_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `comentarioId` | ObjectId | Sí | `isMongoId()`; `"El ID del comentario no es válido"` → 422 |

### Ejemplo de request
```http
DELETE /api/comentarios/6651c8f0c2a3b4c5d6e7f8a9
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Comentario eliminado" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `COMENTARIO_BLOCKED` | Rate Limit Exceeded | "Demasiados comentarios, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:357-362` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del comentario no es válido" | `routes/comentarios.js:47` |
| 400 | `BAD_REQUEST` | Bad Request | "El comentario ya fue eliminado" (carrera o eliminado previamente) | `controllers/comentarios.js:229,271` |
| 404 | `NOT_FOUND` | Resource Not Found | "El comentario no existe" | `controllers/comentarios.js:230` |
| 404 | `NOT_FOUND` | Resource Not Found | "El posteo asociado no existe" | `controllers/comentarios.js:238` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes permisos para eliminar este comentario" | `controllers/comentarios.js:246` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al eliminar comentario" | `controllers/comentarios.js:278` |

### Notas para el Frontend
- 400 "ya fue eliminado" y 404 "no existe" son casos distintos. Si recibes 400, trátalo como éxito.
- No devuelve el comentario ni el contador actualizado.

---

## [PUT] /api/comentarios/:posteoId/comentarios/toggle

**Descripción:** Activa o desactiva los comentarios de un posteo. Solo el dueño del posteo puede hacerlo.
**Archivo de ruta:** `routes/comentarios.js:57`
**Controlador:** `controllers/comentarios.js` — `toggleComentariosPosteo` (línea 282)

### Autenticación y permisos
- Requiere token: **Sí**. Solo el **dueño del posteo**.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `comentarioUsuarioLimiter` → `check('posteoId')` → `check('activar').isBoolean({strict: true})` → `validarCampos` → `validarIdPosteo` → `toggleComentariosPosteo`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `comentarioUsuarioLimiter`, 1 min / 10, código `COMENTARIO_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | ObjectId | Sí | `isMongoId()`; `"El ID del posteo no es válido"` → 422 |
| body | `activar` | boolean | Sí | `isBoolean({strict: true})`; `"El campo activar debe ser un booleano"`. Solo acepta un booleano JSON real (`true`/`false`); strings y números se rechazan con 422 (verificado en ejecución 2026-11-10) |

### Ejemplo de request
```http
PUT /api/comentarios/6650d4a1f0c2a3b4c5d6e7f8/comentarios/toggle
Content-Type: application/json
Cookie: accessToken=…

{ "activar": false }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Comentarios desactivados", "data": { "comentariosActivos": false } }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `COMENTARIO_BLOCKED` | Rate Limit Exceeded | "Demasiados comentarios, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:357-362` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del posteo no es válido" / "El campo activar debe ser un booleano" | `routes/comentarios.js:60-61` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 403 | `FORBIDDEN` | Forbidden | "Solo el dueño del posteo puede modificar los comentarios" | `controllers/comentarios.js:297` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al modificar comentarios" | `controllers/comentarios.js:308` |

### Notas para el Frontend
- **Envía siempre un booleano JSON real (`true`/`false`).** El toggle usa `isBoolean({strict: true})` (`routes/comentarios.js:61`): cualquier string o número (`"true"`, `"false"`, `"1"`, `0`) se rechaza con 422 `VALIDATION_FAILED` antes de llegar al controlador — nunca envía la petición con un valor "truthy/falsy" parecido. *(Nota histórica: el hallazgo "toggle con strings" del README fue cerrado el 2026-11-10; la advertencia anterior de que `strict` era ignorado ya no aplica con `express-validator` 7.3.2 + `validator` 13.15.35.)*
- El frontend debe mandar booleanos y verificar `data.comentariosActivos` en la respuesta.

---

## Hallazgos de este dominio (resumen)

- **Toggle de comentarios con strings**: ~~inconsistencia entre validador y controlador~~ **resuelto** — `routes/comentarios.js:61` usa `isBoolean({strict: true})`; los strings/números ya se rechazan con 422 antes del controlador (verificado en ejecución 2026-11-10).
- **Respuesta 201 + error posterior** en el alta de comentarios (ver notas de `POST`).
