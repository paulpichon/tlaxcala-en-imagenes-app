# Documentación de Endpoints — TlaxApp API

**Generado:** 2026-07-07 16:28:00
**Total de endpoints documentados:** 51
**Archivos de rutas explorados:** `routes/bienvenida.js`, `routes/auth.js`, `routes/usuarios.js`, `routes/posteos.js`, `routes/comentarios.js`, `routes/likes.js`, `routes/favoritos.js`, `routes/followers.js`, `routes/notificaciones.js`, `routes/municipios.js`, `routes/ubicacion.js`, `routes/uploads.js`, `routes/soporte.js`
**Endpoints no verificables completamente:** Ninguno
**Nota:** Primera generación de documentación — no hay reporte previo para comparar.

---

# Convenciones generales

- **Base URL (producción):** `https://api.tlaxapp.com`
- **Base URL (desarrollo):** `http://localhost:3000`
- **Formato de error general:**
  ```json
  { "ok": false, "status": <código>, "msg": "<mensaje>", "code": "<CODE>" }
  ```
- **Autenticación:** Doble JWT en cookies httpOnly (`accessToken` 1h + `refreshToken` 7d) con `secure: true, sameSite: 'none'`. El frontend debe incluir `credentials: 'include'` en todas las peticiones.
- **Rate limiting:** 9 limiters definidos en `middlewares/rate-limiter.js`, todos con `validate: false`. Cuando se supera el límite, responden con `status: 429` y un `code` específico.
- **CORS:** Configurado con `origin: process.env.FRONTEND_URL` y `credentials: true`.

---

## Índice de secciones

1. [Bienvenida y Salud](#1-bienvenida-y-salud)
2. [Autenticación (Auth)](#2-autenticación-auth)
3. [Usuarios](#3-usuarios)
4. [Posteos](#4-posteos)
5. [Comentarios](#5-comentarios)
6. [Likes](#6-likes)
7. [Favoritos](#7-favoritos)
8. [Followers (Seguidores)](#8-followers-seguidores)
9. [Notificaciones Web Push](#9-notificaciones-web-push)
10. [Municipios](#10-municipios)
11. [Ubicación (Geolocalización)](#11-ubicación-geolocalización)
12. [Uploads (Imagen de perfil)](#12-uploads-imagen-de-perfil)
13. [Soporte / Ayuda](#13-soporte--ayuda)

---

# 1. Bienvenida y Salud

## [GET] /

**Descripción:** Endpoint raíz de bienvenida. Muestra información básica de la API.
**Archivo de ruta:** `routes/bienvenida.js:6`
**Controlador:** `controllers/bienvenida.js:6` — `getBienvenida`

### Autenticación y permisos
- Requiere token: No
- Middleware de auth: Ninguno
- Roles permitidos: Público

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```
GET /
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "name": "TlaxApp API",
  "status": "online",
  "auth": "required",
  "message": "Esta API requiere autenticación."
}
```

### Códigos de error posibles
Ninguno.

---

## [GET] /api/health

**Descripción:** Endpoint de salud del servidor. Devuelve métricas de memoria, uptime y estado de la BD.
**Archivo de ruta:** `routes/bienvenida.js:7`
**Controlador:** `controllers/bienvenida.js:16` — `getHealth`

### Autenticación y permisos
- Requiere token: No
- Roles permitidos: Público

### Parámetros de entrada
Ninguno.

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": "ok",
  "uptime": 12345.67,
  "timestamp": "2026-07-07T16:00:00.000Z",
  "service": "TlaxApp API",
  "version": "1.0.0",
  "environment": "development",
  "memory": {
    "rss": 12345678,
    "heapTotal": 9876543,
    "heapUsed": 4567890,
    "external": 12345
  },
  "heapUsedPercentage": "46.25%",
  "pid": 1234,
  "db": {
    "status": "connected"
  }
}
```

### Códigos de error posibles
Ninguno.

---

# 2. Autenticación (Auth)

Base path: `/api/auth`

## [GET] /api/auth/verificar-correo{/:token}

**Descripción:** Verifica la cuenta de usuario mediante el token enviado por correo electrónico.
**Archivo de ruta:** `routes/auth.js:26`
**Controlador:** `controllers/auth.js:21` — `verificarCorreo`

### Autenticación y permisos
- Requiere token: No (el token va en la URL)
- Middleware de auth: `validarTokenEnURL` (línea 27) — valida que el token exista en params
- Middleware express-validator: `check('token').isJWT({secretOrKey: proces.env.EMAIL_VERIFICATION_SECRET, algorithms: ['HS256']})` (línea 28)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | token | string | Sí (opcional en ruta con `{/:token}`) | `isJWT({ secretOrKey: process.env.EMAIL_VERIFICATION_SECRET, algorithms: ['HS256'] })` |

### Ejemplo de request
```
GET /api/auth/verificar-correo/eyJhbGciOiJIUzI1NiJ9...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "ok": true,
  "msg": "Correo verificado"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 401 | Token inválido o expirado | `controllers/auth.js:33` |

---

## [POST] /api/auth/reenviar-correo

**Descripción:** Reenvía el correo de verificación de cuenta al usuario.
**Archivo de ruta:** `routes/auth.js:32`
**Controlador:** `controllers/auth.js:40` — `reenviarCorreoVerificacion`

### Autenticación y permisos
- Requiere token: No (pero el body debe contener un token de sesión temporal)
- Middleware: `reenvioCorreoLimiter` (línea 32) — 3 intentos cada 5 minutos, code `EMAIL_BLOCKED`
- Middleware validación: `check('token').isJWT({...})` (línea 33)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | token | string | Sí | `isJWT({ secretOrKey: process.env.EMAIL_VERIFICATION_SECRET, algorithms: ['HS256'] })` |

### Ejemplo de request
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Correo reenviado a usuario@correo.com"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 401 | Correo no existe | `controllers/auth.js:53` |
| 403 | Cuenta ya verificada | `controllers/auth.js:62` |
| 429 | Cooldown de 5 minutos entre reenvíos | `controllers/auth.js:78` |
| 500 | Error interno al validar token | `controllers/auth.js:102` |
| 429 (rate-limit) | Demasiados correos enviados (3 en 5min) | `middlewares/rate-limiter.js:56` |

---

## [POST] /api/auth/login

**Descripción:** Inicio de sesión. Valida credenciales, maneja bloqueo por intentos fallidos, crea tokens JWT duales y establece cookies httpOnly.
**Archivo de ruta:** `routes/auth.js:37`
**Controlador:** `controllers/auth.js:107` — `login`

### Autenticación y permisos
- Requiere token: No
- Middleware: `loginLimiter` (línea 37) — 5 intentos cada 15 minutos, code `LOGIN_BLOCKED`
- Middleware validación: `check('correo').isEmail()`, `check('password').trim().notEmpty()` (líneas 39-41)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | correo | string | Sí | `isEmail()` |
| body | password | string | Sí | `trim().notEmpty()` |

### Ejemplo de request
```json
{
  "correo": "usuario@correo.com",
  "password": "MiPassword123!"
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
- **Cookies establecidas:** `accessToken` (1h), `refreshToken` (7d) — httpOnly, secure, sameSite:none
```json
{
  "status": 200,
  "usuario": {
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": { "nombreEntidad": "Tlaxcala", "claveMunicipio": "29...", ... },
    "correo": "usuario@correo.com",
    "imagen_perfil": { "secure_url": "https://...", "public_id": "..." },
    "genero": "MASCULINO",
    "fecha_nacimiento": "1990-01-15T00:00:00.000Z",
    "fecha_actualizacion": null,
    "url": "juan-perez",
    "uid": "60f...",
    "_id": "60f..."
  },
  "msg": "Login exitoso"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 401 | Credenciales inválidas (correo no existe o password incorrecto) | `controllers/auth.js:114`, `controllers/auth.js:171` |
| 403 | Cuenta no verificada (email_validated=false) | `controllers/auth.js:120` |
| 403 | Cuenta no activada (estatus !== 1) | `controllers/auth.js:126` |
| 429 | Cuenta bloqueada temporalmente (10 intentos fallidos, 30 min) | `controllers/auth.js:136`, `controllers/auth.js:164` |
| 429 (rate-limit) | Demasiados intentos de login | `middlewares/rate-limiter.js:15` |
| 500 | Error interno del servidor | `controllers/auth.js:247` |

### Notas para el Frontend
- Este endpoint establece dos cookies httpOnly. El frontend debe configurar `credentials: 'include'` en fetch/axios.
- El bloqueo por 10 intentos fallidos se resetea después de 30 minutos o si el usuario restablece su contraseña.
- Se envía un correo de notificación al alcanzar el límite de intentos (si `SEND_EMAIL=true`).

---

## [POST] /api/auth/cuentas/password-olvidado

**Descripción:** Envía un correo al usuario con un enlace para restablecer su contraseña.
**Archivo de ruta:** `routes/auth.js:46`
**Controlador:** `controllers/auth.js:327` — `envioCorreoReestablecerPassword`

### Autenticación y permisos
- Requiere token: No
- Middleware: `recoveryLimiter` (línea 46) — 3 intentos cada 15 minutos, code `RECOVERY_BLOCKED`
- Middleware validación: `check('correo').isEmail()` (línea 48)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | correo | string | Sí | `isEmail()` |

### Ejemplo de request
```json
{
  "correo": "usuario@correo.com"
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 429 (rate-limit) | Demasiados intentos de recuperación | `middlewares/rate-limiter.js:39` |
| 500 | Error interno del servidor | `controllers/auth.js:332` |

### Notas para el Frontend
- El endpoint SIEMPRE responde con el mismo mensaje (incluso si el correo no existe) por seguridad — no revela si el correo está registrado.
- El `token` en la respuesta es para sessionStorage del frontend, NO para restablecer la contraseña.
- Cooldown de 5 minutos entre reenvíos para el mismo correo (controlado internamente, no por rate-limiter).

---

## [POST] /api/auth/reenviar-correo-restablecer-password

**Descripción:** Reenvía el correo para restablecer contraseña usando un token JWT.
**Archivo de ruta:** `routes/auth.js:53`
**Controlador:** `controllers/auth.js:336` — `reenvioCorreoRestablecerPassword`

### Autenticación y permisos
- Requiere token: Sí (en body)
- Middleware: `recoveryLimiter` (línea 53)
- Middleware validación: `check('token').isJWT({secretOrKey: process.env.RESET_PASSWORD_SECRET, algorithms: ['HS256']})` (línea 54)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | token | string | Sí | `isJWT({ secretOrKey: process.env.RESET_PASSWORD_SECRET, algorithms: ['HS256'] })` |

### Ejemplo de request
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 500 | Error interno (token inválido o error de servidor) | `controllers/auth.js:342` |
| 429 (rate-limit) | Demasiados intentos | `middlewares/rate-limiter.js:39` |

---

## [GET] /api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}

**Descripción:** Valida que el token de restablecimiento de contraseña sea correcto y no haya expirado.
**Archivo de ruta:** `routes/auth.js:58`
**Controlador:** `controllers/auth.js:348` — `validarTokenRestablecerPassword`

### Autenticación y permisos
- Requiere token: No (el token va en la URL)
- Middleware: `validarTokenEnURL`, `check('token').isJWT(...)`, `validarCampos` (líneas 59-61)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | token | string | Sí (opcional en ruta) | `isJWT({ secretOrKey: process.env.RESET_PASSWORD_SECRET, algorithms: ['HS256'] })` |

### Ejemplo de request
```
GET /api/auth/cuentas/restablecer-password/validar-token-reset-password/eyJhbGciOiJIUzI1NiJ9...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Token válido",
  "valid": true
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 400 | Token no presente en URL | `middlewares/validar-token-en-url.js:4` |
| 401 | Token inválido, expirado o no coincide con BD | `controllers/auth.js:352`, `361`, `366` |
| 403 | Cuenta no verificada o no activada | `controllers/auth.js:371`, `376` |
| 500 | Error al validar token | `controllers/auth.js:389` |

---

## [POST] /api/auth/cuentas/reestablecer-password{/:token}

**Descripción:** Restablece la contraseña del usuario usando el token del correo y la nueva contraseña.
**Archivo de ruta:** `routes/auth.js:64`
**Controlador:** `controllers/auth.js:398` — `reestablecerPassword`

### Autenticación y permisos
- Requiere token: No (token en URL)
- Middleware validación: `check('password', ...).trim().isLength({ min: 8 })` (línea 66)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | token | string | Sí | Token JWT con `RESET_PASSWORD_SECRET` |
| body | password | string | Sí | `trim().isLength({ min: 8 })` |

### Ejemplo de request
```
POST /api/auth/cuentas/reestablecer-password/eyJhbGciOiJIUzI1NiJ9...
```
```json
{
  "password": "MiNuevaPass123!"
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Password reestablecido"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 500 | Error al reestablecer contraseña | `controllers/auth.js:414` |

---

## [POST] /api/auth/refresh

**Descripción:** Renueva el accessToken y refreshToken usando el refreshToken de las cookies. Implementa rotación de tokens y detección de reuso.
**Archivo de ruta:** `routes/auth.js:71`
**Controlador:** `controllers/auth.js:418` — `refreshToken`

### Autenticación y permisos
- Requiere token: Sí (refreshToken en cookies)
- Middleware: `refreshLimiter` (línea 71) — 10 intentos cada 15 minutos, code `REFRESH_BLOCKED`

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Origen |
|---|---|---|---|---|
| cookies | refreshToken | string | Sí | Cookie httpOnly |

### Ejemplo de request
```
POST /api/auth/refresh
Cookie: refreshToken=eyJhbGciOiJIUzI1NiJ9...
```

### Ejemplo de response — éxito
- Código de estado: `200`
- **Cookies actualizadas:** Nuevos `accessToken` y `refreshToken`
```json
{
  "status": 200,
  "msg": "Token renovado"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 401 | No hay cookies de sesión | `controllers/auth.js:425` |
| 401 | Reuso de refresh token detectado — sesión comprometida | `controllers/auth.js:447` |
| 403 | Token no registrado en BD | `controllers/auth.js:453` |
| 403 | Refresh token expirado o inválido (sin body, solo status) | `controllers/auth.js:516` |
| 429 (rate-limit) | Demasiadas renovaciones | `middlewares/rate-limiter.js:157` |

### Notas para el Frontend
- Si el refresh falla con 401/403, el frontend debe redirigir al login.
- Este endpoint implementa detección de reuso de refresh token (invalida todas las sesiones si se detecta un token robado siendo usado).

---

## [POST] /api/auth/logout

**Descripción:** Cierra la sesión del usuario: elimina las cookies y borra el refresh token de la BD.
**Archivo de ruta:** `routes/auth.js:73`
**Controlador:** `controllers/auth.js:520` — `logout`

### Autenticación y permisos
- Requiere refreshToken: Sí
- Middleware: `validarRefreshToken` (línea 75) — verifica que exista refreshToken en cookies

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| cookies | refreshToken | string | Sí |

### Ejemplo de request
```
POST /api/auth/logout
Cookie: refreshToken=eyJhbGciOiJIUzI1NiJ9...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Sesión cerrada"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 400 | No hay refreshToken en la petición | `middlewares/validar-jwt-cookies-sesion.js:66` |

---

## [GET] /api/auth/me

**Descripción:** Obtiene los datos del usuario autenticado mediante su accessToken.
**Archivo de ruta:** `routes/auth.js:78`
**Controlador:** `controllers/auth.js:251` — `getMe`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion` (línea 80)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| cookies | accessToken | string | Sí |

### Ejemplo de request
```
GET /api/auth/me
Cookie: accessToken=eyJhbGciOiJIUzI1NiJ9...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Usuario obtenido",
  "ok": true,
  "usuario": {
    "_id": "60f...",
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": { ... },
    "imagen_perfil": { "secure_url": "...", "public_id": "..." },
    "correo": "usuario@correo.com",
    "url": "juan-perez",
    "genero": "MASCULINO",
    "fecha_nacimiento": "1990-01-15T00:00:00.000Z"
  }
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 401 | No hay token / token inválido / usuario no existe / cuenta no activada | `middlewares/validar-jwt-cookies-sesion.js:13` |
| 404 | Usuario no encontrado o eliminado (estatus 4) | `controllers/auth.js:260` |
| 500 | Error interno del servidor | `controllers/auth.js:274` |

---

# 3. Usuarios

Base path: `/api/usuarios`

## [GET] /api/usuarios/

**Descripción:** Obtiene todos los usuarios de la aplicación. Actualmente no implementado (devuelve mensaje fijo).
**Archivo de ruta:** `routes/usuarios.js:19`
**Controlador:** `controllers/usuarios.js:30` — `usuariosGet`

### Autenticación y permisos
- Requiere token: No
- Middleware: `lecturaLimiter` (línea 19) — 100 solicitudes cada 15 minutos, code `READ_BLOCKED`

### Parámetros de entrada
Ninguno.

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "msg": "DE MOMENTO ESTA API PARA MOSTRAR A LOS USUARIOS NO SE VA A OCUPAR"
}
```

---

## [GET] /api/usuarios/:url

**Descripción:** Obtiene el perfil público de un usuario por su URL (slug), incluyendo total de posteos, seguidores, seguidos, y si el usuario autenticado lo sigue.
**Archivo de ruta:** `routes/usuarios.js:21`
**Controlador:** `controllers/usuarios.js:38` — `usuarioGet`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion` (línea 23), `check('url').trim()`, `validarUrlUsuario`, `validarCampos` (líneas 25-29)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | url | string | Sí | `trim()` + `validarUrlUsuario` (busca existencia en BD) |

### Ejemplo de request
```
GET /api/usuarios/juan-perez
Cookie: accessToken=eyJhbGciOiJIUzI1NiJ9...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "usuario": {
    "_id": "60f...",
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": { ... },
    "imagen_perfil": { "secure_url": "...", "public_id": "..." },
    "url": "juan-perez",
    "totalPosteos": 5,
    "totalSeguidores": 10,
    "totalSeguidos": 3,
    "isFollowing": true
  }
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 400 | Token no presente en URL | `middlewares/validar-url-usuario.js` |
| 401 | Token inválido / no hay token | `middlewares/validar-jwt-cookies-sesion.js:13` |
| 404 | URL de usuario no encontrada | `middlewares/validar-url-usuario.js` |

---

## [POST] /api/usuarios/

**Descripción:** Registra un nuevo usuario. Envía correo de verificación y devuelve un token temporal para sessionStorage.
**Archivo de ruta:** `routes/usuarios.js:33`
**Controlador:** `controllers/usuarios.js:83` — `usuariosPost`

### Autenticación y permisos
- Requiere token: No
- Middleware: `registroLimiter` (línea 33) — 3 registros por hora, code `REGISTER_BLOCKED`
- Middleware validación: múltiples `check()` (líneas 35-52)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | nombre_completo.nombre | string | Sí | `trim().notEmpty()` |
| body | nombre_completo.apellido | string | Sí | `trim().notEmpty()` |
| body | correo | string | Sí | `isEmail()` + `custom(validarCorreoUsuario)` (verifica unicidad) |
| body | password | string | Sí | `trim().isLength({ min: 8 })` + debe contener mayúscula, minúscula, número y carácter especial `!@#$%^&*(),.?":{}|<>_-+=\[\]` |
| body | estatus | number | No | `optional().trim().isNumeric()` |
| body | intentos_login | number | No | `optional().trim().isNumeric()` |

### Ejemplo de request
```json
{
  "nombre_completo": {
    "nombre": "Juan",
    "apellido": "Pérez"
  },
  "correo": "usuario@correo.com",
  "password": "MiPassword123!"
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 400 | Validaciones fallidas (nombre, apellido, correo, password) | `middlewares/validar-campos.js` |
| 400 | El correo ya está registrado | `helpers/validar-correo-usuario.js` |
| 429 (rate-limit) | Demasiadas cuentas creadas (3 por hora) | `middlewares/rate-limiter.js:73` |
| 500 | Error al procesar la solicitud | `controllers/usuarios.js:134` |

### Notas para el Frontend
- El `token` en la respuesta debe guardarse en sessionStorage para usarlo en la página de "registro exitoso" y en el reenvío de correo.
- La imagen de perfil por defecto se asigna automáticamente desde Cloudinary (URL default).

---

## [PUT] /api/usuarios/update

**Descripción:** Actualiza los datos del perfil del usuario autenticado. No permite actualizar correo ni imagen de perfil.
**Archivo de ruta:** `routes/usuarios.js:60`
**Controlador:** `controllers/usuarios.js:144` — `usuariosPut`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion` (línea 62)
- Middleware validación: múltiples `check()` con `.optional()` (líneas 64-79)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | nombre_completo.nombre | string | No | `optional().trim().notEmpty()` |
| body | nombre_completo.apellido | string | No | `optional().trim().notEmpty()` |
| body | password | string | No | `optional().trim().isLength({ min: 8 })` |
| body | lugar_radicacion.nombreEntidad | string | No | `optional().notEmpty()` |
| body | lugar_radicacion.claveMunicipio | string | No | `optional().notEmpty()` |
| body | lugar_radicacion.nombreMunicipio | string | No | `optional().notEmpty()` |
| body | genero | string | No | `optional().isIn(['MASCULINO', 'FEMENINO', 'PREFIERO NO DECIR'])` |
| body | fecha_nacimiento | string (date) | No | `optional().isDate()` |

**Whitelist de campos permitidos** (controllers/usuarios.js:22-27): `nombre_completo`, `lugar_radicacion`, `genero`, `fecha_nacimiento`. Cualquier otro campo en el body es ignorado.

### Ejemplo de request
```json
{
  "nombre_completo": {
    "nombre": "Juan Updated",
    "apellido": "Pérez"
  },
  "genero": "MASCULINO",
  "fecha_nacimiento": "1990-05-20"
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Usuario actualizado",
  "usuario": {
    "_id": "60f...",
    "nombre_completo": { "nombre": "Juan Updated", "apellido": "Pérez" },
    "lugar_radicacion": { ... },
    "correo": "usuario@correo.com",
    "url": "juan-perez",
    "genero": "MASCULINO",
    "fecha_nacimiento": "1990-05-20T00:00:00.000Z"
  }
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 401 | Token inválido / no hay token | `middlewares/validar-jwt-cookies-sesion.js:13` |
| 500 | Error al procesar solicitud | `controllers/usuarios.js:175` |

---

## [DELETE] /api/usuarios/delete

**Descripción:** Elimina la cuenta del usuario (soft delete con transacción atómica). Marca como eliminados también los posteos, likes, follows, notificaciones, favoritos y comentarios relacionados.
**Archivo de ruta:** `routes/usuarios.js:82`
**Controlador:** `controllers/usuarios.js:186` — `usuariosDelete`

### Autenticación y permisos
- Requiere token: Sí (accessToken + refreshToken en cookies)
- Middleware: `verificarTokenSesion` (línea 84)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| cookies | accessToken | string | Sí |
| cookies | refreshToken | string | Sí (validado internamente en controlador) |

### Ejemplo de request
```
DELETE /api/usuarios/delete
Cookie: accessToken=eyJ...; refreshToken=eyJ...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Cuenta eliminada exitosamente. Tus datos serán eliminados permanentemente en unos días."
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 403 | No hay refreshToken en cookies | `controllers/usuarios.js:202` |
| 404 | Usuario no encontrado | `controllers/usuarios.js:217` |
| 400 | Cuenta ya eliminada previamente | `controllers/usuarios.js:228` |
| 500 | Error durante la transacción | `controllers/usuarios.js:379` |

---

## [GET] /api/usuarios/registrados/nuevos-usuarios-registrados

**Descripción:** Obtiene los últimos 3 usuarios registrados (excluyendo al usuario logueado), con información de si el usuario autenticado los sigue.
**Archivo de ruta:** `routes/usuarios.js:87`
**Controlador:** `controllers/usuarios.js:395` — `nuevosUsuariosRegistrados`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion` (línea 89)

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```
GET /api/usuarios/registrados/nuevos-usuarios-registrados
Cookie: accessToken=eyJ...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Nuevos Usuarios Registrados",
  "nuevosUsuariosRegistrados": [
    {
      "_id": "60f...",
      "nombre_completo": { "nombre": "María", "apellido": "García" },
      "url": "maria-garcia",
      "imagen_perfil": { "secure_url": "...", "public_id": null },
      "isFollowing": false
    }
  ]
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 401 | Token inválido / no hay token | `middlewares/validar-jwt-cookies-sesion.js:13` |
| 500 | Error al obtener los nuevos usuarios | `controllers/usuarios.js:463` |

---

# 4. Posteos

Base path: `/api/posteos`

## [GET] /api/posteos/

**Descripción:** Obtiene los últimos 15 posteos públicos de otros usuarios (excluye al usuario logueado). Incluye información de paginación, si el usuario sigue al autor y si el posteo está en favoritos.
**Archivo de ruta:** `routes/posteos.js:30`
**Controlador:** `controllers/posteos.js:13` — `posteosGet`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `lecturaLimiter` (línea 30), `verificarTokenSesion` (línea 32)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | page | number | No (default: 1) | `optional().isNumeric()` |
| query | limite | number | No (default: 15) | `optional().isNumeric()` |

### Ejemplo de request
```
GET /api/posteos/?page=1&limite=15
Cookie: accessToken=eyJ...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "page": "1",
  "next": "/api/posteos?page=2&limite=15",
  "prev": null,
  "limite": 15,
  "total_registros": 50,
  "mostrando": 15,
  "posteosConEstado": [
    {
      "_id": "60f...",
      "ubicacion": { ... },
      "public_id": "posts/usuario123/abc123",
      "texto": "Texto del posteo",
      "fecha_creacion": "2026-07-07T12:00:00.000Z",
      "comentariosActivos": true,
      "_idUsuario": {
        "_id": "60f...",
        "nombre_completo": { "nombre": "Autor", "apellido": "Apellido" },
        "url": "autor-url",
        "imagen_perfil": { "public_id": "..." }
      },
      "isFollowing": false,
      "isFavorito": true
    }
  ]
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 401 | Token inválido / no hay token | `middlewares/validar-jwt-cookies-sesion.js:13` |
| 429 (rate-limit) | Demasiadas solicitudes de lectura | `middlewares/rate-limiter.js:124` |
| 400 | Error al obtener posteos | `controllers/posteos.js:87` |

---

## [GET] /api/posteos/post/:id

**Descripción:** Obtiene un posteo específico por su ID. Incluye datos del autor, y si el usuario autenticado sigue al autor o tiene el posteo en favoritos.
**Archivo de ruta:** `routes/posteos.js:40`
**Controlador:** `controllers/posteos.js:91` — `posteoGet`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, `check('id').isMongoId()`, `check('id').custom(validarIdPosteo)`, `validarCampos` (líneas 42-48)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | id | string (MongoId) | Sí | `isMongoId()` + `custom(validarIdPosteo)` |

### Ejemplo de request
```
GET /api/posteos/post/60f...
Cookie: accessToken=eyJ...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "posteo": {
    "_id": "60f...",
    "_idUsuario": {
      "_id": "60f...",
      "nombre_completo": { "nombre": "Autor", "apellido": "..." },
      "imagen_perfil": { "public_id": "..." },
      "url": "autor-url"
    },
    "public_id": "posts/...",
    "secure_url": "https://res.cloudinary.com/...",
    "texto": "Texto del posteo",
    "fecha_creacion": "2026-07-07T12:00:00.000Z",
    "comentariosCount": 3,
    "comentariosActivos": true,
    "ubicacion": { ... }
  },
  "isFollowing": false,
  "isFavorito": true
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 401 | Token inválido / no hay token | `middlewares/validar-jwt-cookies-sesion.js:13` |
| 400 | ID no válido / posteo no encontrado | `controllers/posteos.js:135` |

---

## [GET] /api/posteos/usuario/:idUsuario

**Descripción:** Obtiene todos los posteos de un usuario específico por su ID, con paginación.
**Archivo de ruta:** `routes/posteos.js:52`
**Controlador:** `controllers/posteos.js:139` — `posteosUsuarioGet`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, `check('idUsuario').isMongoId()`, `check('idUsuario').custom(validarIdUsuario)` (líneas 54-58)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | idUsuario | string (MongoId) | Sí | `isMongoId()` + `custom(validarIdUsuario)` |
| query | page | number | No (default: 1) | `optional().isNumeric()` |
| query | limite | number | No (default: 15) | `optional().isNumeric()` |

### Ejemplo de request
```
GET /api/posteos/usuario/60f...?page=1&limite=15
Cookie: accessToken=eyJ...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "page": 1,
  "next": "/api/posteos/usuario/60f...?page=2&limite=15",
  "prev": null,
  "limite": 15,
  "total_registros": 3,
  "mostrando": 3,
  "posteos": [
    {
      "_id": "60f...",
      "public_id": "posts/...",
      "secure_url": "https://res.cloudinary.com/..."
    }
  ]
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 401 | Token inválido | `middlewares/validar-jwt-cookies-sesion.js:13` |
| 400 | ID de usuario inválido / error al obtener posteos | `controllers/posteos.js:181` |

---

## [POST] /api/posteos/

**Descripción:** Crea un nuevo posteo con imagen (requerida) y texto opcional. La imagen se sube a Cloudinary.
**Archivo de ruta:** `routes/posteos.js:66`
**Controlador:** `controllers/posteos.js:188` — `posteosPost`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware (en orden): `posteoLimiter` (20 por 15min), `verificarTokenSesion`, `upload.single('img')`, `validarCampoImg`, `validarImagenesMulter`, `validarTexto`, validaciones de `posteo_publico`, `lat`, `lng`, `validarCampos` (líneas 66-86)

### Parámetros de entrada (multipart/form-data)
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| file (formdata) | img | file | Sí | Solo imágenes jpg/jpeg/png/webp, max 5MB. Multer con memoryStorage |
| body (formdata) | texto | string | No | Regex: `/^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ.,!?¡¿()\s-]*$/` |
| body (formdata) | posteo_publico | boolean | No (default: true) | `optional().isBoolean()` |
| body (formdata) | municipio | string | No | — |
| body (formdata) | ciudad | string | No | — |
| body (formdata) | estado | string | No | — |
| body (formdata) | pais | string | No (default: "México") | — |
| body (formdata) | lat | number | No | `optional().isFloat()` |
| body (formdata) | lng | number | No | `optional().isFloat()` |

### Ejemplo de request
```
POST /api/posteos/
Content-Type: multipart/form-data
Cookie: accessToken=eyJ...

--boundary
Content-Disposition: form-data; name="img"; filename="foto.jpg"
Content-Type: image/jpeg

[binary data]
--boundary
Content-Disposition: form-data; name="texto"

Mi primer posteo en TlaxApp
--boundary
Content-Disposition: form-data; name="posteo_publico"

true
--boundary--
```

### Ejemplo de response — éxito
- Código de estado: `201`
```json
{
  "status": 201,
  "msg": "Posteo creado correctamente"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 400 | Extensiones/MIME no válidos | `helpers/multer.js:21-27` |
| 400 | Imagen excede 5MB | `middlewares/validar-imagen-posteo.js:5` |
| 400 | Campo de texto con caracteres no permitidos | `middlewares/validar-texto.js:24` |
| 404 | No hay imagen para subir | `middlewares/validar-imagen-posteo.js:16` |
| 401 | Token inválido | `middlewares/validar-jwt-cookies-sesion.js:13` |
| 429 (rate-limit) | Demasiados posteos (20 en 15min) | `middlewares/rate-limiter.js:89` |
| 500 | Error interno al procesar publicación | `controllers/posteos.js:266` |

---

## [PUT] /api/posteos/:id

**Descripción:** Actualiza un posteo existente (texto, visibilidad, ubicación). Solo el dueño del posteo puede modificarlo.
**Archivo de ruta:** `routes/posteos.js:88`
**Controlador:** `controllers/posteos.js:270` — `posteosPut`

### Autenticación y permisos
- Requiere token: Sí
- Middleware: `verificarTokenSesion`, `check('id').isMongoId()`, `check('id').custom(validarIdPosteo)`, `validarTexto`, `validarCampos` (líneas 90-98)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | id | string (MongoId) | Sí | `isMongoId()` + `custom(validarIdPosteo)` |
| body | texto | string | No | Regex: `/^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ.,!?¡¿()\s-]*$/` |
| body | posteo_publico | boolean | No | Se convierte de string a boolean |
| body | municipio | string | No | Si se envía `null` junto con `lat=null`, se elimina la ubicación |
| body | ciudad | string | No | — |
| body | estado | string | No | — |
| body | pais | string | No (default: "México") | — |
| body | lat | number | No | — |
| body | lng | number | No | — |

### Ejemplo de request
```json
{
  "texto": "Texto actualizado del posteo"
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Posteo actualizado correctamente",
  "posteo": { ... }
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 403 | No tienes permiso para modificar este posteo | `controllers/posteos.js:341` |
| 400 | Error al actualizar, verifica datos | `controllers/posteos.js:356` |

---

## [DELETE] /api/posteos/:id

**Descripción:** Elimina un posteo (soft delete). Solo el dueño del posteo puede eliminarlo.
**Archivo de ruta:** `routes/posteos.js:101`
**Controlador:** `controllers/posteos.js:363` — `posteosDelete`

### Autenticación y permisos
- Requiere token: Sí
- Middleware: `verificarTokenSesion`, `check('id').isMongoId()`, `check('id').custom(validarIdPosteo)`, `validarCampos` (líneas 103-109)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| params | id | string (MongoId) | Sí |

### Ejemplo de request
```
DELETE /api/posteos/60f...
Cookie: accessToken=eyJ...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Posteo con imagen eliminado correctamente"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 403 | No tienes permiso para eliminar este posteo | `controllers/posteos.js:377` |
| 400 | Error al eliminar el posteo | `controllers/posteos.js:388` |

---

# 5. Comentarios

Base path: `/api/comentarios`

## [POST] /api/comentarios/:posteoId/comentarios

**Descripción:** Agrega un comentario a un posteo. Dispara notificación push y/o correo al autor del posteo si es el primer comentario.
**Archivo de ruta:** `routes/comentarios.js:16`
**Controlador:** `controllers/comentarios.js:10` — `agregarComentario`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `comentarioLimiter` (10 por minuto), `verificarTokenSesion`, validaciones (líneas 17-22)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | posteoId | string (MongoId) | Sí | `isMongoId()` + `custom(validarIdPosteo)` |
| body | texto | string | No (opcional) | `optional().notEmpty()` + `isLength({ max: 250 })` |

### Ejemplo de request
```json
{
  "texto": "¡Qué bonita foto!"
}
```

### Ejemplo de response — éxito
- Código de estado: `201`
```json
{
  "ok": true,
  "status": 201,
  "msg": "Comentario agregado",
  "comentario": {
    "_id": "60f...",
    "texto": "¡Qué bonita foto!",
    "posteoId": "60f...",
    "autorId": "60f...",
    "isDeleted": false,
    "createdAt": "2026-07-07T16:00:00.000Z",
    "updatedAt": "2026-07-07T16:00:00.000Z"
  }
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 404 | El posteo no existe o fue eliminado | `controllers/comentarios.js:21`, `:29` |
| 403 | Los comentarios están desactivados en este posteo | `controllers/comentarios.js:37` |
| 429 (rate-limit) | Demasiados comentarios (10 por minuto) | `middlewares/rate-limiter.js:140` |
| 500 | Error al agregar comentario | `controllers/comentarios.js:127` |

---

## [GET] /api/comentarios/:posteoId/comentarios

**Descripción:** Obtiene los comentarios de un posteo con paginación y datos del autor.
**Archivo de ruta:** `routes/comentarios.js:25`
**Controlador:** `controllers/comentarios.js:131` — `obtenerComentarios`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, validaciones (líneas 26-31)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | posteoId | string (MongoId) | Sí | `isMongoId()` + `custom(validarIdPosteo)` |
| query | page | number | No (default: 1) | `optional().isNumeric()` |
| query | limit | number | No (default: 10, max: 100) | `optional().isNumeric()` |

### Ejemplo de request
```
GET /api/comentarios/60f.../comentarios?page=1&limit=10
Cookie: accessToken=eyJ...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "ok": true,
  "status": 200,
  "page": 1,
  "limit": 10,
  "next": "/api/comentarios/60f.../comentarios/?page=2&limit=10",
  "prev": null,
  "total": 25,
  "totalPages": 3,
  "comentarios": [
    {
      "_id": "60f...",
      "texto": "¡Qué bonita foto!",
      "createdAt": "2026-07-07T16:00:00.000Z",
      "autorId": {
        "_id": "60f...",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "imagen_perfil": { "secure_url": "...", "public_id": "..." },
        "url": "juan-perez"
      }
    }
  ]
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 401 | Token inválido / no hay token |
| 500 | Error al obtener comentarios |

---

## [GET] /api/comentarios/:posteoId/comentarios/count

**Descripción:** Obtiene el conteo total de comentarios de un posteo.
**Archivo de ruta:** `routes/comentarios.js:34`
**Controlador:** `controllers/comentarios.js:205` — `obtenerCountComentarios`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, validaciones (líneas 35-38)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| params | posteoId | string (MongoId) | Sí |

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "ok": true,
  "status": 200,
  "count": 5
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 404 | El posteo no existe |

---

## [DELETE] /api/comentarios/:comentarioId

**Descripción:** Elimina un comentario (soft delete). Puede hacerlo el autor del comentario o el dueño del posteo.
**Archivo de ruta:** `routes/comentarios.js:41`
**Controlador:** `controllers/comentarios.js:238` — `eliminarComentario`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, `check('comentarioId').isMongoId()`, `validarCampos` (líneas 42-44)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| params | comentarioId | string (MongoId) | Sí |

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "ok": true,
  "status": 200,
  "msg": "Comentario eliminado"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 404 | El comentario no existe | `controllers/comentarios.js:253` |
| 400 | El comentario ya fue eliminado | `controllers/comentarios.js:253` |
| 403 | No tienes permisos para eliminar este comentario | `controllers/comentarios.js:276` |
| 500 | Error al eliminar comentario | `controllers/comentarios.js:320` |

---

## [PUT] /api/comentarios/:posteoId/comentarios/toggle

**Descripción:** Activa o desactiva los comentarios de un posteo. Solo el dueño del posteo puede hacer esta acción.
**Archivo de ruta:** `routes/comentarios.js:47`
**Controlador:** `controllers/comentarios.js:328` — `toggleComentariosPosteo`

### Autenticación y permisos
- Requiere token: Sí
- Middleware: `verificarTokenSesion`, validaciones (líneas 48-52)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | posteoId | string (MongoId) | Sí | `isMongoId()` + `custom(validarIdPosteo)` |
| body | activar | boolean | Sí | `isBoolean({ strict: true })` |

### Ejemplo de request
```json
{
  "activar": false
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "ok": true,
  "status": 200,
  "msg": "Comentarios desactivados",
  "comentariosActivos": false
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 403 | Solo el dueño del posteo puede modificar los comentarios | `controllers/comentarios.js:346` |
| 404 | El posteo no existe | `controllers/comentarios.js:346` |
| 500 | Error al modificar comentarios | `controllers/comentarios.js:359` |

---

# 6. Likes

Base path: `/api/likes`

## [POST] /api/likes/:id/like

**Descripción:** Da like o quita like (toggle) a un posteo. Si ya existe un like, lo elimina; si no, lo crea.
**Archivo de ruta:** `routes/likes.js:11`
**Controlador:** `controllers/likes.js:10` — `likeDislikePosteo`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, `check('id').isMongoId()`, `check('id').custom(validarIdPosteo)`, `validarCampos` (líneas 12-19)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| params | id | string (MongoId) | Sí |

### Ejemplo de request
```
POST /api/likes/60f.../like
Cookie: accessToken=eyJ...
```

### Ejemplo de response — éxito (like añadido)
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Like añadido"
}
```

### Ejemplo de response — éxito (like eliminado)
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Like eliminado"
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 404 | Posteo no encontrado |
| 400 | Error al generar el like |

---

## [GET] /api/likes/posteo/:id

**Descripción:** Obtiene el número total de likes de un posteo.
**Archivo de ruta:** `routes/likes.js:22`
**Controlador:** `controllers/likes.js:52` — `getLikesPosteos`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, validaciones (líneas 23-30)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| params | id | string (MongoId) | Sí |

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "likes": 15,
  "posteo": "60f..."
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 400 | Error al obtener número de likes |

---

## [GET] /api/likes/:id/likes/usuarios

**Descripción:** Obtiene los datos de los usuarios que dieron like a un posteo.
**Archivo de ruta:** `routes/likes.js:34`
**Controlador:** `controllers/likes.js:68` — `getLikesUsuariosPosteos`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, validaciones (líneas 35-42)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| params | id | string (MongoId) | Sí |

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Likes de usuarios a posteo obtenidos correctamente",
  "likes_usuarios_posteo": [
    {
      "_id": "60f...",
      "_idUsuario": {
        "_id": "60f...",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "imagen_perfil": { "secure_url": "...", "public_id": "..." },
        "url": "juan-perez"
      }
    }
  ]
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 400 | Error al obtener usuarios que dieron like |

---

# 7. Favoritos

Base path: `/api/favoritos`

## [GET] /api/favoritos/

**Descripción:** Obtiene los posteos guardados como favoritos por el usuario autenticado, con paginación.
**Archivo de ruta:** `routes/favoritos.js:13`
**Controlador:** `controllers/favoritos.js:8` — `obtenerFavoritosUsuario`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion` (línea 15)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | page | number | No (default: 1) | `optional().isNumeric()` |
| query | limite | number | No (default: 15) | `optional().isNumeric()` |

### Ejemplo de request
```
GET /api/favoritos/?page=1&limite=15
Cookie: accessToken=eyJ...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "page": 1,
  "next": "/api/favoritos?page=2&limite=15",
  "prev": null,
  "limite": 15,
  "total_registros": 3,
  "mostrando": 3,
  "favoritos": [
    {
      "_id": "60f...",
      "createdAt": "2026-07-07T16:00:00.000Z",
      "posteoId": {
        "public_id": "posts/...",
        "posteo_publico": true
      },
      "autorId": {
        "_id": "60f...",
        "nombre_completo": { "nombre": "Autor", "apellido": "..." },
        "url": "autor-url"
      }
    }
  ]
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 401 | Token inválido |
| 500 | Error al obtener favoritos |

---

## [POST] /api/favoritos/:posteoId

**Descripción:** Agrega un posteo a favoritos. No permite agregar posteos propios ni duplicados.
**Archivo de ruta:** `routes/favoritos.js:24`
**Controlador:** `controllers/favoritos.js:88` — `agregarPosteoFavorito`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, validaciones (líneas 25-36)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | posteoId | string (MongoId) | Sí | `isMongoId()` + `custom(validarIdPosteo)` |
| body | autorId | string (MongoId) | Sí | `isMongoId()` + `custom(validarIdUsuario)` |

### Ejemplo de request
```json
{
  "autorId": "60f..."
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Agregado en Favoritos"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 400 | No puedes agregar a favoritos tus propios posteos | `controllers/favoritos.js:103` |
| 400 | Este posteo ya está en tus favoritos | `controllers/favoritos.js:123` |
| 500 | Error al procesar la petición | `controllers/favoritos.js:135` |

---

## [DELETE] /api/favoritos/:posteoId

**Descripción:** Elimina un posteo de favoritos.
**Archivo de ruta:** `routes/favoritos.js:40`
**Controlador:** `controllers/favoritos.js:140` — `eliminarPosteoFavorito`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, validaciones (líneas 41-48)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| params | posteoId | string (MongoId) | Sí |

### Ejemplo de request
```
DELETE /api/favoritos/60f...
Cookie: accessToken=eyJ...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Eliminado de Favoritos"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 404 | El posteo no existe en favoritos | `controllers/favoritos.js:150` |
| 500 | Error al procesar la petición | `controllers/favoritos.js:161` |

---

# 8. Followers (Seguidores)

Base path: `/api/followers`

## [POST] /api/followers/follow/:id

**Descripción:** Sigue a un usuario. Crea una relación de follow y una notificación. Dispara notificación push al usuario seguido.
**Archivo de ruta:** `routes/followers.js:14`
**Controlador:** `controllers/followers.js:8` — `followUsuario`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, `check('id').isMongoId()`, `check('id').custom(validarIdUsuario)`, `validarCampos` (líneas 15-23)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| params | id | string (MongoId) | Sí |

### Ejemplo de request
```
POST /api/followers/follow/60f...
Cookie: accessToken=eyJ...
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Has comenzado a seguir a este usuario",
  "success": true
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 400 | No puedes seguirte a ti mismo | `controllers/followers.js:18` |
| 400 | Ya sigues a este usuario | `controllers/followers.js:38` |
| 404 | El usuario que intentas seguir no existe | `controllers/followers.js:45` |
| 500 | Error al seguir a un usuario | `controllers/followers.js:121` |

---

## [DELETE] /api/followers/unfollow/:id

**Descripción:** Deja de seguir a un usuario.
**Archivo de ruta:** `routes/followers.js:27`
**Controlador:** `controllers/followers.js:126` — `unfollowUsuario`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, validaciones (líneas 28-36)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| params | id | string (MongoId) | Sí |

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Dejaste de seguir a este usuario"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 400 | No sigues a este usuario | `controllers/followers.js:141` |
| 500 | Error al dejar de seguir | `controllers/followers.js:152` |

---

## [GET] /api/followers/usuario/lista-followers/:id

**Descripción:** Obtiene la lista de seguidores de un perfil de usuario, indicando si el usuario autenticado sigue a cada seguidor.
**Archivo de ruta:** `routes/followers.js:39`
**Controlador:** `controllers/followers.js:157` — `obtenerFollowers`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, validaciones (líneas 40-48)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| params | id | string (MongoId) | Sí |

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Seguidores obtenidos correctamente",
  "totalSeguidores": 10,
  "seguidores": [
    {
      "follower": {
        "_id": "60f...",
        "nombre_completo": { "nombre": "María", "apellido": "García" },
        "imagen_perfil": { ... },
        "url": "maria-garcia"
      },
      "isFollowing": true
    }
  ]
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 500 | Error al obtener seguidores |

---

## [GET] /api/followers/usuario/lista-followings/:id

**Descripción:** Obtiene la lista de usuarios que sigue un perfil de usuario, indicando si el usuario autenticado también los sigue.
**Archivo de ruta:** `routes/followers.js:51`
**Controlador:** `controllers/followers.js:202` — `obtenerFollowings`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, validaciones (líneas 52-59)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| params | id | string (MongoId) | Sí |

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Usuarios seguidos, obtenidos correctamente",
  "totalSeguidos": 5,
  "siguiendo": [
    {
      "_id": "60f...",
      "following": {
        "_id": "60f...",
        "nombre_completo": { "nombre": "Pedro", "apellido": "López" },
        "imagen_perfil": { ... },
        "url": "pedro-lopez"
      },
      "isFollowing": true
    }
  ]
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 500 | Error en obtener followings |

---

# 9. Notificaciones Web Push

Base path: `/api/notificaciones`

## [POST] /api/notificaciones/subscribe

**Descripción:** Registra una suscripción de Web Push para el usuario autenticado. Máximo 10 dispositivos por usuario.
**Archivo de ruta:** `routes/notificaciones.js:16`
**Controlador:** `controllers/notificaciones.js:7` — `subscribirNotificacionesWebPush`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion` (línea 18)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | subscription.endpoint | string | Sí | Validado manualmente |
| body | subscription.keys.p256dh | string | Sí | Validado manualmente |
| body | subscription.keys.auth | string | Sí | Validado manualmente |
| body | userAgent | string | No | — |

### Ejemplo de request
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "BB...",
      "auth": "CC..."
    }
  },
  "userAgent": "Mozilla/5.0..."
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "message": "Suscripción registrada correctamente"
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 400 | Suscripción inválida (faltan campos) |
| 404 | Usuario no encontrado |

---

## [POST] /api/notificaciones/unsubscribe

**Descripción:** Elimina una suscripción de Web Push específica (por endpoint).
**Archivo de ruta:** `routes/notificaciones.js:21`
**Controlador:** `controllers/notificaciones.js:66` — `unsubscribeNotificacionesWebPush`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion` (línea 23)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| body | endpoint | string | Sí |

### Ejemplo de request
```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Suscripción eliminada correctamente"
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 400 | Falta el endpoint |
| 404 | Usuario no encontrado |

---

## [GET] /api/notificaciones/vapidPublicKey

**Descripción:** Devuelve la clave pública VAPID para inicializar Web Push en el frontend.
**Archivo de ruta:** `routes/notificaciones.js:27`
**Controlador:** `controllers/notificaciones.js:107` — `getVapidPublicKey`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion` (línea 29)

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "key": "BBBB..."
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 500 | Falta la clave pública VAPID |

---

## [GET] /api/notificaciones/

**Descripción:** Obtiene las notificaciones del usuario autenticado con paginación.
**Archivo de ruta:** `routes/notificaciones.js:32`
**Controlador:** `controllers/notificaciones.js:120` — `obtenerNotificaciones`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion` (línea 34)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Default |
|---|---|---|---|---|
| query | page | number | No | 1 |
| query | limit | number | No | 20 |

### Ejemplo de response — éxito
- Código de estado: `200`
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
      "_id": "60f...",
      "tipo": "follow",
      "mensaje": "comenzó a seguirte",
      "leida": false,
      "notificacion_leida": false,
      "createdAt": "2026-07-07T16:00:00.000Z",
      "emisor": {
        "_id": "60f...",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "imagen_perfil": { ... },
        "url": "juan-perez"
      },
      "referencia": null
    }
  ]
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 500 | Error al obtener notificaciones |

---

## [PATCH] /api/notificaciones/marcar-notificacion-leida/:id

**Descripción:** Marca una notificación como leída.
**Archivo de ruta:** `routes/notificaciones.js:37`
**Controlador:** `controllers/notificaciones.js:202` — `marcarNotificacionLeida`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, `check('id').isMongoId()`, `validarCampos` (líneas 38-43)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido |
|---|---|---|---|
| params | id | string (MongoId) | Sí |

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Notificación marcada como leída"
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 404 | Notificación no encontrada o no autorizada |

---

## [GET] /api/notificaciones/nuevas-notificaciones

**Descripción:** Obtiene el total de notificaciones no leídas del usuario autenticado.
**Archivo de ruta:** `routes/notificaciones.js:46`
**Controlador:** `controllers/notificaciones.js:243` — `obtenerTotalNotificacionesNoLeidas`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion` (línea 48)

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "totalNoLeidas": 3
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 500 | Error en el servidor |

---

## [DELETE] /api/notificaciones/eliminar-notificacion/:id

**Descripción:** Elimina una notificación específica (borrado físico de la BD).
**Archivo de ruta:** `routes/notificaciones.js:51`
**Controlador:** `controllers/notificaciones.js:266` — `eliminarNotificacion`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, validaciones (líneas 52-59)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | id | string (MongoId) | Sí | `notEmpty()` + `isMongoId()` |

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Notificación eliminada correctamente"
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 404 | Notificación no existe en la BD |

---

# 10. Municipios

Base path: `/api/municipios`

## [GET] /api/municipios/

**Descripción:** Obtiene la lista de todos los municipios (ordenados alfabéticamente) disponibles en la BD.
**Archivo de ruta:** `routes/municipios.js:7`
**Controlador:** `controllers/municipios.js:6` — `obtenerMunicipios`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion` (línea 8)

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Municipios obtenidos correctamente",
  "municipios": [
    {
      "_id": "60f...",
      "nombreMunicipio": "Zacatelco",
      "claveMunicipio": "029..."
    }
  ]
}
```

### Códigos de error posibles
| Código | Causa |
|---|---|
| 500 | Error inesperado |

---

# 11. Ubicación (Geolocalización)

Base path: `/api/ubicacion`

## [POST] /api/ubicacion/reverse

**Descripción:** Obtiene el municipio correspondiente a unas coordenadas GPS mediante reverse geocoding (intersección geoespacial en MongoDB con fallback por cercanía de 100m).
**Archivo de ruta:** `routes/ubicacion.js:10`
**Controlador:** `controllers/ubicacion.js:4` — `obtenerMunicipioPorCoords`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion`, `check('lat').isFloat().notEmpty()`, `check('lng').isFloat().notEmpty()`, `validarCampos` (líneas 11-17)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | lat | number | Sí | `isFloat().notEmpty()` |
| body | lng | number | Sí | `isFloat().notEmpty()` |

### Ejemplo de request
```json
{
  "lat": 19.2153,
  "lng": -98.2452
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "municipio": {
    "_id": "60f...",
    "nombreMunicipio": "Zacatelco",
    ...
  },
  "metodo": "database_geo_intersect",
  "precision": "exacta"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 404 | Ubicación fuera de la zona de cobertura (Tlaxcala) | `controllers/ubicacion.js:47` |
| 500 | Error interno en el servidor | `controllers/ubicacion.js:63` |

---

## [GET] /api/ubicacion/

**Descripción:** Misma funcionalidad que `GET /api/municipios/` (obtener lista de municipios). Es un alias.
**Archivo de ruta:** `routes/ubicacion.js:20`
**Controlador:** `controllers/municipios.js:6` — `obtenerMunicipios`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `verificarTokenSesion` (línea 22)

### Respuesta
Ídem `GET /api/municipios/`.

---

# 12. Uploads (Imagen de perfil)

Base path: `/api/uploads`

## [PUT] /api/uploads/:coleccion

**Descripción:** Actualiza la imagen de perfil del usuario autenticado. Solo acepta la colección "usuarios". La imagen se sube a Cloudinary y se elimina la anterior (si no es la default).
**Archivo de ruta:** `routes/uploads.js:16`
**Controlador:** `controllers/uploads.js:9` — `actualizarImagen`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware (en orden): `verificarTokenSesion`, `upload.single('img')`, `validarCampoImg`, `validarImagenesMulter`, `check('coleccion').custom(...)`, `validarCampos` (líneas 17-33)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | coleccion | string | Sí | `custom(coleccionesPermitidas(c, ['usuarios']))` — solo "usuarios" |
| file (formdata) | img | file | Sí | Solo jpg/jpeg/png/webp, max 5MB |

### Ejemplo de request
```
PUT /api/uploads/usuarios
Content-Type: multipart/form-data
Cookie: accessToken=eyJ...

--boundary
Content-Disposition: form-data; name="img"; filename="perfil.jpg"
Content-Type: image/jpeg

[binary data]
--boundary--
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "msg": "Imagen de perfil actualizada correctamente",
  "usuario": {
    "imagen_perfil": {
      "secure_url": "https://res.cloudinary.com/...",
      "public_id": "imagenes-perfiles-usuarios/..."
    }
  }
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 400 | No existe un usuario con ese ID | `controllers/uploads.js:24` |
| 400 | Extensión/MIME no válido | `helpers/multer.js:21-27` |
| 400 | Imagen excede 5MB | `middlewares/validar-imagen-posteo.js:5` |
| 400 | Colección no permitida | `helpers/colecciones-permitidas.js` |
| 404 | No hay imagen para subir | `middlewares/validar-imagen-posteo.js:16` |
| 500 | Error al actualizar la imagen | `controllers/uploads.js:96` |

---

# 13. Soporte / Ayuda

Base path: `/api/ayuda-soporte`

## [POST] /api/ayuda-soporte/envio-correo

**Descripción:** Envía un ticket de soporte por correo electrónico al equipo de TlaxApp. Genera un número de ticket y envía confirmación al usuario.
**Archivo de ruta:** `routes/soporte.js:9`
**Controlador:** `controllers/soporte.js:22` — `ayudaSoporteEnvioCorrreo`

### Autenticación y permisos
- Requiere token: Sí (accessToken en cookies)
- Middleware: `soporteLimiter` (línea 9) — 5 tickets cada 15 minutos, code `SOPORTE_BLOCKED`
- Middleware: `verificarTokenSesion` (línea 11)
- Middleware validación: check de `tipo_problema` y `descripcion_problema_usuario` (líneas 13-15)

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | tipo_problema | string | Sí | `notEmpty().isIn(["cuenta", "publicacion", "seguridad", "reporte", "otro"])` |
| body | descripcion_problema_usuario | string | Sí | `notEmpty().isString().trim().isLength({ min: 15, max: 1000 })` |

### Ejemplo de request
```json
{
  "tipo_problema": "cuenta",
  "descripcion_problema_usuario": "No puedo iniciar sesión con mi cuenta de correo electrónico."
}
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "status": 200,
  "ticketId": "TLX-1720368000000",
  "msg": "Solicitud de soporte recibida correctamente"
}
```

### Códigos de error posibles
| Código | Causa | Dónde se lanza |
|---|---|---|
| 400 | Tipo de problema no válido | `controllers/soporte.js:28` |
| 404 | Usuario no encontrado | `controllers/soporte.js:35` |
| 429 (rate-limit) | Demasiados tickets de soporte (5 en 15min) | `middlewares/rate-limiter.js:106` |
| 500 | Error en el servidor | `controllers/soporte.js:67` |

---

# Apéndice: Formato de errores comunes

## Error de autenticación (401)
```json
{
  "msg": "No hay token en la peticion"
}
```
## Error de validación (400)
```json
{
  "errores": [
    { "value": "", "msg": "El correo es obligatorio", "param": "correo", "location": "body" }
  ]
}
```
## Error de rate limit (429)
```json
{
  "ok": false,
  "status": 429,
  "msg": "Demasiados intentos de inicio de sesión...",
  "code": "LOGIN_BLOCKED"
}
```
## Error interno del servidor (500)
```json
{
  "status": 500,
  "msg": "Error interno del servidor"
}
```

---

# Apéndice: Cookies de autenticación

| Cookie | Tipo | Duración | Flags |
|---|---|---|---|
| accessToken | httpOnly | 1 hora | secure, sameSite:none, path:/ |
| refreshToken | httpOnly | 7 días | secure, sameSite:none, path:/ |

Todas las peticiones autenticadas deben incluir `credentials: 'include'` desde el frontend.
