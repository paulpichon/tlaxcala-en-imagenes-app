# Favoritos (`/api/favoritos`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:129`. Modelo: `models/Favorito.js` (índice único parcial `{usuarioId, posteoId}` con `isDeleted: false`).

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [GET] /api/favoritos

**Descripción:** Lista paginada de los posteos guardados por el usuario autenticado, ordenados por fecha de guardado (más reciente primero). Excluye favoritos cuyo posteo esté eliminado, oculto por moderación o reportado por el usuario.
**Archivo de ruta:** `routes/favoritos.js:13`
**Controlador:** `controllers/favoritos.js` — `obtenerFavoritosUsuario` (línea 11)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `check('page'|'limite'|'limit').optional().isNumeric()` → `validarCampos` → `obtenerFavoritosUsuario`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | `page` | number | No (default 1) | `optional().isNumeric()`; `"El parametro PAGE debe ser de tipo numerico"` → 422 |
| query | `limite` | number | No (default 15) | `optional().isNumeric()`; `"El parametro LIMITE debe ser de tipo numerico"` → 422. Sin máximo. Mínimo 1 (clamp) |
| query | `limit` | number | No | Alias; `"El parametro LIMIT debe ser de tipo numerico"` |

### Ejemplo de request
```http
GET /api/favoritos?page=1&limite=15
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
      "_id": "6650g7…",
      "createdAt": "2026-10-25T12:00:00.000Z",
      "posteoId": { "_id": "6650d4…", "public_id": "…", "visibilidad": "publico" },
      "autorId": { "_id": "6650a1…", "nombre_completo": { "nombre": "Ana", "apellido": "López" }, "url": "ana-lopez-3f9a1" }
    }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 1, "totalPages": 1, "next": null, "prev": null }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El parametro PAGE / LIMITE / LIMIT debe ser de tipo numerico" | `routes/favoritos.js:17-19` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al realizar la peticion, favor de contactar a soporte." | `controllers/favoritos.js:97` |

### Notas para el Frontend
- ⚠ **Nombre engañoso:** `posteoId` en cada elemento es un **objeto** `{_id, public_id, visibilidad}`, no un string. El id del posteo es `posteoId._id`.
- `visibilidad` permite ocultar "compartir" en favoritos `perfil`.
- Un favorito puede desaparecer de la lista si el posteo se oculta o elimina; no es un error.
- `autorId` es un objeto, no un id.

---

## [POST] /api/favoritos/:posteoId

**Descripción:** Guarda un posteo en favoritos del usuario autenticado. Usa un upsert con `$setOnInsert`: si ya existe no crea otro documento y responde 409 `CONFLICT`.
**Archivo de ruta:** `routes/favoritos.js:25`
**Controlador:** `controllers/favoritos.js` — `agregarPosteoFavorito` (línea 101)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `check('posteoId').isMongoId()` → `check('autorId').isMongoId()` → `validarCampos` → `validarIdPosteo` → `validarIdUsuario` (lee `req.body.autorId`) → `agregarPosteoFavorito`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | ObjectId | Sí | `isMongoId()`; `"El posteoId debe ser válido"` → 422 |
| body | `autorId` | ObjectId | Sí | `isMongoId()`; `"El autorId es obligatorio"` → 422. **Lo envía el cliente; no se compara con el autor real del posteo** |

### Ejemplo de request
```http
POST /api/favoritos/6650d4a1f0c2a3b4c5d6e7f8
Content-Type: application/json
Cookie: accessToken=…

{ "autorId": "6650a1f0c2a3b4c5d6e7f8a9" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200` (no `201`)
```json
{ "success": true, "msg": "Agregado en Favoritos" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El posteoId debe ser válido" / "El autorId es obligatorio" | `routes/favoritos.js:29,31` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID <autorId> no existe en la BD` / `no está activo` | `helpers/validar-id-usuario.js:10,14` |
| 400 | `BAD_REQUEST` | Bad Request | "No puedes agregar a favoritos tus propios posteos" (solo si el `autorId` enviado es el propio usuario) | `controllers/favoritos.js:116` |
| 409 | `CONFLICT` | Conflict | "Este posteo ya está en tus favoritos" | `controllers/favoritos.js:133` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al realizar la peticion, favor de contactar a soporte." | `controllers/favoritos.js:139` |

### Notas para el Frontend
- **Envía el `autorId` real del posteo** (`_idUsuario._id` del detalle). El backend **no lo verifica**: un cliente puede mandar otro id de usuario existente, y ese valor se guarda en el favorito.
- La validación de "propio posteo" depende de ese `autorId` enviado, no del autor real: un autor puede guardar su propio posteo si manda otro `autorId`.
- Respuesta `200`, no `201`.
- Duplicado: 409 con mensaje; no es un error de red: marca el corazón como activo.

---

## [DELETE] /api/favoritos/:posteoId

**Descripción:** Quita un posteo de los favoritos del usuario autenticado (borrado físico del documento).
**Archivo de ruta:** `routes/favoritos.js:39`
**Controlador:** `controllers/favoritos.js` — `eliminarPosteoFavorito` (línea 144)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `check('posteoId').isMongoId()` → `validarCampos` → `validarIdPosteo` → `eliminarPosteoFavorito`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | ObjectId | Sí | `isMongoId()`; `"El posteoId debe ser valido"` → 422 |

### Ejemplo de request
```http
DELETE /api/favoritos/6650d4a1f0c2a3b4c5d6e7f8
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Eliminado de Favoritos" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El posteoId debe ser valido" | `routes/favoritos.js:43` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con id <id> no existe en favoritos` | `controllers/favoritos.js:154` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al realizar la peticion, favor de contactar a soporte." | `controllers/favoritos.js:159` |

### Notas para el Frontend
- Si el posteo quedó oculto por moderación o eliminado, `validarIdPosteo` responde 404 antes de llegar al controlador, y **no podrás quitarlo de favoritos** desde la app (derivado del código; no verificado).
- Un 404 con "no existe en favoritos" significa que ya no estaba: trátalo como éxito.
