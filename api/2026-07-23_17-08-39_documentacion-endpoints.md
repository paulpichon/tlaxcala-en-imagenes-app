# Documentación de Endpoints — TlaxApp API

**Generado:** 2026-07-23 17:08:39
**Total de endpoints documentados:** 51
**Archivos de rutas explorados:** `routes/bienvenida.js`, `routes/auth.js`, `routes/usuarios.js`, `routes/uploads.js`, `routes/posteos.js`, `routes/likes.js`, `routes/followers.js`, `routes/favoritos.js`, `routes/municipios.js`, `routes/notificaciones.js`, `routes/ubicacion.js`, `routes/soporte.js`, `routes/comentarios.js`
**Endpoints no verificables completamente:** Ninguno. Todos los endpoints tienen controlador asignado. Los ejemplos de respuesta están marcados como `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`.

### Cambios respecto al reporte anterior (2026-07-23)
- **NUEVO:** `GET /api/posteos/post/:id` ahora es **público** (sin autenticación obligatoria). Ver detalle en la sección #5.
- Se añadió `verificarTokenSesionOpcional`: middleware que valida la sesión si existe pero no bloquea requests sin token.
- Se añadió `posteoPublicoLimiter` (100 req/15min, code `POST_DETAIL_BLOCKED`) para proteger el endpoint público de scraping.
- La respuesta de `GET /api/posteos/post/:id` varía según si hay sesión o no (ver ejemplos en la documentación del endpoint).
- Se excluyó el campo `comentariosActivos` de la respuesta del posteo individual.

---

## Formato global de errores (RFC 9457)

Todos los errores de la API siguen el estándar **RFC 9457 (Problem Details)** (`middlewares/error-handler.js`), con esta estructura:

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
| `type` | string | URI de referencia (actualmente `"about:blank"`) |
| `title` | string | Título legible del error |
| `status` | number | Código HTTP |
| `detail` | string | Descripción específica del error |
| `instance` | string | Ruta que causó el error (`req.originalUrl`) |
| `code` | string | Código de error machine-readable (**MAYÚSCULAS**) |
| `trace_id` | string | ID único de correlación para logging (`req.traceId`) |
| `errors` | array | Detalles de validación (opcional): `[{ field, code, message }]` |

### Clases de error del dominio

Definidas en `errors/error-classes.js` (heredan de `AppError` en `errors/app-error.js`):

| HTTP | Clase | `code` | `title` | Archivo |
|---|---|---|---|---|
| 400 | `BadRequestError` | `BAD_REQUEST` | `Bad Request` | `errors/error-classes.js:14` |
| 401 | `AuthenticationError` | `UNAUTHORIZED` | `Authentication Required` | `errors/error-classes.js:21` |
| 403 | `ForbiddenError` | `FORBIDDEN` | `Forbidden` | `errors/error-classes.js:28` |
| 404 | `NotFoundError` | `NOT_FOUND` | `Resource Not Found` | `errors/error-classes.js:35` |
| 409 | `ConflictError` | `CONFLICT` | `Conflict` | `errors/error-classes.js:42` |
| 410 | `GoneError` | `GONE` | `Gone` | `errors/error-classes.js:49` |
| 422 | `ValidationError` | `VALIDATION_FAILED` | `Validation Failed` | `errors/error-classes.js:56` |
| 429 | `RateLimitError` | `RATE_LIMIT_EXCEEDED` | `Rate Limit Exceeded` | `errors/error-classes.js:67` |
| 500 | `InternalError` | `INTERNAL_ERROR` | `Internal Server Error` | `errors/error-classes.js:80` |

### Errores adicionales manejados por el error handler

| Origen | `code` | HTTP | Dónde se captura |
|---|---|---|---|
| Multer (subida de archivos, `LIMIT_*`) | `FILE_ERROR` | 400 | `middlewares/error-handler.js:43-58` |
| express-validator (`err.array()`) | `VALIDATION_FAILED` | 422 | `middlewares/error-handler.js:61-77` |
| JSON parse malformado (`entity.parse.failed`) | `INVALID_JSON` | 400 | `middlewares/error-handler.js:80-90` |
| Error no contemplado (catch-all) | `INTERNAL_ERROR` | 500 | `middlewares/error-handler.js:93-104` |

> **IMPORTANTE:** Todos los `code` están en **MAYÚSCULAS**. El frontend debe comparar contra `UNAUTHORIZED`, `VALIDATION_FAILED`, `NOT_FOUND`, etc.

### Rate limiting

Los rate limiters están definidos en `middlewares/rate-limiter.js`. Cada uno produce una respuesta RFC 9457 con un `code` propio y **no incluye** `retry_after`.

| Limiter | Ventana | Máximo | `code` | KeyGenerator |
|---|---|---|---|---|
| `loginLimiter` | 15 min | 5 | `LOGIN_BLOCKED` | IP + correo (fallback IP) |
| `recoveryLimiter` | 15 min | 3 | `RECOVERY_BLOCKED` | IP |
| `verificacionLimiter` | 15 min | 5 | `VERIFICATION_BLOCKED` | IP |
| `reenvioCorreoLimiter` | 5 min | 3 | `EMAIL_BLOCKED` | IP |
| `registroLimiter` | 1 hora | 3 | `REGISTER_BLOCKED` | IP |
| `posteoLimiter` | 15 min | 20 | `POSTEO_BLOCKED` | IP |
| `soporteLimiter` | 15 min | 5 | `SOPORTE_BLOCKED` | IP |
| `lecturaLimiter` | 15 min | 100 | `READ_BLOCKED` | IP |
| `comentarioLimiter` | 1 min | 10 | `COMENTARIO_BLOCKED` | IP |
| `refreshLimiter` | 15 min | 10 | `REFRESH_BLOCKED` | IP |
| `posteoPublicoLimiter` | 15 min | 100 | `POST_DETAIL_BLOCKED` | IP |

Además, los controladores pueden lanzar `RateLimitError` (`code: RATE_LIMIT_EXCEEDED`) con `retry_after` en segundos (cooldown de 5 min entre reenvíos de correo, bloqueo por 10 intentos fallidos de login).

### Protección CSRF global

El middleware `validarOrigen` (`middlewares/validar-origen.js`) se aplica a **todos** los métodos mutantes (POST, PUT, PATCH, DELETE). Valida el header `Origin` o `Referer` contra `FRONTEND_URL` y `CSRF_ALLOWED_ORIGINS`. En producción, si no hay `Origin`/`Referer`, retorna `403 FORBIDDEN`. En desarrollo, permite requests sin origen.

### Autenticación: cookies httpOnly

La API usa **dual JWT en cookies httpOnly** (no Authorization header):
- `accessToken`: expira en 1h (configurable via `ACCESS_TOKEN_EXPIRY`), contiene `{ id, tokenVersion }`.
- `refreshToken`: expira en 7d (configurable via `REFRESH_TOKEN_EXPIRY`), contiene `{ id }`.
- Ambas cookies: `httpOnly: true`, `secure: true`, `sameSite: 'none'`, `path: '/'`.

El middleware `verificarTokenSesion` (`middlewares/validar-jwt-cookies-sesion.js:8`) lee `req.cookies.accessToken`, verifica la firma con `ACCESS_TOKEN_SECRET`, valida que el usuario exista, tenga estatus activo, y que `tokenVersion` coincida. Si todo es correcto, establece `req.usuario = usuario.id`.

El middleware `verificarTokenSesionOpcional` (`middlewares/validar-jwt-cookies-sesion.js:49`) funciona igual pero **no bloquea** requests sin token o con token inválido: simplemente continúa sin setear `req.usuario`. Se usa en endpoints públicos que opcionalmente se personalizan si hay sesión (ej. `GET /api/posteos/post/:id`).

---

## Tabla de contenido rápida

| # | Método | Path | Auth | Rate Limiter |
|---|--------|------|------|-------------|
| 1 | GET | `/` | No | No |
| 2 | GET | `/api/health` | No | `lecturaLimiter` |
| 3 | GET | `/api/auth/verificar-correo{/:token}` | No | `verificacionLimiter` |
| 4 | POST | `/api/auth/reenviar-correo` | No | `reenvioCorreoLimiter` |
| 5 | POST | `/api/auth/login` | No | `loginLimiter` |
| 6 | POST | `/api/auth/cuentas/password-olvidado` | No | `recoveryLimiter` |
| 7 | POST | `/api/auth/reenviar-correo-restablecer-password` | No | `recoveryLimiter` |
| 8 | GET | `/api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}` | No | `recoveryLimiter` |
| 9 | POST | `/api/auth/cuentas/reestablecer-password{/:token}` | No | `recoveryLimiter` |
| 10 | POST | `/api/auth/refresh` | No (lee cookie refreshToken) | `refreshLimiter` |
| 11 | POST | `/api/auth/logout` | refreshToken cookie | No |
| 12 | GET | `/api/auth/me` | accessToken cookie | No |
| 13 | GET | `/api/usuarios` | No | `lecturaLimiter` |
| 14 | GET | `/api/usuarios/:url` | accessToken cookie | No |
| 15 | POST | `/api/usuarios` | No | `registroLimiter` |
| 16 | PUT | `/api/usuarios/update` | accessToken cookie | No |
| 17 | DELETE | `/api/usuarios/delete` | accessToken cookie | No |
| 18 | GET | `/api/usuarios/registrados/nuevos-usuarios-registrados` | accessToken cookie | No |
| 19 | PUT | `/api/uploads/:coleccion` | accessToken cookie | No |
| 20 | GET | `/api/posteos` | accessToken cookie | `lecturaLimiter` |
| 21 | GET | `/api/posteos/post/:id` | No (opcional) | `posteoPublicoLimiter` |
| 22 | GET | `/api/posteos/usuario/:idUsuario` | accessToken cookie | No |
| 23 | POST | `/api/posteos` | accessToken cookie | `posteoLimiter` |
| 24 | PUT | `/api/posteos/:id` | accessToken cookie | No |
| 25 | DELETE | `/api/posteos/:id` | accessToken cookie | No |
| 26 | POST | `/api/likes/:id/like` | accessToken cookie | No |
| 27 | GET | `/api/likes/posteo/:id` | accessToken cookie | No |
| 28 | GET | `/api/likes/:id/likes/usuarios` | accessToken cookie | No |
| 29 | POST | `/api/followers/follow/:id` | accessToken cookie | No |
| 30 | DELETE | `/api/followers/unfollow/:id` | accessToken cookie | No |
| 31 | GET | `/api/followers/usuario/lista-followers/:id` | accessToken cookie | No |
| 32 | GET | `/api/followers/usuario/lista-followings/:id` | accessToken cookie | No |
| 33 | GET | `/api/favoritos` | accessToken cookie | No |
| 34 | POST | `/api/favoritos/:posteoId` | accessToken cookie | No |
| 35 | DELETE | `/api/favoritos/:posteoId` | accessToken cookie | No |
| 36 | GET | `/api/municipios` | accessToken cookie | No |
| 37 | POST | `/api/notificaciones/subscribe` | accessToken cookie | No |
| 38 | POST | `/api/notificaciones/unsubscribe` | accessToken cookie | No |
| 39 | GET | `/api/notificaciones/vapidPublicKey` | accessToken cookie | No |
| 40 | GET | `/api/notificaciones` | accessToken cookie | No |
| 41 | PATCH | `/api/notificaciones/marcar-notificacion-leida/:id` | accessToken cookie | No |
| 42 | GET | `/api/notificaciones/nuevas-notificaciones` | accessToken cookie | No |
| 43 | DELETE | `/api/notificaciones/eliminar-notificacion/:id` | accessToken cookie | No |
| 44 | POST | `/api/ubicacion/reverse` | accessToken cookie | No |
| 45 | GET | `/api/ubicacion` | accessToken cookie | No |
| 46 | POST | `/api/ayuda-soporte/envio-correo` | accessToken cookie | `soporteLimiter` |
| 47 | POST | `/api/comentarios/:posteoId/comentarios` | accessToken cookie | `comentarioLimiter` |
| 48 | GET | `/api/comentarios/:posteoId/comentarios` | accessToken cookie | No |
| 49 | GET | `/api/comentarios/:posteoId/comentarios/count` | accessToken cookie | No |
| 50 | DELETE | `/api/comentarios/:comentarioId` | accessToken cookie | No |
| 51 | PUT | `/api/comentarios/:posteoId/comentarios/toggle` | accessToken cookie | No |

---

# 1. BIENVENIDA Y HEALTH

## GET /

**Descripción:** Endpoint raíz de la API. Retorna información básica del servicio.
**Archivo de ruta:** `routes/bienvenida.js:7`
**Controlador:** `controllers/bienvenida.js` — `getBienvenida` (línea 3)

### Autenticación y permisos
- Requiere token: **No**
- Middleware de auth: Ninguno
- Roles permitidos: N/A

### Parámetros de entrada
Ninguno.

### Ejemplo de response — éxito
- Código de estado: `200`
- Formato: JSON directo (no usa `responder()`)

```json
{
  "name": "TlaxApp API",
  "status": "online",
  "auth": "required",
  "message": "Esta API requiere autenticación."
}
```

### Códigos de error posibles
Ninguno (siempre retorna 200).

### Notas para el Frontend
- Este endpoint NO sigue el formato estándar de `responder()`. Retorna JSON directo.
- No requiere cookies ni headers especiales.

---

## GET /api/health

**Descripción:** Health check del servidor. Retorna estado de la BD, uso de memoria, uptime y PID.
**Archivo de ruta:** `routes/bienvenida.js:8`
**Controlador:** `controllers/bienvenida.js` — `getHealth` (línea 12)

### Autenticación y permisos
- Requiere token: **No**
- Middleware de auth: Ninguno

### Rate Limiting
- `lecturaLimiter`: 100 requests / 15 minutos → `READ_BLOCKED`

### Parámetros de entrada
Ninguno.

### Ejemplo de response — éxito
- Código de estado: `200`
- Formato: JSON directo (no usa `responder()`)

```json
{
  "status": "ok",
  "uptime": 12345.678,
  "timestamp": "2026-07-23T17:00:00.000Z",
  "service": "TlaxApp API",
  "version": "1.0.0",
  "environment": "development",
  "memory": {
    "rss": 85000000,
    "heapTotal": 45000000,
    "heapUsed": 32000000,
    "external": 3500000
  },
  "heapUsedPercentage": "71.11%",
  "pid": 12345,
  "db": {
    "status": "connected"
  }
}
```

### Códigos de error posibles
| Status | code | Detalle |
|--------|------|---------|
| 429 | `READ_BLOCKED` | Demasiadas solicitudes (lecturaLimiter) |

### Notas para el Frontend
- Este endpoint NO sigue el formato estándar de `responder()`. Retorna JSON directo.
- `db.status` puede ser `"connected"` o `"disconnected"` según `mongoose.connection.readyState`.

---

# 2. AUTENTICACIÓN (AUTH)

## GET /api/auth/verificar-correo{/:token}

**Descripción:** Verifica la cuenta de un usuario mediante el token JWT incluido en el link del correo de verificación. Activa la cuenta (`email_validated: true`, `estatus: 1`).
**Archivo de ruta:** `routes/auth.js:26`
**Controlador:** `controllers/auth.js` — `verificarCorreo` (línea 29)

### Autenticación y permisos
- Requiere token: **No** (el token viene como parámetro de URL)
- Middleware de auth: Ninguno

### Rate Limiting
- `verificacionLimiter`: 5 requests / 15 minutos → `VERIFICATION_BLOCKED`

### Middlewares (en orden)
1. `verificacionLimiter`
2. `validarTokenEnURL` — valida que el token exista en la URL (`middlewares/validar-token-en-url.js:4`)
3. `check('token', 'Token invalido').isJWT()` — express-validator
4. `validarCampos` — procesa errores de validación

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `token` | string (JWT) | Sí (opcional en path `{/:token}`) | `isJWT()`, debe existir |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Correo verificado"
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 400 | `BAD_REQUEST` | Bad Request | `El token es obligatorio en la URL` | `middlewares/validar-token-en-url.js:7` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `Token invalido` | express-validator (`routes/auth.js:28`) |
| 401 | `UNAUTHORIZED` | Authentication Required | `Token inválido o ha expirado` | `email/servicios-autenticacion-correo.js:199` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error interno al verificar la cuenta` | `email/servicios-autenticacion-correo.js:230` |
| 429 | `VERIFICATION_BLOCKED` | Rate Limit Exceeded | `Demasiados intentos de verificación...` | `middlewares/rate-limiter.js:56-68` |

### Notas para el Frontend
- El token es un JWT firmado con `EMAIL_VERIFICATION_SECRET`.
- El link del correo apunta a: `${FRONTEND_URL}/cuentas/crear-cuenta/cuenta-verificada/${token}`.
- El frontend debe hacer un GET a este endpoint con el token extraído de la URL.
- El path usa sintaxis Express 5: `{/:token}` hace el parámetro opcional, pero `validarTokenEnURL` lo fuerza como requerido.
- **Efecto secundario:** Al verificar, se establece `email_validated: true`, `estatus: 1`, y se elimina `verificacion_token`.

---

## POST /api/auth/reenviar-correo

**Descripción:** Reenvía el correo de verificación de cuenta. Requiere el token JWT que se guardó en sessionStorage al registrarse. Tiene cooldown de 5 minutos entre envíos.
**Archivo de ruta:** `routes/auth.js:32`
**Controlador:** `controllers/auth.js` — `reenviarCorreoVerificacion` (línea 43)

### Autenticación y permisos
- Requiere token: **No** (usa token de verificación en body)
- Middleware de auth: Ninguno

### Rate Limiting
- `reenvioCorreoLimiter`: 3 requests / 5 minutos → `EMAIL_BLOCKED`

### Middlewares (en orden)
1. `reenvioCorreoLimiter`
2. `check('token', 'Token invalido').isJWT()`
3. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `token` | string (JWT) | Sí | `isJWT()` |

### Ejemplo de request
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Correo reenviado a usuario@ejemplo.com"
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 422 | `VALIDATION_FAILED` | Validation Failed | `Token invalido` | express-validator |
| 401 | `UNAUTHORIZED` | Authentication Required | `Correo no existe` | `controllers/auth.js:56` |
| 403 | `FORBIDDEN` | Forbidden | `Cuenta ya verificada` | `controllers/auth.js:62` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | `Espera X minutos antes de reenviar el correo` | `controllers/auth.js:75` |
| 429 | `EMAIL_BLOCKED` | Rate Limit Exceeded | `Demasiados correos enviados...` | `middlewares/rate-limiter.js:71-83` |

### Notas para el Frontend
- El token del body NO es el accessToken de sesión. Es el JWT que se guardó en sessionStorage tras el registro exitoso.
- Cooldown de 5 minutos entre reenvíos (verificado via `ultimo_correo_enviado` en BD).
- **Efecto secundario:** Genera nuevo `verificacion_token` hasheado, actualiza `ultimo_correo_enviado`, y envía email.
- Si `SEND_EMAIL=false` en desarrollo, el correo no se envía realmente.

---

## POST /api/auth/login

**Descripción:** Inicia sesión del usuario. Valida credenciales, verifica que la cuenta esté activada, y establece cookies httpOnly con accessToken y refreshToken.
**Archivo de ruta:** `routes/auth.js:37`
**Controlador:** `controllers/auth.js` — `login` (línea 98)

### Autenticación y permisos
- Requiere token: **No**
- Middleware de auth: Ninguno

### Rate Limiting
- `loginLimiter`: 5 intentos / 15 minutos → `LOGIN_BLOCKED`
- KeyGenerator: IP + correo (o solo IP si no hay correo)

### Middlewares (en orden)
1. `loginLimiter`
2. `check('correo', 'El correo es obligatorio').isEmail()`
3. `check('password', 'El password es obligatorio').trim().notEmpty()`
4. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `correo` | string | Sí | `isEmail()` |
| body | `password` | string | Sí | `trim().notEmpty()` |

### Ejemplo de request
```json
{
  "correo": "usuario@ejemplo.com",
  "password": "MiPassword123!"
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
- Headers: `Set-Cookie: accessToken=...; refreshToken=...`

```json
{
  "success": true,
  "msg": "Login exitoso",
  "data": {
    "usuario": {
      "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
      "lugar_radicacion": { "nombreEntidad": "Tlaxcala", "claveMunicipio": "001", "nombreMunicipio": "Apizaco" },
      "correo": "usuario@ejemplo.com",
      "imagen_perfil": { "secure_url": "https://...", "public_id": "..." },
      "genero": "MASCULINO",
      "fecha_nacimiento": "1995-06-15T00:00:00.000Z",
      "fecha_actualizacion": "2026-07-20T10:00:00.000Z",
      "url": "juan-perez",
      "uid": "664a1b2c3d4e5f6a7b8c9d0e",
      "_id": "664a1b2c3d4e5f6a7b8c9d0e"
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 422 | `VALIDATION_FAILED` | Validation Failed | Errores de correo/password | express-validator |
| 401 | `UNAUTHORIZED` | Authentication Required | `Credenciales inválidas` | `controllers/auth.js:105` (correo no existe) |
| 401 | `UNAUTHORIZED` | Authentication Required | `Credenciales inválidas` | `controllers/auth.js:147` (password incorrecto) |
| 403 | `FORBIDDEN` | Forbidden | `Cuenta no verificada` | `controllers/auth.js:108` |
| 403 | `FORBIDDEN` | Forbidden | `Cuenta no activada` | `controllers/auth.js:111` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | `Cuenta bloqueada temporalmente por actividad inusual...` | `controllers/auth.js:118,143` |
| 429 | `LOGIN_BLOCKED` | Rate Limit Exceeded | `Demasiados intentos de inicio de sesión...` | `middlewares/rate-limiter.js:19-38` |

### Notas para el Frontend
- **Cookies establecidas:** `accessToken` (1h) y `refreshToken` (7d), ambas `httpOnly`, `secure`, `sameSite: 'none'`.
- El accessToken contiene `{ id, tokenVersion }` firmado con `ACCESS_TOKEN_SECRET`.
- El refreshToken se almacena hasheado (SHA-256) en la colección `UserToken`.
- **Efecto secundario:** Resetea `intentos_login` a 0, elimina `reset_password_token`, actualiza `ultimo_inicio_sesion`.
- **Bloqueo por intentos fallidos:** Tras 10 intentos fallidos de password, la cuenta se bloquea por 30 minutos. Se envía correo de notificación de intentos fallidos.
- El frontend debe enviar `credentials: 'include'` para que las cookies se intercambien correctamente.

---

## POST /api/auth/cuentas/password-olvidado

**Descripción:** Inicia el proceso de restablecimiento de contraseña. Envía un link al correo del usuario con un token JWT para restablecer.
**Archivo de ruta:** `routes/auth.js:46`
**Controlador:** `controllers/auth.js` — `envioCorreoReestablecerPassword` (línea 306)

### Autenticación y permisos
- Requiere token: **No**

### Rate Limiting
- `recoveryLimiter`: 3 requests / 15 minutos → `RECOVERY_BLOCKED`

### Middlewares (en orden)
1. `recoveryLimiter`
2. `check('correo', 'El correo no es valido').isEmail()`
3. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `correo` | string | Sí | `isEmail()` |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 422 | `VALIDATION_FAILED` | Validation Failed | `El correo no es valido` |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | `Demasiados intentos de recuperación...` |

### Notas para el Frontend
- **ANTI-ENUMERACIÓN:** Este endpoint SIEMPRE retorna 200 con el mismo mensaje, sin importar si el correo existe, si la cuenta está verificada, o si está en cooldown. Esto es intencional (`controllers/auth.js:250-262`).
- El `token` en `data` es un JWT para sessionStorage temporal del frontend (NO es el token de restablecimiento).
- El link de restablecimiento apunta a: `${FRONTEND_URL}/cuentas/login/restablecer-password/${token}`.
- Cooldown de 5 minutos entre envíos al mismo correo.

---

## POST /api/auth/reenviar-correo-restablecer-password

**Descripción:** Reenvía el correo de restablecimiento de contraseña. Usa el token JWT de sessionStorage para identificar al usuario.
**Archivo de ruta:** `routes/auth.js:53`
**Controlador:** `controllers/auth.js` — `reenvioCorreoRestablecerPassword` (línea 316)

### Autenticación y permisos
- Requiere token: **No** (usa token de sessionStorage en body)

### Rate Limiting
- `recoveryLimiter`: 3 requests / 15 minutos → `RECOVERY_BLOCKED`

### Middlewares (en orden)
1. `recoveryLimiter`
2. `check('token', 'Token invalido').isJWT()`
3. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `token` | string (JWT) | Sí | `isJWT()` |

### Ejemplo de response — éxito
- Código de estado: `200`
- Mismo formato anti-enumeración que `password-olvidado`:

```json
{
  "success": true,
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña",
  "data": { "token": "eyJhbGciOiJIUzI1NiIs..." }
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 422 | `VALIDATION_FAILED` | Validation Failed | `Token invalido` |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | `Demasiados intentos de recuperación...` |

### Notas para el Frontend
- Misma lógica anti-enumeración que `password-olvidado`. Siempre retorna 200.
- El token del body es el JWT de sessionStorage (firmado con `JWT_SEED`), no el accessToken de sesión.

---

## GET /api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}

**Descripción:** Valida que el token de restablecimiento de contraseña (incluido en el link del correo) sea válido. Se usa para determinar si mostrar el formulario de nueva contraseña.
**Archivo de ruta:** `routes/auth.js:58`
**Controlador:** `controllers/auth.js` — `validarTokenRestablecerPassword` (línea 329)

### Autenticación y permisos
- Requiere token: **No** (el token viene como parámetro de URL)

### Rate Limiting
- `recoveryLimiter`: 3 requests / 15 minutos → `RECOVERY_BLOCKED`

### Middlewares (en orden)
1. `recoveryLimiter`
2. `validarTokenEnURL`
3. `check('token', 'Token invalido').isJWT()`
4. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `token` | string (JWT) | Sí (path opcional `{/:token}`) | `isJWT()`, debe existir |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Token válido",
  "data": { "valid": true }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 400 | `BAD_REQUEST` | Bad Request | `El token es obligatorio en la URL` | `middlewares/validar-token-en-url.js:7` |
| 401 | `UNAUTHORIZED` | Authentication Required | `No hay token en la peticion` | `controllers/auth.js:334` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Token inválido o expirado` (prod) / detalle dev (dev) | `controllers/auth.js:340,344` |
| 403 | `FORBIDDEN` | Forbidden | `Token inválido o expirado` (prod) / detalle dev (dev) | `controllers/auth.js:348,352` |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | `Demasiados intentos de recuperación...` | rate-limiter |

### Notas para el Frontend
- El token se firma con `RESET_PASSWORD_SECRET` (diferente a `EMAIL_VERIFICATION_SECRET`).
- En **desarrollo**, los mensajes de error son detallados (ej. "El usuario no existe..."). En **producción**, todos dicen "Token inválido o expirado" para evitar enumeración.
- Valida: token JWT válido, usuario existe, `reset_password_token` coincide con hash del token URL, cuenta verificada, cuenta activa.

---

## POST /api/auth/cuentas/reestablecer-password{/:token}

**Descripción:** Restablece la contraseña del usuario usando el token del link de correo.
**Archivo de ruta:** `routes/auth.js:64`
**Controlador:** `controllers/auth.js` — `reestablecerPassword` (línea 367)

### Autenticación y permisos
- Requiere token: **No** (el token viene como parámetro de URL)

### Rate Limiting
- `recoveryLimiter`: 3 requests / 15 minutos → `RECOVERY_BLOCKED`

### Middlewares (en orden)
1. `recoveryLimiter`
2. `check('password', 'El password es obligatorio: debe tener al menos 8 caracteres').trim().isLength({ min: 8 })`
3. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `token` | string (JWT) | Sí (path opcional `{/:token}`) | JWT firmado con `RESET_PASSWORD_SECRET` |
| body | `password` | string | Sí | `trim().isLength({ min: 8 })` |

### Ejemplo de request
```json
{
  "password": "NuevaPassword123!"
}
```

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Password reestablecido"
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 422 | `VALIDATION_FAILED` | Validation Failed | `El password es obligatorio: debe tener al menos 8 caracteres` |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | `Demasiados intentos de recuperación...` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Error interno en `reestablecerPasswordUsuario` |

### Notas para el Frontend
- La validación del token y la actualización de la contraseña se delegan a `email/servicios-correo-reestablecer-password.js` — `reestablecerPasswordUsuario()`.
- Solo se valida longitud mínima de 8 caracteres (no se exige mayúsculas, números, etc. como en el registro).

---

## POST /api/auth/refresh

**Descripción:** Renueva el accessToken y refreshToken usando el refreshToken de la cookie. Rota ambos tokens y actualiza el registro en `UserToken`.
**Archivo de ruta:** `routes/auth.js:71`
**Controlador:** `controllers/auth.js` — `refreshToken` (línea 379)

### Autenticación y permisos
- Requiere token: **No** en header, pero lee `refreshToken` de cookies
- Middleware de auth: Ninguno (valida el refreshToken internamente)

### Rate Limiting
- `refreshLimiter`: 10 requests / 15 minutos → `REFRESH_BLOCKED`

### Middlewares (en orden)
1. `refreshLimiter`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| cookies | `refreshToken` | string (JWT) | Sí | Firma válida con `REFRESH_TOKEN_SECRET` |

### Ejemplo de response — éxito
- Código de estado: `200`
- Headers: `Set-Cookie: accessToken=...; refreshToken=...` (nuevos tokens)

```json
{
  "success": true,
  "msg": "Token renovado"
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | `No hay cookies de sesion para hacer refresh token` | `controllers/auth.js:386` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Sesión comprometida. Inicia sesión nuevamente.` | `controllers/auth.js:404` (reuso detectado) |
| 401 | `UNAUTHORIZED` | Authentication Required | `Token no válido o expirado` | `controllers/auth.js:464` |
| 403 | `FORBIDDEN` | Forbidden | `Token no registrado` | `controllers/auth.js:407` |
| 429 | `REFRESH_BLOCKED` | Rate Limit Exceeded | `Demasiadas solicitudes de renovación...` | rate-limiter |

### Notas para el Frontend
- **Rotación de tokens:** Cada refresh genera un nuevo accessToken Y un nuevo refreshToken. El anterior se invalida.
- **Detección de reuso:** Si un refreshToken ya fue rotado (no existe en `UserToken`), se verifica la firma. Si es válida, se asume reuso de token robado y se invalidan TODAS las sesiones del usuario (incrementa `tokenVersion`).
- El nuevo accessToken incluye el `tokenVersion` actualizado del usuario.
- El frontend debe llamar este endpoint cuando reciba un 401 en cualquier request autenticada.

---

## POST /api/auth/logout

**Descripción:** Cierra la sesión del usuario. Elimina el refreshToken de `UserToken` y limpia las cookies.
**Archivo de ruta:** `routes/auth.js:73`
**Controlador:** `controllers/auth.js` — `logout` (línea 468)

### Autenticación y permisos
- Requiere token: **refreshToken en cookie** (no accessToken)
- Middleware de auth: `validarRefreshToken` — solo verifica que la cookie `refreshToken` exista

### Middlewares (en orden)
1. `validarRefreshToken` (`middlewares/validar-jwt-cookies-sesion.js:49`)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| cookies | `refreshToken` | string | Sí | Debe existir en la cookie |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Sesión cerrada"
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | `No hay refresh token en la petición` | `middlewares/validar-jwt-cookies-sesion.js:55` |

### Notas para el Frontend
- El middleware `validarRefreshToken` NO verifica la firma del JWT, solo verifica que la cookie exista.
- `cerrarSesionCookies` elimina el token hasheado de `UserToken` y limpia ambas cookies (`accessToken` y `refreshToken`).
- El frontend debe enviar `credentials: 'include'` para que las cookies se envíen.

---

## GET /api/auth/me

**Descripción:** Obtiene los datos del usuario actualmente autenticado.
**Archivo de ruta:** `routes/auth.js:78`
**Controlador:** `controllers/auth.js` — `getMe` (línea 223)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion` → establece `req.usuario = usuario.id`

### Parámetros de entrada
Ninguno (el ID se obtiene del token).

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Usuario obtenido",
  "data": {
    "usuario": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
      "lugar_radicacion": { "nombreEntidad": "Tlaxcala", "claveMunicipio": "001", "nombreMunicipio": "Apizaco" },
      "imagen_perfil": { "secure_url": "https://...", "public_id": "..." },
      "correo": "usuario@ejemplo.com",
      "url": "juan-perez",
      "genero": "MASCULINO",
      "fecha_nacimiento": "1995-06-15T00:00:00.000Z"
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | `No hay token en la petición` | `middlewares/validar-jwt-cookies-sesion.js:14` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Token no válido` | `middlewares/validar-jwt-cookies-sesion.js:45` |
| 403 | `FORBIDDEN` | Forbidden | `Cuenta no activada...` | `middlewares/validar-jwt-cookies-sesion.js:31` |
| 404 | `NOT_FOUND` | Resource Not Found | `Usuario no existe` | `controllers/auth.js:232` |

### Notas para el Frontend
- Campos retornados: `nombre_completo`, `lugar_radicacion`, `imagen_perfil`, `correo`, `url`, `genero`, `fecha_nacimiento`.
- El `toJSON()` del schema Usuario reemplaza `_id` por `uid`, pero aquí se usa `.select()` directo que retorna `_id`.

---

# 3. USUARIOS

## GET /api/usuarios

**Descripción:** Endpoint desactivado. Retorna 410 Gone.
**Archivo de ruta:** `routes/usuarios.js:19`
**Controlador:** `controllers/usuarios.js` — `usuariosGet` (línea 32)

### Autenticación y permisos
- Requiere token: **No** (no tiene middleware de auth)

### Rate Limiting
- `lecturaLimiter`: 100 requests / 15 minutos → `READ_BLOCKED`

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 410 | `GONE` | Gone | `Este endpoint ya no está disponible` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | `Demasiadas solicitudes...` |

### Notas para el Frontend
- Este endpoint está **desactivado intencionalmente**. El frontend NO debe llamarlo.

---

## GET /api/usuarios/:url

**Descripción:** Obtiene el perfil público de un usuario por su URL/slug, enriquecido con contadores de posteos, seguidores, seguidos, y si el usuario autenticado lo sigue.
**Archivo de ruta:** `routes/usuarios.js:21`
**Controlador:** `controllers/usuarios.js` — `usuarioGet` (línea 36)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('url', 'La URL no es valida').trim()`
3. `validarUrlUsuario` — valida que la URL exista y el usuario esté activo
4. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `url` | string | Sí | `trim()`, debe existir en BD |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": {
    "usuario": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
      "lugar_radicacion": { "nombreEntidad": "Tlaxcala", "claveMunicipio": "001", "nombreMunicipio": "Apizaco" },
      "imagen_perfil": { "secure_url": "https://...", "public_id": "..." },
      "url": "juan-perez",
      "totalPosteos": 25,
      "totalSeguidores": 120,
      "totalSeguidos": 45,
      "isFollowing": true
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | `No hay token en la petición` | `middlewares/validar-jwt-cookies-sesion.js:14` |
| 404 | `NOT_FOUND` | Resource Not Found | `El usuario con URL "xxx" no existe` | `middlewares/validar-url-usuario.js:14` |
| 401 | `UNAUTHORIZED` | Authentication Required | `El usuario con URL "xxx" no ha verificado su cuenta` | `middlewares/validar-url-usuario.js:18` |
| 401 | `UNAUTHORIZED` | Authentication Required | `El usuario con URL "xxx" no ha activado su cuenta` | `middlewares/validar-url-usuario.js:22` |
| 403 | `FORBIDDEN` | Forbidden | `El usuario con URL "xxx" tiene la cuenta suspendida` | `middlewares/validar-url-usuario.js:26` |

### Notas para el Frontend
- `isFollowing` indica si el usuario autenticado sigue al dueño del perfil.
- `totalPosteos` cuenta solo posteos no eliminados (`isDeleted: false`).
- `totalSeguidores` y `totalSeguidos` cuentan follows no eliminados.

---

## POST /api/usuarios

**Descripción:** Registra un nuevo usuario. Envía correo de verificación y retorna un token JWT para sessionStorage.
**Archivo de ruta:** `routes/usuarios.js:33`
**Controlador:** `controllers/usuarios.js` — `usuariosPost` (línea 79)

### Autenticación y permisos
- Requiere token: **No**

### Rate Limiting
- `registroLimiter`: 3 registros / 1 hora → `REGISTER_BLOCKED`

### Middlewares (en orden)
1. `registroLimiter`
2. `check('nombre_completo.nombre', 'El nombre es obligatorio').trim().notEmpty()`
3. `check('nombre_completo.apellido', 'El apellido es obligatorio').trim().notEmpty()`
4. `check('correo', 'El correo no es valido').isEmail()`
5. `check('correo').custom(validarCorreoUsuario)` — valida que no esté duplicado
6. `check('password').trim().isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]])/)` 
7. `check('estatus', ...).optional().trim().isNumeric()`
8. `check('intentos_login', ...).optional().trim().isNumeric()`
9. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `nombre_completo.nombre` | string | Sí | `trim().notEmpty()` |
| body | `nombre_completo.apellido` | string | Sí | `trim().notEmpty()` |
| body | `correo` | string | Sí | `isEmail()`, único en BD |
| body | `password` | string | Sí | min 8 chars, al menos 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial |
| body | `estatus` | number | No | `isNumeric()` (opcional) |
| body | `intentos_login` | number | No | `isNumeric()` (opcional) |

### Ejemplo de request
```json
{
  "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
  "correo": "juan@ejemplo.com",
  "password": "MiPassword123!"
}
```

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 409 | `CONFLICT` | Conflict | `El correo ya está registrado en la base de datos` | `middlewares/validar-campos.js:18` (detecta error de `validarCorreoUsuario`) |
| 422 | `VALIDATION_FAILED` | Validation Failed | Errores de campos | express-validator |
| 429 | `REGISTER_BLOCKED` | Rate Limit Exceeded | `Demasiadas cuentas creadas...` | rate-limiter |

### Notas para el Frontend
- **Regex de password:** `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]])/`
- El `token` retornado es un JWT firmado con `JWT_SEED` que contiene `{ correo }`. Es para sessionStorage temporal (para redirigir a la página de confirmación).
- **Efecto secundario:** Crea el usuario en BD con `estatus: 0`, `email_validated: false`, genera URL única, hashea password con bcrypt (salt 10), envía correo de verificación.
- Si `SEND_EMAIL=false`, el correo no se envía pero el usuario se crea igual.
- La URL del usuario se genera automáticamente a partir del nombre completo (`helpers/crear-url-usuario.js`).

---

## PUT /api/usuarios/update

**Descripción:** Actualiza los datos del usuario autenticado. No permite actualizar imagen de perfil (hay endpoint separado para eso).
**Archivo de ruta:** `routes/usuarios.js:60`
**Controlador:** `controllers/usuarios.js` — `usuariosPut` (línea 135)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion` → `req.usuario`

### Middlewares (en orden)
1. `verificarTokenSesion`
2. Validaciones express-validator (todos opcionales)
3. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `nombre_completo.nombre` | string | No | `optional().trim().notEmpty()` |
| body | `nombre_completo.apellido` | string | No | `optional().trim().notEmpty()` |
| body | `password` | string | No | `optional().trim().isLength({ min: 8 })` |
| body | `lugar_radicacion.nombreEntidad` | string | No | `optional().notEmpty()` |
| body | `lugar_radicacion.claveMunicipio` | string | No | `optional().notEmpty()` |
| body | `lugar_radicacion.nombreMunicipio` | string | No | `optional().notEmpty()` |
| body | `genero` | string | No | `optional().isIn(['MASCULINO', 'FEMENINO', 'PREFIERO NO DECIR'])` |
| body | `fecha_nacimiento` | string (Date) | No | `optional().isDate()` |

### Ejemplo de request
```json
{
  "nombre_completo": { "nombre": "Juan Carlos", "apellido": "Pérez López" },
  "genero": "MASCULINO",
  "fecha_nacimiento": "1995-06-15",
  "lugar_radicacion": {
    "nombreEntidad": "Tlaxcala",
    "claveMunicipio": "001",
    "nombreMunicipio": "Apizaco"
  }
}
```

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Usuario actualizado",
  "data": {
    "usuario": {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "nombre_completo": { "nombre": "Juan Carlos", "apellido": "Pérez López" },
      "lugar_radicacion": { "nombreEntidad": "Tlaxcala", "claveMunicipio": "001", "nombreMunicipio": "Apizaco" },
      "correo": "juan@ejemplo.com",
      "url": "juan-carlos-perez-lopez",
      "genero": "MASCULINO",
      "fecha_nacimiento": "1995-06-15T00:00:00.000Z"
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente |
| 422 | `VALIDATION_FAILED` | Validation Failed | Errores de campos |

### Notas para el Frontend
- **Whitelist de campos permitidos:** Solo `nombre_completo`, `lugar_radicacion`, `genero`, `fecha_nacimiento` (`controllers/usuarios.js:23-28`). Cualquier otro campo en el body es ignorado (excepto `password` que se procesa aparte).
- `_id` y `correo` nunca se actualizan.
- Si se envía `password`, se hashea con bcrypt (salt 10).
- Se actualiza `fecha_actualizacion` automáticamente.

---

## DELETE /api/usuarios/delete

**Descripción:** Elimina la cuenta del usuario autenticado (soft delete). Usa transacciones MongoDB para atomicidad. Marca como eliminado al usuario y todos sus datos relacionados (posteos, follows, likes, notificaciones, favoritos, comentarios).
**Archivo de ruta:** `routes/usuarios.js:82`
**Controlador:** `controllers/usuarios.js` — `usuariosDelete` (línea 173)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| cookies | `refreshToken` | string | Sí | Debe existir para cerrar sesión |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Cuenta eliminada exitosamente. Tus datos serán eliminados permanentemente en unos días."
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente | `verificarTokenSesion` |
| 403 | `FORBIDDEN` | Forbidden | `No hay refresh token` | `controllers/usuarios.js:189` |
| 404 | `NOT_FOUND` | Resource Not Found | `Usuario no encontrado` | `controllers/usuarios.js:201` |
| 400 | `BAD_REQUEST` | Bad Request | `La cuenta ya fue eliminada previamente` | `controllers/usuarios.js:208` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un problema al eliminar la cuenta...` | `controllers/usuarios.js:354` |

### Notas para el Frontend
- **Transacción MongoDB:** Todas las operaciones (soft delete de usuario, posteos, follows, likes, notificaciones, favoritos, comentarios) se ejecutan en una transacción atómica. Si algo falla, todo se revierte.
- **Efectos secundarios:**
  - `estatus: 4`, `isDeleted: true`, `deletedAt: now`
  - Posteos: `isDeleted: true`, `deleteReason: "accountDeletion"`
  - Follows, Likes, Notificaciones, Favoritos: `isDeleted: true`
  - Comentarios: `isDeleted: true`, `deleteReason: "accountDeletion"`
  - Decrementa `comentariosCount` en posteos afectados
  - Cierra sesión (limpia cookies y elimina refreshToken de `UserToken`)
- Un cron job se encarga de eliminar físicamente los datos después del período de retención.

---

## GET /api/usuarios/registrados/nuevos-usuarios-registrados

**Descripción:** Obtiene los últimos 3 usuarios registrados en la plataforma (excluyendo al usuario autenticado). Incluye si el usuario autenticado los sigue.
**Archivo de ruta:** `routes/usuarios.js:87`
**Controlador:** `controllers/usuarios.js` — `nuevosUsuariosRegistrados` (línea 364)

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
  "msg": "Nuevos Usuarios Registrados",
  "data": {
    "nuevosUsuariosRegistrados": [
      {
        "_id": "664a1b2c3d4e5f6a7b8c9d0e",
        "nombre_completo": { "nombre": "María", "apellido": "García" },
        "url": "maria-garcia",
        "imagen_perfil": { "secure_url": "https://...", "public_id": "..." },
        "isFollowing": false
      }
    ]
  }
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener los nuevos usuarios` |

### Notas para el Frontend
- Solo retorna usuarios con `estatus: 1` y `email_validated: true`.
- Excluye al usuario autenticado.
- Usa aggregation pipeline con `$lookup` a la colección `follows` para determinar `isFollowing`.
- Máximo 3 resultados, ordenados por `fecha_registro` descendente.

---

# 4. UPLOADS (IMAGEN DE PERFIL)

## PUT /api/uploads/:coleccion

**Descripción:** Actualiza la imagen de perfil del usuario autenticado. Sube la nueva imagen a Cloudinary y elimina la anterior (si no es la imagen por defecto).
**Archivo de ruta:** `routes/uploads.js:16`
**Controlador:** `controllers/uploads.js` — `actualizarImagen` (línea 9)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `upload.single('img')` — Multer: memoria, 5MB, jpg/jpeg/png/webp
3. `validarCampoImg` — valida que `req.file` exista
4. `validarImagenesMulter` — maneja errores de Multer
5. `check('coleccion').custom(c => coleccionesPermitidas(c, ['usuarios']))` — solo `usuarios`
6. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `coleccion` | string | Sí | Debe ser `'usuarios'` |
| multipart | `img` | File | Sí | jpg/jpeg/png/webp, máx 5MB |

### Ejemplo de request
- Content-Type: `multipart/form-data`
- Field name: `img`
- Archivo: imagen jpg/png/webp, máximo 5MB

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Imagen de perfil actualizada correctamente",
  "data": {
    "imagen_perfil": {
      "secure_url": "https://res.cloudinary.com/.../imagen.jpg",
      "public_id": "imagenes-perfiles-usuarios/664a1b2c3d4e5f6a7b8c9d0e/uuid"
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 400 | `BAD_REQUEST` | Bad Request | `La imagen excede el tamaño máximo permitido (5 MB)` | `middlewares/validar-imagen-posteo.js:27` |
| 400 | `BAD_REQUEST` | Bad Request | `No existe un usuario con el ID: xxx` | `controllers/uploads.js:24` |
| 404 | `NOT_FOUND` | Resource Not Found | `No hay ninguna imagen para subir` | `middlewares/validar-imagen-posteo.js:19` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `La coleccion: xxx no esta permitida` | express-validator |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al actualizar la imagen` | `controllers/uploads.js:93` |

### Notas para el Frontend
- **Formato:** `multipart/form-data` con campo `img`.
- La imagen se sube a Cloudinary con transformación: 500px width, `fill` crop, formato auto, calidad auto.
- Si la imagen anterior NO es la default, se elimina de Cloudinary antes de subir la nueva.
- Solo la colección `usuarios` está permitida.
- El `public_id` en Cloudinary sigue el patrón: `imagenes-perfiles-usuarios/{userId}/{uuid}`.

---

# 5. POSTEOS

## GET /api/posteos

**Descripción:** Obtiene los posteos públicos de otros usuarios (excluye los del usuario autenticado), paginados y ordenados por fecha de creación descendente. Enriquecidos con estado de follow, favorito y likes.
**Archivo de ruta:** `routes/posteos.js:30`
**Controlador:** `controllers/posteos.js` — `posteosGet` (línea 15)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)
- Middleware de auth: `verificarTokenSesion`

### Rate Limiting
- `lecturaLimiter`: 100 requests / 15 minutos → `READ_BLOCKED`

### Middlewares (en orden)
1. `lecturaLimiter`
2. `verificarTokenSesion`
3. `check('page', ...).optional().isNumeric()`
4. `check('limite', ...).optional().isNumeric()`
5. `validarCampos`

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
    {
      "_id": "664a1b2c3d4e5f6a7b8c9d0e",
      "_idUsuario": {
        "_id": "...",
        "nombre_completo": { "nombre": "María" },
        "url": "maria-garcia",
        "imagen_perfil": { "public_id": "..." }
      },
      "ubicacion": { "municipio": "Apizaco", "estado": "Tlaxcala" },
      "public_id": "cloudinary_public_id",
      "texto": "Mi primer posteo",
      "fecha_creacion": "2026-07-20T10:00:00.000Z",
      "comentariosActivos": true,
      "isFollowing": false,
      "isFavorito": true,
      "likesCount": 5,
      "hasLiked": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 120,
    "totalPages": 8,
    "next": "/api/posteos?page=2&limit=15",
    "prev": null
  }
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido o ausente |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El parametro PAGE/LIMITE debe ser de tipo numerico` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | `Demasiadas solicitudes...` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error al obtener los posteos...` |

### Notas para el Frontend
- Filtros aplicados: `posteo_publico: true`, `_idUsuario: { $ne: req.usuario }`, `isDeleted: false`.
- Enriquecimiento: `isFollowing` (si sigue al autor), `isFavorito` (si el posteo está en favoritos), `likesCount`, `hasLiked` (si el usuario dio like).
- Orden: `fecha_creacion` descendente (más recientes primero).
- Populate de `_idUsuario`: `nombre_completo`, `url`, `imagen_perfil.public_id`.

---

## GET /api/posteos/post/:id

**Descripción:** Obtiene un posteo individual por ID. **Endpoint público** — no requiere autenticación. Si el usuario tiene una sesión válida (cookie `accessToken`), la respuesta se personaliza con `hasLiked`, `isFollowing` e `isFavorito`.

**Archivo de ruta:** `routes/posteos.js:40`
**Controlador:** `controllers/posteos.js` — `posteoGet` (línea 111)

### Autenticación y permisos
- Requiere token: **No** (opcional: si hay cookie `accessToken` válida, se enriquece la respuesta)

### Rate Limiting
- `posteoPublicoLimiter`: 100 requests / 15 minutos → `POST_DETAIL_BLOCKED`

### Middlewares (en orden)
1. `posteoPublicoLimiter`
2. `verificarTokenSesionOpcional` — si hay token válido setea `req.usuario`, si no continúa sin error
3. `check('id', 'El ID no es valido').isMongoId()`
4. `validarCampos`
5. `validarIdPosteo` — valida que el posteo exista y no esté eliminado

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string (MongoId) | Sí | `isMongoId()` |

### Ejemplo de response — éxito (usuario NO autenticado)
- Código de estado: `200`

```json
{
  "success": true,
  "data": {
    "posteo": {
      "_id": "...",
      "_idUsuario": {
        "_id": "...",
        "nombre_completo": { "nombre": "María" },
        "imagen_perfil": { "public_id": "..." },
        "url": "maria-garcia"
      },
      "public_id": "...",
      "texto": "Mi posteo",
      "ubicacion": { ... },
      "fecha_creacion": "...",
      "comentariosCount": 3,
      "likesCount": 10
    }
  }
}
```

### Ejemplo de response — éxito (usuario CON sesión válida)
- Código de estado: `200`

```json
{
  "success": true,
  "data": {
    "posteo": {
      "_id": "...",
      "_idUsuario": {
        "_id": "...",
        "nombre_completo": { "nombre": "María" },
        "imagen_perfil": { "public_id": "..." },
        "url": "maria-garcia"
      },
      "public_id": "...",
      "texto": "Mi posteo",
      "ubicacion": { ... },
      "fecha_creacion": "...",
      "comentariosCount": 3,
      "likesCount": 10,
      "hasLiked": false
    },
    "isFollowing": true,
    "isFavorito": false
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: xxx ha sido eliminado` | `helpers/validar-id-posteo.js:9` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: xxx no existe` | `helpers/validar-id-posteo.js:13` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` | express-validator |
| 429 | `POST_DETAIL_BLOCKED` | Rate Limit Exceeded | `Demasiadas solicitudes, intenta de nuevo más tarde` | `middlewares/rate-limiter.js` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error al obtener el posteo por ID, contactar a soporte.` | `controllers/posteos.js` |

### Notas para el Frontend
- **Endpoint público:** NO requiere enviar cookies. Funciona para links compartidos, SEO, y web scraping legítimo.
- **Respuesta adaptable:**
  - Sin sesión → `data.posteo` incluye `likesCount`, `comentariosCount`. NO incluye `hasLiked`, `isFollowing`, `isFavorito`.
  - Con sesión → `data.posteo` incluye además `hasLiked`, y se añaden `isFollowing` e `isFavorito` al mismo nivel de `posteo`.
- Se excluyen campos: `posteo_publico`, `deleteReason`, `secure_url`, `deletedAt`, `comentariosActivos`.
- `likesCount` y `comentariosCount` se incluyen siempre.
- NO se expone: lista de usuarios que dieron like, ni los comentarios del posteo (para eso usar endpoints específicos).

---

## GET /api/posteos/usuario/:idUsuario

**Descripción:** Obtiene todos los posteos de un usuario específico, paginados y ordenados por fecha descendente. Enriquecidos con datos de likes.
**Archivo de ruta:** `routes/posteos.js:51`
**Controlador:** `controllers/posteos.js` — `posteosUsuarioGet` (línea 164)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('idUsuario', 'El ID no es valido').isMongoId()`
3. `check('page', ...).optional().isNumeric()`
4. `check('limite', ...).optional().isNumeric()`
5. `validarCampos`
6. `validarIdUsuario` — valida que el usuario exista y esté activo

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta | Default |
|---|---|---|---|---|---|
| params | `idUsuario` | string (MongoId) | Sí | `isMongoId()`, debe existir en BD | - |
| query | `page` | number | No | `isNumeric()` | 1 |
| query | `limite` | number | No | `isNumeric()` | 15 |

### Ejemplo de response — éxito
- Código de estado: `200` (paginado)

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "public_id": "...",
      "secure_url": "https://res.cloudinary.com/...",
      "likesCount": 5,
      "hasLiked": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 25,
    "totalPages": 2,
    "next": "/api/posteos/usuario/664a1b2c3d4e5f6a7b8c9d0e?page=2&limit=15",
    "prev": null
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido | `verificarTokenSesion` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID xxx no existe en la BD` | `helpers/validar-id-usuario.js:10` |
| 404 | `NOT_FOUND` | Resource Not Found | `El usuario con ID xxx no está activo` | `helpers/validar-id-usuario.js:14` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` | express-validator |

### Notas para el Frontend
- Solo retorna posteos no eliminados (`isDeleted: false`).
- Selecciona solo `public_id` y `secure_url` (optimizado para galería de imágenes).
- `secure_url` se incluye para `ImagePreloader` en el frontend.

---

## POST /api/posteos

**Descripción:** Crea un nuevo posteo con imagen (obligatoria) y texto opcional. Sube la imagen a Cloudinary.
**Archivo de ruta:** `routes/posteos.js:64`
**Controlador:** `controllers/posteos.js` — `posteosPost` (línea 238)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

### Rate Limiting
- `posteoLimiter`: 20 posteos / 15 minutos → `POSTEO_BLOCKED`

### Middlewares (en orden)
1. `posteoLimiter`
2. `verificarTokenSesion`
3. `upload.single('img')` — Multer
4. `validarCampoImg` — valida que haya imagen
5. `validarImagenesMulter` — maneja errores de Multer
6. `validarTexto` — regex de texto permitido
7. `check('posteo_publico', ...).optional().isBoolean()`
8. `check('lat', ...).optional().isFloat()`
9. `check('lng', ...).optional().isFloat()`
10. `validarCampos`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| multipart | `img` | File | Sí | jpg/jpeg/png/webp, máx 5MB |
| multipart | `texto` | string | No | Regex: `/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,!?¡¿()\s-]*$/` |
| multipart | `posteo_publico` | boolean | No | `isBoolean()` (default: true) |
| multipart | `municipio` | string | No | - |
| multipart | `ciudad` | string | No | - |
| multipart | `estado` | string | No | - |
| multipart | `pais` | string | No | Default: "México" |
| multipart | `lat` | number | No | `isFloat()` |
| multipart | `lng` | number | No | `isFloat()` |

### Ejemplo de request
- Content-Type: `multipart/form-data`
- Fields: `img` (archivo), `texto`, `posteo_publico`, `lat`, `lng`, `municipio`

### Ejemplo de response — éxito
- Código de estado: `201`

```json
{
  "success": true,
  "msg": "Posteo creado correctamente",
  "data": {
    "posteo": {
      "_id": "...",
      "_idUsuario": "664a1b2c3d4e5f6a7b8c9d0e",
      "public_id": "cloudinary_id",
      "texto": "Mi primer posteo",
      "secure_url": "https://res.cloudinary.com/...",
      "posteo_publico": true,
      "ubicacion": {
        "ciudad": null,
        "municipio": "Apizaco",
        "estado": "Tlaxcala",
        "pais": "México",
        "esExacta": true,
        "coordinates": { "type": "Point", "coordinates": [-98.12, 19.42] }
      },
      "fecha_creacion": "2026-07-23T17:00:00.000Z",
      "comentariosActivos": true,
      "comentariosCount": 0
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 400 | `BAD_REQUEST` | Bad Request | Errores de Multer (tamaño, tipo) |
| 404 | `NOT_FOUND` | Resource Not Found | `No hay ninguna imagen para subir` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El campo de texto contiene caracteres no permitidos` |
| 429 | `POSTEO_BLOCKED` | Rate Limit Exceeded | `Demasiadas publicaciones...` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error interno al procesar la publicación` |

### Notas para el Frontend
- **Formato:** `multipart/form-data` (no JSON).
- La imagen es **obligatoria**. Se sube a Cloudinary con transformación: 1080px max width, `limit` crop, formato auto, calidad auto, progressive.
- El texto es opcional. Si se envía, solo permite: letras (incluyendo acentos y ñ), números, `.,!?¡¿()-` y espacios.
- `posteo_publico` puede llegar como string `"true"` desde FormData; el controlador lo normaliza a booleano.
- Si se envían `lat` y `lng`, se guardan como GeoJSON `[lng, lat]` (orden MongoDB).
- Si se selecciona municipio manualmente, las coordenadas GPS deben ser `null` (regla de negocio).

---

## PUT /api/posteos/:id

**Descripción:** Actualiza un posteo existente (texto, visibilidad, ubicación). Solo el dueño puede actualizarlo.
**Archivo de ruta:** `routes/posteos.js:86`
**Controlador:** `controllers/posteos.js` — `posteosPut` (línea 317)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('id', 'El ID no es valido').isMongoId()`
3. `validarTexto`
4. `validarCampos`
5. `validarIdPosteo`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string (MongoId) | Sí | `isMongoId()` |
| body | `texto` | string | No | Regex de texto permitido |
| body | `posteo_publico` | boolean | No | - |
| body | `municipio` | string/null | No | - |
| body | `ciudad` | string | No | - |
| body | `estado` | string | No | - |
| body | `pais` | string | No | - |
| body | `lat` | number | No | - |
| body | `lng` | number | No | - |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Posteo actualizado correctamente",
  "data": {
    "posteo": { "_id": "...", "texto": "Texto actualizado", ... }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido | `verificarTokenSesion` |
| 403 | `FORBIDDEN` | Forbidden | `No tienes permiso para modificar este posteo.` | `controllers/posteos.js:388` |
| 404 | `NOT_FOUND` | Resource Not Found | Posteo no existe o eliminado | `validarIdPosteo` |
| 422 | `VALIDATION_FAILED` | Validation Failed | Texto con caracteres no permitidos | `validarTexto` |

### Notas para el Frontend
- La verificación de propiedad es atómica: `findOneAndUpdate({ _id, _idUsuario: req.usuario, isDeleted: false })`.
- Si el usuario no es el dueño, retorna 403 (no 404).
- Para eliminar la ubicación, enviar `municipio: null` y `lat: null`.
- Se actualiza `fecha_actualizacion` automáticamente.

---

## DELETE /api/posteos/:id

**Descripción:** Soft delete de un posteo. Solo el dueño puede eliminarlo.
**Archivo de ruta:** `routes/posteos.js:98`
**Controlador:** `controllers/posteos.js` — `posteosDelete` (línea 403)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('id', 'El ID no es valido').isMongoId()`
3. `validarCampos`
4. `validarIdPosteo`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string (MongoId) | Sí | `isMongoId()` |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Posteo con imagen eliminado correctamente"
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido | `verificarTokenSesion` |
| 403 | `FORBIDDEN` | Forbidden | `No tienes permiso para eliminar este posteo.` | `controllers/posteos.js:416` |
| 404 | `NOT_FOUND` | Resource Not Found | Posteo no existe o eliminado | `validarIdPosteo` |

### Notas para el Frontend
- Soft delete: establece `isDeleted: true`, `deleteReason: "manual"`, `deletedAt: now`.
- Un cron job elimina físicamente los posteos después del período de retención.
- La verificación de propiedad es atómica.

---

# 6. LIKES

## POST /api/likes/:id/like

**Descripción:** Toggle de like en un posteo. Si el usuario ya dio like, lo elimina; si no, lo crea.
**Archivo de ruta:** `routes/likes.js:11`
**Controlador:** `controllers/likes.js` — `likeDislikePosteo` (línea 12)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('id', 'El ID no es valido').isMongoId()`
3. `validarCampos`
4. `validarIdPosteo`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string (MongoId) | Sí | `isMongoId()` |

### Ejemplo de response — éxito (like añadido)
- Código de estado: `200`

```json
{ "success": true, "msg": "Like añadido" }
```

### Ejemplo de response — éxito (like eliminado)
- Código de estado: `200`

```json
{ "success": true, "msg": "Like eliminado" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido | `verificarTokenSesion` |
| 404 | `NOT_FOUND` | Resource Not Found | `Publicación no encontrada` | `controllers/likes.js:23` |
| 404 | `NOT_FOUND` | Resource Not Found | Posteo eliminado o no existe | `validarIdPosteo` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al procesar el like` | `controllers/likes.js:43` |

### Notas para el Frontend
- **Comportamiento toggle:** Un solo endpoint para dar like y quitar like.
- El Like se crea con `_idCreadorPosteo` (ID del dueño del posteo), útil para notificaciones.
- Índice único `{ _idUsuario: 1, posteoId: 1 }` previene duplicados a nivel de BD.

---

## GET /api/likes/posteo/:id

**Descripción:** Obtiene el conteo total de likes de un posteo.
**Archivo de ruta:** `routes/likes.js:21`
**Controlador:** `controllers/likes.js` — `getLikesPosteos` (línea 47)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('id', 'El ID no es valido').isMongoId()`
3. `validarCampos`
4. `validarIdPosteo`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string (MongoId) | Sí | `isMongoId()` |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": { "likes": 15, "posteo": "664a1b2c3d4e5f6a7b8c9d0e" }
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido |
| 404 | `NOT_FOUND` | Resource Not Found | Posteo no existe o eliminado |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener el número de likes` |

---

## GET /api/likes/:id/likes/usuarios

**Descripción:** Obtiene la lista de usuarios que dieron like a un posteo.
**Archivo de ruta:** `routes/likes.js:32`
**Controlador:** `controllers/likes.js` — `getLikesUsuariosPosteos` (línea 60)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('id', 'El ID no es valido').isMongoId()`
3. `validarCampos`
4. `validarIdPosteo`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string (MongoId) | Sí | `isMongoId()` |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Likes de usuarios a posteo obtenidos correctamente",
  "data": {
    "likes_usuarios_posteo": [
      {
        "_idUsuario": {
          "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
          "imagen_perfil": { "secure_url": "https://..." },
          "url": "juan-perez"
        }
      }
    ]
  }
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido |
| 404 | `NOT_FOUND` | Resource Not Found | Posteo no existe o eliminado |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener los likes de usuarios` |

---

# 7. FOLLOWERS

## POST /api/followers/follow/:id

**Descripción:** Sigue a un usuario. Crea la relación de follow y una notificación persistente. Envía push notification si el usuario objetivo tiene notificaciones activadas.
**Archivo de ruta:** `routes/followers.js:14`
**Controlador:** `controllers/followers.js` — `followUsuario` (línea 10)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('id', 'El ID no es valido').isMongoId()`
3. `validarCampos`
4. `validarIdUsuario`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string (MongoId) | Sí | `isMongoId()`, usuario activo |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{ "success": true, "msg": "Has comenzado a seguir a este usuario" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 400 | `BAD_REQUEST` | Bad Request | `No puedes seguirte a ti mismo` | `controllers/followers.js:20` |
| 400 | `BAD_REQUEST` | Bad Request | `Ya sigues a este usuario` | `controllers/followers.js:37` |
| 404 | `NOT_FOUND` | Resource Not Found | `El usuario que intentas seguir no existe` | `controllers/followers.js:41` |
| 404 | `NOT_FOUND` | Resource Not Found | Usuario no existe o inactivo | `validarIdUsuario` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error al seguir a un usuario` | `controllers/followers.js:109` |

### Notas para el Frontend
- **Efectos secundarios:**
  - Crea documento `Follow` con `{ follower: req.usuario, following: id }`.
  - Crea `Notificacion` con `{ receptor: id, emisor: req.usuario, tipo: "follow", mensaje: "comenzó a seguirte" }`.
  - Envía Web Push notification (no bloqueante, async después de la respuesta).
- El push notification incluye: title "TlaxApp | Nuevo seguidor", body con nombre del seguidor, icon con imagen de perfil.
- Si las suscripciones push fallan (410/404), se limpian automáticamente.

---

## DELETE /api/followers/unfollow/:id

**Descripción:** Deja de seguir a un usuario.
**Archivo de ruta:** `routes/followers.js:25`
**Controlador:** `controllers/followers.js` — `unfollowUsuario` (línea 113)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('id', 'El ID no es valido').isMongoId()`
3. `validarCampos`
4. `validarIdUsuario`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string (MongoId) | Sí | `isMongoId()` |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{ "success": true, "msg": "Dejaste de seguir a este usuario" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 400 | `BAD_REQUEST` | Bad Request | `No sigues a este usuario` | `controllers/followers.js:128` |
| 404 | `NOT_FOUND` | Resource Not Found | Usuario no existe | `validarIdUsuario` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error al dejar de seguir...` | `controllers/followers.js:133` |

---

## GET /api/followers/usuario/lista-followers/:id

**Descripción:** Obtiene la lista de seguidores de un usuario (quién lo sigue). Enriquecido con `isFollowing` (si el usuario autenticado sigue a cada seguidor).
**Archivo de ruta:** `routes/followers.js:35`
**Controlador:** `controllers/followers.js` — `obtenerFollowers` (línea 138)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('id', 'El ID no es valido').isMongoId()`
3. `validarCampos`
4. `validarIdUsuario`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string (MongoId) | Sí | `isMongoId()` |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Seguidores obtenidos correctamente",
  "data": {
    "totalSeguidores": 25,
    "seguidores": [
      {
        "follower": {
          "_id": "...",
          "nombre_completo": { "nombre": "María", "apellido": "García" },
          "imagen_perfil": { "secure_url": "https://...", "public_id": "..." },
          "url": "maria-garcia"
        },
        "isFollowing": true
      }
    ]
  }
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido |
| 404 | `NOT_FOUND` | Resource Not Found | Usuario no existe |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener seguidores` |

### Notas para el Frontend
- `isFollowing` indica si el usuario autenticado sigue a cada seguidor de la lista.
- Solo retorna follows no eliminados (`isDeleted: false`).

---

## GET /api/followers/usuario/lista-followings/:id

**Descripción:** Obtiene la lista de usuarios que sigue un perfil específico. Enriquecido con `isFollowing` (si el usuario autenticado sigue a cada uno).
**Archivo de ruta:** `routes/followers.js:45`
**Controlador:** `controllers/followers.js` — `obtenerFollowings` (línea 178)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('id', 'El ID no es valido').isMongoId()`
3. `validarCampos`
4. `validarIdUsuario`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string (MongoId) | Sí | `isMongoId()` |

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Usuarios seguidos, obtenidos correctamente",
  "data": {
    "totalSeguidos": 15,
    "siguiendo": [
      {
        "_id": "...",
        "following": {
          "_id": "...",
          "nombre_completo": { "nombre": "Carlos", "apellido": "López" },
          "imagen_perfil": { "secure_url": "https://..." },
          "url": "carlos-lopez"
        },
        "isFollowing": false
      }
    ]
  }
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido |
| 404 | `NOT_FOUND` | Resource Not Found | Usuario no existe |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error en obtener followings` |

### Notas para el Frontend
- Usa aggregation pipeline con doble `$lookup` (a `usuarios` y a `follows`).
- Ordenado por `createdAt` descendente (más recientes primero).

---

# 8. FAVORITOS

## GET /api/favoritos

**Descripción:** Obtiene los posteos favoritos del usuario autenticado, paginados.
**Archivo de ruta:** `routes/favoritos.js:13`
**Controlador:** `controllers/favoritos.js` — `obtenerFavoritosUsuario` (línea 10)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

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
- Código de estado: `200` (paginado)

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "createdAt": "2026-07-20T10:00:00.000Z",
      "posteoId": { "public_id": "...", "posteo_publico": true },
      "autorId": { "nombre_completo": { "nombre": "María" }, "url": "maria-garcia" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 8,
    "totalPages": 1,
    "next": null,
    "prev": null
  }
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un problema al realizar la peticion...` |

### Notas para el Frontend
- Excluye favoritos cuyo posteo fue eliminado (`$match: { 'posteo.0': { $exists: true } }`).
- Ordenado por `createdAt` descendente.

---

## POST /api/favoritos/:posteoId

**Descripción:** Agrega un posteo a favoritos del usuario autenticado.
**Archivo de ruta:** `routes/favoritos.js:24`
**Controlador:** `controllers/favoritos.js` — `agregarPosteoFavorito` (línea 88)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('posteoId', 'El posteoId debe ser valido').isMongoId()`
3. `check('autorId', 'El autorId es obligatorio').isMongoId()`
4. `validarCampos`
5. `validarIdPosteo`
6. `validarIdUsuario` (valida `autorId` del body)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | string (MongoId) | Sí | `isMongoId()` |
| body | `autorId` | string (MongoId) | Sí | `isMongoId()`, usuario activo |

### Ejemplo de request
```json
{
  "autorId": "664a1b2c3d4e5f6a7b8c9d0e"
}
```

### Ejemplo de response — éxito
- Código de estado: `200`

```json
{ "success": true, "msg": "Agregado en Favoritos" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|--------|------|-------|--------|----------------|
| 400 | `BAD_REQUEST` | Bad Request | `No puedes agregar a favoritos tus propios posteos` | `controllers/favoritos.js:103` |
| 409 | `CONFLICT` | Conflict | `Este posteo ya está en tus favoritos` | `controllers/favoritos.js:120` |
| 404 | `NOT_FOUND` | Resource Not Found | Posteo no existe o eliminado | `validarIdPosteo` |
| 404 | `NOT_FOUND` | Resource Not Found | Usuario (autor) no existe | `validarIdUsuario` |

### Notas para el Frontend
- `autorId` es **obligatorio en el body** (no se obtiene del posteo).
- No se puede agregar a favoritos los propios posteos.
- Usa `upsert` con `$setOnInsert` para evitar duplicados.
- Si ya existe, retorna 409 Conflict.

---

## DELETE /api/favoritos/:posteoId

**Descripción:** Elimina un posteo de los favoritos del usuario autenticado.
**Archivo de ruta:** `routes/favoritos.js:38`
**Controlador:** `controllers/favoritos.js` — `eliminarPosteoFavorito` (línea 131)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

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
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con id xxx no existe en favoritos` | `controllers/favoritos.js:141` |
| 404 | `NOT_FOUND` | Resource Not Found | Posteo no existe | `validarIdPosteo` |

---

# 9. MUNICIPIOS

## GET /api/municipios

**Descripción:** Obtiene todos los municipios del estado de Tlaxcala, ordenados alfabéticamente. Excluye el campo `geometry` para reducir el tamaño de la respuesta.
**Archivo de ruta:** `routes/municipios.js:7`
**Controlador:** `controllers/municipios.js` — `obtenerMunicipios` (línea 7)

### Autenticación y permisos
- Requiere token: **Sí** (accessToken en cookie)

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
      {
        "_id": "...",
        "claveEntidad": 29,
        "nombreEntidad": "Tlaxcala",
        "claveMunicipio": 1,
        "nombreMunicipio": "Apizaco",
        "codigoPostal": "90300"
      }
    ]
  }
}
```

### Códigos de error posibles
| Status | code | title | detail |
|--------|------|-------|--------|
| 401 | `UNAUTHORIZED` | Authentication Required | Token inválido |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener los municipios` |

### Notas para el Frontend
- El campo `geometry` (GeoJSON Polygon/MultiPolygon) se excluye de la respuesta para optimizar.
- Si se necesita la geometría (para mapas), usar `POST /api/ubicacion/reverse`.
