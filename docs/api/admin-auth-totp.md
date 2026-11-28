# Panel de administración — autenticación, sesión y TOTP (`/api/v1/admin`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales) (ver en particular **Autenticación → Panel**).

Montaje: `models/server.js:141` → `admin/routes/index.js`. Dominio **completamente separado** de los usuarios: colección `Admin`, secretos JWT propios (`ADMIN_*`), cookies `adminAccessToken` / `adminRefreshToken` con **`path: /api/v1/admin`** (no viajan a la API de usuarios).

**Login en 2 pasos:**
1. `POST /auth/login` (correo + contraseña) → `estado` + `preAuthToken` (5 min).
2. `POST /auth/login/totp` (preAuthToken + código TOTP o código de respaldo) → cookies de sesión.

**Estados de primer acceso** (`admin/controllers/auth.js:102-105`): `password_cambio_requerido` → `cambiar-password`; `totp_setup_requerido` → `totp/setup` + `totp/activate`; `mfa_required` → `auth/login/totp`. El `preAuthToken` **no** abre rutas del panel.

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

> **Revisión 2026-11-25 (verificación del dominio admin):** sin cambios de contrato. Se re-baselizaron las citas `archivo:línea` de `admin/controllers/auth.js`, `admin/controllers/totp.js` y `admin/middlewares/rate-limiter.js` (el código se desplazó) y se corrigió el montaje del panel (`models/server.js:141`).

---

## [POST] /api/v1/admin/auth/login

**Descripción:** Paso 1 del login del panel. Verifica correo y contraseña, aplica bloqueo por intentos fallidos (5 → 30 min) y devuelve el siguiente `estado` junto con un `preAuthToken`. **No emite cookies.**
**Archivo de ruta:** `admin/routes/index.js:51`
**Controlador:** `admin/controllers/auth.js` — `loginPaso1` (línea 60)

### Autenticación y permisos
- Requiere token: **No**.
- Cadena de middlewares: `adminLoginLimiter` → `check('correo').isEmail()` → `check('password').trim().notEmpty()` → `validarCampos` → `loginPaso1`.
- Rate limiter: `adminLoginLimiter` (`admin/middlewares/rate-limiter.js:28`), 15 min / 5, clave **IP + correo**, código `ADMIN_LOGIN_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `correo` | string | Sí | `isEmail()`; `"El correo es obligatorio y debe ser válido"` → 422 |
| body | `password` | string | Sí | `trim()` + `notEmpty()`; `"El password es obligatorio"` → 422 |

### Ejemplo de request
```http
POST /api/v1/admin/auth/login
Content-Type: application/json
Origin: https://admin.tlaxapp.example

{ "correo": "admin@tlaxapp.example", "password": "Temporal-Abcd-1234" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Credenciales válidas",
  "data": {
    "estado": "mfa_required",
    "preAuthToken": "eyJhbGciOiJIUzI1NiJ9…",
    "correo": "admin@tlaxapp.example",
    "rol": "SUPERADMIN"
  }
}
```
`estado` ∈ `password_cambio_requerido` | `totp_setup_requerido` | `mfa_required`.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_LOGIN_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de acceso al panel, inténtalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:34-37` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El correo es obligatorio y debe ser válido" / "El password es obligatorio" | `admin/routes/index.js:52-53` + `middlewares/validar-campos.js:28` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Credenciales inválidas" (correo inexistente o contraseña incorrecta) | `admin/controllers/auth.js:66,94` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta de administrador desactivada" (se comprueba **antes** de la contraseña) | `admin/controllers/auth.js:69` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | "Cuenta bloqueada temporalmente. Inténtalo de nuevo más tarde." (bloqueo activo, o al llegar a 5 intentos fallidos) | `admin/controllers/auth.js:74,91` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` (error no controlado) | `admin/controllers/auth.js:113` |

### Notas para el Frontend
- Tras un `200`, `estado` decide la pantalla siguiente. No es un error.
- Cierra la sesión del panel con 401 `UNAUTHORIZED` en cualquier paso posterior que pida `preAuthToken` expirado (5 min).
- ⚠ Enumeración parcial: una cuenta **desactivada** responde 403 aunque la contraseña sea incorrecta, lo que revela que la cuenta existe y está inactiva. Señalado para el auditor.
- El bloqueo (5 intentos → 30 min) se resetea con un inicio de sesión correcto.

---

## [POST] /api/v1/admin/auth/login/totp

**Descripción:** Paso 2 del login. Valida el `preAuthToken` y el código de la app autenticadora **o** un código de respaldo de un solo uso. Si es correcto, registra una sesión (refresh hasheado en `AdminToken`), emite cookies `adminAccessToken` y `adminRefreshToken` y devuelve el perfil del administrador.
**Archivo de ruta:** `admin/routes/index.js:58`
**Controlador:** `admin/controllers/auth.js` — `loginTotp` (línea 120). Middleware: `admin/middlewares/verificar-sesion.js:51` (`validarPreAuthToken`).

### Autenticación y permisos
- Requiere token: **Sí, `preAuthToken`** (en el body o en la cabecera `x-preauth-token`). No requiere cookie.
- Cadena de middlewares: `adminTotpLimiter` → `validarPreAuthToken` → `check('codigo').trim().notEmpty()` → `validarCampos` → `loginTotp`.
- Rate limiter: `adminTotpLimiter` (`admin/middlewares/rate-limiter.js:48`), 5 min / 5, código `ADMIN_TOTP_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `preAuthToken` | string (JWT) | Sí (o header `x-preauth-token`) | Verificado con `ADMIN_PREAUTH_SECRET` y claim `preauth: true`; ver errores |
| body | `codigo` | string | Sí | `trim()` + `notEmpty()`; `"El código es obligatorio"` → 422. Se normaliza a mayúsculas (los códigos de respaldo son alfanuméricos) |

### Ejemplo de request
```http
POST /api/v1/admin/auth/login/totp
Content-Type: application/json
Origin: https://admin.tlaxapp.example

{ "preAuthToken": "eyJhbGciOiJIUzI1NiJ9…", "codigo": "123456" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
- Cookies: `adminAccessToken` (`Max-Age=600` por defecto, path `/api/v1/admin`) y `adminRefreshToken` (`Max-Age=14400` por defecto, path `/api/v1/admin`); `HttpOnly; Secure; SameSite=None`. El `Max-Age` real se deriva del `exp` de cada token firmado (`helpers/vigencia-cookie.js`), así que sigue a `ADMIN_ACCESS_TOKEN_EXPIRY` / `ADMIN_REFRESH_TOKEN_EXPIRY`.
```json
{
  "success": true,
  "msg": "Acceso al panel concedido",
  "data": {
    "admin": {
      "uid": "6652a1…",
      "correo": "admin@tlaxapp.example",
      "rol": "SUPERADMIN",
      "permisos": ["*"],
      "activo": true,
      "totp_enabled": true,
      "password_temporal": false,
      "ultimo_inicio_sesion": "2026-10-27T19:10:34.000Z"
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_TOTP_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de verificación en dos pasos, inténtalo de nuevo en 5 minutos" | `admin/middlewares/rate-limiter.js:54-57` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token de pre-autenticación en la petición" | `admin/middlewares/verificar-sesion.js:54` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token de pre-autenticación no válido" (claim `preauth` ausente o admin inexistente) | `admin/middlewares/verificar-sesion.js:59,63` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta de administrador desactivada" | `admin/middlewares/verificar-sesion.js:66` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token de pre-autenticación no válido o expirado" (5 min) | `admin/middlewares/verificar-sesion.js:71` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El código es obligatorio" | `admin/routes/index.js:60` + `middlewares/validar-campos.js:28` |
| 409 | `CONFLICT` | Conflict | "La cuenta todavía no tiene TOTP configurado" | `admin/controllers/auth.js:127` |
| 409 | `CONFLICT` | Conflict | "Debes cambiar tu contraseña temporal antes de continuar" | `admin/controllers/auth.js:130` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Código de verificación inválido" (ni TOTP ni respaldo válido) | `admin/controllers/auth.js:154` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` | `admin/controllers/auth.js:184` |

### Notas para el Frontend
- Los códigos de respaldo sirven una sola vez; el backend los marca como usados.
- El código TOTP tiene tolerancia de ±60 s (`admin/helpers/totp.js:17`).
- El `preAuthToken` **no** da acceso al panel: `GET /auth/me` y las rutas de moderación lo rechazan.
- En 401 de este paso, pide al usuario otro código; no reinicies el login salvo que el `detail` diga que el preAuth expiró.

---

## [POST] /api/v1/admin/auth/refresh

**Descripción:** Renueva la sesión del panel rotando el refresh token (cookie `adminRefreshToken`). Si el refresh ya fue rotado (reuso), revoca todas las sesiones de la cuenta.
**Archivo de ruta:** `admin/routes/index.js:65`
**Controlador:** `admin/controllers/auth.js` — `refreshAdmin` (línea 191)

### Autenticación y permisos
- Requiere token: **Sí, cookie `adminRefreshToken`** (sin body).
- Cadena de middlewares: `adminRefreshLimiter` → `refreshAdmin`.
- Rate limiter: `adminRefreshLimiter` (`admin/middlewares/rate-limiter.js:64`), 15 min / 10, código `ADMIN_REFRESH_BLOCKED`.

### Parámetros de entrada
Ninguno (cookie `adminRefreshToken`, con `path: /api/v1/admin`).

### Ejemplo de request
```http
POST /api/v1/admin/auth/refresh
Cookie: adminRefreshToken=eyJhbGciOiJIUzI1NiJ9…
Origin: https://admin.tlaxapp.example
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`. Cookies `adminAccessToken` y `adminRefreshToken` nuevas.
```json
{ "success": true, "msg": "Sesión del panel renovada" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_REFRESH_BLOCKED` | Rate Limit Exceeded | "Demasiadas renovaciones de sesión del panel, inténtalo de nuevo en 15 minutos" | `admin/middlewares/rate-limiter.js:70-73` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel para renovar" | `admin/controllers/auth.js:194` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión del panel comprometida. Inicia sesión nuevamente." (reuso detectado: `revocarTodasLasSesionesAdmin`) | `admin/controllers/auth.js:207` |
| 403 | `FORBIDDEN` | Forbidden | "Token del panel no registrado" (no existe y firma inválida) | `admin/controllers/auth.js:209` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión del panel no válida" (admin inexistente o inactivo) | `admin/controllers/auth.js:217` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión del panel no válida o expirada" (`jwt.verify` falla; se borra el registro) | `admin/controllers/auth.js:243` |

### Notas para el Frontend
- Si recibes 401 con "comprometida", vuelve a `POST /auth/login`: todas las sesiones de la cuenta se cerraron.
- Sin body. Envía las cookies (`credentials: 'include'`).

---

## [POST] /api/v1/admin/auth/logout

**Descripción:** Cierra la sesión del panel: borra el refresh token en `AdminToken` (si viene la cookie) y limpia ambas cookies (con el mismo `path`).
**Archivo de ruta:** `admin/routes/index.js:68`
**Controlador:** `admin/controllers/auth.js` — `logoutAdmin` (línea 250) → `admin/helpers/sesiones.js` — `cerrarSesionCookiesAdmin`

### Autenticación y permisos
- Requiere token: **No** (funciona sin sesión; usa la cookie si existe).
- Cadena de middlewares: `logoutAdmin`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
Ninguno (cookie `adminRefreshToken` opcional).

### Ejemplo de request
```http
POST /api/v1/admin/auth/logout
Cookie: adminRefreshToken=eyJhbGciOiJIUzI1NiJ9…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{ "success": true, "msg": "Sesión del panel cerrada" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` (fallo al borrar en `AdminToken`) | `admin/controllers/auth.js:257` |

### Notas para el Frontend
- No devuelve 401 aunque no haya sesión. Llámalo siempre al salir.

---

## [GET] /api/v1/admin/auth/me

**Descripción:** Perfil del administrador autenticado (sesión completa). No requiere permiso específico.
**Archivo de ruta:** `admin/routes/index.js:71`
**Controlador:** `admin/controllers/auth.js` — `getMeAdmin` (línea 264)

### Autenticación y permisos
- Requiere token: **Sí, cookie `adminAccessToken`** (sesión completa).
- Cadena de middlewares: `verificarSesionAdmin` (`admin/middlewares/verificar-sesion.js:18`) → `getMeAdmin`.
- Permiso: ninguno más allá de la sesión.
- Rate limiter: **ninguno**.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/v1/admin/auth/me
Cookie: adminAccessToken=eyJhbGciOiJIUzI1NiJ9…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Administrador obtenido",
  "data": {
    "admin": {
      "uid": "6652a1…", "correo": "admin@tlaxapp.example", "rol": "MODERADOR",
      "permisos": ["moderacion:leer", "moderacion:resolver", "moderacion:descartar", "moderacion:recategorizar", "posteos:ocultar", "posteos:restaurar"],
      "activo": true, "totp_enabled": true, "password_temporal": false,
      "ultimo_inicio_sesion": "2026-10-27T19:10:34.000Z"
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" | `admin/middlewares/verificar-sesion.js:21` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión del panel no válida" (cuenta inexistente o firma inválida) | `admin/middlewares/verificar-sesion.js:28,41` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta de administrador desactivada" | `admin/middlewares/verificar-sesion.js:32` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión del panel expirada - inicia sesión nuevamente" (`tokenVersion` distinto) | `admin/middlewares/verificar-sesion.js:36` |

### Notas para el Frontend
- **Guíate por `permisos`, no por `rol`** (AGENTS.md): el snapshot de permisos vive en la cuenta.
- Usa `password_temporal` y `totp_enabled` para decidir si mostrar el flujo de primer acceso.

---

## [POST] /api/v1/admin/auth/cambiar-password

**Descripción:** Cambia la contraseña. Obligatorio en el primer acceso. Acepta **sesión completa o `preAuthToken`**. Siempre exige la contraseña actual. Al terminar **revoca todas las sesiones** de la cuenta, por lo que el administrador debe volver a iniciar sesión.
**Archivo de ruta:** `admin/routes/index.js:74`
**Controlador:** `admin/controllers/auth.js` — `cambiarPasswordAdmin` (línea 281)

### Autenticación y permisos
- Requiere token: **Sí**: sesión (`adminAccessToken`) **o** `preAuthToken` en el body (tiene prioridad sobre la cookie).
- Cadena de middlewares: `verificarSesionOPreAuth` → `check('password_actual').trim().notEmpty()` → `check('password_nueva').trim().isLength({min: 12})` → `validarCampos` → `cambiarPasswordAdmin`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `preAuthToken` | string | Solo si no hay sesión | Ver `verificarSesionOPreAuth` |
| body | `password_actual` | string | Sí | `trim()` + `notEmpty()`; `"La contraseña actual es obligatoria"` → 422 |
| body | `password_nueva` | string | Sí | `trim()` + `isLength({min: 12})`; `"La nueva contraseña debe tener al menos 12 caracteres"` → 422. **Sin reglas de complejidad** |

### Ejemplo de request
```http
POST /api/v1/admin/auth/cambiar-password
Content-Type: application/json
Origin: https://admin.tlaxapp.example

{
  "preAuthToken": "eyJhbGciOiJIUzI1NiJ9…",
  "password_actual": "Temporal-Abcd-1234",
  "password_nueva": "Nueva-Clave-Larga-2026"
}
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Contraseña actualizada. Vuelve a iniciar sesión.",
  "data": { "password_temporal": false }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token de pre-autenticación en la petición" / "No hay sesión del panel en la petición" | `admin/middlewares/verificar-sesion.js:54,21` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La contraseña actual es obligatoria" / "La nueva contraseña debe tener al menos 12 caracteres" | `admin/routes/index.js:76-77` + `middlewares/validar-campos.js:28` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión del panel no válida" (cuenta inexistente o inactiva) | `admin/controllers/auth.js:290` |
| 401 | `INVALID_CURRENT_PASSWORD` | Authentication Required | "La contraseña actual es incorrecta" | `admin/controllers/auth.js:296` |
| 409 | `CONFLICT` | Conflict | "La nueva contraseña debe ser distinta a la actual" | `admin/controllers/auth.js:301` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` | `admin/controllers/auth.js:319` |

### Notas para el Frontend
- Tras el `200`, **no hay sesión nueva**: redirige al login. Las cookies previas ya no sirven (revocación).
- ⚠ Solo se exige 12 caracteres, sin complejidad. El registro de usuarios exige complejidad; el panel no.
- ⚠ **`INVALID_CURRENT_PASSWORD` no es una sesión expirada.** Comparte el status `401` con `UNAUTHORIZED`, pero no debe disparar `POST /auth/refresh`: rotaría las cookies, consumiría el rate limit de refresh (10/15 min) y, si el refresh fallara, cerraría la sesión por un error de negocio. Interpretar el `code`, no solo el status.

---

## [POST] /api/v1/admin/totp/setup

**Descripción:** Genera un secreto TOTP nuevo y el QR (`qrDataUrl`) para escanearlo. Solo funciona mientras TOTP **no** esté activo. Acepta sesión o `preAuthToken`.
**Archivo de ruta:** `admin/routes/index.js:84`
**Controlador:** `admin/controllers/totp.js` — `setupTotp` (línea 36)

### Autenticación y permisos
- Requiere token: **Sí**: sesión o `preAuthToken` en el body.
- Cadena de middlewares: `verificarSesionOPreAuth` → `setupTotp`.
- Rate limiter: **ninguno** (a diferencia de `activate`, `backup/regenerar` y `reemitir`).

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `preAuthToken` | string | Solo si no hay sesión | Ver `verificarSesionOPreAuth` |

### Ejemplo de request
```http
POST /api/v1/admin/totp/setup
Content-Type: application/json
Origin: https://admin.tlaxapp.example

{ "preAuthToken": "eyJhbGciOiJIUzI1NiJ9…" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Escanea el código QR con tu aplicación autenticadora",
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "otpauthUrl": "otpauth://totp/TlaxApp:admin%40tlaxapp.example?secret=JBSWY3DPEHPK3PXP&issuer=TlaxApp",
    "qrDataUrl": "data:image/png;base64,…",
    "issuer": "TlaxApp",
    "label": "admin@tlaxapp.example",
    "algoritmo": "SHA1",
    "digitos": 6,
    "periodo": 30,
    "tolerancia_segundos": 60
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" | `admin/controllers/totp.js:39` |
| 409 | `CONFLICT` | Conflict | "TOTP ya está configurado. Usa /totp/reemitir para cambiarlo." | `admin/controllers/totp.js:42` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` (incluye fallo al generar el QR) | `admin/controllers/totp.js:70` |

### Notas para el Frontend
- El `secret` se entrega para la opción "clave manual". Muéstralo una vez.
- Cada llamada mientras TOTP no esté activo **reemplaza** el secreto anterior. Si el usuario escaneó un QR viejo, debe escanear el nuevo.
- Sin limitador de peticiones: el frontend debe evitar llamadas repetidas.

---

## [POST] /api/v1/admin/totp/activate

**Descripción:** Confirma TOTP con el primer código de 6 dígitos y lo activa. Devuelve **10 códigos de respaldo en claro una sola vez** (en la base solo queda su hash SHA-256).
**Archivo de ruta:** `admin/routes/index.js:87`
**Controlador:** `admin/controllers/totp.js` — `activateTotp` (línea 77)

### Autenticación y permisos
- Requiere token: **Sí**: sesión o `preAuthToken`.
- Cadena de middlewares: `adminTotpLimiter` → `verificarSesionOPreAuth` → `check('codigo').trim().isLength({min:6, max:6})` → `validarCampos` → `activateTotp`.
- Rate limiter: `adminTotpLimiter` (`admin/middlewares/rate-limiter.js:48`), 5 min / 5, código `ADMIN_TOTP_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `preAuthToken` | string | Solo si no hay sesión | Ver `verificarSesionOPreAuth` |
| body | `codigo` | string | Sí | `trim()` + `isLength({min:6,max:6})`; `"El código de 6 dígitos es obligatorio"` → 422. No valida que sean solo dígitos |

### Ejemplo de request
```http
POST /api/v1/admin/totp/activate
Content-Type: application/json
Origin: https://admin.tlaxapp.example

{ "preAuthToken": "eyJhbGciOiJIUzI1NiJ9…", "codigo": "654321" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "TOTP activado. Guarda tus códigos de respaldo: no se volverán a mostrar.",
  "data": {
    "totp_enabled": true,
    "backup_codes": ["7KQ2-9XMP", "…", "…"],
    "total_backup_codes": 10
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_TOTP_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de verificación en dos pasos, inténtalo de nuevo en 5 minutos" | `admin/middlewares/rate-limiter.js:54-57` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" | `admin/controllers/totp.js:81` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El código de 6 dígitos es obligatorio" | `admin/routes/index.js:89` + `middlewares/validar-campos.js:28` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión del panel no válida" | `admin/controllers/totp.js:84` |
| 409 | `CONFLICT` | Conflict | "TOTP ya está configurado" | `admin/controllers/totp.js:87` |
| 409 | `CONFLICT` | Conflict | "Primero debes solicitar el setup de TOTP" | `admin/controllers/totp.js:90` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Código de verificación inválido" | `admin/controllers/totp.js:94` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` | `admin/controllers/totp.js:115` |

### Notas para el Frontend
- Guarda los códigos de respaldo en el momento; no se pueden volver a obtener sin regenerarlos.
- Tras activar, el siguiente acceso pedirá `login/totp` (`mfa_required`).

---

## [POST] /api/v1/admin/totp/backup/regenerar

**Descripción:** Genera 10 códigos de respaldo nuevos y **invalida los anteriores**. Requiere la contraseña actual.
**Archivo de ruta:** `admin/routes/index.js:94`
**Controlador:** `admin/controllers/totp.js` — `regenerarBackups` (línea 121)

### Autenticación y permisos
- Requiere token: **Sí**: sesión o `preAuthToken`.
- Cadena de middlewares: `adminTotpLimiter` → `verificarSesionOPreAuth` → `check('password_actual').trim().notEmpty()` → `validarCampos` → `regenerarBackups`.
- Rate limiter: `adminTotpLimiter`, 5 min / 5, código `ADMIN_TOTP_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `preAuthToken` | string | Solo si no hay sesión | Ver `verificarSesionOPreAuth` |
| body | `password_actual` | string | Sí | `trim()` + `notEmpty()`; `"La contraseña actual es obligatoria"` → 422 |

### Ejemplo de request
```http
POST /api/v1/admin/totp/backup/regenerar
Content-Type: application/json
Cookie: adminAccessToken=…

{ "password_actual": "Nueva-Clave-Larga-2026" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Códigos de respaldo regenerados. Los anteriores ya no son válidos.",
  "data": { "backup_codes": ["…", "…"], "total_backup_codes": 10 }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_TOTP_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de verificación en dos pasos, inténtalo de nuevo en 5 minutos" | `admin/middlewares/rate-limiter.js:54-57` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" | `admin/controllers/totp.js:125` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La contraseña actual es obligatoria" | `admin/routes/index.js:96` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión del panel no válida" | `admin/controllers/totp.js:129` |
| 409 | `CONFLICT` | Conflict | "TOTP aún no está configurado" | `admin/controllers/totp.js:132` |
| 401 | `INVALID_CURRENT_PASSWORD` | Authentication Required | "La contraseña actual es incorrecta" | `admin/controllers/totp.js:135` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` | `admin/controllers/totp.js:148` |

### Notas para el Frontend
- Los códigos anteriores dejan de servir de inmediato.
- Muéstralos una sola vez y pide confirmación de que se guardaron.

---

## [POST] /api/v1/admin/totp/reemitir

**Descripción:** Reemplaza el TOTP (cambio o pérdida de teléfono). Requiere contraseña actual **y** un código de respaldo sin usar, que se consume. Genera un secreto nuevo y 10 códigos de respaldo nuevos. Deja TOTP **desactivado** hasta que se active de nuevo.
**Archivo de ruta:** `admin/routes/index.js:101`
**Controlador:** `admin/controllers/totp.js` — `reemitirTotp` (línea 156)

### Autenticación y permisos
- Requiere token: **Sí**: sesión o `preAuthToken`.
- Cadena de middlewares: `adminTotpLimiter` → `verificarSesionOPreAuth` → `check('password_actual')` → `check('backup_code').trim().notEmpty()` → `validarCampos` → `reemitirTotp`.
- Rate limiter: `adminTotpLimiter`, 5 min / 5, código `ADMIN_TOTP_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `preAuthToken` | string | Solo si no hay sesión | Ver `verificarSesionOPreAuth` |
| body | `password_actual` | string | Sí | `trim()` + `notEmpty()`; `"La contraseña actual es obligatoria"` → 422 |
| body | `backup_code` | string | Sí | `trim()` + `notEmpty()`; `"El código de respaldo es obligatorio"` → 422. Se normaliza a mayúsculas |

### Ejemplo de request
```http
POST /api/v1/admin/totp/reemitir
Content-Type: application/json
Origin: https://admin.tlaxapp.example

{
  "preAuthToken": "eyJhbGciOiJIUzI1NiJ9…",
  "password_actual": "Nueva-Clave-Larga-2026",
  "backup_code": "7KQ2-9XMP"
}
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Nuevo TOTP generado. Escanéalo y actívalo; tus códigos de respaldo anteriores ya no son válidos.",
  "data": {
    "secret": "KRSXG5CTMVRXEZLU",
    "otpauthUrl": "otpauth://totp/…",
    "qrDataUrl": "data:image/png;base64,…",
    "issuer": "TlaxApp",
    "label": "admin@tlaxapp.example",
    "backup_codes": ["…", "…"],
    "total_backup_codes": 10,
    "totp_enabled": false
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ADMIN_TOTP_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de verificación en dos pasos, inténtalo de nuevo en 5 minutos" | `admin/middlewares/rate-limiter.js:54-57` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" | `admin/controllers/totp.js:160` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La contraseña actual es obligatoria" / "El código de respaldo es obligatorio" | `admin/routes/index.js:103-104` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión del panel no válida" | `admin/controllers/totp.js:164` |
| 409 | `CONFLICT` | Conflict | "TOTP aún no está configurado" | `admin/controllers/totp.js:167` |
| 401 | `INVALID_CURRENT_PASSWORD` | Authentication Required | "La contraseña actual es incorrecta" | `admin/controllers/totp.js:170` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Código de respaldo inválido o ya utilizado" | `admin/controllers/totp.js:177` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` | `admin/controllers/totp.js:213` |

### Notas para el Frontend
- Tras `200`, el TOTP está **desactivado**: el siguiente paso es `totp/activate` con el nuevo QR.
- El código de respaldo usado en esta llamada queda consumido.
- Mientras TOTP esté desactivado, el login pedirá `totp_setup_requerido` según el estado del admin (`admin/controllers/auth.js:102-105`).
