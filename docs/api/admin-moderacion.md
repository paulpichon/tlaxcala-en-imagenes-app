# Panel de administración — moderación de reportes (`/api/v1/admin/moderacion`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `admin/routes/index.js:137` → `admin/routes/moderacion.js`. Controlador: `admin/controllers/moderacion.js`. Helpers: `admin/helpers/proyeccion-posteo-moderacion.js` (lista blanca del posteo), `helpers/categorias-reporte.js`. Modelos: `models/ReportePosteo.js`, `models/Posteo.js`, `models/Notificacion.js`.

**Todas las rutas:** sesión completa del panel (`adminAccessToken`) **+** permiso específico. El orden es `verificarSesionAdmin` → `verificarPermisoAdmin` → limiter → validadores → controlador: un request sin permiso **no consume cuota** del limiter.

**Anonimato (decisión de producto):** el reportero se expone **solo dentro de este módulo**. El autor del posteo nunca sabe quién reportó.

**Cola de prioridad:** `score = (PRIORIDAD_MAX + 1 − prioridad) × 1000 + min(volumen, 10) × 100`, orden `score` descendente y `createdAt` ascendente como desempate. Se calcula en cada consulta (`controllers/moderacion.js:24-44`).

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [GET] /api/v1/admin/moderacion/reportes

**Descripción:** Cola paginada de reportes **pendientes**, priorizada por score. Excluye reportes cuyo posteo esté eliminado.
**Archivo de ruta:** `admin/routes/moderacion.js:28`
**Controlador:** `admin/controllers/moderacion.js` — `obtenerColaReportes` (línea 52)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`moderacion:leer`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('moderacion:leer')` → `adminModeracionLecturaLimiter` → validadores de query → `validarCampos` → `obtenerColaReportes`.
- Rate limiter: `adminModeracionLecturaLimiter` (`admin/middlewares/rate-limiter.js:73`), 15 min / **300**, clave `Admin._id`, código `ADMIN_MODERACION_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | `page` | entero | No (default 1) | `isInt({min:1, max:10000})`; `"El parametro PAGE debe ser un entero entre 1 y 10000"` → 422 |
| query | `limite` | entero | No (default 15) | `isInt({min:1, max:100})`; `"El parametro LIMITE debe ser un entero entre 1 y 100"` → 422 |
| query | `limit` | entero | No | Alias; `"El parametro LIMIT debe ser un entero entre 1 y 100"` → 422 |

### Ejemplo de request
```http
GET /api/v1/admin/moderacion/reportes?page=1&limite=15
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
      "_id": "6654c1…",
      "categoria": "contenido_inapropiado",
      "prioridad": 1,
      "descripcion": null,
      "createdAt": "2026-10-27T18:00:00.000Z",
      "score": 7100,
      "volumen": 1,
      "posteo": {
        "_id": "6650d4…", "public_id": "…", "texto": "…", "visibilidad": "publico",
        "ocultoPorModeracion": false, "fecha_creacion": "2026-10-20T15:00:00.000Z"
      },
      "autorPosteo": { "_id": "6650a1…", "nombre_completo": { "nombre": "Ana", "apellido": "López" }, "url": "ana-lopez-3f9a1" },
      "reportero": { "_id": "6650b2…", "nombre_completo": { "nombre": "Luis", "apellido": "Pérez" }, "url": "luis-perez-9d4e0" }
    }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 1, "totalPages": 1, "next": null, "prev": null }
}
```
`posteo` está en lista blanca: no incluye `secure_url`, `ubicacion` ni `_idUsuario` (`admin/helpers/proyeccion-posteo-moderacion.js:11-18`).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_MODERACION_BLOCKED` | Rate Limit Exceeded | "Demasiadas consultas a la moderacion, intentalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:80-82` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: moderacion:leer" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | Mensajes de `admin/routes/moderacion.js:32-38` | `middlewares/validar-campos.js:28` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al obtener la cola de reportes" | `admin/controllers/moderacion.js:163` |

### Notas para el Frontend
- `reportero` solo existe aquí. No lo muestres fuera de la moderación.
- `score` y `volumen` son informativos; el orden ya viene aplicado.
- `posteo` puede venir sin campos si el documento no se encontró, pero la cola ya filtra eliminados.

---

## [GET] /api/v1/admin/moderacion/reportes/:id

**Descripción:** Detalle de un reporte: posteo (lista blanca), autor, reportero, y hasta 10 reportes **pendientes** adicionales sobre el mismo posteo (`otrosPendientes`) con su total (`otrosPendientesTotal`).
**Archivo de ruta:** `admin/routes/moderacion.js:45`
**Controlador:** `admin/controllers/moderacion.js` — `obtenerDetalleReporte` (línea 170)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`moderacion:leer`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('moderacion:leer')` → `adminModeracionLecturaLimiter` → `check('id').isMongoId()` → `validarCampos` → `obtenerDetalleReporte`.
- Rate limiter: `adminModeracionLecturaLimiter`, 15 min / 300.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID del reporte no es valido"` → 422 |

### Ejemplo de request
```http
GET /api/v1/admin/moderacion/reportes/6654c1a0f0c2a3b4c5d6e7f8
Cookie: adminAccessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "data": {
    "reporte": {
      "_id": "6654c1a0f0c2a3b4c5d6e7f8",
      "categoria": "spam",
      "prioridad": 6,
      "descripcion": "Publicidad no autorizada",
      "estatus": "pendiente",
      "createdAt": "2026-10-27T18:00:00.000Z",
      "resueltoPor": null,
      "resueltoPorAdmin": null,
      "resueltoAt": null,
      "posteo": { "_id": "6650d4…", "public_id": "…", "texto": "…", "visibilidad": "publico", "ocultoPorModeracion": false, "fecha_creacion": "…" },
      "autorPosteo": { "_id": "6650a1…", "nombre_completo": { "nombre": "Ana", "apellido": "López" }, "url": "ana-lopez-3f9a1" },
      "reportero": { "_id": "6650b2…", "nombre_completo": { "nombre": "Luis", "apellido": "Pérez" }, "url": "luis-perez-9d4e0" },
      "otrosPendientes": [],
      "otrosPendientesTotal": 0
    }
  }
}
```
Sin `msg`.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_MODERACION_BLOCKED` | Rate Limit Exceeded | "Demasiadas consultas a la moderacion, intentalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:80-82` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: moderacion:leer" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del reporte no es valido" | `admin/routes/moderacion.js:49` |
| 404 | `NOT_FOUND` | Resource Not Found | "El reporte no existe" (inexistente o eliminado) | `admin/controllers/moderacion.js:273` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al obtener el detalle del reporte" | `admin/controllers/moderacion.js:280` |

### Notas para el Frontend
- Usa `otrosPendientesTotal` para mostrar "y N reportes más".
- `resueltoPor` es **legado** (cuenta de usuario). Usa `resueltoPorAdmin` para la trazabilidad actual.

---

## [PUT] /api/v1/admin/moderacion/reportes/:id/resolver

**Descripción:** Confirma la infracción. En **una transacción**: marca este reporte y todos los pendientes del mismo posteo como `resuelto`, y elimina el posteo (`isDeleted: true`, `deleteReason: 'moderation'`). Después de confirmar la transacción, notifica al autor por correo y por notificación in-app (`posteo_eliminado_moderacion`), sin revelar reportes ni reporteros. Las notificaciones son *best-effort*.
**Archivo de ruta:** `admin/routes/moderacion.js:54`
**Controlador:** `admin/controllers/moderacion.js` — `resolverReporte` (línea 321); reclamo atómico en `reclamarReportePendiente` (línea 291)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`moderacion:resolver`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('moderacion:resolver')` → `adminModeracionEscrituraLimiter` → `check('id').isMongoId()` → `validarCampos` → `resolverReporte`.
- Rate limiter: `adminModeracionEscrituraLimiter` (`admin/middlewares/rate-limiter.js:92`), 15 min / **60**, clave `Admin._id`, código `ADMIN_MODERACION_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID del reporte no es valido"` → 422 |

Sin body.

### Ejemplo de request
```http
PUT /api/v1/admin/moderacion/reportes/6654c1a0f0c2a3b4c5d6e7f8/resolver
Cookie: adminAccessToken=…
Origin: https://admin.tlaxapp.example
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Reporte resuelto. La publicacion fue eliminada por moderacion." }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_MODERACION_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones de moderacion, intentalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:98-100` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: moderacion:resolver" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del reporte no es valido" | `admin/routes/moderacion.js:58` |
| 404 | `NOT_FOUND` | Resource Not Found | "El reporte no existe" | `admin/controllers/moderacion.js:308` |
| 400 | `BAD_REQUEST` | Bad Request | "Este reporte ya fue atendido (resuelto o descartado)" | `admin/controllers/moderacion.js:311` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al resolver el reporte" (incluye fallo de transacción) | `admin/controllers/moderacion.js:397` |

### Notas para el Frontend
- Es **irreversible desde el panel**: el posteo queda eliminado. Pide confirmación explícita.
- Si el posteo ya estaba eliminado, la respuesta sigue siendo 200 con el mismo mensaje (no se notifica de nuevo).
- Los demás reportes pendientes del mismo posteo quedan resueltos sin que se muestren.
- Tras el 200, refresca la cola: el reporte ya no aparece.

---

## [PUT] /api/v1/admin/moderacion/reportes/:id/descartar

**Descripción:** Descarta el reporte (no hay infracción). En una transacción marca este reporte y los pendientes del mismo posteo como `descartado`. Si no quedan pendientes **y** el posteo estaba oculto **por un reporte** (`ocultadoPorReporteId != null`), lo restaura. Los ocultamientos manuales no se restauran solos.
**Archivo de ruta:** `admin/routes/moderacion.js:63`
**Controlador:** `admin/controllers/moderacion.js` — `descartarReporte` (línea 406)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`moderacion:descartar`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('moderacion:descartar')` → `adminModeracionEscrituraLimiter` → `check('id').isMongoId()` → `validarCampos` → `descartarReporte`.
- Rate limiter: `adminModeracionEscrituraLimiter`, 15 min / 60.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID del reporte no es valido"` → 422 |

### Ejemplo de request
```http
PUT /api/v1/admin/moderacion/reportes/6654c1a0f0c2a3b4c5d6e7f8/descartar
Cookie: adminAccessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Reporte descartado. La publicacion no sera eliminada." }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_MODERACION_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones de moderacion, intentalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:98-100` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: moderacion:descartar" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del reporte no es valido" | `admin/routes/moderacion.js:67` |
| 404 | `NOT_FOUND` | Resource Not Found | "El reporte no existe" | `admin/controllers/moderacion.js:308` |
| 400 | `BAD_REQUEST` | Bad Request | "Este reporte ya fue atendido (resuelto o descartado)" | `admin/controllers/moderacion.js:311` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al descartar el reporte" | `admin/controllers/moderacion.js:468` |

### Notas para el Frontend
- ⚠ Tras descartar, el reportero **no** recibe ninguna señal; el posteo sigue oculto para él (regla de producto).
- Si el posteo se restaura, vuelve a aparecer en feed y perfil de todos.

---

## [PUT] /api/v1/admin/moderacion/reportes/:id/recategorizar

**Descripción:** Cambia la categoría de un reporte **pendiente** y recalcula su prioridad. Si la nueva categoría es `otro`, exige una descripción: la enviada en el body o una ya existente. La comprobación es atómica en la propia actualización.
**Archivo de ruta:** `admin/routes/moderacion.js:73`
**Controlador:** `admin/controllers/moderacion.js` — `recategorizarReporte` (línea 477)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`moderacion:recategorizar`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('moderacion:recategorizar')` → `adminModeracionEscrituraLimiter` → `check('id')` → `check('categoria').notEmpty().isIn(...)` → `check('descripcion')` opcional → `validarCampos` → `recategorizarReporte`.
- Rate limiter: `adminModeracionEscrituraLimiter`, 15 min / 60.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID del reporte no es valido"` → 422 |
| body | `categoria` | string (enum) | Sí | `notEmpty()` + `isIn(...)`; `"La categoria es obligatoria: [contenido_inapropiado, …, otro]"` → 422 |
| body | `descripcion` | string | No | `optional({values:'falsy'})`, `isString()`, `trim()`, máx. 200 UTF-16; `"La descripcion debe ser texto de maximo 200 caracteres"` → 422 |

### Ejemplo de request
```http
PUT /api/v1/admin/moderacion/reportes/6654c1a0f0c2a3b4c5d6e7f8/recategorizar
Content-Type: application/json
Cookie: adminAccessToken=…

{ "categoria": "otro", "descripcion": "Contenido con datos personales de terceros" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Reporte recategorizado",
  "data": { "categoria": "otro", "prioridad": 7, "descripcion": "Contenido con datos personales de terceros" }
}
```
Si no se envió `descripcion`, `data` solo trae `categoria` y `prioridad`.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_MODERACION_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones de moderacion, intentalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:98-100` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: moderacion:recategorizar" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del reporte no es valido" / "La categoria es obligatoria: [...]" / "La descripcion debe ser texto de maximo 200 caracteres" | `admin/routes/moderacion.js:77-81` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `La descripcion es obligatoria cuando la categoria es "otro"` (sin descripción previa ni enviada) | `admin/controllers/moderacion.js:494` |
| 404 | `NOT_FOUND` | Resource Not Found | "El reporte no existe" | `admin/controllers/moderacion.js:308` |
| 400 | `BAD_REQUEST` | Bad Request | "Este reporte ya fue atendido (resuelto o descartado)" | `admin/controllers/moderacion.js:311` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al recategorizar el reporte" | `admin/controllers/moderacion.js:512` |

### Notas para el Frontend
- **Diferencia de código:** el 422 de "descripción obligatoria" viene del controlador (`errors` vacío y `detail` con el texto), no del validador (que devuelve `errors` con los campos).
- Para `otro` sin descripción previa, envía una `descripcion` en la misma petición.
- Solo funciona sobre reportes pendientes.

---

## [PUT] /api/v1/admin/moderacion/posteos/:posteoId/ocultar

**Descripción:** Oculta un posteo **globalmente** (preventivo y reversible). Ya no lo ven los demás usuarios, pero el autor sí (con `ocultoPorModeracion: true`). Si se envía `reporteId`, el ocultamiento queda ligado a ese reporte y se restaura automáticamente al descartar todos sus pendientes.
**Archivo de ruta:** `admin/routes/moderacion.js:95`
**Controlador:** `admin/controllers/moderacion.js` — `ocultarPosteo` (línea 519)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`posteos:ocultar`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('posteos:ocultar')` → `adminModeracionEscrituraLimiter` → `check('posteoId').isMongoId()` → `check('reporteId').optional({values:'falsy'}).isMongoId()` → `validarCampos` → `ocultarPosteo`. **No usa `validarIdPosteo`** (el moderador no es autor).
- Rate limiter: `adminModeracionEscrituraLimiter`, 15 min / 60.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | ObjectId | Sí | `isMongoId()`; `"El ID del posteo no es valido"` → 422 |
| body | `reporteId` | ObjectId | No | `optional({values:'falsy'})`, `isMongoId()`; `"El ID del reporte no es valido"` → 422 |

### Ejemplo de request
```http
PUT /api/v1/admin/moderacion/posteos/6650d4a1f0c2a3b4c5d6e7f8/ocultar
Content-Type: application/json
Cookie: adminAccessToken=…

{ "reporteId": "6654c1a0f0c2a3b4c5d6e7f8" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Posteo ocultado por moderacion. Solo el autor puede verlo." }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_MODERACION_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones de moderacion, intentalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:98-100` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: posteos:ocultar" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del posteo no es valido" / "El ID del reporte no es valido" | `admin/routes/moderacion.js:99-100` |
| 400 | `BAD_REQUEST` | Bad Request | "El reporte no corresponde a este posteo o ya fue atendido" | `admin/controllers/moderacion.js:536` |
| 404 | `NOT_FOUND` | Resource Not Found | "El posteo no existe o fue eliminado" | `admin/controllers/moderacion.js:559` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al ocultar el posteo" | `admin/controllers/moderacion.js:566` |

### Notas para el Frontend
- ⚠ **Llamar sin `reporteId` borra el vínculo con un reporte previo** (`ocultadoPorReporteId: null`, `controllers/moderacion.js:552`). Si el posteo ya estaba oculto por un reporte, envía el `reporteId` otra vez para conservar la restauración automática.
- El autor ve el posteo con el badge "En revisión" (`ocultoPorModeracion: true`).
- Oculto no es eliminado: restaurable con el endpoint siguiente.

---

## [PUT] /api/v1/admin/moderacion/posteos/:posteoId/restaurar

**Descripción:** Quita el ocultamiento global de un posteo. Lo vuelve visible para todos.
**Archivo de ruta:** `admin/routes/moderacion.js:105`
**Controlador:** `admin/controllers/moderacion.js` — `restaurarPosteo` (línea 573)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`posteos:restaurar`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('posteos:restaurar')` → `adminModeracionEscrituraLimiter` → `check('posteoId').isMongoId()` → `validarCampos` → `restaurarPosteo`.
- Rate limiter: `adminModeracionEscrituraLimiter`, 15 min / 60.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | ObjectId | Sí | `isMongoId()`; `"El ID del posteo no es valido"` → 422 |

### Ejemplo de request
```http
PUT /api/v1/admin/moderacion/posteos/6650d4a1f0c2a3b4c5d6e7f8/restaurar
Cookie: adminAccessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Posteo restaurado. Visible nuevamente para todos." }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_MODERACION_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones de moderacion, intentalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:98-100` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: posteos:restaurar" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del posteo no es valido" | `admin/routes/moderacion.js:109` |
| 404 | `NOT_FOUND` | Resource Not Found | "El posteo no existe o fue eliminado" | `admin/controllers/moderacion.js:592` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al restaurar el posteo" | `admin/controllers/moderacion.js:599` |

### Notas para el Frontend
- Restaurar un posteo que estaba oculto por un reporte **no** cierra ese reporte. Si quedan pendientes, la cola sigue mostrándolos.
- Un posteo no oculto se "restaura" con 200 sin efecto real.
