# Acceso anticipado y atribución de influencers (`/api/early-access`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:139`. **TEMPORAL:** este módulo se eliminará al terminar el acceso anticipado (ver comentario `TEMPORAL` en `models/server.js:53-55,138`). Rutas: `routes/earlyaccess.js`. Controladores: `controllers/atribucion.js` (captura) y `controllers/earlyaccess.js` (conversión). Helpers: `helpers/atribucion.js`. Modelos: `models/Earlyaccess.js`, `models/Influencer.js`.

**Flujo:** la landing llama `GET /atribucion?ref=...` (con `credentials: 'include'`) y el backend firma la cookie `early_access_atribucion` (primer clic, 30 días). Al registrarse, `POST /api/early-access` toma esa cookie y guarda un snapshot inmutable de la atribución si el influencer sigue activo.

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [GET] /api/early-access/atribucion

**Descripción:** Captura la atribución de un influencer (primer clic). Si la cookie ya existe y es válida, no la reemplaza. **Siempre responde `204` sin cuerpo**, incluso cuando la captura no aplica (ref inválido, influencer inactivo, falta de secreto). Así no se filtra información al cliente.
**Archivo de ruta:** `routes/earlyaccess.js:52`
**Controlador:** `controllers/atribucion.js` — `capturarAtribucion` (línea 51)

### Autenticación y permisos
- Requiere token: **No**.
- Cadena de middlewares: `atribucionLimiter` (`routes/earlyaccess.js:30`) → `capturarAtribucion`.
- Rate limiter: `atribucionLimiter`, **1 min / 60** (configurable con `EARLY_ACCESS_ATRIBUCION_RATE_LIMIT_WINDOW_MS` y `EARLY_ACCESS_ATRIBUCION_RATE_LIMIT_MAX`), código `ATRIBUCION_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| query | `ref` | string | No | `normalizarRef`: `trim()`, mayúsculas, debe cumplir `^[A-Z0-9][A-Z0-9_-]{2,31}$`. Si no cumple → 204 sin cookie. **Sin validador de express-validator: nunca devuelve 422** |
| query | `utm_source` | string | No | Lista cerrada, case-insensitive: `instagram`, `facebook`, `tiktok`, `youtube`, `whatsapp`, `telegram`, `x`, `threads`, `website`, `other`. Fuera de lista → `null` (no impide la captura) |
| query | `utm_content` | string | No | Lista cerrada: `bio`, `story`, `reel`, `post`, `video`, `live`, `comment`, `direct_message`, `group`, `channel`, `profile`, `website`, `qr`, `other`. Fuera de lista → `null` |

### Ejemplo de request
```http
GET /api/early-access/atribucion?ref=ANA2026&utm_source=instagram&utm_content=reel
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `204` (sin cuerpo).
- Cabecera: `Set-Cookie: early_access_atribucion=v1.<payload>.<firma>; Path=/api/early-access; HttpOnly; SameSite=Lax; Max-Age=2592000` (+ `Secure` en producción).
- Payload firmado (interno, no legible por el cliente): `{ r: "ANA2026", i: "<ObjectId>", s: "instagram", c: "reel", t: <ms> }`.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `ATRIBUCION_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes de atribución. Intenta más tarde." | `routes/earlyaccess.js:35-45` |

Cualquier otro fallo (incluido un error interno) responde `204` con un log en servidor (`controllers/atribucion.js:58,72,77,93-94`). No hay errores de negocio.

### Notas para el Frontend
- **No leas la respuesta.** Solo importa la cookie. El `204` no distingue captura exitosa de descartada.
- Llámalo una vez por visita de la landing, con `credentials: 'include'`.
- El primer clic gana: si ya hay una cookie válida y vigente (`t` dentro de 30 días), la nueva se ignora.
- ⚠ **[REQUIERE VERIFICACIÓN MANUAL]:** la cookie usa `SameSite=Lax`. La landing y la API están en dominios distintos (AGENTS.md: "cross-domain Vercel↔Express"). En ese caso el navegador **no envía ni acepta** una cookie `Lax` en peticiones *cross-site*, así que la atribución podría no capturarse nunca desde la landing. Las cookies de sesión del resto de la API usan `sameSite: 'none'` (`helpers/tokensUtils.js:40,47`). Confirmar con pruebas reales en producción.
- Cookie con `Path=/api/early-access`: solo viaja a esa ruta, incluido el `POST` de conversión.

---

## [POST] /api/early-access

**Descripción:** Registra un contacto (correo o teléfono) en la lista de acceso anticipado. Si hay una cookie de atribución válida y el influencer sigue activo, guarda el snapshot `atribucion` (influencerId, código, utm, primer clic). Envía un correo de aviso al equipo y, si el contacto contiene `@`, un correo de confirmación al usuario (sin bloquear).
**Archivo de ruta:** `routes/earlyaccess.js:55`
**Controlador:** `controllers/earlyaccess.js` — `earlyAccess` (línea 45). Resolución de atribución: `resolverAtribucion` (línea 20).

### Autenticación y permisos
- Requiere token: **No**.
- Cadena de middlewares: `limiter` (`routes/earlyaccess.js:8`, dentro del array) → `check('contacto').trim().notEmpty()` → `check('contacto').isLength({max: 120})` → `validarCampos` → `earlyAccess`.
- Rate limiter: `EARLY_ACCESS` (`routes/earlyaccess.js:8`), **10 min / 5** por defecto (configurable con `EARLY_ACCESS_RATE_LIMIT_WINDOW_MS` y `EARLY_ACCESS_RATE_LIMIT_MAX`), código `EARLY_ACCESS_BLOCKED`. **Este limiter no está en la tabla de AGENTS.md.**

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `contacto` | string | Sí | `trim()` + `notEmpty()`; `"El contacto es obligatorio"` → 422. `isLength({max: 120})`; `"El contacto no puede exceder 120 caracteres"` → 422. **No valida formato de correo ni de teléfono.** |

### Ejemplo de request
```http
POST /api/early-access
Content-Type: application/json
Cookie: early_access_atribucion=…

{ "contacto": "ana@example.com" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: **`200`**
```json
{ "ok": true, "contacto": "ana@example.com", "msg": "Contacto registrado correctamente" }
```
**Nota:** no tiene `success`; el contrato es `{ ok, contacto, msg }` (intencional, AGENTS.md).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `EARLY_ACCESS_BLOCKED` | Rate Limit Exceeded | "Demasiados intentos. Intenta más tarde." | `routes/earlyaccess.js:14-19` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El contacto es obligatorio" | `routes/earlyaccess.js:57` + `middlewares/validar-campos.js:28` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El contacto no puede exceder 120 caracteres" | `routes/earlyaccess.js:58` + `middlewares/validar-campos.js:28` |
| 409 | `CONFLICT` | Conflict | `El contacto <contacto> ya está registrado` | `controllers/earlyaccess.js:51` (y carrera por índice único: `controllers/earlyaccess.js:73`) |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al registrar contacto" | `controllers/earlyaccess.js:76` |

### Notas para el Frontend
- Responde `200` (no `201`) y **sin `success`**. Verifica `ok === true`.
- El 409 confirma que un contacto ya está registrado. Es una fuga de existencia conocida (**señalado para el auditor de seguridad**).
- El contacto se guarda tal cual (sin normalizar a minúsculas). `Ana@x.com` y `ana@x.com` no se detectan como duplicados.
- Solo `POST` cuenta para el límite de 5 cada 10 min por IP.
- La atribución se toma de la cookie **solo si el navegador la envía**. Si la captura falló (ver nota de `SameSite`), el registro se guarda con `atribucion: null`, sin error.
- Los correos son asíncronos: el usuario no recibe error si fallan.
