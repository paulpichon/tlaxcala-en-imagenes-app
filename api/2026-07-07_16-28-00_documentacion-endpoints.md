# Documentación de la API — TlaxApp

**Versión:** 1.0.0  
**Última actualización:** 2026-07-08  
**Base URL (desarrollo):** `http://localhost:3000`  
**Base URL (producción):** Determinada por `FRONTEND_URL` en variables de entorno

---

## Índice

1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Formato de respuestas](#formato-de-respuestas)
4. [Rate Limiting](#rate-limiting)
5. [Endpoints por recurso](#endpoints-por-recurso)
   - [Bienvenida y Salud](#bienvenida-y-salud)
   - [Auth (Autenticación)](#auth-autenticación)
   - [Usuarios](#usuarios)
   - [Posteos (Publicaciones)](#posteos-publicaciones)
   - [Likes](#likes)
   - [Comentarios](#comentarios)
   - [Followers (Seguidores)](#followers-seguidores)
   - [Favoritos](#favoritos)
   - [Uploads (Imágenes de Perfil)](#uploads-imágenes-de-perfil)
   - [Notificaciones Web Push](#notificaciones-web-push)
   - [Municipios](#municipios)
   - [Ubicación (Geolocalización)](#ubicación-geolocalización)
   - [Soporte / Ayuda](#soporte--ayuda)
6. [Middlewares](#middlewares)
7. [Modelos de datos (esquemas)](#modelos-de-datos-esquemas)

---

## Introducción

TlaxApp API es un backend Node.js/Express v5 con MongoDB (Mongoose v9) que proporciona servicios para una red social local enfocada en el estado de Tlaxcala, México.

**Características principales:**
- Autenticación dual JWT (access token + refresh token) con cookies httpOnly
- Subida de imágenes a Cloudinary
- Notificaciones Web Push (VAPID)
- Rate limiting por endpoint
- Soft delete con eliminación física diferida (cron jobs)
- Geolocalización con datos geoespaciales de municipios

---

## Autenticación

### Esquema de Tokens

| Token | Duración | Almacenamiento | Propósito |
|-------|----------|----------------|-----------|
| `accessToken` | 1 hora | Cookie httpOnly (`accessToken`) | Autenticar peticiones |
| `refreshToken` | 7 días | Cookie httpOnly (`refreshToken`) + BD (hasheado SHA-256) | Renovar access token |

### Cookies de Sesión

```http
Set-Cookie: accessToken=<jwt>; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=3600
Set-Cookie: refreshToken=<jwt>; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=604800
```

- `Secure: true` → Solo se envían por HTTPS (no en localhost sin SSL)
- `SameSite: 'none'` → Permitir cross-origin (frontend separado)
- `httpOnly: true` → No accesible desde JavaScript del navegador

### Flujo de Autenticación

1. **Registro** → `POST /api/usuarios` → Se envía correo de verificación
2. **Verificar correo** → `GET /api/auth/verificar-correo/:token`
3. **Login** → `POST /api/auth/login` → Se establecen cookies `accessToken` y `refreshToken`
4. **Peticiones autenticadas** → La cookie `accessToken` se envía automáticamente
5. **Renovar token** → `POST /api/auth/refresh` (usa `refreshToken` de cookie)
6. **Logout** → `POST /api/auth/logout` → Elimina cookies y refresh token de BD

### Seguridad Adicional

- **tokenVersion**: Almacenada en el usuario. Si se detecta reuso de refresh token (posible robo), se incrementa `tokenVersion` invalidando TODAS las sesiones.
- **Refresh token hasheado**: El refresh token se almacena hasheado (SHA-256) en la colección `UserToken`.
- **TTL automático**: Los documentos en `UserToken` expiran a los 30 días automáticamente (TTL index).

---

## Formato de Respuestas

### Respuesta Exitosa (Genérica)

```json
{
  "status": 200,
  "msg": "Mensaje descriptivo",
  ...datos específicos del endpoint
}
```

### Respuesta de Error (Genérica)

```json
{
  "status": 4XX o 5XX,
  "msg": "Descripción del error"
}
```

### Errores de Validación (express-validator)

```json
{
  "status": 400,
  "errores": [
    {
      "value": "...",
      "msg": "El correo es obligatorio",
      "param": "correo",
      "location": "body"
    }
  ]
}
```

### Error de Rate Limiting

```json
{
  "ok": false,
  "status": 429,
  "msg": "Demasiados intentos de inicio de sesión, tu cuenta está temporalmente bloqueada por 15 minutos",
  "code": "LOGIN_BLOCKED"
}
```

### Error de Autenticación

```json
{
  "msg": "No hay token en la peticion"
}
```

### Error de Servidor (desarrollo)

```json
{
  "status": 500,
  "msg": "Error interno del servidor",
  "error": "mensaje de error detallado (solo en desarrollo)"
}
```

---

## Rate Limiting

La API implementa 9 rate limiters distintos, definidos en `middlewares/rate-limiter.js`:

| Limiter | Ventana | Máximo | Código de error | Endpoints protegidos |
|---------|---------|--------|-----------------|----------------------|
| `loginLimiter` | 15 min | 5 | `LOGIN_BLOCKED` | `POST /api/auth/login` |
| `recoveryLimiter` | 15 min | 3 | `RECOVERY_BLOCKED` | `POST /api/auth/cuentas/password-olvidado`, `POST /api/auth/reenviar-correo-restablecer-password` |
| `reenvioCorreoLimiter` | 5 min | 3 | `EMAIL_BLOCKED` | `POST /api/auth/reenviar-correo` |
| `registroLimiter` | 1 hora | 3 | `REGISTER_BLOCKED` | `POST /api/usuarios` |
| `posteoLimiter` | 15 min | 20 | `POSTEO_BLOCKED` | `POST /api/posteos` |
| `soporteLimiter` | 15 min | 5 | `SOPORTE_BLOCKED` | `POST /api/ayuda-soporte/envio-correo` |
| `lecturaLimiter` | 15 min | 100 | `READ_BLOCKED` | `GET /api/usuarios`, `GET /api/posteos` |
| `comentarioLimiter` | 1 min | 10 | `COMENTARIO_BLOCKED` | `POST /api/comentarios/:posteoId/comentarios` |
| `refreshLimiter` | 15 min | 10 | `REFRESH_BLOCKED` | `POST /api/auth/refresh` |

**Nota:** El `loginLimiter` usa clave compuesta `IP + correo` para evitar que un atacante bloquee la cuenta de otro usuario desde una IP diferente.

---

## Endpoints por recurso

---

## Bienvenida y Salud

### `GET /`

**Descripción:** Mensaje de bienvenida a la API. No requiere autenticación.  
**Archivo de ruta:** `routes/bienvenida.js:6`  
**Controlador:** `controllers/bienvenida.js:6` — `getBienvenida`

#### Autenticación y permisos
- Requiere token: **No**

#### Respuesta exitosa — `200 OK`

```json
{
  "name": "TlaxApp API",
  "status": "online",
  "auth": "required",
  "message": "Esta API requiere autenticación."
}
```

---

### `GET /api/health`

**Descripción:** Health check de la API. Muestra estado del servidor, memoria, uptime y conexión a MongoDB.  
**Archivo de ruta:** `routes/bienvenida.js:7`  
**Controlador:** `controllers/bienvenida.js:16` — `getHealth`

#### Autenticación y permisos
- Requiere token: **No**

#### Respuesta exitosa — `200 OK`

```json
{
  "status": "ok",
  "uptime": 12345.67,
  "timestamp": "2026-07-08T12:00:00.000Z",
  "service": "TlaxApp API",
  "version": "1.0.0",
  "environment": "development",
  "memory": {
    "rss": 12345678,
    "heapTotal": 9876543,
    "heapUsed": 4567890,
    "external": 123456
  },
  "heapUsedPercentage": "46.23%",
  "pid": 12345,
  "db": {
    "status": "connected"
  }
}
```

---

## Auth (Autenticación)

Base path: **`/api/auth`**  
Archivo de ruta: `routes/auth.js`  
Controlador: `controllers/auth.js`

---

### `GET /api/auth/verificar-correo{/:token}`

**Descripción:** Verifica la cuenta de usuario mediante el token enviado por correo electrónico. El `:token` es opcional en la ruta (Express 5: `{/:token}`).  
**Archivo de ruta:** `routes/auth.js:26`  
**Controlador:** `controllers/auth.js:21` — `verificarCorreo`

#### Autenticación y permisos
- Requiere token: **No** (el token va en la URL)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación |
|-----------|-------|------|-----------|------------|
| `params` | `token` | `string` (JWT) | Sí | `isJWT` con `EMAIL_VERIFICATION_SECRET` y algoritmo `HS256` |

#### Middlewares en orden
1. `validarTokenEnURL` — Verifica que `token` exista en `req.params`
2. `check('token').isJWT(...)` — Valida que sea un JWT válido firmado con `EMAIL_VERIFICATION_SECRET`
3. `validarCampos` — Procesa errores de validación

#### Respuesta exitosa — `200 OK`

```json
{
  "ok": true,
  "msg": "Correo verificado"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Token no proporcionado en la URL |
| `401` | Token inválido o expirado |

---

### `POST /api/auth/reenviar-correo`

**Descripción:** Reenvía el correo de verificación de cuenta al usuario registrado.  
**Archivo de ruta:** `routes/auth.js:32`  
**Controlador:** `controllers/auth.js:40` — `reenviarCorreoVerificacion`

#### Autenticación y permisos
- Requiere token: **No** (pero requiere un token de verificación previo en el body)
- Rate limit: `reenvioCorreoLimiter` — 3 intentos cada 5 minutos

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación |
|-----------|-------|------|-----------|------------|
| `body` | `token` | `string` (JWT) | Sí | `isJWT` con `EMAIL_VERIFICATION_SECRET` y algoritmo `HS256` |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Correo reenviado a usuario@correo.com"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `401` | Correo no existe en BD |
| `403` | Cuenta ya verificada |
| `429` | Espera 5 minutos antes de reenviar (cooldown activo) |

#### Notas
- Tiene un cooldown de 5 minutos por usuario (`ultimo_correo_enviado`).
- Genera un nuevo token de verificación y lo guarda en la BD.

---

### `POST /api/auth/login`

**Descripción:** Inicio de sesión de usuarios. Valida credenciales y establece cookies de sesión.  
**Archivo de ruta:** `routes/auth.js:37`  
**Controlador:** `controllers/auth.js:107` — `login`

#### Autenticación y permisos
- Requiere token: **No**
- Rate limit: `loginLimiter` — 5 intentos cada 15 minutos (clave: IP + correo)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación |
|-----------|-------|------|-----------|------------|
| `body` | `correo` | `string` (email) | Sí | `isEmail()` |
| `body` | `password` | `string` | Sí | `trim().notEmpty()` |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "usuario": {
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": {
      "claveEntidad": 29,
      "nombreEntidad": "Tlaxcala"
    },
    "correo": "usuario@correo.com",
    "imagen_perfil": {
      "secure_url": "https://res.cloudinary.com/...",
      "public_id": "tlx-imagenes/..."
    },
    "genero": "MASCULINO",
    "fecha_nacimiento": "1990-01-15T00:00:00.000Z",
    "fecha_actualizacion": null,
    "url": "juan-perez",
    "uid": "60d5f484f8a2c8a1d4e8e4a1",
    "_id": "60d5f484f8a2c8a1d4e8e4a1"
  },
  "msg": "Login exitoso"
}
```

#### Cookies establecidas

| Cookie | Valor | Duración |
|--------|-------|----------|
| `accessToken` | JWT | 1 hora |
| `refreshToken` | JWT | 7 días |

#### Códigos de error

| Código | Causa |
|--------|-------|
| `401` | Credenciales inválidas (correo no existe o contraseña incorrecta) |
| `403` | Cuenta no verificada (email_validated: false) |
| `403` | Cuenta no activada (estatus !== 1) |
| `429` | Cuenta bloqueada temporalmente (10+ intentos fallidos, 30 min de bloqueo) |

#### Notas
- Si hay 10 intentos fallidos, la cuenta se bloquea por 30 minutos y se envía un correo de notificación.
- Al hacer login exitoso, se reinicia `intentos_login` a 0.
- Se elimina `reset_password_token` si existía.
- Se guarda información del dispositivo (IP, userAgent, deviceName) asociada al refresh token.
- El refresh token se guarda hasheado (SHA-256) en la colección `UserToken`.

---

### `POST /api/auth/cuentas/password-olvidado`

**Descripción:** Envía un correo con un enlace para restablecer la contraseña.  
**Archivo de ruta:** `routes/auth.js:46`  
**Controlador:** `controllers/auth.js:327` — `envioCorreoReestablecerPassword`

#### Autenticación y permisos
- Requiere token: **No**
- Rate limit: `recoveryLimiter` — 3 intentos cada 15 minutos

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación |
|-----------|-------|------|-----------|------------|
| `body` | `correo` | `string` (email) | Sí | `isEmail()` |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "token": "jwt_de_sesion_temporal",
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"
}
```

#### Notas
- Por seguridad, **siempre** devuelve el mismo mensaje sin confirmar si el correo existe o no.
- El `token` en la respuesta es un JWT para sessionStorage del frontend (no para restablecer contraseña).
- Cooldown de 5 minutos entre reenvíos del mismo correo.
- Si `SEND_EMAIL=false` en entorno de desarrollo, no se envía el correo realmente.

---

### `POST /api/auth/reenviar-correo-restablecer-password`

**Descripción:** Reenvía el correo de restablecimiento de contraseña usando un token previo.  
**Archivo de ruta:** `routes/auth.js:53`  
**Controlador:** `controllers/auth.js:336` — `reenvioCorreoRestablecerPassword`

#### Autenticación y permisos
- Requiere token: **No**
- Rate limit: `recoveryLimiter` — 3 intentos cada 15 minutos

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación |
|-----------|-------|------|-----------|------------|
| `body` | `token` | `string` (JWT) | Sí | `isJWT` con `RESET_PASSWORD_SECRET` y algoritmo `HS256` |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "token": "nuevo_jwt_de_sesion_temporal",
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"
}
```

---

### `GET /api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}`

**Descripción:** Valida que el token de restablecimiento de contraseña sea válido (no expirado, existente en BD).  
**Archivo de ruta:** `routes/auth.js:58`  
**Controlador:** `controllers/auth.js:348` — `validarTokenRestablecerPassword`

#### Autenticación y permisos
- Requiere token: **No** (el token va en la URL)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación |
|-----------|-------|------|-----------|------------|
| `params` | `token` | `string` (JWT) | Sí | `isJWT` con `RESET_PASSWORD_SECRET` y algoritmo `HS256` |

#### Middlewares en orden
1. `validarTokenEnURL`
2. `check('token').isJWT(...)`
3. `validarCampos`

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Token válido",
  "valid": true
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `401` | Token inválido, expirado, o no coincide con el almacenado en BD |
| `403` | Cuenta no verificada o no activada |
| `500` | Error interno al validar el token (development: incluye detalle) |

---

### `POST /api/auth/cuentas/reestablecer-password{/:token}`

**Descripción:** Establece una nueva contraseña usando el token de restablecimiento.  
**Archivo de ruta:** `routes/auth.js:64`  
**Controlador:** `controllers/auth.js:398` — `reestablecerPassword`

#### Autenticación y permisos
- Requiere token: **No** (el token va en la URL)

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación |
|-----------|-------|------|-----------|------------|
| `params` | `token` | `string` (JWT) | Sí | — |
| `body` | `password` | `string` | Sí | `trim().isLength({ min: 8 })` |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Password reestablecido"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `500` | Error al procesar el restablecimiento |

---

### `POST /api/auth/refresh`

**Descripción:** Renueva el access token y refresh token usando el refresh token almacenado en cookies.  
**Archivo de ruta:** `routes/auth.js:71`  
**Controlador:** `controllers/auth.js:418` — `refreshToken`

#### Autenticación y permisos
- Requiere token: **Sí** (refresh token en cookie)
- Rate limit: `refreshLimiter` — 10 renovaciones cada 15 minutos

#### Parámetros de entrada
- No tiene parámetros en body. El `refreshToken` se obtiene de `req.cookies`.

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Token renovado"
}
```

#### Cookies actualizadas

| Cookie | Nuevo valor |
|--------|-------------|
| `accessToken` | Nuevo JWT (1 hora) |
| `refreshToken` | Nuevo JWT (7 días) |

#### Códigos de error

| Código | Causa |
|--------|-------|
| `401` | No hay refresh token en cookies |
| `401` | Token no registrado en BD (o sesión comprometida, se invalida todo) |
| `403` | Token no registrado (firma inválida) |
| `403` | Token expirado (se elimina de BD) |
| `429` | Demasiadas renovaciones (rate limit) |

#### Notas
- Si se detecta reuso de un refresh token (posible robo), se invalida **TODAS** las sesiones del usuario incrementando `tokenVersion`.
- Se elimina el refresh token anterior de la BD y se guarda el nuevo.
- Se actualiza IP, userAgent y deviceName.

---

### `POST /api/auth/logout`

**Descripción:** Cierra la sesión del usuario. Elimina las cookies y el refresh token de la base de datos.  
**Archivo de ruta:** `routes/auth.js:73`  
**Controlador:** `controllers/auth.js:520` — `logout`

#### Autenticación y permisos
- Requiere token: **Sí** (refresh token en cookie para identificar la sesión)

#### Middlewares en orden
1. `validarRefreshToken` — Verifica que exista un refreshToken en cookies

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Sesión cerrada"
}
```

---

### `GET /api/auth/me`

**Descripción:** Obtiene los datos del usuario autenticado (sesión activa).  
**Archivo de ruta:** `routes/auth.js:78`  
**Controlador:** `controllers/auth.js:251` — `getMe`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middleware de auth: `verificarTokenSesion`

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Usuario obtenido",
  "ok": true,
  "usuario": {
    "_id": "60d5f484f8a2c8a1d4e8e4a1",
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala" },
    "imagen_perfil": {
      "secure_url": "https://res.cloudinary.com/...",
      "public_id": "..."
    },
    "correo": "usuario@correo.com",
    "url": "juan-perez",
    "genero": "MASCULINO",
    "fecha_nacimiento": "1990-01-15T00:00:00.000Z"
  }
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `401` | Token no válido, no existe o cuenta no activada |
| `404` | Usuario no encontrado o cuenta eliminada (estatus 4) |

---

## Usuarios

Base path: **`/api/usuarios`**  
Archivo de ruta: `routes/usuarios.js`  
Controlador: `controllers/usuarios.js`

---

### `GET /api/usuarios`

**Descripción:** Endpoint placeholder. Actualmente no implementado.  
**Archivo de ruta:** `routes/usuarios.js:19`  
**Controlador:** `controllers/usuarios.js:30` — `usuariosGet`

#### Autenticación y permisos
- Requiere token: **No**
- Rate limit: `lecturaLimiter` — 100 solicitudes cada 15 minutos

#### Respuesta — `200 OK`

```json
{
  "msg": "DE MOMENTO ESTA API PARA MOSTRAR A LOS USUARIOS NO SE VA A OCUPAR"
}
```

---

### `GET /api/usuarios/:url`

**Descripción:** Obtiene la información de un perfil de usuario mediante su URL única. Incluye total de posteos, seguidores, seguidos y si el usuario autenticado sigue al dueño del perfil.  
**Archivo de ruta:** `routes/usuarios.js:21`  
**Controlador:** `controllers/usuarios.js:38` — `usuarioGet`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('url').trim()`
  3. `validarUrlUsuario` — Verifica que la URL exista en BD y que el usuario tenga cuenta activa
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación |
|-----------|-------|------|-----------|------------|
| `params` | `url` | `string` | Sí | `trim()` — debe existir en BD |

#### Respuesta exitosa — `200 OK`

```json
{
  "usuario": {
    "_id": "60d5f484f8a2c8a1d4e8e4a1",
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala" },
    "imagen_perfil": {
      "secure_url": "https://res.cloudinary.com/...",
      "public_id": "..."
    },
    "url": "juan-perez",
    "totalPosteos": 15,
    "totalSeguidores": 42,
    "totalSeguidos": 18,
    "isFollowing": true
  }
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `401` | Token inválido |
| `404` | URL de usuario no existe en BD |
| `401` | Cuenta no verificada o suspendida (validado por `validarUrlUsuario`) |

---

### `POST /api/usuarios`

**Descripción:** Registra un nuevo usuario. Envía correo de verificación.  
**Archivo de ruta:** `routes/usuarios.js:33`  
**Controlador:** `controllers/usuarios.js:83` — `usuariosPost`

#### Autenticación y permisos
- Requiere token: **No**
- Rate limit: `registroLimiter` — 3 registros por hora

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación |
|-----------|-------|------|-----------|------------|
| `body` | `nombre_completo.nombre` | `string` | Sí | `trim().notEmpty()` |
| `body` | `nombre_completo.apellido` | `string` | Sí | `trim().notEmpty()` |
| `body` | `correo` | `string` (email) | Sí | `isEmail()` + validación personalizada: no repetido en BD |
| `body` | `password` | `string` | Sí | `min 8` + mayúscula + minúscula + número + carácter especial |
| `body` | `estatus` | `number` | No | `isNumeric()` (opcional) |
| `body` | `intentos_login` | `number` | No | `isNumeric()` (opcional) |

#### Validación de password (regex)

```
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]])/
```

Debe contener: al menos una mayúscula, una minúscula, un número y un carácter especial.

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "token": "jwt_para_sessionstorage_frontend"
}
```

> **Nota:** El `token` en la respuesta es para que el frontend lo almacene en sessionStorage y pueda acceder a la página de "correo enviado".

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Error de validación en campos |
| `409` | El correo ya está registrado |
| `429` | Demasiados registros desde esta conexión |
| `500` | Error interno al procesar el registro |

#### Notas
- Genera automáticamente una `url` de perfil única basada en el nombre completo.
- Encripta el password con `bcryptjs` (salt rounds: 10).
- Crea un token de verificación y lo guarda hasheado en la BD.
- Envía correo de verificación con enlace al frontend (`FRONTEND_URL`).
- El usuario se guarda solo si el correo se envía exitosamente.

---

### `PUT /api/usuarios/update`

**Descripción:** Actualiza los datos del perfil del usuario autenticado. No permite actualizar imagen de perfil (hay endpoint separado).  
**Archivo de ruta:** `routes/usuarios.js:60`  
**Controlador:** `controllers/usuarios.js:144` — `usuariosPut`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. Validaciones de campos con `check()`
  3. `validarCampos`

#### Parámetros de entrada (todos opcionales)

| Ubicación | Campo | Tipo | Requerido | Validación |
|-----------|-------|------|-----------|------------|
| `body` | `nombre_completo.nombre` | `string` | No | `optional().trim().notEmpty()` |
| `body` | `nombre_completo.apellido` | `string` | No | `optional().trim().notEmpty()` |
| `body` | `password` | `string` | No | `optional().trim().isLength({ min: 8 })` |
| `body` | `lugar_radicacion.nombreEntidad` | `string` | No | `optional().notEmpty()` |
| `body` | `lugar_radicacion.claveMunicipio` | `string` | No | `optional().notEmpty()` |
| `body` | `lugar_radicacion.nombreMunicipio` | `string` | No | `optional().notEmpty()` |
| `body` | `genero` | `string` | No | `optional().isIn(['MASCULINO', 'FEMENINO', 'PREFIERO NO DECIR'])` |
| `body` | `fecha_nacimiento` | `date` | No | `optional().isDate()` |

#### Campos permitidos (whitelist en controlador)

```javascript
const ALLOWED_FIELDS = new Set([
    'nombre_completo',
    'lugar_radicacion',
    'genero',
    'fecha_nacimiento'
]);
```

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Usuario actualizado",
  "usuario": {
    "_id": "60d5f484f8a2c8a1d4e8e4a1",
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": {
      "nombreEntidad": "Tlaxcala",
      "claveMunicipio": "29",
      "nombreMunicipio": "Zacatelco"
    },
    "correo": "usuario@correo.com",
    "url": "juan-perez",
    "genero": "MASCULINO",
    "fecha_nacimiento": "1990-01-15T00:00:00.000Z"
  }
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Error de validación en campos |
| `401` | Token no válido |
| `500` | Error interno |

#### Notas
- Se ignora el campo `_id` y `correo` si vienen en el body (no se actualizan).
- Solo se actualizan los campos en la whitelist.
- Si se envía `password`, se encripta antes de guardar.

---

### `DELETE /api/usuarios/delete`

**Descripción:** Elimina la cuenta del usuario autenticado (soft delete). Utiliza transacciones de MongoDB para garantizar atomicidad.  
**Archivo de ruta:** `routes/usuarios.js:82`  
**Controlador:** `controllers/usuarios.js:186` — `usuariosDelete`

#### Autenticación y permisos
- Requiere token: **Sí** (access token + refresh token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`

#### Parámetros de entrada
- No tiene parámetros adicionales. La identificación del usuario viene del token.
- Requiere que exista `refreshToken` en cookies.

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Cuenta eliminada exitosamente. Tus datos serán eliminados permanentemente en unos días."
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | La cuenta ya fue eliminada previamente |
| `403` | No hay refresh token en cookies |
| `404` | Usuario no encontrado |
| `500` | Error interno (se hace rollback de la transacción) |

#### Efectos secundarios (soft delete en cascada)
- Usuario: `estatus = 4`, `isDeleted = true`, `deletedAt = now`
- Posteos del usuario: `isDeleted = true`
- Follows (follower/following): `isDeleted = true`
- Likes (dados y recibidos): `isDeleted = true`
- Notificaciones (enviadas y recibidas): `isDeleted = true`
- Favoritos (del usuario y de sus posteos): `isDeleted = true`
- Comentarios del usuario: `isDeleted = true`
- Se decrementa `comentariosCount` en los posteos afectados
- Se cierra la sesión (elimina cookies y refresh token de BD)

**Tecnología:** MongoDB transactions (sesión con `startTransaction()` / `commitTransaction()` / `abortTransaction()`)

---

### `GET /api/usuarios/registrados/nuevos-usuarios-registrados`

**Descripción:** Obtiene los últimos 3 usuarios registrados (excluyendo al usuario autenticado). Incluye indicador de si el usuario autenticado los sigue.  
**Archivo de ruta:** `routes/usuarios.js:87`  
**Controlador:** `controllers/usuarios.js:395` — `nuevosUsuariosRegistrados`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Nuevos Usuarios Registrados",
  "nuevosUsuariosRegistrados": [
    {
      "_id": "60d5f484f8a2c8a1d4e8e4a1",
      "nombre_completo": { "nombre": "María", "apellido": "López" },
      "url": "maria-lopez",
      "imagen_perfil": { "secure_url": "...", "public_id": "..." },
      "isFollowing": false
    }
  ]
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `401` | Token no válido |
| `500` | Error interno |

---

## Posteos (Publicaciones)

Base path: **`/api/posteos`**  
Archivo de ruta: `routes/posteos.js`  
Controlador: `controllers/posteos.js`

---

### `GET /api/posteos`

**Descripción:** Obtiene los últimos 15 posteos públicos de otros usuarios (excluye los del usuario autenticado). Con paginación, estado de like, follow y favorito.  
**Archivo de ruta:** `routes/posteos.js:30`  
**Controlador:** `controllers/posteos.js:14` — `posteosGet`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Rate limit: `lecturaLimiter` — 100 solicitudes cada 15 minutos
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('page').optional().isNumeric()`
  3. `check('limite').optional().isNumeric()`
  4. `validarCampos`

#### Parámetros de entrada (query)

| Ubicación | Campo | Tipo | Requerido | Valor por defecto |
|-----------|-------|------|-----------|-------------------|
| `query` | `page` | `number` | No | `1` |
| `query` | `limite` | `number` | No | `15` |

#### Filtros aplicados
- `posteo_publico: true` — Solo posteos públicos
- `_idUsuario: { $ne: req.usuario }` — Excluye los del usuario autenticado
- `isDeleted: false` — Excluye eliminados

#### Respuesta exitosa — `200 OK`

```json
{
  "page": 1,
  "next": "/api/posteos?page=2&limite=15",
  "prev": null,
  "limite": 15,
  "total_registros": 50,
  "mostrando": 15,
  "posteosConEstado": [
    {
      "ubicacion": {
        "ciudad": "Zacatelco",
        "municipio": "60d5f484f8a2c8a1d4e8e4b2",
        "estado": "Tlaxcala",
        "pais": "México",
        "esExacta": false,
        "coordinates": null
      },
      "public_id": "tlx-imagenes/post/abc123",
      "texto": "Hermoso día en Tlaxcala!",
      "fecha_creacion": "2026-07-08T10:00:00.000Z",
      "comentariosActivos": true,
      "_idUsuario": {
        "_id": "60d5f484f8a2c8a1d4e8e4a1",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "url": "juan-perez",
        "imagen_perfil": { "public_id": "..." }
      },
      "isFollowing": true,
      "isFavorito": false,
      "likesCount": 10,
      "hasLiked": true
    }
  ]
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Error al obtener posteos |
| `401` | Token no válido |
| `429` | Demasiadas solicitudes (rate limit) |

---

### `GET /api/posteos/post/:id`

**Descripción:** Obtiene un posteo específico por su ID. Incluye datos del autor, estado de follow, favorito y likes.  
**Archivo de ruta:** `routes/posteos.js:40`  
**Controlador:** `controllers/posteos.js:113` — `posteoGet`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('id').isMongoId()`
  3. `check('id').custom(validarIdPosteo)` — Verifica que el posteo exista
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `id` | `string` (MongoId) | Sí |

#### Respuesta exitosa — `200 OK`

```json
{
  "posteo": {
    "_id": "60d5f484f8a2c8a1d4e8e4b2",
    "_idUsuario": {
      "_id": "60d5f484f8a2c8a1d4e8e4a1",
      "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
      "imagen_perfil": { "public_id": "..." },
      "url": "juan-perez"
    },
    "public_id": "tlx-imagenes/post/abc123",
    "secure_url": "https://res.cloudinary.com/...",
    "texto": "Hermoso día en Tlaxcala!",
    "fecha_creacion": "2026-07-08T10:00:00.000Z",
    "fecha_actualizacion": null,
    "ubicacion": { ... },
    "comentariosActivos": true,
    "comentariosCount": 5,
    "likesCount": 10,
    "hasLiked": true,
    "isDeleted": false
  },
  "isFollowing": true,
  "isFavorito": false
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | ID no válido o error al obtener posteo |
| `401` | Token no válido |

---

### `GET /api/posteos/usuario/:idUsuario`

**Descripción:** Obtiene todos los posteos (públicos y privados) de un usuario específico por su ID. Con paginación e información de likes.  
**Archivo de ruta:** `routes/posteos.js:52`  
**Controlador:** `controllers/posteos.js:170` — `posteosUsuarioGet`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('idUsuario').isMongoId()`
  3. `check('idUsuario').custom(validarIdUsuario)`
  4. `check('page').optional().isNumeric()`
  5. `check('limite').optional().isNumeric()`
  6. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Valor por defecto |
|-----------|-------|------|-----------|-------------------|
| `params` | `idUsuario` | `string` (MongoId) | Sí | — |
| `query` | `page` | `number` | No | `1` |
| `query` | `limite` | `number` | No | `15` |

#### Respuesta exitosa — `200 OK`

```json
{
  "page": 1,
  "next": "/api/posteos/usuario/60d5f...?page=2&limite=15",
  "prev": null,
  "limite": 15,
  "total_registros": 10,
  "mostrando": 10,
  "posteos": [
    {
      "public_id": "tlx-imagenes/post/abc123",
      "secure_url": "https://res.cloudinary.com/...",
      "likesCount": 5,
      "hasLiked": false
    }
  ]
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | ID no válido o error al obtener posteos |
| `401` | Token no válido |

---

### `POST /api/posteos`

**Descripción:** Crea un nuevo posteo con imagen. La imagen se sube a Cloudinary. El texto es opcional.  
**Archivo de ruta:** `routes/posteos.js:66`  
**Controlador:** `controllers/posteos.js:246` — `posteosPost`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Rate limit: `posteoLimiter` — 20 posteos cada 15 minutos
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `upload.single('img')` — Multer, campo esperado: `img`
  3. `validarCampoImg` — Verifica que `req.file` exista
  4. `validarImagenesMulter` — Captura errores de Multer (tamaño, tipo, etc.)
  5. `validarTexto` — Valida el texto opcional con regex
  6. `check('posteo_publico').optional().isBoolean()`
  7. `check('lat').optional().isFloat()`
  8. `check('lng').optional().isFloat()`
  9. `validarCampos`

#### Parámetros de entrada (FormData)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `img` | `file` (imagen) | Sí | jpg, jpeg, png, webp. Máximo 5MB |
| `texto` | `string` | No | Regex: `^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ.,!?¡¿()\s-]*$` |
| `posteo_publico` | `boolean` | No | Por defecto `true` |
| `lat` | `number` | No | Latitud (GPS) |
| `lng` | `number` | No | Longitud (GPS) |
| `municipio` | `string` | No | ID del municipio (selección manual) |
| `ciudad` | `string` | No | Ciudad |
| `estado` | `string` | No | Estado |
| `pais` | `string` | No | País (por defecto "México") |

#### Respuesta exitosa — `201 Created`

```json
{
  "status": 201,
  "msg": "Posteo creado correctamente"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Error de validación (imagen no válida, texto inválido, etc.) |
| `401` | Token no válido |
| `404` | No hay imagen para subir |
| `429` | Demasiados posteos (rate limit) |
| `500` | Error interno (Cloudinary, BD) |

#### Notas
- Solo se acepta el campo `img` en el FormData (upload single).
- La imagen se redimensiona a 1080px width (crop scale) por defecto.
- La ubicación puede ser exacta (GPS: lat+lng) o manual (municipio seleccionado).
- Si se proporciona `lat` y `lng`, se guarda como un objeto GeoJSON `Point` con formato `[longitud, latitud]`.

---

### `PUT /api/posteos/:id`

**Descripción:** Actualiza un posteo existente. Solo el dueño del posteo puede modificarlo. No permite cambiar la imagen.  
**Archivo de ruta:** `routes/posteos.js:88`  
**Controlador:** `controllers/posteos.js:328` — `posteosPut`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('id').isMongoId()`
  3. `check('id').custom(validarIdPosteo)`
  4. `validarTexto`
  5. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Descripción |
|-----------|-------|------|-----------|-------------|
| `params` | `id` | `string` (MongoId) | Sí | ID del posteo |
| `body` | `texto` | `string` | No | Nuevo texto |
| `body` | `posteo_publico` | `boolean` | No | Visibilidad |
| `body` | `municipio` | `string` | No | ID de municipio |
| `body` | `ciudad` | `string` | No | Ciudad |
| `body` | `estado` | `string` | No | Estado |
| `body` | `pais` | `string` | No | País |
| `body` | `lat` | `number` | No | Latitud |
| `body` | `lng` | `number` | No | Longitud |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Posteo actualizado correctamente",
  "posteo": { ... }
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Error de validación |
| `401` | Token no válido |
| `403` | No tienes permiso para modificar este posteo |

---

### `DELETE /api/posteos/:id`

**Descripción:** Elimina un posteo (soft delete). Solo el dueño puede eliminarlo.  
**Archivo de ruta:** `routes/posteos.js:101`  
**Controlador:** `controllers/posteos.js:421` — `posteosDelete`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('id').isMongoId()`
  3. `check('id').custom(validarIdPosteo)`
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `id` | `string` (MongoId) | Sí |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Posteo con imagen eliminado correctamente"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | ID no válido |
| `401` | Token no válido |
| `403` | No tienes permiso para eliminar este posteo |

---

## Likes

Base path: **`/api/likes`**  
Archivo de ruta: `routes/likes.js`  
Controlador: `controllers/likes.js`

---

### `POST /api/likes/:id/like`

**Descripción:** Da like o quita like (toggle) a un posteo.  
**Archivo de ruta:** `routes/likes.js:11`  
**Controlador:** `controllers/likes.js:10` — `likeDislikePosteo`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('id').isMongoId()`
  3. `check('id').custom(validarIdPosteo)`
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `id` | `string` (MongoId) | Sí (ID del posteo) |

#### Respuesta exitosa — `200 OK` (like añadido)

```json
{
  "status": 200,
  "msg": "Like añadido"
}
```

#### Respuesta exitosa — `200 OK` (like eliminado)

```json
{
  "status": 200,
  "msg": "Like eliminado"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Error al procesar el like |
| `401` | Token no válido |
| `404` | Posteo no encontrado |

#### Notas
- Usa el ID del usuario autenticado (`req.usuario`) y el ID del posteo.
- Si ya existe un like, lo elimina. Si no existe, lo crea.
- Guarda también el ID del creador del posteo (`_idCreadorPosteo`) para futuras notificaciones.

---

### `GET /api/likes/posteo/:id`

**Descripción:** Obtiene el número total de likes de una publicación.  
**Archivo de ruta:** `routes/likes.js:22`  
**Controlador:** `controllers/likes.js:52` — `getLikesPosteos`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('id').isMongoId()`
  3. `check('id').custom(validarIdPosteo)`
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `id` | `string` (MongoId) | Sí (ID del posteo) |

#### Respuesta exitosa — `200 OK`

```json
{
  "likes": 10,
  "posteo": "60d5f484f8a2c8a1d4e8e4b2"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Error al obtener likes |
| `401` | Token no válido |

---

### `GET /api/likes/:id/likes/usuarios`

**Descripción:** Obtiene los usuarios que dieron like a una publicación, con información del perfil.  
**Archivo de ruta:** `routes/likes.js:34`  
**Controlador:** `controllers/likes.js:68` — `getLikesUsuariosPosteos`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('id').isMongoId()`
  3. `check('id').custom(validarIdPosteo)`
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `id` | `string` (MongoId) | Sí (ID del posteo) |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Likes de usuarios a posteo obtenidos correctamente",
  "likes_usuarios_posteo": [
    {
      "_idUsuario": {
        "_id": "60d5f484f8a2c8a1d4e8e4a1",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "imagen_perfil": { "secure_url": "...", "public_id": "..." },
        "url": "juan-perez"
      }
    }
  ]
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Error al obtener usuarios |
| `401` | Token no válido |

---

## Comentarios

Base path: **`/api/comentarios`**  
Archivo de ruta: `routes/comentarios.js`  
Controlador: `controllers/comentarios.js`

---

### `POST /api/comentarios/:posteoId/comentarios`

**Descripción:** Agrega un comentario a un posteo. Envía notificación push al autor del posteo (si tiene activadas).  
**Archivo de ruta:** `routes/comentarios.js:16`  
**Controlador:** `controllers/comentarios.js:10` — `agregarComentario`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Rate limit: `comentarioLimiter` — 10 comentarios por minuto
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('posteoId').isMongoId()`
  3. `check('posteoId').custom(validarIdPosteo)`
  4. `check('texto').optional().notEmpty()`
  5. `check('texto').isLength({ max: 250 })`
  6. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación |
|-----------|-------|------|-----------|------------|
| `params` | `posteoId` | `string` (MongoId) | Sí | — |
| `body` | `texto` | `string` | No (pero se recomienda) | Máximo 250 caracteres |

#### Respuesta exitosa — `201 Created`

```json
{
  "ok": true,
  "status": 201,
  "msg": "Comentario agregado",
  "comentario": {
    "_id": "60d5f484f8a2c8a1d4e8e4c1",
    "texto": "¡Qué bonita foto!",
    "posteoId": "60d5f484f8a2c8a1d4e8e4b2",
    "autorId": "60d5f484f8a2c8a1d4e8e4a1",
    "createdAt": "2026-07-08T12:00:00.000Z",
    "updatedAt": "2026-07-08T12:00:00.000Z"
  }
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Error de validación (texto > 250 caracteres) |
| `403` | Los comentarios están desactivados en este posteo |
| `404` | El posteo no existe o ha sido eliminado |
| `429` | Demasiados comentarios (rate limit) |

#### Notas
- Incrementa `comentariosCount` del posteo.
- Si es el primer comentario del posteo y el comentarista no es el autor, envía un correo de notificación al autor.
- Envía notificación push Web Push al autor si tiene notificaciones activadas.
- Las suscripciones push inválidas (410/404) se eliminan automáticamente.

---

### `GET /api/comentarios/:posteoId/comentarios`

**Descripción:** Obtiene los comentarios de un posteo con paginación, ordenados por fecha descendente.  
**Archivo de ruta:** `routes/comentarios.js:25`  
**Controlador:** `controllers/comentarios.js:131` — `obtenerComentarios`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('posteoId').isMongoId()`
  3. `check('posteoId').custom(validarIdPosteo)`
  4. `check('page').optional().isNumeric()`
  5. `check('limite').optional().isNumeric()`
  6. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Valor por defecto |
|-----------|-------|------|-----------|-------------------|
| `params` | `posteoId` | `string` (MongoId) | Sí | — |
| `query` | `page` | `number` | No | `1` |
| `query` | `limit` | `number` | No | `10` (máximo 100) |

#### Respuesta exitosa — `200 OK`

```json
{
  "ok": true,
  "status": 200,
  "page": 1,
  "limit": 10,
  "next": "/api/comentarios/60d5f.../comentarios/?page=2&limit=10",
  "prev": null,
  "total": 25,
  "totalPages": 3,
  "comentarios": [
    {
      "_id": "60d5f484f8a2c8a1d4e8e4c1",
      "texto": "¡Qué bonita foto!",
      "createdAt": "2026-07-08T12:00:00.000Z",
      "autorId": {
        "_id": "60d5f484f8a2c8a1d4e8e4a1",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "imagen_perfil": { "secure_url": "...", "public_id": "..." },
        "url": "juan-perez"
      }
    }
  ]
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `500` | Error al obtener comentarios |

---

### `GET /api/comentarios/:posteoId/comentarios/count`

**Descripción:** Obtiene el número total de comentarios de un posteo.  
**Archivo de ruta:** `routes/comentarios.js:34`  
**Controlador:** `controllers/comentarios.js:205` — `obtenerCountComentarios`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('posteoId').isMongoId()`
  3. `check('posteoId').custom(validarIdPosteo)`
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `posteoId` | `string` (MongoId) | Sí |

#### Respuesta exitosa — `200 OK`

```json
{
  "ok": true,
  "status": 200,
  "count": 5
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `404` | El posteo no existe |
| `500` | Error al obtener contador |

---

### `DELETE /api/comentarios/:comentarioId`

**Descripción:** Elimina un comentario (soft delete). Puede eliminarlo el autor del comentario o el dueño del posteo.  
**Archivo de ruta:** `routes/comentarios.js:41`  
**Controlador:** `controllers/comentarios.js:238` — `eliminarComentario`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('comentarioId').isMongoId()`
  3. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `comentarioId` | `string` (MongoId) | Sí |

#### Respuesta exitosa — `200 OK`

```json
{
  "ok": true,
  "status": 200,
  "msg": "Comentario eliminado"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | El comentario ya fue eliminado |
| `403` | No tienes permisos para eliminar este comentario |
| `404` | El comentario no existe |

#### Notas
- Decrementa `comentariosCount` del posteo (protege contra contador negativo).
- Guarda `eliminadoPor` (ID del usuario que eliminó) y `deleteReason: "manual"`.

---

### `PUT /api/comentarios/:posteoId/comentarios/toggle`

**Descripción:** Activa o desactiva los comentarios de un posteo. Solo el dueño del posteo puede hacer esta acción.  
**Archivo de ruta:** `routes/comentarios.js:47`  
**Controlador:** `controllers/comentarios.js:328` — `toggleComentariosPosteo`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('posteoId').isMongoId()`
  3. `check('posteoId').custom(validarIdPosteo)`
  4. `check('activar').isBoolean({ strict: true })`
  5. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `posteoId` | `string` (MongoId) | Sí |
| `body` | `activar` | `boolean` | Sí |

#### Respuesta exitosa — `200 OK`

```json
{
  "ok": true,
  "status": 200,
  "msg": "Comentarios activados",
  "comentariosActivos": true
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `403` | Solo el dueño del posteo puede modificar los comentarios |
| `404` | El posteo no existe |

---

## Followers (Seguidores)

Base path: **`/api/followers`**  
Archivo de ruta: `routes/followers.js`  
Controlador: `controllers/followers.js`

---

### `POST /api/followers/follow/:id`

**Descripción:** Sigue a un usuario. Crea notificación y envía notificación push al usuario seguido.  
**Archivo de ruta:** `routes/followers.js:14`  
**Controlador:** `controllers/followers.js:8` — `followUsuario`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('id').isMongoId()`
  3. `check('id').custom(validarIdUsuario)`
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `id` | `string` (MongoId) | Sí (ID del usuario a seguir) |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Has comenzado a seguir a este usuario",
  "success": true
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | No puedes seguirte a ti mismo |
| `400` | Ya sigues a este usuario |
| `404` | El usuario que intentas seguir no existe |

#### Notas
- Crea una notificación persistente en la BD (tipo: "follow").
- Envía notificación push Web Push si el usuario seguido tiene notificaciones activadas.
- Las suscripciones push inválidas se eliminan automáticamente.

---

### `DELETE /api/followers/unfollow/:id`

**Descripción:** Deja de seguir a un usuario.  
**Archivo de ruta:** `routes/followers.js:27`  
**Controlador:** `controllers/followers.js:126` — `unfollowUsuario`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('id').isMongoId()`
  3. `check('id').custom(validarIdUsuario)`
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `id` | `string` (MongoId) | Sí (ID del usuario a dejar de seguir) |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Dejaste de seguir a este usuario"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | No sigues a este usuario |

---

### `GET /api/followers/usuario/lista-followers/:id`

**Descripción:** Obtiene la lista de seguidores de un perfil de usuario. Incluye indicador de si el usuario autenticado sigue a cada seguidor.  
**Archivo de ruta:** `routes/followers.js:39`  
**Controlador:** `controllers/followers.js:157` — `obtenerFollowers`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('id').isMongoId()`
  3. `check('id').custom(validarIdUsuario)`
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `id` | `string` (MongoId) | Sí (ID del perfil visitado) |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Seguidores obtenidos correctamente",
  "totalSeguidores": 42,
  "seguidores": [
    {
      "follower": {
        "_id": "60d5f484f8a2c8a1d4e8e4a1",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "imagen_perfil": { "secure_url": "...", "public_id": "..." },
        "url": "juan-perez"
      },
      "isFollowing": true
    }
  ]
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `500` | Error al obtener seguidores |

---

### `GET /api/followers/usuario/lista-followings/:id`

**Descripción:** Obtiene la lista de usuarios que sigue un perfil. Incluye indicador de si el usuario autenticado también los sigue.  
**Archivo de ruta:** `routes/followers.js:51`  
**Controlador:** `controllers/followers.js:202` — `obtenerFollowings`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('id').isMongoId()`
  3. `check('id').custom(validarIdUsuario)`
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `id` | `string` (MongoId) | Sí (ID del perfil visitado) |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Usuarios seguidos, obtenidos correctamente",
  "totalSeguidos": 18,
  "siguiendo": [
    {
      "_id": "60d5f484f8a2c8a1d4e8e4a1",
      "following": {
        "_id": "60d5f484f8a2c8a1d4e8e4b1",
        "nombre_completo": { "nombre": "María", "apellido": "López" },
        "imagen_perfil": { "secure_url": "...", "public_id": "..." },
        "url": "maria-lopez"
      },
      "isFollowing": true
    }
  ]
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `500` | Error al obtener followings |

---

## Favoritos

Base path: **`/api/favoritos`**  
Archivo de ruta: `routes/favoritos.js`  
Controlador: `controllers/favoritos.js`

---

### `GET /api/favoritos`

**Descripción:** Obtiene los posteos favoritos del usuario autenticado, con paginación.  
**Archivo de ruta:** `routes/favoritos.js:13`  
**Controlador:** `controllers/favoritos.js:8` — `obtenerFavoritosUsuario`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('page').optional().isNumeric()`
  3. `check('limite').optional().isNumeric()`
  4. `validarCampos`

#### Parámetros de entrada (query)

| Ubicación | Campo | Tipo | Requerido | Valor por defecto |
|-----------|-------|------|-----------|-------------------|
| `query` | `page` | `number` | No | `1` |
| `query` | `limite` | `number` | No | `15` |

#### Respuesta exitosa — `200 OK`

```json
{
  "page": 1,
  "next": "/api/favoritos?page=2&limite=15",
  "prev": null,
  "limite": 15,
  "total_registros": 5,
  "mostrando": 5,
  "favoritos": [
    {
      "_id": "60d5f484f8a2c8a1d4e8e4d1",
      "createdAt": "2026-07-08T12:00:00.000Z",
      "posteoId": {
        "public_id": "tlx-imagenes/post/abc123",
        "posteo_publico": true
      },
      "autorId": {
        "_id": "60d5f484f8a2c8a1d4e8e4a1",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "url": "juan-perez"
      }
    }
  ]
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `401` | Token no válido |
| `500` | Error interno |

---

### `POST /api/favoritos/:posteoId`

**Descripción:** Agrega un posteo a favoritos. No puedes agregar tus propios posteos.  
**Archivo de ruta:** `routes/favoritos.js:24`  
**Controlador:** `controllers/favoritos.js:88` — `agregarPosteoFavorito`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('posteoId').isMongoId()`
  3. `check('posteoId').custom(validarIdPosteo)`
  4. `check('autorId').isMongoId()`
  5. `check('autorId').custom(validarIdUsuario)`
  6. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `posteoId` | `string` (MongoId) | Sí (ID del posteo) |
| `body` | `autorId` | `string` (MongoId) | Sí (ID del autor del posteo) |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Agregado en Favoritos"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | No puedes agregar a favoritos tus propios posteos |
| `400` | Este posteo ya está en tus favoritos |

#### Notas
- Usa `upsert` de MongoDB para evitar duplicados en una sola operación atómica.

---

### `DELETE /api/favoritos/:posteoId`

**Descripción:** Elimina un posteo de favoritos.  
**Archivo de ruta:** `routes/favoritos.js:40`  
**Controlador:** `controllers/favoritos.js:140` — `eliminarPosteoFavorito`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('posteoId').isMongoId()`
  3. `check('posteoId').custom(validarIdPosteo)`
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `posteoId` | `string` (MongoId) | Sí |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Eliminado de Favoritos"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `404` | El posteo no existe en favoritos |

---

## Uploads (Imágenes de Perfil)

Base path: **`/api/uploads`**  
Archivo de ruta: `routes/uploads.js`  
Controlador: `controllers/uploads.js`

---

### `PUT /api/uploads/:coleccion`

**Descripción:** Actualiza la imagen de perfil del usuario autenticado. La imagen se sube a Cloudinary y se reemplaza la anterior.  
**Archivo de ruta:** `routes/uploads.js:16`  
**Controlador:** `controllers/uploads.js:9` — `actualizarImagen`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `upload.single('img')` — Multer, campo esperado: `img`
  3. `validarCampoImg` — Verifica que `req.file` exista
  4. `validarImagenesMulter` — Captura errores de Multer
  5. `check('coleccion').custom(c => coleccionesPermitidas(c, ['usuarios']))` — Solo colección "usuarios"
  6. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Descripción |
|-----------|-------|------|-----------|-------------|
| `params` | `coleccion` | `string` | Sí | Solo `"usuarios"` |
| `body` (FormData) | `img` | `file` | Sí | jpg, jpeg, png, webp. Máximo 5MB |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Imagen de perfil actualizada correctamente",
  "usuario": {
    "imagen_perfil": {
      "secure_url": "https://res.cloudinary.com/...",
      "public_id": "tlx-imagenes/..."
    }
  }
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Colección no permitida, imagen no válida, etc. |
| `401` | Token no válido |
| `404` | No hay ninguna imagen para subir |

#### Notas
- La imagen se redimensiona a 500px width con `fill` antes de subir a Cloudinary.
- Si el usuario ya tenía una imagen (no es la default), se elimina la anterior de Cloudinary.
- El buffer se libera inmediatamente después de subir a Cloudinary por seguridad.

---

## Notificaciones Web Push

Base path: **`/api/notificaciones`**  
Archivo de ruta: `routes/notificaciones.js`  
Controlador: `controllers/notificaciones.js`

---

### `POST /api/notificaciones/subscribe`

**Descripción:** Registra una suscripción de Web Push para el usuario autenticado.  
**Archivo de ruta:** `routes/notificaciones.js:16`  
**Controlador:** `controllers/notificaciones.js:7` — `subscribirNotificacionesWebPush`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares: `verificarTokenSesion`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Descripción |
|-----------|-------|------|-----------|-------------|
| `body` | `subscription` | `object` | Sí | Objeto de suscripción Push API |
| `body` | `subscription.endpoint` | `string` | Sí | Endpoint del push service |
| `body` | `subscription.keys.p256dh` | `string` | Sí | Clave pública |
| `body` | `subscription.keys.auth` | `string` | Sí | Clave de autenticación |
| `body` | `userAgent` | `string` | No | Identificador del dispositivo |

#### Respuesta exitosa — `200 OK`

```json
{
  "message": "Suscripción registrada correctamente"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Suscripción inválida (faltan campos) |
| `404` | Usuario no encontrado |

#### Notas
- Máximo 10 suscripciones por usuario. Si se excede, elimina la más antigua.
- Evita suscripciones duplicadas (mismo endpoint + p256dh).
- Activa `notificaciones_activadas = true` automáticamente.

---

### `POST /api/notificaciones/unsubscribe`

**Descripción:** Elimina una suscripción de Web Push específica.  
**Archivo de ruta:** `routes/notificaciones.js:21`  
**Controlador:** `controllers/notificaciones.js:66` — `unsubscribeNotificacionesWebPush`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares: `verificarTokenSesion`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `body` | `endpoint` | `string` | Sí |

#### Respuesta exitosa — `200 OK`

```json
{
  "success": true,
  "msg": "Suscripción eliminada correctamente"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Falta el endpoint de la suscripción |

#### Notas
- Si el array de suscripciones queda vacío, desactiva `notificaciones_activadas = false`.

---

### `GET /api/notificaciones/vapidPublicKey`

**Descripción:** Obtiene la clave pública VAPID para Web Push.  
**Archivo de ruta:** `routes/notificaciones.js:27`  
**Controlador:** `controllers/notificaciones.js:107` — `getVapidPublicKey`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares: `verificarTokenSesion`

#### Respuesta exitosa — `200 OK`

```json
{
  "key": "BK... (clave pública VAPID)"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `500` | Falta la clave pública VAPID en variables de entorno |

---

### `GET /api/notificaciones`

**Descripción:** Obtiene las notificaciones del usuario autenticado con paginación.  
**Archivo de ruta:** `routes/notificaciones.js:32`  
**Controlador:** `controllers/notificaciones.js:120` — `obtenerNotificaciones`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares: `verificarTokenSesion`

#### Parámetros de entrada (query)

| Ubicación | Campo | Tipo | Requerido | Valor por defecto |
|-----------|-------|------|-----------|-------------------|
| `query` | `page` | `number` | No | `1` |
| `query` | `limit` | `number` | No | `20` |

#### Respuesta exitosa — `200 OK`

```json
{
  "page": 1,
  "limit": 20,
  "next": "/api/notificaciones?page=2&limit=20",
  "prev": null,
  "total": 15,
  "totalPages": 1,
  "notificaciones": [
    {
      "_id": "60d5f484f8a2c8a1d4e8e4e1",
      "tipo": "follow",
      "mensaje": "comenzó a seguirte",
      "leida": false,
      "notificacion_leida": false,
      "createdAt": "2026-07-08T12:00:00.000Z",
      "emisor": {
        "_id": "60d5f484f8a2c8a1d4e8e4a1",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "imagen_perfil": { "secure_url": "...", "public_id": "..." },
        "url": "juan-perez"
      },
      "referencia": {
        "public_id": "tlx-imagenes/post/abc123",
        "texto": "Hermoso día!"
      }
    }
  ]
}
```

---

### `PATCH /api/notificaciones/marcar-notificacion-leida/:id`

**Descripción:** Marca una notificación como leída.  
**Archivo de ruta:** `routes/notificaciones.js:37`  
**Controlador:** `controllers/notificaciones.js:202` — `marcarNotificacionLeida`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('id').isMongoId()`
  3. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `id` | `string` (MongoId) | Sí |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Notificación marcada como leída"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `404` | Notificación no encontrada o no autorizada |

---

### `GET /api/notificaciones/nuevas-notificaciones`

**Descripción:** Obtiene el número total de notificaciones no leídas del usuario autenticado.  
**Archivo de ruta:** `routes/notificaciones.js:46`  
**Controlador:** `controllers/notificaciones.js:243` — `obtenerTotalNotificacionesNoLeidas`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares: `verificarTokenSesion`

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "totalNoLeidas": 3
}
```

---

### `DELETE /api/notificaciones/eliminar-notificacion/:id`

**Descripción:** Elimina permanentemente una notificación.  
**Archivo de ruta:** `routes/notificaciones.js:51`  
**Controlador:** `controllers/notificaciones.js:266` — `eliminarNotificacion`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('id').notEmpty().isMongoId()`
  3. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `params` | `id` | `string` (MongoId) | Sí |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Notificación eliminada correctamente"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `404` | Notificación no encontrada |

#### Notas
- Usa `findOneAndDelete` con filtro de `receptor` para evitar que un usuario malintencionado elimine notificaciones ajenas.

---

## Municipios

Base path: **`/api/municipios`**  
Archivo de ruta: `routes/municipios.js`  
Controlador: `controllers/municipios.js`

---

### `GET /api/municipios`

**Descripción:** Obtiene la lista de municipios del estado de Tlaxcala desde la BD.  
**Archivo de ruta:** `routes/municipios.js:7`  
**Controlador:** `controllers/municipios.js:6` — `obtenerMunicipios`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares: `verificarTokenSesion`

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "msg": "Municipios obtenidos correctamente",
  "municipios": [
    {
      "_id": "60d5f484f8a2c8a1d4e8e4f1",
      "claveEntidad": 29,
      "nombreEntidad": "Tlaxcala",
      "claveMunicipio": 1,
      "nombreMunicipio": "Amaxac de Guerrero",
      "codigoPostal": "90500"
    }
  ]
}
```

> **Nota:** El campo `geometry` se excluye de la respuesta para reducir el tamaño.

#### Códigos de error

| Código | Causa |
|--------|-------|
| `500` | Error al obtener municipios |

---

## Ubicación (Geolocalización)

Base path: **`/api/ubicacion`**  
Archivo de ruta: `routes/ubicacion.js`  
Controlador: `controllers/ubicacion.js`

---

### `POST /api/ubicacion/reverse`

**Descripción:** Obtiene el municipio correspondiente a unas coordenadas GPS mediante reverse geocoding. Utiliza datos geoespaciales de la BD de municipios.  
**Archivo de ruta:** `routes/ubicacion.js:10`  
**Controlador:** `controllers/ubicacion.js:4` — `obtenerMunicipioPorCoords`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('lat').isFloat().notEmpty()`
  3. `check('lng').isFloat().notEmpty()`
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido |
|-----------|-------|------|-----------|
| `body` | `lat` | `number` | Sí (latitud) |
| `body` | `lng` | `number` | Sí (longitud) |

#### Algoritmo de búsqueda
1. **Intento 1:** Intersección exacta (`$geoIntersects`) — busca el municipio que contiene el punto exacto.
2. **Intento 2:** Fallback por cercanía (`$near` con `$maxDistance: 100m`) — busca el municipio más cercano si el punto está cerca del borde.

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "municipio": {
    "_id": "60d5f484f8a2c8a1d4e8e4f1",
    "claveEntidad": 29,
    "nombreEntidad": "Tlaxcala",
    "claveMunicipio": 33,
    "nombreMunicipio": "Zacatelco",
    "codigoPostal": "90750"
  },
  "metodo": "database_geo_intersect",
  "precision": "exacta"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Validación de coordenadas fallida |
| `404` | Ubicación fuera de la zona de cobertura (Tlaxcala) |
| `500` | Error interno |

---

### `GET /api/ubicacion`

**Descripción:** Misma funcionalidad que `GET /api/municipios`. Obtiene la lista de municipios.  
**Archivo de ruta:** `routes/ubicacion.js:20`  
**Controlador:** `controllers/municipios.js:6` — `obtenerMunicipios`

> Mismo comportamiento que el endpoint de Municipios.

---

## Soporte / Ayuda

Base path: **`/api/ayuda-soporte`**  
Archivo de ruta: `routes/soporte.js`  
Controlador: `controllers/soporte.js`

---

### `POST /api/ayuda-soporte/envio-correo`

**Descripción:** Envía un ticket de soporte técnico. Se envía un correo al equipo de soporte y una confirmación al usuario.  
**Archivo de ruta:** `routes/soporte.js:9`  
**Controlador:** `controllers/soporte.js:22` — `ayudaSoporteEnvioCorrreo`

#### Autenticación y permisos
- Requiere token: **Sí** (access token en cookie)
- Rate limit: `soporteLimiter` — 5 tickets cada 15 minutos
- Middlewares en orden:
  1. `verificarTokenSesion`
  2. `check('tipo_problema').notEmpty().isIn(["cuenta", "publicacion", "seguridad", "reporte", "otro"])`
  3. `check('descripcion_problema_usuario').notEmpty().isString().trim().isLength({ min: 15, max: 1000 })`
  4. `validarCampos`

#### Parámetros de entrada

| Ubicación | Campo | Tipo | Requerido | Validación |
|-----------|-------|------|-----------|------------|
| `body` | `tipo_problema` | `string` | Sí | Debe ser uno de: `cuenta`, `publicacion`, `seguridad`, `reporte`, `otro` |
| `body` | `descripcion_problema_usuario` | `string` | Sí | Mínimo 15 caracteres, máximo 1000 |

#### Tipos de problema

| Valor | Descripción |
|-------|-------------|
| `cuenta` | Problemas relacionados con la cuenta (inicio de sesión, contraseña, etc.) |
| `publicacion` | Problemas con la creación, edición o eliminación de publicaciones |
| `seguridad` | Problemas de seguridad o reportes de hackeo |
| `reporte` | Reporte de contenido inapropiado o usuarios |
| `otro` | Cualquier otro problema, sugerencias o dudas generales |

#### Respuesta exitosa — `200 OK`

```json
{
  "status": 200,
  "ticketId": "TLX-1719945600000",
  "msg": "Solicitud de soporte recibida correctamente"
}
```

#### Códigos de error

| Código | Causa |
|--------|-------|
| `400` | Tipo de problema no válido o descripción inválida |
| `404` | Usuario no encontrado |
| `429` | Demasiados tickets de soporte (rate limit) |
| `500` | Error interno |

#### Notas
- El ticket se genera con formato `TLX-{timestamp}`.
- Se envía correo de confirmación al usuario (no bloqueante).
- Si `SEND_EMAIL=false` no se envían correos realmente.

---

## Middlewares

### `validarCampos` (`middlewares/validar-campos.js`)
Procesa los errores de `express-validator`. Si hay errores:
- Si es error de correo repetido → `409 Conflict`
- Si son otros errores de validación → `400 Bad Request`

### `verificarTokenSesion` (`middlewares/validar-jwt-cookies-sesion.js`)
Verifica el access token JWT de la cookie `accessToken`:
1. Verifica que exista la cookie
2. Verifica la firma con `ACCESS_TOKEN_SECRET`
3. Busca el usuario en BD
4. Verifica que el usuario no esté eliminado (estatus ≠ 4)
5. Verifica que la cuenta esté activada (email_validated y estatus)
6. Verifica `tokenVersion` (para invalidar sesiones comprometidas)
7. Asigna `req.usuario = id` para uso en controladores

### `validarRefreshToken` (`middlewares/validar-jwt-cookies-sesion.js`)
Verifica que exista la cookie `refreshToken`. Usado en logout.

### `validarTokenEnURL` (`middlewares/validar-token-en-url.js`)
Verifica que el parámetro `:token` exista en la URL. Usado en rutas de verificación de correo y restablecimiento de contraseña.

### `validarTexto` (`middlewares/validar-texto.js`)
Valida el campo `texto` de los posteos con el regex:
```
/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,!?¡¿()\s-]*$/
```

### `validarCampoImg` (`middlewares/validar-imagen-posteo.js`)
Verifica que exista un archivo en `req.file`. Si no existe, responde con `404`.

### `validarImagenesMulter` (`middlewares/validar-imagen-posteo.js`)
Middleware de error de Multer. Captura errores predefinidos de Multer (tamaño, tipo, etc.) y responde con `400`.

### `validarUrlUsuario` (`middlewares/validar-url-usuario.js`)
Verifica que la URL de usuario exista en BD, que el usuario tenga cuenta activa (email_validated, estatus), y que no esté suspendido.

### `validarOrigen` (`middlewares/validar-origen.js`)
Middleware CSRF. En métodos mutantes (POST, PUT, DELETE, PATCH), verifica que el header `Origin` o `Referer` coincida con `FRONTEND_URL` o `CSRF_ALLOWED_ORIGINS`. En desarrollo, si no hay origen, permite el paso.

### Rate Limiters (`middlewares/rate-limiter.js`)
9 limiters con `express-rate-limit`. Todos tienen `validate: false` para no interferir con express-validator.

---

## Modelos de datos (esquemas)

### Usuario (`models/Usuario.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre_completo.nombre` | `String` | Nombre del usuario (requerido) |
| `nombre_completo.apellido` | `String` | Apellido del usuario |
| `correo` | `String` (unique) | Correo electrónico |
| `password` | `String` | Contraseña (bcrypt hashed) |
| `lugar_radicacion` | `Object` | Ubicación de residencia |
| `url` | `String` (unique) | URL del perfil (slug) |
| `genero` | `String` (enum) | MASCULINO, FEMENINO, PREFIERO NO DECIR |
| `fecha_nacimiento` | `Date` | Fecha de nacimiento |
| `imagen_perfil` | `Object` | `{ secure_url, public_id }` |
| `estatus` | `Number` (0-4) | 0=no activada, 1=activa, 2=infringió normas, 3=suspendida, 4=eliminada |
| `email_validated` | `Boolean` | Indica si el correo fue verificado |
| `intentos_login` | `Number` | Contador de intentos fallidos |
| `bloqueo_login_hasta` | `Date` | Bloqueo temporal por intentos fallidos |
| `tokenVersion` | `Number` | Versión del token para invalidación de sesiones |
| `notificaciones_activadas` | `Boolean` | Notificaciones push activadas |
| `pushSubscriptions` | `Array` | Suscripciones Web Push (máx. 10) |

### Posteo (`models/Posteo.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_idUsuario` | `ObjectId` (ref: Usuario) | Autor del posteo |
| `public_id` | `String` | ID de Cloudinary |
| `secure_url` | `String` | URL de la imagen en Cloudinary |
| `texto` | `String` | Texto opcional |
| `ubicacion` | `Object` | Datos de ubicación (ciudad, municipio, estado, pais, coordinates, esExacta) |
| `posteo_publico` | `Boolean` | Visibilidad del posteo |
| `comentariosActivos` | `Boolean` | Comentarios habilitados |
| `comentariosCount` | `Number` | Contador de comentarios |
| `isDeleted` | `Boolean` | Soft delete |
| `deleteReason` | `String` | "manual", "accountDeletion", null |

### Comentario (`models/Comentario.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `texto` | `String` (max 250) | Contenido del comentario |
| `posteoId` | `ObjectId` (ref: Posteo) | Posteo al que pertenece |
| `autorId` | `ObjectId` (ref: Usuario) | Autor del comentario |
| `isDeleted` | `Boolean` | Soft delete |
| `eliminadoPor` | `ObjectId` | Quién eliminó el comentario |

### Like (`models/Like.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_idUsuario` | `ObjectId` (ref: Usuario) | Usuario que dio like |
| `_idCreadorPosteo` | `ObjectId` (ref: Usuario) | Dueño del posteo |
| `posteoId` | `ObjectId` (ref: Posteo) | Posteo likeado |
| `isDeleted` | `Boolean` | Soft delete |

**Índice único:** `{ _idUsuario, posteoId }` — evita likes duplicados.

### Follow (`models/Follow.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `follower` | `ObjectId` (ref: Usuario) | El que sigue |
| `following` | `ObjectId` (ref: Usuario) | El seguido |
| `isDeleted` | `Boolean` | Soft delete |

**Índice único:** `{ follower, following }` — evita follows duplicados.

### Favorito (`models/Favorito.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `usuarioId` | `ObjectId` (ref: Usuario) | Usuario que guarda |
| `posteoId` | `ObjectId` (ref: Posteo) | Posteo guardado |
| `autorId` | `ObjectId` (ref: Usuario) | Autor del posteo |

### Notificación (`models/Notificacion.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `receptor` | `ObjectId` (ref: Usuario) | Quién recibe la notificación |
| `emisor` | `ObjectId` (ref: Usuario) | Quién genera la notificación |
| `tipo` | `String` (enum) | follow, like, comentario, nueva_publicacion |
| `referencia` | `ObjectId` | ID del posteo u otro recurso relacionado |
| `mensaje` | `String` | Texto breve de la notificación |
| `notificacion_leida` | `Boolean` | Estado de lectura |

### UserToken (`models/UserToken.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | `ObjectId` (ref: Usuario) | Usuario propietario |
| `token` | `String` | Refresh token hasheado (SHA-256) |
| `ip` | `String` | IP del dispositivo |
| `userAgent` | `String` | User-Agent del dispositivo |
| `deviceName` | `String` | Nombre del dispositivo |
| `lastUsed` | `Date` | Último uso |

**TTL Index:** Documentos expiran a los 30 días automáticamente.

### Municipio (`models/Municipio.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `claveEntidad` | `Number` | Clave del estado (29 = Tlaxcala) |
| `nombreEntidad` | `String` | Nombre del estado |
| `claveMunicipio` | `Number` | Clave del municipio |
| `nombreMunicipio` | `String` | Nombre del municipio |
| `codigoPostal` | `String` | Código postal |
| `geometry` | `GeoJSON` | Datos geoespaciales (Polygon/MultiPolygon) |

**Índices:** `2dsphere` para búsquedas geoespaciales, texto para búsqueda por nombre.

---

## Resumen de Endpoints

| # | Método | Ruta | Auth | Rate Limit |
|---|--------|------|------|------------|
| 1 | GET | `/` | No | — |
| 2 | GET | `/api/health` | No | — |
| 3 | GET | `/api/auth/verificar-correo/:token` | No | — |
| 4 | POST | `/api/auth/reenviar-correo` | No | EMAIL_BLOCKED |
| 5 | POST | `/api/auth/login` | No | LOGIN_BLOCKED |
| 6 | POST | `/api/auth/cuentas/password-olvidado` | No | RECOVERY_BLOCKED |
| 7 | POST | `/api/auth/reenviar-correo-restablecer-password` | No | RECOVERY_BLOCKED |
| 8 | GET | `/api/auth/cuentas/restablecer-password/validar-token-reset-password/:token` | No | — |
| 9 | POST | `/api/auth/cuentas/reestablecer-password/:token` | No | — |
| 10 | POST | `/api/auth/refresh` | Sí | REFRESH_BLOCKED |
| 11 | POST | `/api/auth/logout` | Sí | — |
| 12 | GET | `/api/auth/me` | Sí | — |
| 13 | GET | `/api/usuarios` | No | READ_BLOCKED |
| 14 | GET | `/api/usuarios/:url` | Sí | — |
| 15 | POST | `/api/usuarios` | No | REGISTER_BLOCKED |
| 16 | PUT | `/api/usuarios/update` | Sí | — |
| 17 | DELETE | `/api/usuarios/delete` | Sí | — |
| 18 | GET | `/api/usuarios/registrados/nuevos-usuarios-registrados` | Sí | — |
| 19 | GET | `/api/posteos` | Sí | READ_BLOCKED |
| 20 | GET | `/api/posteos/post/:id` | Sí | — |
| 21 | GET | `/api/posteos/usuario/:idUsuario` | Sí | — |
| 22 | POST | `/api/posteos` | Sí | POSTEO_BLOCKED |
| 23 | PUT | `/api/posteos/:id` | Sí | — |
| 24 | DELETE | `/api/posteos/:id` | Sí | — |
| 25 | POST | `/api/likes/:id/like` | Sí | — |
| 26 | GET | `/api/likes/posteo/:id` | Sí | — |
| 27 | GET | `/api/likes/:id/likes/usuarios` | Sí | — |
| 28 | POST | `/api/comentarios/:posteoId/comentarios` | Sí | COMENTARIO_BLOCKED |
| 29 | GET | `/api/comentarios/:posteoId/comentarios` | Sí | — |
| 30 | GET | `/api/comentarios/:posteoId/comentarios/count` | Sí | — |
| 31 | DELETE | `/api/comentarios/:comentarioId` | Sí | — |
| 32 | PUT | `/api/comentarios/:posteoId/comentarios/toggle` | Sí | — |
| 33 | POST | `/api/followers/follow/:id` | Sí | — |
| 34 | DELETE | `/api/followers/unfollow/:id` | Sí | — |
| 35 | GET | `/api/followers/usuario/lista-followers/:id` | Sí | — |
| 36 | GET | `/api/followers/usuario/lista-followings/:id` | Sí | — |
| 37 | GET | `/api/favoritos` | Sí | — |
| 38 | POST | `/api/favoritos/:posteoId` | Sí | — |
| 39 | DELETE | `/api/favoritos/:posteoId` | Sí | — |
| 40 | PUT | `/api/uploads/:coleccion` | Sí | — |
| 41 | POST | `/api/notificaciones/subscribe` | Sí | — |
| 42 | POST | `/api/notificaciones/unsubscribe` | Sí | — |
| 43 | GET | `/api/notificaciones/vapidPublicKey` | Sí | — |
| 44 | GET | `/api/notificaciones` | Sí | — |
| 45 | PATCH | `/api/notificaciones/marcar-notificacion-leida/:id` | Sí | — |
| 46 | GET | `/api/notificaciones/nuevas-notificaciones` | Sí | — |
| 47 | DELETE | `/api/notificaciones/eliminar-notificacion/:id` | Sí | — |
| 48 | GET | `/api/municipios` | Sí | — |
| 49 | POST | `/api/ubicacion/reverse` | Sí | — |
| 50 | GET | `/api/ubicacion` | Sí | — |
| 51 | POST | `/api/ayuda-soporte/envio-correo` | Sí | SOPORTE_BLOCKED |
