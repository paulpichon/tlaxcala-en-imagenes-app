# Autenticación de usuarios (`/api/auth`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:123` (`/api/auth` → `routes/auth.js`). Cookies de sesión: ver [README § Autenticación](README.md#autenticación).

> **Ejemplos:** todos los ejemplos de este archivo están **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [GET] /api/auth/verificar-correo{/:token}

**Descripción:** Activa la cuenta al abrir el enlace del correo de verificación. Valida el JWT (secreto `EMAIL_VERIFICATION_SECRET`), compara su hash con `verificacion_token` del usuario y marca `email_validated: true`, `estatus: 1` y borra `verificacion_token`.
**Archivo de ruta:** `routes/auth.js:26`
**Controlador:** `controllers/auth.js` — `verificarCorreo` (línea 30) → `email/servicios-autenticacion-correo.js` — `verificarCorreoEnviado` (línea 191)

### Autenticación y permisos
- Requiere token: **No** (el token viaja en la URL).
- Cadena de middlewares: `verificacionLimiter` → `validarTokenEnURL` → `check('token').isJWT()` → `validarCampos` → `verificarCorreo`.
- Rate limiter: `verificacionLimiter` (`middlewares/rate-limiter.js:56`), 15 min / 5, código `VERIFICATION_BLOCKED`. **Cuenta cada petición, incluidas las válidas.**

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `token` | string | Sí (la ruta exige el segmento) | `validarTokenEnURL`: si falta → 400. `isJWT()` con mensaje `"Token invalido"` → 422 |

### Ejemplo de request
```http
GET /api/auth/verificar-correo/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub21icmUiOiJBbmEiLCJjb3JyZW8iOiJhbmFAZXhhbXBsZS5jb20ifQ.signature
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Correo verificado" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `VERIFICATION_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de verificación de correo, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:62-64` |
| 400 | `BAD_REQUEST` | Bad Request | "El token es obligatorio en la URL" | `middlewares/validar-token-en-url.js:7` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La solicitud contiene errores de validación" (`errors: [{field:"token", message:"Token invalido"}]`) | `middlewares/validar-campos.js:28` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token invalido o ha expirado" (hash del token ≠ `verificacion_token`, p. ej. token ya usado o reenviado) | `email/servicios-autenticacion-correo.js:204` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Correo no está en el token" | `email/servicios-autenticacion-correo.js:198` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Correo no existe en la base de datos" | `email/servicios-autenticacion-correo.js:201` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error interno al verificar la cuenta" (**catch-all: incluye token expirado o con firma inválida**) | `email/servicios-autenticacion-correo.js:225` |

### Notas para el Frontend
- El enlace del correo es `${FRONTEND_URL}/cuentas/crear-cuenta/cuenta-verificada/<token>` (`controllers/usuarios.js:105`, `controllers/auth.js:81`).
- ⚠ **Hallazgo:** un token **expirado** (1 h) o con firma inválida no produce 401/400 sino **500** con el mensaje genérico de `verificarCorreoEnviado`, porque `validarJWT` rechaza con un objeto plano (no `AppError`) y el `catch` lo convierte en `InternalError` (`helpers/validar-jwt.js:9-15`). El frontend debe tratar 500 en esta ruta como "enlace inválido o expirado" y ofrecer reenvío.
- La cuenta queda activa con `estatus: 1`; el login posterior ya no devuelve 403 "Cuenta no verificada".

---

## [POST] /api/auth/reenviar-correo

**Descripción:** Reenvía el correo de verificación. Recibe el JWT de sesión que devuelve `POST /api/usuarios` (firmado con `JWT_SEED`, payload `{correo}`), aplica cooldown de 5 minutos y genera un nuevo token de verificación (1 h).
**Archivo de ruta:** `routes/auth.js:32`
**Controlador:** `controllers/auth.js` — `reenviarCorreoVerificacion` (línea 44)

### Autenticación y permisos
- Requiere token: **No** (usa el JWT del body, no la cookie).
- Cadena de middlewares: `reenvioCorreoLimiter` → `check('token').isJWT()` → `validarCampos` → `reenviarCorreoVerificacion`.
- Rate limiter: `reenvioCorreoLimiter` (`middlewares/rate-limiter.js:71`), 5 min / 3, código `EMAIL_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `token` | string (JWT) | Sí | `isJWT()`, mensaje `"Token invalido"` → 422 |

### Ejemplo de request
```http
POST /api/auth/reenviar-correo
Content-Type: application/json

{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb3JyZW8iOiJhbmFAZXhhbXBsZS5jb20ifQ.signature" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Correo reenviado a ana@example.com" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `EMAIL_BLOCKED` | Rate Limit Exceeded | "Demasiados correos enviados, intenta de nuevo en 5 minutos" | `middlewares/rate-limiter.js:77-79` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La solicitud contiene errores de validación" | `middlewares/validar-campos.js:28` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Correo no existe" (usuario inexistente o `estatus: 4`) | `controllers/auth.js:57` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta ya verificada" | `controllers/auth.js:63` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | "Espera N minutos antes de reenviar el correo" (cooldown de 5 min; incluye `retry_after`) | `controllers/auth.js:76` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Mensaje de `jsonwebtoken` (p. ej. `"jwt expired"`, `"invalid signature"`) cuando el JWT no es válido | `controllers/auth.js:94` (`new InternalError(error.message)`) |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "No se pudo enviar el correo" | `email/servicios-autenticacion-correo.js:186` |

### Notas para el Frontend
- El JWT de entrada se valida con `validarJWT(token)` **sin secreto explícito**, es decir con `JWT_SEED` (`controllers/auth.js:50`). Es coherente con el token que emite `POST /api/usuarios`, pero **no** con el token de verificación de un enlace (firmado con `EMAIL_VERIFICATION_SECRET`).
- ⚠ Un JWT expirado o inválido devuelve **500** (no 401/400), por la misma causa que `verificar-correo`.
- ⚠ La respuesta incluye el correo completo en `msg` (`controllers/auth.js:91`). No es un dato secreto para el cliente que ya lo conoce, pero es un eco innecesario.

---

## [POST] /api/auth/login

**Descripción:** Inicio de sesión de usuarios. Valida correo y contraseña, aplica bloqueo por intentos fallidos, emite cookies `accessToken` y `refreshToken` (httpOnly) y registra el refresh token hasheado en `UserToken`.
**Archivo de ruta:** `routes/auth.js:37`
**Controlador:** `controllers/auth.js` — `login` (línea 99)

### Autenticación y permisos
- Requiere token: **No**.
- Requisitos de cuenta: `estatus === 1` **y** `email_validated === true` (`controllers/auth.js:109,112`).
- Cadena de middlewares: `loginLimiter` → `check('correo').isEmail()` → `check('password').trim().notEmpty()` → `validarCampos` → `login`.
- Rate limiter: `loginLimiter` (`middlewares/rate-limiter.js:19`), 15 min / 5, clave **IP + correo** (fallback IP), código `LOGIN_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `correo` | string | Sí | `isEmail()`; mensaje `"El correo es obligatorio"` → 422 |
| body | `password` | string | Sí | `trim()` + `notEmpty()`; mensaje `"El password es obligatorio"` → 422 |

### Ejemplo de request
```http
POST /api/auth/login
Content-Type: application/json

{ "correo": "ana@example.com", "password": "Secreta#2026" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
- Cookies: `Set-Cookie: accessToken=…; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=3600` y `refreshToken=…` (`Max-Age=604800`). Los `Max-Age` mostrados corresponden a los defaults (`ACCESS_TOKEN_EXPIRY=1h`, `REFRESH_TOKEN_EXPIRY=7d`); el valor real se deriva del `exp` de cada token recién firmado (`helpers/vigencia-cookie.js`), así que cambia si cambian las variables de entorno.
- Cuerpo (forma exacta de `controllers/auth.js:189-207`):
```json
{
  "success": true,
  "msg": "Login exitoso",
  "data": {
    "usuario": {
      "nombre_completo": { "nombre": "Ana", "apellido": "López" },
      "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala" },
      "correo": "ana@example.com",
      "imagen_perfil": { "secure_url": "https://res.cloudinary.com/…", "public_id": "…" },
      "genero": "FEMENINO",
      "fecha_nacimiento": "1995-05-10T00:00:00.000Z",
      "fecha_actualizacion": "2026-10-01T10:00:00.000Z",
      "url": "ana-lopez-3f9a1",
      "nombre_completo_changed_at": null,
      "uid": "6650a1…",
      "_id": "6650a1…"
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | Validation Failed | "El correo es obligatorio" / "El password es obligatorio" | `routes/auth.js:39,41` + `middlewares/validar-campos.js:28` |
| 429 | `LOGIN_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de inicio de sesión, tu cuenta está temporalmente bloqueada por 15 minutos" | `middlewares/rate-limiter.js:26-27` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Credenciales inválidas" (correo inexistente o `estatus: 4`) | `controllers/auth.js:106` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta no verificada" (`email_validated: false`) | `controllers/auth.js:109` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta no activada" (`estatus` distinto de 1: 0, 2, 3) | `controllers/auth.js:112` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | "Cuenta bloqueada temporalmente por actividad inusual. Intenta de nuevo más tarde o restablece tu contraseña." (bloqueo activo; `retry_after` = 60 por defecto) | `controllers/auth.js:119` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | Mismo texto, al alcanzar **10** intentos fallidos (`MAX_INTENTOS`) | `controllers/auth.js:144` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Credenciales inválidas" (contraseña incorrecta) | `controllers/auth.js:148` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado | `controllers/auth.js:212` |

### Notas para el Frontend
- Dos límites independientes: `loginLimiter` (5 intentos / 15 min por IP+correo, código `LOGIN_BLOCKED`) y el bloqueo de cuenta del controlador (10 intentos fallidos → 30 min, código `RATE_LIMIT_EXCEEDED`). Distinguir por `code`.
- Tras 10 intentos fallidos se envía correo de alerta (`controllers/auth.js:141`).
- Las cookies se emiten con `sameSite: 'none'`, `secure: true`: requiere `credentials: 'include'` y HTTPS.
- Tras el login, usar `GET /api/auth/me` o el objeto `data.usuario` (incluye `uid` y `_id`).
- ⚠ Discrepancia de contrato: `data.usuario` incluye `_id` **y** `uid`; `GET /api/auth/me` devuelve solo `uid` (ver `me`).
- Efectos secundarios: crea un documento `UserToken` (refresh hasheado), resetea `intentos_login`, borra `reset_password_token` y actualiza `ultimo_inicio_sesion`.

---

## [POST] /api/auth/cuentas/password-olvidado

**Descripción:** Solicita el enlace de restablecimiento de contraseña. Responde siempre con mensaje genérico (anti-enumeración). Si la cuenta existe, está verificada y `estatus === 1`, y no hay cooldown, genera un JWT (`RESET_PASSWORD_SECRET`, 1 h) y envía el correo.
**Archivo de ruta:** `routes/auth.js:46`
**Controlador:** `controllers/auth.js` — `envioCorreoReestablecerPassword` (línea 299) → `procesarEnvioReestablecerPassword` (línea 256)

### Autenticación y permisos
- Requiere token: **No**.
- Cadena de middlewares: `recoveryLimiter` → `check('correo').isEmail()` → `validarCampos` → controlador.
- Rate limiter: `recoveryLimiter` (`middlewares/rate-limiter.js:41`), 15 min / 3, código `RECOVERY_BLOCKED`. **Compartido** con las rutas 7, 8 y 9 (misma instancia).

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `correo` | string | Sí | `isEmail()`; mensaje `"El correo no es valido"` → 422 |

### Ejemplo de request
```http
POST /api/auth/cuentas/password-olvidado
Content-Type: application/json

{ "correo": "ana@example.com" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña",
  "data": { "token": "9f2c…64 caracteres hexadecimales…" }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | Validation Failed | "El correo no es valido" | `routes/auth.js:48` + `middlewares/validar-campos.js:28` |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de recuperación de contraseña, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:47-49` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "No se pudo enviar el correo" (SMTP falla para una cuenta elegible) | `email/servicios-correo-reestablecer-password.js:191` (propagado por `controllers/auth.js:313-314`) |

### Notas para el Frontend
- `data.token` es un **token opaco** (32 bytes hex, `helpers/generar-token-opaco.js`), **no un JWT**. Úsalo solo como token de sesión temporal del cliente (sessionStorage).
- ⚠ **Hallazgo de anti-enumeración incompleto:** cuando la cuenta está en cooldown (< 5 min desde el último correo), la respuesta es el mismo mensaje **pero sin `data`** (`controllers/auth.js:275-277`), mientras que el caso normal sí incluye `data.token` (`:299-302`). Un cliente puede distinguir ambos casos por la presencia de `data`.
- ⚠ Si el SMTP falla para una cuenta elegible, la respuesta es 500, mientras que para el resto es 200: otro oráculo de existencia de cuenta (sólo cuando falla el correo).

---

## [POST] /api/auth/reenviar-correo-restablecer-password

**Descripción:** Reenvía el correo de restablecimiento. Recibe un JWT en el body, lo valida con `JWT_SEED` y ejecuta el mismo flujo que la ruta anterior.
**Archivo de ruta:** `routes/auth.js:53`
**Controlador:** `controllers/auth.js` — `reenvioCorreoRestablecerPassword` (línea 309) → `procesarEnvioReestablecerPassword` (256)

### Autenticación y permisos
- Requiere token: **No** (JWT en body).
- Cadena de middlewares: `recoveryLimiter` → `check('token').isJWT()` → `validarCampos` → controlador.
- Rate limiter: `recoveryLimiter` (`middlewares/rate-limiter.js:41`), 15 min / 3, código `RECOVERY_BLOCKED` (**misma instancia** que la ruta 6).

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `token` | string (JWT) | Sí | `isJWT()`; mensaje `"Token invalido"` → 422 |

### Ejemplo de request
```http
POST /api/auth/reenviar-correo-restablecer-password
Content-Type: application/json

{ "token": "eyJhbGciOiJIUzI1NiJ9.eyJjb3JyZW8iOiJhbmFAZXhhbXBsZS5jb20ifQ.signature" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200` — misma forma que la ruta 6.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | Validation Failed | "Token invalido" (dentro de `errors`) | `routes/auth.js:54` + `middlewares/validar-campos.js:28` |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de recuperación de contraseña, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:47-49` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Mensaje de `jsonwebtoken` (p. ej. `"jwt expired"`) si el JWT no valida | `controllers/auth.js:316` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "No se pudo enviar el correo" | `email/servicios-correo-reestablecer-password.js:191` |

### Notas para el Frontend
- ⚠ **[REQUIERE VERIFICACIÓN MANUAL]:** en el código ningún endpoint emite un JWT para este flujo (la respuesta de la ruta 6 entrega un token opaco). `reenvioCorreoRestablecerPassword` valida con `JWT_SEED` (`controllers/auth.js:312`), pero los enlaces de reset se firman con `RESET_PASSWORD_SECRET` (`controllers/auth.js:284`). Confirmar con el frontend de dónde sale el JWT que envía, o si el flujo está desactivado.
- ⚠ Mismo problema de 500 para tokens expirados que en `verificar-correo`.

---

## [GET] /api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}

**Descripción:** Valida el JWT de restablecimiento que llega en el enlace del correo, antes de mostrar el formulario. Comprueba firma (`RESET_PASSWORD_SECRET`), existencia de la cuenta, que el hash coincida con `reset_password_token`, que la cuenta esté verificada y con `estatus === 1`.
**Archivo de ruta:** `routes/auth.js:58`
**Controlador:** `controllers/auth.js` — `validarTokenRestablecerPassword` (línea 331)

### Autenticación y permisos
- Requiere token: **No** (token en la URL).
- Cadena de middlewares: `recoveryLimiter` → `validarTokenEnURL` → `check('token').isJWT()` → `validarCampos` → controlador.
- Rate limiter: `recoveryLimiter` (`middlewares/rate-limiter.js:41`), 15 min / 3, código `RECOVERY_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `token` | string (JWT) | Sí | `validarTokenEnURL` → 400 si falta; `isJWT()` → 422 `"Token invalido"` |

### Ejemplo de request
```http
GET /api/auth/cuentas/restablecer-password/validar-token-reset-password/eyJhbGciOiJIUzI1NiJ9.eyJjb3JyZW8iOiJhbmFAZXhhbXBsZS5jb20ifQ.signature
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Token válido", "data": { "valid": true } }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de recuperación de contraseña, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:47-49` |
| 400 | `BAD_REQUEST` | Bad Request | "El token es obligatorio en la URL" | `middlewares/validar-token-en-url.js:7` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "Token invalido" (en `errors`) | `middlewares/validar-campos.js:28` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Mensaje de `jsonwebtoken` (p. ej. `"jwt expired"`) — firma inválida o expirado | `controllers/auth.js:355` |
| 401 | `UNAUTHORIZED` | Authentication Required | Producción: "Token inválido o expirado". Desarrollo: "El usuario no existe o la cuenta fue eliminada (estatus 4)" | `controllers/auth.js:333-335` |
| 401 | `UNAUTHORIZED` | Authentication Required | Producción: "Token inválido o expirado". Desarrollo: "El token de restablecimiento no coincide o ya fue utilizado" | `controllers/auth.js:337-339` |
| 403 | `FORBIDDEN` | Forbidden | Producción: "Token inválido o expirado". Desarrollo: "La cuenta no ha sido verificada por correo electrónico" | `controllers/auth.js:341-343` |
| 403 | `FORBIDDEN` | Forbidden | Producción: "Token inválido o expirado". Desarrollo: "La cuenta está en estado N (suspendida/reglas violadas)" | `controllers/auth.js:345-347` |

### Notas para el Frontend
- ⚠ **Token expirado (1 h) → 500**, no 401. Tratar como "enlace expirado" y ofrecer reenvío.
- En **desarrollo** el `detail` revela estados internos de la cuenta (`estatus`, `reset_password_token`). En producción el mensaje es genérico.
- Un token válido **no** invalida el token: puede reutilizarse hasta que `reestablecer-password` lo consuma (`reset_password_token` se borra al cambiar la contraseña).

---

## [POST] /api/auth/cuentas/reestablecer-password{/:token}

**Descripción:** Cambia la contraseña con el token del enlace. Valida que el JWT coincida con `reset_password_token`, que la cuenta esté verificada, hashea la nueva contraseña (bcrypt, salt 10), borra `reset_password_token` y pone `intentos_login` en 0.
**Archivo de ruta:** `routes/auth.js:64`
**Controlador:** `controllers/auth.js` — `reestablecerPassword` (línea 360) → `email/servicios-correo-reestablecer-password.js` — `reestablecerPasswordUsuario` (línea 195)

### Autenticación y permisos
- Requiere token: **No** (token en la URL).
- Cadena de middlewares: `recoveryLimiter` → `check('password').trim().isLength({min:8})` → `validarCampos` → controlador.
- **Nota:** esta ruta **no** aplica `validarTokenEnURL` ni `isJWT()` al `:token`; el token llega sin validar de formato al servicio.
- Rate limiter: `recoveryLimiter` (`middlewares/rate-limiter.js:41`), 15 min / 3, código `RECOVERY_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `token` | string | Sí en la práctica (`{/:token}` opcional en Express 5) | Sin validación en la ruta |
| body | `password` | string | Sí | `trim()` + `isLength({min: 8})`; mensaje `"El password es obligatorio: debe tener al menos 8 caracteres"` → 422. **Sin reglas de complejidad.** |

### Ejemplo de request
```http
POST /api/auth/cuentas/reestablecer-password/eyJhbGciOiJIUzI1NiJ9.eyJjb3JyZW8iOiJhbmFAZXhhbXBsZS5jb20ifQ.signature
Content-Type: application/json

{ "password": "NuevaClave2026" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Password reestablecido" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de recuperación de contraseña, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:47-49` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El password es obligatorio: debe tener al menos 8 caracteres" | `routes/auth.js:66` + `middlewares/validar-campos.js:28` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Mensaje de `jsonwebtoken` (`"jwt malformed"`, `"jwt expired"`, `"invalid signature"`, `"jwt must be provided"`) | `controllers/auth.js:368` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Correo no existe en la base de datos" (usuario inexistente o `estatus: 4`) | `email/servicios-correo-reestablecer-password.js:203` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Correo no está en el token" | `email/servicios-correo-reestablecer-password.js:200` |
| 401 | `UNAUTHORIZED` | Authentication Required | "La cuenta no ha sido verificada" | `email/servicios-correo-reestablecer-password.js:204` |
| 401 | `UNAUTHORIZED` | Authentication Required | "El token de restablecimiento de contraseña no es válido o ha expirado" (hash ≠ `reset_password_token`: token ya usado o reemitido) | `email/servicios-correo-reestablecer-password.js:207` |

### Notas para el Frontend
- ⚠ **Token expirado o inválido → 500** (no 401). Y un usuario inexistente también devuelve 500 (`servicios-correo-reestablecer-password.js:203` usa `InternalError`).
- ⚠ **Política de contraseña inconsistente:** el registro exige mayúscula, minúscula, número y carácter especial (`routes/usuarios.js:51-52`); este endpoint solo exige 8 caracteres. El frontend debe aplicar la política del registro.
- Esta operación **no revoca sesiones**: no incrementa `tokenVersion` ni borra `UserToken`. Las cookies de sesión activas siguen siendo válidas hasta que expiren (**[REQUIERE VERIFICACIÓN MANUAL]** si es intencional).
- Tras el éxito, el frontend debe redirigir al login (no hay cookies nuevas).

---

## [POST] /api/auth/refresh

**Descripción:** Rota el par de tokens. Lee la cookie `refreshToken`, comprueba que su hash exista en `UserToken`, emite nuevo `accessToken` (con `tokenVersion` vigente) y nuevo `refreshToken`, y reemplaza el hash almacenado. Si el refresh ya fue rotado (reuso), invalida todas las sesiones del usuario.
**Archivo de ruta:** `routes/auth.js:71`
**Controlador:** `controllers/auth.js` — `refreshToken` (línea 372)

### Autenticación y permisos
- Requiere token: **Sí, cookie `refreshToken`** (sin body).
- Cadena de middlewares: `refreshLimiter` → `refreshToken`.
- Rate limiter: `refreshLimiter` (`middlewares/rate-limiter.js:161`), 15 min / 10, código `REFRESH_BLOCKED`.

### Parámetros de entrada
Ninguno (cookie `refreshToken`).

### Ejemplo de request
```http
POST /api/auth/refresh
Cookie: refreshToken=eyJhbGciOiJIUzI1NiJ9…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
- Cookies nuevas: `accessToken` (`Max-Age=3600` por defecto) y `refreshToken` (`Max-Age=604800` por defecto); el valor real se deriva del `exp` de cada token.
```json
{ "success": true, "msg": "Token renovado" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `REFRESH_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes de renovación de token, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:166-168` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay cookies de sesion para hacer refresh token" | `controllers/auth.js:379` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión comprometida. Inicia sesión nuevamente." (reuso detectado: incrementa `tokenVersion` y borra todos los `UserToken` del usuario) | `controllers/auth.js:397` |
| 403 | `FORBIDDEN` | Forbidden | "Token no registrado" (no existe en `UserToken` y la firma no es válida) | `controllers/auth.js:400` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido o expirado" (existe en `UserToken` pero `jwt.verify` falla; se elimina el registro) | `controllers/auth.js:446` |

### Notas para el Frontend
- No envía body; el navegador debe incluir la cookie (`credentials: 'include'`).
- Llamar al refresh cuando una petición devuelva 401 con `code: UNAUTHORIZED` y el `detail` de sesión expirada.
- Si recibes 401 con "Sesión comprometida", fuerza un nuevo login: todas las sesiones del usuario fueron invalidadas.
- ⚠ Observación: no verifica el `estatus` del usuario al renovar. Si el usuario fue eliminado, `Usuario.findById` devuelve documento sin `tokenVersion` y se emite un access token con `tokenVersion: 0`; `verificarTokenSesion` lo rechaza después (`estatus === 4`).
- ⚠ **Serializa los refresh.** Dos llamadas simultáneas con el mismo `refreshToken` provocan el camino de "reuso": la segunda no encuentra la fila y cierra **todas** las sesiones del usuario (hallazgo H23 del [README](README.md#hallazgos-de-alta-prioridad-verificados-en-código)). Usa un único refresco en vuelo y encola el resto.
- ⚠ **Sesiones muy longevas.** El TTL de `UserToken` es de 30 días desde `createdAt` y la rotación no lo reinicia. Pasado ese plazo el registro desaparece y el siguiente refresh responde "Sesión comprometida" (hallazgo H22).
- Un usuario con `estatus` 2 o 3 **sí** puede renovar: esta ruta no revisa el estatus (ver nota anterior y H3).

---

## [POST] /api/auth/logout

**Descripción:** Cierra la sesión. Elimina el hash del refresh token en `UserToken` y limpia las cookies `accessToken` y `refreshToken`.
**Archivo de ruta:** `routes/auth.js:73`
**Controlador:** `controllers/auth.js` — `logout` (línea 450) → `helpers/cerrar-sesion-cookies.js` — `cerrarSesionCookies` (línea 4)

### Autenticación y permisos
- Requiere token: **Sí, cookie `refreshToken` válida en firma** (se acepta expirado).
- Cadena de middlewares: `validarRefreshToken` (`middlewares/validar-jwt-cookies-sesion.js:70-86`) → `logout`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
Ninguno (cookie `refreshToken`).

### Ejemplo de request
```http
POST /api/auth/logout
Cookie: refreshToken=eyJhbGciOiJIUzI1NiJ9…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
- Cabeceras: `Set-Cookie` que borra `accessToken` y `refreshToken`.
```json
{ "success": true, "msg": "Sesión cerrada" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay refresh token en la petición" | `middlewares/validar-jwt-cookies-sesion.js:76` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido" (firma inválida) | `middlewares/validar-jwt-cookies-sesion.js:84` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` si falla el borrado en `UserToken` | `controllers/auth.js:462` |

### Notas para el Frontend
- Requiere la cookie `refreshToken`; con solo `accessToken` responde 401.
- Puede llamarse con `accessToken` expirado.
- Tras el éxito, limpiar el estado de sesión del cliente.
- ⚠ **El logout no invalida el `accessToken`.** Solo borra la fila de `UserToken` y limpia las cookies; un access token ya emitido sigue siendo aceptado hasta su `exp` (hasta 1 h con la configuración por defecto), aunque el usuario "haya cerrado sesión" en ese navegador (hallazgo H24). Para cortar de inmediato hace falta incrementar `tokenVersion`, lo que hoy solo ocurre al detectar reuso de refresh token.

---

## [GET] /api/auth/me

**Descripción:** Devuelve el perfil básico del usuario autenticado a partir de la cookie `accessToken`.
**Archivo de ruta:** `routes/auth.js:78`
**Controlador:** `controllers/auth.js` — `getMe` (línea 216)

### Autenticación y permisos
- Requiere token: **Sí, cookie `accessToken`**.
- Cadena de middlewares: `verificarTokenSesion` (`middlewares/validar-jwt-cookies-sesion.js:8`) → `getMe`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/auth/me
Cookie: accessToken=eyJhbGciOiJIUzI1NiJ9…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
- Forma según `Usuario.toJSON` (`models/Usuario.js:192-200`): se eliminan `_id`, `password`, `verificacion_token`, `reset_password_token`, `tokenVersion`, `url_history` y `__v`, y se agrega `uid`.
```json
{
  "success": true,
  "msg": "Usuario obtenido",
  "data": {
    "usuario": {
      "uid": "6650a1…",
      "nombre_completo": { "nombre": "Ana", "apellido": "López" },
      "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala" },
      "imagen_perfil": { "secure_url": "https://res.cloudinary.com/…", "public_id": "…" },
      "correo": "ana@example.com",
      "url": "ana-lopez-3f9a1",
      "genero": "FEMENINO",
      "fecha_nacimiento": "1995-05-10T00:00:00.000Z",
      "nombre_completo_changed_at": null
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" | `middlewares/validar-jwt-cookies-sesion.js:14` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido - usuario no existe" (inexistente o `estatus: 4`) | `middlewares/validar-jwt-cookies-sesion.js:27` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta no activada. El usuario debe verificar su cuenta" (`estatus: 0` o `email_validated: false`) | `middlewares/validar-jwt-cookies-sesion.js:31` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión expirada - inicia sesión nuevamente" (`tokenVersion` distinto) | `middlewares/validar-jwt-cookies-sesion.js:35` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido" (firma o expiración del access token) | `middlewares/validar-jwt-cookies-sesion.js:45` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no existe" (inalcanzable en la práctica: el middleware ya validó) | `controllers/auth.js:225` |

### Notas para el Frontend
- ⚠ **Discrepancia de contrato:** la respuesta de `/me` trae `uid` pero **no** `_id`; el `data.usuario` del login trae `_id` y `uid`. Usar `uid` en ambos casos.
- `imagen_perfil.secure_url` se entrega en la respuesta (a diferencia de los posteos, donde `secure_url` se oculta por política; ver [posteos.md](posteos.md)).
- Usar esta ruta para restaurar sesión al cargar la app (`401` → intentar `POST /api/auth/refresh` una vez).
