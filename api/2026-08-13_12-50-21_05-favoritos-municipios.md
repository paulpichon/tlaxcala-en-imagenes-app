# 5. Favoritos y Municipios

> Contexto global (formato de errores RFC 9457, rate limiting, auth por cookies, middlewares globales): ver [`README.md`](./README.md).

## GET /api/favoritos

**Descripción:** Obtiene los favoritos del usuario autenticado, paginados, con datos del posteo y autor.
**Archivo de ruta:** `routes/favoritos.js:13`
**Controlador:** `controllers/favoritos.js` — `obtenerFavoritosUsuario` (línea 10)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('page', ...).optional().isNumeric()`
3. `check('limite', ...).optional().isNumeric()`
4. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta | Default |
|---|---|---|---|---|---|
| query | `page` | number | No | `isNumeric()` | 1 |
| query | `limite` | number | No | `isNumeric()` | 15 |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": [
    { "_id": "...", "createdAt": "2026-08-13T12:00:00.000Z", "posteoId": { "_id": "...", "public_id": "...", "posteo_publico": true }, "autorId": { "_id": "...", "nombre_completo": {...}, "url": "..." } }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 8, "totalPages": 1, "next": null, "prev": null }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente | `verificarTokenSesion` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El parametro PAGE/LIMITE debe ser de tipo numerico` | express-validator |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un problema al realizar la peticion...` | `controllers/favoritos.js:84` |

### Notas para el Frontend
- Se excluyen favoritos cuyo posteo fue eliminado o no existe (`$match { 'posteo.0': { $exists: true } }`).

---

## POST /api/favoritos/:posteoId

**Descripción:** Agrega un posteo a favoritos (upsert). Requiere `autorId` en el body.
**Archivo de ruta:** `routes/favoritos.js:24`
**Controlador:** `controllers/favoritos.js` — `agregarPosteoFavorito` (línea 88)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('posteoId', 'El posteoId debe ser valido').isMongoId()`
3. `check('autorId', 'El autorId es obligatorio').isMongoId()`
4. `validarCampos`
5. `validarIdPosteo`
6. `validarIdUsuario`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | string (MongoId) | Sí | `isMongoId()` |
| body | `autorId` | string (MongoId) | Sí | `isMongoId()` |

### Ejemplo de request
```json
{ "autorId": "664a1b2c3d4e5f6a7b8c9d0e" }
```

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{ "success": true, "msg": "Agregado en Favoritos" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente | `verificarTokenSesion` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El posteoId debe ser valido` / `El autorId es obligatorio` | express-validator |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: xxx no existe` | `helpers/validar-id-posteo.js` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID xxx no existe en la BD` | `helpers/validar-id-usuario.js` |
| 400 | `BAD_REQUEST` | Bad Request | `No puedes agregar a favoritos tus propios posteos` | `controllers/favoritos.js:103` |
| 409 | `CONFLICT` | Conflict | `Este posteo ya está en tus favoritos` | `controllers/favoritos.js:120` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un problema al realizar la peticion...` | `controllers/favoritos.js:126` |

### Notas para el Frontend
- `autorId` es el ID del **autor del posteo** (usuario existente y distinto al autenticado).
- Usa `updateOne` con `$setOnInsert` + `upsert`; si ya existía → `409`.

---

## DELETE /api/favoritos/:posteoId

**Descripción:** Elimina un posteo de favoritos.
**Archivo de ruta:** `routes/favoritos.js:38`
**Controlador:** `controllers/favoritos.js` — `eliminarPosteoFavorito` (línea 131)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('posteoId', 'El posteoId debe ser valido').isMongoId()`
3. `validarCampos`
4. `validarIdPosteo`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | string (MongoId) | Sí | `isMongoId()` |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{ "success": true, "msg": "Eliminado de Favoritos" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente | `verificarTokenSesion` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El posteoId debe ser valido` | express-validator |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: xxx no existe` | `helpers/validar-id-posteo.js` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con id xxx no existe en favoritos` | `controllers/favoritos.js:141` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un problema al realizar la peticion...` | `controllers/favoritos.js:146` |

---

## GET /api/municipios

**Descripción:** Obtiene la lista de municipios de Tlaxcala (sin el campo `geometry`), ordenados por `nombreMunicipio`.
**Archivo de ruta:** `routes/municipios.js:7`
**Controlador:** `controllers/municipios.js` — `obtenerMunicipios` (línea 7)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion`

### Parámetros de entrada
Ninguno.

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Municipios obtenidos correctamente",
  "data": {
    "municipios": [
      { "_id": "...", "claveEntidad": 29, "nombreEntidad": "Tlaxcala", "claveMunicipio": 1, "nombreMunicipio": "Apizaco", "codigoPostal": "90300" }
    ]
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente | `verificarTokenSesion` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener los municipios` | `controllers/municipios.js:21` |

### Notas para el Frontend
- El mismo controlador `obtenerMunicipios` se usa también en `GET /api/ubicacion` (ver archivo de ubicación).
