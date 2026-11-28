# Usuarios (`/api/usuarios`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:125`. Modelo: `models/Usuario.js`.

> **Ejemplos:** todos los ejemplos de este archivo están **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [GET] /api/usuarios/:url

**Descripción:** Perfil público por slug (`url`) con contadores (posteos, seguidores, seguidos) y si el usuario autenticado sigue al dueño. Si la URL no existe pero coincide con un slug histórico (`url_history`), responde `200` con `redirect: "permanent"` y la URL actual.
**Archivo de ruta:** `routes/usuarios.js:19`
**Controlador:** `controllers/usuarios.js` — `usuarioGet` (línea 34)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`).
- Cadena de middlewares: `floodLecturaIpLimiter` → `verificarTokenSesion` → `catalogoUsuarioLimiter` → `check('url').trim()` → `validarUrlUsuario` (`middlewares/validar-url-usuario.js:4`) → `validarCampos` → `usuarioGet`.
- Rate limiters:
  - `floodLecturaIpLimiter` (`middlewares/rate-limiter.js:270-279`), 15 min / **3000** por IP (env `FLOOD_LECTURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `catalogoUsuarioLimiter`, 15 min / 100, código `READ_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `url` | string | Sí | `trim()` (sin validación de formato; la búsqueda es por igualdad exacta con `findOne({url})`) |

### Ejemplo de request
```http
GET /api/usuarios/ana-lopez-3f9a1
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "data": {
    "usuario": {
      "_id": "6650a1…",
      "nombre_completo": { "nombre": "Ana", "apellido": "López" },
      "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala" },
      "imagen_perfil": { "secure_url": "https://res.cloudinary.com/…", "public_id": "…" },
      "url": "ana-lopez-3f9a1",
      "totalPosteos": 12,
      "totalSeguidores": 40,
      "totalSeguidos": 25,
      "isFollowing": false
    }
  }
}
```

**Respuesta de URL histórica (`200`, sin error):**
```json
{ "success": true, "msg": "La URL ha cambiado", "data": { "urlActual": "ana-lopez-3f9a1", "redirect": "permanent" } }
```
Cabecera: `Location: /api/usuarios/ana-lopez-3f9a1`. **No es un 301 real.**

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:341-346` |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:270-279` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" | `middlewares/validar-jwt-cookies-sesion.js:60` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido - usuario no existe" | `helpers/estado-cuenta-sesion.js:20` vía `middlewares/validar-jwt-cookies-sesion.js:48-49` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta no activada. El usuario debe verificar su cuenta" | `helpers/estado-cuenta-sesion.js:23` vía `middlewares/validar-jwt-cookies-sesion.js:48-49` |
| 403 | `ACCOUNT_RESTRICTED` | Forbidden | "Tu cuenta está restringida" (sesión de una cuenta con `estatus` 2 o 3) | `helpers/estado-cuenta-sesion.js:26` vía `middlewares/validar-jwt-cookies-sesion.js:48-49` |
| 401 | `SESSION_REVOKED` | Authentication Required | "La sesión fue cerrada. Inicia sesión nuevamente." (access sin `sid`, sesión cerrada o vencida) | `middlewares/validar-jwt-cookies-sesion.js:38,46` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión expirada - inicia sesión nuevamente" | `middlewares/validar-jwt-cookies-sesion.js:52` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:34` |
| 404 | `NOT_FOUND` | Resource Not Found | `El usuario con URL "<url>" no existe` (sin coincidencia, ni histórica) | `middlewares/validar-url-usuario.js:28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El usuario con URL "<url>" no existe` (`estatus: 4`) | `middlewares/validar-url-usuario.js:32` |
| 401 | `UNAUTHORIZED` | Authentication Required | `El usuario con URL "<url>" no ha verificado su cuenta` | `middlewares/validar-url-usuario.js:36` |
| 401 | `UNAUTHORIZED` | Authentication Required | `El usuario con URL "<url>" no ha activado su cuenta` (`estatus: 0`) | `middlewares/validar-url-usuario.js:40` |
| 403 | `FORBIDDEN` | Forbidden | `El usuario con URL "<url>" tiene la cuenta suspendida` (`estatus` 2 o 3) | `middlewares/validar-url-usuario.js:44` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Ocurrió un error inesperado. Por favor, intente más tarde." (sin try/catch: el rechazo async llega al handler global) | `middlewares/error-handler.js:108-118` |

### Notas para el Frontend
- Errores 401/403 de `validarUrlUsuario` pertenecen al **perfil consultado**, no a la sesión del visitante; los de `verificarTokenSesion` (`SESSION_REVOKED`, `ACCOUNT_RESTRICTED`, etc.) sí son de la sesión. Distinguir por `detail`/`code`, no solo por el status: el 401 `UNAUTHORIZED` puede significar "perfil no verificado".
- Manejar `data.redirect === "permanent"` como redirección cliente a `data.urlActual`.
- Este endpoint devuelve `_id`, no `uid` (respuesta `lean()`, sin `toJSON`).
- `totalSeguidores` = seguidores del perfil; `totalSeguidos` = a quienes sigue el perfil.

---

## [POST] /api/usuarios

**Descripción:** Alta de cuenta. Valida datos, comprueba correo único, genera slug (`url`), hashea la contraseña (bcrypt), envía el correo de verificación y **solo si el envío tiene éxito** guarda el usuario. Devuelve un JWT de sesión temporal para el cliente.
**Archivo de ruta:** `routes/usuarios.js:33`
**Controlador:** `controllers/usuarios.js` — `usuariosPost` (línea 79)

### Autenticación y permisos
- Requiere token: **No**.
- Cadena de middlewares: `registroLimiter` → validadores de `nombre_completo.nombre`, `nombre_completo.apellido`, `correo` (`isEmail` + `validarCorreoUsuario`), `password`, `estatus` (opcional) e `intentos_login` (opcional) → `validarCampos` → `usuariosPost`.
- Rate limiter: `registroLimiter` (`middlewares/rate-limiter.js:174-183`), **1 h / 10** por IP (era 3 antes del 2026-11-18; NAT/CGNAT), código `REGISTER_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `nombre_completo.nombre` | string | Sí | `trim()`, `notEmpty()`, longitud 1–60 (`"El nombre no puede exceder 60 caracteres"`), regex `^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ .'\-]+$` (`"El nombre contiene caracteres no permitidos"`). Mensaje base: `"El nombre es obligatorio"` (`routes/usuarios.js:35-39`) |
| body | `nombre_completo.apellido` | string | Sí | Igual que `nombre` (`routes/usuarios.js:41-45`) |
| body | `correo` | string | Sí | `isEmail()` (`"El correo no es valido"`); luego `validarCorreoUsuario` → 409 si ya existe (`routes/usuarios.js:47-49`) |
| body | `password` | string | Sí | `trim()`; `isLength({min: 8})`; regex `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}\|<>_\-+=\[\]])` (`routes/usuarios.js:51-55`) |
| body | `estatus` | string/number | No | `optional().trim().isNumeric()` — **se valida pero el controlador lo ignora** |
| body | `intentos_login` | string/number | No | `optional().trim().isNumeric()` — **se valida pero el controlador lo ignora** |

El controlador solo toma `nombre_completo`, `correo` y `password` del body (`controllers/usuarios.js:82`). No hay asignación masiva.

### Ejemplo de request
```http
POST /api/usuarios
Content-Type: application/json

{
  "nombre_completo": { "nombre": "Ana", "apellido": "López" },
  "correo": "ana@example.com",
  "password": "Secreta#2026"
}
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: **`200`** (no `201`; `responder` sin `status`, `controllers/usuarios.js:120`).
```json
{
  "success": true,
  "data": { "token": "eyJhbGciOiJIUzI1NiJ9.eyJjb3JyZW8iOiJhbmFAZXhhbXBsZS5jb20ifQ.signature" }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `REGISTER_BLOCKED` | Rate Limit Exceeded | "Demasiadas cuentas creadas desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:177-181` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La solicitud contiene errores de validación" (en `errors`: "El nombre es obligatorio", "El nombre no puede exceder 60 caracteres", "El nombre contiene caracteres no permitidos", equivalentes para apellido, "El correo no es valido", "El password debe tener al menos 8 caracteres", "El password debe contener al menos una mayúscula, una minúscula, un número y un carácter especial") | `routes/usuarios.js:35-59` + `middlewares/validar-campos.js:28` |
| 409 | `CONFLICT` | Conflict | "El correo ya está registrado en la base de datos" (`errors: [{field:"correo", code:"duplicate", message:"El correo ya está registrado"}]`) | `helpers/validar-correo-usuario.js:12` (vía `middlewares/validar-campos.js:18`) |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "No se pudo enviar el correo" (SMTP falla; el usuario **no** se guarda) | `email/servicios-autenticacion-correo.js:186` (propagado por `controllers/usuarios.js:113-126`) |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al procesar la solicitud" (cualquier otro error, incluido un `E11000` por carrera de correo) | `controllers/usuarios.js:126` |

### Notas para el Frontend
- **Respuesta `200` sin `msg`**; el token es un JWT de `JWT_SEED`, expira en 1 h y **no es una sesión**: no inicia sesión ni fija cookies. Guárdalo en `sessionStorage` y úsalo en `POST /api/auth/reenviar-correo`.
- Usuario queda pendiente (`estatus: 0`, `email_validated: false`) hasta abrir el enlace de verificación.
- **Bienvenida `sistema` (2026-11-25):** este endpoint **no** notifica. Al abrir el enlace de `GET /api/auth/verificar-correo{/:token}` se crea una `Notificacion` in-app `tipo: "sistema"` ("¡Bienvenido a TlaxApp! Tu cuenta está lista.") y se envía correo de bienvenida, una sola vez, best-effort y después de responder (`controllers/auth.js:46-48`; `helpers/avisos-cuenta.js:115-133`). Silenciable con `correo.sistema`; **sin push**.
- ⚠ **Carrera de correo:** un `E11000` durante el `save()` se captura en el `catch` genérico y responde **500**, no 409 (`controllers/usuarios.js:113-126`).
- ⚠ **Enumeración de correos:** el 409 confirma si un correo está registrado. Es el comportamiento actual del producto; señalado para el auditor de seguridad.
- ⚠ El correo se guarda tal cual, sin normalizar a minúsculas ni `normalizeEmail`: `Ana@x.com` y `ana@x.com` no se detectan como duplicados.
- `password` se recorta (`trim`) antes de validar y hashear, igual que en login.

---

## [PUT] /api/usuarios/update

**Descripción:** Actualiza datos del perfil: nombre (`nombre_completo`), lugar de radicación, género y fecha de nacimiento. **Ya no cambia la contraseña**: si el body trae `password` responde `422` (`USE_PASSWORD_ENDPOINT`) sin escribir nada y se debe usar `PUT /api/usuarios/password`. Si cambia `nombre_completo`, regenera la `url` (slug) con cooldown de 30 días y guarda la anterior en `url_history`.
**Archivo de ruta:** `routes/usuarios.js:68`
**Controlador:** `controllers/usuarios.js` — `usuariosPut` (línea 132)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`).
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `cuentaUsuarioLimiter` → validadores opcionales → `validarCampos` → `usuariosPut`.
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `cuentaUsuarioLimiter`, 15 min / 10, código `CUENTA_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `nombre_completo.nombre` | string | No | `optional()`, `trim()`, `notEmpty()`, 1–60, mismo regex que en el alta (`routes/usuarios.js:74-79`) |
| body | `nombre_completo.apellido` | string | No | Igual (`routes/usuarios.js:81-86`) |
| body | `lugar_radicacion.nombreEntidad` | string | No | `optional().notEmpty()` (`routes/usuarios.js:90`) |
| body | `lugar_radicacion.claveMunicipio` | string | No | `optional().notEmpty()` (`:92`) |
| body | `lugar_radicacion.nombreMunicipio` | string | No | `optional().notEmpty()` (`:94`) |
| body | `genero` | string | No | `optional().isIn(['MASCULINO','FEMENINO','PREFIERO NO DECIR'])` (`:96`) |
| body | `fecha_nacimiento` | string (fecha) | No | `optional().isDate()` (`:98`) |

Campos ignorados por el controlador (whitelist `ALLOWED_FIELDS`, `controllers/usuarios.js:26-31`): cualquier otro campo, incluidos `correo`, `_id`, `url` y `estatus`. Se ignoran en silencio (no generan error).

Solo se escriben `nombre_completo`, `lugar_radicacion`, `genero` y `fecha_nacimiento`. **`password` no está en la whitelist y además se rechaza antes** (ver error 422 `USE_PASSWORD_ENDPOINT`): cualquier valor distinto de `undefined` (incluidos `""` y `null`) activa el rechazo (`controllers/usuarios.js:138-143`).

### Ejemplo de request
```http
PUT /api/usuarios/update
Content-Type: application/json
Cookie: accessToken=…

{
  "nombre_completo": { "nombre": "Ana María", "apellido": "López" },
  "genero": "FEMENINO",
  "fecha_nacimiento": "1995-05-10"
}
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Usuario actualizado",
  "data": {
    "usuario": {
      "_id": "6650a1…",
      "nombre_completo": { "nombre": "Ana María", "apellido": "López" },
      "lugar_radicacion": { "claveEntidad": 29, "nombreEntidad": "Tlaxcala" },
      "correo": "ana@example.com",
      "url": "ana-maria-lopez-7c2d1",
      "genero": "FEMENINO",
      "fecha_nacimiento": "1995-05-10T00:00:00.000Z",
      "nombre_completo_changed_at": "2026-10-27T19:10:34.000Z"
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `CUENTA_BLOCKED` | Rate Limit Exceeded | "Demasiadas operaciones de cuenta, intenta de nuevo más tarde" | `middlewares/rate-limiter.js` (`cuentaUsuarioLimiter`) |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js` (`floodEscrituraIpLimiter`) |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" / "Sesión expirada - inicia sesión nuevamente" | `middlewares/validar-jwt-cookies-sesion.js:60,34,52` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La contraseña ya no se actualiza en este endpoint; usa PUT /api/usuarios/password". Se lanza **antes de escribir nada**. `errors: [{ field: "password", code: "USE_PASSWORD_ENDPOINT", message: "Usa PUT /api/usuarios/password con { passwordActual, passwordNueva }" }]` | `controllers/usuarios.js:138-143` |
| 422 | `VALIDATION_FAILED` | Validation Failed | Mensajes de `routes/usuarios.js:74-97` (p. ej. `"El nombre contiene caracteres no permitidos"`, `"El genero no puede estar vacio: [MASCULINO, FEMENINO, PREFIERO NO DECIR]"`, `"La fecha no es valida"`) | `middlewares/validar-campos.js:28` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/usuarios.js:162` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | "Solo puedes cambiar tu nombre y URL una vez cada 30 días" (`retry_after` en segundos) | `controllers/usuarios.js:178-183` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al procesar la solicitud" (incluye `E11000` de `url` tras 3 reintentos y errores de validación de Mongoose) | `controllers/usuarios.js:242` |

### Notas para el Frontend
- La respuesta usa `_id` (no `uid`).
- **La `url` cambia** solo si `nombre_completo` cambia de verdad. Si cambia, la respuesta trae la nueva `url`: actualiza tu estado y la navegación al perfil.
- **Cooldown:** solo se puede cambiar el nombre una vez cada 30 días desde `nombre_completo_changed_at`. El primer cambio tras el registro no tiene cooldown (`controllers/usuarios.js:176-183`). `retry_after` indica cuándo.
- **Mismo nombre no cambia la `url`:** la comparación es por `nombre` y `apellido` exactos (`controllers/usuarios.js:167`). Si coinciden, no hay cooldown, no se regenera `url` y no se escribe `url_history`.
- Para actualizar `lugar_radicacion` el controlador hace `$set` sobre el objeto completo: **envía el subdocumento entero** para no perder campos. (**[REQUIERE VERIFICACIÓN MANUAL]** — derivado del `$set` de `controllers/usuarios.js:224`.)
- Igual que `nombre_completo`: si envías solo `nombre_completo.nombre`, el `$set` reemplaza el objeto y puede eliminar el `apellido` almacenado (**[REQUIERE VERIFICACIÓN MANUAL]**, mismo mecanismo).
- **Cambio de contraseña:** este endpoint ya no la cambia. Para cambiarla usa `PUT /api/usuarios/password` (exige `passwordActual`, aplica las reglas completas del registro y cierra las demás sesiones). Mientras el body incluya `password`, la respuesta es `422 USE_PASSWORD_ENDPOINT` y nada se escribe. Esto cierra H13 para este endpoint.
- **Actualizado 2026-11-17 (drift corregido, commit `9f14360`):** una petición sin body JSON ya **no** responde 500. El controlador lee `req.body?.password` (`controllers/usuarios.js:138`) y desestructura `req.body ?? {}` (`controllers/usuarios.js:145`): sin body se trata igual que `{}` y responde `200` "Usuario actualizado" (solo se escribe `fecha_actualizacion`, `controllers/usuarios.js:152`). Aun así, envía siempre `Content-Type: application/json`.

---

## [PUT] /api/usuarios/password

**Descripción:** Cambio de contraseña autenticado (step-up E1b, `SPECS-SESIONES §6.1`). Compara la contraseña actual, guarda la nueva (bcrypt), resetea `intentos_login` a `0` y cierra **todas las demás sesiones** del usuario en una transacción MongoDB: borra las filas `UserToken` cuyo `sessionId` sea distinto de `req.sessionId` (el `sid` del access token, que deja `verificarTokenSesion`). La sesión desde la que se hace el cambio sigue activa. No incrementa `tokenVersion`.
**Archivo de ruta:** `routes/usuarios.js:102`
**Controlador:** `controllers/usuarios.js` — `usuariosPasswordPut` (línea 248)

> **Actualizado 2026-11-17 (E4, commit `a398f7b`).** Ya **no** se exige ni se lee la cookie `refreshToken`: el 403 "No hay refresh token" desapareció y la sesión actual se identifica por `req.sessionId` (`controllers/usuarios.js:284-287`). Las sesiones cerradas quedan inválidas **al instante** (`401 SESSION_REVOKED`), no al vencer su access token.

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken` con `sid` de una sesión viva). La cookie `refreshToken` **no** es necesaria.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `passwordUsuarioLimiter` → validadores de `passwordActual` y `passwordNueva` → `validarCampos` → `usuariosPasswordPut` (`routes/usuarios.js:102-119`; orden verificado por `test/cambio-password.test.js:48-54`).
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `passwordUsuarioLimiter`, 15 min / **5**, clave usuario, código `PASSWORD_BLOCKED` (`middlewares/rate-limiter.js:391-396`). Más estricto que `cuentaUsuarioLimiter` porque con una sesión robada este endpoint sirve para adivinar la contraseña actual.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `passwordActual` | string | Sí | `isString()` (`"La contraseña actual debe ser texto"`), `notEmpty()` (`"La contraseña actual es obligatoria"`), `isLength({max: 128})` (`"La contraseña actual es demasiado larga"`). **No** se valida su formato ni complejidad: solo se compara con bcrypt contra el hash almacenado (`routes/usuarios.js:108-111`, `controllers/usuarios.js:259`) |
| body | `passwordNueva` | string | Sí | `isString()` (`"La contraseña nueva debe ser texto"`), `isLength({min: 8, max: 128})` (`"La contraseña nueva debe tener entre 8 y 128 caracteres"`), regex `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}\|<>_\-+=\[\]])` (`"La contraseña nueva debe contener al menos una mayúscula, una minúscula, un número y un carácter especial"`) — mismas reglas que el registro (`routes/usuarios.js:113-117`) |

El controlador no toma ningún otro campo del body (`controllers/usuarios.js:252`) ni lee cookies.

### Ejemplo de request
```http
PUT /api/usuarios/password
Content-Type: application/json
Cookie: accessToken=…

{
  "passwordActual": "Secreta#2026",
  "passwordNueva": "Nueva#2026"
}
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Contraseña actualizada. Se cerraron las demás sesiones.",
  "data": { "sesionesCerradas": 2 }
}
```
`data.sesionesCerradas` es el `deletedCount` de las filas `UserToken` borradas distintas de la actual (`controllers/usuarios.js:284-288,294-297`). Puede ser `0` si no había otras sesiones.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js` (`floodEscrituraIpLimiter`) |
| 429 | `PASSWORD_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de cambio de contraseña, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:391-396` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido - usuario no existe" / "Sesión expirada - inicia sesión nuevamente" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,52,34`; `helpers/estado-cuenta-sesion.js:20` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/usuarios.js:256` |
| 401 | `INVALID_CURRENT_PASSWORD` | Authentication Required | "La contraseña actual es incorrecta" (default de la clase, `errors/error-classes.js:34`) | `controllers/usuarios.js:260` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La nueva contraseña debe ser distinta a la actual", con `errors: [{ field: "passwordNueva", code: "SAME_AS_CURRENT", message: "La nueva contraseña debe ser distinta a la actual" }]` | `controllers/usuarios.js:263-268` |
| 422 | `VALIDATION_FAILED` | Validation Failed | Mensajes de validación de `routes/usuarios.js:108-117` (contraseña actual obligatoria/too larga, reglas de la nueva) | `middlewares/validar-campos.js:28` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al procesar la solicitud" | `controllers/usuarios.js:306` |

El 403 `FORBIDDEN` "No hay refresh token" que figuraba aquí ya no existe (eliminado en E4).

### Notas para el Frontend
- Encabezados: `Content-Type: application/json` + cookies con `credentials: 'include'` (basta `accessToken`).
- ⚠ **El 401 `INVALID_CURRENT_PASSWORD` NO debe disparar el flujo de refresh.** Es un error de negocio (contraseña mal escrita), no una sesión expirada; disparar `POST /api/auth/refresh` aquí rota cookies innecesariamente. Distinguir por `code`, nunca por el status.
- Tras el éxito: los otros dispositivos pierden su fila `UserToken` y su siguiente petición autenticada (o su `POST /api/auth/refresh`) responde **`401 SESSION_REVOKED`** de inmediato, porque cada request valida el `sid` contra `UserToken` (E4). Ya no se dispara la vía de reuso ni se invalidan las demás sesiones (H22/H23/H24 ya no aplican aquí). La sesión actual conserva su fila y sus cookies.
- El cubo de `passwordUsuarioLimiter` es **compartido con `DELETE /api/usuarios/delete` y `DELETE /api/auth/sesiones/otras`** (misma instancia): 5 intentos combinados por usuario en 15 min entre los tres endpoints.
- La comparación `passwordNueva === passwordActual` se hace con bcrypt contra el hash viejo (no string equality): la "nueva" solo se rechaza si coincide criptográficamente con la actual.
- La transacción es atómica: si el `deleteMany` de sesiones fallara, el `updateOne` de la contraseña se revierte con él (`session.withTransaction`, `controllers/usuarios.js:275-292`).
- **Aviso de seguridad (2026-11-25):** tras el commit y después de responder se crea una `Notificacion` in-app `tipo: "seguridad"` ("Tu contraseña se cambió y se cerraron tus demás sesiones.") con push y correo (sin cooldown), best-effort (`controllers/usuarios.js:298-299`; `helpers/avisos-cuenta.js:32-62`). No se puede silenciar y no cambia el contrato de la respuesta.
- Nota de seguridad (una línea): el endpoint exige la contraseña actual, pero un access token robado de una sesión viva sigue pudiendo cambiar la contraseña si el atacante la conoce; la sesión actual siempre sobrevive por diseño.

---

## [DELETE] /api/usuarios/delete

**Descripción:** Eliminación de la cuenta (soft delete) en una transacción de MongoDB (step-up E1c): exige la contraseña actual, marca al usuario con `estatus: 4`, `isDeleted: true`, elimina lógicamente sus posteos, seguimientos, likes, notificaciones, favoritos, comentarios y reportes relacionados, y **borra todas las sesiones del usuario** (`UserToken.deleteMany`) dentro de la misma transacción. Después limpia las cookies de la sesión actual. Un cron posterior hace el borrado físico (**[REQUIERE VERIFICACIÓN MANUAL]**: el cron no se revisó en esta corrida).
**Archivo de ruta:** `routes/usuarios.js:121`
**Controlador:** `controllers/usuarios.js` — `usuariosDelete` (línea 309) → `helpers/cerrar-sesion-cookies.js` — `cerrarSesionCookies` (línea 17)

> **Actualizado 2026-11-17 (E4, commit `a398f7b`).** Ya **no** se exige ni se lee la cookie `refreshToken`: el 403 "No hay refresh token" desapareció (`controllers/usuarios.js:325-327`). Tras el commit, `cerrarSesionCookies(res)` solo limpia las cookies (sin argumento de sesión no borra nada, `controllers/usuarios.js:501`).

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken` con `sid` de una sesión viva) **y** la contraseña actual en el body. La cookie `refreshToken` **no** es necesaria.
- Cadena de middlewares: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `cuentaUsuarioLimiter` → `passwordUsuarioLimiter` → `check('passwordActual')` → `validarCampos` → `usuariosDelete` (`routes/usuarios.js:121-133`; orden verificado por `test/cambio-password.test.js:20-27`).
- Rate limiters:
  - `floodEscrituraIpLimiter` (`middlewares/rate-limiter.js:282-291`), 15 min / **600** por IP (env `FLOOD_ESCRITURA_IP_MAX`), código `FLOOD_BLOCKED`.
  - `cuentaUsuarioLimiter`, 15 min / 10, código `CUENTA_BLOCKED`.
  - `passwordUsuarioLimiter`, 15 min / **5**, clave usuario, código `PASSWORD_BLOCKED` (`middlewares/rate-limiter.js:391-396`). Mismo cubo estricto que el cambio de contraseña (compartido: 5 intentos combinados entre ambos endpoints).

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `passwordActual` | string | Sí | `isString()` (`"La contraseña actual debe ser texto"`), `notEmpty()` (`"La contraseña actual es obligatoria"`), `isLength({max: 128})` (`"La contraseña actual es demasiado larga"`). El controlador la compara con bcrypt contra el hash almacenado (`routes/usuarios.js:128-131`, `controllers/usuarios.js:345`) |

Cookie necesaria: `accessToken` (autenticación).

### Ejemplo de request
```http
DELETE /api/usuarios/delete
Content-Type: application/json
Cookie: accessToken=…

{ "passwordActual": "Secreta#2026" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
- Cabeceras: `Set-Cookie` que borra `accessToken` y `refreshToken`.
```json
{
  "success": true,
  "msg": "Cuenta eliminada exitosamente. Tus datos serán eliminados permanentemente en unos días."
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `CUENTA_BLOCKED` | Rate Limit Exceeded | "Demasiadas operaciones de cuenta, intenta de nuevo más tarde" | `middlewares/rate-limiter.js` (`cuentaUsuarioLimiter`) |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js` (`floodEscrituraIpLimiter`) |
| 429 | `PASSWORD_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos de cambio de contraseña, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:391-396` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido - usuario no existe" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34`; `helpers/estado-cuenta-sesion.js:20` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión: ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/usuarios.js:338` |
| 400 | `BAD_REQUEST` | Bad Request | "La cuenta ya fue eliminada previamente" (casi inalcanzable: `verificarTokenSesion` ya rechaza `estatus: 4`) | `controllers/usuarios.js:345` |
| 401 | `INVALID_CURRENT_PASSWORD` | Authentication Required | "La contraseña actual es incorrecta" (default de la clase, `errors/error-classes.js:34`; se valida **antes** de cambiar nada y aborta la transacción) | `controllers/usuarios.js:350-353` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al eliminar la cuenta de usuario. Por favor, intenta nuevamente." (aborta la transacción) | `controllers/usuarios.js:516` |

El 403 `FORBIDDEN` "No hay refresh token" que figuraba aquí ya no existe (eliminado en E4).

### Notas para el Frontend
- Requiere la cookie `accessToken` **y** la `passwordActual`. Si el access token expiró (`401 UNAUTHORIZED`), llama primero a `POST /api/auth/refresh`.
- ⚠ **El 401 `INVALID_CURRENT_PASSWORD` NO debe disparar el flujo de refresh** (mismo criterio que en `PUT /api/usuarios/password`): es un error de negocio, no de sesión. Distinguir por `code`.
- El orden de validación protege al usuario: sesión → existencia → cuenta ya eliminada → contraseña. Una contraseña incorrecta **no** consume el borrado ni deja estado intermedio (aborta la transacción).
- Tras el éxito, redirige al inicio o al login: las cookies ya se borraron.
- **E1c + E4:** se borran **todas** las filas `UserToken` del usuario dentro de la transacción (`controllers/usuarios.js:483`). Los otros dispositivos reciben `401 SESSION_REVOKED` en su siguiente petición autenticada y en `POST /api/auth/refresh` (ya no hay vía de reuso, H22/H23 no aplican).
- **Orden de la limpieza:** `cerrarSesionCookies(res)` se ejecuta **después** del commit (`controllers/usuarios.js:501`), pero sin argumento de sesión ya no toca la BD (solo `clearCookie`, `helpers/cerrar-sesion-cookies.js:19-23`), así que el riesgo de 500 con la cuenta ya borrada que se documentó el 2026-11-13 queda prácticamente eliminado.
- Operación destructiva: pide confirmación explícita en la UI (idealmente con el campo de contraseña, que ahora es requerido por el backend).

---

## [GET] /api/usuarios/registrados/nuevos-usuarios-registrados

**Descripción:** Devuelve hasta 3 usuarios recién registrados (estatus 1 y correo verificado), excluyendo al usuario autenticado, con `isFollowing` respecto al usuario autenticado.
**Archivo de ruta:** `routes/usuarios.js:135`
**Controlador:** `controllers/usuarios.js` — `nuevosUsuariosRegistrados` (línea 526)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`).
- Cadena de middlewares: `pollingIpLimiter` → `verificarTokenSesion` → `catalogoUsuarioLimiter` → `nuevosUsuariosRegistrados`.
- Rate limiters:
  - `pollingIpLimiter` (`middlewares/rate-limiter.js:297-306`), 15 min / 3000 por IP (env `POLLING_IP_MAX`), código `FLOOD_BLOCKED`. **Cubo propio de polling** (cambiado el 2026-11-25: antes usaba `floodLecturaIpLimiter`).
  - `catalogoUsuarioLimiter` (`:341-346`), 15 min / 100 por usuario, código `READ_BLOCKED`.

### Parámetros de entrada
Ninguno. (`page`, `limite` y `limit` no se leen.)

### Ejemplo de request
```http
GET /api/usuarios/registrados/nuevos-usuarios-registrados
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Nuevos Usuarios Registrados",
  "data": {
    "nuevosUsuariosRegistrados": [
      {
        "_id": "6650b2…",
        "nombre_completo": { "nombre": "Luis", "apellido": "Pérez" },
        "url": "luis-perez-9d4e0",
        "imagen_perfil": { "secure_url": "https://res.cloudinary.com/…", "public_id": "…" },
        "isFollowing": false
      }
    ]
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:341-346` (`catalogoUsuarioLimiter`) |
| 429 | `FLOOD_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:297-306` (`pollingIpLimiter`) |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:60,34` |
| 401 / 403 / 500 | `SESSION_REVOKED` · `ACCOUNT_RESTRICTED` · `FORBIDDEN` · `INTERNAL_ERROR` | — | Errores comunes de la sesión (sesión cerrada o vencida, cuenta restringida o no activada, fallo de BD): ver [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario) | `middlewares/validar-jwt-cookies-sesion.js:38,46,48-49,67-68` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener los nuevos usuarios" | `controllers/usuarios.js:593` |

### Notas para el Frontend
- Lista de máximo 3 elementos, ordenada por `fecha_registro` descendente. No es paginada.
- Al ser un endpoint de polling, usa el cubo `pollingIpLimiter` (3000/15 min por IP): no consume el cupo de lecturas interactivas ni el del feed.
- Usa `_id` como clave; `imagen_perfil.secure_url` viene en la respuesta.
