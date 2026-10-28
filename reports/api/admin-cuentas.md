# Panel de administración — cuentas de administrador (`/api/v1/admin/cuentas`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `admin/routes/index.js:111-132`. Controlador: `admin/controllers/cuentas.js`. Modelo: `admin/models/Admin.js`.

**Alta sin registro abierto:** la primera cuenta se crea por CLI (`admin/scripts/crear-admin.js`). Las siguientes, con este endpoint. Cada cuenta nueva nace con contraseña temporal de un solo uso, que se devuelve **una vez**, y debe cambiarla y configurar TOTP antes de operar.

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

**Permisos de la cadena:** `SUPERADMIN` tiene `*` (todos). `MODERADOR` no tiene ningún permiso de `cuentas:*` (`admin/helpers/permisos.js:44-58`).

---

## [POST] /api/v1/admin/cuentas

**Descripción:** Crea una cuenta de administrador con rol y permisos por defecto del rol. Devuelve la contraseña temporal una sola vez.
**Archivo de ruta:** `admin/routes/index.js:111`
**Controlador:** `admin/controllers/cuentas.js` — `crearCuentaAdmin` (línea 50)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa (`adminAccessToken`).
- Permiso: **`cuentas:crear`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('cuentas:crear')` → `check('correo').isEmail()` → `check('rol').notEmpty().isIn(['SUPERADMIN','MODERADOR'])` → `validarCampos` → `crearCuentaAdmin`.
- Rate limiter: **ninguno** (los limiters de moderación e influencers no aplican aquí).

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `correo` | string | Sí | `isEmail()`; `"El correo es obligatorio y debe ser válido"` → 422. Se guarda en minúsculas y sin espacios |
| body | `rol` | string (enum) | Sí | `notEmpty()` + `isIn(['SUPERADMIN','MODERADOR'])`; `"El rol es obligatorio: [SUPERADMIN, MODERADOR]"` → 422 |

### Ejemplo de request
```http
POST /api/v1/admin/cuentas
Content-Type: application/json
Cookie: adminAccessToken=…
Origin: https://admin.tlaxapp.example

{ "correo": "moderadora@tlaxapp.example", "rol": "MODERADOR" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: **`201`**
```json
{
  "success": true,
  "msg": "Cuenta de administrador creada. Entrega la contraseña temporal por un canal seguro; no se volverá a mostrar.",
  "data": {
    "admin": {
      "uid": "6653b1…",
      "correo": "moderadora@tlaxapp.example",
      "rol": "MODERADOR",
      "permisos": ["moderacion:leer", "moderacion:resolver", "moderacion:descartar", "moderacion:recategorizar", "posteos:ocultar", "posteos:restaurar"],
      "activo": true,
      "password_temporal": true,
      "totp_enabled": false
    },
    "password_temporal": "Xk7m-Qp2r-Tz9w",
    "instrucciones": "La cuenta debe: 1) iniciar sesión, 2) cambiar la contraseña temporal y 3) configurar TOTP antes de operar el panel."
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: cuentas:crear" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El correo es obligatorio y debe ser válido" / "El rol es obligatorio: [SUPERADMIN, MODERADOR]" | `admin/routes/index.js:114-115` + `middlewares/validar-campos.js:28` |
| 403 | `FORBIDDEN` | Forbidden | "Rol no válido. Roles disponibles: SUPERADMIN, MODERADOR" (defensivo; el validador lo cubre antes) | `admin/controllers/cuentas.js:57` |
| 409 | `CONFLICT` | Conflict | "El correo ya está registrado en el panel" (también por índice único en carrera) | `admin/controllers/cuentas.js:62,99` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` | `admin/controllers/cuentas.js:102` |

### Notas para el Frontend
- **La contraseña temporal aparece una sola vez.** Muéstrala con aviso de copiarla y no la guardes en estado persistente.
- Fase 1: no se envía correo; quien crea la cuenta debe entregar la contraseña por otro canal.
- El correo se normaliza a minúsculas: no distingue mayúsculas.
- No hay límite de peticiones en este endpoint.

---

## [GET] /api/v1/admin/cuentas

**Descripción:** Lista todas las cuentas de administrador (sin secretos), ordenadas por fecha de creación ascendente. **No está paginada.**
**Archivo de ruta:** `admin/routes/index.js:120`
**Controlador:** `admin/controllers/cuentas.js` — `listarCuentasAdmin` (línea 109)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`cuentas:leer`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('cuentas:leer')` → `listarCuentasAdmin`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/v1/admin/cuentas
Cookie: adminAccessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Cuentas de administrador obtenidas",
  "data": {
    "admins": [
      {
        "uid": "6652a1…", "correo": "admin@tlaxapp.example", "rol": "SUPERADMIN", "permisos": ["*"],
        "activo": true, "totp_enabled": true, "password_temporal": false,
        "ultimo_inicio_sesion": "2026-10-27T19:10:34.000Z",
        "createdAt": "2026-10-01T10:00:00.000Z", "updatedAt": "2026-10-27T19:10:34.000Z"
      }
    ],
    "total": 1
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: cuentas:leer" | `admin/middlewares/verificar-permiso.js:26` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` | `admin/controllers/cuentas.js:129` |

### Notas para el Frontend
- No hay paginación: si crece el número de cuentas habrá que añadirla.
- No incluye secretos (`password`, `totp_secret`, `backup_codes`).

---

## [PATCH] /api/v1/admin/cuentas/:id

**Descripción:** Activa o desactiva una cuenta de administrador. Desactivar **revoca de inmediato** todas sus sesiones (incrementa `tokenVersion` y borra `AdminToken`). Un administrador no puede cambiar su propio estado.
**Archivo de ruta:** `admin/routes/index.js:126`
**Controlador:** `admin/controllers/cuentas.js` — `cambiarEstadoCuentaAdmin` (línea 136)

### Autenticación y permisos
- Requiere token: **Sí**, sesión completa.
- Permiso: **`cuentas:desactivar`**.
- Cadena de middlewares: `verificarSesionAdmin` → `verificarPermisoAdmin('cuentas:desactivar')` → `check('id').isMongoId()` → `check('activo').exists().isBoolean()` → `validarCampos` → `cambiarEstadoCuentaAdmin`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `id` | ObjectId | Sí | `isMongoId()`; `"El ID del administrador no es válido"` → 422 |
| body | `activo` | boolean | Sí | `exists()` + `isBoolean()`; `"El campo activo es obligatorio y debe ser boolean"` → 422. **Ver nota: acepta strings** |

### Ejemplo de request
```http
PATCH /api/v1/admin/cuentas/6653b1f0c2a3b4c5d6e7f8a9
Content-Type: application/json
Cookie: adminAccessToken=…
Origin: https://admin.tlaxapp.example

{ "activo": false }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Cuenta de administrador desactivada",
  "data": {
    "admin": {
      "uid": "6653b1f0c2a3b4c5d6e7f8a9", "correo": "moderadora@tlaxapp.example", "rol": "MODERADOR",
      "permisos": ["moderacion:leer"], "activo": false, "totp_enabled": true, "password_temporal": false
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay sesión del panel en la petición" / "Sesión del panel no válida" | `admin/middlewares/verificar-sesion.js:21,28` |
| 403 | `FORBIDDEN` | Forbidden | "No tienes el permiso requerido: cuentas:desactivar" | `admin/middlewares/verificar-permiso.js:26` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El ID del administrador no es válido" / "El campo activo es obligatorio y debe ser boolean" | `admin/routes/index.js:129-130` + `middlewares/validar-campos.js:28` |
| 409 | `CONFLICT` | Conflict | "No puedes cambiar el estado de tu propia cuenta" | `admin/controllers/cuentas.js:142` |
| 404 | `NOT_FOUND` | Resource Not Found | "Cuenta de administrador no encontrada" | `admin/controllers/cuentas.js:146` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | `error.message` | `admin/controllers/cuentas.js:175` |

### Notas para el Frontend
- ⚠ **Enviar `activo` como booleano JSON real.** El validador acepta `"false"` (string) porque `isBoolean` acepta strings. El controlador hace `Boolean(activo)`, y `Boolean("false") === true`: **enviar `{"activo": "false"}` activa la cuenta** en lugar de desactivarla. Verificado con `validator` 13.15.35 y con `Boolean("false")`.
- Desactivar invalida sesiones al instante; el administrador afectado recibirá 401/403 en su próxima petición.
- El estado de la cuenta propia no se puede cambiar (409).
- `activo` a `true` en una cuenta ya activa devuelve 200 sin cambios de fondo.
