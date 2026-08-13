# Documentación de Endpoints — TlaxApp API

> **Índice maestro.** Este archivo lista TODOS los endpoints y enlaza a la documentación detallada por módulo.
> Fecha de generación: **2026-08-13 12:50:21**. Total de endpoints documentados: **50**.

## Archivos de documentación por módulo

| Módulo | Archivo | Endpoints |
|---|---|---|
| Bienvenida y Auth | [`2026-08-13_12-50-21_01-bienvenida-auth.md`](./2026-08-13_12-50-21_01-bienvenida-auth.md) | 12 |
| Usuarios y Uploads | [`2026-08-13_12-50-21_02-usuarios-uploads.md`](./2026-08-13_12-50-21_02-usuarios-uploads.md) | 6 |
| Posteos | [`2026-08-13_12-50-21_03-posteos.md`](./2026-08-13_12-50-21_03-posteos.md) | 6 |
| Likes y Followers | [`2026-08-13_12-50-21_04-likes-followers.md`](./2026-08-13_12-50-21_04-likes-followers.md) | 7 |
| Favoritos y Municipios | [`2026-08-13_12-50-21_05-favoritos-municipios.md`](./2026-08-13_12-50-21_05-favoritos-municipios.md) | 4 |
| Notificaciones | [`2026-08-13_12-50-21_06-notificaciones.md`](./2026-08-13_12-50-21_06-notificaciones.md) | 7 |
| Ubicación, Soporte y Comentarios | [`2026-08-13_12-50-21_07-ubicacion-soporte-comentarios.md`](./2026-08-13_12-50-21_07-ubicacion-soporte-comentarios.md) | 8 |

## Lista completa de endpoints

| # | Método | Path | Auth | Rate Limiter | Módulo |
|---|--------|------|------|-------------|--------|
| 1 | GET | `/` | No | No | [Bienvenida](./2026-08-13_12-50-21_01-bienvenida-auth.md) |
| 2 | GET | `/api/health` | No | `lecturaLimiter` | Bienvenida |
| 3 | GET | `/api/auth/verificar-correo{/:token}` | No (token URL) | `verificacionLimiter` | Auth |
| 4 | POST | `/api/auth/reenviar-correo` | No (token body) | `reenvioCorreoLimiter` | Auth |
| 5 | POST | `/api/auth/login` | No | `loginLimiter` | Auth |
| 6 | POST | `/api/auth/cuentas/password-olvidado` | No | `recoveryLimiter` | Auth |
| 7 | POST | `/api/auth/reenviar-correo-restablecer-password` | No | `recoveryLimiter` | Auth |
| 8 | GET | `/api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}` | No (token URL) | `recoveryLimiter` | Auth |
| 9 | POST | `/api/auth/cuentas/reestablecer-password{/:token}` | No (token URL) | `recoveryLimiter` | Auth |
| 10 | POST | `/api/auth/refresh` | refreshToken cookie | `refreshLimiter` | Auth |
| 11 | POST | `/api/auth/logout` | refreshToken cookie | No | Auth |
| 12 | GET | `/api/auth/me` | accessToken cookie | No | Auth |
| 13 | GET | `/api/usuarios/:url` | accessToken cookie | No | [Usuarios](./2026-08-13_12-50-21_02-usuarios-uploads.md) |
| 14 | POST | `/api/usuarios` | No | `registroLimiter` | Usuarios |
| 15 | PUT | `/api/usuarios/update` | accessToken cookie | No | Usuarios |
| 16 | DELETE | `/api/usuarios/delete` | accessToken cookie | No | Usuarios |
| 17 | GET | `/api/usuarios/registrados/nuevos-usuarios-registrados` | accessToken cookie | No | Usuarios |
| 18 | PUT | `/api/uploads/:coleccion` | accessToken cookie | `imagenPerfilLimiter` | Uploads |
| 19 | GET | `/api/posteos` | accessToken cookie | `lecturaLimiter` | [Posteos](./2026-08-13_12-50-21_03-posteos.md) |
| 20 | GET | `/api/posteos/post/:id` | Opcional | `posteoPublicoLimiter` | Posteos |
| 21 | GET | `/api/posteos/usuario/:idUsuario` | accessToken cookie | No | Posteos |
| 22 | POST | `/api/posteos` | accessToken cookie | `posteoLimiter` | Posteos |
| 23 | PUT | `/api/posteos/:id` | accessToken cookie | No | Posteos |
| 24 | DELETE | `/api/posteos/:id` | accessToken cookie | No | Posteos |
| 25 | POST | `/api/likes/:id/like` | accessToken cookie | No | [Likes](./2026-08-13_12-50-21_04-likes-followers.md) |
| 26 | GET | `/api/likes/posteo/:id` | accessToken cookie | No | Likes |
| 27 | GET | `/api/likes/:id/likes/usuarios` | accessToken cookie | No | Likes |
| 28 | POST | `/api/followers/follow/:id` | accessToken cookie | No | Followers |
| 29 | DELETE | `/api/followers/unfollow/:id` | accessToken cookie | No | Followers |
| 30 | GET | `/api/followers/usuario/lista-followers/:id` | accessToken cookie | No | Followers |
| 31 | GET | `/api/followers/usuario/lista-followings/:id` | accessToken cookie | No | Followers |
| 32 | GET | `/api/favoritos` | accessToken cookie | No | [Favoritos](./2026-08-13_12-50-21_05-favoritos-municipios.md) |
| 33 | POST | `/api/favoritos/:posteoId` | accessToken cookie | No | Favoritos |
| 34 | DELETE | `/api/favoritos/:posteoId` | accessToken cookie | No | Favoritos |
| 35 | GET | `/api/municipios` | accessToken cookie | No | Municipios |
| 36 | POST | `/api/notificaciones/subscribe` | accessToken cookie | No | [Notificaciones](./2026-08-13_12-50-21_06-notificaciones.md) |
| 37 | POST | `/api/notificaciones/unsubscribe` | accessToken cookie | No | Notificaciones |
| 38 | GET | `/api/notificaciones/vapidPublicKey` | accessToken cookie | No | Notificaciones |
| 39 | GET | `/api/notificaciones` | accessToken cookie | No | Notificaciones |
| 40 | PATCH | `/api/notificaciones/marcar-notificacion-leida/:id` | accessToken cookie | No | Notificaciones |
| 41 | GET | `/api/notificaciones/nuevas-notificaciones` | accessToken cookie | No | Notificaciones |
| 42 | DELETE | `/api/notificaciones/eliminar-notificacion/:id` | accessToken cookie | No | Notificaciones |
| 43 | POST | `/api/ubicacion/reverse` | accessToken cookie | No | [Ubicación](./2026-08-13_12-50-21_07-ubicacion-soporte-comentarios.md) |
| 44 | GET | `/api/ubicacion` | accessToken cookie | No | Ubicación |
| 45 | POST | `/api/ayuda-soporte/envio-correo` | accessToken cookie | `soporteLimiter` | Soporte |
| 46 | POST | `/api/comentarios/:posteoId/comentarios` | accessToken cookie | `comentarioLimiter` | Comentarios |
| 47 | GET | `/api/comentarios/:posteoId/comentarios` | accessToken cookie | No | Comentarios |
| 48 | GET | `/api/comentarios/:posteoId/comentarios/count` | accessToken cookie | No | Comentarios |
| 49 | DELETE | `/api/comentarios/:comentarioId` | accessToken cookie | No | Comentarios |
| 50 | PUT | `/api/comentarios/:posteoId/comentarios/toggle` | accessToken cookie | No | Comentarios |

---

## Notas de cambios respecto al reporte anterior (`2026-07-23_17-08-39_documentacion-endpoints.md`)

- **ELIMINADO:** `GET /api/usuarios` (antes respondía `410 GONE`). El controlador `usuariosGet` ya no existe y no hay ruta `GET /` en `routes/usuarios.js`.
- **CORREGIDO (bug resuelto):** `helpers/validar-id-posteo.js` y `helpers/validar-id-usuario.js` **ya NO lanzan `throw new Error(...)` crudo**; ahora lanzan `NotFoundError` (404). La nota de `AGENTS.md` sobre "500 en vez de 404" está **desactualizada**.
- **Límite Multer:** de 5 MB a **8 MB** (`helpers/multer.js:11`).
- **NUEVO rate limiter:** `imagenPerfilLimiter` (15 min / 10 / `IMAGEN_BLOCKED`) → aplicado a `PUT /api/uploads/:coleccion`. Ahora son **12 limiters**.
- **NUEVO en error-handler:** MongoDB `E11000` → `409 CONFLICT` con `errors: [{ field, code: 'DUPLICATE_KEY' }]`.
- **Cloudinary raw upload:** las imágenes se suben sin transformaciones (el reporte anterior mencionaba "transformación 500px / fill crop", ya no aplica).
- **`POST /api/posteos` responde `201`** al crear un posteo.

---

## Formato global de errores (RFC 9457)

Todos los errores siguen **RFC 9457 (Problem Details)** (`middlewares/error-handler.js`):

```json
{
  "type": "about:blank",
  "title": "Authentication Required",
  "status": 401,
  "detail": "No hay token en la petición",
  "instance": "/api/usuarios/123",
  "code": "UNAUTHORIZED",
  "trace_id": "req_829a8f1b-be1",
  "errors": []
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `type` | string | URI de referencia (siempre `"about:blank"`) |
| `title` | string | Título legible del error |
| `status` | number | Código HTTP |
| `detail` | string | Descripción específica |
| `instance` | string | Ruta (`req.originalUrl`) |
| `code` | string | Código machine-readable (**MAYÚSCULAS**) |
| `trace_id` | string | ID de correlación (también header `X-Trace-Id`) |
| `errors` | array | Detalles de validación (opcional): `[{ field, code, message }]` |
| `retry_after` | number | (opcional, solo `RateLimitError`) segundos |

### Clases de error del dominio (`errors/error-classes.js`)

| HTTP | Clase | `code` | `title` |
|---|---|---|---|
| 400 | `BadRequestError` | `BAD_REQUEST` | `Bad Request` |
| 401 | `AuthenticationError` | `UNAUTHORIZED` | `Authentication Required` |
| 403 | `ForbiddenError` | `FORBIDDEN` | `Forbidden` |
| 404 | `NotFoundError` | `NOT_FOUND` | `Resource Not Found` |
| 409 | `ConflictError` | `CONFLICT` | `Conflict` |
| 410 | `GoneError` | `GONE` | `Gone` |
| 422 | `ValidationError` | `VALIDATION_FAILED` | `Validation Failed` |
| 429 | `RateLimitError` | `RATE_LIMIT_EXCEEDED` | `Rate Limit Exceeded` |
| 500 | `InternalError` | `INTERNAL_ERROR` | `Internal Server Error` |

### Errores adicionales del error-handler

| Origen | `code` | HTTP |
|---|---|---|
| Multer (`LIMIT_*`) | `FILE_ERROR` | 400 |
| express-validator (`err.array()`) | `VALIDATION_FAILED` | 422 |
| JSON malformado (`entity.parse.failed`) | `INVALID_JSON` | 400 |
| Clave duplicada MongoDB (`E11000`) | `CONFLICT` + `errors:[{code:'DUPLICATE_KEY'}]` | 409 |
| Catch-all | `INTERNAL_ERROR` | 500 |

> **Los `code` son MAYÚSCULAS.** El frontend debe comparar contra `UNAUTHORIZED`, `VALIDATION_FAILED`, etc.

### Rate limiting (12 limiters — `middlewares/rate-limiter.js`)

| Limiter | Ventana | Máx. | `code` | KeyGenerator |
|---|---|---|---|---|
| `loginLimiter` | 15 min | 5 | `LOGIN_BLOCKED` | IP + correo (fallback IP) |
| `recoveryLimiter` | 15 min | 3 | `RECOVERY_BLOCKED` | IP |
| `verificacionLimiter` | 15 min | 5 | `VERIFICATION_BLOCKED` | IP |
| `reenvioCorreoLimiter` | 5 min | 3 | `EMAIL_BLOCKED` | IP |
| `registroLimiter` | 1 h | 3 | `REGISTER_BLOCKED` | IP |
| `posteoLimiter` | 15 min | 20 | `POSTEO_BLOCKED` | IP |
| `soporteLimiter` | 15 min | 5 | `SOPORTE_BLOCKED` | IP |
| `lecturaLimiter` | 15 min | 100 | `READ_BLOCKED` | IP |
| `comentarioLimiter` | 1 min | 10 | `COMENTARIO_BLOCKED` | IP |
| `refreshLimiter` | 15 min | 10 | `REFRESH_BLOCKED` | IP |
| `posteoPublicoLimiter` | 15 min | 100 | `POST_DETAIL_BLOCKED` | IP |
| `imagenPerfilLimiter` | 15 min | 10 | `IMAGEN_BLOCKED` | IP |

> **Dos familias de 429:** (1) los 12 limiters responden con su propio `code` **sin** `retry_after`; (2) `RateLimitError` desde controladores → `RATE_LIMIT_EXCEEDED` **con** `retry_after` (cooldown 5 min reenvío de correo, bloqueo 10 intentos login, cooldown 30 días cambio de nombre).

### Formato de respuesta exitosa (`helpers/responder.js`)

- **Simple:** `{ "success": true, "msg": "..." }`
- **Con datos:** `{ "success": true, "msg": "...", "data": {...} }`
- **Paginada:** `{ "success": true, "data": [...], "pagination": { page, limit, total, totalPages, next, prev } }`

Excepciones documentadas: `controllers/bienvenida.js` (`getBienvenida`, `getHealth`) mantienen formato propio (JSON directo), y `procesarEnvioReestablecerPassword` responde siempre `200` genérico (anti-enumeración de correos).

### Middlewares globales (aplicados a toda la API — `models/server.js:65-107`)

1. `helmet` (CSP desactivada; `crossOriginResourcePolicy: cross-origin`).
2. `cors` (`credentials: true`; origen validado contra `FRONTEND_URL` + `CSRF_ALLOWED_ORIGINS`).
3. `cookieParser()`.
4. `express.static('public')`.
5. `express.json()`.
6. `validarOrigen` — CSRF: valida `Origin`/`Referer` en métodos mutantes. En producción sin origen → `403`.
7. `traceId` — header `X-Trace-Id`.

### Autenticación: cookies httpOnly (dual JWT)

- `accessToken`: 1h (o `ACCESS_TOKEN_EXPIRY`), contiene `{ id, tokenVersion }`, firmado con `ACCESS_TOKEN_SECRET`.
- `refreshToken`: 7d (o `REFRESH_TOKEN_EXPIRY`), contiene `{ id }`, firmado con `REFRESH_TOKEN_SECRET`, almacenado **hasheado SHA-256** en `UserToken`.
- Ambas: `httpOnly`, `secure`, `sameSite: 'none'`, `path: '/'`.
- **No se usa header `Authorization`**; el frontend debe usar `credentials: 'include'`.
- `verificarTokenSesion` setea `req.usuario = usuario.id` (string del ID). `verificarTokenSesionOpcional` no bloquea sin token (usado en `GET /api/posteos/post/:id`).

### Montaje de rutas (`models/server.js:22-49`)

`/` (bienvenida), `/api/auth`, `/api/usuarios`, `/api/uploads`, `/api/posteos`, `/api/likes`, `/api/followers`, `/api/favoritos`, `/api/municipios`, `/api/notificaciones`, `/api/ubicacion`, `/api/ayuda-soporte`, `/api/comentarios`. Tras todas, un **404 catch-all** (`models/server.js:126-128`) responde JSON con `NotFoundError`.

> **Sintaxis Express 5 / path-to-regexp v8:** los parámetros opcionales usan `{/:param}` (ej. `/verificar-correo{/:token}`), **no** `/:param?`.

### Advertencias / comportamientos a verificar (encontrados durante la exploración)

1. **Extensión/MIME de archivo no permitido → 500 (no 400).** En `PUT /api/uploads/:coleccion` y `POST /api/posteos`, si `multer.fileFilter` rechaza el archivo, lanza `new Error('Extensiones permitidas...')` **sin** `code`. `validarImagenesMulter` no lo reconoce y el error cae al catch-all del error-handler como **500 `INTERNAL_ERROR`** (en desarrollo el `detail` muestra el mensaje; en producción es genérico).
2. **`POST /api/posteos` y `posteo_publico`:** el validador exige `isBoolean()` (rechaza string `'true'`), pero el controlador sí acepta `'true'`/`true`. Si el frontend envía `posteo_publico` como string (típico de FormData), puede recibir `422`. **Verificar cómo lo envía el frontend.**
3. **`POST /api/usuarios`:** el `save()` solo ocurre si `envioCorreoVerificacion` retorna `true`. Si el envío falla, el usuario no se guarda pero igual responde `200` con token.
4. **`POST /api/comentarios/:posteoId/comentarios`:** el segundo `check('texto').isLength({max:250})` **no** es opcional; un `texto` ausente/vacío podría disparar el validador de longitud además del de "obligatorio".
