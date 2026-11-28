# Documentación de Endpoints — TlaxApp API (DELTA sync Postman 2026-11-10)

**Generado:** 2026-11-10 12:12:40
**Total de endpoints documentados:** 7 (delta de la corrida del sincronizador 2026-11-10: 7 modificados, 0 nuevos, 0 eliminados)
**Archivos de rutas explorados:** `routes/auth.js`, `routes/bienvenida.js` (montaje verificado en `models/server.js:123-124`; el router `bienvenida` se monta en `/`, por lo que la ruta interna `/api/health` es el path completo `GET /api/health`)
**Endpoints no verificables completamente:**
- Ejecución real de los flujos: no se levantó el servidor (requiere MongoDB, SMTP y variables de entorno). Todos los ejemplos están **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.
- Valores reales de `NODE_ENV`, `EMAIL_VERIFICATION_SECRET`, `RESET_PASSWORD_SECRET`, `FRONTEND_URL` y `ACCESS_TOKEN_EXPIRY` → **[REQUIERE VERIFICACIÓN MANUAL]** (el `detail` de varios errores 401/403 depende de `NODE_ENV`).

**Delta frente a la documentación previa** (`docs/api/auth.md` del 2026-11-06 y `docs/api/bienvenida.md` del 2026-11-03):
1. **Capa IP anti-evasión (H1)**: los 5 endpoints con limiter cuya clave incluye un valor controlado por el cliente (token) llevan ahora delante `flujoTokenIpLimiter` (15 min / 60 por IP, código `FLOOD_BLOCKED`, **una sola instancia compartida** entre los 5). Afecta a: `verificar-correo`, `reenviar-correo`, `reenviar-correo-restablecer-password`, `validar-token-reset-password`, `reestablecer-password`.
2. **Capa IP dedicada (H2)**: `password-olvidado` lleva delante `recuperacionSolicitudIpLimiter` (15 min / 10 por IP, `RECOVERY_BLOCKED`), que **no** comparte cubo con `flujoTokenIpLimiter`.
3. **Tokens vencidos/inválidos → 401 (H6)**: `helpers/validar-jwt.js` ahora rechaza con `ExpiredTokenError` (401 `TOKEN_EXPIRED`) o `AuthenticationError` (401 `UNAUTHORIZED`) en lugar de objeto plano → 500. Afecta a los endpoints 1, 2, 5 y 6.
4. **Token de sesión opaco (O1)**: `password-olvidado` devuelve siempre `data.token` = token opaco 64-hex (también en cooldown y para cuentas no elegibles); `reenviar-correo-restablecer-password` ya recibe ese token opaco (validado `^[a-f0-9]{64}$`), no un JWT. Un reset exitoso limpia `reset_sesion_token`.
5. **`GET /api/health`**: corrección de metadata — el limiter real es `healthLimiter` (1 min / 60, `HEALTH_BLOCKED`) y la respuesta mínima es `{ "status": "ok" | "degraded" }` con 200/503 (la doc anterior describía `lecturaLimiter` y una respuesta extensa con `pid`/`memory`, que ya no existe).

Los archivos de dominio `auth.md` y `bienvenida.md` y el `README.md` se actualizaron en esta misma corrida para reflejar este delta.

---

### Formato global de errores (RFC 9457)

Todos los errores de la API siguen el estándar **RFC 9457 (Problem Details)** (`middlewares/error-handler.js`; la construcción del objeto está en `AppError.toProblemDetails`, `errors/app-error.js:40-51`), con esta estructura:

```json
{
  "type": "about:blank",
  "title": "Authentication Required",
  "status": 401,
  "detail": "El enlace ha expirado",
  "instance": "/api/auth/verificar-correo/…",
  "code": "TOKEN_EXPIRED",
  "trace_id": "req_829a8f1b-be1",
  "errors": []
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `type` | string | URI de referencia (actualmente `"about:blank"`) |
| `title` | string | Título legible del error (en inglés por convención) |
| `status` | number | Código HTTP |
| `detail` | string | Descripción específica del error |
| `instance` | string | Ruta que causó el error (`req.originalUrl`) |
| `code` | string | Código de error machine-readable (**UPPERCASE**) |
| `trace_id` | string | ID de correlación para logging (`req.traceId`) |
| `errors` | array | Detalles de validación (opcional): `[{ field, code, message }]` |

Los extras de la clase (`errors`, `retry_after`) se expanden en el nivel superior del JSON (`errors/app-error.js:49`).

#### Clases de error relevantes para este delta

Definidas en `errors/error-classes.js` (heredan de `AppError` en `errors/app-error.js`):

| HTTP | Clase | `code` | title | Archivo |
|---|---|---|---|---|
| 400 | `BadRequestError` | `BAD_REQUEST` | `Bad Request` | `errors/error-classes.js:14` |
| 401 | `AuthenticationError` | `UNAUTHORIZED` | `Authentication Required` | `errors/error-classes.js:21` |
| 401 | `ExpiredTokenError` | `TOKEN_EXPIRED` | `Authentication Required` | `errors/error-classes.js:47` |
| 403 | `ForbiddenError` | `FORBIDDEN` | `Forbidden` | `errors/error-classes.js:54` |
| 422 | `ValidationError` | `VALIDATION_FAILED` | `Validation Failed` | `errors/error-classes.js:96` |
| 429 | `RateLimitError` | `RATE_LIMIT_EXCEEDED` | `Rate Limit Exceeded` | `errors/error-classes.js:107` |
| 500 | `InternalError` | `INTERNAL_ERROR` | `Internal Server Error` | `errors/error-classes.js:120` |

#### Rate limiting en este delta

Los limiters usan la fábrica `crearLimiter` (`helpers/crear-limiter.js:46-54`): `standardHeaders: true` (expone `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`), `legacyHeaders: false`, `validate: false`. El bloqueo responde directamente desde el limiter con la forma RFC 9457 de `rateLimitResponse` (`helpers/crear-limiter.js:19-29`): `title: "Rate Limit Exceeded"`, `status: 429`, `code` propio del limiter, `instance` y `trace_id`; sin `errors`.

| Limiter | Ventana | Máx | Clave | `code` | Archivo |
|---|---|---|---|---|---|
| `flujoTokenIpLimiter` | 15 min | 60 | solo IP | `FLOOD_BLOCKED` | `middlewares/rate-limiter.js:40-50` |
| `recuperacionSolicitudIpLimiter` | 15 min | 10 | solo IP | `RECOVERY_BLOCKED` | `middlewares/rate-limiter.js:58-68` |
| `verificacionLimiter` | 15 min | 20 | IP + token | `VERIFICATION_BLOCKED` | `middlewares/rate-limiter.js:139-153` |
| `reenvioCorreoLimiter` | 5 min | 3 | IP + token | `EMAIL_BLOCKED` | `middlewares/rate-limiter.js:156-170` |
| `recuperacionSolicitudLimiter` | 15 min | 3 | IP + correo | `RECOVERY_BLOCKED` | `middlewares/rate-limiter.js:73-87` |
| `recuperacionReenvioLimiter` | 15 min | 3 | IP + token | `RECOVERY_BLOCKED` | `middlewares/rate-limiter.js:89-103` |
| `recuperacionValidarTokenLimiter` | 15 min | 20 | IP + token | `RECOVERY_BLOCKED` | `middlewares/rate-limiter.js:105-119` |
| `recuperacionResetLimiter` | 15 min | 5 | IP + token | `RECOVERY_BLOCKED` | `middlewares/rate-limiter.js:121-135` |
| `healthLimiter` | 1 min | 60 | solo IP | `HEALTH_BLOCKED` | `middlewares/rate-limiter.js:233-242` |

Reglas de clave aplicadas por `helpers/ip-cliente.js`:
- La IP siempre sale de `ipCliente(req)` (`helpers/ip-cliente.js:102-118`): `do-connecting-ip` validado contra rangos Cloudflare, con fallback a `cf-connecting-ip` y por último `req.ip`. Nunca usar `req.ip` crudo.
- El componente de token es `claveToken` (`helpers/ip-cliente.js:166-171`): SHA-256 del token completo trimmeado, truncado a 32 hex, **case-sensitive**, nunca el token crudo. Token no-string, vacío o > 2048 chars → `''` → el limiter cae a clave solo-IP (`middlewares/rate-limiter.js:13`).
- `flujoTokenIpLimiter` es **una sola instancia compartida** por los 5 endpoints de flujo de token: el techo de 60/15 min por IP es conjunto, no por endpoint (`routes/auth.js:33-35`, `middlewares/rate-limiter.js:33-39`).

---

## [GET] /api/auth/verificar-correo{/:token}

**Descripción:** Activa la cuenta al abrir el enlace del correo de verificación. Valida el JWT del enlace (secreto `EMAIL_VERIFICATION_SECRET`), compara su hash con `verificacion_token` del usuario y marca `email_validated: true`, `estatus: 1` y borra `verificacion_token`.
**Archivo de ruta:** `routes/auth.js:41-45`
**Controlador:** `controllers/auth.js` — `verificarCorreo` (línea 31) → `email/servicios-autenticacion-correo.js` — `verificarCorreoEnviado` (línea 191)

### Autenticación y permisos
- Requiere token: **No** (el JWT viaja en la URL, no hay sesión).
- Cadena de middlewares (orden exacto): `flujoTokenIpLimiter` → `verificacionLimiter` → `validarTokenEnURL` → `check('token', 'Token invalido').isJWT()` → `validarCampos` → `verificarCorreo`.
- Rate limiters: `flujoTokenIpLimiter` (15 min / **60 por IP**, `FLOOD_BLOCKED`, instancia compartida con los otros 4 endpoints de flujo de token) y `verificacionLimiter` (15 min / **20**, `VERIFICATION_BLOCKED`, clave **IP + token** hasheado con `claveToken`). **NUEVO 2026-11-10:** la capa IP no existía en la doc anterior.
- Roles permitidos: N/A (endpoint público).

### Parámetros de entrada
| Ubicación (body/params/query) | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `token` | string (JWT) | Sí (segmento declarado opcional `{/:token}` en Express 5, pero `validarTokenEnURL` exige su presencia) | `validarTokenEnURL`: si falta → 400. `isJWT()` con mensaje `"Token invalido"` → 422 |

### Ejemplo de request
```http
GET /api/auth/verificar-correo/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub21icmUiOiJBbmEiLCJjb3JyZW8iOiJhbmFAZXhhbXBsZS5jb20iLCJpYXQiOjE3MzExNzI4MDB9.signature
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
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:43-47` (limiter :40-50) |
| 429 | `VERIFICATION_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de verificación de correo, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:142-146` (limiter :139-153) |
| 400 | `BAD_REQUEST` | Bad Request | "El token es obligatorio en la URL" | `middlewares/validar-token-en-url.js:7` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La solicitud contiene errores de validación" (`errors: [{field:"token", message:"Token invalido"}]`) | `routes/auth.js:43` + `middlewares/validar-campos.js:28` |
| 401 | `TOKEN_EXPIRED` | Authentication Required | "El enlace ha expirado" (**NUEVO**: antes era 500) | `helpers/validar-jwt.js:30` (clase en `errors/error-classes.js:47-51`) |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token inválido" (firma inválida, mal formado; **NUEVO**: antes era 500) | `helpers/validar-jwt.js:32` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token inválido o ha expirado" (hash del token ≠ `verificacion_token`, p. ej. token ya usado o reemplazado por un reenvío) | `email/servicios-autenticacion-correo.js:204` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Correo no está en el token" | `email/servicios-autenticacion-correo.js:198` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Correo no existe en la base de datos" | `email/servicios-autenticacion-correo.js:201` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Configuración de tokens incompleta" (falta `EMAIL_VERIFICATION_SECRET`) | `helpers/validar-jwt.js:25` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error interno al verificar la cuenta" (catch-all de errores no-AppError) | `email/servicios-autenticacion-correo.js:225` |

### Notas para el Frontend
- **Cambio de semántica (H6):** un JWT **vencido** responde ahora `401` con `code: "TOKEN_EXPIRED"` y `detail: "El enlace ha expirado"`; firma inválida/malformado responde `401 UNAUTHORIZED`. Decidir por `code` (ofrecer "reenviar correo" en ambos casos), nunca por el texto de `detail`. Ya no hay que tratar el 500 como "enlace expirado".
- **Nueva capa IP compartida (H1):** el cubo `FLOOD_BLOCKED` (60/15 min) es conjunto para los 5 endpoints de flujo de token. Un usuario que abre varios enlaces + pide reenvíos + valida reset consume el **mismo** cubo por IP. Redes compartidas (NAT/CGNAT) pueden agotarlo entre todos.
- Los limiters exponen `RateLimit-Limit` / `RateLimit-Remaining` / `RateLimit-Reset` (standard headers) para anticipar el bloqueo.
- El enlace del correo es `${FRONTEND_URL}/cuentas/crear-cuenta/cuenta-verificada/<token>` (`controllers/auth.js:82`).
- Efecto secundario: tras el éxito la cuenta queda `estatus: 1` y el login ya no responde 403 "Cuenta no verificada".

---

## [POST] /api/auth/reenviar-correo

**Descripción:** Reenvía el correo de verificación. Recibe el JWT de sesión de registro (firmado con `JWT_SEED`, payload `{correo}`), aplica cooldown de 5 minutos y genera y envía un nuevo token de verificación (1 h).
**Archivo de ruta:** `routes/auth.js:47-50`
**Controlador:** `controllers/auth.js` — `reenviarCorreoVerificacion` (línea 45)

### Autenticación y permisos
- Requiere token: **No** (usa el JWT del body; no las cookies de sesión).
- Cadena de middlewares (orden exacto): `flujoTokenIpLimiter` → `reenvioCorreoLimiter` → `check('token', 'Token invalido').isJWT()` → `validarCampos` → `reenviarCorreoVerificacion`.
- Rate limiters: `flujoTokenIpLimiter` (15 min / 60 por IP, `FLOOD_BLOCKED`, compartido) y `reenvioCorreoLimiter` (5 min / **3**, `EMAIL_BLOCKED`, clave **IP + token**). **NUEVO 2026-11-10:** la capa IP no existía.
- Roles permitidos: N/A (endpoint público).

### Parámetros de entrada
| Ubicación (body/params/query) | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `token` | string (JWT) | Sí | `isJWT()` con mensaje `"Token invalido"` → 422 |

### Ejemplo de request
```http
POST /api/auth/reenviar-correo
Content-Type: application/json

{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb3JyZW8iOiJhbmFAZXhhbXBsZS5jb20iLCJpYXQiOjE3MzExNzI4MDB9.signature" }
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
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:43-47` (limiter :40-50) |
| 429 | `EMAIL_BLOCKED` | Rate Limit Exceeded | "Demasiados correos enviados, intenta de nuevo en 5 minutos" | `middlewares/rate-limiter.js:159-163` (limiter :156-170) |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La solicitud contiene errores de validación" (`errors: [{field:"token", message:"Token invalido"}]`) | `routes/auth.js:48` + `middlewares/validar-campos.js:28` |
| 401 | `TOKEN_EXPIRED` | Authentication Required | "El enlace ha expirado" (**NUEVO**: antes era 500) | `helpers/validar-jwt.js:30` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token inválido" (firma inválida, mal formado; **NUEVO**: antes era 500) | `helpers/validar-jwt.js:32` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Correo no existe" (usuario inexistente o `estatus: 4`) | `controllers/auth.js:58` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta ya verificada" (`estatus !== 0 && email_validated`) | `controllers/auth.js:64` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | "Espera N minutos antes de reenviar el correo" (cooldown de 5 min desde `ultimo_correo_enviado`; incluye `retry_after` = 60 default) | `controllers/auth.js:77` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "No se pudo enviar el correo" (falla SMTP) | `email/servicios-autenticacion-correo.js:186` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Configuración de tokens incompleta" (falta `JWT_SEED`) | `helpers/validar-jwt.js:25` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado (catch-all) | `controllers/auth.js:95` |

### Notas para el Frontend
- **Cambio de semántica (H6):** JWT vencido/inválido → 401 (`TOKEN_EXPIRED`/`UNAUTHORIZED`), ya no 500. Distinguir del 401 "Correo no existe" por el `detail` (ojo: en este endpoint ambos casos son `UNAUTHORIZED`; el reenvío con token de un usuario eliminado también es 401 "Correo no existe").
- El JWT de entrada es el token que el frontend guarda en sessionStorage tras `POST /api/usuarios` (firmado con `JWT_SEED`; `controllers/auth.js:51`). No es el token de verificación del enlace (ese usa `EMAIL_VERIFICATION_SECRET`).
- Efecto secundario: genera un **nuevo** token de verificación y reemplaza `verificacion_token` (`controllers/auth.js:81-90`); un enlace viejo deja de funcionar.
- Cooldown doble: 429 `EMAIL_BLOCKED` (3 reenvíos / 5 min por IP+token, del limiter) y 429 `RATE_LIMIT_EXCEEDED` (5 min desde el último correo, del controlador). Distinguir por `code`.
- La capa IP `FLOOD_BLOCKED` es compartida con los otros 4 endpoints de flujo de token (ver endpoint 1).

---

## [POST] /api/auth/cuentas/password-olvidado

**Descripción:** Solicita el correo de restablecimiento de contraseña. Responde **siempre** 200 con mensaje genérico (anti-enumeración) y entrega `data.token`: un token opaco 64-hex sin PII que funciona como sesión de recuperación (60 min) para el endpoint de reenvío. Solo si la cuenta es elegible envía el email con el JWT de reset.
**Archivo de ruta:** `routes/auth.js:62-67`
**Controlador:** `controllers/auth.js` — `envioCorreoReestablecerPassword` (línea 323) → `procesarEnvioReestablecerPassword` (línea 271)

### Autenticación y permisos
- Requiere token: **No**.
- Cadena de middlewares (orden exacto): `recuperacionSolicitudIpLimiter` → `recuperacionSolicitudLimiter` → `check('correo', 'El correo no es valido').isEmail()` → `validarCampos` → `envioCorreoReestablecerPassword`.
- Rate limiters: `recuperacionSolicitudIpLimiter` (15 min / **10 por IP**, `RECOVERY_BLOCKED`, **capa IP dedicada — no comparte cubo con `flujoTokenIpLimiter`**) montado **antes** de `recuperacionSolicitudLimiter` (15 min / **3**, `RECOVERY_BLOCKED`, clave **IP + correo**). **NUEVO 2026-11-10 (H2):** agotar el cubo por correo no consume el techo por IP ni viceversa.
- Roles permitidos: N/A (endpoint público).

### Parámetros de entrada
| Ubicación (body/params/query) | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `correo` | string | Sí | `isEmail()` con mensaje `"El correo no es valido"` → 422 |

### Ejemplo de request
```http
POST /api/auth/cuentas/password-olvidado
Content-Type: application/json

{ "correo": "ana@example.com" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200` — **siempre**, en todos los casos (correo inexistente, cuenta no elegible, cooldown o envío exitoso):
```json
{
  "success": true,
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña",
  "data": { "token": "9f2c1a7e4b8d3f06a5c2e19d84b7f3026d1e9c45a8f30b7d2e6c94a1f8b3d507" }
}
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

- `data.token` (`controllers/auth.js:274`, `helpers/generar-token-opaco.js:4`): 32 bytes aleatorios en hex = **64 caracteres hexadecimales**, sin PII. **No es un JWT.**
- Solo si la cuenta existe con `email_validated && estatus === 1`, se guarda la sesión de recuperación: `reset_sesion_token` = SHA-256 hex del token y `reset_sesion_expira` = ahora + **60 min** (`MINUTOS_VIGENCIA_SESION_RESET`, `controllers/auth.js:268, 276-282`). Para cuentas no elegibles el token se devuelve igual pero no se guarda.
- Cooldown de 5 min (`ultimo_correo_enviado`): en cooldown responde el mismo 200 con el token (y registra la sesión si es nueva, `controllers/auth.js:285-295`); sin cooldown crea el JWT de reset (1 h, `RESET_PASSWORD_SECRET`), guarda su hash en `reset_password_token` y envía el correo con link `${FRONTEND_URL}/cuentas/login/restablecer-password/<JWT>` (`controllers/auth.js:298-311`).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de recuperación de contraseña, intenta de nuevo en 15 minutos" (capa IP dedicada, 10/15 min) | `middlewares/rate-limiter.js:61-65` (limiter :58-68) |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | Mismo texto (cubo IP + correo, 3/15 min) | `middlewares/rate-limiter.js:76-80` (limiter :73-87) |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La solicitud contiene errores de validación" (`errors: [{field:"correo", message:"El correo no es valido"}]`) | `routes/auth.js:64` + `middlewares/validar-campos.js:28` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "No se pudo enviar el correo" (SMTP falla para una cuenta elegible) | `email/servicios-correo-reestablecer-password.js:191` (propagado por el catch de `controllers/auth.js:328-329`) |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado (catch-all) | `controllers/auth.js:329` |

### Notas para el Frontend
- **Cambio de contrato (O1):** `data.token` ahora está presente **siempre**, incluido el cooldown (antes la respuesta de cooldown venía sin `data`). Guardar ese token (p. ej. sessionStorage) y enviarlo en `POST /api/auth/reenviar-correo-restablecer-password` si el usuario pide reenvío.
- Anti-enumeración: **no intentar deducir** si la cuenta existe por la respuesta; el `msg`, el status y la presencia de `data.token` son idénticos en todos los casos. La única divergencia posible es el 500 si el SMTP falla.
- La capa IP dedicada (10/15 min) no bloquea el resto del flujo: agotar `password-olvidado` no afecta el cubo de `flujoTokenIpLimiter` ni el de `reenviar-correo-restablecer-password`.
- El `msg` es la constante `MSG_GENERICO_RESET` (`controllers/auth.js:269`); no usarlo para lógica.
- Headers `RateLimit-*` disponibles en cada respuesta para anticipar ambos techos.

---

## [POST] /api/auth/reenviar-correo-restablecer-password

**Descripción:** Reenvía el correo de restablecimiento usando el token opaco de la sesión de recuperación (el que devuelve `password-olvidado`). Busca la cuenta por el SHA-256 del token; si la sesión es válida y no hay cooldown, envía un nuevo enlace. Responde siempre 200 genérico (anti-enumeración).
**Archivo de ruta:** `routes/auth.js:70-73`
**Controlador:** `controllers/auth.js` — `reenvioCorreoRestablecerPassword` (línea 333) → `procesarEnvioReestablecerPassword` (línea 271)

### Autenticación y permisos
- Requiere token: **No** (token opaco en el body; no hay sesión).
- Cadena de middlewares (orden exacto): `flujoTokenIpLimiter` → `recuperacionReenvioLimiter` → `check('token', 'Token invalido').isString().matches(/^[a-f0-9]{64}$/)` → `validarCampos` → `reenvioCorreoRestablecerPassword`.
- Rate limiters: `flujoTokenIpLimiter` (15 min / 60 por IP, `FLOOD_BLOCKED`, compartido) y `recuperacionReenvioLimiter` (15 min / **3**, `RECOVERY_BLOCKED`, clave **IP + token** hasheado). **NUEVO 2026-11-10:** la capa IP no existía.
- Roles permitidos: N/A (endpoint público).

### Parámetros de entrada
| Ubicación (body/params/query) | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `token` | string (token opaco de 64 hex) | Sí | `isString()` + `matches(/^[a-f0-9]{64}$/)` con mensaje `"Token invalido"` → 422. **Ya no se acepta un JWT** (`isJWT()` eliminado) |

### Ejemplo de request
```http
POST /api/auth/reenviar-correo-restablecer-password
Content-Type: application/json

{ "token": "9f2c1a7e4b8d3f06a5c2e19d84b7f3026d1e9c45a8f30b7d2e6c94a1f8b3d507" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200` — **siempre**, en todos los casos (token válido, desconocido o vencido):
```json
{
  "success": true,
  "msg": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña",
  "data": { "token": "9f2c1a7e4b8d3f06a5c2e19d84b7f3026d1e9c45a8f30b7d2e6c94a1f8b3d507" }
}
```
- `data.token` es el **mismo** token enviado en el body (eco, `controllers/auth.js:345`): la sesión **no rota**, el sessionStorage del frontend sigue siendo válido (`controllers/auth.js:279-282` — con `tokenSesion` no se reescriben los campos de sesión).
- Si el token existe (por su hash SHA-256, `controllers/auth.js:338-341`) y `reset_sesion_expira` no venció: respeta el cooldown de 5 min y envía el correo con un **nuevo** JWT de reset (1 h, `RESET_PASSWORD_SECRET`) al correo de la cuenta.
- Token desconocido, vencido o de cuenta no elegible: mismo 200 genérico **sin enviar correo** (`controllers/auth.js:344-346`).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:43-47` (limiter :40-50) |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | "Demasiados reenvíos de correo de recuperación, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:92-96` (limiter :89-103) |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La solicitud contiene errores de validación" (`errors: [{field:"token", message:"Token invalido"}]` — incluye JWTs, tokens de otra longitud o con caracteres fuera de `[a-f0-9]`) | `routes/auth.js:71` + `middlewares/validar-campos.js:28` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "No se pudo enviar el correo" (SMTP falla para una sesión válida fuera de cooldown) | `email/servicios-correo-reestablecer-password.js:191` (propagado por el catch de `controllers/auth.js:349-350`) |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado (catch-all) | `controllers/auth.js:350` |

### Notas para el Frontend
- **Cambio de contrato (O1):** el body lleva el **token opaco de 64 hex** que devuelve `POST /api/auth/cuentas/password-olvidado` (`data.token`), no el JWT del enlace del correo. Un JWT en el body ahora responde 422 "Token invalido" (antes se validaba con `isJWT()`).
- Anti-enumeración: token inválido/vencido responde el **mismo 200** con el mismo `msg` y el token de vuelta; no hay forma de distinguir un token válido de uno inválido por la respuesta. No usar esta respuesta para lógica de UI más allá de "solicitud procesada".
- El token de sesión **no rota** en el reenvío: seguir usando el mismo `data.token` del sessionStorage hasta que un reset exitoso lo invalide.
- Cooldown de 5 min entre correos (`ultimo_correo_enviado`); en cooldown responde el mismo 200 sin enviar nada.
- 429 doble: `FLOOD_BLOCKED` (capa IP compartida) y `RECOVERY_BLOCKED` (cubo IP+token). Distinguir por `code`.

---

## [GET] /api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}

**Descripción:** Valida el JWT del enlace de restablecimiento antes de mostrar el formulario de nueva contraseña. Comprueba firma (`RESET_PASSWORD_SECRET`), existencia de la cuenta, coincidencia del hash con `reset_password_token`, cuenta verificada y `estatus === 1`.
**Archivo de ruta:** `routes/auth.js:75-79`
**Controlador:** `controllers/auth.js` — `validarTokenRestablecerPassword` (línea 356)

### Autenticación y permisos
- Requiere token: **No** (JWT en la URL, sin sesión).
- Cadena de middlewares (orden exacto): `flujoTokenIpLimiter` → `recuperacionValidarTokenLimiter` → `validarTokenEnURL` → `check('token', 'Token invalido').isJWT()` → `validarCampos` → `validarTokenRestablecerPassword`.
- Rate limiters: `flujoTokenIpLimiter` (15 min / 60 por IP, `FLOOD_BLOCKED`, compartido) y `recuperacionValidarTokenLimiter` (15 min / **20**, `RECOVERY_BLOCKED`, clave **IP + token**; umbral holgado porque los escáneres de correo precargan el link). **NUEVO 2026-11-10:** la capa IP no existía.
- Roles permitidos: N/A (endpoint público).

### Parámetros de entrada
| Ubicación (body/params/query) | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `token` | string (JWT) | Sí (segmento opcional `{/:token}` en Express 5, exigido por `validarTokenEnURL`) | `validarTokenEnURL`: si falta → 400. `isJWT()` con mensaje `"Token invalido"` → 422 |

### Ejemplo de request
```http
GET /api/auth/cuentas/restablecer-password/validar-token-reset-password/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub21icmUiOiJBbmEiLCJjb3JyZW8iOiJhbmFAZXhhbXBsZS5jb20iLCJpYXQiOjE3MzExNzI4MDB9.signature
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
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:43-47` (limiter :40-50) |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | "Demasiadas validaciones de token, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:108-112` (limiter :105-119) |
| 400 | `BAD_REQUEST` | Bad Request | "El token es obligatorio en la URL" | `middlewares/validar-token-en-url.js:7` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "Token invalido" (en `errors`) | `routes/auth.js:77` + `middlewares/validar-campos.js:28` |
| 401 | `TOKEN_EXPIRED` | Authentication Required | "El enlace ha expirado" (**NUEVO**: antes era 500) | `helpers/validar-jwt.js:30` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token inválido" (firma inválida, mal formado; **NUEVO**: antes era 500) | `helpers/validar-jwt.js:32` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la peticion" (en la práctica inalcanzable: `validarTokenEnURL` ya responde 400 antes) | `controllers/auth.js:361` |
| 401 | `UNAUTHORIZED` | Authentication Required | Producción: "Token inválido o expirado". Desarrollo: "El usuario no existe o la cuenta fue eliminada (estatus 4)" | `controllers/auth.js:367-369` |
| 401 | `UNAUTHORIZED` | Authentication Required | Producción: "Token inválido o expirado". Desarrollo: "El token de restablecimiento no coincide o ya fue utilizado" | `controllers/auth.js:371-373` |
| 403 | `FORBIDDEN` | Forbidden | Producción: "Token inválido o expirado". Desarrollo: "La cuenta no ha sido verificada por correo electrónico" | `controllers/auth.js:375-377` |
| 403 | `FORBIDDEN` | Forbidden | Producción: "Token inválido o expirado". Desarrollo: "La cuenta está en estado N (suspendida/reglas violadas)" | `controllers/auth.js:379-381` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Configuración de tokens incompleta" (falta `RESET_PASSWORD_SECRET`) | `helpers/validar-jwt.js:25` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado (catch-all) | `controllers/auth.js:389` |

### Notas para el Frontend
- **Cambio de semántica (H6):** token vencido → `401 TOKEN_EXPIRED` "El enlace ha expirado"; firma inválida/malformado → `401 UNAUTHORIZED`. Ya no llega como 500. Con `TOKEN_EXPIRED`/401 ofrecer "solicitar un enlace nuevo" (reenvío con el token opaco).
- El `detail` de los errores 401/403 del controlador depende de `NODE_ENV` (`controllers/auth.js:357`): en desarrollo detalla la causa, en producción siempre "Token inválido o expirado". **Decidir por `code` y `status`, nunca por `detail`.** El valor real de `NODE_ENV` por entorno → **[REQUIERE VERIFICACIÓN MANUAL]**.
- Un token válido **no** se consume aquí: puede revalidarse hasta que `reestablecer-password` lo use (allí se borra `reset_password_token`, `email/servicios-correo-reestablecer-password.js:215`).
- La capa IP `FLOOD_BLOCKED` (60/15 min) es compartida con los otros 4 endpoints de flujo de token.

---

## [POST] /api/auth/cuentas/reestablecer-password{/:token}

**Descripción:** Cambia la contraseña con el JWT del enlace. Valida el token contra `reset_password_token`, hashea la nueva contraseña (bcrypt, salt 10), borra `reset_password_token` y también la sesión de recuperación opaca (`reset_sesion_token` / `reset_sesion_expira`), y reinicia `intentos_login`.
**Archivo de ruta:** `routes/auth.js:81-86`
**Controlador:** `controllers/auth.js` — `reestablecerPassword` (línea 394) → `email/servicios-correo-reestablecer-password.js` — `reestablecerPasswordUsuario` (línea 195)

### Autenticación y permisos
- Requiere token: **No** (JWT en la URL, sin sesión).
- Cadena de middlewares (orden exacto): `flujoTokenIpLimiter` → `recuperacionResetLimiter` → `check('password', 'El password es obligatorio: debe tener al menos 8 caracteres').trim().isLength({ min: 8 })` → `validarCampos` → `reestablecerPassword`.
- **Nota:** esta ruta **no** aplica `validarTokenEnURL` ni `isJWT()` al `:token`; el formato/firma del token se valida dentro del servicio vía `validarJWT` (`email/servicios-correo-reestablecer-password.js:196`).
- Rate limiters: `flujoTokenIpLimiter` (15 min / 60 por IP, `FLOOD_BLOCKED`, compartido) y `recuperacionResetLimiter` (15 min / **5**, `RECOVERY_BLOCKED`, clave **IP + token**). **NUEVO 2026-11-10:** la capa IP no existía.
- Roles permitidos: N/A (endpoint público).

### Parámetros de entrada
| Ubicación (body/params/query) | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `token` | string (JWT) | Sí en la práctica (segmento opcional `{/:token}` en Express 5) | Sin validación en la ruta; un token ausente/malformado falla en `validarJWT` → 401 |
| body | `password` | string | Sí | `trim()` + `isLength({ min: 8 })`; mensaje `"El password es obligatorio: debe tener al menos 8 caracteres"` → 422. **Sin reglas de complejidad.** |

### Ejemplo de request
```http
POST /api/auth/cuentas/reestablecer-password/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub21icmUiOiJBbmEiLCJjb3JyZW8iOiJhbmFAZXhhbXBsZS5jb20iLCJpYXQiOjE3MzExNzI4MDB9.signature
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
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:43-47` (limiter :40-50) |
| 429 | `RECOVERY_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de restablecimiento de contraseña, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:124-128` (limiter :121-135) |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El password es obligatorio: debe tener al menos 8 caracteres" | `routes/auth.js:83` + `middlewares/validar-campos.js:28` |
| 401 | `TOKEN_EXPIRED` | Authentication Required | "El enlace ha expirado" (**NUEVO**: antes era 500) | `helpers/validar-jwt.js:30` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token inválido" (firma inválida, mal formado o token ausente; **NUEVO**: antes era 500) | `helpers/validar-jwt.js:32` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Correo no está en el token" | `email/servicios-correo-reestablecer-password.js:200` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Correo no existe en la base de datos" (usuario inexistente o `estatus: 4`) ⚠ responde 500, no 401 | `email/servicios-correo-reestablecer-password.js:203` |
| 401 | `UNAUTHORIZED` | Authentication Required | "La cuenta no ha sido verificada" (`email_validated: false`) | `email/servicios-correo-reestablecer-password.js:204` |
| 401 | `UNAUTHORIZED` | Authentication Required | "El token de restablecimiento de contraseña no es válido o ha expirado" (hash ≠ `reset_password_token`: token ya usado o reemplazado por un reenvío) | `email/servicios-correo-reestablecer-password.js:206-208` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Configuración de tokens incompleta" (falta `RESET_PASSWORD_SECRET`) | `helpers/validar-jwt.js:25` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` del error no controlado (catch-all) | `controllers/auth.js:401-403` |

### Notas para el Frontend
- **Cambio de semántica (H6):** token vencido/inválido → `401 TOKEN_EXPIRED` / `401 UNAUTHORIZED` (ya no 500). Excepción a revisar: usuario inexistente o eliminado sigue respondiendo **500** `INTERNAL_ERROR` "Correo no existe en la base de datos" (`email/servicios-correo-reestablecer-password.js:203` usa `InternalError`) — tratar ese caso por `code`, no solo por status.
- **Cambio (O1):** el éxito **limpia la sesión de recuperación** (`reset_sesion_token` y `reset_sesion_expira` se eliminan, `email/servicios-correo-reestablecer-password.js:216-218`): un reenvío posterior con el token opaco del sessionStorage responde el 200 genérico sin correo. El frontend debe descartar ese token tras un reset exitoso.
- Efecto secundario adicional: `intentos_login = 0` (`:220`) y se borra `reset_password_token` (`:215`); el enlace queda consumido.
- No revoca sesiones activas: no toca `tokenVersion` ni `UserToken`; las cookies vigentes siguen funcionando.
- Política de contraseña: solo 8+ caracteres (el registro exige complejidad; ver `routes/usuarios.js`). El frontend debería aplicar la política del registro por consistencia.

---

## [GET] /api/health

**Descripción:** Health check mínimo: reporta `ok` si la conexión a MongoDB está activa o `degraded` si no. Pensado para monitoreo (load balancers / uptime checks), no para lógica de negocio.
**Archivo de ruta:** `routes/bienvenida.js:8` (la ruta se declara como `/api/health` dentro del router montado en `/` en `models/server.js:123`, así que el path completo es `/api/health`)
**Controlador:** `controllers/bienvenida.js` — `getHealth` (líneas 12-15)

### Autenticación y permisos
- Requiere token: **No**.
- Cadena de middlewares (orden exacto): `healthLimiter` → `getHealth`.
- Rate limiter: `healthLimiter` (`middlewares/rate-limiter.js:233-242`), **1 minuto / 60 por IP**, código `HEALTH_BLOCKED`. **CORRECCIÓN 2026-11-10:** la doc anterior describía `lecturaLimiter` (15 min / 100, `READ_BLOCKED`), que ya no aplica a esta ruta.
- Roles permitidos: N/A (endpoint público).

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/health
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200` si `mongoose.connection.readyState === 1` (`helpers/estado-db.js:25`), `503` en cualquier otro estado.
- Cuerpo (**sin envelope `success`**; forma exacta de `controllers/bienvenida.js:14`):

Conexión activa (200):
```json
{ "status": "ok" }
```

Conexión caída (503):
```json
{ "status": "degraded" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `HEALTH_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes de health check, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:236-240` (limiter :233-242) |
| 503 | — | — | **No es un error RFC 9457:** la degradación se expresa con `503` + `{ "status": "degraded" }`, sin `code` ni `title` | `controllers/bienvenida.js:14` |

### Notas para el Frontend
- **Corrección de metadata (sync 2026-11-10):** la respuesta ya **no** incluye `uptime`, `timestamp`, `pid`, `memory`, `version`, `environment` ni `db.status`; solo `{ "status": "ok" | "degraded" }`. El monitoreo debe decidir por el par status HTTP + campo `status`.
- `200` no implica que el resto del backend funcione: solo mide `mongoose.connection.readyState === 1`.
- El `503` **no** viene en formato RFC 9457 (es una respuesta directa del controlador, sin `code`): no intentar parsear `title`/`detail` en este caso.
- Headers `RateLimit-*` disponibles; con más de 60 peticiones/min por IP responde `429 HEALTH_BLOCKED` en formato RFC 9457.

---

## Resumen del delta para el Frontend (checklist rápido)

| Endpoint | Cambio | Dato clave |
|---|---|---|
| `GET /api/auth/verificar-correo{/:token}` | + capa IP `flujoTokenIpLimiter`; vencido/inválido → 401 | `TOKEN_EXPIRED` / `UNAUTHORIZED` (ya no 500) |
| `POST /api/auth/reenviar-correo` | + capa IP | cubo `FLOOD_BLOCKED` compartido (60/15 min entre 5 endpoints) |
| `POST /api/auth/cuentas/password-olvidado` | + capa IP dedicada `recuperacionSolicitudIpLimiter`; `data.token` siempre presente | token opaco 64-hex, sesión 60 min |
| `POST /api/auth/reenviar-correo-restablecer-password` | body cambia de JWT a token opaco (`^[a-f0-9]{64}$`); + capa IP | `isJWT()` eliminado; misma sesión sin rotar |
| `GET /api/auth/.../validar-token-reset-password{/:token}` | + capa IP; vencido/inválido → 401 | `TOKEN_EXPIRED` / `UNAUTHORIZED` |
| `POST /api/auth/cuentas/reestablecer-password{/:token}` | + capa IP; vencido/inválido → 401; éxito limpia la sesión opaca | usuario inexistente sigue siendo 500 |
| `GET /api/health` | limiter real `healthLimiter` (1 min/60, `HEALTH_BLOCKED`); respuesta mínima | `{ "status": "ok" | "degraded" }` con 200/503 |
