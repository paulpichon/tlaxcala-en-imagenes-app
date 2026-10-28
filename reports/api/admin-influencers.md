# Panel de administración — influencers / acceso anticipado (`/api/v1/admin/influencers`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `admin/routes/index.js:142` → `admin/routes/influencers.js`. Controlador: `admin/controllers/influencers.js`. Helpers: `admin/helpers/campos-editables.js`, `admin/helpers/eliminar-influencer.js`, `helpers/metricas-atribucion.js`, `helpers/validar-rango-fechas.js`. Modelos: `models/Influencer.js`, `models/Earlyaccess.js`, `admin/models/AuditoriaEliminacion.js`.

**Temporal:** este módulo se eliminará al terminar el acceso anticipado (`models/server.js:53-55`).

**Todas las rutas:** sesión completa + permiso específico. Limiter después del permiso. `MODERADOR` **no** tiene permisos de influencers. Solo `SUPERADMIN` (`*`) puede usar este módulo.

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [GET] /api/v1/admin/influencers

**Descripción:** Listado paginado de influencers con el total de registros atribuidos a cada uno (`totalAtribuciones`).
**Archivo de ruta:** `admin/routes/influencers.js:27`
**Controlador:** `admin/controllers/influencers.js` — `listarInfluencers` (línea 22)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`influencers:leer`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('influencers:leer')` → `adminInfluencersLecturaLimiter` → validadores de query → `validarCampos` → `listarInfluencers`.
- Rate limiter: `adminInfluencersLecturaLimiter` (`admin/middlewares/rate-limiter.js:111`), 15 min / 300, clave `Admin._id`, código `ADMIN_INFLUENCERS_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | `page` | entero | No (default 1) | `optional({values:'falsy'}).isInt({min:1, max:10000})`; `"El parametro PAGE debe ser un entero entre 1 y 10000"` → 422 |
| query | `limite` | entero | No (default 15) | `isInt({min:1, max:100})`; `"El parametro LIMITE debe ser un entero entre 1 y 100"` → 422 |
| query | `limit` | entero | No | Alias; `"El parametro LIMIT debe ser un entero entre 1 y 100"` → 422 |

### Ejemplo de request
```http
GET /api/v1/admin/influencers?page=1&limite=15
Cookie: adminAccessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "data": [
    {
      "_id": "6655d1…",
      "codigo": "ANA2026",
      "nombre": "Ana Influencer",
      "activo": true,
      "notas": null,
      "creadoPor": "6652a1…",
      "actualizadoPor": null,
      "createdAt": "2026-10-01T10:00:00.000Z",
      "updatedAt": "2026-10-01T10:00:00.000Z",
      "totalAtribuciones": 12
    }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 1, "totalPages": 1, "next": null, "prev": null }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_INFLUENCERS_BLOCKED` | Rate Limit Exceeded | "Demasiadas consultas a influencers, intentalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:118-120` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: influencers:leer" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | Mensajes de `admin/routes/influencers.js:31-38` | `middlewares/validar-campos.js:28` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Ocurrió un error inesperado. Por favor, intente más tarde." (el controlador delega cualquier error con `next(error)`) | `middlewares/error-handler.js:108-118` |

### Notas para el Frontend
- `totalAtribuciones` cuenta todas las atribuciones históricas, incluidas las de códigos eliminados (no aplica a este listado).
- Máximo 100 por página.

---

## [GET] /api/v1/admin/influencers/metricas

**Descripción:** Métricas agregadas de atribución: totales, por influencer, por `utm_source`, por `utm_content`, por combinación y serie diaria. Solo conteos; nunca datos personales.
**Archivo de ruta:** `admin/routes/influencers.js:47`
**Controlador:** `admin/controllers/influencers.js` — `obtenerMetricasInfluencers` (línea 196) → `helpers/metricas-atribucion.js` — `calcularMetricasAtribucion`

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`influencers:leer`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('influencers:leer')` → `adminInfluencersLecturaLimiter` → `check('desde').optional({values:'falsy'}).isISO8601()` → `check('hasta')…` → `validarCampos` → `obtenerMetricasInfluencers`.
- Rate limiter: `adminInfluencersLecturaLimiter`, 15 min / 300.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | `desde` | fecha ISO 8601 | No | `isISO8601()`; `"La fecha \"desde\" debe tener formato ISO 8601"` → 422. Filtra `createdAt >= desde` |
| query | `hasta` | fecha ISO 8601 | No | `isISO8601()`; `"La fecha \"hasta\" debe tener formato ISO 8601"` → 422. Filtra `createdAt <= hasta` |

### Ejemplo de request
```http
GET /api/v1/admin/influencers/metricas?desde=2026-10-01&hasta=2026-10-27
Cookie: adminAccessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200` (sin `msg`, sin paginación)
```json
{
  "success": true,
  "data": {
    "total": 150,
    "conAtribucion": 90,
    "sinAtribucion": 60,
    "porInfluencer": [ { "influencerId": "6655d1…", "codigo": "ANA2026", "nombre": "Ana Influencer", "cantidad": 60 } ],
    "porSource": [ { "_id": "instagram", "cantidad": 70 } ],
    "porContent": [ { "_id": "reel", "cantidad": 40 } ],
    "porCombinacion": [ { "codigo": "ANA2026", "utmSource": "instagram", "utmContent": "reel", "cantidad": 40 } ],
    "serieDiaria": [ { "_id": "2026-10-20", "conAtribucion": 5, "sinAtribucion": 2 } ]
  }
}
```
`serieDiaria` usa la zona horaria `APP_TIMEZONE` (default `America/Mexico_City`) (`helpers/metricas-atribucion.js:9,93`).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_INFLUENCERS_BLOCKED` | Rate Limit Exceeded | "Demasiadas consultas a influencers, intentalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:118-120` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: influencers:leer" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La fecha \"desde\" debe tener formato ISO 8601" / "…\"hasta\"…" | `admin/routes/influencers.js:51-54` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `La fecha "desde" debe ser anterior o igual a "hasta"` (rango invertido; `errors` vacío) | `helpers/validar-rango-fechas.js:19` → `admin/controllers/influencers.js:208` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Ocurrió un error inesperado…" | `middlewares/error-handler.js:108-118` |

### Notas para el Frontend
- Rango invertido → 422 **sin** `errors`. Valida en la UI antes de enviar.
- `porInfluencer.nombre` es el nombre actual; si el influencer se eliminó, vale `null`.
- No hay paginación ni límite de rango: consultas muy amplias pueden ser costosas.

---

## [POST] /api/v1/admin/influencers

**Descripción:** Da de alta un código de influencer. El código se normaliza a mayúsculas. No se puede reutilizar un código que ya tuvo atribuciones, aunque su documento haya sido eliminado.
**Archivo de ruta:** `admin/routes/influencers.js:61`
**Controlador:** `admin/controllers/influencers.js` — `crearInfluencer` (línea 72)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`influencers:crear`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('influencers:crear')` → `adminInfluencersEscrituraLimiter` → validadores → `validarCampos` → `crearInfluencer`.
- Rate limiter: `adminInfluencersEscrituraLimiter` (`admin/middlewares/rate-limiter.js:130`), 15 min / **60**, clave `Admin._id`, código `ADMIN_INFLUENCERS_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `codigo` | string | Sí | `trim()` → mayúsculas → `matches(/^[A-Z0-9][A-Z0-9_-]{2,31}$/)`; `"El codigo debe tener entre 3 y 32 caracteres alfanumericos, guiones o guiones bajos"` → 422 |
| body | `nombre` | string | Sí | `trim()` + `notEmpty()` + `isLength({max: 80})`; `"El nombre es obligatorio y no puede exceder 80 caracteres"` → 422 |
| body | `activo` | boolean | No (default `true`) | `optional().isBoolean()`; `"El campo activo debe booleano"` → 422 |
| body | `notas` | string | No | `optional({values:'falsy'})`, `trim()`, máx. 200; `"Las notas no pueden exceder 200 caracteres"` → 422. Vacío → `null` |

### Ejemplo de request
```http
POST /api/v1/admin/influencers
Content-Type: application/json
Cookie: adminAccessToken=…
Origin: https://admin.tlaxapp.example

{ "codigo": "ana2026", "nombre": "Ana Influencer", "activo": true, "notas": "Campaña otoño" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: **`201`**
```json
{
  "success": true,
  "msg": "Influencer creado correctamente",
  "data": {
    "_id": "6655d1…",
    "codigo": "ANA2026",
    "nombre": "Ana Influencer",
    "activo": true,
    "notas": "Campaña otoño",
    "creadoPor": "6652a1…",
    "actualizadoPor": null,
    "createdAt": "2026-10-27T19:10:34.000Z",
    "updatedAt": "2026-10-27T19:10:34.000Z"
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_INFLUENCERS_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones de influencers, intentalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:137-139` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: influencers:crear" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | Mensajes de `admin/routes/influencers.js:65-76` | `middlewares/validar-campos.js:28` |
| 409 | `CONFLICT` | Conflict | "El código de influencer ya está registrado" | `admin/controllers/influencers.js:86` |
| 409 | `CONFLICT` | Conflict | "El código ya fue usado y no puede reutilizarse" (con atribuciones históricas; antes o después del alta) | `admin/controllers/influencers.js:95,117` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Ocurrió un error inesperado…" | `middlewares/error-handler.js:108-118` |

### Notas para el Frontend
- Envía el código en cualquier caso; el backend lo convierte a mayúsculas.
- Un código eliminado con historial **no** puede volver a usarse: muéstralo como "código reutilizado" y pide otro.
- `creadoPor` apunta al administrador que lo creó; `actualizadoPor` se rellena al editar.

---

## [PATCH] /api/v1/admin/influencers/:id

**Descripción:** Edita nombre, activo y/o notas. Al menos uno de los tres campos debe venir. Registra `actualizadoPor`.
**Archivo de ruta:** `admin/routes/influencers.js:84`
**Controlador:** `admin/controllers/influencers.js` — `actualizarInfluencer` (línea 133). Helper: `admin/helpers/campos-editables.js` — `extraerCamposEditables` (línea 16).

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`influencers:editar`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('influencers:editar')` → `adminInfluencersEscrituraLimiter` → `check('id').isMongoId()` → validadores opcionales → `validarCampos` → `actualizarInfluencer`.
- Rate limiter: `adminInfluencersEscrituraLimiter`, 15 min / 60.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID del influencer no es valido"` → 422 |
| body | `nombre` | string | No | `optional({values:'falsy'})`, `trim()`, `notEmpty()`, máx. 80; `"El nombre no puede exceder 80 caracteres"` → 422 |
| body | `activo` | boolean | No | `optional().isBoolean()`; `"El campo activo debe booleano"` → 422 |
| body | `notas` | string | No | `optional({values:'falsy'})`, `trim()`, máx. 200; `"Las notas no pueden exceder 200 caracteres"` → 422. Vacío → `null` |

Ver ⚠ en Notas sobre `nombre: ""`.

### Ejemplo de request
```http
PATCH /api/v1/admin/influencers/6655d1f0c2a3b4c5d6e7f8a9
Content-Type: application/json
Cookie: adminAccessToken=…

{ "activo": false, "notas": "Pausada hasta enero" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Influencer actualizado correctamente",
  "data": {
    "_id": "6655d1f0c2a3b4c5d6e7f8a9",
    "codigo": "ANA2026",
    "nombre": "Ana Influencer",
    "activo": false,
    "notas": "Pausada hasta enero",
    "creadoPor": "6652a1…",
    "actualizadoPor": "6652a1…",
    "updatedAt": "2026-10-27T19:10:34.000Z"
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_INFLUENCERS_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones de influencers, intentalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:137-139` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: influencers:editar" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del influencer no es valido" / "El nombre no puede exceder 80 caracteres" / "El campo activo debe booleano" / "Las notas no pueden exceder 200 caracteres" | `admin/routes/influencers.js:88-97` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "Debes enviar al menos un campo editable: nombre, activo o notas" (body sin campos editables) | `admin/controllers/influencers.js:140` |
| 404 | `NOT_FOUND` | Resource Not Found | "Influencer no encontrado" | `admin/controllers/influencers.js:152` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Ocurrió un error inesperado…" (incluye validación de Mongoose al persistir) | `middlewares/error-handler.js:108-118` |

### Notas para el Frontend
- ⚠ **`nombre: ""` (vacío) pasa el validador** porque la regla está marcada como `optional({values:'falsy'})`. El controlador lo envía a Mongoose, donde `nombre` es obligatorio; el resultado esperado es **500**, no 422 (**[REQUIERE VERIFICACIÓN MANUAL]**, derivado del esquema `models/Influencer.js:16-21`). No envíes nombres vacíos.
- Para quitar las notas, envía `"notas": ""` (se guarda `null`).
- `activo` puede venir como booleano o como string (`"true"`/`"false"`): Mongoose lo convierte correctamente en este endpoint (a diferencia de `PATCH /cuentas/:id`).
- Un PATCH con un solo campo actualiza solo ese campo.

---

## [DELETE] /api/v1/admin/influencers/:id

**Descripción:** Elimina físicamente el influencer. En la **misma transacción** escribe un registro en `AuditoriaEliminacion` (snapshot, total de atribuciones y quién lo eliminó, con TTL de 90 días). Conserva los snapshots históricos de `Earlyaccess`.
**Archivo de ruta:** `admin/routes/influencers.js:105`
**Controlador:** `admin/controllers/influencers.js` — `eliminarInfluencer` (línea 167) → `admin/helpers/eliminar-influencer.js` — `eliminarInfluencerPorId` (línea 53)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`influencers:eliminar`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('influencers:eliminar')` → `adminInfluencersEscrituraLimiter` → `check('id').isMongoId()` → `validarCampos` → `eliminarInfluencer`.
- Rate limiter: `adminInfluencersEscrituraLimiter`, 15 min / 60.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID del influencer no es valido"` → 422 |

### Ejemplo de request
```http
DELETE /api/v1/admin/influencers/6655d1f0c2a3b4c5d6e7f8a9
Cookie: adminAccessToken=…
Origin: https://admin.tlaxapp.example
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Influencer eliminado correctamente",
  "data": { "_id": "6655d1f0c2a3b4c5d6e7f8a9", "codigo": "ANA2026" }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_INFLUENCERS_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones de influencers, intentalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:137-139` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: influencers:eliminar" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del influencer no es valido" | `admin/routes/influencers.js:109` |
| 404 | `NOT_FOUND` | Resource Not Found | "Influencer no encontrado" | `admin/controllers/influencers.js:178` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Ocurrió un error inesperado…" (la transacción se revierte) | `middlewares/error-handler.js:108-118` |

### Notas para el Frontend
- **Irreversible** desde la API: el documento desaparece y el código deja de estar disponible para capturas nuevas (las cookies ya emitidas pueden seguir vigentes hasta caducar; la conversión revalida contra BD).
- El código eliminado **no** puede reutilizarse si tuvo atribuciones (ver `POST`).
- Respuesta `200` con `_id` y `codigo`: úsalos para quitar la fila del listado.
