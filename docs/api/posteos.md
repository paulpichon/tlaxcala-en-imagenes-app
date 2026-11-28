# Posteos (`/api/posteos`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:130`. Modelo: `models/Posteo.js`. Serialización (lista blanca, sin `secure_url`, `isDeleted`, `deleteReason`, `deletedAt`, `__v`): `helpers/serializar-posteo.js:6-41`.

**Reglas transversales de este dominio:**
- **Visibilidad:** `publico` (en el feed) o `perfil` (solo en el perfil del autor; el link directo exige sesión → 401).
- **Ocultamiento por moderación (`ocultoPorModeracion`):** para cualquiera que no sea el autor, el posteo responde `404` (`helpers/validar-id-posteo.js:26-32`) y no aparece en listados.
- **Reportados:** un posteo que el usuario autenticado reportó deja de aparecer en su feed y perfil (`controllers/posteos.js:71-78`, `:229-235`).
- **Texto:** regex Unicode y límite de 500 unidades UTF-16 (`middlewares/validar-texto.js`).
- **Coordenadas:** redondeadas a 3 decimales (`helpers/redondear-coordenadas.js`).

> **Ejemplos:** todos los ejemplos son **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [GET] /api/posteos

**Descripción:** Feed público de posteos de otros usuarios: `visibilidad: 'publico'`, no eliminados, no ocultados por moderación, excluyendo los reportados por el visitante y los del propio usuario. Permite filtrar por municipio y localidad. Orden: `fecha_creacion` descendente.
**Archivo de ruta:** `routes/posteos.js:32`
**Controlador:** `controllers/posteos.js` — `posteosGet` (línea 44)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`).
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `feedUsuarioLimiter` → validadores de query → `validarCampos` → `posteosGet`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / **3000** por IP (env `FLOOD_LECTURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `feedUsuarioLimiter` (`middlewares/rate-limiter.js:309-314`), 15 min / 200 por usuario, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | `page` | number | No (default 1) | `optional().isInt({min:1, max:1000})`; `"El parametro PAGE debe ser un numero entre 1 y 1000"` → 422 |
| query | `limite` | number | No (default 15) | `optional().isInt({min:1, max:50})`; `"El parametro LIMITE debe ser un numero entre 1 y 50"` → 422. **Máx. 50** |
| query | `limit` | number | No | Alias de `limite`; `isInt({min:1, max:50})` (mensaje `"El parametro LIMIT debe ser un numero entre 1 y 50"`) |
| query | `municipio` | ObjectId | No | `optional({values:'falsy'}).isMongoId()`; `"El parametro MUNICIPIO debe ser un ID valido"` → 422 |
| query | `localidadClave` | string | No | `optional({values:'falsy'}).matches(/^\d{4}$/)`; `"El parametro LOCALIDADCLAVE debe ser una clave INEGI de 4 digitos"` → 422. **Requiere `municipio`** (400 si falta) |

### Ejemplo de request
```http
GET /api/posteos?page=2&limite=15&municipio=6650c3…&localidadClave=0024
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
      "_id": "6650d4…",
      "_idUsuario": {
        "_id": "6650a1…",
        "nombre_completo": { "nombre": "Ana", "apellido": "López" },
        "imagen_perfil": { "public_id": "…" },
        "url": "ana-lopez-3f9a1"
      },
      "public_id": "…",
      "texto": "Fiesta en Apizaco 🎉",
      "ubicacion": {
        "ciudad": null,
        "municipio": "6650c3…",
        "localidadClave": "0024",
        "localidadNombre": "Apizaco",
        "estado": null,
        "pais": "México",
        "coordinates": { "type": "Point", "coordinates": [-98.147, 19.417] },
        "esExacta": true
      },
      "fecha_creacion": "2026-10-20T15:00:00.000Z",
      "comentariosActivos": true,
      "isFollowing": false,
      "isFavorito": false,
      "likesCount": 4,
      "hasLiked": false,
      "totalComentarios": 2
    }
  ],
  "pagination": {
    "page": 2, "limit": 15, "total": 31, "totalPages": 3,
    "next": "/api/posteos?page=3&limite=15",
    "prev": "/api/posteos?page=1&limite=15"
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:309-314` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:270-279` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" / "Sesión expirada - inicia sesión nuevamente" | `middlewares/validar-jwt-cookies-sesion.js:60,34,52` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | Mensajes de `routes/posteos.js:38-43` | `middlewares/validar-campos.js:28` |
| 400 | `BAD_REQUEST` | Bad Request | "Para filtrar por localidad debe indicarse tambien el municipio" | `controllers/posteos.js:70` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al obtener los posteos de usuarios, contactar a soporte." (cualquier error de consulta; incluye `skip` negativo) | `controllers/posteos.js:176` |

### Notas para el Frontend
- `localidadClave` sin `municipio` → **400** (no 422). Envía siempre el par.
- **Tope de paginación:** `page` se limita a 1–1000 y `limite`/`limit` a 1–50 (`isInt`). Un valor fuera de rango responde `422 VALIDATION_FAILED`; nunca dispara una query masiva.
- ⚠ `limite=0` ya no llega a Mongo: lo rechaza el validador (mínimo 1).
- La respuesta no incluye `visibilidad` (no está en la proyección de esta ruta) ni `ocultoPorModeracion`. Todos los elementos son `publico` por construcción.
- `_idUsuario` viene poblado (`nombre_completo`, `imagen_perfil.public_id`, `url`).
- Los enlaces `next`/`prev` son relativos y solo conservan `page` y `limite`; **conservar `municipio` y `localidadClave` al seguirlos** (no se incluyen en los enlaces).

---

## [GET] /api/posteos/post/:id

**Descripción:** Detalle de un posteo, **público**: sin sesión funciona para posteos `publico`. Con sesión añade `isFollowing`, `isFavorito` y `hasLiked`. Para `visibilidad: 'perfil'` sin sesión responde 401.
**Archivo de ruta:** `routes/posteos.js:49`
**Controlador:** `controllers/posteos.js` — `posteoGet` (línea 180). Middleware de carga: `helpers/validar-id-posteo.js:14` (`validarIdPosteo`).

### Autenticación y permisos
- Requiere token: **No** (opcional). Si hay cookie `accessToken` válida, personaliza la respuesta.
- Cadena de middlewares: `posteoPublicoLimiter` → `verificarTokenSesionOpcional` → `check('id').isMongoId()` → `validarCampos` → `validarIdPosteo` → `posteoGet`.
- Rate limiter: `posteoPublicoLimiter` (`middlewares/rate-limiter.js:210`), 15 min / 100, código `POST_DETAIL_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID no es valido"` → 422 |

### Ejemplo de request
```http
GET /api/posteos/post/6650d4a1f0c2a3b4c5d6e7f8
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
- Con sesión (`controllers/posteos.js:204-225`):
```json
{
  "success": true,
  "data": {
    "posteo": {
      "_id": "6650d4…",
      "_idUsuario": { "_id": "6650a1…", "nombre_completo": { "nombre": "Ana", "apellido": "López" }, "imagen_perfil": { "public_id": "…" }, "url": "ana-lopez-3f9a1" },
      "public_id": "…",
      "texto": "Fiesta en Apizaco 🎉",
      "ubicacion": null,
      "visibilidad": "publico",
      "fecha_creacion": "2026-10-20T15:00:00.000Z",
      "fecha_actualizacion": null,
      "comentariosActivos": true,
      "comentariosCount": 2,
      "ocultoPorModeracion": false,
      "likesCount": 4,
      "hasLiked": false
    },
    "isFollowing": true,
    "isFavorito": false
  }
}
```
- Sin sesión: `data` solo trae `posteo` (sin `isFollowing`, `isFavorito` ni `hasLiked`).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `POST_DETAIL_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:213-218` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/posteos.js:52` + `middlewares/validar-campos.js:28` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Inicia sesión para ver este posteo" (`visibilidad: 'perfil'` sin sesión) | `controllers/posteos.js:188` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> ha sido eliminado` | `helpers/validar-id-posteo.js:19` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> no existe` | `helpers/validar-id-posteo.js:23` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> no existe` (oculto por moderación y el visitante no es el autor) | `helpers/validar-id-posteo.js:30` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al obtener el posteo por ID, contactar a soporte." | `controllers/posteos.js:230` |

### Notas para el Frontend
- Los 404 de moderación y de eliminación tienen el **mismo status** que "no existe" (es deliberado). Trata 404 como "no disponible".
- **401 significa "pide iniciar sesión"**, no sesión caducada del sistema: muestra el login y, al volver, repite la petición.
- Si la sesión existe pero el usuario tiene `estatus 0` o no verificado, el middleware lo trata como anónimo → 401 para `perfil`.
- El autor de un posteo oculto **sí** lo ve; su respuesta trae `ocultoPorModeracion: true` (badge "En revisión").
- `isFavorito`, `isFollowing` y `hasLiked` solo existen con sesión. No asumas `false` cuando faltan.
- Rate limit de 100 por 15 min por IP: afecta a páginas públicas compartidas.

---

## [GET] /api/posteos/usuario/:idUsuario

**Descripción:** Posteos del perfil de un usuario, incluidos los de `visibilidad: 'perfil'` (comunidad abierta: cualquier visitante autenticado los ve). Excluye los ocultados por moderación para quien no es el dueño, y los reportados por el visitante. Devuelve solo `public_id`, `visibilidad` y `ocultoPorModeracion` además de los contadores de likes.
**Archivo de ruta:** `routes/posteos.js:59`
**Controlador:** `controllers/posteos.js` — `posteosUsuarioGet` (línea 234)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `feedUsuarioLimiter` → `check('idUsuario').isMongoId()` → `check('page'|'limite'|'limit').optional().isInt({min:1, max:50})` → `validarCampos` → `validarIdUsuario` (`helpers/validar-id-usuario.js:4`) → `posteosUsuarioGet`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / **3000** por IP (env `FLOOD_LECTURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `feedUsuarioLimiter` (`middlewares/rate-limiter.js:309-314`), 15 min / 200 por usuario, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `idUsuario` | ObjectId | Sí | `isMongoId()`; `"El ID no es valido"` → 422 |
| query | `page` | number | No (default 1) | `optional().isInt({min:1, max:1000})` → 422 |
| query | `limite` | number | No (default 15) | `optional().isInt({min:1, max:50})` → 422. **Máx. 50** |
| query | `limit` | number | No | Alias; `isInt({min:1, max:50})` |

### Ejemplo de request
```http
GET /api/posteos/usuario/6650a1f0c2a3b4c5d6e7f8a9?page=1&limite=15
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "data": [
    { "_id": "6650d4…", "public_id": "…", "visibilidad": "perfil", "ocultoPorModeracion": false, "likesCount": 1, "hasLiked": false, "totalComentarios": 0 }
  ],
  "pagination": { "page": 1, "limit": 15, "total": 1, "totalPages": 1, "next": null, "prev": null }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:309-314` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:270-279` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" / "El parametro PAGE debe ser de tipo numerico" / … | `routes/posteos.js:65-69` + `middlewares/validar-campos.js:28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID <id> no existe en la BD` (usuario inexistente o `estatus: 4`) | `helpers/validar-id-usuario.js:10` |
| 404 | `NOT_FOUND` | Resource Not Found | `El usuario con ID <id> no está activo` (`estatus: 0` y no verificado) | `helpers/validar-id-usuario.js:14` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al obtener los Posteos, contactar a soporte." (incluye `page` ≤ 0 → `skip` negativo) | `controllers/posteos.js:339` |

### Notas para el Frontend
- Este listado **no** incluye `texto`, `ubicacion` ni `fecha_creacion`. Para el detalle usa `GET /api/posteos/post/:id`.
- Usa `visibilidad` para ocultar la acción "compartir" cuando sea `perfil`.
- `ocultoPorModeracion` solo es `true` en tu propio perfil. Para otros perfiles, los ocultos no aparecen.
- `isDeleted` y `secure_url` no se devuelven.
- Tope de paginación igual que el feed: `page` 1–1000 y `limite`/`limit` 1–50.
- `next`/`prev` conservan la ruta del perfil (`basePath` con el id).

---

## [POST] /api/posteos

**Descripción:** Crea un posteo con imagen (obligatoria), texto opcional, visibilidad y ubicación opcional. La imagen se sube a Cloudinary sin transformaciones. Si la subida tiene éxito pero `save()` falla, se destruye la imagen huérfana en Cloudinary.
**Archivo de ruta:** `routes/posteos.js:75`
**Controlador:** `controllers/posteos.js` — `posteosPost` (línea 346)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`).
- Cadena de middlewares, en orden:
  1. `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282`)
  2. `verificarTokenSesion`
  3. `posteoUsuarioLimiter` (`middlewares/rate-limiter.js:349`)
  4. `upload.single('img')` (`helpers/multer.js`)
  5. `validarCampoImg` (`middlewares/validar-imagen-posteo.js:16`)
  6. `validarImagenesMulter` (`:25`)
  7. `validarTexto` (`middlewares/validar-texto.js:81`)
  8. `check('visibilidad').optional().isIn(['publico','perfil'])`
  9. `check('lat'|'lng').optional({values:'falsy'}).isFloat()`
  10. `check('municipio').optional({values:'falsy'}).isMongoId()`
  11. `check('localidadClave').optional({values:'falsy'}).matches(/^\d{4}$/)`
  12. `validarCampos` → `posteosPost`
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `posteoUsuarioLimiter`, 15 min / 20, código `POSTEO_BLOCKED`.

### Parámetros de entrada
Formato: **`multipart/form-data`**.

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body (archivo) | `img` | archivo | **Sí** | Campo exacto `img`; `.jpg/.jpeg/.png/.webp`; MIME `image/jpeg\|png\|webp`; máx. 8 MB |
| body | `texto` | string | No | `validarTexto`: `optional({checkFalsy, nullable})`, `trim()`, regex `^[\p{L}\p{N}\p{P}\p{S}\p{M}\p{Z}\t\n\r\u200D\uFE0F\uFE0E]*$` (flag `u`), `isLength({max: 500})`, **solo enlaces de Google Maps** (`errors[].code: "URL_NOT_ALLOWED"`, `helpers/enlaces-permitidos.js`). Mensajes por campo: `"El campo de texto contiene caracteres no permitidos."`, `"El texto no puede exceder 500 caracteres."`, `"Solo se permiten enlaces de Google Maps (https://maps.app.goo.gl/...)."` |
| body | `visibilidad` | string | No (default `publico`) | `optional().isIn(['publico','perfil'])`; `'La visibilidad debe ser "publico" o "perfil"'` |
| body | `lat` | number | No | `optional({values:'falsy'}).isFloat()`; `"La latitud debe ser un número"` |
| body | `lng` | number | No | `optional({values:'falsy'}).isFloat()`; `"La longitud debe ser un número"` |
| body | `municipio` | ObjectId | No | `optional({values:'falsy'}).isMongoId()`; `"El campo municipio debe ser un ID valido"` |
| body | `localidadClave` | string | No | `optional({values:'falsy'}).matches(/^\d{4}$/)`; `"La clave de la localidad debe ser una clave INEGI de 4 digitos"` |
| body | `ciudad`, `estado`, `pais` | string | No | **Sin validación**. `pais` se guarda como `"México"` si no viene |

Reglas de ubicación (`controllers/posteos.js:388-411`):
- Se crea `ubicacion` solo si hay `municipio` o `lat && lng`.
- `localidadClave` se resuelve contra el catálogo del municipio (`controllers/posteos.js:27-39`). **Sin `municipio` se ignora sin error.**
- `coordinates` solo si `lat && lng`, redondeadas a 3 decimales: `[lng, lat]`. Si no, `null`.
- `esExacta = !!(lat && lng)`.

### Ejemplo de request
```http
POST /api/posteos
Content-Type: multipart/form-data; boundary=----X
Cookie: accessToken=…

------X
Content-Disposition: form-data; name="img"; filename="foto.jpg"
Content-Type: image/jpeg

<bytes>
------X
Content-Disposition: form-data; name="texto"

Fiesta en Apizaco 🎉
------X
Content-Disposition: form-data; name="visibilidad"

publico
------X
Content-Disposition: form-data; name="municipio"

6650c3f0c2a3b4c5d6e7f8a9
------X
Content-Disposition: form-data; name="localidadClave"

0024
------X--
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: **`201`**
```json
{
  "success": true,
  "msg": "Posteo creado correctamente",
  "data": {
    "posteo": {
      "_id": "6650d4…",
      "_idUsuario": { "_id": "6650a1…", "nombre_completo": { "nombre": "Ana", "apellido": "López" }, "imagen_perfil": { "public_id": "…" }, "url": "ana-lopez-3f9a1" },
      "public_id": "…",
      "texto": "Fiesta en Apizaco 🎉",
      "ubicacion": {
        "ciudad": null,
        "municipio": "6650c3f0c2a3b4c5d6e7f8a9",
        "localidadClave": "0024",
        "localidadNombre": "Apizaco",
        "estado": null,
        "pais": "México",
        "coordinates": null,
        "esExacta": false
      },
      "visibilidad": "publico",
      "fecha_creacion": "2026-10-27T19:10:34.000Z",
      "comentariosActivos": true,
      "comentariosCount": 0,
      "ocultoPorModeracion": false
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `POSTEO_BLOCKED` | Rate Limit Exceeded | "Demasiadas publicaciones, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:349-354` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 404 | `NOT_FOUND` | Resource Not Found | "No hay ninguna imagen para subir" | `middlewares/validar-imagen-posteo.js:19` |
| 400 | `BAD_REQUEST` | Bad Request | "La imagen excede el tamaño máximo permitido (8 MB)" | `middlewares/validar-imagen-posteo.js:7,27` |
| 400 | `BAD_REQUEST` | Bad Request | `Campo de archivo no esperado: "img"` | `middlewares/validar-imagen-posteo.js:12,27` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Ocurrió un error inesperado…" (extensión o MIME no permitidos) | `helpers/multer.js:22,27` → `middlewares/error-handler.js:108-118` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El campo de texto contiene caracteres no permitidos" (`errors[].message`: texto no permitido, longitud > 500, o "Solo se permiten enlaces de Google Maps (https://maps.app.goo.gl/...)." con `errors[].code: "URL_NOT_ALLOWED"`) | `middlewares/validar-texto.js:73` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `La visibilidad debe ser "publico" o "perfil"` | `routes/posteos.js:91` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La latitud debe ser un número" / "La longitud debe ser un número" | `routes/posteos.js:95-96` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El campo municipio debe ser un ID valido" / "La clave de la localidad debe ser una clave INEGI de 4 digitos" | `routes/posteos.js:98-99` |
| 400 | `BAD_REQUEST` | Bad Request | "El municipio indicado no existe" | `controllers/posteos.js:31` |
| 400 | `BAD_REQUEST` | Bad Request | "La localidad no pertenece al municipio seleccionado" | `controllers/posteos.js:36` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error interno al procesar la publicación" (incluye Cloudinary y `save()`) | `controllers/posteos.js:456` |

### Notas para el Frontend
- Respuesta **`201`** (es el único alta de posteo con 201).
- Errores de texto: el `detail` es siempre "El campo de texto contiene caracteres no permitidos", incluso cuando el problema es la longitud. Usa `errors[].message` para mostrar el motivo exacto.
- Enlaces: solo se aceptan URLs de Google Maps en `texto` (misma regla que comentarios, `helpers/enlaces-permitidos.js`); otra URL → 422 con `errors[].code: "URL_NOT_ALLOWED"`.
- ⚠ **Archivo de tipo no permitido → 500**, no 400 (ver [uploads.md](uploads.md) para el detalle). Valida extensión y tamaño en el cliente.
- Envía `municipio` y `localidadClave` **juntos**. `localidadClave` sin `municipio` se ignora en silencio (no hay error).
- Envía `lat` y `lng` solo cuando la ubicación venga de GPS. Si mandas ambos junto con `municipio`, el backend guarda `coordinates` (no aplica automáticamente la "Regla de Oro" de AGENTS.md: depende del cliente).
- `coordinates` se guarda redondeado a 3 decimales (~110 m).
- `visibilidad` por defecto es `publico`.
- Si la subida a Cloudinary ocurre pero el guardado falla, el backend borra la imagen huérfana; el cliente recibe 500 y no debe reintentar sin cambios.
- **Difusión `nueva_publicacion` (2026-11-25, Fase 6):** si el posteo se crea con `visibilidad: "publico"`, **después de responder** se notifica a los seguidores que activaron `push.nueva_publicacion` (in-app + push, **sin correo**), best-effort y por lotes (`controllers/posteos.js:435-439`; `helpers/difundir-publicacion.js:134-205`). **No cambia el contrato de la respuesta** ni puede hacerla fallar (`trasResponder`). Topes: una difusión cada 60 min por autor y 10 avisos de este tipo en 24 h por receptor. Un posteo `visibilidad: "perfil"` **no** difunde, y editar de `perfil` a `publico` (`PUT /api/posteos/:id`) tampoco difunde.

---

## [PUT] /api/posteos/:id

**Descripción:** Edición parcial del texto, la visibilidad y la ubicación de un posteo propio. **No cambia la imagen.** Los campos de ubicación, si se envían, reemplazan la ubicación completa. Para quitarla usa `DELETE /api/posteos/:id/ubicacion`.
**Archivo de ruta:** `routes/posteos.js:104`
**Controlador:** `controllers/posteos.js` — `posteosPut` (línea 460)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `posteoUsuarioLimiter` → `check('id').isMongoId()` → `validarTexto` → `visibilidad` → `lat`/`lng` → `municipio`/`localidadClave` → `validarCampos` → `validarIdPosteo` → `posteosPut`.
- La propiedad se verifica en la consulta (`findOneAndUpdate` con `_idUsuario`), no en un middleware (`controllers/posteos.js:525-532`).
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `posteoUsuarioLimiter`, 15 min / 20, código `POSTEO_BLOCKED`.

### Parámetros de entrada
Formato: **JSON** (`Content-Type: application/json`); no acepta archivos.

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID no es valido"` → 422 |
| body | `texto` | string | No | Igual que en `POST /api/posteos` (incluida la regla de **solo enlaces de Google Maps**: otra URL → 422 `URL_NOT_ALLOWED`). `""` es válido y **borra** el texto |
| body | `visibilidad` | string | No | `isIn(['publico','perfil'])` |
| body | `municipio` | ObjectId | No | `optional({values:'falsy'}).isMongoId()` |
| body | `localidadClave` | string | No | `optional({values:'falsy'}).matches(/^\d{4}$/)` |
| body | `lat`, `lng` | number | No | `optional({values:'falsy'}).isFloat()` |
| body | `ciudad`, `estado`, `pais` | string | No | Sin validación |

Reglas (`controllers/posteos.js:488-521`): la ubicación se reemplaza solo si llega al menos uno de `municipio`, `ciudad`, `estado`, `lat`, `lng` con valor no vacío. `localidadClave` solo no basta.

### Ejemplo de request
```http
PUT /api/posteos/6650d4a1f0c2a3b4c5d6e7f8
Content-Type: application/json
Cookie: accessToken=…

{ "texto": "Fiesta en Apizaco, ¡gracias a todos!", "visibilidad": "perfil" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Posteo actualizado correctamente",
  "data": {
    "posteo": {
      "_id": "6650d4…",
      "_idUsuario": { "_id": "6650a1…", "nombre_completo": { "nombre": "Ana", "apellido": "López" }, "imagen_perfil": { "public_id": "…" }, "url": "ana-lopez-3f9a1" },
      "public_id": "…",
      "texto": "Fiesta en Apizaco, ¡gracias a todos!",
      "ubicacion": null,
      "visibilidad": "perfil",
      "fecha_creacion": "2026-10-20T15:00:00.000Z",
      "fecha_actualizacion": "2026-10-27T19:10:34.000Z",
      "comentariosActivos": true,
      "comentariosCount": 2,
      "ocultoPorModeracion": false
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `POSTEO_BLOCKED` | Rate Limit Exceeded | "Demasiadas publicaciones, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:349-354` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El campo de texto contiene caracteres no permitidos" (`errors[].message` detalla; incluye "Solo se permiten enlaces de Google Maps (https://maps.app.goo.gl/...)." con `errors[].code: "URL_NOT_ALLOWED"` si `texto` trae un enlace fuera de Google Maps) | `middlewares/validar-texto.js:73` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `La visibilidad debe ser "publico" o "perfil"` · "La latitud…" · "La longitud…" · "El campo municipio…" · "La clave de la localidad…" | `routes/posteos.js:114-121` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> ha sido eliminado` | `helpers/validar-id-posteo.js:19` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> no existe` | `helpers/validar-id-posteo.js:23,30` |
| 400 | `BAD_REQUEST` | Bad Request | "El municipio indicado no existe" / "La localidad no pertenece al municipio seleccionado" | `controllers/posteos.js:31,36` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes permiso para modificar este posteo." (no es el autor o el posteo se eliminó en el intervalo) | `controllers/posteos.js:536` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al actualizar el posteo. Verifica los datos enviados." | `controllers/posteos.js:551` |

### Notas para el Frontend
- **403 vs 404:** 404 indica que el posteo no está disponible (eliminado u oculto para ti); 403 indica que existe pero no es tuyo.
- Enlaces: misma regla que `POST /api/posteos` — solo URLs de Google Maps en `texto` (`helpers/enlaces-permitidos.js`); otra URL → 422 con `errors[].code: "URL_NOT_ALLOWED"`.
- Un PUT sin campos devuelve `200` y solo actualiza `fecha_actualizacion`.
- Para borrar el texto envía `"texto": ""` (queda `""`).
- Para quitar la ubicación no envíes nulls: usa `DELETE /api/posteos/:id/ubicacion`.
- Un posteo oculto por moderación **sí** se puede editar (es el autor). La respuesta trae `ocultoPorModeracion: true`.
- La imagen no se cambia en este endpoint. Para una imagen distinta, elimina y crea un posteo nuevo.

---

## [DELETE] /api/posteos/:id/ubicacion

**Descripción:** Quita la ubicación de un posteo propio (`ubicacion: null`). El posteo y su imagen permanecen.
**Archivo de ruta:** `routes/posteos.js:129`
**Controlador:** `controllers/posteos.js` — `posteoUbicacionDelete` (línea 580)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `posteoUsuarioLimiter` → `check('id').isMongoId()` → `validarCampos` → `validarIdPosteo` → `posteoUbicacionDelete`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `posteoUsuarioLimiter`, 15 min / 20, código `POSTEO_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID no es valido"` → 422 |

### Ejemplo de request
```http
DELETE /api/posteos/6650d4a1f0c2a3b4c5d6e7f8/ubicacion
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Ubicación eliminada correctamente",
  "data": { "posteo": { "_id": "6650d4…", "ubicacion": null, "visibilidad": "publico", "texto": "…" } }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `POSTEO_BLOCKED` | Rate Limit Exceeded | "Demasiadas publicaciones, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:349-354` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/posteos.js:135` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> ha sido eliminado` / `no existe` | `helpers/validar-id-posteo.js:19,23,30` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes permiso para modificar este posteo." | `controllers/posteos.js:591` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al eliminar la ubicación del posteo, contactar a soporte." | `controllers/posteos.js:597` |

### Notas para el Frontend
- Endpoint dedicado: la intención de "quitar ubicación" es explícita. No se consigue enviando nulls en el `PUT`.
- La respuesta incluye el posteo completo, con `ubicacion: null`.

---

## [DELETE] /api/posteos/:id

**Descripción:** Eliminación lógica de un posteo propio (`isDeleted: true`, `deleteReason: 'manual'`, `deletedAt`). Un cron posterior puede hacer el borrado físico (**[REQUIERE VERIFICACIÓN MANUAL]**: no revisado en esta corrida).
**Archivo de ruta:** `routes/posteos.js:141`
**Controlador:** `controllers/posteos.js` — `posteosDelete` (línea 555)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `posteoUsuarioLimiter` → `check('id').isMongoId()` → `validarCampos` → `validarIdPosteo` → `posteosDelete`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `posteoUsuarioLimiter`, 15 min / 20, código `POSTEO_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID no es valido"` → 422 |

### Ejemplo de request
```http
DELETE /api/posteos/6650d4a1f0c2a3b4c5d6e7f8
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Posteo con imagen eliminado correctamente" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `POSTEO_BLOCKED` | Rate Limit Exceeded | "Demasiadas publicaciones, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:349-354` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:282-291` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID no es valido" | `routes/posteos.js:147` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> ha sido eliminado` / `no existe` | `helpers/validar-id-posteo.js:19,23,30` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes permiso para eliminar este posteo." | `controllers/posteos.js:568` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al eliminar el Posteo, contactar a soporte." | `controllers/posteos.js:574` |

### Notas para el Frontend
- No devuelve `data`.
- Tras eliminar, la siguiente petición al mismo id devuelve 404 "ha sido eliminado".
- La imagen de Cloudinary no se borra en este endpoint (solo se marca el documento).
- Los comentarios, likes y favoritos ligados al posteo no se modifican aquí (**[REQUIERE VERIFICACIÓN MANUAL]** si el cron los limpia).
