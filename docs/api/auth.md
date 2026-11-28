# Autenticación de usuarios (`/api/auth`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:124` (`/api/auth` → `routes/auth.js`). Cookies de sesión: ver [README § Autenticación](README.md#autenticación). Errores comunes de la sesión (`SESSION_REVOKED`, `ACCOUNT_RESTRICTED`): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario).

> **Ejemplos:** salvo que se indique otra cosa, los ejemplos de este archivo son **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**. Los ejemplos de `GET/DELETE /api/auth/sesiones*` reproducen las aserciones de `test/integration/sesiones-activas.test.js`, que se ejecutó en esta corrida (54/54 pruebas de sesión en verde, ver delta `2026-11-17_19-29-53_documentacion-endpoints.md`).
>
> **Revisión 2026-11-17 (Fase E, olas 3–4).** Se re-documentaron `login`, `reestablecer-password`, `refresh`, `logout` y `me` (modelo de sesión con `sid`, validación contra `UserToken` en cada request, rotación atómica con gracia de 30 s, señales de riesgo informativas, revocación al restablecer la contraseña) y se agregaron los 3 endpoints de sesiones activas (E6). Todas las citas de línea se re-contrastaron con el código actual.

---

## [GET] /api/auth/verificar-correo{/:token}

**Descripción:** Activa la cuenta al abrir el enlace del correo de verificación. Valida el JWT (secreto `EMAIL_VERIFICATION_SECRET`), compara su hash con `verificacion_token` del usuario y marca `email_validated: true`, `estatus: 1` y borra `verificacion_token`.
**Archivo de ruta:** `routes/auth.js:46-50`
**Controlador:** `controllers/auth.js` — `verificarCorreo` (línea 36) → `email/servicios-autenticacion-correo.js` — `verificarCorreoEnviado` (línea 191)

> **Actualizado 2026-11-10 (sync Postman):** nueva capa IP `flujoTokenIpLimiter` delante del limiter por token, y los tokens vencidos/inválidos ahora responden **401** (`TOKEN_EXPIRED` / `UNAUTHORIZED`), no 500 (H6). Ver delta completo en `2026-11-10_12-12-40_documentacion-endpoints.md`.

### Autenticación y permisos
- Requiere token: **No** (el token viaja en la URL).
- Cadena de middlewares: `flujoTokenIpLimiter` → `verificacionLimiter` → `validarTokenEnURL` → `check('token', 'Token invalido').isJWT()` → `validarCampos` → `verificarCorreo`.
- Rate limiters: `flujoTokenIpLimiter` (`middlewares/rate-limiter.js:41-51`), 15 min / **60 por IP**, código `FLOOD_BLOCKED`, instancia **compartida** con los otros 4 endpoints de flujo de token (el techo es conjunto, no por endpoint); y `verificacionLimiter`, 15 min / **20**, código `VERIFICATION_BLOCKED`, clave **IP + token** (hasheado con `claveToken`, `helpers/ip-cliente.js:166-171`). **Cuenta cada petición, incluidas las válidas.** Los escáneres de correo que precargan el link consumen el cubo del token.

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
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:44-48` (:41-51) |
| 429 | `VERIFICATION_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de verificación de correo, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:143-148` (:140-154) |
| 400 | `BAD_REQUEST` | Bad Request | "El token es obligatorio en la URL" | `middlewares/validar-token-en-url.js:7` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La solicitud contiene errores de validación" (`errors: [{field:"token", message:"Token invalido"}]`) | `routes/auth.js:48` + `middlewares/validar-campos.js:28` |
| 401 | `TOKEN_EXPIRED` | Authentication Required | "El enlace ha expirado" | `helpers/validar-jwt.js:30` (clase en `errors/error-classes.js:47-51`) |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token inválido" (firma inválida, mal formado) | `helpers/validar-jwt.js:32` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token inválido o ha expirado" (hash del token ≠ `verificacion_token`, p. ej. token ya usado o reenviado) | `email/servicios-autenticacion-correo.js:204` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Correo no está en el token" | `email/servicios-autenticacion-correo.js:198` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Correo no existe en la base de datos" | `email/servicios-autenticacion-correo.js:201` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Configuración de tokens incompleta" (falta `EMAIL_VERIFICATION_SECRET`) | `helpers/validar-jwt.js:25` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error interno al verificar la cuenta" (catch-all de errores no-AppError) | `email/servicios-autenticacion-correo.js:225` |

### Notas para el Frontend
- El enlace del correo es `${FRONTEND_URL}/cuentas/crear-cuenta/cuenta-verificada/<token>` (`controllers/usuarios.js:105`, `controllers/auth.js:87`).
- Un token **expirado** responde `401` con `code: "TOKEN_EXPIRED"` y `detail: "El enlace ha expirado"` (`helpers/validar-jwt.js:29-31`); firma inválida o malformado responde `401 UNAUTHORIZED`. Decidir por `code` y ofrecer reenvío.
- **Capa IP compartida (H1):** el cubo `FLOOD_BLOCKED` (60/15 min por IP) es conjunto para los 5 endpoints de flujo de token (`routes/auth.js:38-40`). Redes compartidas (NAT/CGNAT) pueden agotarlo entre varios usuarios.
- La cuenta queda activa con `estatus: 1`; el login posterior ya no devuelve 403 "Cuenta no verificada".

---

## [POST] /api/auth/reenviar-correo

**Descripción:** Reenvía el correo de verificación. Recibe el JWT de sesión que devuelve `POST /api/usuarios` (firmado con `JWT_SEED`, payload `{correo}`), aplica cooldown de 5 minutos y genera un nuevo token de verificación (1 h).
**Archivo de ruta:** `routes/auth.js:52-55`
**Controlador:** `controllers/auth.js` — `reenviarCorreoVerificacion` (línea 50)

> **Actualizado 2026-11-10 (sync Postman):** nueva capa IP `flujoTokenIpLimiter` delante del limiter por token, y los tokens vencidos/inválidos ahora responden **401** (`TOKEN_EXPIRED` / `UNAUTHORIZED`), no 500 (H6).

### Autenticación y permisos
- Requiere token: **No** (usa el JWT del body, no la cookie).
- Cadena de middlewares: `flujoTokenIpLimiter` → `reenvioCorreoLimiter` → `check('token', 'Token invalido').isJWT()` → `validarCampos` → `reenviarCorreoVerificacion`.
- Rate limiters: `flujoTokenIpLimiter` (`middlewares/rate-limiter.js:41-51`), 15 min / **60 por IP**, código `FLOOD_BLOCKED`, instancia compartida con los otros 4 endpoints de flujo de token; y `reenvioCorreoLimiter`, 5 min / 3, código `EMAIL_BLOCKED`, clave **IP + token**.

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
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:44-48` (:41-51) |
| 429 | `EMAIL_BLOCKED` | Rate Limit Exceeded | "Demasiados correos enviados, intenta de nuevo en 5 minutos" | `middlewares/rate-limiter.js:160-165` (:157-171) |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La solicitud contiene errores de validación" | `routes/auth.js:53` + `middlewares/validar-campos.js:28` |
| 401 | `TOKEN_EXPIRED` | Authentication Required | "El enlace ha expirado" | `helpers/validar-jwt.js:30` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token inválido" (firma inválida, mal formado) | `helpers/validar-jwt.js:32` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Correo no existe" (usuario inexistente o `estatus: 4`) | `controllers/auth.js:63` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta ya verificada" | `controllers/auth.js:69` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | "Espera N minutos antes de reenviar el correo" (cooldown de 5 min; incluye `retry_after`) | `controllers/auth.js:82` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "No se pudo enviar el correo" | `email/servicios-autenticacion-correo.js:186` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Configuración de tokens incompleta" (falta `JWT_SEED`) | `helpers/validar-jwt.js:25` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado (catch-all) | `controllers/auth.js:100` |

### Notas para el Frontend
- El JWT de entrada se valida con `validarJWT(token)` **sin secreto explícito**, es decir con `JWT_SEED` (`controllers/auth.js:56`). Es coherente con el token que emite `POST /api/usuarios`, pero **no** con el token de verificación de un enlace (firmado con `EMAIL_VERIFICATION_SECRET`).
- Un JWT expirado o inválido responde **401** (`TOKEN_EXPIRED` / `UNAUTHORIZED`). El 401 "Correo no existe" (usuario eliminado) se distingue por el `detail`.
- ⚠ La respuesta incluye el correo completo en `msg` (`controllers/auth.js:97`). No es un dato secreto para el cliente que ya lo conoce, pero es un eco innecesario.
- **Capa IP compartida (H1):** el cubo `FLOOD_BLOCKED` (60/15 min por IP) es conjunto para los 5 endpoints de flujo de token.

---

## [POST] /api/auth/login

**Descripción:** Inicio de sesión de usuarios. Valida correo y contraseña, aplica bloqueo por intentos fallidos, **abre una sesión nueva** (fila `UserToken` con `sessionId` UUID v4) y emite las cookies `accessToken` y `refreshToken` (httpOnly), ambas con el mismo claim `sid`.
**Archivo de ruta:** `routes/auth.js:57-64`
**Controlador:** `controllers/auth.js` — `login` (línea 105)

### Autenticación y permisos
- Requiere token: **No**.
- Requisitos de cuenta: `email_validated === true` **y** `estatus === 1` (`controllers/auth.js:115,118`).
- Cadena de middlewares: `loginLimiter` → `check('correo').isEmail()` → `check('password').trim().notEmpty()` → `validarCampos` → `login`.
- Rate limiter: `loginLimiter` (`middlewares/rate-limiter.js:18-32`), 15 min / 5, clave **IP + correo** (fallback IP), código `LOGIN_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `correo` | string | Sí | `isEmail()`; mensaje `"El correo es obligatorio"` → 422 |
| body | `password` | string | Sí | `trim()` + `notEmpty()`; mensaje `"El password es obligatorio"` → 422 |

Cabeceras leídas (metadata, no autentican): `User-Agent` (→ `userAgent`, `deviceName` "`<navegador> en <OS>`", `helpers/obtener-informacion-dispositivo.js:13-21`) y la IP del cliente vía `ipCliente(req)` (`helpers/obtener-informacion-dispositivo.js:14`).

### Ejemplo de request
```http
POST /api/auth/login
Content-Type: application/json

{ "correo": "ana@example.com", "password": "Secreta#2026" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
- Cookies: `Set-Cookie: accessToken=…; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=3600` y `refreshToken=…` (`Max-Age=604800`). Los `Max-Age` mostrados corresponden a los defaults (`ACCESS_TOKEN_EXPIRY=1h`, `REFRESH_TOKEN_EXPIRY=7d`, `helpers/tokensUtils.js:20-21`); el valor real se deriva del `exp` de cada token recién firmado (`helpers/tokensUtils.js:88-106`, `helpers/vigencia-cookie.js`).
- Claims (`helpers/tokensUtils.js:7-9`): access `{ id, tokenVersion, sid }`; refresh `{ id, tokenVersion, sid, jti, type: "refresh" }`. Ambos firmados **solo con HS256** (`helpers/tokensUtils.js:23-24`).
- Cuerpo (forma exacta de `controllers/auth.js:200-218`):
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
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 422 | `VALIDATION_FAILED` | Validation Failed | "El correo es obligatorio" / "El password es obligatorio" | `routes/auth.js:59,61` + `middlewares/validar-campos.js:28` |
| 429 | `LOGIN_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de inicio de sesión, tu cuenta está temporalmente bloqueada por 15 minutos" | `middlewares/rate-limiter.js:22-25` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Credenciales inválidas" (correo inexistente o `estatus: 4`) | `controllers/auth.js:112` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta no verificada" (`email_validated: false`) | `controllers/auth.js:115` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta no activada" (`estatus` distinto de 1: 0, 2, 3). **No** usa `ACCOUNT_RESTRICTED` (ese código solo lo emiten la validación de sesión y el refresh) | `controllers/auth.js:118` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | "Cuenta bloqueada temporalmente por actividad inusual. Intenta de nuevo más tarde o restablece tu contraseña." (bloqueo activo; `retry_after` = 60 por defecto) | `controllers/auth.js:125` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | Mismo texto, al alcanzar **10** intentos fallidos (`MAX_INTENTOS`) | `controllers/auth.js:150` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Credenciales inválidas" (contraseña incorrecta) | `controllers/auth.js:154` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado (p. ej. fallo al crear la fila `UserToken`) | `controllers/auth.js:223` |

### Notas para el Frontend
- Dos límites independientes: `loginLimiter` (5 intentos / 15 min por IP+correo, código `LOGIN_BLOCKED`) y el bloqueo de cuenta del controlador (10 intentos fallidos → 30 min, código `RATE_LIMIT_EXCEEDED`). Distinguir por `code`.
- Tras 10 intentos fallidos se envía correo de alerta (`controllers/auth.js:147`).
- Las cookies se emiten con `sameSite: 'none'`, `secure: true`: requiere `credentials: 'include'` y HTTPS.
- Tras el login, usar `GET /api/auth/me` o el objeto `data.usuario` (incluye `uid` y `_id`).
- ⚠ Discrepancia de contrato: `data.usuario` incluye `_id` **y** `uid`; `GET /api/auth/me` devuelve solo `uid` (ver `me`).
- **Cada login abre una sesión nueva** (no reemplaza las anteriores). La fila `UserToken` guarda `sessionId`, hash SHA-256 del refresh, `ipPrimera`/`ipUltima` (`ipCliente(req)`), `userAgent`, `deviceName`, `creadaEn`, `lastUsed` y `expiraEn` (`controllers/auth.js:164-181`). `expiraEn = min(exp del refresh, creadaEn + SESION_MAX_ABSOLUTA_DIAS)` (default 90 días, `helpers/vigencia-sesion.js:14,36-43`). La sesión aparece después en `GET /api/auth/sesiones`.
- Efectos secundarios: además de la sesión, resetea `intentos_login`, borra `reset_password_token` y actualiza `ultimo_inicio_sesion` (`controllers/auth.js:198-203`).
- **Aviso de seguridad (2026-11-25):** si es el primer login de esta cuenta desde ese navegador/OS (firma de user-agent nueva), se crea una `Notificacion` in-app `tipo: "seguridad"` con push y correo (sin cooldown) **después de responder** y best-effort (`controllers/auth.js:225-231`; `helpers/avisos-cuenta.js:76-106`). No cambia el contrato de la respuesta ni puede hacer fallar el login. La primera vez que la cuenta ve un dispositivo se siembra la lista **sin** avisar (`helpers/dispositivos-conocidos.js:22-53`).

---

## [POST] /api/auth/cuentas/password-olvidado

**Descripción:** Solicita el enlace de restablecimiento de contraseña. Responde siempre con mensaje genérico (anti-enumeración) y entrega `data.token`: token opaco 64-hex sin PII que actúa como sesión de recuperación (60 min). Si la cuenta existe, está verificada y `estatus === 1`, y no hay cooldown, genera un JWT (`RESET_PASSWORD_SECRET`, 1 h) y envía el correo.
**Archivo de ruta:** `routes/auth.js:67-72`
**Controlador:** `controllers/auth.js` — `envioCorreoReestablecerPassword` (línea 333) → `procesarEnvioReestablecerPassword` (línea 281)

> **Actualizado 2026-11-10 (sync Postman, O1):** nueva capa IP dedicada `recuperacionSolicitudIpLimiter` (H2) y `data.token` ahora presente **siempre** (también en cooldown y para cuentas no elegibles).

### Autenticación y permisos
- Requiere token: **No**.
- Cadena de middlewares: `recuperacionSolicitudIpLimiter` → `recuperacionSolicitudLimiter` → `check('correo', 'El correo no es valido').isEmail()` → `validarCampos` → controlador.
- Rate limiters: `recuperacionSolicitudIpLimiter` (`middlewares/rate-limiter.js:59-69`), 15 min / **10 por IP**, código `RECOVERY_BLOCKED`, capa IP dedicada que **no** comparte cubo con `flujoTokenIpLimiter`; y `recuperacionSolicitudLimiter`, 15 min / 3, código `RECOVERY_BLOCKED`, clave **IP + correo**. Cubo independiente del resto del flujo de recuperación.

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
- Código de estado: `200` — siempre, en todos los casos (correo inexistente, cuenta no elegible, cooldown o envío exitoso):
```json
{
  "success": true,
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña",
  "data": { "token": "9f2c1a7e4b8d3f06a5c2e19d84b7f3026d1e9c45a8f30b7d2e6c94a1f8b3d507" }
}
```
- `data.token` (`controllers/auth.js:284`, `helpers/generar-token-opaco.js:4`): 32 bytes hex = 64 caracteres hexadecimales, sin PII. **No es un JWT.** Solo para cuentas elegibles (`email_validated && estatus === 1`) se guarda su SHA-256 en `reset_sesion_token` con `reset_sesion_expira` = +60 min (`MINUTOS_VIGENCIA_SESION_RESET`, `controllers/auth.js:278, 286-292`); también se registra en cooldown (`:299`) para que el reenvío posterior funcione.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de recuperación de contraseña, intenta de nuevo en 15 minutos" (capa IP dedicada, 10/15 min) | `middlewares/rate-limiter.js:62-67` (:59-69) |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | Mismo texto (cubo IP + correo, 3/15 min) | `middlewares/rate-limiter.js:77-82` (:74-88) |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El correo no es valido" | `routes/auth.js:69` + `middlewares/validar-campos.js:28` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "No se pudo enviar el correo" (SMTP falla para una cuenta elegible; `Error` plano convertido por el catch) | `email/servicios-correo-reestablecer-password.js:193` (propagado por `controllers/auth.js:338-339`) |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado (catch-all) | `controllers/auth.js:339` |

### Notas para el Frontend
- `data.token` es un **token opaco** (32 bytes hex, `helpers/generar-token-opaco.js`), **no un JWT**. Úsalo como token de sesión temporal del cliente (sessionStorage) y envíalo en `POST /api/auth/reenviar-correo-restablecer-password` si el usuario pide reenvío.
- `data.token` está presente en **todos** los casos, incluido el cooldown. Anti-enumeración completa (salvo el 500 si el SMTP falla, ver tabla).
- **Capa IP dedicada (H2):** agotar `password-olvidado` (10/15 min por IP) no bloquea el resto del flujo de recuperación ni comparte cubo con `flujoTokenIpLimiter`.
- La sesión de recuperación dura 60 min; un reset exitoso la elimina (ver `reestablecer-password`).

---

## [POST] /api/auth/reenviar-correo-restablecer-password

**Descripción:** Reenvía el correo de restablecimiento. Recibe el **token opaco** de la sesión de recuperación (el `data.token` de `password-olvidado`, 64 hex), busca la cuenta por su SHA-256 y ejecuta el mismo flujo que la ruta anterior. Responde siempre 200 genérico (anti-enumeración).
**Archivo de ruta:** `routes/auth.js:75-78`
**Controlador:** `controllers/auth.js` — `reenvioCorreoRestablecerPassword` (línea 343) → `procesarEnvioReestablecerPassword` (línea 281)

> **Actualizado 2026-11-10 (sync Postman, O1):** el body ya **no** lleva un JWT, sino el token opaco de 64 hex de `password-olvidado` (validación `^[a-f0-9]{64}$`); la búsqueda es por SHA-256 del token y la sesión **no rota**. Nueva capa IP `flujoTokenIpLimiter`.

### Autenticación y permisos
- Requiere token: **No** (token opaco en body).
- Cadena de middlewares: `flujoTokenIpLimiter` → `recuperacionReenvioLimiter` → `check('token', 'Token invalido').isString().matches(/^[a-f0-9]{64}$/)` → `validarCampos` → controlador.
- Rate limiters: `flujoTokenIpLimiter` (`middlewares/rate-limiter.js:41-51`), 15 min / **60 por IP**, código `FLOOD_BLOCKED`, instancia compartida con los otros 4 endpoints de flujo de token; y `recuperacionReenvioLimiter`, 15 min / 3, código `RECOVERY_BLOCKED`, clave **IP + token** (hasheado con `claveToken`). Cubo independiente de la solicitud inicial.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `token` | string (token opaco de 64 hex) | Sí | `isString()` + `matches(/^[a-f0-9]{64}$/)`; mensaje `"Token invalido"` → 422. **No se acepta un JWT** |

### Ejemplo de request
```http
POST /api/auth/reenviar-correo-restablecer-password
Content-Type: application/json

{ "token": "9f2c1a7e4b8d3f06a5c2e19d84b7f3026d1e9c45a8f30b7d2e6c94a1f8b3d507" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200` — siempre, en todos los casos (token válido, desconocido o vencido):
```json
{
  "success": true,
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña",
  "data": { "token": "9f2c1a7e4b8d3f06a5c2e19d84b7f3026d1e9c45a8f30b7d2e6c94a1f8b3d507" }
}
```
- `data.token` es el **mismo** token del body (eco, `controllers/auth.js:355`): la sesión no rota (`controllers/auth.js:289` — con `tokenSesion` no se reescriben los campos de sesión). Si el token existe por su hash y no venció (`controllers/auth.js:348-351`), respeta el cooldown de 5 min y envía un nuevo correo con JWT de reset (1 h). Token desconocido/vencido: mismo 200 sin correo (`:354-356`).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:44-48` (:41-51) |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | "Demasiados reenvíos de correo de recuperación, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:93-98` (:90-104) |
| 422 | `VALIDATION_FAILED` | Validation Failed | "Token invalido" (dentro de `errors`; incluye JWTs o tokens de otra longitud) | `routes/auth.js:76` + `middlewares/validar-campos.js:28` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "No se pudo enviar el correo" | `email/servicios-correo-reestablecer-password.js:193` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado (catch-all) | `controllers/auth.js:360` |

### Notas para el Frontend
- Enviar el **token opaco** devuelto por `POST /api/auth/cuentas/password-olvidado` (`data.token`), no el JWT del enlace del correo. Un JWT responde 422 "Token invalido".
- Token inválido/vencido responde el **mismo 200** con el token de vuelta: no hay forma de distinguir un token válido de uno inválido por la respuesta (anti-enumeración).
- El token de sesión no rota en el reenvío: seguir usando el mismo `data.token` hasta que un reset exitoso lo invalide.
- Cooldown de 5 min entre correos (`ultimo_correo_enviado`); en cooldown responde el mismo 200 sin enviar nada.
- 429 doble: `FLOOD_BLOCKED` (capa IP compartida) y `RECOVERY_BLOCKED` (cubo IP + token). Distinguir por `code`.

---

## [GET] /api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}

**Descripción:** Valida el JWT de restablecimiento que llega en el enlace del correo, antes de mostrar el formulario. Comprueba firma (`RESET_PASSWORD_SECRET`), existencia de la cuenta, que el hash coincida con `reset_password_token`, que la cuenta esté verificada y con `estatus === 1`.
**Archivo de ruta:** `routes/auth.js:80-84`
**Controlador:** `controllers/auth.js` — `validarTokenRestablecerPassword` (línea 366)

> **Actualizado 2026-11-10 (sync Postman):** nueva capa IP `flujoTokenIpLimiter` y los tokens vencidos/inválidos ahora responden **401** (`TOKEN_EXPIRED` / `UNAUTHORIZED`), no 500 (H6).

### Autenticación y permisos
- Requiere token: **No** (token en la URL).
- Cadena de middlewares: `flujoTokenIpLimiter` → `recuperacionValidarTokenLimiter` → `validarTokenEnURL` → `check('token', 'Token invalido').isJWT()` → `validarCampos` → controlador.
- Rate limiters: `flujoTokenIpLimiter` (`middlewares/rate-limiter.js:41-51`), 15 min / **60 por IP**, código `FLOOD_BLOCKED`, instancia compartida con los otros 4 endpoints de flujo de token; y `recuperacionValidarTokenLimiter`, 15 min / **20**, código `RECOVERY_BLOCKED`, clave **IP + token** (hasheado). Más holgado porque los escáneres de correo precargan el enlace.

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
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:44-48` (:41-51) |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | "Demasiadas validaciones de token, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:109-114` (:106-120) |
| 400 | `BAD_REQUEST` | Bad Request | "El token es obligatorio en la URL" | `middlewares/validar-token-en-url.js:7` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "Token invalido" (en `errors`) | `routes/auth.js:82` + `middlewares/validar-campos.js:28` |
| 401 | `TOKEN_EXPIRED` | Authentication Required | "El enlace ha expirado" | `helpers/validar-jwt.js:30` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token inválido" (firma inválida, mal formado) | `helpers/validar-jwt.js:32` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la peticion" (en la práctica inalcanzable: `validarTokenEnURL` ya responde 400 antes) | `controllers/auth.js:371` |
| 401 | `UNAUTHORIZED` | Authentication Required | Producción: "Token inválido o expirado". Desarrollo: "El usuario no existe o la cuenta fue eliminada (estatus 4)" | `controllers/auth.js:377-379` |
| 401 | `UNAUTHORIZED` | Authentication Required | Producción: "Token inválido o expirado". Desarrollo: "El token de restablecimiento no coincide o ya fue utilizado" | `controllers/auth.js:381-383` |
| 403 | `FORBIDDEN` | Forbidden | Producción: "Token inválido o expirado". Desarrollo: "La cuenta no ha sido verificada por correo electrónico" | `controllers/auth.js:385-387` |
| 403 | `FORBIDDEN` | Forbidden | Producción: "Token inválido o expirado". Desarrollo: "La cuenta está en estado N (suspendida/reglas violadas)" | `controllers/auth.js:389-391` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Configuración de tokens incompleta" (falta `RESET_PASSWORD_SECRET`) | `helpers/validar-jwt.js:25` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado (catch-all) | `controllers/auth.js:399` |

### Notas para el Frontend
- Token expirado → `401 TOKEN_EXPIRED` "El enlace ha expirado"; firma inválida/malformado → `401 UNAUTHORIZED` "Token inválido". Con 401 ofrecer "solicitar un enlace nuevo" (reenvío con el token opaco de `password-olvidado`).
- En **desarrollo** el `detail` de los errores del controlador revela estados internos de la cuenta (`estatus`, `reset_password_token`). En producción el mensaje es genérico ("Token inválido o expirado"). Decidir por `code`, nunca por `detail`.
- Un token válido **no** invalida el token: puede reutilizarse hasta que `reestablecer-password` lo consuma (`reset_password_token` se borra al cambiar la contraseña).
- **Capa IP compartida (H1):** el cubo `FLOOD_BLOCKED` (60/15 min por IP) es conjunto para los 5 endpoints de flujo de token.

---

## [POST] /api/auth/cuentas/reestablecer-password{/:token}

**Descripción:** Cambia la contraseña con el token del enlace. Valida que el JWT coincida con `reset_password_token`, que la cuenta esté verificada, hashea la nueva contraseña (bcrypt, salt 10), borra `reset_password_token` y la sesión de recuperación opaca (`reset_sesion_token` / `reset_sesion_expira`), pone `intentos_login` en 0 y **revoca todas las sesiones** del usuario (`tokenVersion++` + `UserToken.deleteMany`) en una transacción MongoDB.
**Archivo de ruta:** `routes/auth.js:86-91`
**Controlador:** `controllers/auth.js` — `reestablecerPassword` (línea 404) → `email/servicios-correo-reestablecer-password.js` — `reestablecerPasswordUsuario` (línea 197)

> **Actualizado 2026-11-17 (drift corregido, E1a):** la nota anterior "esta operación no revoca sesiones" era falsa desde el commit `f022c39`: el guardado de la contraseña, el `$inc` de `tokenVersion` y el borrado de todas las filas `UserToken` corren juntos en `session.withTransaction` (`email/servicios-correo-reestablecer-password.js:229-240`).

### Autenticación y permisos
- Requiere token: **No** (token en la URL).
- Cadena de middlewares: `flujoTokenIpLimiter` → `recuperacionResetLimiter` → `check('password', 'El password es obligatorio: debe tener al menos 8 caracteres').trim().isLength({min:8})` → `validarCampos` → controlador.
- **Nota:** esta ruta **no** aplica `validarTokenEnURL` ni `isJWT()` al `:token`; el token llega sin validar de formato al servicio (un token ausente o malformado falla en `validarJWT` → 401).
- Rate limiters: `flujoTokenIpLimiter` (`middlewares/rate-limiter.js:41-51`), 15 min / **60 por IP**, código `FLOOD_BLOCKED`, instancia compartida con los otros 4 endpoints de flujo de token; y `recuperacionResetLimiter`, 15 min / 5, código `RECOVERY_BLOCKED`, clave **IP + token** (hasheado con `claveToken`).

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
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:44-48` (:41-51) |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de restablecimiento de contraseña, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:125-130` (:122-136) |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El password es obligatorio: debe tener al menos 8 caracteres" | `routes/auth.js:88` + `middlewares/validar-campos.js:28` |
| 401 | `TOKEN_EXPIRED` | Authentication Required | "El enlace ha expirado" | `helpers/validar-jwt.js:30` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token inválido" (firma inválida, mal formado o token ausente) | `helpers/validar-jwt.js:32` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Correo no está en el token" | `email/servicios-correo-reestablecer-password.js:202` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Correo no existe en la base de datos" (usuario inexistente o `estatus: 4`) ⚠ responde 500, no 401 | `email/servicios-correo-reestablecer-password.js:205` |
| 401 | `UNAUTHORIZED` | Authentication Required | "La cuenta no ha sido verificada" | `email/servicios-correo-reestablecer-password.js:206` |
| 401 | `UNAUTHORIZED` | Authentication Required | "El token de restablecimiento de contraseña no es válido o ha expirado" (hash ≠ `reset_password_token`: token ya usado o reemitido) | `email/servicios-correo-reestablecer-password.js:208-210` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Configuración de tokens incompleta" (falta `RESET_PASSWORD_SECRET`) | `helpers/validar-jwt.js:25` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado (catch-all; incluye un fallo de la transacción de revocación) | `controllers/auth.js:411-412` |

### Notas para el Frontend
- Token expirado o inválido responde **401** (`TOKEN_EXPIRED` / `UNAUTHORIZED`). Excepción a distinguir por `code`: usuario inexistente o eliminado sigue respondiendo **500** `INTERNAL_ERROR` "Correo no existe en la base de datos" (`email/servicios-correo-reestablecer-password.js:205` usa `InternalError`).
- El éxito elimina la sesión de recuperación opaca (`reset_sesion_token` y `reset_sesion_expira`, `email/servicios-correo-reestablecer-password.js:219-220`): descartar el `data.token` de `password-olvidado` guardado en sessionStorage.
- ⚠ **Política de contraseña inconsistente:** el registro exige mayúscula, minúscula, número y carácter especial (`routes/usuarios.js:51-52`); este endpoint solo exige 8 caracteres. El frontend debe aplicar la política del registro.
- **Revoca todas las sesiones** (E1a): `tokenVersion` se incrementa y se borran todas las filas `UserToken` del usuario (`email/servicios-correo-reestablecer-password.js:234-236`). Cualquier dispositivo con sesión abierta recibirá `401 SESSION_REVOKED` en su siguiente petición autenticada y en `POST /api/auth/refresh` (ver [README § Errores comunes de la sesión](README.md#errores-comunes-de-la-sesión-de-usuario)).
- **Aviso de seguridad (2026-11-25):** tras el reset se crea una `Notificacion` in-app `tipo: "seguridad"` ("Tu contraseña se restableció y se cerraron todas tus sesiones.") con push y correo (sin cooldown), best-effort y después de responder (`controllers/auth.js:425`; `helpers/avisos-cuenta.js:32-62`). El tipo `seguridad` **no** se puede silenciar.
- Tras el éxito, el frontend debe redirigir al login (no hay cookies nuevas).

---

## [POST] /api/auth/refresh

**Descripción:** Renueva la sesión identificada por el claim `sid` del refresh token. Comprueba la firma (HS256), que la sesión exista y no haya vencido en `UserToken`, que el hash del refresh sea el vigente, el estado de la cuenta y el `tokenVersion`; registra señales de riesgo informativas y rota el par de tokens con una actualización atómica condicionada al hash vigente. Un refresh anterior reutilizado **dentro** de la gracia de 30 s es una carrera legítima (409); **fuera** de la gracia es reuso y revoca **solo esa sesión**.
**Archivo de ruta:** `routes/auth.js:93`
**Controlador:** `controllers/auth.js` — `refreshToken` (línea 434); `esCarreraLegitima` (línea 429)

> **Actualizado 2026-11-17 (E3b + E4 + E5a).** Cambia el contrato completo respecto a la versión anterior de este archivo: (1) la sesión se identifica por `sid`, no por buscar el hash; (2) el reuso ya **no** incrementa `tokenVersion` ni cierra todas las sesiones: borra solo la sesión afectada y responde `401 SESSION_REVOKED`; (3) nuevo `409 CONFLICT` para la carrera legítima; (4) el refresh **sí** revisa el estado de la cuenta (`403 ACCOUNT_RESTRICTED` para estatus 2/3, sin borrar la sesión); (5) `expiraEn` desliza con tope absoluto de 90 días; (6) señales de riesgo `ip_nueva` / `ua_nuevo` solo informativas. Los mensajes "Sesión comprometida" y el 401 "Token no válido o expirado con borrado del registro" ya no existen.

> **Actualizado 2026-11-25:** el limitador del endpoint pasa a dos capas (`refreshIpLimiter` 300/15 min por IP + `refreshLimiter` 10/15 min por `sid`); el contrato de la respuesta no cambia.

### Autenticación y permisos
- Requiere token: **Sí, cookie `refreshToken`** (sin body). No usa `verificarTokenSesion`.
- Cadena de middlewares: `refreshIpLimiter` → `refreshLimiter` → `refreshToken`.
- Rate limiters (dos capas desde 2026-11-25):
  - `refreshIpLimiter` (`middlewares/rate-limiter.js:224-233`), 15 min / **300 por IP**, código `REFRESH_BLOCKED`. Techo holgado para NAT/CGNAT (muchas sesiones tras una IP).
  - `refreshLimiter` (`:237-247`), 15 min / 10, clave **por sesión**: `sid:<uuid>` del claim `sid` de la cookie `refreshToken` (leído **sin verificar la firma**, `helpers/clave-limite.js:67-78`), con fallback `tok:<hash>` si el token es ilegible e `ip:<claveIp>` si no hay cookie. Código `REFRESH_BLOCKED`.
  - **Ya no es un cubo por IP**: 10/15 min por sesión. Muchas pestañas/dispositivos tras la misma IP ya no comparten el límite fino; el techo compartido es el de 300 por IP.

### Parámetros de entrada
Ninguno en body/params/query. Cookie `refreshToken` obligatoria. Cabeceras leídas para metadata y señales de riesgo: `User-Agent` y la IP vía `ipCliente(req)` (`controllers/auth.js:485`, `helpers/obtener-informacion-dispositivo.js:14`).

### Orden de comprobación (`controllers/auth.js:434-534`)
1. Sin cookie `refreshToken` → 401 `UNAUTHORIZED` (`:437-439`).
2. `jwt.verify` con `algorithms: ['HS256']` (`helpers/tokensUtils.js:76-78`): vencido → 401 `UNAUTHORIZED`; firma inválida, malformado u otro algoritmo → 403 `FORBIDDEN` (`:441-450`).
3. Sin `sid` o `type !== 'refresh'` (refresh anterior al rediseño) → 401 `SESSION_REVOKED` (`:452-455`).
4. Consulta en paralelo `UserToken.findOne({ sessionId: sid, userId: id })` y `Usuario.findById(id)` (`:459-462`).
5. Sesión inexistente o `expiraEn <= ahora` → 401 `SESSION_REVOKED`, sin efectos (`:465`).
6. Hash recibido ≠ `token` vigente: si es `tokenAnterior` y `rotadoAt` está dentro de `GRACIA_ROTACION_MS` (30 s, `helpers/vigencia-sesion.js:73`) → 409 `CONFLICT` sin cookies (`:467-470`); si no → **reuso**: `UserToken.deleteOne` de **esa** sesión, log `[SEGURIDAD] Reuso de refresh token` y 401 `SESSION_REVOKED` (`:471-475`).
7. Estado de la cuenta con `errorEstadoCuenta` (`helpers/estado-cuenta-sesion.js:17-28`); la sesión **no** se borra (`:478-479`).
8. `tokenVersion` de la cuenta ≠ claim → 401 `SESSION_REVOKED` (`:481`).
9. Señales de riesgo (`helpers/senales-riesgo-sesion.js:42-59`) y emisión de los tokens nuevos con el mismo `sid` (`:485-491`).
10. Rotación atómica `findOneAndUpdate({ _id, token: hashRecibido, expiraEn: { $gt: ahora } })` que escribe `token`, `tokenAnterior`, `rotadoAt`, `lastUsed`, `expiraEn`, `ipUltima`, `userAgent`, `deviceName` y los operadores de señales (`:494-511`). Si no gana (otra petición rotó antes o la sesión se cerró): 409 si es carrera legítima, si no 401 `SESSION_REVOKED` (`:512-518`).
11. Log `[RIESGO]` solo si la rotación ganó y hubo señales (`:520-523`); cookies nuevas (`:526-529`) y 200 (`:530`).

### Ejemplo de request
```http
POST /api/auth/refresh
Cookie: refreshToken=eyJhbGciOiJIUzI1NiJ9…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
- Cookies nuevas: `accessToken` y `refreshToken`, con el **mismo `sid`** y un `jti` nuevo en el refresh. `Max-Age` derivado del `exp` de cada token. El `exp` del refresh nuevo es `min(ahora + REFRESH_TOKEN_EXPIRY, creadaEn + SESION_MAX_ABSOLUTA_DIAS)`: cerca del tope absoluto, el refresh se re-firma para vencer junto con la fila (`helpers/vigencia-sesion.js:56-68`).
```json
{ "success": true, "msg": "Token renovado" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `REFRESH_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes de renovación de token desde esta conexión, intenta de nuevo más tarde" (techo por IP) | `middlewares/rate-limiter.js:227-232` (limiter `:224-233`) |
| 429 | `REFRESH_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes de renovación de token, intenta de nuevo en 15 minutos" (cubo por sesión, `sid`) | `middlewares/rate-limiter.js:240-245` (limiter `:237-247`) |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay cookies de sesion para hacer refresh token" | `controllers/auth.js:438` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido o expirado" (refresh con `exp` vencido; no borra nada) | `controllers/auth.js:446` |
| 403 | `FORBIDDEN` | Forbidden | "Token no registrado" (firma inválida, token malformado u otro algoritmo; no borra nada) | `controllers/auth.js:449` |
| 401 | `SESSION_REVOKED` | Authentication Required | "La sesión fue cerrada. Inicia sesión nuevamente." — refresh sin `sid` o sin `type: 'refresh'` | `controllers/auth.js:454` (clase `errors/error-classes.js:59-63`) |
| 401 | `SESSION_REVOKED` | Authentication Required | Mismo texto — sesión inexistente (logout, cierre remoto, reset de contraseña, TTL) o vencida (`expiraEn <= ahora`) | `controllers/auth.js:465` |
| 409 | `CONFLICT` | Conflict | "La sesión ya se renovó en otra solicitud; reintenta con las cookies actuales" (refresh anterior dentro de la gracia de 30 s; sin cookies nuevas, sin cambios) | `controllers/auth.js:469` y `:515` |
| 401 | `SESSION_REVOKED` | Authentication Required | Mismo texto — **reuso** fuera de la gracia: se borra solo esa sesión | `controllers/auth.js:474` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido - usuario no existe" (usuario inexistente o `estatus: 4`) | `helpers/estado-cuenta-sesion.js:20` vía `controllers/auth.js:479` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta no activada. El usuario debe verificar su cuenta" (`estatus: 0` o `email_validated: false`) | `helpers/estado-cuenta-sesion.js:23` vía `controllers/auth.js:479` |
| 403 | `ACCOUNT_RESTRICTED` | Forbidden | "Tu cuenta está restringida" (`estatus` 2, 3 o cualquier otro ≠ 1); **la sesión no se borra** | `helpers/estado-cuenta-sesion.js:26` (clase `errors/error-classes.js:78-82`) vía `controllers/auth.js:479` |
| 401 | `SESSION_REVOKED` | Authentication Required | Mismo texto — `tokenVersion` de la cuenta distinto del claim (revocación masiva posterior) | `controllers/auth.js:481` |
| 401 | `SESSION_REVOKED` | Authentication Required | Mismo texto — la rotación atómica no ganó y no es carrera legítima (la sesión se cerró entre la lectura y la escritura) | `controllers/auth.js:517` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado (p. ej. fallo de BD) | `controllers/auth.js:533` |

### Notas para el Frontend
- No envía body; el navegador debe incluir la cookie (`credentials: 'include'`).
- Llamar al refresh **solo** cuando una petición autenticada devuelva `401` con `code: "UNAUTHORIZED"` (access vencido o inválido). **Nunca** ante `SESSION_REVOKED`, `INVALID_CURRENT_PASSWORD` ni `ACCOUNT_RESTRICTED`.
- `401 SESSION_REVOKED` en el refresh: la sesión ya no existe. Limpiar el estado local y mandar al login; no reintentar.
- `409 CONFLICT`: otra pestaña o un reintento ya renovó la sesión en los últimos 30 s. **No** cerrar sesión: reintentar la petición original con las cookies actuales (el navegador ya tiene las nuevas). Un refresh único en vuelo sigue siendo la mejor práctica, pero dos refresh simultáneos ya **no** cierran todas las sesiones (H23 resuelto: uno responde 200 y el otro 409, verificado por `test/integration/refresh-sesion.test.js:145`).
- `403 ACCOUNT_RESTRICTED`: cuenta con estatus 2/3. Cerrar la sesión local y mostrar "cuenta restringida". La fila `UserToken` sigue en BD por decisión B1 (el estatus puede revertirse).
- `403 FORBIDDEN` "Token no registrado": cookie con firma inválida o manipulada. Tratar como sesión perdida.
- **Señales de riesgo (E5a), solo informativas:** si la IP (`ipCliente`) difiere de `ipUltima` se agrega `ip_nueva` a `riesgo.motivos` y una entrada `{ ip, pais: null, fecha }` a `ipHistorial` (máx. 5, `$slice: -5`); si cambia el navegador u OS (sin versión, `firmaUserAgent`, `helpers/senales-riesgo-sesion.js:22-28`) se agrega `ua_nuevo` (`helpers/senales-riesgo-sesion.js:42-59,69-78`). Nunca bloquean, no cambian la respuesta ni cierran la sesión. El país (`paisUltimo`) queda en `null` (E5b diferido).
- **Vida de la sesión:** `expiraEn` se desliza en cada refresh exitoso con tope absoluto `creadaEn + 90 días` (`SESION_MAX_ABSOLUTA_DIAS`, `helpers/vigencia-sesion.js:14,23-26`). Pasado el tope, el refresh responde `401 SESSION_REVOKED` y hay que volver a iniciar sesión. El falso positivo de reuso por TTL de `createdAt` (H22) ya no aplica a usuarios: el TTL es sobre `expiraEn`.
- `refreshLimiter` es **por sesión** (10/15 min, clave `sid`), no por IP: pestañas múltiples tras una misma red (NAT/CGNAT) **no** comparten ese cubo. El techo compartido es `refreshIpLimiter` (300/15 min por IP). Si recibes `429 REFRESH_BLOCKED`, espera `Retry-After` y reintenta una sola vez; no cierres la sesión local (las cookies actuales siguen valiendo hasta que venza el access token).

---

## [POST] /api/auth/logout

**Descripción:** Cierra la sesión actual. Identifica la sesión por el `sid` del `accessToken` o, si falta o no es válido, del `refreshToken` (en ambos casos exige firma HS256 y acepta tokens expirados), borra su fila `UserToken` por `sessionId` + `userId` y **siempre** limpia las cookies `accessToken` y `refreshToken`, haya o no sesión.
**Archivo de ruta:** `routes/auth.js:96`
**Controlador:** `controllers/auth.js` — `logout` (línea 554), `sesionIdentificable` (línea 542) → `helpers/cerrar-sesion-cookies.js` — `cerrarSesionCookies` (línea 17)

> **Actualizado 2026-11-17 (E3).** Antes la fila se buscaba por el hash del refresh y solo se leía la cookie `refreshToken`. Ahora se usa el `sid` (primero del access) y la fila se borra con `deleteOne({ sessionId, userId })` (`helpers/cerrar-sesion-cookies.js:19-21`). Como cada request autenticado valida el `sid` contra `UserToken`, el access token queda **inválido al instante** en el servidor (H24 resuelto).

### Autenticación y permisos
- Requiere token: **No.** Las cookies son opcionales: solo sirven para identificar qué fila borrar. Sin ellas, con firma inválida, con otro algoritmo o con tokens sin `sid`, no se borra nada y la respuesta es la misma (`controllers/auth.js:542-553`).
- Cadena de middlewares: `logout` (sin middlewares).
- Rate limiter: **ninguno**.

### Parámetros de entrada
Ninguno (cookies `accessToken` y `refreshToken` opcionales).

### Ejemplo de request
```http
POST /api/auth/logout
Cookie: accessToken=eyJhbGciOiJIUzI1NiJ9…; refreshToken=eyJhbGciOiJIUzI1NiJ9…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200` (con cookies válidas o expiradas, sin cookies o con cookies de firma inválida).
- Cabeceras: `Set-Cookie` que borra `accessToken` y `refreshToken` (`HttpOnly; Secure; SameSite=None; Path=/`, `helpers/cerrar-sesion-cookies.js:5,22-23`).
```json
{ "success": true, "msg": "Sesión cerrada" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al cerrar la sesión: <mensaje original>" si falla el borrado en `UserToken` (verificado por `test/logout.test.js`) | `helpers/cerrar-sesion-cookies.js:25` → `controllers/auth.js:564` |

Nunca responde `401`.

### Notas para el Frontend
- Se puede llamar siempre, con o sin cookies y con tokens expirados; el `200` garantiza que el navegador borra ambas cookies httpOnly.
- Tras el éxito, limpiar el estado de sesión del cliente. Un `GET /api/auth/me` posterior con una copia del access token responde `401 SESSION_REVOKED` (la fila ya no existe).
- Solo cierra **esta** sesión; las de otros dispositivos siguen abiertas (ver `DELETE /api/auth/sesiones/otras`).
- ⚠ El `detail` del 500 incluye el mensaje interno del error de BD (patrón H8).

---

## [GET] /api/auth/me

**Descripción:** Devuelve el perfil básico del usuario autenticado a partir de la cookie `accessToken`.
**Archivo de ruta:** `routes/auth.js:98-101`
**Controlador:** `controllers/auth.js` — `getMe` (línea 227)

### Autenticación y permisos
- Requiere token: **Sí, cookie `accessToken`** con `sid` de una sesión viva.
- Cadena de middlewares: `verificarTokenSesion` (`middlewares/validar-jwt-cookies-sesion.js:58-70`) → `getMe`.
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
- Forma según `Usuario.toJSON` (`models/Usuario.js:206-214`): se eliminan `_id`, `password`, `verificacion_token`, `reset_password_token`, `reset_sesion_token`, `reset_sesion_expira`, `tokenVersion`, `url_history` y `__v`, y se agrega `uid`.
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
Errores de `verificarTokenSesion` (comunes a **todas** las rutas con sesión; ver [README § Errores comunes de la sesión](README.md#errores-comunes-de-la-sesión-de-usuario)):

| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" | `middlewares/validar-jwt-cookies-sesion.js:60` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido" (firma, expiración o algoritmo distinto de HS256) | `middlewares/validar-jwt-cookies-sesion.js:34` |
| 401 | `SESSION_REVOKED` | Authentication Required | "La sesión fue cerrada. Inicia sesión nuevamente." (access sin `sid`, o sesión cerrada/vencida en `UserToken`) | `middlewares/validar-jwt-cookies-sesion.js:38,46` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido - usuario no existe" (inexistente o `estatus: 4`) | `helpers/estado-cuenta-sesion.js:20` vía `middlewares/validar-jwt-cookies-sesion.js:48-49` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta no activada. El usuario debe verificar su cuenta" (`estatus: 0` o `email_validated: false`) | `helpers/estado-cuenta-sesion.js:23` vía `:48-49` |
| 403 | `ACCOUNT_RESTRICTED` | Forbidden | "Tu cuenta está restringida" (`estatus` 2 o 3) | `helpers/estado-cuenta-sesion.js:26` vía `:48-49` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión expirada - inicia sesión nuevamente" (`tokenVersion` distinto, con la sesión todavía viva) | `middlewares/validar-jwt-cookies-sesion.js:52` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Fallo de BD en el middleware (nunca 401) | `middlewares/validar-jwt-cookies-sesion.js:67-68` → `middlewares/error-handler.js:108-118` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no existe" (inalcanzable en la práctica: el middleware ya validó) | `controllers/auth.js:236` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado | `controllers/auth.js:245` |

### Notas para el Frontend
- ⚠ **Discrepancia de contrato:** la respuesta de `/me` trae `uid` pero **no** `_id`; el `data.usuario` del login trae `_id` y `uid`. Usar `uid` en ambos casos.
- `imagen_perfil.secure_url` se entrega en la respuesta (a diferencia de los posteos, donde `secure_url` se oculta por política; ver [posteos.md](posteos.md)).
- Usar esta ruta para restaurar sesión al cargar la app: `401 UNAUTHORIZED` → intentar `POST /api/auth/refresh` una vez; `401 SESSION_REVOKED` o `403 ACCOUNT_RESTRICTED` → ir al login sin refresh.

---

## [GET] /api/auth/sesiones

**Descripción:** Lista las sesiones vigentes (`expiraEn > now`) del usuario autenticado, de la más reciente a la más antigua por `lastUsed`, con la IP enmascarada y la marca `esActual` para la sesión desde la que se consulta (E6).
**Archivo de ruta:** `routes/auth.js:104-107`
**Controlador:** `controllers/sesiones.js` — `listarSesiones` (línea 26)

> **Nuevo 2026-11-17 (E6, commit `1f9b243`).**

### Autenticación y permisos
- Requiere token: **Sí, cookie `accessToken`** (sesión viva).
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `sesionesUsuarioLimiter` → `listarSesiones`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / **3000** por IP (env `FLOOD_LECTURA_IP_MAX`), clave IP, código `FLOOD_BLOCKED`.
  - `sesionesUsuarioLimiter` (`middlewares/rate-limiter.js:401-406`), 15 min / **30**, clave usuario (`u:<id>`, `helpers/clave-limite.js:22-28`), código `SESIONES_BLOCKED`. Cubo compartido con los dos `DELETE /api/auth/sesiones*`.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/auth/sesiones
Cookie: accessToken=eyJhbGciOiJIUzI1NiJ9…
```

### Ejemplo de response — éxito
- Código de estado: `200`
- Forma tomada de `test/integration/sesiones-activas.test.js:85-115` (ejecutado el 2026-11-17 con `node --test test/integration/sesiones-activas.test.js test/logout.test.js`: 20/20 pasan; `sessionId`, `lastUsed` e IPs son ilustrativos):
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "0b8f3c2a-6d1e-4f7a-9c35-2e4b8a1d7f60",
      "deviceName": "Safari en iOS",
      "paisUltimo": null,
      "ipUltima": "2806:2f0:x:x:x:x:x:x",
      "lastUsed": "2026-11-17T19:20:00.000Z",
      "esActual": false
    },
    {
      "sessionId": "5a1c9e47-2b3d-4c8f-a0e6-7d9b1f3c5e28",
      "deviceName": "Chrome en Windows",
      "paisUltimo": null,
      "ipUltima": "187.162.x.x",
      "lastUsed": "2026-11-17T19:19:59.000Z",
      "esActual": true
    }
  ]
}
```
- Forma de cada elemento (`controllers/sesiones.js:34-41`): `sessionId` (string UUID), `deviceName` (string o `null`), `paisUltimo` (siempre `null` en v1), `ipUltima` (enmascarada o `null`), `lastUsed` (fecha; si falta, `creadaEn`, y si falta, `null`), `esActual` (boolean, `sessionId === req.sessionId`). **Sin `msg`.** Nunca incluye `token`, `userId`, `userAgent`, `ipPrimera`, `ipHistorial` ni `riesgo` (proyección `controllers/sesiones.js:30`).
- Enmascarado (`helpers/enmascarar-ip.js:39-58`): IPv4 → `a.b.x.x`; IPv4 mapeada `::ffff:a.b.c.d` → como IPv4; IPv6 → 2 primeros grupos + `:x:x:x:x:x:x`; vacía o inválida → `null`. La IP completa nunca sale en claro.
- Lista vacía posible si la propia sesión venció entre la validación y la consulta (en la práctica siempre incluye la actual).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:273-278` |
| 401 / 403 / 500 | `UNAUTHORIZED` · `SESSION_REVOKED` · `FORBIDDEN` · `ACCOUNT_RESTRICTED` · `INTERNAL_ERROR` | — | Errores comunes de `verificarTokenSesion` (tabla de `GET /api/auth/me`). Sin sesión → 401 (verificado por `test/integration/sesiones-activas.test.js:118-121`) | `middlewares/validar-jwt-cookies-sesion.js:58-70` |
| 429 | `SESIONES_BLOCKED` | Rate Limit Exceeded | "Demasiadas operaciones sobre tus sesiones, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:401-406` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al procesar la solicitud" | `controllers/sesiones.js:22` |

### Notas para el Frontend
- Usar `esActual` para marcar "este dispositivo" y ocultar o reetiquetar su botón de cierre (cerrarla equivale a logout).
- `paisUltimo` es `null` en todas las filas hasta E5b; no mostrar columna de país.
- La lista excluye sesiones vencidas aunque el TTL de Mongo aún no las haya borrado (`expiraEn: { $gt: new Date() }`, `controllers/sesiones.js:29`).

---

## [DELETE] /api/auth/sesiones/otras

**Descripción:** Cierra **todas** las sesiones del usuario excepto la actual. Exige la contraseña actual (step-up). No incrementa `tokenVersion`: la sesión actual sigue viva y las demás reciben `401 SESSION_REVOKED` en su siguiente petición (E6).
**Archivo de ruta:** `routes/auth.js:110-119` (declarada **antes** de `/sesiones/:sessionId`, para que `otras` no se interprete como id)
**Controlador:** `controllers/sesiones.js` — `cerrarOtrasSesiones` (línea 80)

> **Nuevo 2026-11-17 (E6, commit `1f9b243`).**

### Autenticación y permisos
- Requiere token: **Sí, cookie `accessToken`** **y** `passwordActual` en el body.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `sesionesUsuarioLimiter` → `passwordUsuarioLimiter` → `check('passwordActual')` → `validarCampos` → `cerrarOtrasSesiones`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), clave IP, código `FLOOD_BLOCKED`.
  - `sesionesUsuarioLimiter` (`middlewares/rate-limiter.js:401-406`), 15 min / 30, clave usuario, código `SESIONES_BLOCKED`.
  - `passwordUsuarioLimiter` (`middlewares/rate-limiter.js:391-396`), 15 min / **5**, clave usuario, código `PASSWORD_BLOCKED`. **Mismo cubo** que `PUT /api/usuarios/password` y `DELETE /api/usuarios/delete`: 5 intentos combinados entre los tres endpoints. Cuenta cada petición que llega al limiter, acierte o no la contraseña.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `passwordActual` | string | Sí | `isString()` (`"La contraseña actual debe ser texto"`), `notEmpty()` (`"La contraseña actual es obligatoria"`), `isLength({max: 128})` (`"La contraseña actual es demasiado larga"`) (`routes/auth.js:114-117`). Se compara con bcrypt contra el hash almacenado (`controllers/sesiones.js:87`) |

### Ejemplo de request
```http
DELETE /api/auth/sesiones/otras
Content-Type: application/json
Cookie: accessToken=eyJhbGciOiJIUzI1NiJ9…

{ "passwordActual": "Password1!" }
```

### Ejemplo de response — éxito
- Código de estado: `200`
- Cuerpo literal verificado por `test/integration/sesiones-activas.test.js:189-193` (ejecutado en esta corrida):
```json
{ "success": true, "msg": "Sesiones cerradas", "data": { "cerradas": 2 } }
```
- `data.cerradas` = `deletedCount` de `UserToken.deleteMany({ userId, sessionId: { $ne: req.sessionId } })` (`controllers/sesiones.js:91-99`). Puede ser `0`. No emite ni limpia cookies.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:285-290` |
| 401 / 403 / 500 | `UNAUTHORIZED` · `SESSION_REVOKED` · `FORBIDDEN` · `ACCOUNT_RESTRICTED` · `INTERNAL_ERROR` | — | Errores comunes de `verificarTokenSesion` (tabla de `GET /api/auth/me`) | `middlewares/validar-jwt-cookies-sesion.js:58-70` |
| 429 | `SESIONES_BLOCKED` | Rate Limit Exceeded | "Demasiadas operaciones sobre tus sesiones, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:401-406` |
| 429 | `PASSWORD_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de cambio de contraseña, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:391-396` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `"La solicitud contiene errores de validación"` (literal de `middlewares/validar-campos.js:28`; no incluye número de errores) con `errors[].field = "passwordActual"` y los mensajes de la tabla de entrada (body `{}` → 422, verificado por `test/integration/sesiones-activas.test.js:213-219`) | `routes/auth.js:114-118` + `middlewares/validar-campos.js:28` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" (casi inalcanzable: el middleware ya validó al usuario) | `controllers/sesiones.js:84` |
| 401 | `INVALID_CURRENT_PASSWORD` | Authentication Required | "La contraseña actual es incorrecta" (default de la clase, `errors/error-classes.js:33-37`); no cierra nada (verificado por `test/integration/sesiones-activas.test.js:199-210`) | `controllers/sesiones.js:88` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al procesar la solicitud" | `controllers/sesiones.js:22` |

### Notas para el Frontend
- Pedir la contraseña en un diálogo de confirmación antes de llamar.
- ⚠ **El 401 `INVALID_CURRENT_PASSWORD` NO debe disparar el refresh**: es un error de negocio. Distinguir por `code`.
- El cubo `PASSWORD_BLOCKED` es compartido con cambio de contraseña y borrado de cuenta: tras 5 intentos en 15 min los tres endpoints quedan bloqueados para ese usuario.
- La sesión actual conserva sus cookies; refrescar la lista con `GET /api/auth/sesiones` tras el éxito.

---

## [DELETE] /api/auth/sesiones/:sessionId

**Descripción:** Cierra una sesión propia por su `sessionId`. Si es la sesión actual equivale a logout (borra la fila y limpia ambas cookies). Una sesión ajena, vencida o inexistente responde 404 sin revelar si existe (E6).
**Archivo de ruta:** `routes/auth.js:120-125`
**Controlador:** `controllers/sesiones.js` — `cerrarSesion` (línea 52)

> **Nuevo 2026-11-17 (E6, commit `1f9b243`).**

### Autenticación y permisos
- Requiere token: **Sí, cookie `accessToken`**. No exige contraseña.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `sesionesUsuarioLimiter` → `check('sessionId').isUUID(4)` → `validarCampos` → `cerrarSesion`.
- Rate limiters: `floodEscrituraIpLimiter` (15 min / **600** por IP, `FLOOD_BLOCKED`, `middlewares/rate-limiter.js:282-291`) y `sesionesUsuarioLimiter` (15 min / 30, usuario, `SESIONES_BLOCKED`, `middlewares/rate-limiter.js:401-406`).

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `sessionId` | string | Sí | `isUUID(4)`; mensaje `"El id de sesión no es válido"` → 422 (`routes/auth.js:123`) |

### Ejemplo de request
```http
DELETE /api/auth/sesiones/0b8f3c2a-6d1e-4f7a-9c35-2e4b8a1d7f60
Cookie: accessToken=eyJhbGciOiJIUzI1NiJ9…
```

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Sesión cerrada" }
```
- **Otra sesión propia** (`controllers/sesiones.js:61-70`): `UserToken.deleteOne({ sessionId, userId: req.usuario, expiraEn: { $gt: now } })`. **No** envía `Set-Cookie`; la sesión actual sigue. El access token de la sesión cerrada recibe `401 SESSION_REVOKED` en su siguiente petición (verificado por `test/integration/sesiones-activas.test.js:125-141`).
- **Sesión actual** (`controllers/sesiones.js:56-59`): `cerrarSesionCookies(res, { sessionId, userId })` borra la fila y envía `Set-Cookie` que limpia `accessToken` y `refreshToken` (verificado por `test/integration/sesiones-activas.test.js:143-154`).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:285-290` |
| 401 / 403 / 500 | `UNAUTHORIZED` · `SESSION_REVOKED` · `FORBIDDEN` · `ACCOUNT_RESTRICTED` · `INTERNAL_ERROR` | — | Errores comunes de `verificarTokenSesion` (tabla de `GET /api/auth/me`) | `middlewares/validar-jwt-cookies-sesion.js:58-70` |
| 429 | `SESIONES_BLOCKED` | Rate Limit Exceeded | "Demasiadas operaciones sobre tus sesiones, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:401-406` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `"La solicitud contiene errores de validación"` (literal de `middlewares/validar-campos.js:28`) con `errors: [{ field: "sessionId", message: "El id de sesión no es válido" }]` (p. ej. `no-es-uuid`, verificado por `test/integration/sesiones-activas.test.js:175-176`) | `routes/auth.js:123-124` + `middlewares/validar-campos.js:28` |
| 404 | `NOT_FOUND` | Resource Not Found | "Sesión no encontrada" (ajena, vencida o inexistente; no se borra nada) | `controllers/sesiones.js:67` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al procesar la solicitud" (incluye un fallo de `cerrarSesionCookies`) | `controllers/sesiones.js:22` |

### Notas para el Frontend
- Tomar `sessionId` de `GET /api/auth/sesiones`; nunca construirlo.
- Si `esActual` era `true`, tras el 200 tratarlo como logout: las cookies ya se limpiaron.
- Un 404 no distingue "ajena" de "ya cerrada": refrescar la lista.
