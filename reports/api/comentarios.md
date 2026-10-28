# Comentarios (`/api/comentarios`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:134`. Modelo: `models/Comentario.js` (soft delete, `timestamps`). Validación de texto compartida: `middlewares/validar-texto.js` (`crearValidadorTexto({ opcional: false, max: 250 })`).

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [POST] /api/comentarios/:posteoId/comentarios

**Descripción:** Crea un comentario en un posteo. Si el posteo tiene comentarios activos, guarda el comentario, incrementa `comentariosCount`, y notifica al autor (Web Push siempre que tenga suscripciones; correo solo en el primer comentario).
**Archivo de ruta:** `routes/comentarios.js:20`
**Controlador:** `controllers/comentarios.js` — `agregarComentario` (línea 11)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares, en orden:
  1. `comentarioLimiter` (`middlewares/rate-limiter.js:146`)
  2. `verificarTokenSesion`
  3. `check('posteoId').isMongoId()`
  4. `validarTextoComentario` (`middlewares/validar-texto.js`, `opcional: false`, `max: 250`)
  5. `validarCampos`
  6. `validarIdPosteo`
  7. `agregarComentario`
- Rate limiter: `comentarioLimiter`, **1 min / 10**, código `COMENTARIO_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | ObjectId | Sí | `isMongoId()`; `"El ID del posteo no es válido"` → 422 |
| body | `texto` | string | Sí | `trim()` → `notEmpty()` (`"El texto es obligatorio."`) → regex Unicode `^[\p{L}\p{N}\p{P}\p{S}\p{M}\p{Z}\t\n\r\u200D\uFE0F\uFE0E]*$` (`"El campo de texto contiene caracteres no permitidos."`) → `isLength({max: 250})` (`"El texto no puede exceder 250 caracteres."`). Longitud en unidades UTF-16 |

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
| 429 | `COMENTARIO_BLOCKED` | Rate Limit Exceeded | "Demasiados comentarios, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:151-153` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del posteo no es válido" | `routes/comentarios.js:22` + `middlewares/validar-campos.js:28` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El campo de texto contiene caracteres no permitidos" (`errors[].message`: "El texto es obligatorio.", "El campo de texto contiene caracteres no permitidos.", "El texto no puede exceder 250 caracteres.") | `middlewares/validar-texto.js:60` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 404 | `NOT_FOUND` | Resource Not Found | "El posteo no existe" / "El posteo ha sido eliminado" (defensivos) | `controllers/comentarios.js:22,26` |
| 403 | `FORBIDDEN` | Forbidden | "Los comentarios están desactivados en este posteo" | `controllers/comentarios.js:30` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al agregar comentario" | `controllers/comentarios.js:115` |

### Notas para el Frontend
- El `detail` de 422 es siempre "El campo de texto contiene caracteres no permitidos", incluso si el motivo es la longitud. Muestra `errors[].message`.
- Límite de 250 caracteres UTF-16. Un emoji simple cuenta 2; una familia ZWJ puede contar 11.
- El texto se recorta (`trim`) antes de guardar. Un texto de solo espacios cuenta como vacío y responde 422.
- `comentarioLimiter` cuenta todos los intentos, incluidos los rechazados por validación.
- ⚠ Tras responder 201, el controlador ejecuta notificaciones. Si una de ellas falla, se llama a `next(InternalError)` **después** de la respuesta (`controllers/comentarios.js:113-115`), lo que puede generar un error de cabeceras ya enviadas en el servidor. La respuesta al cliente sigue siendo 201 (derivado del código).
- **Web Push:** el `icon` del payload es `autor.imagen_perfil.secure_url` y, si falta, `ICONO_SISTEMA_TLAXAPP`. Ya **no** existe el fallback relativo `/public/assets/...` (rompía el icono cross-origin); si tampoco hay variable, el payload va sin `icon` y el servicio push usa el suyo por defecto. `followers.md` usa el mismo criterio.
- `autorId` llega como id sin poblar. Para mostrar el autor usa la lista de comentarios, que sí lo puebla.
- Un posteo oculto por moderación devuelve 404 a quien no es el autor.

---

## [GET] /api/comentarios/:posteoId/comentarios

**Descripción:** Lista paginada de comentarios activos de un posteo, con el autor poblado (`nombre_completo`, `imagen_perfil`, `url`). Orden: más recientes primero (por `_id` descendente).
**Archivo de ruta:** `routes/comentarios.js:28`
**Controlador:** `controllers/comentarios.js` — `obtenerComentarios` (línea 119)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `check('posteoId')` → `check('page'|'limite'|'limit').optional().isNumeric()` → `validarCampos` → `validarIdPosteo` → `obtenerComentarios`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | ObjectId | Sí | `isMongoId()`; `"El ID del posteo no es válido"` → 422 |
| query | `page` | number | No (default 1) | `optional().isNumeric()`; `"La página debe ser numérica"` → 422. Clamp mínimo 1 |
| query | `limite` | number | No (default **10**) | `optional().isNumeric()`; `"El límite debe ser numérico"` → 422. Clamp 1–**100** |
| query | `limit` | number | No | Alias; `"El límite debe ser numérico"` → 422 |

### Ejemplo de request
```http
GET /api/comentarios/6650d4a1f0c2a3b4c5d6e7f8/comentarios?page=1&limite=10
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
    "page": 1, "limit": 10, "total": 1, "totalPages": 1,
    "next": "/api/comentarios/6650d4a1f0c2a3b4c5d6e7f8/comentarios/?page=2&limite=10",
    "prev": null
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del posteo no es válido" / "La página debe ser numérica" / "El límite debe ser numérico" | `routes/comentarios.js:30-33` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener comentarios" | `controllers/comentarios.js:182` |

### Notas para el Frontend
- Default `limite` **10** en esta ruta (en posteos y favoritos es 15; en notificaciones, 20). No asumas un valor.
- `limite` se limita a 100 en silencio (sin error).
- `next` incluye una barra final antes del `?` (`/comentarios/?page=…`): Express la acepta; no la quites si concatenas.
- `autorId` puede ser `null` si el usuario autor ya no existe.

---

## [GET] /api/comentarios/:posteoId/comentarios/count

**Descripción:** Número de comentarios de un posteo, leído del contador `comentariosCount` (no cuenta documentos).
**Archivo de ruta:** `routes/comentarios.js:38`
**Controlador:** `controllers/comentarios.js` — `obtenerCountComentarios` (línea 186)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `check('posteoId').isMongoId()` → `validarCampos` → `validarIdPosteo` → `obtenerCountComentarios`.
- Rate limiter: **ninguno**.

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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del posteo no es válido" | `routes/comentarios.js:40` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 404 | `NOT_FOUND` | Resource Not Found | "El posteo no existe" (defensivo) | `controllers/comentarios.js:197` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener contador" | `controllers/comentarios.js:205` |

### Notas para el Frontend
- El valor viene del contador denormalizado: puede diferir del número real si una operación previa falló a medias (derivado del código).

---

## [DELETE] /api/comentarios/:comentarioId

**Descripción:** Elimina lógicamente un comentario (`isDeleted: true`, `deleteReason: "manual"`) y decrementa el contador del posteo. Puede hacerlo el autor del comentario o el dueño del posteo.
**Archivo de ruta:** `routes/comentarios.js:45`
**Controlador:** `controllers/comentarios.js` — `eliminarComentario` (línea 209)

### Autenticación y permisos
- Requiere token: **Sí**. Autor del comentario **o** dueño del posteo.
- Cadena de middlewares: `verificarTokenSesion` → `check('comentarioId').isMongoId()` → `validarCampos` → `eliminarComentario`.
- **No** aplica `validarIdPosteo`.
- Rate limiter: **ninguno**.

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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del comentario no es válido" | `routes/comentarios.js:47` |
| 400 | `BAD_REQUEST` | Bad Request | "El comentario ya fue eliminado" (carrera o eliminado previamente) | `controllers/comentarios.js:225,267` |
| 404 | `NOT_FOUND` | Resource Not Found | "El comentario no existe" | `controllers/comentarios.js:226` |
| 404 | `NOT_FOUND` | Resource Not Found | "El posteo asociado no existe" | `controllers/comentarios.js:234` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes permisos para eliminar este comentario" | `controllers/comentarios.js:242` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al eliminar comentario" | `controllers/comentarios.js:274` |

### Notas para el Frontend
- 400 "ya fue eliminado" y 404 "no existe" son casos distintos. Si recibes 400, trátalo como éxito.
- No devuelve el comentario ni el contador actualizado.

---

## [PUT] /api/comentarios/:posteoId/comentarios/toggle

**Descripción:** Activa o desactiva los comentarios de un posteo. Solo el dueño del posteo puede hacerlo.
**Archivo de ruta:** `routes/comentarios.js:51`
**Controlador:** `controllers/comentarios.js` — `toggleComentariosPosteo` (línea 278)

### Autenticación y permisos
- Requiere token: **Sí**. Solo el **dueño del posteo**.
- Cadena de middlewares: `verificarTokenSesion` → `check('posteoId')` → `check('activar').isBoolean({strict: true})` → `validarCampos` → `validarIdPosteo` → `toggleComentariosPosteo`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | ObjectId | Sí | `isMongoId()`; `"El ID del posteo no es válido"` → 422 |
| body | `activar` | boolean | Sí | `isBoolean({strict: true})`; `"El campo activar debe ser un booleano"`. **Ver nota: la opción `strict` no existe en `validator`** |

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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del posteo no es válido" / "El campo activar debe ser un booleano" | `routes/comentarios.js:53-54` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` | `helpers/validar-id-posteo.js:19,23,30` |
| 403 | `FORBIDDEN` | Forbidden | "Solo el dueño del posteo puede modificar los comentarios" | `controllers/comentarios.js:293` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al modificar comentarios" | `controllers/comentarios.js:304` |

### Notas para el Frontend
- ⚠ **Envía siempre un booleano JSON real (`true`/`false`).** El validador acepta strings (`"true"`, `"false"`, `"1"`, `"0"`) porque `isBoolean` ignora `strict` (verificado con `validator` 13.15.35: `isBoolean("1", {strict:true}) === true`). El controlador compara `activar === true`: **`"true"` desactiva los comentarios**, `1` también los desactiva, y la respuesta sigue siendo 200 con el mensaje contrario a lo pedido.
- El frontend debe mandar booleanos y verificar `data.comentariosActivos` en la respuesta.

---

## Hallazgos de este dominio (resumen)

- **Toggle de comentarios con strings** (ver arriba): inconsistencia entre validador y controlador.
- **Respuesta 201 + error posterior** en el alta de comentarios (ver notas de `POST`).
