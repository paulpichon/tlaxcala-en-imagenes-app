# Likes (`/api/likes`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:127`. Modelo: `models/Like.js` (índice único `{_idUsuario, posteoId}`).

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [POST] /api/likes/:id/like

**Descripción:** Alterna el like del usuario autenticado sobre un posteo: si ya existe lo elimina (borrado físico), si no existe lo crea. Responde con el mensaje correspondiente. **Solo al crear** el like (y tras responder) notifica al autor de forma agrupada: una `Notificacion` in-app `like` por posteo, con push limitado a uno cada 10 min por posteo y sin correo.
**Archivo de ruta:** `routes/likes.js:12`
**Controlador:** `controllers/likes.js` — `likeDislikePosteo` (línea 53); `notificarLike` (línea 15)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`).
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `socialUsuarioLimiter` → `check('id').isMongoId()` → `validarCampos` → `validarIdPosteo` (`helpers/validar-id-posteo.js:14`) → `likeDislikePosteo`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `socialUsuarioLimiter`, 15 min / 300, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID no es valido"` → 422 |

### Ejemplo de request
```http
POST /api/likes/6650d4a1f0c2a3b4c5d6e7f8/like
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Like añadido" }
```
o, si ya existía:
```json
{ "success": true, "msg": "Like eliminado" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:333-338` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/likes.js:18` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> no existe` / `ha sido eliminado` / oculto para no-autores | `helpers/validar-id-posteo.js:19,23,30` |
| 404 | `NOT_FOUND` | Resource Not Found | "Publicación no encontrada" (defensivo; `validarIdPosteo` lo cubre antes) | `controllers/likes.js:64` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al procesar el like" (incluye carrera: dos likes simultáneos → `E11000` capturado como 500) | `controllers/likes.js:85` |

### Notas para el Frontend
- Es un **toggle**: no hay endpoint de "quitar like" separado. Si el frontend pierde sincronía, puede invertir el estado: refresca `hasLiked`/`likesCount` tras la respuesta.
- La respuesta no trae el nuevo conteo: pide `GET /api/likes/posteo/:id` o recalcula localmente.
- **Sí notifica al autor (2026-11-25):** al crear el like, después de responder, se crea/actualiza una `Notificacion` in-app `like` **agrupada** por posteo (`controllers/likes.js:15-47,79-81`):
  - `contador` = personas distintas que dieron like; `emisor` = la última; `mensaje` = "le dio me gusta a tu publicación" o "y N−1 más dieron me gusta a tu publicación" (`helpers/notificar.js:104-145`).
  - Push con `tag: like-<posteoId>` y, como mucho, uno por posteo cada `NOTIF_LIKE_PUSH_COOLDOWN_MIN` (default 10 min). **Sin correo.**
  - Silenciable con `push.like`. El like propio no notifica (`controllers/likes.js:18`).
  - **Quitar el like no modifica ni borra la notificación**: el contador no baja (`controllers/likes.js:66-71`).
- **Nota de agregación:** like → unlike → like de la misma persona **no** cuenta dos veces (`emisores` deduplica; `helpers/notificar.js:108,118-120`).
- Un posteo ocultado por moderación devuelve 404 a quien no es el autor.

---

## [GET] /api/likes/posteo/:id

**Descripción:** Número de likes activos de un posteo.
**Archivo de ruta:** `routes/likes.js:24`
**Controlador:** `controllers/likes.js` — `getLikesPosteos` (línea 89)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `socialUsuarioLimiter` → `check('id').isMongoId()` → `validarCampos` → `validarIdPosteo` → `getLikesPosteos`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / **3000** por IP (env `FLOOD_LECTURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `socialUsuarioLimiter`, 15 min / 300, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID no es valido"` → 422 |

### Ejemplo de request
```http
GET /api/likes/posteo/6650d4a1f0c2a3b4c5d6e7f8
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "data": { "likes": 4, "posteo": "6650d4a1f0c2a3b4c5d6e7f8" } }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:333-338` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:270-279` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/likes.js:30` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener el número de likes" | `controllers/likes.js:98` |

### Notas para el Frontend
- No indica si **tú** diste like. Para eso usa `hasLiked` del detalle del posteo.

---

## [GET] /api/likes/:id/likes/usuarios

**Descripción:** Lista de usuarios que dieron like a un posteo, con nombre, avatar y url del perfil.
**Archivo de ruta:** `routes/likes.js:37`
**Controlador:** `controllers/likes.js` — `getLikesUsuariosPosteos` (línea 102)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `socialUsuarioLimiter` → `check('id').isMongoId()` → `validarCampos` → `validarIdPosteo` → `getLikesUsuariosPosteos`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / **3000** por IP (env `FLOOD_LECTURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `socialUsuarioLimiter`, 15 min / 300, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID no es valido"` → 422 |

### Ejemplo de request
```http
GET /api/likes/6650d4a1f0c2a3b4c5d6e7f8/likes/usuarios
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Likes de usuarios a posteo obtenidos correctamente",
  "data": {
    "likes_usuarios_posteo": [
      {
        "_id": "6650e5…",
        "_idUsuario": {
          "_id": "6650b2…",
          "nombre_completo": { "nombre": "Luis", "apellido": "Pérez" },
          "imagen_perfil": { "secure_url": "https://res.cloudinary.com/…", "public_id": "…" },
          "url": "luis-perez-9d4e0"
        }
      }
    ]
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:333-338` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:270-279` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/likes.js:43` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener los likes de usuarios" | `controllers/likes.js:117` |

### Notas para el Frontend
- **No está paginada.** Un posteo muy popular devuelve la lista completa.
- Expone nombre, avatar (incluye `secure_url`) y url de quien dio like a cualquier usuario autenticado. Es el comportamiento actual de producto (**[REQUIERE VERIFICACIÓN MANUAL]** si aplica una restricción).
- `_idUsuario` puede venir `null` si el usuario fue borrado físicamente (populate sin coincidencia) (derivado del código; no verificado con datos).
