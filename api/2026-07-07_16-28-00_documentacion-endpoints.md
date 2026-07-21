# Documentación de Endpoints API — TlaxApp

**Generado:** 2026-07-20 19:08:39
**Total de endpoints documentados:** 51
**Archivos de rutas explorados:** `routes/auth.js`, `routes/bienvenida.js`, `routes/comentarios.js`, `routes/favoritos.js`, `routes/followers.js`, `routes/likes.js`, `routes/municipios.js`, `routes/notificaciones.js`, `routes/posteos.js`, `routes/soporte.js`, `routes/ubicacion.js`, `routes/uploads.js`, `routes/usuarios.js`
**Endpoints no verificables completamente:** Ninguno detectado; todos los endpoints registrados en `routes/` tienen controlador asignado. Las respuestas de éxito de ejemplos están construidas a partir del esquema y del código fuente (`[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`).

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
| `code` | string | Código de error machine-readable |
| `trace_id` | string | ID único de correlación para logging (`req.traceId`) |
| `errors` | array | Detalles de validación (opcional): `[{ field, code, message }]` |

### Clases de error del dominio

Definidas en `errors/error-classes.js` (heredan de `AppError` en `errors/app-error.js`):

| HTTP | Clase | `code` | title | Archivo |
|---|---|---|---|---|
| 400 | `BadRequestError` | `BAD_REQUEST` | `Bad Request` | `errors/error-classes.js:14` |
| 401 | `AuthenticationError` | `UNAUTHORIZED` | `Authentication Required` | `errors/error-classes.js:21` |
| 403 | `ForbiddenError` | `FORBIDDEN` | `Forbidden` | `errors/error-classes.js:28` |
| 404 | `NotFoundError` | `NOT_FOUND` | `Resource Not Found` | `errors/error-classes.js:35` |
| 409 | `ConflictError` | `CONFLICT` | `Conflict` | `errors/error-classes.js:42` |
| 422 | `ValidationError` | `VALIDATION_FAILED` | `Validation Failed` | `errors/error-classes.js:49` |
| 429 | `RateLimitError` | `RATE_LIMIT_EXCEEDED` | `Rate Limit Exceeded` | `errors/error-classes.js:60` |
| 500 | `InternalError` | `INTERNAL_ERROR` | `Internal Server Error` | `errors/error-classes.js:73` |

### Errores adicionales manejados por el error handler

| Origen | `code` | HTTP | Dónde se captura |
|---|---|---|---|
| Multer (subida de archivos, `LIMIT_*`) | `FILE_ERROR` | 400 | `middlewares/error-handler.js:43-58` |
| express-validator (`err.array()`) | `VALIDATION_FAILED` | 422 | `middlewares/error-handler.js:61-77` |
| JSON parse malformado (`entity.parse.failed`) | `INVALID_JSON` | 400 | `middlewares/error-handler.js:80-90` |
| Error no contemplado (catch-all) | `INTERNAL_ERROR` | 500 | `middlewares/error-handler.js:93-104` |

> **Nota:** Los códigos de error machine-readable (`code`) están en **MAYÚSCULAS**. El frontend debe comparar contra `UNAUTHORIZED`, `VALIDATION_FAILED`, etc.

### Rate limiting

Los rate limiters están definidos en `middlewares/rate-limiter.js`. Cada uno produce una respuesta RFC 9457 con un `code` propio y **no incluye** `retry_after`.

| Limiter | Ventana | Máximo | `code` | Archivo |
|---|---|---|---|---|
| `loginLimiter` | 15 minutos | 5 intentos | `LOGIN_BLOCKED` | `middlewares/rate-limiter.js:19-38` |
| `recoveryLimiter` | 15 minutos | 3 intentos | `RECOVERY_BLOCKED` | `middlewares/rate-limiter.js:41-53` |
| `reenvioCorreoLimiter` | 5 minutos | 3 intentos | `EMAIL_BLOCKED` | `middlewares/rate-limiter.js:56-68` |
| `registroLimiter` | 1 hora | 3 registros | `REGISTER_BLOCKED` | `middlewares/rate-limiter.js:71-83` |
| `posteoLimiter` | 15 minutos | 20 posteos | `POSTEO_BLOCKED` | `middlewares/rate-limiter.js:86-98` |
| `soporteLimiter` | 15 minutos | 5 tickets | `SOPORTE_BLOCKED` | `middlewares/rate-limiter.js:101-113` |
| `lecturaLimiter` | 15 minutos | 100 lecturas | `READ_BLOCKED` | `middlewares/rate-limiter.js:116-128` |
| `comentarioLimiter` | 1 minuto | 10 comentarios | `COMENTARIO_BLOCKED` | `middlewares/rate-limiter.js:131-143` |
| `refreshLimiter` | 15 minutos | 10 renovaciones | `REFRESH_BLOCKED` | `middlewares/rate-limiter.js:146-158` |

Además, los controladores pueden lanzar `RateLimitError` (`code: RATE_LIMIT_EXCEEDED`) con `retry_after` en segundos (por ejemplo, cooldown de 5 minutos entre reenvíos de correo o bloqueo por 10 intentos fallidos de login).

### Autenticación dual JWT

La API usa cookies httpOnly para el access token y el refresh token (`models/server.js:80`, `controllers/auth.js:176-191`):

- `accessToken`: JWT de acceso. `httpOnly: true`, `secure: true`, `sameSite: 'none'`, `path: '/'`, `maxAge: 60 * 60 * 1000` (1 hora por defecto).
- `refreshToken`: JWT de refresco. `httpOnly: true`, `secure: true`, `sameSite: 'none'`, `path: '/'`, `maxAge: 7 * 24 * 60 * 60 * 1000` (7 días por defecto).

El refresh token se almacena hasheado (SHA-256) en la colección `UserToken` con TTL de 30 días (`models/UserToken.js:38`).

El middleware `validarOrigen` (`middlewares/validar-origen.js`) protege contra CSRF en métodos mutantes (POST, PUT, PATCH, DELETE). Requiere que el header `Origin` o `Referer` coincida con `FRONTEND_URL` o los orígenes listados en `CSRF_ALLOWED_ORIGINS`.

---

## 1. Bienvenida y salud

### 1.1 GET /

**Descripción:** Mensaje de bienvenida de la API y aviso de que la autenticación es requerida.
**Archivo de ruta:** `routes/bienvenida.js:6`
**Controlador:** `controllers/bienvenida.js` — `getBienvenida` (línea 6)

**Autenticación:** No requiere token.
**Rate limiter:** No aplica.
**Headers requeridos:** Ninguno.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "name": "TlaxApp API",
  "status": "online",
  "auth": "required",
  "message": "Esta API requiere autenticación."
}
```

**Respuestas de error:** Ninguna error de dominio esperada; solo 500 por fallos internos.

---

### 1.2 GET /api/health

**Descripción:** Devuelve información de salud del servidor: uptime, memoria, estado de MongoDB y entorno.
**Archivo de ruta:** `routes/bienvenida.js:7`
**Controlador:** `controllers/bienvenida.js` — `getHealth` (línea 16)

**Autenticación:** No requiere token.
**Rate limiter:** No aplica.
**Headers requeridos:** Ninguno.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": "ok",
  "uptime": 1234.56,
  "timestamp": "2026-07-20T19:08:39.000Z",
  "service": "TlaxApp API",
  "version": "1.0.0",
  "environment": "development",
  "memory": {
    "rss": 123456789,
    "heapTotal": 98765432,
    "heapUsed": 87654321,
    "external": 1234567
  },
  "heapUsedPercentage": "88.75%",
  "pid": 12345,
  "db": { "status": "connected" }
}
```

**Respuestas de error:** Solo 500 `INTERNAL_ERROR` por fallos internos.

---

## 2. Autenticación

### 2.1 GET /api/auth/verificar-correo/{:token}

**Descripción:** Verifica el correo electrónico de un usuario recién registrado usando el token enviado por email.
**Archivo de ruta:** `routes/auth.js:26`
**Controlador:** `controllers/auth.js` — `verificarCorreo` (línea 28)

**Autenticación:** No requiere token.
**Rate limiter:** No aplica.
**Headers requeridos:** Ninguno.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `token` | string JWT | Sí (en ruta, opcional por sintaxis `{:token}`) | Token de verificación de correo. El middleware `validarTokenEnURL` valida que exista (`middlewares/validar-token-en-url.js:5`). |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "ok": true,
  "msg": "Correo verificado"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 400 | `BAD_REQUEST` | `Bad Request` | `"El token es obligatorio en la URL"` | `middlewares/validar-token-en-url.js:7` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"Token invalido"` | `routes/auth.js:28` (express-validator) |
| 401/403/404/500 | Varios | — | Errores propagados por `verificarCorreoEnviado` | `controllers/auth.js:33-41` |

**Notas especiales:**
- Sintaxis `path-to-regexp` v8 (Express 5): el token es opcional en la ruta (`/verificar-correo{/:token}`). Si no se proporciona, el middleware `validarTokenEnURL` devuelve 400.
- El token se valida como JWT con `check('token').isJWT()`.

---

### 2.2 POST /api/auth/reenviar-correo

**Descripción:** Reenvía el correo de verificación a un usuario que aún no ha activado su cuenta.
**Archivo de ruta:** `routes/auth.js:32`
**Controlador:** `controllers/auth.js` — `reenviarCorreoVerificacion` (línea 45)

**Autenticación:** No requiere token.
**Rate limiter:** `reenvioCorreoLimiter` (5 min, 3 intentos) → `EMAIL_BLOCKED`.
**Headers requeridos:** `Content-Type: application/json`.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `token` | string JWT | Sí | `check('token').isJWT()` (`routes/auth.js:33`) |

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "msg": "Correo reenviado a usuario@ejemplo.com"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | `Authentication Required` | `"Correo no existe"` | `controllers/auth.js:58` |
| 403 | `FORBIDDEN` | `Forbidden` | `"Cuenta ya verificada"` | `controllers/auth.js:64` |
| 429 | `RATE_LIMIT_EXCEEDED` | `Rate Limit Exceeded` | `"Espera N minutos antes de reenviar el correo"` | `controllers/auth.js:77` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"Token invalido"` | `routes/auth.js:33` |
| 429 | `EMAIL_BLOCKED` | `Rate Limit Exceeded` | `"Demasiados correos enviados, intenta de nuevo en 5 minutos"` | `middlewares/rate-limiter.js:64` |

---

### 2.3 POST /api/auth/login

**Descripción:** Inicia sesión con correo y contraseña. Crea cookies httpOnly con access token y refresh token.
**Archivo de ruta:** `routes/auth.js:37`
**Controlador:** `controllers/auth.js` — `login` (línea 103)

**Autenticación:** No requiere token (endpoint de login).
**Rate limiter:** `loginLimiter` (15 min, 5 intentos) → `LOGIN_BLOCKED`. `keyGenerator` usa `IP + correo` si el correo está presente (`middlewares/rate-limiter.js:30-35`).
**Headers requeridos:** `Content-Type: application/json`, `Origin`/`Referer` permitido para métodos mutantes.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `correo` | string | Sí | `check('correo').isEmail()` (`routes/auth.js:39`) |
| `password` | string | Sí | `check('password').trim().notEmpty()` (`routes/auth.js:41`) |

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "usuario": {
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala" },
    "correo": "usuario@ejemplo.com",
    "imagen_perfil": {
      "secure_url": "https://res.cloudinary.com/.../no-imagen-usuario_koriq0.webp",
      "public_id": null
    },
    "genero": "MASCULINO",
    "fecha_nacimiento": "1990-01-01T00:00:00.000Z",
    "fecha_actualizacion": null,
    "url": "juan-perez",
    "uid": "507f1f77bcf86cd799439011",
    "_id": "507f1f77bcf86cd799439011"
  },
  "msg": "Login exitoso"
}
```
También setea las cookies `accessToken` y `refreshToken` (httpOnly, secure, sameSite: none).

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | `Authentication Required` | `"Credenciales inválidas"` | `controllers/auth.js:110` o `controllers/auth.js:152` |
| 403 | `FORBIDDEN` | `Forbidden` | `"Cuenta no verificada"` | `controllers/auth.js:113` |
| 403 | `FORBIDDEN` | `Forbidden` | `"Cuenta no activada"` | `controllers/auth.js:116` |
| 429 | `RATE_LIMIT_EXCEEDED` | `Rate Limit Exceeded` | `"Cuenta bloqueada temporalmente por actividad inusual..."` | `controllers/auth.js:123` o `controllers/auth.js:148` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | Errores de `correo` y `password` | `routes/auth.js:39-43` |
| 429 | `LOGIN_BLOCKED` | `Rate Limit Exceeded` | `"Demasiados intentos de inicio de sesión..."` | `middlewares/rate-limiter.js:27` |

**Notas especiales:**
- Tras un login exitoso se reinicia `intentos_login` a 0 y se elimina `bloqueo_login_hasta` (`controllers/auth.js:195-200`).
- Si hay `reset_password_token` activo, se elimina (`controllers/auth.js:197`).
- Si se alcanzan 10 intentos fallidos, la cuenta se bloquea por 30 minutos y se envía un email de notificación (si `SEND_EMAIL` lo permite).

---

### 2.4 POST /api/auth/cuentas/password-olvidado

**Descripción:** Solicita el envío de un enlace para restablecer la contraseña. **Intencionalmente devuelve siempre 200 con el mismo mensaje genérico** para evitar enumeración de correos.
**Archivo de ruta:** `routes/auth.js:46`
**Controlador:** `controllers/auth.js` — `envioCorreoReestablecerPassword` (línea 316), delega a `procesarEnvioReestablecerPassword` (línea 271)

**Autenticación:** No requiere token.
**Rate limiter:** `recoveryLimiter` (15 min, 3 intentos) → `RECOVERY_BLOCKED`.
**Headers requeridos:** `Content-Type: application/json`.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `correo` | string | Sí | `check('correo').isEmail()` (`routes/auth.js:48`) |

**Respuesta de éxito (200):** Siempre devuelve:
```json
{
  "status": 200,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"
}
```
El `token` es un session token temporal para el frontend.

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El correo no es valido"` | `routes/auth.js:48` |
| 429 | `RECOVERY_BLOCKED` | `Rate Limit Exceeded` | `"Demasiados intentos de recuperación de contraseña..."` | `middlewares/rate-limiter.js:49` |

**Notas especiales:**
- Aunque el correo no exista, la cuenta no esté verificada o esté en cooldown de 5 min, la respuesta es siempre 200 con el mismo mensaje (`controllers/auth.js:258-285`).
- El cooldown de 5 minutos se valida por `ultimo_correo_enviado` (`controllers/auth.js:275-285`).

---

### 2.5 POST /api/auth/reenviar-correo-restablecer-password

**Descripción:** Reenvía el correo de restablecimiento de contraseña usando el token temporal del frontend. Comportamiento anti-enumeración idéntico al endpoint anterior.
**Archivo de ruta:** `routes/auth.js:53`
**Controlador:** `controllers/auth.js` — `reenvioCorreoRestablecerPassword` (línea 326)

**Autenticación:** No requiere token.
**Rate limiter:** `recoveryLimiter` (15 min, 3 intentos) → `RECOVERY_BLOCKED`.
**Headers requeridos:** `Content-Type: application/json`.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `token` | string JWT | Sí | `check('token').isJWT()` (`routes/auth.js:54`) |

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"Token invalido"` | `routes/auth.js:54` |
| 429 | `RECOVERY_BLOCKED` | `Rate Limit Exceeded` | `"Demasiados intentos de recuperación de contraseña..."` | `middlewares/rate-limiter.js:49` |

---

### 2.6 GET /api/auth/cuentas/restablecer-password/validar-token-reset-password/{:token}

**Descripción:** Valida el token del enlace de restablecimiento de contraseña. Si es válido, el frontend puede mostrar el formulario para cambiar la contraseña.
**Archivo de ruta:** `routes/auth.js:58`
**Controlador:** `controllers/auth.js` — `validarTokenRestablecerPassword` (línea 339)

**Autenticación:** No requiere token.
**Rate limiter:** No aplica.
**Headers requeridos:** Ninguno.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `token` | string JWT | Sí | Token de restablecimiento de contraseña. |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "msg": "Token válido",
  "valid": true
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 400 | `BAD_REQUEST` | `Bad Request` | `"El token es obligatorio en la URL"` | `middlewares/validar-token-en-url.js:7` |
| 401 | `UNAUTHORIZED` | `Authentication Required` | `"Token inválido o expirado"` (prod) / `"El usuario no existe o la cuenta fue eliminada (estatus 4)"` (dev) | `controllers/auth.js:350-356` |
| 403 | `FORBIDDEN` | `Forbidden` | `"Token inválido o expirado"` (prod) / detalles de verificación/estatus (dev) | `controllers/auth.js:358-364` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"Token invalido"` | `routes/auth.js:60` |

---

### 2.7 POST /api/auth/cuentas/reestablecer-password/{:token}

**Descripción:** Restablece la contraseña del usuario usando el token de restablecimiento.
**Archivo de ruta:** `routes/auth.js:64`
**Controlador:** `controllers/auth.js` — `reestablecerPassword` (línea 378)

**Autenticación:** No requiere token.
**Rate limiter:** No aplica.
**Headers requeridos:** `Content-Type: application/json`.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `token` | string JWT | Sí | Token de restablecimiento. |

**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `password` | string | Sí | `check('password').trim().isLength({ min: 8 })` (`routes/auth.js:66`) |

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "msg": "Password reestablecido"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El password es obligatorio: debe tener al menos 8 caracteres"` | `routes/auth.js:66` |
| 401/404/500 | Varios | — | Errores propagados por `reestablecerPasswordUsuario` | `controllers/auth.js:382-389` |

---

### 2.8 POST /api/auth/refresh

**Descripción:** Renueva el access token usando el refresh token de las cookies. Rota el refresh token almacenado.
**Archivo de ruta:** `routes/auth.js:71`
**Controlador:** `controllers/auth.js` — `refreshToken` (línea 393)

**Autenticación:** Requiere cookie `refreshToken` (no access token).
**Rate limiter:** `refreshLimiter` (15 min, 10 intentos) → `REFRESH_BLOCKED`.
**Headers requeridos:** Cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):** Setea nuevas cookies `accessToken` y `refreshToken`.
```json
{
  "status": 200,
  "msg": "Token renovado"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | `Authentication Required` | `"No hay cookies de sesion para hacer refresh token"` | `controllers/auth.js:400` |
| 401 | `UNAUTHORIZED` | `Authentication Required` | `"Sesión comprometida. Inicia sesión nuevamente."` | `controllers/auth.js:418` (posible reuso detectado) |
| 403 | `FORBIDDEN` | `Forbidden` | `"Token no registrado"` | `controllers/auth.js:421` |
| 401 | `UNAUTHORIZED` | `Authentication Required` | `"Token no válido o expirado"` | `controllers/auth.js:481` |
| 429 | `REFRESH_BLOCKED` | `Rate Limit Exceeded` | `"Demasiadas solicitudes de renovación de token..."` | `middlewares/rate-limiter.js:154` |

---

### 2.9 POST /api/auth/logout

**Descripción:** Cierra la sesión del usuario, elimina el refresh token de la base de datos y limpia las cookies.
**Archivo de ruta:** `routes/auth.js:73`
**Controlador:** `controllers/auth.js` — `logout` (línea 485)

**Autenticación:** Requiere cookie `refreshToken` (middleware `validarRefreshToken`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "msg": "Sesión cerrada"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | `Authentication Required` | `"No hay refresh token en la petición"` | `middlewares/validar-jwt-cookies-sesion.js:55` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al eliminar las cookies..."` (catch de `cerrarSesionCookies`) | `helpers/cerrar-sesion-cookies.js:24` |

---

### 2.10 GET /api/auth/me

**Descripción:** Devuelve los datos del usuario actualmente autenticado.
**Archivo de ruta:** `routes/auth.js:78`
**Controlador:** `controllers/auth.js` — `getMe` (línea 229)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "msg": "Usuario obtenido",
  "ok": true,
  "usuario": {
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala" },
    "imagen_perfil": { "secure_url": "...", "public_id": null },
    "correo": "usuario@ejemplo.com",
    "url": "juan-perez",
    "genero": "MASCULINO",
    "fecha_nacimiento": "1990-01-01T00:00:00.000Z"
  }
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | `Authentication Required` | `"No hay token en la petición"` | `middlewares/validar-jwt-cookies-sesion.js:14` |
| 401 | `UNAUTHORIZED` | `Authentication Required` | `"Token no válido"` | `middlewares/validar-jwt-cookies-sesion.js:45` |
| 401 | `UNAUTHORIZED` | `Authentication Required` | `"Token no válido - usuario no existe"` | `middlewares/validar-jwt-cookies-sesion.js:27` |
| 403 | `FORBIDDEN` | `Forbidden` | `"Cuenta no activada. El usuario debe verificar su cuenta"` | `middlewares/validar-jwt-cookies-sesion.js:31` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"Usuario no existe"` | `controllers/auth.js:238` |

---

## 3. Usuarios

### 3.1 GET /api/usuarios

**Descripción:** Endpoint de control interno; actualmente no devuelve lista de usuarios.
**Archivo de ruta:** `routes/usuarios.js:19`
**Controlador:** `controllers/usuarios.js` — `usuariosGet` (línea 30)

**Autenticación:** No requiere token (solo `lecturaLimiter`).
**Rate limiter:** `lecturaLimiter` (15 min, 100) → `READ_BLOCKED`.
**Headers requeridos:** Ninguno.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "msg": "DE MOMENTO ESTA API PARA MOSTRAR A LOS USUARIOS NO SE VA A OCUPAR"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | `Rate Limit Exceeded` | `"Demasiadas solicitudes, intenta de nuevo más tarde"` | `middlewares/rate-limiter.js:124` |

---

### 3.2 GET /api/usuarios/:url

**Descripción:** Obtiene el perfil de un usuario por su URL única (slug), incluyendo contadores de posteos, seguidores y seguidos.
**Archivo de ruta:** `routes/usuarios.js:21`
**Controlador:** `controllers/usuarios.js` — `usuarioGet` (línea 38)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `url` | string | Sí | `check('url').trim()` + `validarUrlUsuario` (`routes/usuarios.js:25-29`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "usuario": {
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala" },
    "imagen_perfil": { "secure_url": "...", "public_id": null },
    "_id": "507f1f77bcf86cd799439011",
    "url": "juan-perez",
    "totalPosteos": 12,
    "totalSeguidores": 5,
    "totalSeguidos": 8,
    "isFollowing": true
  }
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | `Authentication Required` | Varios mensajes de autenticación | `middlewares/validar-jwt-cookies-sesion.js` |
| 403 | `FORBIDDEN` | `Forbidden` | `"El usuario con URL \"...\" tiene la cuenta suspendida"` | `middlewares/validar-url-usuario.js:26` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El usuario con URL \"...\" no existe"` | `middlewares/validar-url-usuario.js:14` |
| 401 | `UNAUTHORIZED` | `Authentication Required` | `"El usuario con URL \"...\" no ha verificado/activado su cuenta"` | `middlewares/validar-url-usuario.js:18` o `22` |

---

### 3.3 POST /api/usuarios

**Descripción:** Registra una nueva cuenta de usuario, envía correo de verificación y devuelve un token temporal para sessionStorage del frontend.
**Archivo de ruta:** `routes/usuarios.js:33`
**Controlador:** `controllers/usuarios.js` — `usuariosPost` (línea 83)

**Autenticación:** No requiere token.
**Rate limiter:** `registroLimiter` (1 hora, 3 registros) → `REGISTER_BLOCKED`.
**Headers requeridos:** `Content-Type: application/json`.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `nombre_completo.nombre` | string | Sí | `trim().notEmpty()` (`routes/usuarios.js:35`) |
| `nombre_completo.apellido` | string | Sí | `trim().notEmpty()` (`routes/usuarios.js:37`) |
| `correo` | string | Sí | `isEmail()` + `validarCorreoUsuario` (único en BD) (`routes/usuarios.js:39-41`) |
| `password` | string | Sí | `min: 8` + regex con mayúscula, minúscula, número y carácter especial (`routes/usuarios.js:43-47`) |
| `estatus` | string/number | No | `optional().trim().isNumeric()` (`routes/usuarios.js:49`) |
| `intentos_login` | string/number | No | `optional().trim().isNumeric()` (`routes/usuarios.js:51`) |

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 409 | `CONFLICT` | `Conflict` | `"El correo ya está registrado en la base de datos"` | `middlewares/validar-campos.js:18` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | Errores de validación de campos | `routes/usuarios.js:35-52` |
| 429 | `REGISTER_BLOCKED` | `Rate Limit Exceeded` | `"Demasiadas cuentas creadas desde esta conexión..."` | `middlewares/rate-limiter.js:79` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un problema al procesar la solicitud"` | `controllers/usuarios.js:134` |

**Notas especiales:**
- El email solo se envía si `envioCorreoVerificacion` retorna `true` (en dev, `SEND_EMAIL=false` lo anula). Si el correo falla, el usuario **no se guarda** en la BD (`controllers/usuarios.js:123-125`).
- Se genera automáticamente un `url` único basado en el nombre completo (`helpers/crear-url-usuario.js`).
- La contraseña se hashea con bcrypt antes de guardar.

---

### 3.4 PUT /api/usuarios/update

**Descripción:** Actualiza los datos del usuario autenticado. No permite actualizar correo ni imagen de perfil.
**Archivo de ruta:** `routes/usuarios.js:60`
**Controlador:** `controllers/usuarios.js` — `usuariosPut` (línea 142)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** `Content-Type: application/json`, cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `nombre_completo.nombre` | string | No | `optional().trim().notEmpty()` (`routes/usuarios.js:64`) |
| `nombre_completo.apellido` | string | No | `optional().trim().notEmpty()` (`routes/usuarios.js:66`) |
| `password` | string | No | `optional().trim().isLength({ min: 8 })` (`routes/usuarios.js:68`) |
| `lugar_radicacion.nombreEntidad` | string | No | `optional().notEmpty()` (`routes/usuarios.js:70`) |
| `lugar_radicacion.claveMunicipio` | string | No | `optional().notEmpty()` (`routes/usuarios.js:72`) |
| `lugar_radicacion.nombreMunicipio` | string | No | `optional().notEmpty()` (`routes/usuarios.js:74`) |
| `genero` | string | No | `optional().isIn(['MASCULINO', 'FEMENINO', 'PREFIERO NO DECIR'])` (`routes/usuarios.js:76`) |
| `fecha_nacimiento` | string | No | `optional().isDate()` (`routes/usuarios.js:78`) |

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "msg": "Usuario actualizado",
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala", "nombreMunicipio": "Tlaxcala" },
    "correo": "usuario@ejemplo.com",
    "url": "juan-perez",
    "genero": "MASCULINO",
    "fecha_nacimiento": "1990-01-01T00:00:00.000Z"
  }
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Errores de autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | Errores de validación | `routes/usuarios.js:64-79` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un problema al procesar la solicitud"` | `controllers/usuarios.js:173` |

**Notas especiales:**
- El controlador filtra por `ALLOWED_FIELDS` (`controllers/usuarios.js:22-27`): solo se actualizan `nombre_completo`, `lugar_radicacion`, `genero`, `fecha_nacimiento`.
- Se ignora `_id`, `correo` y `password` si vienen en el body (la contraseña se procesa aparte si se envía).
- La contraseña se hashea con bcrypt antes de guardar.

---

### 3.5 DELETE /api/usuarios/delete

**Descripción:** Elimina la cuenta del usuario autenticado (soft delete) y marca como eliminados sus posteos, follows, likes, notificaciones, favoritos y comentarios. Usa una transacción de MongoDB.
**Archivo de ruta:** `routes/usuarios.js:82`
**Controlador:** `controllers/usuarios.js` — `usuariosDelete` (línea 181)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`) y cookie `refreshToken`.
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "msg": "Cuenta eliminada exitosamente. Tus datos serán eliminados permanentemente en unos días."
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 403 | `FORBIDDEN` | `Forbidden` | `"No hay refresh token"` | `controllers/usuarios.js:197` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"Usuario no encontrado"` | `controllers/usuarios.js:209` |
| 400 | `BAD_REQUEST` | `Bad Request` | `"La cuenta ya fue eliminada previamente"` | `controllers/usuarios.js:216` |
| 401/403 | Varios | — | Errores de autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un problema al eliminar la cuenta de usuario..."` | `controllers/usuarios.js:365` |

**Notas especiales:**
- Soft delete: el usuario pasa a `estatus: 4` e `isDeleted: true`. Los datos relacionados se marcan con `isDeleted: true` y `deleteReason: "accountDeletion"`.
- Se limpian las cookies de sesión tras la eliminación.
- El cron job `eliminar-cuentas-de-usuarios.js` se encarga de la eliminación física posterior.

---

### 3.6 GET /api/usuarios/registrados/nuevos-usuarios-registrados

**Descripción:** Devuelve los últimos 3 usuarios registrados, activos y verificados, excluyendo al usuario logueado, con indicador de si ya se siguen.
**Archivo de ruta:** `routes/usuarios.js:87`
**Controlador:** `controllers/usuarios.js` — `nuevosUsuariosRegistrados` (línea 375)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "msg": "Nuevos Usuarios Registrados",
  "nuevosUsuariosRegistrados": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "nombre_completo": { "nombre": "Ana", "apellido": "García" },
      "url": "ana-garcia",
      "imagen_perfil": { "secure_url": "...", "public_id": null },
      "isFollowing": false
    }
  ]
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Errores de autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al obtener los nuevos usuarios"` | `controllers/usuarios.js:443` |

---

## 4. Posteos

### 4.1 GET /api/posteos

**Descripción:** Obtiene los últimos posteos públicos de todos los usuarios excepto los del usuario logueado, con paginación y estados de follow, favorito y like.
**Archivo de ruta:** `routes/posteos.js:30`
**Controlador:** `controllers/posteos.js` — `posteosGet` (línea 14)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** `lecturaLimiter` (15 min, 100) → `READ_BLOCKED`.
**Headers requeridos:** Cookies.
**Parámetros de ruta:** Ninguno.
**Query params:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `page` | number | No | `optional().isNumeric()` (`routes/posteos.js:34`) |
| `limite` | number | No | `optional().isNumeric()` (`routes/posteos.js:35`) |

**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "page": "1",
  "next": "/api/posteos?page=2&limite=15",
  "prev": null,
  "limite": "15",
  "total_registros": 100,
  "mostrando": 15,
  "posteosConEstado": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "_idUsuario": {
        "_id": "507f1f77bcf86cd799439011",
        "nombre_completo": { "nombre": "Ana", "apellido": "García" },
        "url": "ana-garcia",
        "imagen_perfil": { "public_id": "img_123" }
      },
      "ubicacion": null,
      "public_id": "img_123",
      "texto": "Hola Tlaxcala",
      "fecha_creacion": "2026-07-20T18:00:00.000Z",
      "comentariosActivos": true,
      "isFollowing": false,
      "isFavorito": true,
      "likesCount": 5,
      "hasLiked": false
    }
  ]
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | Errores de `page` y `limite` | `routes/posteos.js:34-37` |
| 429 | `READ_BLOCKED` | `Rate Limit Exceeded` | `"Demasiadas solicitudes, intenta de nuevo más tarde"` | `middlewares/rate-limiter.js:124` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un error al obtener los posteos de usuarios..."` | `controllers/posteos.js:109` |

---

### 4.2 GET /api/posteos/post/:id

**Descripción:** Obtiene un posteo individual por ID, incluyendo información del autor y estados de follow, favorito y like.
**Archivo de ruta:** `routes/posteos.js:40`
**Controlador:** `controllers/posteos.js` — `posteoGet` (línea 113)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | MongoId | Sí | `check('id').isMongoId()` + `validarIdPosteo` (`routes/posteos.js:44-47`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "posteo": {
    "_id": "507f1f77bcf86cd799439012",
    "_idUsuario": {
      "_id": "507f1f77bcf86cd799439011",
      "nombre_completo": { "nombre": "Ana", "apellido": "García" },
      "imagen_perfil": { "public_id": "img_123" },
      "url": "ana-garcia"
    },
    "public_id": "img_123",
    "secure_url": "https://...",
    "texto": "Hola",
    "fecha_creacion": "2026-07-20T18:00:00.000Z",
    "ubicacion": null,
    "comentariosActivos": true,
    "comentariosCount": 2,
    "likesCount": 5,
    "hasLiked": false
  },
  "isFollowing": true,
  "isFavorito": false
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID no es valido"` | `routes/posteos.js:44` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El posteo con ID: ... no existe"` / `"ha sido eliminado"` | `helpers/validar-id-posteo.js:13` o `9` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un error al obtener el posteo por ID..."` | `controllers/posteos.js:166` |

---

### 4.3 GET /api/posteos/usuario/:idUsuario

**Descripción:** Obtiene los posteos de un usuario específico por su ID, con paginación y contadores de like.
**Archivo de ruta:** `routes/posteos.js:51`
**Controlador:** `controllers/posteos.js` — `posteosUsuarioGet` (línea 170)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `idUsuario` | MongoId | Sí | `check('idUsuario').isMongoId()` + `validarIdUsuario` (`routes/posteos.js:55-61`) |

**Query params:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `page` | number | No | `optional().isNumeric()` (`routes/posteos.js:57`) |
| `limite` | number | No | `optional().isNumeric()` (`routes/posteos.js:58`) |

**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "page": "1",
  "next": "/api/posteos/usuario/507f1f77bcf86cd799439011?page=2&limite=15",
  "prev": null,
  "limite": "15",
  "total_registros": 20,
  "mostrando": 15,
  "posteos": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "public_id": "img_123",
      "secure_url": "https://...",
      "likesCount": 5,
      "hasLiked": false
    }
  ]
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID no es valido"` / errores de page/limite | `routes/posteos.js:55-60` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El ID ... no existe en la BD"` / `"no está activo"` | `helpers/validar-id-usuario.js:10` o `14` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un error al obtener los Posteos..."` | `controllers/posteos.js:239` |

---

### 4.4 POST /api/posteos

**Descripción:** Crea un nuevo posteo con una imagen, texto opcional, visibilidad pública/privada y ubicación opcional.
**Archivo de ruta:** `routes/posteos.js:64`
**Controlador:** `controllers/posteos.js` — `posteosPost` (línea 246)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** `posteoLimiter` (15 min, 20) → `POSTEO_BLOCKED`.
**Headers requeridos:** `Content-Type: multipart/form-data`, cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body (multipart/form-data):**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `img` | archivo | Sí | Multer: `upload.single('img')`, máximo 5 MB, jpg/jpeg/png/webp (`helpers/multer.js:7-32`). `validarCampoImg` valida que exista. |
| `texto` | string | No | Regex `^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,!?¡¿()\s-]*$` (`middlewares/validar-texto.js:6`). |
| `posteo_publico` | boolean/string | No | `optional().isBoolean()` (`routes/posteos.js:78`). Se normaliza a booleano en el controlador. |
| `lat` | number/string | No | `optional().isFloat()` (`routes/posteos.js:80`) |
| `lng` | number/string | No | `optional().isFloat()` (`routes/posteos.js:81`) |
| `municipio` | MongoId | No | No se valida directamente en la ruta; se usa en `ubicacion.municipio` del schema. |
| `ciudad`, `estado`, `pais` | string | No | Sin validación en ruta; valores por defecto en el controlador. |

**Respuesta de éxito (201):**
```json
{
  "status": 201,
  "msg": "Posteo creado correctamente"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"No hay ninguna imagen para subir"` | `middlewares/validar-imagen-posteo.js:19` |
| 400 | `BAD_REQUEST` | `Bad Request` | `"La imagen excede el tamaño máximo permitido (5 MB)"` / `"Campo de archivo no esperado: \"img\""` / etc. | `middlewares/validar-imagen-posteo.js:6-14` y `27` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El campo de texto contiene caracteres no permitidos"` / errores de `posteo_publico`, `lat`, `lng` | `middlewares/validar-texto.js` / `routes/posteos.js:78-83` |
| 429 | `POSTEO_BLOCKED` | `Rate Limit Exceeded` | `"Demasiadas publicaciones, intenta de nuevo más tarde"` | `middlewares/rate-limiter.js:94` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error interno al procesar la publicación"` | `controllers/posteos.js:324` |

**Notas especiales:**
- El archivo se sube a Cloudinary desde memoria (`helpers/multer.js:5`).
- Si se envían `lat` y `lng`, se guardan como GeoJSON `Point` con coordenadas `[lng, lat]` (`controllers/posteos.js:290-295`).
- Si se envía un municipio sin coordenadas, `esExacta` es `false` y `coordinates` es `null`.

---

### 4.5 PUT /api/posteos/:id

**Descripción:** Actualiza un posteo existente (texto, visibilidad, ubicación). Solo el dueño del posteo puede actualizarlo.
**Archivo de ruta:** `routes/posteos.js:86`
**Controlador:** `controllers/posteos.js` — `posteosPut` (línea 328)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** `Content-Type: application/json` (o multipart si se envía FormData), cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | MongoId | Sí | `check('id').isMongoId()` + `validarIdPosteo` (`routes/posteos.js:90-95`) |

**Query params:** Ninguno.
**Body JSON (o FormData):**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `texto` | string | No | Regex `validarTexto` (`middlewares/validar-texto.js:6`). |
| `posteo_publico` | boolean/string | No | `optional().isBoolean()` (`routes/posteos.js:78`). Se normaliza en el controlador. |
| `lat`, `lng` | number | No | Sin validación directa en ruta; se convierten en el controlador. |
| `municipio`, `ciudad`, `estado`, `pais` | varios | No | Sin validación en ruta. |

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "msg": "Posteo actualizado correctamente",
  "posteo": {
    "_id": "507f1f77bcf86cd799439012",
    "texto": "Texto actualizado",
    "posteo_publico": true,
    "ubicacion": null,
    "fecha_actualizacion": "2026-07-20T19:08:39.000Z"
  }
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID no es valido"` / errores de texto | `routes/posteos.js:90` / `validarTexto` |
| 404 | `NOT_FOUND` | `Resource Not Found` | Posteo no existe o eliminado | `helpers/validar-id-posteo.js` |
| 403 | `FORBIDDEN` | `Forbidden` | `"No tienes permiso para modificar este posteo."` | `controllers/posteos.js:399` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un error al actualizar el posteo..."` | `controllers/posteos.js:411` |

---

### 4.6 DELETE /api/posteos/:id

**Descripción:** Elimina un posteo (soft delete) del usuario autenticado.
**Archivo de ruta:** `routes/posteos.js:98`
**Controlador:** `controllers/posteos.js` — `posteosDelete` (línea 415)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | MongoId | Sí | `check('id').isMongoId()` + `validarIdPosteo` (`routes/posteos.js:102-105`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "msg": "Posteo con imagen eliminado correctamente"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID no es valido"` | `routes/posteos.js:102` |
| 404 | `NOT_FOUND` | `Resource Not Found` | Posteo no existe o eliminado | `helpers/validar-id-posteo.js` |
| 403 | `FORBIDDEN` | `Forbidden` | `"No tienes permiso para eliminar este posteo."` | `controllers/posteos.js:428` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un error al eliminar el Posteo..."` | `controllers/posteos.js:437` |

---

## 5. Comentarios

### 5.1 POST /api/comentarios/:posteoId/comentarios

**Descripción:** Agrega un comentario a un posteo.
**Archivo de ruta:** `routes/comentarios.js:16`
**Controlador:** `controllers/comentarios.js` — `agregarComentario` (línea 10)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** `comentarioLimiter` (1 min, 10) → `COMENTARIO_BLOCKED`.
**Headers requeridos:** `Content-Type: application/json`, cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `posteoId` | MongoId | Sí | `check('posteoId').isMongoId()` + `validarIdPosteo` (`routes/comentarios.js:18-22`) |

**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `texto` | string | Sí (si se envía, no vacío) | `optional().notEmpty()` + `max: 250` (`routes/comentarios.js:19-20`). El schema también requiere `maxlength: 250`. |

**Respuesta de éxito (201):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "ok": true,
  "status": 201,
  "msg": "Comentario agregado",
  "comentario": {
    "_id": "507f1f77bcf86cd799439013",
    "texto": "Bonita foto",
    "posteoId": "507f1f77bcf86cd799439012",
    "autorId": "507f1f77bcf86cd799439011",
    "isDeleted": false,
    "createdAt": "2026-07-20T19:08:39.000Z",
    "updatedAt": "2026-07-20T19:08:39.000Z"
  }
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID del posteo no es válido"` / `"El texto es obligatorio"` / `"El comentario no puede exceder 250 caracteres"` | `routes/comentarios.js:18-20` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El posteo no existe"` / `"ha sido eliminado"` | `helpers/validar-id-posteo.js` |
| 403 | `FORBIDDEN` | `Forbidden` | `"Los comentarios están desactivados en este posteo"` | `controllers/comentarios.js:29` |
| 429 | `COMENTARIO_BLOCKED` | `Rate Limit Exceeded` | `"Demasiados comentarios, intenta de nuevo más tarde"` | `middlewares/rate-limiter.js:139` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al agregar comentario"` | `controllers/comentarios.js:115` |

**Notas especiales:**
- Si es el primer comentario y el autor del posteo no es el mismo que comenta, se envía una notificación push y un email de notificación al autor del posteo (si `SEND_EMAIL` lo permite).
- Se incrementa `comentariosCount` del posteo.

---

### 5.2 GET /api/comentarios/:posteoId/comentarios

**Descripción:** Obtiene los comentarios de un posteo, paginados y ordenados por más recientes.
**Archivo de ruta:** `routes/comentarios.js:25`
**Controlador:** `controllers/comentarios.js` — `obtenerComentarios` (línea 119)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `posteoId` | MongoId | Sí | `check('posteoId').isMongoId()` + `validarIdPosteo` (`routes/comentarios.js:27-31`) |

**Query params:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `page` | number | No | `optional().isNumeric()` (`routes/comentarios.js:28`) |
| `limite` | number | No | `optional().isNumeric()` (`routes/comentarios.js:29`) |

**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "ok": true,
  "status": 200,
  "page": 1,
  "limit": 10,
  "next": "/api/comentarios/507f1f77bcf86cd799439012/comentarios/?page=2&limit=10",
  "prev": null,
  "total": 25,
  "totalPages": 3,
  "comentarios": [
    {
      "texto": "Bonita foto",
      "createdAt": "2026-07-20T19:08:39.000Z",
      "autorId": {
        "nombre_completo": { "nombre": "Ana", "apellido": "García" },
        "imagen_perfil": { "secure_url": "...", "public_id": null },
        "url": "ana-garcia"
      }
    }
  ]
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID del posteo no es válido"` / errores de page/limite | `routes/comentarios.js:27-30` |
| 404 | `NOT_FOUND` | `Resource Not Found` | Posteo no existe o eliminado | `helpers/validar-id-posteo.js` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al obtener comentarios"` | `controllers/comentarios.js:185` |

---

### 5.3 GET /api/comentarios/:posteoId/comentarios/count

**Descripción:** Devuelve el contador de comentarios de un posteo.
**Archivo de ruta:** `routes/comentarios.js:34`
**Controlador:** `controllers/comentarios.js` — `obtenerCountComentarios` (línea 189)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `posteoId` | MongoId | Sí | `check('posteoId').isMongoId()` + `validarIdPosteo` (`routes/comentarios.js:36-38`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "ok": true,
  "status": 200,
  "count": 5
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID del posteo no es válido"` | `routes/comentarios.js:36` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El posteo no existe"` | `controllers/comentarios.js:200` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al obtener contador"` | `controllers/comentarios.js:210` |

---

### 5.4 DELETE /api/comentarios/:comentarioId

**Descripción:** Elimina un comentario (soft delete). Puede ser eliminado por su autor o por el dueño del posteo.
**Archivo de ruta:** `routes/comentarios.js:41`
**Controlador:** `controllers/comentarios.js` — `eliminarComentario` (línea 214)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `comentarioId` | MongoId | Sí | `check('comentarioId').isMongoId()` (`routes/comentarios.js:43`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "ok": true,
  "status": 200,
  "msg": "Comentario eliminado"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID del comentario no es válido"` | `routes/comentarios.js:43` |
| 400 | `BAD_REQUEST` | `Bad Request` | `"El comentario ya fue eliminado"` | `controllers/comentarios.js:230` o `272` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El comentario no existe"` | `controllers/comentarios.js:231` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El posteo asociado no existe"` | `controllers/comentarios.js:239` |
| 403 | `FORBIDDEN` | `Forbidden` | `"No tienes permisos para eliminar este comentario"` | `controllers/comentarios.js:247` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al eliminar comentario"` | `controllers/comentarios.js:283` |

---

### 5.5 PUT /api/comentarios/:posteoId/comentarios/toggle

**Descripción:** Activa o desactiva los comentarios de un posteo. Solo el dueño del posteo puede hacerlo.
**Archivo de ruta:** `routes/comentarios.js:47`
**Controlador:** `controllers/comentarios.js` — `toggleComentariosPosteo` (línea 287)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** `Content-Type: application/json`, cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `posteoId` | MongoId | Sí | `check('posteoId').isMongoId()` + `validarIdPosteo` (`routes/comentarios.js:49-52`) |

**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `activar` | boolean | Sí | `check('activar').isBoolean({ strict: true })` (`routes/comentarios.js:50`) |

**Respuesta de éxito (200):**
```json
{
  "ok": true,
  "status": 200,
  "msg": "Comentarios desactivados",
  "comentariosActivos": false
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID del posteo no es válido"` / `"El campo activar debe ser un booleano"` | `routes/comentarios.js:49-50` |
| 404 | `NOT_FOUND` | `Resource Not Found` | Posteo no existe o eliminado | `helpers/validar-id-posteo.js` |
| 403 | `FORBIDDEN` | `Forbidden` | `"Solo el dueño del posteo puede modificar los comentarios"` | `controllers/comentarios.js:302` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al modificar comentarios"` | `controllers/comentarios.js:315` |

---

## 6. Likes

### 6.1 POST /api/likes/:id/like

**Descripción:** Da like a un posteo si aún no tiene like del usuario; si ya tiene, lo quita (toggle).
**Archivo de ruta:** `routes/likes.js:11`
**Controlador:** `controllers/likes.js` — `likeDislikePosteo` (línea 11)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | MongoId | Sí | `check('id').isMongoId()` + `validarIdPosteo` (`routes/likes.js:15-18`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{ "status": 200, "msg": "Like añadido" }
```
o
```json
{ "status": 200, "msg": "Like eliminado" }
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID no es valido"` | `routes/likes.js:15` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"Publicación no encontrada"` | `controllers/likes.js:22` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al procesar el like"` | `controllers/likes.js:48` |

---

### 6.2 GET /api/likes/posteo/:id

**Descripción:** Devuelve el número total de likes de un posteo.
**Archivo de ruta:** `routes/likes.js:21`
**Controlador:** `controllers/likes.js` — `getLikesPosteos` (línea 52)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | MongoId | Sí | `check('id').isMongoId()` + `validarIdPosteo` (`routes/likes.js:25-28`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "likes": 42,
  "posteo": "507f1f77bcf86cd799439012"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID no es valido"` | `routes/likes.js:25` |
| 404 | `NOT_FOUND` | `Resource Not Found` | Posteo no existe o eliminado | `helpers/validar-id-posteo.js` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al obtener el número de likes"` | `controllers/likes.js:62` |

---

### 6.3 GET /api/likes/:id/likes/usuarios

**Descripción:** Devuelve la lista de usuarios que dieron like a un posteo.
**Archivo de ruta:** `routes/likes.js:32`
**Controlador:** `controllers/likes.js` — `getLikesUsuariosPosteos` (línea 66)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | MongoId | Sí | `check('id').isMongoId()` + `validarIdPosteo` (`routes/likes.js:36-39`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "msg": "Likes de usuarios a posteo obtenidos correctamente",
  "likes_usuarios_posteo": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "_idUsuario": {
        "nombre_completo": { "nombre": "Ana", "apellido": "García" },
        "imagen_perfil": { "secure_url": "...", "public_id": null },
        "url": "ana-garcia"
      }
    }
  ]
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID no es valido"` | `routes/likes.js:36` |
| 404 | `NOT_FOUND` | `Resource Not Found` | Posteo no existe o eliminado | `helpers/validar-id-posteo.js` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al obtener los likes de usuarios"` | `controllers/likes.js:82` |

---

## 7. Followers

### 7.1 POST /api/followers/follow/:id

**Descripción:** Sigue a un usuario.
**Archivo de ruta:** `routes/followers.js:14`
**Controlador:** `controllers/followers.js` — `followUsuario` (línea 9)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | MongoId | Sí | `check('id').isMongoId()` + `validarIdUsuario` (`routes/followers.js:18-21`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "msg": "Has comenzado a seguir a este usuario",
  "success": true
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID no es valido"` | `routes/followers.js:18` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El ID ... no existe en la BD"` / `"no está activo"` | `helpers/validar-id-usuario.js:10` o `14` |
| 400 | `BAD_REQUEST` | `Bad Request` | `"No puedes seguirte a ti mismo"` | `controllers/followers.js:19` |
| 400 | `BAD_REQUEST` | `Bad Request` | `"Ya sigues a este usuario"` | `controllers/followers.js:36` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El usuario que intentas seguir no existe"` | `controllers/followers.js:40` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un error al seguir a un usuario"` | `controllers/followers.js:112` |

**Notas especiales:**
- Se crea una notificación persistente de tipo `follow` para el usuario seguido.
- Se intenta enviar notificación push si el usuario objetivo tiene activadas las notificaciones.

---

### 7.2 DELETE /api/followers/unfollow/:id

**Descripción:** Deja de seguir a un usuario.
**Archivo de ruta:** `routes/followers.js:25`
**Controlador:** `controllers/followers.js` — `unfollowUsuario` (línea 116)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | MongoId | Sí | `check('id').isMongoId()` + `validarIdUsuario` (`routes/followers.js:29-32`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "msg": "Dejaste de seguir a este usuario"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID no es valido"` | `routes/followers.js:29` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El ID ... no existe en la BD"` / `"no está activo"` | `helpers/validar-id-usuario.js:10` o `14` |
| 400 | `BAD_REQUEST` | `Bad Request` | `"No sigues a este usuario"` | `controllers/followers.js:131` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un error al dejar de seguir a un usuario"` | `controllers/followers.js:139` |

---

### 7.3 GET /api/followers/usuario/lista-followers/:id

**Descripción:** Obtiene la lista de seguidores de un usuario, indicando si el usuario logueado sigue a cada seguidor.
**Archivo de ruta:** `routes/followers.js:35`
**Controlador:** `controllers/followers.js` — `obtenerFollowers` (línea 143)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | MongoId | Sí | `check('id').isMongoId()` + `validarIdUsuario` (`routes/followers.js:39-42`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "msg": "Seguidores obtenidos correctamente",
  "totalSeguidores": 2,
  "seguidores": [
    {
      "follower": {
        "_id": "507f1f77bcf86cd799439011",
        "nombre_completo": { "nombre": "Ana", "apellido": "García" },
        "imagen_perfil": { "secure_url": "...", "public_id": null },
        "url": "ana-garcia"
      },
      "isFollowing": true
    }
  ]
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID no es valido"` | `routes/followers.js:39` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El ID ... no existe en la BD"` / `"no está activo"` | `helpers/validar-id-usuario.js:10` o `14` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al obtener seguidores"` | `controllers/followers.js:182` |

---

### 7.4 GET /api/followers/usuario/lista-followings/:id

**Descripción:** Obtiene la lista de usuarios que sigue un perfil (followings), indicando si el usuario logueado sigue a cada uno.
**Archivo de ruta:** `routes/followers.js:45`
**Controlador:** `controllers/followers.js` — `obtenerFollowings` (línea 186)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | MongoId | Sí | `check('id').isMongoId()` + `validarIdUsuario` (`routes/followers.js:49-52`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "msg": "Usuarios seguidos, obtenidos correctamente",
  "totalSeguidos": 3,
  "siguiendo": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "following": {
        "_id": "507f1f77bcf86cd799439011",
        "nombre_completo": { "nombre": "Ana", "apellido": "García" },
        "imagen_perfil": { "secure_url": "...", "public_id": null },
        "url": "ana-garcia"
      },
      "isFollowing": true
    }
  ]
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El ID no es valido"` | `routes/followers.js:49` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El ID ... no existe en la BD"` / `"no está activo"` | `helpers/validar-id-usuario.js:10` o `14` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error en obtener followings"` | `controllers/followers.js:262` |

---

## 8. Favoritos

### 8.1 GET /api/favoritos

**Descripción:** Obtiene los posteos favoritos del usuario autenticado, con paginación.
**Archivo de ruta:** `routes/favoritos.js:13`
**Controlador:** `controllers/favoritos.js` — `obtenerFavoritosUsuario` (línea 9)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:** Ninguno.
**Query params:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `page` | number | No | `optional().isNumeric()` (`routes/favoritos.js:17`) |
| `limite` | number | No | `optional().isNumeric()` (`routes/favoritos.js:18`) |

**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "page": 1,
  "next": "/api/favoritos?page=2&limite=15",
  "prev": null,
  "limite": 15,
  "total_registros": 10,
  "mostrando": 10,
  "favoritos": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "createdAt": "2026-07-20T18:00:00.000Z",
      "posteoId": {
        "public_id": "img_123",
        "posteo_publico": true
      },
      "autorId": {
        "nombre_completo": { "nombre": "Ana", "apellido": "García" },
        "url": "ana-garcia"
      }
    }
  ]
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | Errores de `page` y `limite` | `routes/favoritos.js:17-20` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un problema al realizar la peticion..."` | `controllers/favoritos.js:85` |

---

### 8.2 POST /api/favoritos/:posteoId

**Descripción:** Agrega un posteo a favoritos del usuario autenticado.
**Archivo de ruta:** `routes/favoritos.js:24`
**Controlador:** `controllers/favoritos.js` — `agregarPosteoFavorito` (línea 89)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** `Content-Type: application/json`, cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `posteoId` | MongoId | Sí | `check('posteoId').isMongoId()` + `validarIdPosteo` (`routes/favoritos.js:28-33`) |

**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `autorId` | MongoId | Sí | `check('autorId').isMongoId()` + `validarIdUsuario` (`routes/favoritos.js:30-34`) |

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "msg": "Agregado en Favoritos"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El posteoId debe ser valido"` / `"El autorId es obligatorio"` | `routes/favoritos.js:28-30` |
| 404 | `NOT_FOUND` | `Resource Not Found` | Posteo no existe o eliminado / Usuario no existe o inactivo | `helpers/validar-id-posteo.js` / `helpers/validar-id-usuario.js` |
| 400 | `BAD_REQUEST` | `Bad Request` | `"No puedes agregar a favoritos tus propios posteos"` | `controllers/favoritos.js:104` |
| 409 | `CONFLICT` | `Conflict` | `"Este posteo ya está en tus favoritos"` | `controllers/favoritos.js:121` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un problema al realizar la peticion..."` | `controllers/favoritos.js:130` |

---

### 8.3 DELETE /api/favoritos/:posteoId

**Descripción:** Elimina un posteo de favoritos del usuario autenticado.
**Archivo de ruta:** `routes/favoritos.js:38`
**Controlador:** `controllers/favoritos.js` — `eliminarPosteoFavorito` (línea 135)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `posteoId` | MongoId | Sí | `check('posteoId').isMongoId()` + `validarIdPosteo` (`routes/favoritos.js:42-45`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "msg": "Eliminado de Favoritos"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El posteoId debe ser valido"` | `routes/favoritos.js:42` |
| 404 | `NOT_FOUND` | `Resource Not Found` | Posteo no existe o eliminado | `helpers/validar-id-posteo.js` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"El posteo con id ... no existe en favoritos"` | `controllers/favoritos.js:145` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Hubo un problema al realizar la peticion..."` | `controllers/favoritos.js:153` |

---

## 9. Notificaciones

### 9.1 POST /api/notificaciones/subscribe

**Descripción:** Registra una suscripción Web Push para el usuario autenticado.
**Archivo de ruta:** `routes/notificaciones.js:16`
**Controlador:** `controllers/notificaciones.js` — `subscribirNotificacionesWebPush` (línea 7)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** `Content-Type: application/json`, cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `subscription` | object | Sí | Debe contener `endpoint`, `keys.p256dh` y `keys.auth` (`controllers/notificaciones.js:12-16`). |
| `subscription.endpoint` | string | Sí | — |
| `subscription.keys.p256dh` | string | Sí | — |
| `subscription.keys.auth` | string | Sí | — |
| `userAgent` | string | No | Opcional; si no se envía se usa el header `User-Agent`. |

**Respuesta de éxito (200):**
```json
{
  "message": "Suscripción registrada correctamente"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 400 | `BAD_REQUEST` | `Bad Request` | `"Suscripción inválida"` | `controllers/notificaciones.js:18` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"Usuario no encontrado"` | `controllers/notificaciones.js:24` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al guardar suscripción"` | `controllers/notificaciones.js:62` |

---

### 9.2 POST /api/notificaciones/unsubscribe

**Descripción:** Elimina una suscripción Web Push por endpoint.
**Archivo de ruta:** `routes/notificaciones.js:21`
**Controlador:** `controllers/notificaciones.js` — `unsubscribeNotificacionesWebPush` (línea 66)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** `Content-Type: application/json`, cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `endpoint` | string | Sí | Debe estar presente (`controllers/notificaciones.js:71`). |

**Respuesta de éxito (200):**
```json
{
  "success": true,
  "msg": "Suscripción eliminada correctamente"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 400 | `BAD_REQUEST` | `Bad Request` | `"Falta el endpoint de la suscripción"` | `controllers/notificaciones.js:72` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"Usuario no encontrado"` | `controllers/notificaciones.js:84` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al desactivar notificaciones"` | `controllers/notificaciones.js:98` |

---

### 9.3 GET /api/notificaciones/vapidPublicKey

**Descripción:** Devuelve la clave pública VAPID para configurar Web Push en el frontend.
**Archivo de ruta:** `routes/notificaciones.js:27`
**Controlador:** `controllers/notificaciones.js` — `getVapidPublicKey` (línea 102)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "key": "BD..."
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Falta la clave pública VAPID"` / `"Error al obtener la clave VAPID"` | `controllers/notificaciones.js:106` / `110` |

---

### 9.4 GET /api/notificaciones

**Descripción:** Obtiene las notificaciones del usuario autenticado, paginadas.
**Archivo de ruta:** `routes/notificaciones.js:32`
**Controlador:** `controllers/notificaciones.js` — `obtenerNotificaciones` (línea 115)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:** Ninguno.
**Query params:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `page` | number | No | `parseInt(req.query.page) || 1` |
| `limit` | number | No | `parseInt(req.query.limit) || 20` |

**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "page": 1,
  "limit": 20,
  "next": "/api/notificaciones?page=2&limit=20",
  "prev": null,
  "total": 5,
  "totalPages": 1,
  "notificaciones": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "tipo": "follow",
      "mensaje": "comenzó a seguirte",
      "leida": false,
      "notificacion_leida": false,
      "createdAt": "2026-07-20T18:00:00.000Z",
      "emisor": {
        "nombre_completo": { "nombre": "Ana", "apellido": "García" },
        "imagen_perfil": { "secure_url": "...", "public_id": null },
        "url": "ana-garcia"
      },
      "referencia": null
    }
  ]
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al obtener notificaciones"` | `controllers/notificaciones.js:193` |

---

### 9.5 PATCH /api/notificaciones/marcar-notificacion-leida/:id

**Descripción:** Marca una notificación como leída.
**Archivo de ruta:** `routes/notificaciones.js:37`
**Controlador:** `controllers/notificaciones.js` — `marcarNotificacionLeida` (línea 197)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | MongoId | Sí | `check('id').isMongoId()` (`routes/notificaciones.js:41`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "msg": "Notificación marcada como leída"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El id de la notificación es obligatorio"` / `"El id debe ser un MongoId valido"` | `routes/notificaciones.js:41-57` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"Notificación no encontrada"` | `controllers/notificaciones.js:220` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al marcar notificación como leída"` | `controllers/notificaciones.js:229` |

---

### 9.6 GET /api/notificaciones/nuevas-notificaciones

**Descripción:** Devuelve el total de notificaciones no leídas del usuario autenticado.
**Archivo de ruta:** `routes/notificaciones.js:46`
**Controlador:** `controllers/notificaciones.js` — `obtenerTotalNotificacionesNoLeidas` (línea 235)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "totalNoLeidas": 3
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al obtener notificaciones no leídas"` | `controllers/notificaciones.js:254` |

---

### 9.7 DELETE /api/notificaciones/eliminar-notificacion/:id

**Descripción:** Elimina físicamente una notificación del usuario autenticado.
**Archivo de ruta:** `routes/notificaciones.js:51`
**Controlador:** `controllers/notificaciones.js` — `eliminarNotificacion` (línea 258)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `id` | MongoId | Sí | `check('id').notEmpty().isMongoId()` (`routes/notificaciones.js:55-57`) |

**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):**
```json
{
  "status": 200,
  "msg": "Notificación eliminada correctamente"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El id de la notificación es obligatorio"` / `"El id debe ser un MongoId valido"` | `routes/notificaciones.js:55-57` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"Notificación no encontrada"` | `controllers/notificaciones.js:272` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al eliminar la notificación"` | `controllers/notificaciones.js:281` |

---

## 10. Municipios y ubicación

### 10.1 GET /api/municipios

**Descripción:** Devuelve la lista de municipios de Tlaxcala ordenados alfabéticamente (sin geometría).
**Archivo de ruta:** `routes/municipios.js:7`
**Controlador:** `controllers/municipios.js` — `obtenerMunicipios` (línea 6)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "msg": "Municipios obtenidos correctamente",
  "municipios": [
    {
      "_id": "507f1f77bcf86cd799439018",
      "claveEntidad": 29,
      "nombreEntidad": "Tlaxcala",
      "claveMunicipio": 1,
      "nombreMunicipio": "Tlaxcala",
      "codigoPostal": "90000"
    }
  ]
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al obtener los municipios"` | `controllers/municipios.js:21` |

---

### 10.2 POST /api/ubicacion/reverse

**Descripción:** Realiza geocodificación inversa: dado un par de coordenadas lat/lng, devuelve el municipio de Tlaxcala correspondiente.
**Archivo de ruta:** `routes/ubicacion.js:10`
**Controlador:** `controllers/ubicacion.js` — `obtenerMunicipioPorCoords` (línea 5)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** `Content-Type: application/json`, cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `lat` | number | Sí | `isFloat().notEmpty()` (`routes/ubicacion.js:14`) |
| `lng` | number | Sí | `isFloat().notEmpty()` (`routes/ubicacion.js:15`) |

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "municipio": {
    "_id": "507f1f77bcf86cd799439018",
    "claveEntidad": 29,
    "nombreEntidad": "Tlaxcala",
    "claveMunicipio": 1,
    "nombreMunicipio": "Tlaxcala",
    "codigoPostal": "90000"
  },
  "metodo": "database_geo_intersect",
  "precision": "exacta"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"La latitud es obligatoria y debe ser un número"` / `"La longitud es obligatoria y debe ser un número"` | `routes/ubicacion.js:14-15` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"Ubicación fuera de la zona de cobertura (Tlaxcala)"` | `controllers/ubicacion.js:48` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error interno al obtener la ubicación"` | `controllers/ubicacion.js:60` |

---

### 10.3 GET /api/ubicacion

**Descripción:** Devuelve la lista de municipios de Tlaxcala (mismo controlador que `GET /api/municipios`).
**Archivo de ruta:** `routes/ubicacion.js:20`
**Controlador:** `controllers/municipios.js` — `obtenerMunicipios` (línea 6)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** Cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body:** Ninguno.

**Respuesta de éxito (200):** Igual que `GET /api/municipios`.

**Respuestas de error:** Igual que `GET /api/municipios`.

---

## 11. Subida de imágenes (perfil)

### 11.1 PUT /api/uploads/:coleccion

**Descripción:** Actualiza la imagen de perfil del usuario autenticado en la colección especificada (actualmente solo `usuarios`).
**Archivo de ruta:** `routes/uploads.js:16`
**Controlador:** `controllers/uploads.js` — `actualizarImagen` (línea 8)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** No aplica.
**Headers requeridos:** `Content-Type: multipart/form-data`, cookies.
**Parámetros de ruta:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `coleccion` | string | Sí | `check('coleccion').custom(c => coleccionesPermitidas(c, ['usuarios']))` (`routes/uploads.js:31`) |

**Query params:** Ninguno.
**Body (multipart/form-data):**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `img` | archivo | Sí | Multer: `upload.single('img')`, máximo 5 MB, jpg/jpeg/png/webp (`helpers/multer.js`). |

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "msg": "Imagen de perfil actualizada correctamente",
  "usuario": {
    "imagen_perfil": {
      "secure_url": "https://res.cloudinary.com/.../nueva-imagen.webp",
      "public_id": "nuevo_public_id"
    }
  }
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"No hay ninguna imagen para subir"` | `middlewares/validar-imagen-posteo.js:19` |
| 400 | `BAD_REQUEST` | `Bad Request` | Errores de Multer (tamaño, campo inesperado, etc.) | `middlewares/validar-imagen-posteo.js:6-14` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"La coleccion: ... no esta permitida, se permiten: usuarios"` | `helpers/colecciones-permitidas.js:8` |
| 400 | `BAD_REQUEST` | `Bad Request` | `"No existe un usuario con el ID: ..."` | `controllers/uploads.js:23` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error al actualizar la imagen"` | `controllers/uploads.js:93` |

**Notas especiales:**
- Si el usuario ya tenía una imagen de perfil distinta a la default, se intenta eliminar la anterior de Cloudinary (`controllers/uploads.js:36-53`).
- La imagen se redimensiona a 500px de ancho con `fill` en Cloudinary (`controllers/uploads.js:65-67`).

---

## 12. Soporte / Contacto

### 12.1 POST /api/ayuda-soporte/envio-correo

**Descripción:** Envía un ticket de soporte/ayuda por correo. También envía un correo de confirmación al usuario.
**Archivo de ruta:** `routes/soporte.js:9`
**Controlador:** `controllers/soporte.js` — `ayudaSoporteEnvioCorrreo` (línea 22)

**Autenticación:** Requiere cookie `accessToken` (middleware `verificarTokenSesion`).
**Rate limiter:** `soporteLimiter` (15 min, 5) → `SOPORTE_BLOCKED`.
**Headers requeridos:** `Content-Type: application/json`, cookies.
**Parámetros de ruta:** Ninguno.
**Query params:** Ninguno.
**Body JSON:**
| Campo | Tipo | Requerido | Validación |
|---|---|---|---|
| `tipo_problema` | string | Sí | `notEmpty().isIn(["cuenta", "publicacion", "seguridad", "reporte", "otro"])` (`routes/soporte.js:13`) |
| `descripcion_problema_usuario` | string | Sí | `notEmpty().isString().trim().isLength({ min: 15, max: 1000 })` (`routes/soporte.js:15`) |

**Respuesta de éxito (200):** `[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]`
```json
{
  "status": 200,
  "ticketId": "TLX-1691234567890",
  "msg": "Solicitud de soporte recibida correctamente"
}
```

**Respuestas de error:**

| Status | `code` | title | detail | Origen |
|---|---|---|---|---|
| 401/403 | Varios | — | Autenticación/activación | `middlewares/validar-jwt-cookies-sesion.js` |
| 422 | `VALIDATION_FAILED` | `Validation Failed` | `"El tipo_problema es obligatorio: [cuenta, publicacion, seguridad, reporte, otro]"` / `"La descripcion_problema_usuario es obligatoria: minimo 10 caracteres, maximo 1000"` | `routes/soporte.js:13-15` |
| 400 | `BAD_REQUEST` | `Bad Request` | `"Tipo de problema no válido"` | `controllers/soporte.js:29` |
| 404 | `NOT_FOUND` | `Resource Not Found` | `"Usuario no encontrado"` | `controllers/soporte.js:35` |
| 429 | `SOPORTE_BLOCKED` | `Rate Limit Exceeded` | `"Demasiados tickets de soporte, intenta de nuevo más tarde"` | `middlewares/rate-limiter.js:109` |
| 500 | `INTERNAL_ERROR` | `Internal Server Error` | `"Error en el servidor"` | `controllers/soporte.js:66` |

---

## Códigos de error comunes

### Errores de autenticación (401/403)

| Status | `code` | Escenario típico |
|---|---|---|
| 401 | `UNAUTHORIZED` | No hay cookie `accessToken` (`validar-jwt-cookies-sesion.js:14`). |
| 401 | `UNAUTHORIZED` | Access token inválido o expirado (`validar-jwt-cookies-sesion.js:45`). |
| 401 | `UNAUTHORIZED` | Token no válido — usuario no existe o fue eliminado (`validar-jwt-cookies-sesion.js:27`). |
| 401 | `UNAUTHORIZED` | Sesión expirada por cambio de `tokenVersion` (`validar-jwt-cookies-sesion.js:35`). |
| 403 | `FORBIDDEN` | Cuenta no verificada o no activada (`validar-jwt-cookies-sesion.js:31`). |
| 403 | `FORBIDDEN` | Origen no permitido por CSRF (`validar-origen.js:39`, `46`, `49`). |

### Errores de validación (400/422)

| Status | `code` | Escenario típico |
|---|---|---|
| 400 | `BAD_REQUEST` | Body JSON malformado, falta campo obligatorio, error de Multer. |
| 422 | `VALIDATION_FAILED` | Error de express-validator (correo, MongoId, longitud, etc.). |
| 422 | `VALIDATION_FAILED` | Texto de posteo/comentario con caracteres no permitidos (`validar-texto.js:6`). |

### Errores de rate limit (429)

| Status | `code` | Escenario típico |
|---|---|---|
| 429 | `LOGIN_BLOCKED` | Demasiados intentos de login (`middlewares/rate-limiter.js:27`). |
| 429 | `REGISTER_BLOCKED` | Demasiados registros desde la misma conexión (`middlewares/rate-limiter.js:79`). |
| 429 | `POSTEO_BLOCKED` | Demasiados posteos en 15 min (`middlewares/rate-limiter.js:94`). |
| 429 | `COMENTARIO_BLOCKED` | Demasiados comentarios en 1 min (`middlewares/rate-limiter.js:139`). |
| 429 | `READ_BLOCKED` | Demasiadas lecturas en 15 min (`middlewares/rate-limiter.js:124`). |
| 429 | `RECOVERY_BLOCKED` | Demasiados intentos de recuperación de contraseña (`middlewares/rate-limiter.js:49`). |
| 429 | `EMAIL_BLOCKED` | Demasiados reenvíos de correo (`middlewares/rate-limiter.js:64`). |
| 429 | `SOPORTE_BLOCKED` | Demasiados tickets de soporte (`middlewares/rate-limiter.js:109`). |
| 429 | `REFRESH_BLOCKED` | Demasiadas renovaciones de token (`middlewares/rate-limiter.js:154`). |
| 429 | `RATE_LIMIT_EXCEEDED` | Cooldown de controlador (ej. 5 min entre correos, bloqueo por intentos fallidos) con `retry_after`. |

### Errores de recurso no encontrado (404)

| Status | `code` | Escenario típico |
|---|---|---|
| 404 | `NOT_FOUND` | Usuario/posteo/comentario no existe. |
| 404 | `NOT_FOUND` | Ruta no existe (catch-all en `models/server.js:108`). |

### Errores internos (500)

| Status | `code` | Escenario típico |
|---|---|---|
| 500 | `INTERNAL_ERROR` | Cualquier error no manejado; en dev puede incluir `stack`. |
| 500 | `INTERNAL_ERROR` | Error crudo no `AppError` propagado al error handler (`middlewares/error-handler.js:93-104`). |

---

## Notas de implementación

1. **Cookies y CORS:** El frontend debe enviar `credentials: 'include'` (o `withCredentials: true`) en todas las peticiones autenticadas, ya que los tokens viajan en cookies `httpOnly` con `sameSite: 'none'` y `secure: true` (`models/server.js:74-80`).

2. **CSRF:** Los métodos mutantes (POST, PUT, PATCH, DELETE) requieren un header `Origin` o `Referer` que coincida con `FRONTEND_URL` o `CSRF_ALLOWED_ORIGINS` (`middlewares/validar-origen.js`).

3. **path-to-regexp v8 (Express 5):** Los parámetros opcionales usan `{/:param}` en lugar de `/:param?`. Ejemplos en la API: `GET /api/auth/verificar-correo{/:token}`, `GET /api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}`, `POST /api/auth/cuentas/reestablecer-password{/:token}`.

4. **Subida de archivos:** Todos los endpoints que reciben imágenes usan Multer en memoria, con límite de 5 MB y formatos jpg/jpeg/png/webp (`helpers/multer.js`). El campo debe llamarse exactamente `img`.

5. **Soft delete:** Usuarios, posteos, comentarios, likes, follows, favoritos y notificaciones usan `isDeleted: true` con `deletedAt`. Los cron jobs en `jobs/` se encargan de la eliminación física posterior.

6. **Estados de cuenta:** `estatus: 0` (no verificado), `1` (activo), `2` (violó reglas), `3` (suspendido), `4` (eliminado). Muchos endpoints requieren `estatus === 1` y `email_validated === true`.

7. **Verificación de correo:** En desarrollo, `SEND_EMAIL=false` anula el envío real de correos. El registro solo guarda el usuario si `envioCorreoVerificacion` retorna `true`, lo que en dev depende de la implementación del servicio de email.

8. **Refresh tokens:** Se almacenan hasheados (SHA-256) en `UserToken`. Si se detecta reuso de un refresh token robado, se invalidan todas las sesiones del usuario (`controllers/auth.js:408-418`).

9. **Notificaciones push:** Las suscripciones Web Push se limitan a 10 por usuario; si se excede, se elimina la más antigua (`controllers/notificaciones.js:36-43`).

10. **Helpers `validarIdPosteo` y `validarIdUsuario`:** En la versión actual del código estos helpers lanzan `NotFoundError` correctamente (`helpers/validar-id-posteo.js:9-14`, `helpers/validar-id-usuario.js:9-15`), por lo que posteos/usuarios inexistentes devuelven 404. El contexto del proyecto mencionaba un bug histórico de `Error` crudo, pero el código actual parece corregido. **[REQUIERE VERIFICACIÓN MANUAL]** si el frontend observa 500 inesperados en estas rutas.

11. **Endpoint `GET /api/usuarios`:** Actualmente es un stub que no devuelve datos reales; está protegido por `lecturaLimiter` pero no requiere autenticación.

12. **Anti-enumeración:** Los endpoints de recuperación de contraseña (`POST /api/auth/cuentas/password-olvidado` y `POST /api/auth/reenviar-correo-restablecer-password`) devuelven siempre 200 con el mismo mensaje, independientemente de si el correo existe o está en cooldown.

---







