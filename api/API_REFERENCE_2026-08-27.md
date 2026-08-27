# Documentación de Endpoints — TlaxApp API

**Generado:** 2026-08-20  
**Total de endpoints documentados:** 51  
**Archivos de rutas explorados:** `routes/bienvenida.js`, `routes/auth.js`, `routes/usuarios.js`, `routes/uploads.js`, `routes/posteos.js`, `routes/likes.js`, `routes/followers.js`, `routes/favoritos.js`, `routes/municipios.js`, `routes/notificaciones.js`, `routes/ubicacion.js`, `routes/soporte.js`, `routes/comentarios.js`  
**Controladores explorados:** todos los correspondientes en `controllers/`  
**Modelos consultados:** `Usuario.js`, `Posteo.js`, `Like.js`, `Follow.js`, `Favorito.js`, `Comentario.js`, `Notificacion.js`, `Municipio.js`, `UserToken.js`  
**Middlewares/errores consultados:** `validar-jwt-cookies-sesion.js`, `validar-campos.js`, `validar-token-en-url.js`, `validar-url-usuario.js`, `validar-imagen-posteo.js`, `validar-texto.js`, `validar-origen.js`, `rate-limiter.js`, `error-handler.js`, `app-error.js`, `error-classes.js`, `responder.js`, `multer.js`, `subir-archivo.js`, `crear-url-usuario.js`, `tokensUtils.js`

**Cambios respecto a la documentación anterior (2026-08-13):**  
Nuevo endpoint `DELETE /api/posteos/:id/ubicacion` (total: 51 endpoints; se mantienen los 12 rate limiters). Cambios de contrato en el recurso Posteos: `lat`/`lng` usan `optional({ values: 'falsy' })` en POST y PUT (toleran `null`/`''`/`undefined`); en `PUT /api/posteos/:id` los valores vacíos de ubicación se interpretan como "no tocar" (se depreca el borrado vía `municipio: null` + `lat: null`, ahora con endpoint dedicado); las respuestas de escritura (POST/PUT/DELETE-ubicación) devuelven `_idUsuario` poblado; `ubicacion.municipio` ya no se puebla (ObjectId crudo); `ubicacion.coordinates` se redondea a 3 decimales (~110 m). Se actualizaron las citas de línea de `routes/posteos.js` y `controllers/posteos.js` en las secciones editadas.

---

## Endpoints no verificables completamente

- El envío real de correos electrónicos depende de `SEND_EMAIL` y de la configuración SMTP/transporte en `.env` / `config/nodemailer-transporter.js`.
- La subida y entrega de imágenes dependen de la cuenta/configuración de Cloudinary.
- La resolución de ubicación (`POST /api/ubicacion/reverse`) depende de que existan polígonos en la colección `Municipio`.
- Los ejemplos JSON que no provienen de una colección de pruebas real están marcados como construidos a partir del esquema/validación.

---

## 1. Convenciones generales

### 1.1 Base URL

- Entorno local por defecto: `http://localhost:3000` (`models/server.js:20`).
- Los prefijos de ruta se definen en `models/server.js` (ej. `/api/auth`, `/api/usuarios`, `/api/posteos`).

### 1.2 Autenticación

La API usa **cookies httpOnly** para almacenar dos tokens JWT:

| Cookie | Contenido | Duración de cookie | Uso |
|---|---|---|---|
| `accessToken` | JWT de acceso (`id`, `tokenVersion`) | 1h | Protege la mayoría de endpoints |
| `refreshToken` | JWT de refresco (`id`) | 7d | Usado en `POST /api/auth/refresh` y `POST /api/auth/logout` |

Propiedades de las cookies (`controllers/auth.js:173-186`, `helpers/tokensUtils.js:5-13`):
- `httpOnly: true`
- `secure: true`
- `sameSite: 'none'`
- `path: '/'`

El frontend **debe enviar `credentials: 'include'`** en todas las peticiones para que las cookies viajen.

No se usa header `Authorization: Bearer <token>` en los endpoints protegidos.

### 1.3 CORS y CSRF

- CORS está configurado con `credentials: true` (`models/server.js:95`).
- El middleware `validarOrigen` (`middlewares/validar-origen.js`) protege los métodos mutantes (`POST`, `PUT`, `PATCH`, `DELETE`) verificando `Origin` o `Referer` contra `FRONTEND_URL` y `CSRF_ALLOWED_ORIGINS`.
- En `development` se permite origen vacío; en `production` las peticiones mutantes sin origen válido devuelven `403 Forbidden`.

### 1.4 Formato de respuestas exitosas

Definido en `helpers/responder.js`.

**Respuesta simple:**
```json
{
  "success": true,
  "msg": "Posteo creado correctamente"
}
```

**Respuesta con datos:**
```json
{
  "success": true,
  "msg": "Login exitoso",
  "data": { "usuario": { "uid": "...", "correo": "..." } }
}
```

**Respuesta paginada:**
```json
{
  "success": true,
  "data": [],
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

Excepciones documentadas:
- `GET /` y `GET /api/health` (`controllers/bienvenida.js`) mantienen su formato propio de infraestructura.

Códigos HTTP:
- `200` por defecto.
- `201` para creación de recursos (`POST /api/posteos`, `POST /api/comentarios/:posteoId/comentarios`).

---

## 2. Formato global de errores (RFC 9457)

Todos los errores siguen el estándar **RFC 9457 (Problem Details)** (`middlewares/error-handler.js`):

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
| `trace_id` | string | ID único de correlación (`req.traceId`) |
| `errors` | array | Detalles de validación: `[{ field, code, message }]` |

### 2.1 Clases de error del dominio

Definidas en `errors/error-classes.js` (heredan de `AppError` en `errors/app-error.js`):

| HTTP | Clase | `code` | title | Archivo |
|---|---|---|---|---|
| 400 | `BadRequestError` | `BAD_REQUEST` | `Bad Request` | `errors/error-classes.js:14-17` |
| 401 | `AuthenticationError` | `UNAUTHORIZED` | `Authentication Required` | `errors/error-classes.js:21-24` |
| 403 | `ForbiddenError` | `FORBIDDEN` | `Forbidden` | `errors/error-classes.js:28-31` |
| 404 | `NotFoundError` | `NOT_FOUND` | `Resource Not Found` | `errors/error-classes.js:35-38` |
| 409 | `ConflictError` | `CONFLICT` | `Conflict` | `errors/error-classes.js:42-45` |
| 410 | `GoneError` | `GONE` | `Gone` | `errors/error-classes.js:49-52` |
| 422 | `ValidationError` | `VALIDATION_FAILED` | `Validation Failed` | `errors/error-classes.js:56-63` |
| 429 | `RateLimitError` | `RATE_LIMIT_EXCEEDED` | `Rate Limit Exceeded` | `errors/error-classes.js:67-76` |
| 500 | `InternalError` | `INTERNAL_ERROR` | `Internal Server Error` | `errors/error-classes.js:79-83` |

### 2.2 Errores adicionales manejados por el error handler

| Origen | `code` | HTTP | Dónde se captura |
|---|---|---|---|
| Multer (`LIMIT_*`) | `FILE_ERROR` | 400 | `middlewares/error-handler.js:42-58` |
| express-validator | `VALIDATION_FAILED` | 422 | `middlewares/error-handler.js:60-77` |
| JSON malformado (`entity.parse.failed`) | `INVALID_JSON` | 400 | `middlewares/error-handler.js:79-90` |
| MongoDB clave duplicada (`E11000`) | `CONFLICT` | 409 | `middlewares/error-handler.js:92-105` |
| Error no contemplado | `INTERNAL_ERROR` | 500 | `middlewares/error-handler.js:107-119` |

### 2.3 Rate limiting

Los rate limiters están definidos en `middlewares/rate-limiter.js`. Cada uno responde directamente con `429` y su propio `code` en mayúsculas. **No** incluyen `retry_after`.

| Limiter | Ventana | Máximo | Code | Archivo |
|---|---|---|---|---|
| `loginLimiter` | 15 min | 5 | `LOGIN_BLOCKED` | `middlewares/rate-limiter.js:19-38` |
| `recoveryLimiter` | 15 min | 3 | `RECOVERY_BLOCKED` | `middlewares/rate-limiter.js:41-53` |
| `verificacionLimiter` | 15 min | 5 | `VERIFICATION_BLOCKED` | `middlewares/rate-limiter.js:56-68` |
| `reenvioCorreoLimiter` | 5 min | 3 | `EMAIL_BLOCKED` | `middlewares/rate-limiter.js:71-83` |
| `registroLimiter` | 1 h | 3 | `REGISTER_BLOCKED` | `middlewares/rate-limiter.js:86-98` |
| `posteoLimiter` | 15 min | 20 | `POSTEO_BLOCKED` | `middlewares/rate-limiter.js:101-113` |
| `soporteLimiter` | 15 min | 5 | `SOPORTE_BLOCKED` | `middlewares/rate-limiter.js:116-128` |
| `lecturaLimiter` | 15 min | 100 | `READ_BLOCKED` | `middlewares/rate-limiter.js:131-143` |
| `comentarioLimiter` | 1 min | 10 | `COMENTARIO_BLOCKED` | `middlewares/rate-limiter.js:146-158` |
| `refreshLimiter` | 15 min | 10 | `REFRESH_BLOCKED` | `middlewares/rate-limiter.js:161-173` |
| `posteoPublicoLimiter` | 15 min | 100 | `POST_DETAIL_BLOCKED` | `middlewares/rate-limiter.js:176-188` |
| `imagenPerfilLimiter` | 15 min | 10 | `IMAGEN_BLOCKED` | `middlewares/rate-limiter.js:191-203` |

El `loginLimiter` usa como clave `IP + correo` (fallback a IP) (`middlewares/rate-limiter.js:30-36`).

Además, algunos controladores lanzan `RateLimitError` con `code: RATE_LIMIT_EXCEEDED` e incluyen `retry_after` (por ejemplo, cooldown de 5 min para reenvío de correo y cooldown de 30 días para cambio de nombre/URL).

### 2.4 Subida de imágenes

- Las imágenes se suben a Cloudinary **sin transformaciones de subida** (raw upload). Las transformaciones visuales se aplican al vuelo en la URL de entrega desde el frontend usando el `public_id` (`helpers/subir-archivo.js:13-30`).
- Multer usa almacenamiento en memoria, límite **8 MB**, extensiones `.jpg`, `.jpeg`, `.png`, `.webp` y MIME `image/jpeg`, `image/png`, `image/webp` (`helpers/multer.js:5-32`).
- El campo de archivo esperado es **siempre `img`** (`routes/posteos.js:70`, `routes/uploads.js:24`).
- `DEFAULT_USER_IMAGE` es un `secure_url` estático y no se borra al reemplazar la imagen de perfil (`controllers/uploads.js:37-54`).

### 2.5 Slugs / URL de usuario

- El campo `url` se genera automáticamente al registrarse y se regenera al cambiar `nombre_completo` (`controllers/usuarios.js:98`, `controllers/usuarios.js:179-197`).
- Formato kebab-case, máximo 50 caracteres, sin acentos ni caracteres especiales (`helpers/crear-url-usuario.js:13-38`).
- En caso de colisión se añade un sufijo aleatorio de 5 hex chars.
- La URL anterior se guarda en `url_history`; `GET /api/usuarios/:urlAntigua` devuelve `200` con header `Location` y datos de redirección si la URL está en el historial (`middlewares/validar-url-usuario.js:10-25`).
- Cooldown de 30 días para cambiar nombre/URL, excepto el primer cambio post-registro (`controllers/usuarios.js:164-177`).

### 2.6 Refresh token rotation

`POST /api/auth/refresh` rota tanto el `accessToken` como el `refreshToken`, reemplazando el hash almacenado en `UserToken` (`controllers/auth.js:391-459`). Si se detecta reuso de un refresh token previamente rotado, se invalidan todas las sesiones del usuario (`controllers/auth.js:396-406`).

---

## 3. Recurso: Bienvenida y Health

### 3.1 `GET /`

**Descripción:** Endpoint raíz. Devuelve metadatos del servicio.  
**Archivo de ruta:** `routes/bienvenida.js:7`  
**Controlador:** `controllers/bienvenida.js` — `getBienvenida` (línea 3)

#### Autenticación y permisos
- Requiere token: **No**
- Middleware de auth: Ninguno

#### Parámetros de entrada
Ninguno.

#### Ejemplo de request
```http
GET /
```

#### Ejemplo de response — éxito
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

#### Códigos de error posibles
Ninguno (siempre responde 200).

#### Notas para el Frontend
- No requiere cookies ni headers especiales.

---

### 3.2 `GET /api/health`

**Descripción:** Health check del servidor. Estado de BD, memoria, uptime, entorno.  
**Archivo de ruta:** `routes/bienvenida.js:8`  
**Controlador:** `controllers/bienvenida.js` — `getHealth` (línea 12)

#### Autenticación y permisos
- Requiere token: **No**
- Middleware de auth: Ninguno

#### Rate limiting
- `lecturaLimiter` → `READ_BLOCKED` (`routes/bienvenida.js:8`, `middlewares/rate-limiter.js:131-143`)

#### Parámetros de entrada
Ninguno.

#### Ejemplo de request
```http
GET /api/health
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "status": "ok",
  "uptime": 12345.678,
  "timestamp": "2026-08-20T12:00:00.000Z",
  "service": "TlaxApp API",
  "version": "1.0.0",
  "environment": "development",
  "memory": { "rss": 85000000, "heapTotal": 45000000, "heapUsed": 32000000, "external": 3500000 },
  "heapUsedPercentage": "71.11%",
  "pid": 12345,
  "db": { "status": "connected" }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | `Demasiadas solicitudes, intenta de nuevo más tarde` | `middlewares/rate-limiter.js:131-143` |

#### Notas para el Frontend
- `db.status` puede ser `"connected"` o `"disconnected"`.

---

## 4. Recurso: Auth (`/api/auth`)

### 4.1 `GET /api/auth/verificar-correo{/:token}`

**Descripción:** Verifica la cuenta de usuario a partir del token enviado por correo.  
**Archivo de ruta:** `routes/auth.js:26-30`  
**Controlador:** `controllers/auth.js` — `verificarCorreo` (línea 30)

#### Autenticación y permisos
- Requiere token: **No** (usa token en la URL)

#### Middlewares (en orden)
1. `verificacionLimiter`
2. `validarTokenEnURL`
3. `check('token').isJWT()`
4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `token` | string | Sí (en URL) | Debe ser JWT (`routes/auth.js:28`) |

#### Ejemplo de request
```http
GET /api/auth/verificar-correo/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Correo verificado"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 400 | `BAD_REQUEST` | Bad Request | `El token es obligatorio en la URL` | `middlewares/validar-token-en-url.js:7` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `Token invalido` | `routes/auth.js:28` + `middlewares/validar-campos.js:23-28` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Token inválido o ha expirado` | `email/servicios-autenticacion-correo.js:195` / `:204` |
| 429 | `VERIFICATION_BLOCKED` | Rate Limit Exceeded | `Demasiados intentos de verificación de correo, intenta de nuevo en 15 minutos` | `middlewares/rate-limiter.js:56-68` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Varios mensajes internos | `controllers/auth.js:40`, `email/servicios-autenticacion-correo.js:198-225` |

#### Notas para el Frontend
- La ruta usa sintaxis de `path-to-regexp` v8: el token es opcional gracias a `{/:token}`. Sin embargo, el middleware `validarTokenEnURL` exige que venga.

---

### 4.2 `POST /api/auth/reenviar-correo`

**Descripción:** Reenvía el correo de verificación de cuenta.  
**Archivo de ruta:** `routes/auth.js:32-35`  
**Controlador:** `controllers/auth.js` — `reenviarCorreoVerificacion` (línea 44)

#### Autenticación y permisos
- Requiere token: **No** (recibe token de verificación anterior en el body)

#### Middlewares (en orden)
1. `reenvioCorreoLimiter`
2. `check('token').isJWT()`
3. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `token` | string | Sí | JWT válido (`routes/auth.js:33`) |

#### Ejemplo de request
```http
POST /api/auth/reenviar-correo
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Correo reenviado a usuario@ejemplo.com"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | Validation Failed | `Token invalido` | `routes/auth.js:33` + `middlewares/validar-campos.js:23-28` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Correo no existe` | `controllers/auth.js:57` |
| 403 | `FORBIDDEN` | Forbidden | `Cuenta ya verificada` | `controllers/auth.js:63` |
| 429 | `EMAIL_BLOCKED` | Rate Limit Exceeded | `Demasiados correos enviados, intenta de nuevo en 5 minutos` | `middlewares/rate-limiter.js:71-83` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | `Espera N minutos antes de reenviar el correo` (con `retry_after`) | `controllers/auth.js:76` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Error genérico | `controllers/auth.js:94` |

#### Notas para el Frontend
- Hay un cooldown de 5 minutos por usuario controlado por `ultimo_correo_enviado`.

---

### 4.3 `POST /api/auth/login`

**Descripción:** Inicia sesión y establece las cookies `accessToken` y `refreshToken`.  
**Archivo de ruta:** `routes/auth.js:37-44`  
**Controlador:** `controllers/auth.js` — `login` (línea 99)

#### Autenticación y permisos
- Requiere token: **No**

#### Middlewares (en orden)
1. `loginLimiter`
2. `check('correo').isEmail()`
3. `check('password').trim().notEmpty()`
4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `correo` | string | Sí | Email válido (`routes/auth.js:39`) |
| body | `password` | string | Sí | No vacío (`routes/auth.js:41`) |

#### Ejemplo de request
```http
POST /api/auth/login
Content-Type: application/json

{
  "correo": "usuario@ejemplo.com",
  "password": "Contraseña123!"
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`
- Establece cookies `accessToken` y `refreshToken`.

```json
{
  "success": true,
  "msg": "Login exitoso",
  "data": {
    "usuario": {
      "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
      "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala" },
      "correo": "usuario@ejemplo.com",
      "imagen_perfil": { "secure_url": "https://res.cloudinary.com/...", "public_id": "..." },
      "genero": "MASCULINO",
      "fecha_nacimiento": "1990-01-01T00:00:00.000Z",
      "fecha_actualizacion": "2026-08-20T00:00:00.000Z",
      "url": "juan-perez-a3f12",
      "nombre_completo_changed_at": null,
      "uid": "64f...",
      "_id": "64f..."
    }
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | Validation Failed | Errores en `correo` o `password` | `routes/auth.js:39-41` + `middlewares/validar-campos.js:23-28` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Credenciales inválidas` | `controllers/auth.js:106` / `:148` |
| 403 | `FORBIDDEN` | Forbidden | `Cuenta no verificada` / `Cuenta no activada` | `controllers/auth.js:109` / `:112` |
| 429 | `LOGIN_BLOCKED` | Rate Limit Exceeded | `Demasiados intentos de inicio de sesión...` | `middlewares/rate-limiter.js:19-38` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | `Cuenta bloqueada temporalmente por actividad inusual...` (con `retry_after`) | `controllers/auth.js:119` / `:144` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Error genérico | `controllers/auth.js:221` |

#### Notas para el Frontend
- Debe enviar `credentials: 'include'` para recibir las cookies.
- Tras 10 intentos fallidos la cuenta se bloquea 30 minutos.

---

### 4.4 `POST /api/auth/cuentas/password-olvidado`

**Descripción:** Solicita el envío de un enlace para restablecer contraseña. Responde de forma indistinguible para evitar enumeración de correos.  
**Archivo de ruta:** `routes/auth.js:46-51`  
**Controlador:** `controllers/auth.js` — `envioCorreoReestablecerPassword` (línea 308)

#### Autenticación y permisos
- Requiere token: **No**

#### Middlewares (en orden)
1. `recoveryLimiter`
2. `check('correo').isEmail()`
3. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `correo` | string | Sí | Email válido (`routes/auth.js:48`) |

#### Ejemplo de request
```http
POST /api/auth/cuentas/password-olvidado
Content-Type: application/json

{
  "correo": "usuario@ejemplo.com"
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`
- Respuesta genérica anti-enumeración.

```json
{
  "success": true,
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña",
  "data": { "token": "a1b2c3d4..." }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | Validation Failed | `El correo no es valido` | `routes/auth.js:48` + `middlewares/validar-campos.js:23-28` |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | `Demasiados intentos de recuperación de contraseña...` | `middlewares/rate-limiter.js:41-53` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Error genérico | `controllers/auth.js:314` |

#### Notas para el Frontend
- El frontend **no debe** mostrar diferencia visual si el correo existe o no.
- El `data.token` es un token opaco para `sessionStorage`, no contiene PII.

---

### 4.5 `POST /api/auth/reenviar-correo-restablecer-password`

**Descripción:** Reenvía el correo de restablecimiento de contraseña usando el token opaco guardado en `sessionStorage`.  
**Archivo de ruta:** `routes/auth.js:53-56`  
**Controlador:** `controllers/auth.js` — `reenvioCorreoRestablecerPassword` (línea 318)

#### Autenticación y permisos
- Requiere token: **No**

#### Middlewares (en orden)
1. `recoveryLimiter`
2. `check('token').isJWT()`
3. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `token` | string | Sí | JWT válido (`routes/auth.js:54`) |

#### Ejemplo de request
```http
POST /api/auth/reenviar-correo-restablecer-password
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña",
  "data": { "token": "a1b2c3d4..." }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | Validation Failed | `Token invalido` | `routes/auth.js:54` + `middlewares/validar-campos.js:23-28` |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | `Demasiados intentos de recuperación de contraseña...` | `middlewares/rate-limiter.js:41-53` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Error genérico | `controllers/auth.js:325` |

---

### 4.6 `GET /api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}`

**Descripción:** Valida si el token de restablecimiento de contraseña es válido.  
**Archivo de ruta:** `routes/auth.js:58-62`  
**Controlador:** `controllers/auth.js` — `validarTokenRestablecerPassword` (línea 331)

#### Autenticación y permisos
- Requiere token: **No** (token en URL)

#### Middlewares (en orden)
1. `recoveryLimiter`
2. `validarTokenEnURL`
3. `check('token').isJWT()`
4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `token` | string | Sí (en URL) | JWT válido (`routes/auth.js:60`) |

#### Ejemplo de request
```http
GET /api/auth/cuentas/restablecer-password/validar-token-reset-password/eyJhbGci...
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Token válido",
  "data": { "valid": true }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 400 | `BAD_REQUEST` | Bad Request | `El token es obligatorio en la URL` | `middlewares/validar-token-en-url.js:7` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `Token invalido` | `routes/auth.js:60` + `middlewares/validar-campos.js:23-28` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Token inválido o expirado` (mensajes detallados en dev) | `controllers/auth.js:336-356` |
| 403 | `FORBIDDEN` | Forbidden | `Token inválido o expirado` (mensajes detallados en dev) | `controllers/auth.js:350-356` |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | `Demasiados intentos de recuperación de contraseña...` | `middlewares/rate-limiter.js:41-53` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Error genérico | `controllers/auth.js:364` |

---

### 4.7 `POST /api/auth/cuentas/reestablecer-password{/:token}`

**Descripción:** Restablece la contraseña usando el token recibido por correo.  
**Archivo de ruta:** `routes/auth.js:64-69`  
**Controlador:** `controllers/auth.js` — `reestablecerPassword` (línea 369)

#### Autenticación y permisos
- Requiere token: **No** (token en URL)

#### Middlewares (en orden)
1. `recoveryLimiter`
2. `check('password').trim().isLength({ min: 8 })`
3. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `token` | string | Sí (en URL) | Validado por `validarTokenEnURL` e `isJWT` implícito |
| body | `password` | string | Sí | Mínimo 8 caracteres (`routes/auth.js:66`) |

#### Ejemplo de request
```http
POST /api/auth/cuentas/reestablecer-password/eyJhbGci...
Content-Type: application/json

{
  "password": "NuevaContraseña123!"
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Password reestablecido"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 400 | `BAD_REQUEST` | Bad Request | `El token es obligatorio en la URL` | `middlewares/validar-token-en-url.js:7` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El password es obligatorio: debe tener al menos 8 caracteres` | `routes/auth.js:66` + `middlewares/validar-campos.js:23-28` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Token inválido o ha expirado` / `La cuenta no ha sido verificada` / `El token de restablecimiento...` | `email/servicios-correo-reestablecer-password.js:197-207` |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | `Demasiados intentos de recuperación de contraseña...` | `middlewares/rate-limiter.js:41-53` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Error genérico | `controllers/auth.js:377`, `email/servicios-correo-reestablecer-password.js:200-203` |

---

### 4.8 `POST /api/auth/refresh`

**Descripción:** Renueva el `accessToken` y rota el `refreshToken`.  
**Archivo de ruta:** `routes/auth.js:71`  
**Controlador:** `controllers/auth.js` — `refreshToken` (línea 381)

#### Autenticación y permisos
- Requiere token: **refreshToken cookie**

#### Middlewares (en orden)
1. `refreshLimiter` (`routes/auth.js:71`)

#### Parámetros de entrada
Ninguno (usa cookie `refreshToken`).

#### Ejemplo de request
```http
POST /api/auth/refresh
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`
- Renueva cookies `accessToken` y `refreshToken`.

```json
{
  "success": true,
  "msg": "Token renovado"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | `No hay cookies de sesion para hacer refresh token` | `controllers/auth.js:388` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Sesión comprometida. Inicia sesión nuevamente.` | `controllers/auth.js:406` |
| 403 | `FORBIDDEN` | Forbidden | `Token no registrado` | `controllers/auth.js:409` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Token no válido o expirado` | `controllers/auth.js:466` |
| 429 | `REFRESH_BLOCKED` | Rate Limit Exceeded | `Demasiadas solicitudes de renovación de token...` | `middlewares/rate-limiter.js:161-173` |

#### Notas para el Frontend
- El frontend debe llamar a este endpoint cuando reciba `401` en un endpoint protegido.
- Si el refresh es inválido o fue reusado, se invalidan todas las sesiones y el usuario debe iniciar sesión de nuevo.

---

### 4.9 `POST /api/auth/logout`

**Descripción:** Cierra la sesión, elimina las cookies y borra el refresh token de la BD.  
**Archivo de ruta:** `routes/auth.js:73-76`  
**Controlador:** `controllers/auth.js` — `logout` (línea 470)

#### Autenticación y permisos
- Requiere token: **refreshToken cookie**

#### Middlewares (en orden)
1. `validarRefreshToken` (`routes/auth.js:75`)

#### Parámetros de entrada
Ninguno.

#### Ejemplo de request
```http
POST /api/auth/logout
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`
- Limpia las cookies `accessToken` y `refreshToken`.

```json
{
  "success": true,
  "msg": "Sesión cerrada"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | `No hay refresh token en la petición` | `middlewares/validar-jwt-cookies-sesion.js:76` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Token no válido` | `middlewares/validar-jwt-cookies-sesion.js:84` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Error genérico | `controllers/auth.js:482` |

---

### 4.10 `GET /api/auth/me`

**Descripción:** Devuelve los datos del usuario autenticado.  
**Archivo de ruta:** `routes/auth.js:78-81`  
**Controlador:** `controllers/auth.js` — `getMe` (línea 225)

#### Autenticación y permisos
- Requiere token: **accessToken cookie**

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/auth.js:80`)

#### Parámetros de entrada
Ninguno.

#### Ejemplo de request
```http
GET /api/auth/me
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Usuario obtenido",
  "data": {
    "usuario": {
      "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
      "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala" },
      "imagen_perfil": { "secure_url": "...", "public_id": "..." },
      "correo": "usuario@ejemplo.com",
      "url": "juan-perez-a3f12",
      "genero": "MASCULINO",
      "fecha_nacimiento": "1990-01-01T00:00:00.000Z",
      "nombre_completo_changed_at": null,
      "uid": "64f..."
    }
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | `No hay token en la petición` | `middlewares/validar-jwt-cookies-sesion.js:14` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Token no válido - usuario no existe` | `middlewares/validar-jwt-cookies-sesion.js:27` |
| 403 | `FORBIDDEN` | Forbidden | `Cuenta no activada. El usuario debe verificar su cuenta` | `middlewares/validar-jwt-cookies-sesion.js:31` |
| 401 | `UNAUTHORIZED` | Authentication Required | `Sesión expirada - inicia sesión nuevamente` | `middlewares/validar-jwt-cookies-sesion.js:35` |
| 404 | `NOT_FOUND` | Resource Not Found | `Usuario no existe` | `controllers/auth.js:234` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Error genérico | `controllers/auth.js:243` |

---

## 5. Recurso: Usuarios (`/api/usuarios`)

### 5.1 `GET /api/usuarios/:url`

**Descripción:** Obtiene el perfil público de un usuario por su slug `url`, incluyendo contadores y si el usuario autenticado lo sigue.  
**Archivo de ruta:** `routes/usuarios.js:18-27`  
**Controlador:** `controllers/usuarios.js` — `usuarioGet` (línea 32)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/usuarios.js:20`)
2. `check('url').trim()` (`routes/usuarios.js:22`)
3. `validarUrlUsuario` (`routes/usuarios.js:24`)
4. `validarCampos` (`routes/usuarios.js:26`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `url` | string | Sí | Trim (no vacío implícito) (`routes/usuarios.js:22`) |

#### Ejemplo de request
```http
GET /api/usuarios/juan-perez-a3f12
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": {
    "usuario": {
      "_id": "64f...",
      "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
      "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala" },
      "imagen_perfil": { "secure_url": "...", "public_id": "..." },
      "url": "juan-perez-a3f12",
      "totalPosteos": 12,
      "totalSeguidores": 34,
      "totalSeguidos": 56,
      "isFollowing": true
    }
  }
}
```

#### Ejemplo de response — redirección por URL histórica
- Código de estado: `200`
- Header: `Location: /api/usuarios/nueva-url-actual`

```json
{
  "success": true,
  "msg": "La URL ha cambiado",
  "data": {
    "urlActual": "nueva-url-actual",
    "redirect": "permanent"
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | Varios mensajes de token | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 404 | `NOT_FOUND` | Resource Not Found | `El usuario con URL "..." no existe` | `middlewares/validar-url-usuario.js:28` / `:32` |
| 401 | `UNAUTHORIZED` | Authentication Required | `El usuario con URL "..." no ha verificado/activado su cuenta` | `middlewares/validar-url-usuario.js:36` / `:40` |
| 403 | `FORBIDDEN` | Forbidden | `El usuario con URL "..." tiene la cuenta suspendida` | `middlewares/validar-url-usuario.js:43` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `La URL no es valida` | `routes/usuarios.js:22` + `middlewares/validar-campos.js:23-28` |

---

### 5.2 `POST /api/usuarios`

**Descripción:** Registra un nuevo usuario. Envía correo de verificación y genera un token opaco para `sessionStorage`.  
**Archivo de ruta:** `routes/usuarios.js:30-58`  
**Controlador:** `controllers/usuarios.js` — `usuariosPost` (línea 75)

#### Autenticación y permisos
- Requiere token: **No**

#### Middlewares (en orden)
1. `registroLimiter` (`routes/usuarios.js:30`)
2. Validaciones de `nombre_completo.nombre`, `nombre_completo.apellido`, `correo`, `password`, `estatus`, `intentos_login` (`routes/usuarios.js:32-56`)
3. `validarCampos` (`routes/usuarios.js:57`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `nombre_completo.nombre` | string | Sí | Trim, 1-60 chars, regex `^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ .'\-]+$` (`routes/usuarios.js:32-36`) |
| body | `nombre_completo.apellido` | string | Sí | Igual que nombre (`routes/usuarios.js:38-42`) |
| body | `correo` | string | Sí | Email válido y no repetido (`routes/usuarios.js:44-46`) |
| body | `password` | string | Sí | Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial (`routes/usuarios.js:48-52`) |
| body | `estatus` | string/number | No | Opcional, numérico (`routes/usuarios.js:54`) |
| body | `intentos_login` | string/number | No | Opcional, numérico (`routes/usuarios.js:56`) |

#### Ejemplo de request
```http
POST /api/usuarios
Content-Type: application/json

{
  "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
  "correo": "usuario@ejemplo.com",
  "password": "Contraseña123!"
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": { "token": "a1b2c3d4e5f6..." }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | Validation Failed | Errores de validación de campos | `routes/usuarios.js:32-56` + `middlewares/validar-campos.js:23-28` |
| 409 | `CONFLICT` | Conflict | `El correo ya está registrado en la base de datos` | `helpers/validar-correo-usuario.js:12` / `middlewares/validar-campos.js:18` |
| 429 | `REGISTER_BLOCKED` | Rate Limit Exceeded | `Demasiadas cuentas creadas desde esta conexión...` | `middlewares/rate-limiter.js:86-98` |
| 409 | `CONFLICT` | Conflict | `El recurso ya existe: url duplicado` (race condition) | `middlewares/error-handler.js:92-105` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un problema al procesar la solicitud` | `controllers/usuarios.js:122` |

#### Notas para el Frontend
- El `data.token` es un token opaco para `sessionStorage`; no contiene PII.
- El usuario se guarda en BD solo si el correo de verificación se envía correctamente (`controllers/usuarios.js:111-113`). En desarrollo con `SEND_EMAIL=false` esto puede variar según la implementación del transporte.

---

### 5.3 `PUT /api/usuarios/update`

**Descripción:** Actualiza los datos del usuario autenticado. No actualiza imagen de perfil. Puede regenerar la URL si cambia `nombre_completo`.  
**Archivo de ruta:** `routes/usuarios.js:65-95`  
**Controlador:** `controllers/usuarios.js` — `usuariosPut` (línea 130)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/usuarios.js:67`)
2. Validaciones opcionales de `nombre_completo.nombre`, `nombre_completo.apellido`, `password`, `lugar_radicacion.*`, `genero`, `fecha_nacimiento` (`routes/usuarios.js:69-93`)
3. `validarCampos` (`routes/usuarios.js:94`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `nombre_completo.nombre` | string | No | Opcional, 1-60 chars, regex nombre (`routes/usuarios.js:69-74`) |
| body | `nombre_completo.apellido` | string | No | Opcional, 1-60 chars, regex nombre (`routes/usuarios.js:76-81`) |
| body | `password` | string | No | Opcional, mínimo 8 caracteres (`routes/usuarios.js:83`) |
| body | `lugar_radicacion.nombreEntidad` | string | No | Opcional, notEmpty (`routes/usuarios.js:85`) |
| body | `lugar_radicacion.claveMunicipio` | string | No | Opcional, notEmpty (`routes/usuarios.js:87`) |
| body | `lugar_radicacion.nombreMunicipio` | string | No | Opcional, notEmpty (`routes/usuarios.js:89`) |
| body | `genero` | string | No | Opcional, `isIn(['MASCULINO','FEMENINO','PREFIERO NO DECIR'])` (`routes/usuarios.js:91`) |
| body | `fecha_nacimiento` | string | No | Opcional, fecha (`routes/usuarios.js:93`) |

#### Ejemplo de request
```http
PUT /api/usuarios/update
Content-Type: application/json
credentials: include

{
  "nombre_completo": { "nombre": "Juan Carlos", "apellido": "Pérez" },
  "genero": "MASCULINO",
  "fecha_nacimiento": "1990-01-01"
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Usuario actualizado",
  "data": {
    "usuario": {
      "_id": "64f...",
      "nombre_completo": { "nombre": "Juan Carlos", "apellido": "Pérez" },
      "lugar_radicacion": {},
      "correo": "usuario@ejemplo.com",
      "url": "juan-carlos-perez-9b8c2",
      "genero": "MASCULINO",
      "fecha_nacimiento": "1990-01-01T00:00:00.000Z",
      "nombre_completo_changed_at": "2026-08-20T12:00:00.000Z"
    }
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | Errores de validación de campos | `routes/usuarios.js:69-93` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `Usuario no encontrado` | `controllers/usuarios.js:154` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | `Solo puedes cambiar tu nombre y URL una vez cada 30 días` (con `retry_after`) | `controllers/usuarios.js:172-175` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un problema al procesar la solicitud` | `controllers/usuarios.js:234` |

#### Notas para el Frontend
- Solo se permiten explícitamente los campos del `ALLOWED_FIELDS` (`controllers/usuarios.js:24-29`).
- Si cambia `nombre_completo`, se regenera `url` y se guarda la anterior en `url_history`.

---

### 5.4 `DELETE /api/usuarios/delete`

**Descripción:** Elimina la cuenta del usuario autenticado (soft delete) en una transacción de MongoDB.  
**Archivo de ruta:** `routes/usuarios.js:97-100`  
**Controlador:** `controllers/usuarios.js` — `usuariosDelete` (línea 242)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)
- Requiere `refreshToken` cookie

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/usuarios.js:99`)

#### Parámetros de entrada
Ninguno.

#### Ejemplo de request
```http
DELETE /api/usuarios/delete
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`
- Limpia las cookies de sesión.

```json
{
  "success": true,
  "msg": "Cuenta eliminada exitosamente. Tus datos serán eliminados permanentemente en unos días."
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 403 | `FORBIDDEN` | Forbidden | `No hay refresh token` | `controllers/usuarios.js:258` |
| 404 | `NOT_FOUND` | Resource Not Found | `Usuario no encontrado` | `controllers/usuarios.js:270` |
| 400 | `BAD_REQUEST` | Bad Request | `La cuenta ya fue eliminada previamente` | `controllers/usuarios.js:277` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un problema al eliminar la cuenta de usuario...` | `controllers/usuarios.js:423` |

#### Notas para el Frontend
- Marca el usuario como `estatus: 4` e `isDeleted: true`, y propaga el soft delete a posteos, follows, likes, notificaciones, favoritos y comentarios dentro de una transacción.

---

### 5.5 `GET /api/usuarios/registrados/nuevos-usuarios-registrados`

**Descripción:** Devuelve los últimos 3 usuarios registrados (activos y verificados), excluyendo al usuario autenticado.  
**Archivo de ruta:** `routes/usuarios.js:102-105`  
**Controlador:** `controllers/usuarios.js` — `nuevosUsuariosRegistrados` (línea 433)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/usuarios.js:104`)

#### Parámetros de entrada
Ninguno.

#### Ejemplo de request
```http
GET /api/usuarios/registrados/nuevos-usuarios-registrados
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Nuevos Usuarios Registrados",
  "data": {
    "nuevosUsuariosRegistrados": [
      {
        "_id": "64f...",
        "nombre_completo": { "nombre": "Ana", "apellido": "López" },
        "url": "ana-lopez-4d2e1",
        "imagen_perfil": { "secure_url": "...", "public_id": "..." },
        "isFollowing": false
      }
    ]
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener los nuevos usuarios` | `controllers/usuarios.js:500` |

---

## 6. Recurso: Uploads (`/api/uploads`)

### 6.1 `PUT /api/uploads/:coleccion`

**Descripción:** Actualiza la imagen de perfil del usuario autenticado.  
**Archivo de ruta:** `routes/uploads.js:17-36`  
**Controlador:** `controllers/uploads.js` — `actualizarImagen` (línea 9)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `imagenPerfilLimiter` (`routes/uploads.js:19`)
2. `verificarTokenSesion` (`routes/uploads.js:21`)
3. `upload.single('img')` (`routes/uploads.js:24`)
4. `validarCampoImg` (`routes/uploads.js:26`)
5. `validarImagenesMulter` (`routes/uploads.js:29`)
6. `check('coleccion').custom(coleccionesPermitidas(c, ['usuarios']))` (`routes/uploads.js:34`)
7. `validarCampos` (`routes/uploads.js:35`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `coleccion` | string | Sí | Debe ser `"usuarios"` (`routes/uploads.js:34`, `helpers/colecciones-permitidas.js:6-12`) |
| body (multipart) | `img` | file | Sí | Campo archivo con nombre `"img"`; máximo 8 MB; `.jpg/.jpeg/.png/.webp` (`helpers/multer.js:5-32`) |

#### Ejemplo de request
```http
PUT /api/uploads/usuarios
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
credentials: include

------WebKitFormBoundary
Content-Disposition: form-data; name="img"; filename="perfil.jpg"
Content-Type: image/jpeg

<bytes de imagen>
------WebKitFormBoundary--
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Imagen de perfil actualizada correctamente",
  "data": {
    "imagen_perfil": {
      "secure_url": "https://res.cloudinary.com/.../perfil.jpg",
      "public_id": "tlaxapp/imagenes-perfiles-usuarios/64f.../uuid"
    }
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/u origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 400 | `BAD_REQUEST` | Bad Request | `No hay ninguna imagen para subir` | `middlewares/validar-imagen-posteo.js:19` |
| 400 | `FILE_ERROR` / `BAD_REQUEST` | File Upload Error / Bad Request | Errores de Multer (`LIMIT_FILE_SIZE`, etc.) | `middlewares/error-handler.js:42-58`, `middlewares/validar-imagen-posteo.js:27` |
| 400 | `BAD_REQUEST` | Bad Request | `La coleccion: ... no esta permitida, se permiten: usuarios` | `helpers/colecciones-permitidas.js:10` |
| 400 | `BAD_REQUEST` | Bad Request | `No existe un usuario con el ID: ...` | `controllers/uploads.js:24` |
| 429 | `IMAGEN_BLOCKED` | Rate Limit Exceeded | `Demasiadas subidas de imagen de perfil...` | `middlewares/rate-limiter.js:191-203` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al actualizar la imagen` | `controllers/uploads.js:89` |

#### Notas para el Frontend
- El frontend debe construir URLs de entrega transformadas a partir del `public_id` (ej. `w_100,h_100,c_fill,q_auto,f_auto`).
- Si la imagen anterior era la imagen por defecto, no se intenta borrar en Cloudinary.

---

## 7. Recurso: Posteos (`/api/posteos`)

### 7.1 `GET /api/posteos`

**Descripción:** Lista los posteos públicos de otros usuarios, excluyendo los del usuario autenticado, con información de like, follow y favorito. Acepta filtros opcionales por municipio y localidad.  
**Archivo de ruta:** `routes/posteos.js:32-43`  
**Controlador:** `controllers/posteos.js` — `posteosGet` (línea 39)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `lecturaLimiter`
2. `verificarTokenSesion`
3. `check('page').optional().isNumeric()`
4. `check('limite').optional().isNumeric()`
5. `check('municipio').optional({ values: 'falsy' }).isMongoId()`
6. `check('localidadClave').optional({ values: 'falsy' }).matches(/^\d{4}$/)`
7. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | `page` | number | No | Opcional, numérico |
| query | `limite` | number | No | Opcional, numérico |
| query | `municipio` | string (MongoId) | No | Opcional, MongoId |
| query | `localidadClave` | string | No | Regex `^\d{4}$`; requiere `municipio` |

> Filtrar por `localidadClave` sin enviar `municipio` devuelve `400 BAD_REQUEST` ("Para filtrar por localidad debe indicarse tambien el municipio") porque las claves INEGI solo son únicas dentro de su municipio.

#### Ejemplo de request
```http
GET /api/posteos?page=1&limite=15&municipio=64f...&localidadClave=0024
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "ubicacion": {},
      "public_id": "tlaxapp/posteos/64f.../uuid",
      "texto": "Hermosa tarde en Tlaxcala",
      "fecha_creacion": "2026-08-20T12:00:00.000Z",
      "comentariosActivos": true,
      "_idUsuario": { "_id": "64f...", "nombre_completo": {}, "url": "...", "imagen_perfil": { "public_id": "..." } },
      "isFollowing": false,
      "isFavorito": true,
      "likesCount": 24,
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

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El parametro PAGE/LIMITE debe ser de tipo numerico` | `routes/posteos.js:36-37` + `middlewares/validar-campos.js:23-28` |
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | `Demasiadas solicitudes, intenta de nuevo más tarde` | `middlewares/rate-limiter.js:131-143` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error al obtener los posteos de usuarios...` | `controllers/posteos.js:144` |

---

### 7.2 `GET /api/posteos/post/:id`

**Descripción:** Obtiene un posteo público por ID. Si hay sesión válida, añade datos personalizados (like, follow, favorito).  
**Archivo de ruta:** `routes/posteos.js:46-53`  
**Controlador:** `controllers/posteos.js` — `posteoGet` (línea 148)

#### Autenticación y permisos
- Requiere token: **Opcional** (`verificarTokenSesionOpcional`)

#### Middlewares (en orden)
1. `posteoPublicoLimiter` (`routes/posteos.js:46`)
2. `verificarTokenSesionOpcional` (`routes/posteos.js:47`)
3. `check('id').isMongoId()` (`routes/posteos.js:49`)
4. `validarCampos` (`routes/posteos.js:51`)
5. `validarIdPosteo` (`routes/posteos.js:52`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido (`routes/posteos.js:49`) |

#### Ejemplo de request
```http
GET /api/posteos/post/64f...
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": {
    "posteo": {
      "_id": "64f...",
      "_idUsuario": { "_id": "64f...", "nombre_completo": {}, "imagen_perfil": { "public_id": "..." }, "url": "..." },
      "public_id": "tlaxapp/posteos/64f.../uuid",
      "texto": "Hermosa tarde en Tlaxcala",
      "ubicacion": {},
      "fecha_creacion": "2026-08-20T12:00:00.000Z",
      "comentariosActivos": true,
      "comentariosCount": 5,
      "likesCount": 24
    },
    "isFollowing": false,
    "isFavorito": false
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` | `routes/posteos.js:49` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: ... ha sido eliminado` / `... no existe` | `helpers/validar-id-posteo.js:9` / `:13` |
| 429 | `POST_DETAIL_BLOCKED` | Rate Limit Exceeded | `Demasiadas solicitudes, intenta de nuevo más tarde` | `middlewares/rate-limiter.js:176-188` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error al obtener el posteo por ID...` | `controllers/posteos.js:189` |

---

### 7.3 `GET /api/posteos/usuario/:idUsuario`

**Descripción:** Lista los posteos de un usuario específico por su ID.  
**Archivo de ruta:** `routes/posteos.js:56-67`  
**Controlador:** `controllers/posteos.js` — `posteosUsuarioGet` (línea 193)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/posteos.js:58`)
2. `check('idUsuario').isMongoId()` (`routes/posteos.js:60`)
3. `check('page').optional().isNumeric()` (`routes/posteos.js:62`)
4. `check('limite').optional().isNumeric()` (`routes/posteos.js:63`)
5. `validarCampos` (`routes/posteos.js:65`)
6. `validarIdUsuario` (`routes/posteos.js:66`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `idUsuario` | string | Sí | MongoId válido (`routes/posteos.js:60`) |
| query | `page` | number | No | Opcional, numérico (`routes/posteos.js:62`) |
| query | `limite` | number | No | Opcional, numérico (`routes/posteos.js:63`) |

#### Ejemplo de request
```http
GET /api/posteos/usuario/64f...?page=1&limite=15
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "public_id": "tlaxapp/posteos/64f.../uuid",
      "secure_url": "https://res.cloudinary.com/.../img.jpg",
      "likesCount": 10,
      "hasLiked": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 30,
    "totalPages": 2,
    "next": "/api/posteos/usuario/64f...?page=2&limit=15",
    "prev": null
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` / errores de page/limite | `routes/posteos.js:60-63` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID ... no existe en la BD` / `... no está activo` | `helpers/validar-id-usuario.js:10` / `:14` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error al obtener los Posteos...` | `controllers/posteos.js:260` |

---

### 7.4 `POST /api/posteos`

**Descripción:** Crea un nuevo posteo con una imagen y, opcionalmente, texto y ubicación.  
**Archivo de ruta:** `routes/posteos.js:69-94`  
**Controlador:** `controllers/posteos.js` — `posteosPost` (línea 267)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `posteoLimiter`
2. `verificarTokenSesion`
3. `upload.single('img')`
4. `validarCampoImg`
5. `validarImagenesMulter`
6. `validarTexto`
7. `check('posteo_publico').optional().isBoolean()`
8. `check('lat').optional({ values: 'falsy' }).isFloat()` — `null`/`''`/`undefined` pasan la validación (sin GPS) (`routes/posteos.js:87`)
9. `check('lng').optional({ values: 'falsy' }).isFloat()` — ídem (`routes/posteos.js:88`)
10. `check('municipio').optional({ values: 'falsy' }).isMongoId()`
11. `check('localidadClave').optional({ values: 'falsy' }).matches(/^\d{4}$/)`
12. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body (multipart) | `img` | file | Sí | Campo `img`, máximo 8 MB, extensiones/MIME permitidos (`routes/posteos.js`, `helpers/multer.js`) |
| body | `texto` | string | No | Opcional, regex `^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,!?¡¿()\s-]*$` (`middlewares/validar-texto.js`) |
| body | `posteo_publico` | string/boolean | No | Opcional, booleano |
| body | `municipio` | string (MongoId) | No | Opcional, MongoId; debe existir en la colección Municipio si se envía con `localidadClave` |
| body | `localidadClave` | string | No | Regex `^\d{4}$`; debe pertenecer al `municipio` indicado (`400 BAD_REQUEST` si no) |
| body | `ciudad` | string | No | Opcional |
| body | `estado` | string | No | Opcional |
| body | `pais` | string | No | Opcional; default `"México"` |
| body | `lat` | number/string | No | Opcional; `optional({ values: 'falsy' }).isFloat()` — `null`/`''`/`undefined` pasan sin validar (sin GPS) |
| body | `lng` | number/string | No | ídem `lat` |

> `localidadNombre` **no** se acepta del cliente: el backend lo resuelve desde el catálogo INEGI embebido en Municipio usando `localidadClave`. Si `localidadClave` viene sin `municipio`, la localidad queda `null`.

#### Ejemplo de request
```http
POST /api/posteos
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
credentials: include

------WebKitFormBoundary
Content-Disposition: form-data; name="img"; filename="paisaje.jpg"
Content-Type: image/jpeg

<bytes de imagen>
------WebKitFormBoundary
Content-Disposition: form-data; name="texto"

Hermosa tarde en Tlaxcala
------WebKitFormBoundary
Content-Disposition: form-data; name="posteo_publico"

true
------WebKitFormBoundary--
```

#### Ejemplo de response — éxito
- Código de estado: `201`

```json
{
  "success": true,
  "msg": "Posteo creado correctamente",
  "data": {
    "posteo": {
      "_id": "64f...",
      "_idUsuario": { "_id": "64f...", "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" }, "imagen_perfil": { "public_id": "..." }, "url": "juan-perez-a3f12" },
      "public_id": "tlaxapp/posteos/64f.../uuid",
      "texto": "Hermosa tarde en Tlaxcala",
      "secure_url": "https://res.cloudinary.com/.../paisaje.jpg",
      "posteo_publico": true,
      "ubicacion": {
        "ciudad": null,
        "municipio": "6999...",
        "localidadClave": "0024",
        "localidadNombre": "Ranchería de Pilares",
        "estado": "Tlaxcala",
        "pais": "México",
        "coordinates": null,
        "esExacta": false
      },
      "fecha_creacion": "2026-08-20T12:00:00.000Z"
    }
  }
}
```

> La respuesta trae `_idUsuario` **poblado** con `{ _id, nombre_completo, imagen_perfil.public_id, url }`, igual que en los GETs (constante `PROYECCION_AUTOR_POSTEO` en `controllers/posteos.js:17`; populate en `controllers/posteos.js:352`). `ubicacion.municipio` se devuelve como **ObjectId crudo** (ya no se puebla el nombre del municipio).

> `ubicacion.coordinates` se guarda **redondeado a 3 decimales (~110 m)** vía `helpers/redondear-coordenadas.js:5-8` (`controllers/posteos.js:327`): la BD nunca almacena la ubicación GPS exacta del usuario.

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js`, `middlewares/validar-origen.js` |
| 400 | `BAD_REQUEST` | Bad Request | `No hay ninguna imagen para subir` / `El municipio indicado no existe` / `La localidad no pertenece al municipio seleccionado` | `middlewares/validar-imagen-posteo.js`, `controllers/posteos.js` — `resolverLocalidad` |
| 400 | `FILE_ERROR` / `BAD_REQUEST` | File Upload Error / Bad Request | Errores de Multer (`LIMIT_FILE_SIZE`, etc.) | `middlewares/error-handler.js`, `middlewares/validar-imagen-posteo.js` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El campo de texto contiene caracteres especiales no permitidos` / `El campo posteo_publico debe ser de tipo Boolean` / `La latitud/longitud debe ser un número` / `La clave de la localidad debe ser una clave INEGI de 4 digitos` | `middlewares/validar-texto.js`, `routes/posteos.js` + `middlewares/validar-campos.js` |
| 429 | `POSTEO_BLOCKED` | Rate Limit Exceeded | `Demasiadas publicaciones, intenta de nuevo más tarde` | `middlewares/rate-limiter.js` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error interno al procesar la publicación` | `controllers/posteos.js` |

#### Notas para el Frontend
- Si se proporcionan `lat` y `lng`, la ubicación se marca como exacta (`esExacta: true`) y se guarda en formato GeoJSON `[lng, lat]` **redondeado a 3 decimales (~110 m)**.
- Si se envía `municipio` sin coordenadas, `esExacta` es `false` y `coordinates` es `null`.
- Para publicar con geolocalización + localidad ("Ixtenco, Ranchería de Pilares"): llamar primero a `POST /api/ubicacion/reverse` (devuelve `localidad_cercana`) y enviar su `clave` como `localidadClave`.

---

### 7.5 `PUT /api/posteos/:id`

**Descripción:** Actualiza texto, visibilidad y/o ubicación de un posteo propio.  
**Archivo de ruta:** `routes/posteos.js:96-113`  
**Controlador:** `controllers/posteos.js` — `posteosPut` (línea 374)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)
- Solo el dueño del posteo puede modificarlo.

#### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('id').isMongoId()`
3. `validarTexto`
4. `check('lat').optional({ values: 'falsy' }).isFloat()` / `check('lng').optional({ values: 'falsy' }).isFloat()` — toleran `null`/`''`/`undefined` (`routes/posteos.js:106-107`)
5. `check('municipio').optional({ values: 'falsy' }).isMongoId()`
6. `check('localidadClave').optional({ values: 'falsy' }).matches(/^\d{4}$/)`
7. `validarCampos`
8. `validarIdPosteo`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido |
| body | `texto` | string | No | Opcional, regex permitido (`middlewares/validar-texto.js`) |
| body | `posteo_publico` | string/boolean | No | Opcional, se convierte a booleano |
| body | `municipio` | string (MongoId) | No | Opcional; `null`/`''`/`undefined` = "no tocar" la ubicación; si viene con `localidadClave` debe existir en la colección Municipio |
| body | `localidadClave` | string | No | Regex `^\d{4}$`; debe pertenecer al `municipio` indicado (`400 BAD_REQUEST` si no) |
| body | `ciudad` | string | No | Opcional |
| body | `estado` | string | No | Opcional |
| body | `pais` | string | No | Opcional |
| body | `lat` | number/string | No | Opcional; `optional({ values: 'falsy' }).isFloat()` — `null`/`''`/`undefined` = "no tocar" la ubicación |
| body | `lng` | number/string | No | ídem `lat` |

> **Contrato de ubicación vigente:** `null`, `''` y `undefined` en `municipio`, `ciudad`, `estado`, `lat` y `lng` se interpretan como **"NO tocar la ubicación"**: `hayDatosUbicacion` (`controllers/posteos.js:409`) solo cuenta valores reales (`!== undefined && !== null && !== ''`). Una edición parcial de texto ya no reconstruye ni borra la ubicación existente. Si al menos un campo de ubicación viene con valor real, el objeto `ubicacion` se reconstruye completo (el cliente debe reenviar todos sus campos). **La eliminación de la ubicación ya NO se hace con `municipio: null` + `lat: null` (contrato deprecado)**; debe usarse el endpoint dedicado `DELETE /api/posteos/:id/ubicacion`.

#### Ejemplo de request
```http
PUT /api/posteos/64f...
Content-Type: application/json
credentials: include

{
  "texto": "Actualizando mi publicación",
  "posteo_publico": false
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Posteo actualizado correctamente",
  "data": {
    "posteo": {
      "_id": "64f...",
      "_idUsuario": { "_id": "64f...", "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" }, "imagen_perfil": { "public_id": "..." }, "url": "juan-perez-a3f12" },
      "texto": "Actualizando mi publicación",
      "posteo_publico": false,
      "fecha_actualizacion": "2026-08-20T12:00:00.000Z"
    }
  }
}
```

> La respuesta devuelve `_idUsuario` **poblado** con `{ _id, nombre_completo, imagen_perfil.public_id, url }` (`controllers/posteos.js:448`). `ubicacion.municipio` se devuelve como **ObjectId crudo** en todas las respuestas: se eliminó el `.populate('ubicacion.municipio', 'nombreMunicipio')`; el frontend debe resolver el nombre del municipio con su propio catálogo.

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js`, `middlewares/validar-origen.js` |
| 400 | `BAD_REQUEST` | Bad Request | `El municipio indicado no existe` / `La localidad no pertenece al municipio seleccionado` | `controllers/posteos.js:26` / `:31` — `resolverLocalidad` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` / errores de texto / clave INEGI inválida | `routes/posteos.js` + `middlewares/validar-campos.js` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: ... ha sido eliminado` / `... no existe` | `helpers/validar-id-posteo.js` |
| 403 | `FORBIDDEN` | Forbidden | `No tienes permiso para modificar este posteo.` | `controllers/posteos.js:452` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error al actualizar el posteo. Verifica los datos enviados.` | `controllers/posteos.js:467` |

---

### 7.6 `DELETE /api/posteos/:id/ubicacion`

**Descripción:** Elimina **solo** la ubicación de un posteo propio (el posteo y su imagen permanecen intactos). Endpoint dedicado para la intención explícita de quitar la ubicación; reemplaza el contrato anterior de borrado vía `municipio: null` + `lat: null` en el PUT (ahora deprecado).  
**Archivo de ruta:** `routes/posteos.js:117-125`  
**Controlador:** `controllers/posteos.js` — `posteoUbicacionDelete` (línea 496)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)
- Solo el dueño del posteo puede quitarle la ubicación.

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/posteos.js:119`)
2. `check('id').isMongoId()` (`routes/posteos.js:121`)
3. `validarCampos` (`routes/posteos.js:123`)
4. `validarIdPosteo` (`routes/posteos.js:124`)

Sin rate limiter específico (igual que `DELETE /api/posteos/:id`).

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido (`routes/posteos.js:121`) |

Sin body.

#### Ejemplo de request
```http
DELETE /api/posteos/64f.../ubicacion
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`
- El posteo se devuelve post-update (`returnDocument: 'after'`). **Idempotente:** si el posteo ya no tenía ubicación, responde igualmente `200` con `ubicacion: null`.

```json
{
  "success": true,
  "msg": "Ubicación eliminada correctamente",
  "data": {
    "posteo": {
      "_id": "64f...",
      "_idUsuario": { "_id": "64f...", "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" }, "imagen_perfil": { "public_id": "..." }, "url": "juan-perez-a3f12" },
      "public_id": "tlaxapp/posteos/64f.../uuid",
      "texto": "Hermosa tarde en Tlaxcala",
      "ubicacion": null,
      "fecha_creacion": "2026-08-20T12:00:00.000Z",
      "comentariosActivos": true
    }
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` | `routes/posteos.js:121` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: ... ha sido eliminado` / `... no existe` | `helpers/validar-id-posteo.js:9` / `:13` |
| 403 | `FORBIDDEN` | Forbidden | `No tienes permiso para modificar este posteo.` | `controllers/posteos.js:507` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error al eliminar la ubicación del posteo, contactar a soporte.` | `controllers/posteos.js:513` |

#### Notas para el Frontend
- Es el **único** mecanismo soportado para quitar la ubicación de un posteo: el PUT ya no borra la ubicación enviando `null`s.
- `_idUsuario` viene poblado con `{ _id, nombre_completo, imagen_perfil.public_id, url }` (populate en `controllers/posteos.js:504`).
- No computa flags de sesión (`likesCount`, `hasLiked`, `isFavorito`, `isFollowing`): solo se devuelve el documento del posteo actualizado.

---

### 7.7 `DELETE /api/posteos/:id`

**Descripción:** Elimina un posteo propio (soft delete).  
**Archivo de ruta:** `routes/posteos.js:127-135`  
**Controlador:** `controllers/posteos.js` — `posteosDelete` (línea 471)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)
- Solo el dueño del posteo puede eliminarlo.

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/posteos.js:129`)
2. `check('id').isMongoId()` (`routes/posteos.js:131`)
3. `validarCampos` (`routes/posteos.js:133`)
4. `validarIdPosteo` (`routes/posteos.js:134`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido (`routes/posteos.js:131`) |

#### Ejemplo de request
```http
DELETE /api/posteos/64f...
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Posteo con imagen eliminado correctamente"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` | `routes/posteos.js:131` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: ... ha sido eliminado` / `... no existe` | `helpers/validar-id-posteo.js:9` / `:13` |
| 403 | `FORBIDDEN` | Forbidden | `No tienes permiso para eliminar este posteo.` | `controllers/posteos.js:484` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error al eliminar el Posteo...` | `controllers/posteos.js:490` |

---

## 8. Recurso: Likes (`/api/likes`)

### 8.1 `POST /api/likes/:id/like`

**Descripción:** Da like a un posteo; si ya existe, lo elimina (toggle).  
**Archivo de ruta:** `routes/likes.js:11-19`  
**Controlador:** `controllers/likes.js` — `likeDislikePosteo` (línea 12)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/likes.js:13`)
2. `check('id').isMongoId()` (`routes/likes.js:15`)
3. `validarCampos` (`routes/likes.js:17`)
4. `validarIdPosteo` (`routes/likes.js:18`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido (`routes/likes.js:15`) |

#### Ejemplo de request
```http
POST /api/likes/64f.../like
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200` (like añadido) o `200` (like eliminado)

```json
{ "success": true, "msg": "Like añadido" }
```

```json
{ "success": true, "msg": "Like eliminado" }
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` | `routes/likes.js:15` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `Publicación no encontrada` / `El posteo con ID: ... ha sido eliminado` / `... no existe` | `controllers/likes.js:23`, `helpers/validar-id-posteo.js:9` / `:13` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al procesar el like` | `controllers/likes.js:43` |

---

### 8.2 `GET /api/likes/posteo/:id`

**Descripción:** Devuelve el número de likes de un posteo.  
**Archivo de ruta:** `routes/likes.js:21-29`  
**Controlador:** `controllers/likes.js` — `getLikesPosteos` (línea 47)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/likes.js:23`)
2. `check('id').isMongoId()` (`routes/likes.js:25`)
3. `validarCampos` (`routes/likes.js:27`)
4. `validarIdPosteo` (`routes/likes.js:28`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido (`routes/likes.js:25`) |

#### Ejemplo de request
```http
GET /api/likes/posteo/64f...
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": { "likes": 24, "posteo": "64f..." }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` | `routes/likes.js:25` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: ... ha sido eliminado` / `... no existe` | `helpers/validar-id-posteo.js:9` / `:13` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener el número de likes` | `controllers/likes.js:56` |

---

### 8.3 `GET /api/likes/:id/likes/usuarios`

**Descripción:** Devuelve la lista de usuarios que dieron like a un posteo.  
**Archivo de ruta:** `routes/likes.js:32-40`  
**Controlador:** `controllers/likes.js` — `getLikesUsuariosPosteos` (línea 60)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/likes.js:34`)
2. `check('id').isMongoId()` (`routes/likes.js:36`)
3. `validarCampos` (`routes/likes.js:38`)
4. `validarIdPosteo` (`routes/likes.js:39`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido (`routes/likes.js:36`) |

#### Ejemplo de request
```http
GET /api/likes/64f.../likes/usuarios
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Likes de usuarios a posteo obtenidos correctamente",
  "data": {
    "likes_usuarios_posteo": [
      {
        "_id": "64f...",
        "_idUsuario": {
          "_id": "64f...",
          "nombre_completo": { "nombre": "Ana", "apellido": "López" },
          "imagen_perfil": { "public_id": "...", "secure_url": "..." },
          "url": "ana-lopez-4d2e1"
        }
      }
    ]
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` | `routes/likes.js:36` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: ... ha sido eliminado` / `... no existe` | `helpers/validar-id-posteo.js:9` / `:13` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener los likes de usuarios` | `controllers/likes.js:75` |

---

## 9. Recurso: Followers (`/api/followers`)

### 9.1 `POST /api/followers/follow/:id`

**Descripción:** El usuario autenticado comienza a seguir a otro usuario.  
**Archivo de ruta:** `routes/followers.js:14-22`  
**Controlador:** `controllers/followers.js` — `followUsuario` (línea 10)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/followers.js:16`)
2. `check('id').isMongoId()` (`routes/followers.js:18`)
3. `validarCampos` (`routes/followers.js:20`)
4. `validarIdUsuario` (`routes/followers.js:21`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido (`routes/followers.js:18`) |

#### Ejemplo de request
```http
POST /api/followers/follow/64f...
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Has comenzado a seguir a este usuario"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` | `routes/followers.js:18` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID ... no existe en la BD` / `... no está activo` | `helpers/validar-id-usuario.js:10` / `:14` |
| 400 | `BAD_REQUEST` | Bad Request | `No puedes seguirte a ti mismo` | `controllers/followers.js:20` |
| 400 | `BAD_REQUEST` | Bad Request | `Ya sigues a este usuario` | `controllers/followers.js:37` |
| 404 | `NOT_FOUND` | Resource Not Found | `El usuario que intentas seguir no existe` | `controllers/followers.js:41` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error al seguir a un usuario` | `controllers/followers.js:109` |

#### Notas para el Frontend
- Crea una notificación persistente de tipo `follow` para el usuario seguido.
- Intenta enviar notificación push de forma asíncrona si el receptor tiene suscripciones activas; errores de push no afectan la respuesta.

---

### 9.2 `DELETE /api/followers/unfollow/:id`

**Descripción:** El usuario autenticado deja de seguir a otro usuario.  
**Archivo de ruta:** `routes/followers.js:25-33`  
**Controlador:** `controllers/followers.js` — `unfollowUsuario` (línea 113)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/followers.js:27`)
2. `check('id').isMongoId()` (`routes/followers.js:29`)
3. `validarCampos` (`routes/followers.js:31`)
4. `validarIdUsuario` (`routes/followers.js:32`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido (`routes/followers.js:29`) |

#### Ejemplo de request
```http
DELETE /api/followers/unfollow/64f...
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Dejaste de seguir a este usuario"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` | `routes/followers.js:29` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID ... no existe en la BD` / `... no está activo` | `helpers/validar-id-usuario.js:10` / `:14` |
| 400 | `BAD_REQUEST` | Bad Request | `No sigues a este usuario` | `controllers/followers.js:128` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un error al dejar de seguir a un usuario` | `controllers/followers.js:133` |

---

### 9.3 `GET /api/followers/usuario/lista-followers/:id`

**Descripción:** Lista los seguidores de un usuario.  
**Archivo de ruta:** `routes/followers.js:35-43`  
**Controlador:** `controllers/followers.js` — `obtenerFollowers` (línea 138)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/followers.js:37`)
2. `check('id').isMongoId()` (`routes/followers.js:39`)
3. `validarCampos` (`routes/followers.js:41`)
4. `validarIdUsuario` (`routes/followers.js:42`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido (`routes/followers.js:39`) |

#### Ejemplo de request
```http
GET /api/followers/usuario/lista-followers/64f...
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Seguidores obtenidos correctamente",
  "data": {
    "totalSeguidores": 2,
    "seguidores": [
      {
        "_id": "64f...",
        "follower": {
          "_id": "64f...",
          "nombre_completo": { "nombre": "Ana", "apellido": "López" },
          "imagen_perfil": { "public_id": "...", "secure_url": "..." },
          "url": "ana-lopez-4d2e1"
        },
        "isFollowing": false
      }
    ]
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` | `routes/followers.js:39` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID ... no existe en la BD` / `... no está activo` | `helpers/validar-id-usuario.js:10` / `:14` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener seguidores` | `controllers/followers.js:174` |

---

### 9.4 `GET /api/followers/usuario/lista-followings/:id`

**Descripción:** Lista los usuarios a los que sigue un usuario.  
**Archivo de ruta:** `routes/followers.js:45-53`  
**Controlador:** `controllers/followers.js` — `obtenerFollowings` (línea 178)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/followers.js:47`)
2. `check('id').isMongoId()` (`routes/followers.js:49`)
3. `validarCampos` (`routes/followers.js:51`)
4. `validarIdUsuario` (`routes/followers.js:52`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido (`routes/followers.js:49`) |

#### Ejemplo de request
```http
GET /api/followers/usuario/lista-followings/64f...
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Usuarios seguidos, obtenidos correctamente",
  "data": {
    "totalSeguidos": 2,
    "siguiendo": [
      {
        "_id": "64f...",
        "following": {
          "_id": "64f...",
          "nombre_completo": { "nombre": "Ana", "apellido": "López" },
          "imagen_perfil": { "public_id": "...", "secure_url": "..." },
          "url": "ana-lopez-4d2e1"
        },
        "isFollowing": true
      }
    ]
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID no es valido` | `routes/followers.js:49` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El ID ... no existe en la BD` / `... no está activo` | `helpers/validar-id-usuario.js:10` / `:14` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error en obtener followings` | `controllers/followers.js:252` |

---

## 10. Recurso: Favoritos (`/api/favoritos`)

### 10.1 `GET /api/favoritos`

**Descripción:** Lista los posteos favoritos del usuario autenticado, paginados.  
**Archivo de ruta:** `routes/favoritos.js:13-21`  
**Controlador:** `controllers/favoritos.js` — `obtenerFavoritosUsuario` (línea 10)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/favoritos.js:15`)
2. `check('page').optional().isNumeric()` (`routes/favoritos.js:17`)
3. `check('limite').optional().isNumeric()` (`routes/favoritos.js:18`)
4. `validarCampos` (`routes/favoritos.js:20`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | `page` | number | No | Opcional, numérico (`routes/favoritos.js:17`) |
| query | `limite` | number | No | Opcional, numérico (`routes/favoritos.js:18`) |

#### Ejemplo de request
```http
GET /api/favoritos?page=1&limite=15
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "createdAt": "2026-08-20T12:00:00.000Z",
      "posteoId": { "_id": "64f...", "public_id": "...", "posteo_publico": true },
      "autorId": { "_id": "64f...", "nombre_completo": {}, "url": "..." }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 10,
    "totalPages": 1,
    "next": null,
    "prev": null
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El parametro PAGE/LIMITE debe ser de tipo numerico` | `routes/favoritos.js:17-18` + `middlewares/validar-campos.js:23-28` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un problema al realizar la peticion...` | `controllers/favoritos.js:84` |

---

### 10.2 `POST /api/favoritos/:posteoId`

**Descripción:** Agrega un posteo a favoritos.  
**Archivo de ruta:** `routes/favoritos.js:24-35`  
**Controlador:** `controllers/favoritos.js` — `agregarPosteoFavorito` (línea 88)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/favoritos.js:26`)
2. `check('posteoId').isMongoId()` (`routes/favoritos.js:28`)
3. `check('autorId').isMongoId()` (`routes/favoritos.js:30`)
4. `validarCampos` (`routes/favoritos.js:32`)
5. `validarIdPosteo` (`routes/favoritos.js:33`)
6. `validarIdUsuario` (`routes/favoritos.js:34`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | string | Sí | MongoId válido (`routes/favoritos.js:28`) |
| body | `autorId` | string | Sí | MongoId válido (`routes/favoritos.js:30`) |

#### Ejemplo de request
```http
POST /api/favoritos/64f...
Content-Type: application/json
credentials: include

{
  "autorId": "64f..."
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Agregado en Favoritos"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El posteoId debe ser valido` / `El autorId es obligatorio` | `routes/favoritos.js:28-30` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: ... ha sido eliminado` / `... no existe` / `El ID ... no existe en la BD` | `helpers/validar-id-posteo.js:9` / `:13`, `helpers/validar-id-usuario.js:10` / `:14` |
| 400 | `BAD_REQUEST` | Bad Request | `No puedes agregar a favoritos tus propios posteos` | `controllers/favoritos.js:103` |
| 409 | `CONFLICT` | Conflict | `Este posteo ya está en tus favoritos` | `controllers/favoritos.js:120` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un problema al realizar la peticion...` | `controllers/favoritos.js:126` |

---

### 10.3 `DELETE /api/favoritos/:posteoId`

**Descripción:** Elimina un posteo de favoritos.  
**Archivo de ruta:** `routes/favoritos.js:38-46`  
**Controlador:** `controllers/favoritos.js` — `eliminarPosteoFavorito` (línea 131)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/favoritos.js:40`)
2. `check('posteoId').isMongoId()` (`routes/favoritos.js:42`)
3. `validarCampos` (`routes/favoritos.js:44`)
4. `validarIdPosteo` (`routes/favoritos.js:45`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | string | Sí | MongoId válido (`routes/favoritos.js:42`) |

#### Ejemplo de request
```http
DELETE /api/favoritos/64f...
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Eliminado de Favoritos"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El posteoId debe ser valido` | `routes/favoritos.js:42` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: ... ha sido eliminado` / `... no existe` / `El posteo con id ... no existe en favoritos` | `helpers/validar-id-posteo.js:9` / `:13`, `controllers/favoritos.js:141` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Hubo un problema al realizar la peticion...` | `controllers/favoritos.js:146` |

---

## 11. Recurso: Municipios (`/api/municipios`)

### 11.1 `GET /api/municipios`

**Descripción:** Devuelve la lista de municipios (sin geometría ni localidades).  
**Archivo de ruta:** `routes/municipios.js:7-9`  
**Controlador:** `controllers/municipios.js` — `obtenerMunicipios` (línea 8)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/municipios.js:8`)

#### Parámetros de entrada
Ninguno.

#### Ejemplo de request
```http
GET /api/municipios
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Municipios obtenidos correctamente",
  "data": {
    "municipios": [
      {
        "_id": "64f...",
        "claveEntidad": 29,
        "nombreEntidad": "Tlaxcala",
        "claveMunicipio": 1,
        "nombreMunicipio": "Tlaxcala",
        "codigoPostal": "90000"
      }
    ]
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener los municipios` | `controllers/municipios.js` — catch |

---

### 11.2 `GET /api/municipios/:claveMunicipio/localidades`

**Descripción:** Devuelve las localidades (catálogo INEGI) del municipio indicado por su clave numérica.  
**Archivo de ruta:** `routes/municipios.js:12-18`  
**Controlador:** `controllers/municipios.js` — `obtenerLocalidadesPorMunicipio`

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion`
2. `check('claveMunicipio')` — debe ser entero entre 1 y 60
3. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `claveMunicipio` | number | Sí | `isInt({ min: 1, max: 60 })` |

#### Ejemplo de request
```http
GET /api/municipios/34/localidades
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Localidades obtenidas correctamente",
  "data": {
    "municipio": "Ixtenco",
    "localidades": [
      {
        "clave": "0001",
        "nombre": "Ixtenco",
        "altitud": 2510,
        "location": { "type": "Point", "coordinates": [-97.895111, 19.251144] }
      },
      {
        "clave": "0024",
        "nombre": "Ranchería de Pilares",
        "altitud": 2560,
        "location": { "type": "Point", "coordinates": [-97.95275, 19.257866] }
      }
    ]
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Validation Error | Clave fuera de rango / no numérica | `middlewares/validar-campos.js` |
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js` |
| 404 | `NOT_FOUND` | Not Found | `Municipio no encontrado` | `controllers/municipios.js` — `obtenerLocalidadesPorMunicipio` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener las localidades` | `controllers/municipios.js` — catch |

---

## 12. Recurso: Notificaciones (`/api/notificaciones`)

### 12.1 `POST /api/notificaciones/subscribe`

**Descripción:** Registra una suscripción Web Push para el usuario autenticado.  
**Archivo de ruta:** `routes/notificaciones.js:16-19`  
**Controlador:** `controllers/notificaciones.js` — `subscribirNotificacionesWebPush` (línea 8)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/notificaciones.js:18`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `subscription` | object | Sí | Debe tener `endpoint`, `keys.p256dh`, `keys.auth` (`controllers/notificaciones.js:13-18`) |
| body | `subscription.endpoint` | string | Sí | URL del endpoint push |
| body | `subscription.keys.p256dh` | string | Sí | Clave p256dh |
| body | `subscription.keys.auth` | string | Sí | Clave auth |
| body | `userAgent` | string | No | Opcional; si no se envía, se usa `User-Agent` del header (`controllers/notificaciones.js:48`) |

#### Ejemplo de request
```http
POST /api/notificaciones/subscribe
Content-Type: application/json
credentials: include

{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BNc...",
      "auth": "..."
    }
  },
  "userAgent": "Mozilla/5.0..."
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Suscripción registrada correctamente"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 400 | `BAD_REQUEST` | Bad Request | `Suscripción inválida` | `controllers/notificaciones.js:19` |
| 404 | `NOT_FOUND` | Resource Not Found | `Usuario no encontrado` | `controllers/notificaciones.js:25` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al guardar suscripción` | `controllers/notificaciones.js:63` |

#### Notas para el Frontend
- Límite de 10 suscripciones por usuario; si se excede, se elimina la más antigua (`controllers/notificaciones.js:37-44`).

---

### 12.2 `POST /api/notificaciones/unsubscribe`

**Descripción:** Elimina una suscripción Web Push por endpoint.  
**Archivo de ruta:** `routes/notificaciones.js:21-24`  
**Controlador:** `controllers/notificaciones.js` — `unsubscribeNotificacionesWebPush` (línea 67)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/notificaciones.js:23`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `endpoint` | string | Sí | No vacío (`controllers/notificaciones.js:72-74`) |

#### Ejemplo de request
```http
POST /api/notificaciones/unsubscribe
Content-Type: application/json
credentials: include

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Suscripción eliminada correctamente"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 400 | `BAD_REQUEST` | Bad Request | `Falta el endpoint de la suscripción` | `controllers/notificaciones.js:73` |
| 404 | `NOT_FOUND` | Resource Not Found | `Usuario no encontrado` | `controllers/notificaciones.js:85` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al desactivar notificaciones` | `controllers/notificaciones.js:96` |

---

### 12.3 `GET /api/notificaciones/vapidPublicKey`

**Descripción:** Devuelve la clave pública VAPID para suscribirse a Web Push.  
**Archivo de ruta:** `routes/notificaciones.js:27-30`  
**Controlador:** `controllers/notificaciones.js` — `getVapidPublicKey` (línea 100)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/notificaciones.js:29`)

#### Parámetros de entrada
Ninguno.

#### Ejemplo de request
```http
GET /api/notificaciones/vapidPublicKey
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": { "key": "BPe..." }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Falta la clave pública VAPID` / `Error al obtener la clave VAPID` | `controllers/notificaciones.js:104` / `:108` |

---

### 12.4 `GET /api/notificaciones`

**Descripción:** Lista las notificaciones del usuario autenticado.  
**Archivo de ruta:** `routes/notificaciones.js:32-35`  
**Controlador:** `controllers/notificaciones.js` — `obtenerNotificaciones` (línea 113)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/notificaciones.js:34`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | `page` | number | No | Default 1 (`controllers/notificaciones.js:116`) |
| query | `limit` | number | No | Default 20 (`controllers/notificaciones.js:117`) |

#### Ejemplo de request
```http
GET /api/notificaciones?page=1&limit=20
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "tipo": "follow",
      "mensaje": "comenzó a seguirte",
      "leida": false,
      "notificacion_leida": false,
      "createdAt": "2026-08-20T12:00:00.000Z",
      "emisor": { "_id": "64f...", "nombre_completo": {}, "imagen_perfil": {}, "url": "..." },
      "referencia": { "_id": "64f...", "public_id": "...", "texto": "..." }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "next": null,
    "prev": null
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener notificaciones` | `controllers/notificaciones.js:188` |

#### Notas para el Frontend
- El parámetro real que usa el controlador es `limit` (no `limite`).

---

### 12.5 `PATCH /api/notificaciones/marcar-notificacion-leida/:id`

**Descripción:** Marca una notificación como leída.  
**Archivo de ruta:** `routes/notificaciones.js:37-44`  
**Controlador:** `controllers/notificaciones.js` — `marcarNotificacionLeida` (línea 192)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/notificaciones.js:39`)
2. `check('id').isMongoId()` (`routes/notificaciones.js:41`)
3. `validarCampos` (`routes/notificaciones.js:43`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido (`routes/notificaciones.js:41`) |

#### Ejemplo de request
```http
PATCH /api/notificaciones/marcar-notificacion-leida/64f...
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Notificación marcada como leída"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El id de la notificación es obligatorio` | `routes/notificaciones.js:41` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `Notificación no encontrada` | `controllers/notificaciones.js:215` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al marcar notificación como leída` | `controllers/notificaciones.js:221` |

---

### 12.6 `GET /api/notificaciones/nuevas-notificaciones`

**Descripción:** Devuelve el total de notificaciones no leídas del usuario autenticado.  
**Archivo de ruta:** `routes/notificaciones.js:46-49`  
**Controlador:** `controllers/notificaciones.js` — `obtenerTotalNotificacionesNoLeidas` (línea 227)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/notificaciones.js:48`)

#### Parámetros de entrada
Ninguno.

#### Ejemplo de request
```http
GET /api/notificaciones/nuevas-notificaciones
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": { "totalNoLeidas": 3 }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener notificaciones no leídas` | `controllers/notificaciones.js:243` |

---

### 12.7 `DELETE /api/notificaciones/eliminar-notificacion/:id`

**Descripción:** Elimina una notificación del usuario autenticado.  
**Archivo de ruta:** `routes/notificaciones.js:51-60`  
**Controlador:** `controllers/notificaciones.js` — `eliminarNotificacion` (línea 247)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/notificaciones.js:53`)
2. `check('id').notEmpty()` (`routes/notificaciones.js:55`)
3. `check('id').isMongoId()` (`routes/notificaciones.js:57`)
4. `validarCampos` (`routes/notificaciones.js:59`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | string | Sí | MongoId válido (`routes/notificaciones.js:55-57`) |

#### Ejemplo de request
```http
DELETE /api/notificaciones/eliminar-notificacion/64f...
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Notificación eliminada correctamente"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El id de la notificación es obligatorio` / `El id debe ser un MongoId valido` | `routes/notificaciones.js:55-57` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `Notificación no encontrada` | `controllers/notificaciones.js:261` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al eliminar la notificación` | `controllers/notificaciones.js:267` |

---

## 13. Recurso: Ubicación (`/api/ubicacion`)

### 13.1 `POST /api/ubicacion/reverse`

**Descripción:** Obtiene el municipio correspondiente a unas coordenadas GPS (reverse geocoding) junto con su localidad más cercana.  
**Archivo de ruta:** `routes/ubicacion.js:10-18`  
**Controlador:** `controllers/ubicacion.js` — `obtenerMunicipioPorCoords` (línea 47)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/ubicacion.js:12`)
2. `check('lat').isFloat().notEmpty()` (`routes/ubicacion.js:14`)
3. `check('lng').isFloat().notEmpty()` (`routes/ubicacion.js:15`)
4. `validarCampos` (`routes/ubicacion.js:17`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `lat` | number/string | Sí | Float no vacío (`routes/ubicacion.js:14`) |
| body | `lng` | number/string | Sí | Float no vacío (`routes/ubicacion.js:15`) |

#### Ejemplo de request
```http
POST /api/ubicacion/reverse
Content-Type: application/json
credentials: include

{
  "lat": 19.3189,
  "lng": -98.2376
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": {
    "municipio": {
      "_id": "64f...",
      "claveEntidad": 29,
      "nombreEntidad": "Tlaxcala",
      "claveMunicipio": 33,
      "nombreMunicipio": "Tlaxcala"
    },
    "localidad_cercana": {
      "clave": "0001",
      "nombre": "Tlaxcala (cabecera)",
      "distancia_metros": 245
    },
    "metodo": "database_geo_intersect",
    "precision": "exacta"
  }
}
```

> `localidad_cercana` es `null` si el municipio no tiene localidades con coordenadas válidas. El cálculo usa haversine sobre las localidades embebidas del municipio (`controllers/ubicacion.js`).

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `La latitud es obligatoria y debe ser un número` / `La longitud es obligatoria y debe ser un número` | `routes/ubicacion.js:14-15` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `Ubicación fuera de la zona de cobertura (Tlaxcala)` | `controllers/ubicacion.js:49` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error interno al obtener la ubicación` | `controllers/ubicacion.js:62` |

#### Notas para el Frontend
- Si no hay intersección exacta, intenta una búsqueda por cercanía de 100m (`controllers/ubicacion.js`).
- `localidad_cercana` permite mostrar ubicaciones tipo "Ixtenco, Ranchería de Pilares" sin una segunda consulta.

---

### 13.2 `GET /api/ubicacion`

**Descripción:** Alias de `GET /api/municipios`. Devuelve la lista de municipios.  
**Archivo de ruta:** `routes/ubicacion.js:20-23`  
**Controlador:** `controllers/municipios.js` — `obtenerMunicipios` (línea 7)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/ubicacion.js:22`)

#### Parámetros de entrada
Ninguno.

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Municipios obtenidos correctamente",
  "data": { "municipios": [ { "_id": "...", "nombreMunicipio": "..." } ] }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener los municipios` | `controllers/municipios.js:21` |

---

## 14. Recurso: Soporte (`/api/ayuda-soporte`)

### 14.1 `POST /api/ayuda-soporte/envio-correo`

**Descripción:** Envía una solicitud de ayuda/soporte por correo.  
**Archivo de ruta:** `routes/soporte.js:9-18`  
**Controlador:** `controllers/soporte.js` — `ayudaSoporteEnvioCorrreo` (línea 23)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `soporteLimiter` (`routes/soporte.js:9`)
2. `verificarTokenSesion` (`routes/soporte.js:11`)
3. `check('tipo_problema').notEmpty().isIn([...])` (`routes/soporte.js:13`)
4. `check('descripcion_problema_usuario').notEmpty().isString().trim().isLength({ min: 15, max: 1000 })` (`routes/soporte.js:15`)
5. `validarCampos` (`routes/soporte.js:17`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `tipo_problema` | string | Sí | `isIn(["cuenta", "publicacion", "seguridad", "reporte", "otro"])` (`routes/soporte.js:13`) |
| body | `descripcion_problema_usuario` | string | Sí | String, trim, 15-1000 chars (`routes/soporte.js:15`) |

#### Ejemplo de request
```http
POST /api/ayuda-soporte/envio-correo
Content-Type: application/json
credentials: include

{
  "tipo_problema": "cuenta",
  "descripcion_problema_usuario": "No puedo iniciar sesión después de cambiar mi correo."
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Solicitud de soporte recibida correctamente",
  "data": { "ticketId": "TLX-1690000000000" }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El tipo_problema es obligatorio: [...]` / `La descripcion_problema_usuario es obligatoria: minimo 10 caracteres, maximo 1000` | `routes/soporte.js:13-15` + `middlewares/validar-campos.js:23-28` |
| 400 | `BAD_REQUEST` | Bad Request | `Tipo de problema no válido` | `controllers/soporte.js:30` |
| 404 | `NOT_FOUND` | Resource Not Found | `Usuario no encontrado` | `controllers/soporte.js:36` |
| 429 | `SOPORTE_BLOCKED` | Rate Limit Exceeded | `Demasiados tickets de soporte, intenta de nuevo más tarde` | `middlewares/rate-limiter.js:116-128` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error en el servidor` | `controllers/soporte.js:66` |

#### Notas para el Frontend
- El envío de correo de confirmación al usuario se intenta de forma asíncrona y no bloquea la respuesta (`controllers/soporte.js:54-58`).

---

## 15. Recurso: Comentarios (`/api/comentarios`)

### 15.1 `POST /api/comentarios/:posteoId/comentarios`

**Descripción:** Agrega un comentario a un posteo.  
**Archivo de ruta:** `routes/comentarios.js:16-23`  
**Controlador:** `controllers/comentarios.js` — `agregarComentario` (línea 11)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `comentarioLimiter` (`routes/comentarios.js:16`)
2. `verificarTokenSesion` (`routes/comentarios.js:17`)
3. `check('posteoId').isMongoId()` (`routes/comentarios.js:18`)
4. `check('texto').optional().notEmpty()` (`routes/comentarios.js:19`)
5. `check('texto').isLength({ max: 250 })` (`routes/comentarios.js:20`)
6. `validarCampos` (`routes/comentarios.js:21`)
7. `validarIdPosteo` (`routes/comentarios.js:22`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | string | Sí | MongoId válido (`routes/comentarios.js:18`) |
| body | `texto` | string | Sí* | Máximo 250 caracteres (`routes/comentarios.js:19-20`). *Nota: la validación de ruta lo marca como opcional, pero el schema de Mongoose lo requiere.* |

#### Ejemplo de request
```http
POST /api/comentarios/64f.../comentarios
Content-Type: application/json
credentials: include

{
  "texto": "¡Qué bonita foto!"
}
```

#### Ejemplo de response — éxito
- Código de estado: `201`

```json
{
  "success": true,
  "msg": "Comentario agregado",
  "data": {
    "comentario": {
      "_id": "64f...",
      "texto": "¡Qué bonita foto!",
      "posteoId": "64f...",
      "autorId": "64f...",
      "createdAt": "2026-08-20T12:00:00.000Z"
    }
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID del posteo no es válido` / `El texto es obligatorio` / `El comentario no puede exceder 250 caracteres` | `routes/comentarios.js:18-20` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo no existe` / `El posteo ha sido eliminado` | `controllers/comentarios.js:22` / `:26` |
| 403 | `FORBIDDEN` | Forbidden | `Los comentarios están desactivados en este posteo` | `controllers/comentarios.js:30` |
| 429 | `COMENTARIO_BLOCKED` | Rate Limit Exceeded | `Demasiados comentarios, intenta de nuevo más tarde` | `middlewares/rate-limiter.js:146-158` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al agregar comentario` | `controllers/comentarios.js:115` |

#### Notas para el Frontend
- Crea notificación persistente y push para el autor del posteo (si no es el mismo que comenta).
- Si es el primer comentario, envía un correo al autor del posteo (`controllers/comentarios.js:100-109`).

---

### 15.2 `GET /api/comentarios/:posteoId/comentarios`

**Descripción:** Lista los comentarios de un posteo con paginación.  
**Archivo de ruta:** `routes/comentarios.js:25-32`  
**Controlador:** `controllers/comentarios.js` — `obtenerComentarios` (línea 119)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/comentarios.js:26`)
2. `check('posteoId').isMongoId()` (`routes/comentarios.js:27`)
3. `check('page').optional().isNumeric()` (`routes/comentarios.js:28`)
4. `check('limite').optional().isNumeric()` (`routes/comentarios.js:29`)
5. `validarCampos` (`routes/comentarios.js:30`)
6. `validarIdPosteo` (`routes/comentarios.js:31`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | string | Sí | MongoId válido (`routes/comentarios.js:27`) |
| query | `page` | number | No | Opcional, numérico (`routes/comentarios.js:28`) |
| query | `limite` | number | No | Validado pero **ignorado**; el controlador usa `limit` (`controllers/comentarios.js:123`) |

#### Ejemplo de request
```http
GET /api/comentarios/64f.../comentarios?page=1&limit=10
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": [
    {
      "texto": "¡Qué bonita foto!",
      "createdAt": "2026-08-20T12:00:00.000Z",
      "autorId": { "_id": "64f...", "nombre_completo": {}, "imagen_perfil": {}, "url": "..." }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "next": null,
    "prev": null
  }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID del posteo no es válido` / `La página debe ser numérica` / `El límite debe ser numérico` | `routes/comentarios.js:27-29` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: ... ha sido eliminado` / `... no existe` | `helpers/validar-id-posteo.js:9` / `:13` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener comentarios` | `controllers/comentarios.js:181` |

#### Notas para el Frontend
- El parámetro real de paginación es `limit`, aunque la ruta valida `limite`.

---

### 15.3 `GET /api/comentarios/:posteoId/comentarios/count`

**Descripción:** Devuelve el contador de comentarios de un posteo.  
**Archivo de ruta:** `routes/comentarios.js:34-39`  
**Controlador:** `controllers/comentarios.js` — `obtenerCountComentarios` (línea 185)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/comentarios.js:35`)
2. `check('posteoId').isMongoId()` (`routes/comentarios.js:36`)
3. `validarCampos` (`routes/comentarios.js:37`)
4. `validarIdPosteo` (`routes/comentarios.js:38`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | string | Sí | MongoId válido (`routes/comentarios.js:36`) |

#### Ejemplo de request
```http
GET /api/comentarios/64f.../comentarios/count
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "data": { "count": 5 }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión | `middlewares/validar-jwt-cookies-sesion.js:14-45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID del posteo no es válido` | `routes/comentarios.js:36` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo no existe` | `controllers/comentarios.js:196` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al obtener contador` | `controllers/comentarios.js:204` |

---

### 15.4 `DELETE /api/comentarios/:comentarioId`

**Descripción:** Elimina un comentario (soft delete). Puede hacerlo el autor del comentario o el dueño del posteo.  
**Archivo de ruta:** `routes/comentarios.js:41-45`  
**Controlador:** `controllers/comentarios.js` — `eliminarComentario` (línea 208)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/comentarios.js:42`)
2. `check('comentarioId').isMongoId()` (`routes/comentarios.js:43`)
3. `validarCampos` (`routes/comentarios.js:44`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `comentarioId` | string | Sí | MongoId válido (`routes/comentarios.js:43`) |

#### Ejemplo de request
```http
DELETE /api/comentarios/64f...
credentials: include
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Comentario eliminado"
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID del comentario no es válido` | `routes/comentarios.js:43` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El comentario no existe` | `controllers/comentarios.js:225` |
| 400 | `BAD_REQUEST` | Bad Request | `El comentario ya fue eliminado` | `controllers/comentarios.js:224` / `:266` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo asociado no existe` | `controllers/comentarios.js:233` |
| 403 | `FORBIDDEN` | Forbidden | `No tienes permisos para eliminar este comentario` | `controllers/comentarios.js:241` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al eliminar comentario` | `controllers/comentarios.js:273` |

---

### 15.5 `PUT /api/comentarios/:posteoId/comentarios/toggle`

**Descripción:** Activa o desactiva los comentarios de un posteo propio.  
**Archivo de ruta:** `routes/comentarios.js:47-53`  
**Controlador:** `controllers/comentarios.js` — `toggleComentariosPosteo` (línea 277)

#### Autenticación y permisos
- Requiere token: **Sí** (`accessToken` cookie)
- Solo el dueño del posteo.

#### Middlewares (en orden)
1. `verificarTokenSesion` (`routes/comentarios.js:48`)
2. `check('posteoId').isMongoId()` (`routes/comentarios.js:49`)
3. `check('activar').isBoolean({ strict: true })` (`routes/comentarios.js:50`)
4. `validarCampos` (`routes/comentarios.js:51`)
5. `validarIdPosteo` (`routes/comentarios.js:52`)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | string | Sí | MongoId válido (`routes/comentarios.js:49`) |
| body | `activar` | boolean | Sí | Booleano estricto (`routes/comentarios.js:50`) |

#### Ejemplo de request
```http
PUT /api/comentarios/64f.../comentarios/toggle
Content-Type: application/json
credentials: include

{
  "activar": false
}
```

#### Ejemplo de response — éxito
- Código de estado: `200`

```json
{
  "success": true,
  "msg": "Comentarios desactivados",
  "data": { "comentariosActivos": false }
}
```

#### Códigos de error posibles

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401/403 | Varios | Varios | Errores de token/sesión/origen | `middlewares/validar-jwt-cookies-sesion.js:14-45`, `middlewares/validar-origen.js:39-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `El ID del posteo no es válido` / `El campo activar debe ser un booleano` | `routes/comentarios.js:49-50` + `middlewares/validar-campos.js:23-28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo no existe` | `controllers/comentarios.js:293` |
| 403 | `FORBIDDEN` | Forbidden | `Solo el dueño del posteo puede modificar los comentarios` | `controllers/comentarios.js:292` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `Error al modificar comentarios` | `controllers/comentarios.js:303` |

---

## 16. Notas especiales para el Frontend

- **Cookies:** todas las peticiones autenticadas deben enviarse con `credentials: 'include'` (fetch) o `withCredentials: true` (axios). Las cookies son `httpOnly`, `secure`, `sameSite: 'none'`.
- **CSRF:** los métodos mutantes (`POST`, `PUT`, `PATCH`, `DELETE`) requieren un `Origin` o `Referer` válido en producción. Configurar `FRONTEND_URL` y, si aplica, `CSRF_ALLOWED_ORIGINS` en el backend.
- **Refresh token rotation:** cada llamada a `POST /api/auth/refresh` emite nuevas cookies `accessToken` y `refreshToken`; el antiguo refresh queda invalidado. Detectar reuso invalida todas las sesiones.
- **Path-to-regexp v8:** las rutas con parámetros opcionales usan `{/:param}` (ej. `/api/auth/verificar-correo{/:token}`). El frontend puede llamarlas con o sin el segmento final, pero los middlewares suelen exigir el token.
- **Slugs de usuario:** la `url` se genera automáticamente y es inmutable directamente. El único cambio permitido es indirecto al actualizar `nombre_completo` con cooldown de 30 días.
- **Imágenes:** se suben tal cual a Cloudinary (sin compresión ni re-encoding). El frontend debe construir transformaciones al vuelo usando el `public_id`. El avatar por defecto (`DEFAULT_USER_IMAGE`) se entrega directo como `secure_url`.
- **Errores 429:** hay dos familias: los rate limiters directos (`LOGIN_BLOCKED`, `POSTEO_BLOCKED`, etc.) sin `retry_after`, y los `RateLimitError` lanzados por controladores (`RATE_LIMIT_EXCEEDED`) que sí incluyen `retry_after`.
- **Mensajes de error:** todos los errores devuelven `code` en mayúsculas (`UNAUTHORIZED`, `VALIDATION_FAILED`, etc.). El frontend debe comparar contra estos valores.
- **Notas de verificación manual:** el comportamiento real de envío de correos, subida a Cloudinary y geolocalización depende de variables de entorno y datos sembrados.
- **Posteos — escrituras vs. lecturas:** las respuestas de escritura (`POST /api/posteos`, `PUT /api/posteos/:id`, `DELETE /api/posteos/:id/ubicacion`) devuelven `_idUsuario` poblado (`{ _id, nombre_completo, imagen_perfil.public_id, url }`) y `ubicacion.municipio` como ObjectId crudo (sin populate). Los flags de sesión (`likesCount`, `hasLiked`, `isFavorito`, `isFollowing`) NO se computan en escrituras (solo en GETs con sesión); `comentariosCount` sí viene autoritativo (se lee del documento).

---

**Fin de la documentación de referencia de la API TlaxApp.**



