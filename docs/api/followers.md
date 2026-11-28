# Seguidores (`/api/followers`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:128`. Modelo: `models/Follow.js` (índice único `{follower, following}`). Los seguimientos no son recíprocos.

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [POST] /api/followers/follow/:id

**Descripción:** El usuario autenticado sigue al usuario `:id`. Crea el `Follow` y responde. **Después de responder** (best-effort) crea la `Notificacion` in-app de tipo `follow` (deduplicada), envía Web Push y correo con cooldown.
**Archivo de ruta:** `routes/followers.js:15`
**Controlador:** `controllers/followers.js` — `followUsuario` (línea 10)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `socialUsuarioLimiter` → `check('id').isMongoId()` → `validarCampos` → `validarIdUsuario` (`helpers/validar-id-usuario.js:4`) → `followUsuario`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `socialUsuarioLimiter` (`:333-338`), 15 min / 300 por usuario, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID no es valido"` → 422 |

### Ejemplo de request
```http
POST /api/followers/follow/6650b2f0c2a3b4c5d6e7f8a9
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Has comenzado a seguir a este usuario" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:333-338` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/followers.js:18` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID <id> no existe en la BD` (inexistente o `estatus: 4`) | `helpers/validar-id-usuario.js:10` |
| 404 | `NOT_FOUND` | Resource Not Found | `El usuario con ID <id> no está activo` (`estatus: 0` sin verificar) | `helpers/validar-id-usuario.js:14` |
| 400 | `BAD_REQUEST` | Bad Request | "No puedes seguirte a ti mismo" | `controllers/followers.js:20` |
| 400 | `BAD_REQUEST` | Bad Request | "Ya sigues a este usuario" | `controllers/followers.js:37` |
| 404 | `NOT_FOUND` | Resource Not Found | "El usuario que intentas seguir no existe" (defensivo) | `controllers/followers.js:41` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al seguir a un usuario" (incluye carrera: dos follows simultáneos → `E11000`) | `controllers/followers.js:79` |

### Notas para el Frontend
- "Ya sigues" es **400** `BAD_REQUEST` (no 409). Usa `isFollowing` del perfil para evitar la llamada.
- La respuesta llega antes de la notificación. No esperes el push ni el correo.
- **Notificación (2026-11-25):** tras responder se llama a `notificar(...)` (`controllers/followers.js:54-75`):
  - `Notificacion` in-app `tipo: "follow"`, `mensaje: "comenzó a seguirte"`, con `deduplicar: true` (seguir → dejar de seguir → seguir **no** repite aviso ni correo, `controllers/followers.js:52-59`).
  - Push si el destinatario tiene `push.follow` activo y dispositivos (`helpers/notificar.js:228-243`); `tag: follow-<idSeguidor>`.
  - Correo con **cooldown de 15 min por usuario y tipo** (`NOTIF_CORREO_COOLDOWN_MIN`, `helpers/notificar.js:19-45`), silenciable con `correo.follow`.
  - Todo es best-effort: `notificar()` nunca lanza y no afecta a la respuesta.

---

## [DELETE] /api/followers/unfollow/:id

**Descripción:** Deja de seguir al usuario `:id` (borrado físico del `Follow`).
**Archivo de ruta:** `routes/followers.js:25`
**Controlador:** `controllers/followers.js` — `unfollowUsuario` (línea 113)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `socialUsuarioLimiter` → `check('id').isMongoId()` → `validarCampos` → `validarIdUsuario` → `unfollowUsuario`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `socialUsuarioLimiter`, 15 min / 300, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID no es valido"` → 422 |

### Ejemplo de request
```http
DELETE /api/followers/unfollow/6650b2f0c2a3b4c5d6e7f8a9
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Dejaste de seguir a este usuario" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:333-338` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/followers.js:29` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID <id> no existe en la BD` / `no está activo` | `helpers/validar-id-usuario.js:10,14` |
| 400 | `BAD_REQUEST` | Bad Request | "No sigues a este usuario" | `controllers/followers.js:128` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al dejar de seguir a un usuario" | `controllers/followers.js:133` |

### Notas para el Frontend
- "No sigues" es 400, no 404.

---

## [GET] /api/followers/usuario/lista-followers/:id

**Descripción:** Seguidores activos del perfil `:id`, con `isFollowing` respecto al usuario autenticado (para mostrar el botón seguir/dejar de seguir en cada fila).
**Archivo de ruta:** `routes/followers.js:35`
**Controlador:** `controllers/followers.js` — `obtenerFollowers` (línea 138)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `socialUsuarioLimiter` → `check('id').isMongoId()` → `validarCampos` → `validarIdUsuario` → `obtenerFollowers`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / **3000** por IP (env `FLOOD_LECTURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `socialUsuarioLimiter`, 15 min / 300, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID no es valido"` → 422 |

### Ejemplo de request
```http
GET /api/followers/usuario/lista-followers/6650a1f0c2a3b4c5d6e7f8a9
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Seguidores obtenidos correctamente",
  "data": {
    "totalSeguidores": 1,
    "seguidores": [
      {
        "_id": "6650f6…",
        "follower": {
          "_id": "6650b2f0c2a3b4c5d6e7f8a9",
          "nombre_completo": { "nombre": "Luis", "apellido": "Pérez" },
          "imagen_perfil": { "secure_url": "https://res.cloudinary.com/…", "public_id": "…" },
          "url": "luis-perez-9d4e0"
        },
        "isFollowing": false
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
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/followers.js:39` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID <id> no existe en la BD` / `no está activo` | `helpers/validar-id-usuario.js:10,14` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener seguidores" | `controllers/followers.js:174` |

### Notas para el Frontend
- `totalSeguidores` es el conteo de la lista completa (no paginada).
- Esta lista **no** está paginada.
- Usa `follower._id` para navegar al perfil; el campo `_id` de la fila es el id del `Follow`, no del usuario.
- `follower` puede ser `null` si el usuario se borró físicamente (derivado; el código no lo filtra y podría fallar con 500).

---

## [GET] /api/followers/usuario/lista-followings/:id

**Descripción:** Usuarios que sigue el perfil `:id`, con `isFollowing` respecto al usuario autenticado.
**Archivo de ruta:** `routes/followers.js:45`
**Controlador:** `controllers/followers.js` — `obtenerFollowings` (línea 178)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `socialUsuarioLimiter` → `check('id').isMongoId()` → `validarCampos` → `validarIdUsuario` → `obtenerFollowings`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / **3000** por IP (env `FLOOD_LECTURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `socialUsuarioLimiter`, 15 min / 300, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID no es valido"` → 422 |

### Ejemplo de request
```http
GET /api/followers/usuario/lista-followings/6650a1f0c2a3b4c5d6e7f8a9
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Usuarios seguidos, obtenidos correctamente",
  "data": {
    "totalSeguidos": 1,
    "siguiendo": [
      {
        "_id": "6650f6…",
        "following": {
          "_id": "6650b2f0c2a3b4c5d6e7f8a9",
          "nombre_completo": { "nombre": "Luis", "apellido": "Pérez" },
          "imagen_perfil": { "secure_url": "https://res.cloudinary.com/…", "public_id": "…" },
          "url": "luis-perez-9d4e0"
        },
        "isFollowing": true
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
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/followers.js:49` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID <id> no existe en la BD` / `no está activo` | `helpers/validar-id-usuario.js:10,14` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error en obtener followings" | `controllers/followers.js:252` |

### Notas para el Frontend
- Lista no paginada. Cada elemento es `{ _id (del Follow), following: {…}, isFollowing }`.
- ⚠ El `$sort` por `createdAt` se aplica **después** de un `$project` que elimina ese campo: el orden no es el esperado (derivado del código; orden no garantizado).
