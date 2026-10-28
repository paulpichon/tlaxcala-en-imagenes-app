# Usuarios (`/api/usuarios`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:124`. Modelo: `models/Usuario.js`.

> **Ejemplos:** todos los ejemplos de este archivo están **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [GET] /api/usuarios/:url

**Descripción:** Perfil público por slug (`url`) con contadores (posteos, seguidores, seguidos) y si el usuario autenticado sigue al dueño. Si la URL no existe pero coincide con un slug histórico (`url_history`), responde `200` con `redirect: "permanent"` y la URL actual.
**Archivo de ruta:** `routes/usuarios.js:18`
**Controlador:** `controllers/usuarios.js` — `usuarioGet` (línea 33)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`).
- Cadena de middlewares: `verificarTokenSesion` → `check('url').trim()` → `validarUrlUsuario` (`middlewares/validar-url-usuario.js:4`) → `validarCampos` → `usuarioGet`.
- Rate limiter: **ninguno**.

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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" | `middlewares/validar-jwt-cookies-sesion.js:14` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido - usuario no existe" | `middlewares/validar-jwt-cookies-sesion.js:27` |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta no activada. El usuario debe verificar su cuenta" | `middlewares/validar-jwt-cookies-sesion.js:31` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión expirada - inicia sesión nuevamente" | `middlewares/validar-jwt-cookies-sesion.js:35` |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:45` |
| 404 | `NOT_FOUND` | Resource Not Found | `El usuario con URL "<url>" no existe` (sin coincidencia, ni histórica) | `middlewares/validar-url-usuario.js:28` |
| 404 | `NOT_FOUND` | Resource Not Found | `El usuario con URL "<url>" no existe` (`estatus: 4`) | `middlewares/validar-url-usuario.js:32` |
| 401 | `UNAUTHORIZED` | Authentication Required | `El usuario con URL "<url>" no ha verificado su cuenta` | `middlewares/validar-url-usuario.js:36` |
| 401 | `UNAUTHORIZED` | Authentication Required | `El usuario con URL "<url>" no ha activado su cuenta` (`estatus: 0`) | `middlewares/validar-url-usuario.js:40` |
| 403 | `FORBIDDEN` | Forbidden | `El usuario con URL "<url>" tiene la cuenta suspendida` (`estatus` 2 o 3) | `middlewares/validar-url-usuario.js:44` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Ocurrió un error inesperado. Por favor, intente más tarde." (sin try/catch: el rechazo async llega al handler global) | `middlewares/error-handler.js:108-118` |

### Notas para el Frontend
- Errores 401/403 de esta ruta pertenecen al **perfil consultado**, no a la sesión del visitante. Distinguir por `detail`/`code`, no solo por el status: el 401 `UNAUTHORIZED` puede significar "perfil no verificado".
- Manejar `data.redirect === "permanent"` como redirección cliente a `data.urlActual`.
- Este endpoint devuelve `_id`, no `uid` (respuesta `lean()`, sin `toJSON`).
- `totalSeguidores` = seguidores del perfil; `totalSeguidos` = a quienes sigue el perfil.

---

## [POST] /api/usuarios

**Descripción:** Alta de cuenta. Valida datos, comprueba correo único, genera slug (`url`), hashea la contraseña (bcrypt), envía el correo de verificación y **solo si el envío tiene éxito** guarda el usuario. Devuelve un JWT de sesión temporal para el cliente.
**Archivo de ruta:** `routes/usuarios.js:30`
**Controlador:** `controllers/usuarios.js` — `usuariosPost` (línea 76)

### Autenticación y permisos
- Requiere token: **No**.
- Cadena de middlewares: `registroLimiter` → validadores de `nombre_completo.nombre`, `nombre_completo.apellido`, `correo` (`isEmail` + `validarCorreoUsuario`), `password`, `estatus` (opcional) e `intentos_login` (opcional) → `validarCampos` → `usuariosPost`.
- Rate limiter: `registroLimiter` (`middlewares/rate-limiter.js:86`), **1 h / 3**, clave IP, código `REGISTER_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `nombre_completo.nombre` | string | Sí | `trim()`, `notEmpty()`, longitud 1–60 (`"El nombre no puede exceder 60 caracteres"`), regex `^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ .'\-]+$` (`"El nombre contiene caracteres no permitidos"`). Mensaje base: `"El nombre es obligatorio"` (`routes/usuarios.js:32-36`) |
| body | `nombre_completo.apellido` | string | Sí | Igual que `nombre` (`routes/usuarios.js:38-42`) |
| body | `correo` | string | Sí | `isEmail()` (`"El correo no es valido"`); luego `validarCorreoUsuario` → 409 si ya existe (`routes/usuarios.js:44-46`) |
| body | `password` | string | Sí | `trim()`; `isLength({min: 8})`; regex `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}\|<>_\-+=\[\]])` (`routes/usuarios.js:48-52`) |
| body | `estatus` | string/number | No | `optional().trim().isNumeric()` — **se valida pero el controlador lo ignora** |
| body | `intentos_login` | string/number | No | `optional().trim().isNumeric()` — **se valida pero el controlador lo ignora** |

El controlador solo toma `nombre_completo`, `correo` y `password` del body (`controllers/usuarios.js:79`). No hay asignación masiva.

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
- Código de estado: **`200`** (no `201`; `responder` sin `status`, `controllers/usuarios.js:117`).
```json
{
  "success": true,
  "data": { "token": "eyJhbGciOiJIUzI1NiJ9.eyJjb3JyZW8iOiJhbmFAZXhhbXBsZS5jb20ifQ.signature" }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `REGISTER_BLOCKED` | Rate Limit Exceeded | "Demasiadas cuentas creadas desde esta conexión, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:92-94` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La solicitud contiene errores de validación" (en `errors`: "El nombre es obligatorio", "El nombre no puede exceder 60 caracteres", "El nombre contiene caracteres no permitidos", equivalentes para apellido, "El correo no es valido", "El password debe tener al menos 8 caracteres", "El password debe contener al menos una mayúscula, una minúscula, un número y un carácter especial") | `routes/usuarios.js:32-52` + `middlewares/validar-campos.js:28` |
| 409 | `CONFLICT` | Conflict | "El correo ya está registrado en la base de datos" (`errors: [{field:"correo", code:"duplicate", message:"El correo ya está registrado"}]`) | `helpers/validar-correo-usuario.js:12` (vía `middlewares/validar-campos.js:18`) |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "No se pudo enviar el correo" (SMTP falla; el usuario **no** se guarda) | `email/servicios-autenticacion-correo.js:186` (propagado por `controllers/usuarios.js:118-121`) |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al procesar la solicitud" (cualquier otro error, incluido un `E11000` por carrera de correo) | `controllers/usuarios.js:123` |

### Notas para el Frontend
- **Respuesta `200` sin `msg`**; el token es un JWT de `JWT_SEED`, expira en 1 h y **no es una sesión**: no inicia sesión ni fija cookies. Guárdalo en `sessionStorage` y úsalo en `POST /api/auth/reenviar-correo`.
- El usuario queda pendiente (`estatus: 0`, `email_validated: false`) hasta abrir el enlace de verificación.
- ⚠ **Carrera de correo:** un `E11000` durante el `save()` se captura en el `catch` genérico y responde **500**, no 409 (`controllers/usuarios.js:118-123`).
- ⚠ **Enumeración de correos:** el 409 confirma si un correo está registrado. Es el comportamiento actual del producto; señalado para el auditor de seguridad.
- ⚠ El correo se guarda tal cual, sin normalizar a minúsculas ni `normalizeEmail`: `Ana@x.com` y `ana@x.com` no se detectan como duplicados.
- `password` se recorta (`trim`) antes de validar y hashear, igual que en login.

---

## [PUT] /api/usuarios/update

**Descripción:** Actualiza datos del perfil: nombre, lugar de radicación, género, fecha de nacimiento y contraseña. Si cambia `nombre_completo`, regenera la `url` (slug) con cooldown de 30 días y guarda la anterior en `url_history`.
**Archivo de ruta:** `routes/usuarios.js:65`
**Controlador:** `controllers/usuarios.js` — `usuariosPut` (línea 131)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`).
- Cadena de middlewares: `verificarTokenSesion` → validadores opcionales → `validarCampos` → `usuariosPut`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `nombre_completo.nombre` | string | No | `optional()`, `trim()`, `notEmpty()`, 1–60, mismo regex que en el alta (`routes/usuarios.js:69-74`) |
| body | `nombre_completo.apellido` | string | No | Igual (`routes/usuarios.js:76-81`) |
| body | `password` | string | No | `optional()`, `trim()`, `isLength({min: 8})`; mensaje `"El password es obligatorio: debe tener al menos 6 caracteres"` (**el mensaje dice 6; el mínimo real es 8**) (`routes/usuarios.js:83`) |
| body | `lugar_radicacion.nombreEntidad` | string | No | `optional().notEmpty()` (`routes/usuarios.js:85`) |
| body | `lugar_radicacion.claveMunicipio` | string | No | `optional().notEmpty()` (`:87`) |
| body | `lugar_radicacion.nombreMunicipio` | string | No | `optional().notEmpty()` (`:89`) |
| body | `genero` | string | No | `optional().isIn(['MASCULINO','FEMENINO','PREFIERO NO DECIR'])` (`:91`) |
| body | `fecha_nacimiento` | string (fecha) | No | `optional().isDate()` (`:93`) |

Campos ignorados por el controlador (whitelist `ALLOWED_FIELDS`, `controllers/usuarios.js:25-30`): cualquier otro campo, incluidos `correo`, `_id`, `url` y `estatus`.

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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" / "Sesión expirada - inicia sesión nuevamente" | `middlewares/validar-jwt-cookies-sesion.js:14,45,35` |
| 422 | `VALIDATION_FAILED` | Validation Failed | Mensajes de `routes/usuarios.js:69-93` (p. ej. `"El nombre contiene caracteres no permitidos"`, `"El password es obligatorio: debe tener al menos 6 caracteres"`, `"El genero no puede estar vacio: [MASCULINO, FEMENINO, PREFIERO NO DECIR]"`, `"La fecha no es valida"`) | `middlewares/validar-campos.js:28` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/usuarios.js:155` |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit Exceeded | "Solo puedes cambiar tu nombre y URL una vez cada 30 días" (`retry_after` en segundos) | `controllers/usuarios.js:173-176` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al procesar la solicitud" (incluye `E11000` de `url` tras 3 reintentos y errores de validación de Mongoose) | `controllers/usuarios.js:235` |

### Notas para el Frontend
- La respuesta usa `_id` (no `uid`).
- **La `url` cambia** solo si `nombre_completo` cambia de verdad. Si cambia, la respuesta trae la nueva `url`: actualiza tu estado y la navegación al perfil.
- **Cooldown:** solo se puede cambiar el nombre una vez cada 30 días desde `nombre_completo_changed_at`. El primer cambio tras el registro no tiene cooldown (`controllers/usuarios.js:165-171`). `retry_after` indica cuándo.
- Para actualizar `lugar_radicacion` el controlador hace `$set` sobre el objeto completo: **envía el subdocumento entero** para no perder campos. (**[REQUIERE VERIFICACIÓN MANUAL]** — derivado del `$set` de `controllers/usuarios.js:217`.)
- Igual que `nombre_completo`: si envías solo `nombre_completo.nombre`, el `$set` reemplaza el objeto y puede eliminar el `apellido` almacenado (**[REQUIERE VERIFICACIÓN MANUAL]**, mismo mecanismo).
- ⚠ **Cambio de contraseña sin contraseña actual:** cualquier sesión válida puede cambiar la contraseña sin verificar la anterior (`controllers/usuarios.js:140-143`). Señalado para el auditor de seguridad.
- ⚠ Política de contraseña inconsistente: aquí solo se exige longitud 8; el registro exige complejidad (`routes/usuarios.js:51-52`).
- No revoca otras sesiones al cambiar la contraseña.

---

## [DELETE] /api/usuarios/delete

**Descripción:** Eliminación de la cuenta (soft delete) en una transacción de MongoDB: marca al usuario con `estatus: 4`, `isDeleted: true`, y elimina lógicamente sus posteos, seguimientos, likes, notificaciones, favoritos, comentarios y reportes relacionados. Después limpia las cookies de la sesión actual. Un cron posterior hace el borrado físico (**[REQUIERE VERIFICACIÓN MANUAL]**: el cron no se revisó en esta corrida).
**Archivo de ruta:** `routes/usuarios.js:97`
**Controlador:** `controllers/usuarios.js` — `usuariosDelete` (línea 243) → `helpers/cerrar-sesion-cookies.js` (línea 4)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`) **y** cookie `refreshToken` (sin ella responde 403).
- Cadena de middlewares: `verificarTokenSesion` → `usuariosDelete`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
Ninguno (cookies `accessToken` y `refreshToken`).

### Ejemplo de request
```http
DELETE /api/usuarios/delete
Cookie: accessToken=…; refreshToken=…
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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido - usuario no existe" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,27,45` |
| 403 | `FORBIDDEN` | Forbidden | "No hay refresh token" (falta la cookie `refreshToken`) | `controllers/usuarios.js:259` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/usuarios.js:271` |
| 400 | `BAD_REQUEST` | Bad Request | "La cuenta ya fue eliminada previamente" (casi inalcanzable: `verificarTokenSesion` ya rechaza `estatus: 4`) | `controllers/usuarios.js:278` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un problema al eliminar la cuenta de usuario. Por favor, intenta nuevamente." (aborta la transacción) | `controllers/usuarios.js:439` |

### Notas para el Frontend
- Requiere **ambas** cookies. Si el access token expiró, llama primero a `POST /api/auth/refresh`.
- Tras el éxito, redirige al inicio o al login: las cookies ya se borraron.
- Los `accessToken` de **otros dispositivos** dejan de servir (el estatus 4 los rechaza), pero solo se borra el `UserToken` de este dispositivo.
- Operación destructiva: pide confirmación explícita en la UI.

---

## [GET] /api/usuarios/registrados/nuevos-usuarios-registrados

**Descripción:** Devuelve hasta 3 usuarios recién registrados (estatus 1 y correo verificado), excluyendo al usuario autenticado, con `isFollowing` respecto al usuario autenticado.
**Archivo de ruta:** `routes/usuarios.js:102`
**Controlador:** `controllers/usuarios.js` — `nuevosUsuariosRegistrados` (línea 449)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`).
- Cadena de middlewares: `verificarTokenSesion` → `nuevosUsuariosRegistrados`.
- Rate limiter: **ninguno**.

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
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener los nuevos usuarios" | `controllers/usuarios.js:516` |

### Notas para el Frontend
- Lista de máximo 3 elementos, ordenada por `fecha_registro` descendente. No es paginada.
- Usa `_id` como clave; `imagen_perfil.secure_url` viene en la respuesta.
