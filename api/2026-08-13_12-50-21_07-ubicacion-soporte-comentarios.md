# 7. Ubicación, Soporte y Comentarios

> Contexto global (formato de errores RFC 9457, rate limiting, auth por cookies, middlewares globales): ver [`README.md`](./README.md).

## POST /api/ubicacion/reverse

**Descripción:** Reverse geocoding: obtiene el municipio a partir de coordenadas GPS (intersección exacta, con fallback por cercanía a 100 m).
**Archivo de ruta:** `routes/ubicacion.js:10`
**Controlador:** `controllers/ubicacion.js` — `obtenerMunicipioPorCoords` (línea 6)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('lat', 'La latitud es obligatoria y debe ser un número').isFloat().notEmpty()`
3. `check('lng', 'La longitud es obligatoria y debe ser un número').isFloat().notEmpty()`
4. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `lat` | number | Sí | `isFloat().notEmpty()` |
| body | `lng` | number | Sí | `isFloat().notEmpty()` |

### Ejemplo de request
```json
{ "lat": 19.4153, "lng": -98.1421 }
```

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": {
    "municipio": { "_id": "...", "claveEntidad": 29, "nombreEntidad": "Tlaxcala", "claveMunicipio": 1, "nombreMunicipio": "Apizaco", "codigoPostal": "90300" },
    "metodo": "database_geo_intersect",
    "precision": "exacta"
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente | `verificarTokenSesion` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `La latitud/longitud es obligatoria y debe ser un número` | express-validator |
| 404 | `NOT_FOUND` | Resource Not Found | `Ubicación fuera de la zona de cobertura (Tlaxcala)` | `controllers/ubicacion.js:49` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error interno al obtener la ubicación` | `controllers/ubicacion.js:62` |

### Notas para el Frontend
- `metodo` puede ser `database_geo_intersect` (exacto) o `database_geo_near_fallback` (radio 100 m); `precision` refleja `"exacta"` o `"aproximada (radio 100m)"`.

---

## GET /api/ubicacion

**Descripción:** Obtiene la lista de municipios (mismo comportamiento que `GET /api/municipios`).
**Archivo de ruta:** `routes/ubicacion.js:20`
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
- Es un alias del listado de municipios. Mismo controlador y misma respuesta que `GET /api/municipios`.

---

## POST /api/ayuda-soporte/envio-correo

**Descripción:** Envía un ticket de ayuda/soporte por correo. Genera un `ticketId` y envía confirmación al usuario.
**Archivo de ruta:** `routes/soporte.js:9`
**Controlador:** `controllers/soporte.js` — `ayudaSoporteEnvioCorrreo` (línea 23)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Rate limiting
- `soporteLimiter`: 5 req / 15 min → `SOPORTE_BLOCKED`

### Middlewares (en orden)
1. `soporteLimiter`
2. `verificarTokenSesion`
3. `check('tipo_problema', ...).notEmpty().isIn(['cuenta','publicacion','seguridad','reporte','otro'])`
4. `check('descripcion_problema_usuario', ...).notEmpty().isString().trim().isLength({ min: 15, max: 1000 })`
5. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `tipo_problema` | string | Sí | `notEmpty().isIn(['cuenta','publicacion','seguridad','reporte','otro'])` |
| body | `descripcion_problema_usuario` | string | Sí | `notEmpty().isString().trim().isLength({ min: 15, max: 1000 })` |

### Ejemplo de request
```json
{
  "tipo_problema": "reporte",
  "descripcion_problema_usuario": "Quiero reportar una publicación inapropiada que vi en el feed."
}
```

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Solicitud de soporte recibida correctamente",
  "data": { "ticketId": "TLX-1755086421000" }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente | `verificarTokenSesion` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El tipo_problema es obligatorio...` / `La descripcion_problema_usuario es obligatoria...` | express-validator |
| 400 | `BAD_REQUEST` | Bad Request | `Tipo de problema no válido` | `controllers/soporte.js:30` |
| 404 | `NOT_FOUND` | Resource Not Found | `Usuario no encontrado` | `controllers/soporte.js:36` |
| 429 | `SOPORTE_BLOCKED` | Rate Limit Exceeded | `Demasiados tickets de soporte...` | `middlewares/rate-limiter.js:116-128` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error en el servidor` | `controllers/soporte.js:66` |

### Notas para el Frontend
- `ticketId` tiene el formato `TLX-<timestamp>`.
- La respuesta se envía aunque el correo de confirmación al usuario falle (se hace `.catch()` no bloqueante).

---

## POST /api/comentarios/:posteoId/comentarios

**Descripción:** Crea un comentario en un posteo. Dispara notificación push y, si es el primer comentario, correo al autor del posteo.
**Archivo de ruta:** `routes/comentarios.js:16`
**Controlador:** `controllers/comentarios.js` — `agregarComentario` (línea 11)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Rate limiting
- `comentarioLimiter`: 10 req / 1 min → `COMENTARIO_BLOCKED`

### Middlewares (en orden)
1. `comentarioLimiter`
2. `verificarTokenSesion`
3. `check('posteoId', 'El ID del posteo no es válido').isMongoId()`
4. `check('texto', 'El texto es obligatorio').optional().notEmpty()`
5. `check('texto', 'El comentario no puede exceder 250 caracteres').isLength({ max: 250 })`
6. `validarCampos`
7. `validarIdPosteo`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | string (MongoId) | Sí | `isMongoId()` |
| body | `texto` | string | No (pero el comentario requiere texto) | `optional().notEmpty()`; máx 250 chars |

### Ejemplo de request
```json
{ "texto": "¡Qué bonita foto!" }
```

### Ejemplo de response — éxito
- Código de estado: `201`

```json
{ "success": true, "msg": "Comentario agregado", "data": { "comentario": { "_id": "...", "texto": "¡Qué bonita foto!", "posteoId": "...", "autorId": "..." } } }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente | `verificarTokenSesion` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID del posteo no es válido` / `El texto es obligatorio` / `El comentario no puede exceder 250 caracteres` | express-validator |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: xxx no existe` / `ha sido eliminado` | `helpers/validar-id-posteo.js` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo no existe` / `El posteo ha sido eliminado` | `controllers/comentarios.js:22,26` |
| 403 | `FORBIDDEN` | Forbidden | `Los comentarios están desactivados en este posteo` | `controllers/comentarios.js:30` |
| 429 | `COMENTARIO_BLOCKED` | Rate Limit Exceeded | `Demasiados comentarios...` | `middlewares/rate-limiter.js:146-158` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al agregar comentario` | `controllers/comentarios.js:115` |

### Notas para el Frontend
- **⚠️ A notar:** el segundo `check('texto').isLength({max:250})` **no** es opcional; un `texto` ausente/vacío puede disparar el validador de longitud además del de "obligatorio".
- **Efecto secundario:** incrementa `comentariosCount` del posteo; si no es el autor, envía push y (si es el primer comentario) correo al autor del posteo.

---

## GET /api/comentarios/:posteoId/comentarios

**Descripción:** Obtiene los comentarios de un posteo, paginados, ordenados por más recientes, con datos del autor.
**Archivo de ruta:** `routes/comentarios.js:25`
**Controlador:** `controllers/comentarios.js` — `obtenerComentarios` (línea 119)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('posteoId', 'El ID del posteo no es válido').isMongoId()`
3. `check('page', 'La página debe ser numérica').optional().isNumeric()`
4. `check('limite', 'El límite debe ser numérico').optional().isNumeric()`
5. `validarCampos`
6. `validarIdPosteo`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta | Default |
|---|---|---|---|---|---|
| params | `posteoId` | string (MongoId) | Sí | `isMongoId()` | — |
| query | `page` | number | No | `isNumeric()` | 1 |
| query | `limit` | number | No | (se parsea con `parseInt`, no `limite`) | 10 (máx 100) |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": [
    { "_id": "...", "texto": "...", "createdAt": "...", "autorId": { "_id": "...", "nombre_completo": {...}, "imagen_perfil": {...}, "url": "..." } }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 22, "totalPages": 3, "next": "/api/comentarios/<posteoId>/comentarios/?page=2&limit=10", "prev": null }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente | `verificarTokenSesion` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID del posteo no es válido` / page / limite | express-validator |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: xxx no existe` / `ha sido eliminado` | `helpers/validar-id-posteo.js` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener comentarios` | `controllers/comentarios.js:181` |

### Notas para el Frontend
- **Importante:** en la ruta el check se llama `limite`, pero el controlador lee `req.query.limit` (no `limite`). El parámetro real que el controlador consume es **`limit`** (default 10, máx 100).

---

## GET /api/comentarios/:posteoId/comentarios/count

**Descripción:** Obtiene el número de comentarios de un posteo.
**Archivo de ruta:** `routes/comentarios.js:34`
**Controlador:** `controllers/comentarios.js` — `obtenerCountComentarios` (línea 185)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('posteoId', 'El ID del posteo no es válido').isMongoId()`
3. `validarCampos`
4. `validarIdPosteo`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | string (MongoId) | Sí | `isMongoId()` |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{ "success": true, "data": { "count": 12 } }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente | `verificarTokenSesion` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID del posteo no es válido` | express-validator |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: xxx no existe` / `ha sido eliminado` | `helpers/validar-id-posteo.js` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo no existe` | `controllers/comentarios.js:196` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener contador` | `controllers/comentarios.js:204` |

---

## DELETE /api/comentarios/:comentarioId

**Descripción:** Elimina un comentario (soft delete). Puede hacerlo el autor del comentario o el dueño del posteo.
**Archivo de ruta:** `routes/comentarios.js:41`
**Controlador:** `controllers/comentarios.js` — `eliminarComentario` (línea 208)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('comentarioId', 'El ID del comentario no es válido').isMongoId()`
3. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `comentarioId` | string (MongoId) | Sí | `isMongoId()` |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{ "success": true, "msg": "Comentario eliminado" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente | `verificarTokenSesion` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID del comentario no es válido` | express-validator |
| 400 | `BAD_REQUEST` | Bad Request | `El comentario ya fue eliminado` | `controllers/comentarios.js:224,266` |
| 404 | `NOT_FOUND` | Resource Not Found | `El comentario no existe` | `controllers/comentarios.js:225` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo asociado no existe` | `controllers/comentarios.js:233` |
| 403 | `FORBIDDEN` | Forbidden | `No tienes permisos para eliminar este comentario` | `controllers/comentarios.js:241` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al eliminar comentario` | `controllers/comentarios.js:273` |

### Notas para el Frontend
- Permiso: autor del comentario **o** dueño del posteo.
- Decrementa `comentariosCount` del posteo (con protección contra contador negativo).

---

## PUT /api/comentarios/:posteoId/comentarios/toggle

**Descripción:** Activa/desactiva los comentarios de un posteo (solo el dueño).
**Archivo de ruta:** `routes/comentarios.js:47`
**Controlador:** `controllers/comentarios.js` — `toggleComentariosPosteo` (línea 277)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('posteoId', 'El ID del posteo no es válido').isMongoId()`
3. `check('activar', 'El campo activar debe ser un booleano').isBoolean({ strict: true })`
4. `validarCampos`
5. `validarIdPosteo`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | string (MongoId) | Sí | `isMongoId()` |
| body | `activar` | boolean | Sí | `isBoolean({ strict: true })` (booleano estricto) |

### Ejemplo de request
```json
{ "activar": false }
```

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{ "success": true, "msg": "Comentarios desactivados", "data": { "comentariosActivos": false } }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente | `verificarTokenSesion` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID del posteo no es válido` / `El campo activar debe ser un booleano` | express-validator |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: xxx no existe` / `ha sido eliminado` | `helpers/validar-id-posteo.js` |
| 403 | `FORBIDDEN` | Forbidden | `Solo el dueño del posteo puede modificar los comentarios` | `controllers/comentarios.js:292` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo no existe` | `controllers/comentarios.js:293` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al modificar comentarios` | `controllers/comentarios.js:303` |

### Notas para el Frontend
- `activar` debe ser un booleano real (validación `isBoolean({ strict: true })`).
- `msg` varía según `activar`: `"Comentarios activados"` o `"Comentarios desactivados"`.
