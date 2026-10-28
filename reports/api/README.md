# Documentación de Endpoints — TlaxApp API

**Generado:** 2026-10-27 19:10:34
**Total de endpoints documentados:** 80 (red social: 55 · panel de administración: 25)
**Archivos de rutas explorados:**
- Red social (`routes/`): `bienvenida.js`, `auth.js`, `usuarios.js`, `uploads.js`, `posteos.js`, `likes.js`, `followers.js`, `favoritos.js`, `municipios.js`, `ubicacion.js`, `notificaciones.js`, `comentarios.js`, `reportes.js`, `soporte.js`, `earlyaccess.js`
- Panel (`admin/routes/`): `index.js`, `moderacion.js`, `influencers.js`
- Montaje: `models/server.js` (líneas 122–139 y 137 para `admin`)
- Controladores, middlewares, helpers, errores, modelos y limiters leídos (ver citas en cada archivo de dominio).

**Endpoints no verificables completamente:**
- Ejecución real de todos los flujos: no se levantó el servidor (requiere MongoDB, Cloudinary, SMTP y variables de entorno). Todos los ejemplos son **construidos a partir del esquema** y están etiquetados como tales.
- Comportamiento de Cloudinary (respuestas de subida/borrado) y de Web Push (códigos 404/410 de proveedores externos) → **[REQUIERE VERIFICACIÓN MANUAL]**.
- Valores reales de variables de entorno (`ACCESS_TOKEN_EXPIRY`, `JWT_SEED`, `NODE_ENV`, `ADMIN_FRONTEND_URL`, `CSRF_ALLOWED_ORIGINS`) → **[REQUIERE VERIFICACIÓN MANUAL]**.
- Comportamiento de la cookie de atribución entre dominios (SameSite=Lax) → **[REQUIERE VERIFICACIÓN MANUAL]**.

> **Alcance de esta corrida.** Esta documentación reemplaza la corrida parcial de las 13:36 (`2026-10-27_13-36-09_documentacion-endpoints.md`, que solo documentaba `DELETE /api/v1/admin/influencers/:id`). Ese archivo se **eliminó** al quedar superado por este conjunto (README + dominios).
>
> **Revisión 2026-10-27 (corrección de auth).** Se auditó el sistema de sesiones contra el código y se aplicaron tres cambios: (a) `ACCESS_TOKEN_EXPIRY` pasa a tener default `1h` en código; (b) el `maxAge` de todas las cookies de sesión se deriva del `exp` del JWT (`helpers/vigencia-cookie.js`), de modo que token y cookie no pueden desincronizarse, tampoco en el panel; (c) el icono de Web Push de comentarios ya no cae en un path relativo. Las filas de la tabla de autenticación, los hallazgos H22–H24, I1 e I4 y el archivo `comentarios.md` reflejan el estado nuevo. Los riesgos H22–H24 se **documentan sin corregir** por decisión explícita.
>
> **Delta frente al inventario base** (`reports/api/inventario-endpoints.json`, 80 entradas): se contrastaron método y ruta de los 80 endpoints contra el código. **Sin diferencias de método ni de ruta** (80/80). No se volvió a diffear cada campo del JSON; donde el JSON difiere del código en detalle, se indica en el archivo de dominio correspondiente (por ejemplo, `GET /api/health` devuelve más campos que los listados en el JSON).

---

## Índice de archivos

| Archivo | Dominio | Endpoints |
|---|---|---|
| [bienvenida.md](bienvenida.md) | Raíz y health check | 2 |
| [auth.md](auth.md) | Autenticación de usuarios (verificación, login, recuperación, refresh, logout, me) | 10 |
| [usuarios.md](usuarios.md) | Perfil de usuario (alta, consulta por URL, actualización, baja, nuevos usuarios) | 5 |
| [uploads.md](uploads.md) | Imagen de perfil | 1 |
| [posteos.md](posteos.md) | Posteos (feed, detalle, perfil, alta, edición, eliminación, ubicación) | 7 |
| [likes.md](likes.md) | Likes de posteos | 3 |
| [followers.md](followers.md) | Seguidores / seguidos | 4 |
| [favoritos.md](favoritos.md) | Favoritos | 3 |
| [comentarios.md](comentarios.md) | Comentarios de posteos | 5 |
| [reportes.md](reportes.md) | Reportes de posteos | 1 |
| [municipios-ubicacion.md](municipios-ubicacion.md) | Catálogo de municipios/localidades y geolocalización inversa | 4 |
| [notificaciones.md](notificaciones.md) | Notificaciones in-app y Web Push | 7 |
| [soporte.md](soporte.md) | Ayuda y soporte (correo) | 1 |
| [early-access.md](early-access.md) | Acceso anticipado y captura de atribución de influencers | 2 |
| [admin-auth-totp.md](admin-auth-totp.md) | Panel: login en 2 pasos, sesión, cambio de contraseña y TOTP | 10 |
| [admin-cuentas.md](admin-cuentas.md) | Panel: cuentas de administrador | 3 |
| [admin-moderacion.md](admin-moderacion.md) | Panel: moderación de reportes y ocultamiento de posteos | 7 |
| [admin-influencers.md](admin-influencers.md) | Panel: influencers / early access | 5 |

**Total: 80 endpoints** (red social 55 + panel 25). El conteo por dominio está al final de la tabla de endpoints.

---

## Convenciones globales

### Montaje y orden de middlewares globales (`models/server.js`)

Orden real de registro (aplica antes de cualquier ruta):

1. `helmet` (CSP desactivada; `crossOriginResourcePolicy: cross-origin`) — `models/server.js:75-80`
2. `cors` con `credentials: true` y allow-list — `models/server.js:82-107`
3. `cookieParser()` — `:109`
4. `express.static('public')` — `:111`
5. `express.json()` (límite por defecto de body-parser: **100 kb**) — `:113`
6. `validarOrigen` (CSRF por Origin/Referer en métodos mutantes) — `:115` → `middlewares/validar-origen.js`
7. `traceId` (genera `req.traceId` y el header `X-Trace-Id`) — `:117` → `middlewares/trace-id.js`
8. Rutas (en el orden de la tabla de montaje de `models/server.js:122-139`)
9. 404 catch-all → `NotFoundError` (`code: NOT_FOUND`) — `:142-144`
10. `errorHandler` — `:147`

**Consecuencia:** los errores de CORS y de CSRF se producen **antes** de `traceId`, por lo que su `trace_id` es `"unknown"` y no llevan `X-Trace-Id` (ver §Hallazgos).

### Autenticación

| Ámbito | Cookies | Secreto (variable) | Expiración | Atributos |
|---|---|---|---|---|
| Usuarios — access | `accessToken` | `ACCESS_TOKEN_SECRET` | `ACCESS_TOKEN_EXPIRY`; default en código **`1h`** (`helpers/tokensUtils.js:17`), igual que `.env.example` | `httpOnly`, `secure`, `sameSite: none`, `path: /`, `maxAge` **derivado del `exp`** del JWT (`helpers/tokensUtils.js:35-53`) |
| Usuarios — refresh | `refreshToken` | `REFRESH_TOKEN_SECRET` | `REFRESH_TOKEN_EXPIRY` (default `7d`) | igual (`maxAge` derivado del `exp`). Hash SHA-256 en colección `UserToken` |
| Panel — access | `adminAccessToken` | `ADMIN_ACCESS_TOKEN_SECRET` | `ADMIN_ACCESS_TOKEN_EXPIRY` (default `10m`) | `httpOnly`, `secure`, `sameSite: none`, **`path: /api/v1/admin`**, `maxAge` derivado del `exp` (`admin/helpers/sesiones.js:38-42`) |
| Panel — refresh | `adminRefreshToken` | `ADMIN_REFRESH_TOKEN_SECRET` | `ADMIN_REFRESH_TOKEN_EXPIRY` (default `4h`) | igual; hash en `AdminToken` |
| Panel — preAuth | (body `preAuthToken` o header `x-preauth-token`) | `ADMIN_PREAUTH_SECRET` | `5m` fijo (`admin/helpers/tokens.js:54`) | No abre rutas del panel |
| Atribución | `early_access_atribucion` | `EARLY_ACCESS_ATTR_SECRET` (fallback a `ACCESS_TOKEN_SECRET` **solo fuera de producción**) | 30 días | `httpOnly`, `secure` en prod, **`sameSite: lax`**, `path: /api/early-access` (`helpers/atribucion.js:271-277`) |

**Middlewares de sesión de usuario:**
- `verificarTokenSesion` (`middlewares/validar-jwt-cookies-sesion.js:8-47`): exige cookie `accessToken`; verifica firma; carga `Usuario`; rechaza `estatus === 4` o inexistente; rechaza `estatus === 0` o `email_validated === false` con 403; compara `tokenVersion`. Deja `req.usuario` (ObjectId string).
- `verificarTokenSesionOpcional` (`:51-68`): mismo chequeo, pero **nunca** responde error; si falla deja `req.usuario` sin definir.
- `validarRefreshToken` (`:70-86`): solo verifica la firma de `refreshToken` (acepta expirado) — se usa en `logout`.

**Middlewares de sesión del panel:**
- `verificarSesionAdmin` (`admin/middlewares/verificar-sesion.js:18-43`): cookie `adminAccessToken`; carga `Admin`; 403 si `activo: false`; compara `tokenVersion` (`tv`). Deja `req.admin`.
- `validarPreAuthToken` (`:51-73`): body `preAuthToken` (o header `x-preauth-token`); exige claim `preauth: true`.
- `verificarSesionOPreAuth` (`:84-90`): si viene `preAuthToken` usa ese; si no, la cookie.
- `verificarPermisoAdmin('<recurso>:<acción>')` (`admin/middlewares/verificar-permiso.js:18-29`): 403 si el permiso no está en `Admin.permisos` (o `*`). Catálogo en `admin/helpers/permisos.js:14-41`.

**Roles del panel** (`admin/helpers/permisos.js:44-58`): `SUPERADMIN = ['*']`; `MODERADOR` = `moderacion:leer`, `moderacion:resolver`, `moderacion:descartar`, `moderacion:recategorizar`, `posteos:ocultar`, `posteos:restaurar`. **`MODERADOR` no tiene `influencers:*` ni `cuentas:*`** (el enum `Admin.rol` solo admite `SUPERADMIN` y `MODERADOR`).

### Formato de éxito

Helpers: `helpers/responder.js` (`responder`, `responderPaginado`).

```json
{ "success": true, "msg": "Texto opcional", "data": { ... } }
```

- `msg` solo aparece si el controlador lo pasa; `data` solo si existe.
- **Excepciones al envelope** (no usan `responder`):
  - `GET /` y `GET /api/health` → JSON plano (`controllers/bienvenida.js`).
  - `POST /api/early-access` → `{ "ok": true, "contacto": "...", "msg": "..." }` (`controllers/earlyaccess.js:65-69`), contrato intencional según AGENTS.md.
  - `GET /api/early-access/atribucion` → `204` sin cuerpo.
  - `validarUrlUsuario` (en `GET /api/usuarios/:url`) puede responder `200` con `{ success, msg: "La URL ha cambiado", data: { urlActual, redirect: "permanent" } }` y cabecera `Location` **sin código 301** (`middlewares/validar-url-usuario.js:16-26`).

**Respuesta paginada** (`responderPaginado`, `helpers/responder.js:34-50`):

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1, "limit": 15, "total": 42, "totalPages": 3,
    "next": "/api/posteos?page=2&limite=15",
    "prev": null
  }
}
```

Nota: en las respuestas paginadas **no viene `msg`**. Los enlaces `next`/`prev` son rutas relativas y reconstruyen el query con `page` y `limite`.

### Paginación

- Parámetro canónico: **`limite`**. Alias de compatibilidad: **`limit`** (`req.query.limite ?? req.query.limit`).
- `page` default `1`.
- **Los valores por defecto y los límites NO son uniformes** (ver tabla):

| Endpoint | Default `limite` | Máximo | Cómo se valida |
|---|---|---|---|
| `GET /api/posteos` | 15 | **sin máximo** | `isNumeric()` (422 si no es número) |
| `GET /api/posteos/usuario/:idUsuario` | 15 | **sin máximo** | `isNumeric()` |
| `GET /api/comentarios/:posteoId/comentarios` | **10** | **100** (clamp silencioso) | `isNumeric()` + clamp `Math.min(100, …)` |
| `GET /api/favoritos` | 15 | sin máximo | `isNumeric()` + mínimo 1 (clamp) |
| `GET /api/notificaciones` | **20** | sin máximo | clamp mínimo 1 |
| `GET /api/v1/admin/moderacion/reportes` | 15 | **100** | `isInt({min:1,max:100})` → 422 |
| `GET /api/v1/admin/influencers` | 15 | **100** | `isInt({min:1,max:100})` → 422 |

- En el panel, `page` tiene máximo `10000` (`isInt({max:10000})`, 422 si excede).
- **`limite=0` en `GET /api/posteos` o `/usuario/:id`:** `Number("0")` → `limit(0)` en MongoDB significa "sin límite"; ver §Hallazgos.

### Formato de error (RFC 9457)

Implementado en `middlewares/error-handler.js` y en las clases de `errors/`. Forma real de la respuesta (`errors/app-error.js:40-51`):

```json
{
  "type": "about:blank",
  "title": "Authentication Required",
  "status": 401,
  "detail": "No hay token en la petición",
  "instance": "/api/usuarios/update",
  "code": "UNAUTHORIZED",
  "trace_id": "req_829a8f1b-be1"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `type` | string | Siempre `"about:blank"` |
| `title` | string | Título fijo por clase (tabla abajo) |
| `status` | number | Código HTTP |
| `detail` | string | Mensaje específico. **Para `AppError` se devuelve tal cual, incluso en producción** |
| `instance` | string | `req.originalUrl` |
| `code` | string | Código machine-readable (**en MAYÚSCULAS** en el código real) |
| `trace_id` | string | `req.traceId` (cabecera de cliente `X-Trace-Id` o `req_<uuid12>`) |
| `errors` | array | Solo en validación/conflicto de correo: `[{ field, code, message }]` |
| `retry_after` | number | Solo en `RateLimitError` (segundos) |
| `stack` | string | **Solo con `NODE_ENV=development`** |

**Clases de error del dominio** (`errors/error-classes.js`):

| HTTP | Clase | `code` (real) | `title` | Línea |
|---|---|---|---|---|
| 400 | `BadRequestError` | `BAD_REQUEST` | `Bad Request` | `:14` |
| 401 | `AuthenticationError` | `UNAUTHORIZED` | `Authentication Required` | `:21` |
| 403 | `ForbiddenError` | `FORBIDDEN` | `Forbidden` | `:28` |
| 404 | `NotFoundError` | `NOT_FOUND` | `Resource Not Found` | `:35` |
| 409 | `ConflictError` | `CONFLICT` | `Conflict` | `:42` |
| 410 | `GoneError` (**no se usa en ningún endpoint**) | `GONE` | `Gone` | `:49` |
| 422 | `ValidationError` | `VALIDATION_FAILED` | `Validation Failed` | `:56` |
| 429 | `RateLimitError` | `RATE_LIMIT_EXCEEDED` | `Rate Limit Exceeded` | `:67` |
| 500 | `InternalError` | `INTERNAL_ERROR` | `Internal Server Error` | `:80` |

**Errores generados por el error handler** (`middlewares/error-handler.js`):

| Origen | HTTP | `code` | `title` | Línea |
|---|---|---|---|---|
| Multer `LIMIT_*` (no mapeado) | 400 | `FILE_ERROR` | `File Upload Error` | `:43-58` |
| Error de express-validator (`.array()`) | 422 | `VALIDATION_FAILED` | `Validation Failed` | `:61-77` |
| JSON malformado (`entity.parse.failed`) | 400 | `INVALID_JSON` | `Invalid JSON` | `:80-90` |
| Duplicado Mongo `E11000` (`err.code === 11000`) | 409 | `CONFLICT` (con `errors[0].code = "DUPLICATE_KEY"`) | `Conflict` | `:93-105` |
| Cualquier otro error | 500 | `INTERNAL_ERROR` | `Internal Server Error` | `:108-118` |

Ver §Hallazgos: el catch-all usa `detail` genérico fuera de desarrollo, pero **cualquier `InternalError(error.message)` expone el texto interno** del error.

### Rate limiting

Todos los limiters de la red social usan `validate: false` y responden RFC 9457 con un `code` propio (`middlewares/rate-limiter.js:5-15`). Los de la red social **no incluyen `retry_after`**; sí lo incluyen los `RateLimitError` de los controladores. El almacén es **en memoria por proceso** (`express-rate-limit` por defecto) → **[REQUIERE VERIFICACIÓN MANUAL]** si hay más de una instancia desplegada.

| Limiter | Archivo:línea | Ventana | Máximo | Clave | Código |
|---|---|---|---|---|---|
| `loginLimiter` | `middlewares/rate-limiter.js:19` | 15 min | 5 | IP + correo (fallback IP) | `LOGIN_BLOCKED` |
| `recoveryLimiter` | `:41` | 15 min | 3 | IP | `RECOVERY_BLOCKED` |
| `verificacionLimiter` | `:56` | 15 min | 5 | IP | `VERIFICATION_BLOCKED` |
| `reenvioCorreoLimiter` | `:71` | 5 min | 3 | IP | `EMAIL_BLOCKED` |
| `registroLimiter` | `:86` | 1 h | 3 | IP | `REGISTER_BLOCKED` |
| `posteoLimiter` | `:101` | 15 min | 20 | IP | `POSTEO_BLOCKED` |
| `soporteLimiter` | `:116` | 15 min | 5 | IP | `SOPORTE_BLOCKED` |
| `lecturaLimiter` | `:131` | 15 min | 100 | IP | `READ_BLOCKED` |
| `comentarioLimiter` | `:146` | 1 min | 10 | IP | `COMENTARIO_BLOCKED` |
| `refreshLimiter` | `:161` | 15 min | 10 | IP | `REFRESH_BLOCKED` |
| `posteoPublicoLimiter` | `:176` | 15 min | 100 | IP | `POST_DETAIL_BLOCKED` |
| `imagenPerfilLimiter` | `:191` | 15 min | 10 | IP | `IMAGEN_BLOCKED` |
| `reporteLimiter` | `:206` | 15 min | 10 | IP | `REPORTE_BLOCKED` |
| `EARLY_ACCESS` (POST) | `routes/earlyaccess.js:8` | 10 min (env `EARLY_ACCESS_RATE_LIMIT_WINDOW_MS`) | 5 (env `EARLY_ACCESS_RATE_LIMIT_MAX`) | IP | `EARLY_ACCESS_BLOCKED` |
| `atribucionLimiter` | `routes/earlyaccess.js:30` | 1 min (env) | 60 (env) | IP | `ATRIBUCION_BLOCKED` |
| `adminLoginLimiter` | `admin/middlewares/rate-limiter.js:23` | 15 min | 5 | IP + correo | `ADMIN_LOGIN_BLOCKED` |
| `adminTotpLimiter` | `:43` | 5 min | 5 | IP | `ADMIN_TOTP_BLOCKED` |
| `adminRefreshLimiter` | `:58` | 15 min | 10 | IP | `ADMIN_REFRESH_BLOCKED` |
| `adminModeracionLecturaLimiter` | `:73` | 15 min | 300 | `Admin._id` | `ADMIN_MODERACION_BLOCKED` |
| `adminModeracionEscrituraLimiter` | `:92` | 15 min | 60 | `Admin._id` | `ADMIN_MODERACION_BLOCKED` |
| `adminInfluencersLecturaLimiter` | `:111` | 15 min | 300 | `Admin._id` | `ADMIN_INFLUENCERS_BLOCKED` |
| `adminInfluencersEscrituraLimiter` | `:130` | 15 min | 60 | `Admin._id` | `ADMIN_INFLUENCERS_BLOCKED` |

Además, `RateLimitError` (429, `code: RATE_LIMIT_EXCEEDED`) se lanza desde controladores para bloqueos de cuenta y cooldowns (login de usuario, reenvío de correo, cambio de nombre, bloqueo del panel). Esos sí incluyen `retry_after`.

### CORS y CSRF

- **CORS** (`models/server.js:82-107`): sin cabecera `Origin` → permitido. Con `NODE_ENV=development` → **todo origen permitido**. Si no: origen en `FRONTEND_URL`, `ADMIN_FRONTEND_URL` o `CSRF_ALLOWED_ORIGINS` (CSV). `credentials: true`.
  - Origen no permitido → `callback(new Error('Origen no permitido por CORS'))` → `cors` lo reenvía con `next(err)` (`node_modules/cors/lib/index.js:206`) → el error handler lo convierte en **500 `INTERNAL_ERROR`** (ver §Hallazgos).
- **CSRF** (`middlewares/validar-origen.js`): para `POST/PUT/PATCH/DELETE` se exige `Origin` (o `Referer`) en la allow-list (mismas variables que CORS, más `ADMIN_FRONTEND_URL`):
  - Sin Origin/Referer: en `NODE_ENV=production` → **403** `"Origen no permitido"` (`:49-54`); fuera de producción pasa.
  - Origin no permitido → **403** `"Origen no permitido"` (`:57-59`).
  - Origin mal formado → **403** `"Origen inválido"` (`:61`).
  - Los `GET`, `HEAD` y `OPTIONS` no se validan (`:43`).

### Cabeceras y formato de envío para el frontend

- JSON: `Content-Type: application/json` en todas las peticiones con body (salvo `PUT /api/uploads/:coleccion`, que es `multipart/form-data`).
- Todas las peticiones autenticadas deben enviar cookies: `credentials: 'include'` (o `withCredentials: true`).
- Las cookies usan `sameSite: none` + `secure: true`: requieren HTTPS en el origen de la API.
- Cabecera de respuesta `X-Trace-Id` (no está presente en los rechazos de CORS/CSRF).

---

## Tabla de endpoints

Leyenda de auth: **Público**, **Usuario** (`verificarTokenSesion`), **Opcional** (`verificarTokenSesionOpcional`), **Refresh** (cookie refresh), **Panel** (`verificarSesionAdmin`), **Panel+permiso** (`verificarSesionAdmin` + `verificarPermisoAdmin`), **PreAuth/Sesión** (`verificarSesionOPreAuth`).

### Bienvenida y salud — [bienvenida.md](bienvenida.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 1 | GET | `/` | Público | — |
| 2 | GET | `/api/health` | Público | `lecturaLimiter` |

### Auth de usuarios — [auth.md](auth.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 3 | GET | `/api/auth/verificar-correo{/:token}` | Público | `verificacionLimiter` |
| 4 | POST | `/api/auth/reenviar-correo` | Público | `reenvioCorreoLimiter` |
| 5 | POST | `/api/auth/login` | Público | `loginLimiter` |
| 6 | POST | `/api/auth/cuentas/password-olvidado` | Público | `recoveryLimiter` |
| 7 | POST | `/api/auth/reenviar-correo-restablecer-password` | Público | `recoveryLimiter` |
| 8 | GET | `/api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}` | Público | `recoveryLimiter` |
| 9 | POST | `/api/auth/cuentas/reestablecer-password{/:token}` | Público | `recoveryLimiter` |
| 10 | POST | `/api/auth/refresh` | Refresh | `refreshLimiter` |
| 11 | POST | `/api/auth/logout` | Refresh (cookie válida) | — |
| 12 | GET | `/api/auth/me` | Usuario | — |

### Usuarios — [usuarios.md](usuarios.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 13 | GET | `/api/usuarios/:url` | Usuario | — |
| 14 | POST | `/api/usuarios` | Público | `registroLimiter` |
| 15 | PUT | `/api/usuarios/update` | Usuario | — |
| 16 | DELETE | `/api/usuarios/delete` | Usuario + cookie refresh | — |
| 17 | GET | `/api/usuarios/registrados/nuevos-usuarios-registrados` | Usuario | — |

### Imagen de perfil — [uploads.md](uploads.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 18 | PUT | `/api/uploads/:coleccion` | Usuario | `imagenPerfilLimiter` |

### Posteos — [posteos.md](posteos.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 19 | GET | `/api/posteos` | Usuario | `lecturaLimiter` |
| 20 | GET | `/api/posteos/post/:id` | Opcional | `posteoPublicoLimiter` |
| 21 | GET | `/api/posteos/usuario/:idUsuario` | Usuario | — |
| 22 | POST | `/api/posteos` | Usuario | `posteoLimiter` |
| 23 | PUT | `/api/posteos/:id` | Usuario | — |
| 24 | DELETE | `/api/posteos/:id/ubicacion` | Usuario | — |
| 25 | DELETE | `/api/posteos/:id` | Usuario | — |

### Likes — [likes.md](likes.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 26 | POST | `/api/likes/:id/like` | Usuario | — |
| 27 | GET | `/api/likes/posteo/:id` | Usuario | — |
| 28 | GET | `/api/likes/:id/likes/usuarios` | Usuario | — |

### Followers — [followers.md](followers.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 29 | POST | `/api/followers/follow/:id` | Usuario | — |
| 30 | DELETE | `/api/followers/unfollow/:id` | Usuario | — |
| 31 | GET | `/api/followers/usuario/lista-followers/:id` | Usuario | — |
| 32 | GET | `/api/followers/usuario/lista-followings/:id` | Usuario | — |

### Favoritos — [favoritos.md](favoritos.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 33 | GET | `/api/favoritos` | Usuario | — |
| 34 | POST | `/api/favoritos/:posteoId` | Usuario | — |
| 35 | DELETE | `/api/favoritos/:posteoId` | Usuario | — |

### Comentarios — [comentarios.md](comentarios.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 36 | POST | `/api/comentarios/:posteoId/comentarios` | Usuario | `comentarioLimiter` |
| 37 | GET | `/api/comentarios/:posteoId/comentarios` | Usuario | — |
| 38 | GET | `/api/comentarios/:posteoId/comentarios/count` | Usuario | — |
| 39 | DELETE | `/api/comentarios/:comentarioId` | Usuario | — |
| 40 | PUT | `/api/comentarios/:posteoId/comentarios/toggle` | Usuario | — |

### Reportes — [reportes.md](reportes.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 41 | POST | `/api/reportes/:posteoId` | Usuario | `reporteLimiter` |

### Municipios y ubicación — [municipios-ubicacion.md](municipios-ubicacion.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 42 | GET | `/api/municipios` | Usuario | — |
| 43 | GET | `/api/municipios/:claveMunicipio/localidades` | Usuario | — |
| 44 | POST | `/api/ubicacion/reverse` | Usuario | — |
| 45 | GET | `/api/ubicacion` | Usuario | — |

### Notificaciones — [notificaciones.md](notificaciones.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 46 | POST | `/api/notificaciones/subscribe` | Usuario | — |
| 47 | POST | `/api/notificaciones/unsubscribe` | Usuario | — |
| 48 | GET | `/api/notificaciones/vapidPublicKey` | Usuario | — |
| 49 | GET | `/api/notificaciones` | Usuario | — |
| 50 | PATCH | `/api/notificaciones/marcar-notificacion-leida/:id` | Usuario | — |
| 51 | GET | `/api/notificaciones/nuevas-notificaciones` | Usuario | — |
| 52 | DELETE | `/api/notificaciones/eliminar-notificacion/:id` | Usuario | — |

### Soporte — [soporte.md](soporte.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 53 | POST | `/api/ayuda-soporte/envio-correo` | Usuario | `soporteLimiter` |

### Acceso anticipado — [early-access.md](early-access.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 54 | GET | `/api/early-access/atribucion` | Público | `atribucionLimiter` |
| 55 | POST | `/api/early-access` | Público | `EARLY_ACCESS` (10 min / 5) |

### Panel — login, sesión, cambio de contraseña y TOTP — [admin-auth-totp.md](admin-auth-totp.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 56 | POST | `/api/v1/admin/auth/login` | Público | `adminLoginLimiter` |
| 57 | POST | `/api/v1/admin/auth/login/totp` | PreAuth | `adminTotpLimiter` |
| 58 | POST | `/api/v1/admin/auth/refresh` | Refresh (cookie) | `adminRefreshLimiter` |
| 59 | POST | `/api/v1/admin/auth/logout` | Público (usa cookie si existe) | — |
| 60 | GET | `/api/v1/admin/auth/me` | Panel | — |
| 61 | POST | `/api/v1/admin/auth/cambiar-password` | PreAuth/Sesión | — |
| 62 | POST | `/api/v1/admin/totp/setup` | PreAuth/Sesión | — |
| 63 | POST | `/api/v1/admin/totp/activate` | PreAuth/Sesión | `adminTotpLimiter` |
| 64 | POST | `/api/v1/admin/totp/backup/regenerar` | PreAuth/Sesión | `adminTotpLimiter` |
| 65 | POST | `/api/v1/admin/totp/reemitir` | PreAuth/Sesión | `adminTotpLimiter` |

### Panel — cuentas — [admin-cuentas.md](admin-cuentas.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 66 | POST | `/api/v1/admin/cuentas` | Panel+`cuentas:crear` | — |
| 67 | GET | `/api/v1/admin/cuentas` | Panel+`cuentas:leer` | — |
| 68 | PATCH | `/api/v1/admin/cuentas/:id` | Panel+`cuentas:desactivar` | — |

### Panel — moderación — [admin-moderacion.md](admin-moderacion.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 69 | GET | `/api/v1/admin/moderacion/reportes` | Panel+`moderacion:leer` | `adminModeracionLecturaLimiter` |
| 70 | GET | `/api/v1/admin/moderacion/reportes/:id` | Panel+`moderacion:leer` | `adminModeracionLecturaLimiter` |
| 71 | PUT | `/api/v1/admin/moderacion/reportes/:id/resolver` | Panel+`moderacion:resolver` | `adminModeracionEscrituraLimiter` |
| 72 | PUT | `/api/v1/admin/moderacion/reportes/:id/descartar` | Panel+`moderacion:descartar` | `adminModeracionEscrituraLimiter` |
| 73 | PUT | `/api/v1/admin/moderacion/reportes/:id/recategorizar` | Panel+`moderacion:recategorizar` | `adminModeracionEscrituraLimiter` |
| 74 | PUT | `/api/v1/admin/moderacion/posteos/:posteoId/ocultar` | Panel+`posteos:ocultar` | `adminModeracionEscrituraLimiter` |
| 75 | PUT | `/api/v1/admin/moderacion/posteos/:posteoId/restaurar` | Panel+`posteos:restaurar` | `adminModeracionEscrituraLimiter` |

### Panel — influencers — [admin-influencers.md](admin-influencers.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 76 | GET | `/api/v1/admin/influencers` | Panel+`influencers:leer` | `adminInfluencersLecturaLimiter` |
| 77 | GET | `/api/v1/admin/influencers/metricas` | Panel+`influencers:leer` | `adminInfluencersLecturaLimiter` |
| 78 | POST | `/api/v1/admin/influencers` | Panel+`influencers:crear` | `adminInfluencersEscrituraLimiter` |
| 79 | PATCH | `/api/v1/admin/influencers/:id` | Panel+`influencers:editar` | `adminInfluencersEscrituraLimiter` |
| 80 | DELETE | `/api/v1/admin/influencers/:id` | Panel+`influencers:eliminar` | `adminInfluencersEscrituraLimiter` |

> Conteo por dominio: bienvenida 2 · auth 10 · usuarios 5 · uploads 1 · posteos 7 · likes 3 · followers 4 · favoritos 3 · comentarios 5 · reportes 1 · municipios/ubicación 4 · notificaciones 7 · soporte 1 · early-access 2 → **55 (red social)**. Panel: auth/TOTP 10 · cuentas 3 · moderación 7 · influencers 5 → **25 (panel)**. **Total: 80**, coincide con las 80 entradas de `inventario-endpoints.json`.

---

## Resumen de la documentación, inconsistencias y hallazgos

### Totales

- **Endpoints documentados: 80** (red social 55 · panel 25). Coinciden con las 80 entradas de `reports/api/inventario-endpoints.json`, método y ruta.
- **Archivos de dominio: 18**, más este índice.
- **Método:** cada endpoint se trazó desde `routes/` o `admin/routes/` hasta su controlador, validadores, middlewares, modelo y helpers, y las citas de línea se tomaron de esos archivos. **No se levantó el servidor** (requiere MongoDB, Cloudinary y SMTP): todos los ejemplos son **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.
- **Pruebas de librería ejecutadas con Node** (scripts temporales, sin tocar código fuente): `validator` 13.15.35 (`isBoolean` y `isInt`) y lectura de `node_modules/cors/lib/index.js`.
- **Contraste con contratos:** se leyó `AGENTS.md` completo y `SPECS-FRONTEND-TEXTO-POSTEOS-COMENTARIOS.md` (coincide con el código: 500 posteos, 250 comentarios, regex Unicode). **Los demás `SPECS-*.md` no se revisaron en detalle en esta corrida.**
- **Corrida anterior:** `2026-10-27_13-36-09_documentacion-endpoints.md` documentaba solo `DELETE /api/v1/admin/influencers/:id`. Ese archivo se eliminó (superado por este conjunto). Este conjunto de archivos (README + dominios) sigue la estructura pedida; el nombre con marca de tiempo del formato de AGENTS no se usó en esta entrega.

### Hallazgos de alta prioridad (verificados en código)

Ordenados por impacto en el frontend y en la seguridad. Ninguno se corrigió: son solo reporte.

| # | Hallazgo | Dónde |
|---|---|---|
| H1 | **Activar y desactivar cuentas del panel con strings.** `PATCH /api/v1/admin/cuentas/:id` con `{"activo":"false"}` **activa** la cuenta. El validador `isBoolean` acepta `"false"` y el controlador hace `Boolean(activo)`; `Boolean("false") === true`. | `admin/controllers/cuentas.js:148`; validador `admin/routes/index.js:130` |
| H2 | **Toggle de comentarios con strings.** `"activar": "true"` o `1` **desactiva** los comentarios: el validador acepta el valor pero el controlador compara `activar === true`. La opción `strict` no existe en `validator`. | `routes/comentarios.js:54`; `controllers/comentarios.js:286` |
| H3 | **La suspensión no corta sesiones existentes.** `verificarTokenSesion` solo rechaza `estatus` 0 y 4; `POST /api/auth/refresh` no revisa `estatus`. Un usuario con `estatus` 2 o 3 que ya tenga sesión sigue operando y puede renovar tokens mientras su refresh sea válido. Solo el login bloquea. *(Derivado del código; confirmar con prueba.)* | `middlewares/validar-jwt-cookies-sesion.js:26,30`; `controllers/auth.js:372-459` |
| H4 | **Tokens de correo y de reset expirados → 500, no 401/400.** `validarJWT` rechaza con un objeto plano, que no es `AppError`, y los `catch` lo convierten en `InternalError`. Afecta a verificar-correo, reenviar-correo, validar-token-reset, reestablecer-password y reenviar-restablecer. Además, el `detail` expone el texto de `jsonwebtoken`. | `helpers/validar-jwt.js:9-15`; `controllers/auth.js:94,316,355,368`; `email/servicios-autenticacion-correo.js:225` |
| H5 | **Extensión o MIME no permitidos → 500.** `fileFilter` lanza un `Error` sin `code`; `validarImagenesMulter` lo reenvía y el handler global responde 500. Afecta a `PUT /api/uploads/:coleccion` y `POST /api/posteos`. | `helpers/multer.js:22,27`; `middlewares/validar-imagen-posteo.js:31`; `middlewares/error-handler.js:108-118` |
| H6 | **Origen CORS no permitido → 500.** El callback devuelve `Error` y `cors` lo reenvía con `next(err2)`; el handler global lo convierte en 500 sin cabeceras CORS. | `models/server.js:104`; `node_modules/cors/lib/index.js:219-221` |
| H7 | **Carrera de correo en el alta → 500, no 409.** Un `E11000` durante el `save()` cae en el `catch` genérico. | `controllers/usuarios.js:118-123` |
| H8 | **Detalle interno en respuestas.** Muchos controladores hacen `new InternalError(error.message)`. El handler devuelve el `detail` de cualquier `AppError` **también en producción**, así que el mensaje de Mongo o de `jsonwebtoken` llega al cliente. | `controllers/auth.js:111,…`; `admin/controllers/auth.js:111,182`; `middlewares/error-handler.js:36-40` |
| H9 | **Paginación sin validar en el feed.** `page=0` (o negativo) da `skip` negativo y, según el driver, 500. `limite=0` equivale a sin límite en Mongo. No hay tope de `limite` en posteos, favoritos ni notificaciones. *(Probable; confirmar.)* | `controllers/posteos.js:88-90,263-265`; `controllers/favoritos.js:15`; `controllers/notificaciones.js:118` |
| H10 | **Cuenta de panel desactivada se revela sin contraseña.** `loginPaso1` responde 403 "desactivada" **antes** de verificar la contraseña. | `admin/controllers/auth.js:67` |
| H11 | **Restablecer contraseña no revoca sesiones.** No incrementa `tokenVersion` ni borra `UserToken`; las cookies activas siguen válidas hasta su expiración. | `email/servicios-correo-reestablecer-password.js:195-222` |
| H12 | **Enumeración de cuentas y contactos.** `POST /api/usuarios` devuelve 409 si el correo existe; `POST /api/early-access` devuelve 409 con el contacto; `password-olvidado` cambia la respuesta en cooldown (sin `data`, `controllers/auth.js:266-268` frente a `:290-293`); el error SMTP solo ocurre para cuentas elegibles. | `controllers/usuarios.js:76`; `controllers/earlyaccess.js:51`; `controllers/auth.js:256-294` |
| H13 | **Cambio de contraseña sin contraseña actual.** `PUT /api/usuarios/update` acepta `password` solo con sesión válida. | `controllers/usuarios.js:140-143` |
| H14 | **Políticas de contraseña inconsistentes.** Registro: mayúscula, minúscula, número y especial. `PUT /update`: solo 8 caracteres y el mensaje dice 6. Reestablecer: 8, sin complejidad. Panel `cambiar-password`: 12, sin complejidad. | `routes/usuarios.js:51-52,83`; `routes/auth.js:66`; `admin/routes/index.js:77` |
| H15 | **`/api/health` expone datos internos sin autenticación:** `pid`, uso de memoria y `environment`. | `controllers/bienvenida.js:15-35` |
| H16 | **`POST /api/favoritos/:posteoId` confía en `autorId` del cliente.** No se compara con el autor real del posteo, así que el favorito guarda un autor arbitrario. | `controllers/favoritos.js:113,124` |
| H17 | **Quitar el ocultamiento sin `reporteId` rompe la restauración.** `ocultarPosteo` sin `reporteId` escribe `ocultadoPorReporteId: null`, y el descarte ya no restaura el posteo. | `admin/controllers/moderacion.js:552` |
| H18 | **Errores de CORS y CSRF sin `trace_id` útil.** `traceId` se registra después de `validarOrigen` y de CORS, así que esos rechazos devuelven `trace_id: "unknown"` y sin `X-Trace-Id`. | `models/server.js:115,117` |
| H19 | **Cuerpos grandes → 500.** `express.json()` usa el límite por defecto (100 kb) y el error `entity.too.large` no tiene rama propia en el handler. *(Derivado; confirmar.)* | `models/server.js:113`; `middlewares/error-handler.js` |
| H20 | **Respuesta 201 seguida de errores.** En comentarios y seguidores, el `responder` ocurre antes de notificaciones; un fallo posterior llama a `next(err)` con la respuesta ya enviada. | `controllers/comentarios.js:44-48,113-115`; `controllers/followers.js:60,107-110` |
| H21 | **Atribución con `SameSite=Lax`.** La landing y la API están en dominios distintos según AGENTS.md; la cookie podría no enviarse ni aceptarse. **[REQUIERE VERIFICACIÓN MANUAL]** | `helpers/atribucion.js:271-277` |
| H22 | **Falso positivo de reuso por TTL del registro.** El TTL de `UserToken` (30 d) y `AdminToken` (12 h) se mide desde `createdAt` y la rotación **no lo reinicia**. Una sesión más longeva que el TTL pierde su fila; el siguiente `POST /refresh` encuentra un token con firma válida y sin fila → lo trata como robo, incrementa `tokenVersion` y **cierra todas las sesiones**. En el panel la ventana (12 h) es menor que una jornada laboral. *(Documentado por decisión; no corregido.)* | `models/UserToken.js:38`; `admin/models/AdminToken.js:43`; `controllers/auth.js:425-434`; `admin/controllers/auth.js:225-234` |
| H23 | **Refresh concurrente tratado como reuso.** Dos `POST /refresh` simultáneos con el mismo refresh: el primero rota el token, el segundo no encuentra la fila y recorre la misma rama de "sesión comprometida", revocando todo. El cliente debe serializar los refresh. *(Probable; confirmar con prueba.)* | `controllers/auth.js:385-402` |
| H24 | **El logout no revoca el access token.** Solo borra el refresh de la BD y limpia cookies; el access token sigue siendo aceptado hasta su `exp`. Para cortar de inmediato hace falta `tokenVersion++`. | `helpers/cerrar-sesion-cookies.js:4-30`; `controllers/auth.js:450-459` |

### Inconsistencias entre código y documentación de referencia

| # | Referencia | Código | Dónde |
|---|---|---|---|
| I1 | AGENTS.md: duplicado Mongo → `409 CONFLICT` con `code: DUPLICATE_KEY`. | ~~El `code` de primer nivel es `CONFLICT`; `DUPLICATE_KEY` está en `errors[0].code`.~~ **RESUELTO (2026-10-27):** AGENTS.md ya describe `code: "CONFLICT"` + `errors[0].code: "DUPLICATE_KEY"`. | `middlewares/error-handler.js:93-105` |
| I2 | Prompt de referencia (y tabla de clases): códigos en minúsculas (`bad_request`, `not_found`, `validation_failed`, `rate_limit_exceeded`, `internal_error`, `file_error`, `invalid_json`). | Los códigos son en **mayúsculas** (`BAD_REQUEST`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMIT_EXCEEDED`, `INTERNAL_ERROR`, `FILE_ERROR`, `INVALID_JSON`). | `errors/error-classes.js:16-82`; `middlewares/error-handler.js` |
| I3 | Prompt de referencia: líneas de `error-classes.js` (49, 60, 73) y del error handler (41-56, 59-75, 78-88, 91-99). | Líneas reales: `ValidationError` `:56`, `RateLimitError` `:67`, `InternalError` `:80`; handler `:43-58`, `:61-77`, `:80-90`, `:93-118`. | `errors/error-classes.js`; `middlewares/error-handler.js` |
| I4 | AGENTS.md: access token de 1 h. | ~~Sin `ACCESS_TOKEN_EXPIRY`, el código usa **`15m`**.~~ **RESUELTO (2026-10-27):** el default del código pasó a **`1h`** y el `maxAge` de la cookie se deriva del `exp` del token, así que token y cookie ya no pueden desincronizarse. | `helpers/tokensUtils.js:17`; `helpers/vigencia-cookie.js` |
| I5 | AGENTS.md: multer 8 MB (y nota sobre el mensaje de 5 MB). | El mensaje de 5 MB sigue en el handler, pero el de 8 MB se aplica primero, así que el de 5 MB no se alcanza. | `middlewares/error-handler.js:45`; `middlewares/validar-imagen-posteo.js:7` |
| I6 | AGENTS.md: "Regla de Oro": con municipio manual, `coordinates` = `null`. | El backend guarda `coordinates` si llegan `lat` y `lng` aunque también llegue `municipio`. Depende del cliente. | `controllers/posteos.js:368,470-478` |
| I7 | AGENTS.md: los iconos de Web Push deben ser URLs absolutas. | ~~El fallback de `comentarios.js` es relativo: `/public/assets/icono-tlaxapp-beige.png`.~~ **RESUELTO (2026-10-27):** el fallback relativo se eliminó; ahora es `imagen_perfil.secure_url` || `ICONO_SISTEMA_TLAXAPP` y, sin ninguna, se omite el `icon`. | `controllers/comentarios.js:73`; `controllers/followers.js:71` |
| I8 | AGENTS.md: tabla de limiters. | No incluye el limiter `EARLY_ACCESS` (POST, 10 min / 5 por defecto). | `routes/earlyaccess.js:8` |
| I9 | AGENTS.md: suspensión de cuenta (estatus 3). | Ver H3: la suspensión no se aplica a sesiones existentes ni al refresh. | — |
| I10 | `models/Usuario.js:54` y AGENTS.md: los slugs históricos redirigen (301). | La respuesta es **200** con `redirect: "permanent"` y `Location`; no hay 301. | `middlewares/validar-url-usuario.js:16-26` |
| I11 | Mensajes de validación con límite distinto al aplicado. | Soporte dice "mínimo 10" y aplica **15** (`routes/soporte.js:15`). `PUT /update` dice "6" y aplica **8** (`routes/usuarios.js:83`). | ver dominios |
| I12 | Esquema de `notificaciones`: campo `leida`. | La proyección pide `leida`; el campo real es `notificacion_leida`. | `controllers/notificaciones.js:165` |
| I13 | Inventario base `inventario-endpoints.json`: `GET /api/health` (`{status, uptime, timestamp, version, db}`). | El código añade `service`, `environment`, `memory`, `heapUsedPercentage` y `pid`. | `controllers/bienvenida.js:15-35` |
| I14 | Login vs `/me`: ambos deben devolver el mismo perfil. | El login devuelve `_id` y `uid`; `/me` solo `uid` (por `toJSON`). | `controllers/auth.js:189-201`; `models/Usuario.js:192-200` |
| I15 | Feed de favoritos: `posteoId` como id. | `posteoId` es un **objeto** `{_id, public_id, visibilidad}`. | `controllers/favoritos.js:70-76` |

### Verificación manual pendiente **[REQUIERE VERIFICACIÓN MANUAL]**

1. Cookie `early_access_atribucion` con `SameSite=Lax` en un flujo cross-site real (H21).
2. Respuestas reales de Cloudinary (subida, borrado) y comportamiento de `SEND_EMAIL=false`.
3. Entregas de Web Push y el manejo de suscripciones 404/410.
4. Valores reales de `ACCESS_TOKEN_EXPIRY`, `JWT_SEED`, `NODE_ENV`, `FRONTEND_URL`, `ADMIN_FRONTEND_URL` y `CSRF_ALLOWED_ORIGINS`.
5. Cron de borrado físico de cuentas y posteos (no revisado: `jobs/`).
6. `PATCH /api/v1/admin/influencers/:id` con `nombre: ""`: el validador lo deja pasar (`optional({values:'falsy'})`) y Mongoose lo rechaza por `required`. Resultado esperado: 500 (probable; confirmar).
7. `page=0` en `GET /api/posteos` y `GET /api/posteos/usuario/:id` (H9).
8. Origen del JWT que envía `POST /api/auth/reenviar-correo-restablecer-password`: ningún endpoint lo emite (la respuesta de `password-olvidado` entrega un token opaco).
9. `PUT /api/usuarios/update` con `$set` sobre `nombre_completo` y `lugar_radicacion`: si se envía un subdocumento parcial, ¿se pierden campos? (derivado del código).
10. Rate limiters en memoria por proceso: si hay más de una instancia, los límites no se comparten.

### Nota de método

Los 80 endpoints están documentados. Los `throw` se citan por línea del archivo real. Donde el código no permite afirmar el comportamiento, se marca **[REQUIERE VERIFICACIÓN MANUAL]**. Donde se deduce de la lectura sin ejecutar, se indica "derivado". Las tablas de error listan el `code` real, aunque no coincida con la referencia del prompt (ver I2).
