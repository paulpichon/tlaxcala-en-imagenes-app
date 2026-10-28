# Likes (`/api/likes`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:127`. Modelo: `models/Like.js` (índice único `{_idUsuario, posteoId}`).

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [POST] /api/likes/:id/like

**Descripción:** Alterna el like del usuario autenticado sobre un posteo: si ya existe lo elimina (borrado físico), si no existe lo crea. Responde con el mensaje correspondiente.
**Archivo de ruta:** `routes/likes.js:11`
**Controlador:** `controllers/likes.js` — `likeDislikePosteo` (línea 12)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`).
- Cadena de middlewares: `verificarTokenSesion` → `check('id').isMongoId()` → `validarCampos` → `validarIdPosteo` (`helpers/validar-id-posteo.js:14`) → `likeDislikePosteo`.
- Rate limiter: **ninguno**.

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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/likes.js:15` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> no existe` / `ha sido eliminado` / oculto para no-autores | `helpers/validar-id-posteo.js:19,23,30` |
| 404 | `NOT_FOUND` | Resource Not Found | "Publicación no encontrada" (defensivo; `validarIdPosteo` lo cubre antes) | `controllers/likes.js:23` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al procesar el like" (incluye carrera: dos likes simultáneos → `E11000` capturado como 500) | `controllers/likes.js:43` |

### Notas para el Frontend
- Es un **toggle**: no hay endpoint de "quitar like" separado. Si el frontend pierde sincronía, puede invertir el estado: refresca `hasLiked`/`likesCount` tras la respuesta.
- La respuesta no trae el nuevo conteo: pide `GET /api/likes/posteo/:id` o recalcula localmente.
- No notifica al autor (no se crea `Notificacion` en este controlador).
- Un posteo ocultado por moderación devuelve 404 a quien no es el autor.

---

## [GET] /api/likes/posteo/:id

**Descripción:** Número de likes activos de un posteo.
**Archivo de ruta:** `routes/likes.js:21`
**Controlador:** `controllers/likes.js` — `getLikesPosteos` (línea 47)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `check('id').isMongoId()` → `validarCampos` → `validarIdPosteo` → `getLikesPosteos`.
- Rate limiter: **ninguno**.

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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/likes.js:25` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener el número de likes" | `controllers/likes.js:55` |

### Notas para el Frontend
- No indica si **tú** diste like. Para eso usa `hasLiked` del detalle del posteo.

---

## [GET] /api/likes/:id/likes/usuarios

**Descripción:** Lista de usuarios que dieron like a un posteo, con nombre, avatar y url del perfil.
**Archivo de ruta:** `routes/likes.js:32`
**Controlador:** `controllers/likes.js` — `getLikesUsuariosPosteos` (línea 60)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `check('id').isMongoId()` → `validarCampos` → `validarIdPosteo` → `getLikesUsuariosPosteos`.
- Rate limiter: **ninguno**.

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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/likes.js:36` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener los likes de usuarios" | `controllers/likes.js:75` |

### Notas para el Frontend
- **No está paginada.** Un posteo muy popular devuelve la lista completa.
- Expone nombre, avatar (incluye `secure_url`) y url de quien dio like a cualquier usuario autenticado. Es el comportamiento actual de producto (**[REQUIERE VERIFICACIÓN MANUAL]** si aplica una restricción).
- `_idUsuario` puede venir `null` si el usuario fue borrado físicamente (populate sin coincidencia) (derivado del código; no verificado con datos).
