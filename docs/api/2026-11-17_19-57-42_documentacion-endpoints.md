# Delta de documentación de endpoints — 2026-11-17 (sincronizador: sesiones, logout, usuarios/update)

**Generado:** 2026-11-17 19:57:42
**Alcance:** solo el delta indicado en `engineering/working/postman-sync/2026-11-17_delta-para-agente-api.md`. No se re-documentaron dominios sin cambios.
**Base de comparación:** `docs/api/2026-11-17_19-29-53_documentacion-endpoints.md` (corrida anterior del mismo día, que ya documentaba los 3 endpoints de sesiones).
**Archivos de dominio editados:** `docs/api/auth.md`, `docs/api/README.md` (línea de revisión). `docs/api/usuarios.md` verificado sin cambios.
**Endpoints nuevos:** 0. **Eliminados:** 0. **Con cambio de contrato corregido en esta corrida:** 0 (el contrato ya estaba documentado; se corrigió solo el texto de un error).

---

## 1. Endpoints verificados

### 1.1 `GET /api/auth/sesiones`

- Ruta: `routes/auth.js:104-107`. Cadena: `floodLecturaIpLimiter` → `verificarTokenSesion` → `sesionesUsuarioLimiter` → `listarSesiones`.
- Controlador: `controllers/sesiones.js:26-47`. Proyección `sessionId deviceName paisUltimo ipUltima lastUsed creadaEn` (`:30`); salida de 6 campos (`:34-41`); `ipUltima` pasa por `enmascararIp` (`:38`); `responder(res, { data })` sin `msg` (`:43`, `helpers/responder.js:16`).
- Limiters: `floodLecturaIpLimiter` 15 min/300, `FLOOD_BLOCKED` (`middlewares/rate-limiter.js:248-257`, mensaje `:251-255`); `sesionesUsuarioLimiter` 15 min/30, `SESIONES_BLOCKED` (`:364-369`, mensaje `:367`).
- Estado: **sin drift**. Se corrigió únicamente la nota de procedencia del ejemplo (ahora indica la ejecución del 2026-11-17).

### 1.2 `DELETE /api/auth/sesiones/otras`

- Ruta: `routes/auth.js:110-119`, declarada antes de `/sesiones/:sessionId` (comentario `:108`). Cadena: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `sesionesUsuarioLimiter` → `passwordUsuarioLimiter` → `check('passwordActual')` (`:114-117`) → `validarCampos` → `cerrarOtrasSesiones`.
- Controlador: `controllers/sesiones.js:80-103`. Comparación bcrypt (`:87`) → `InvalidCurrentPasswordError` 401 (`:88`); `UserToken.deleteMany({ userId, sessionId: { $ne: req.sessionId } })` (`:91-94`); `data.cerradas` (`:98`). No incrementa `tokenVersion` (comentario `:78`).
- Limiters: `passwordUsuarioLimiter` 15 min/5, `PASSWORD_BLOCKED` (`middlewares/rate-limiter.js:354-359`); compartido con `routes/usuarios.js:106` y `:127`.
- **Drift corregido (`auth.md`):** el 422 `VALIDATION_FAILED` decía `"La solicitud contiene N error(es) de validación"`. El código lanza `new ValidationError('La solicitud contiene errores de validación', errors)` en `middlewares/validar-campos.js:28`, sin número de errores. Confirmado en ejecución: el stack de la prueba `sin passwordActual → 422` muestra `ValidationError: La solicitud contiene errores de validación` en `validar-campos.js:28`.

### 1.3 `DELETE /api/auth/sesiones/:sessionId`

- Ruta: `routes/auth.js:120-125`. Cadena: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `sesionesUsuarioLimiter` → `check('sessionId').isUUID(4)` (`:123`) → `validarCampos` → `cerrarSesion`.
- Controlador: `controllers/sesiones.js:52-74`. Si `sessionId === req.sessionId` → `cerrarSesionCookies` (`:56-59`, `helpers/cerrar-sesion-cookies.js:17-27`); si no → `UserToken.deleteOne({ sessionId, userId, expiraEn > now })` (`:61-65`) y `NotFoundError('Sesión no encontrada')` si `deletedCount` es 0 (`:66-68`).
- **Drift corregido (`auth.md`):** la fila 422 no declaraba el `detail`. Ahora consta `"La solicitud contiene errores de validación"` (`validar-campos.js:28`), con `errors: [{ field: "sessionId", message: "El id de sesión no es válido" }]`.
- Estado: sin otro drift.

### 1.4 `POST /api/auth/logout`

- Ruta: `routes/auth.js:94-96` (comentario `:95`: "no exige sesión ni cookie refreshToken"). Sin middlewares ni limiter.
- Controlador: `controllers/auth.js:554-566`. Identificación por `sesionIdentificable(accessToken)` ?? `sesionIdentificable(refreshToken)` (`:556-557`); firma HS256 y expiración ignorada (`:542-553`, `:26`). Siempre `cerrarSesionCookies` (`:560`, borra fila por `sessionId` + `userId` y limpia ambas cookies, `helpers/cerrar-sesion-cookies.js:17-23`) y `200` `{ msg: 'Sesión cerrada' }` (`controllers/auth.js:561`).
- Error: solo si `cerrarSesionCookies` lanza (`helpers/cerrar-sesion-cookies.js:25`) → `InternalError(error.message)` (`controllers/auth.js:564`) → 500 con `detail` `"Hubo un error al cerrar la sesión: <mensaje>"`.
- Pruebas: `test/logout.test.js` pasa en esta corrida (casos: sin cookies → 200; firma inválida → 200 sin borrar; sin `sid` → no borra; fallo de BD → 500, entre otros).
- Estado: **sin drift**. La sección ya describía el comportamiento de 9730d93 (sin cookie obligatoria, siempre 200).

### 1.5 `PUT /api/usuarios/update`

- Ruta: `routes/usuarios.js:68-99`. Cadena: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `cuentaUsuarioLimiter` → validadores opcionales → `validarCampos` → `usuariosPut`. No hay validador de `password` (comentario `:87`).
- Controlador: `controllers/usuarios.js:132-141` (rechazo) → `ValidationError` 422 `USE_PASSWORD_ENDPOINT` si `req.body?.password !== undefined` (`:136`), antes de escribir nada. `ValidationError` usa `code` `VALIDATION_FAILED` (`errors/error-classes.js:126`) y el `extras.errors` se propaga en el body (`errors/app-error.js:49`).
- Pruebas: `test/cambio-password.test.js` bloque "PUT /api/usuarios/update rechaza password (E1b2)" (9/9 pasan en esta corrida): `password` no vacío y vacío → 422 `USE_PASSWORD_ENDPOINT` sin tocar la BD.
- Estado: **sin drift**. La sección de `usuarios.md` (líneas 154-241) ya coincide con el código.

---

## 2. Drift adicional encontrado (fuera del brief)

Ninguno de contrato. Hallazgo de seguridad para el agente `security-auditor` (no auditado aquí):

- **`detail` de errores 500 de `AppError` visible en producción:** `middlewares/error-handler.js:36-39` devuelve `err.detail` para cualquier `AppError`, incluido `InternalError`. Por eso el 500 de `POST /api/auth/logout` (`controllers/auth.js:564`) expone el mensaje interno de la BD también fuera de desarrollo. Ya está anotado como ⚠ en `auth.md` (patrón H8). No se corrigió (es código, fuera de alcance).

---

## 3. [REQUIERE VERIFICACIÓN MANUAL]

- Respuesta real del 500 de `POST /api/auth/logout` en producción (`NODE_ENV`): el análisis del código indica que el mensaje interno sale al cliente; no se verificó contra el despliegue.
- `PUT /api/usuarios/update` sin body JSON: el código responde 200 (`controllers/usuarios.js:143`, `req.body ?? {}`); el dato se toma del código, no de una ejecución HTTP real.
- Ejemplos de `GET /api/auth/sesiones` y `DELETE /api/auth/sesiones/otras`: la forma de las respuestas está verificada por aserciones de `test/integration/sesiones-activas.test.js`, pero los valores (`sessionId`, IPs, `cerradas`) son ilustrativos.

---

## 4. Pruebas ejecutadas en esta corrida

| Comando | Resultado |
|---|---|
| `node --test test/integration/sesiones-activas.test.js test/logout.test.js` | `tests 20`, `pass 20`, `fail 0` |
| `node --test test/cambio-password.test.js` | `tests 9`, `pass 9`, `fail 0` |

Sin fallos (no hay output de error que reportar). Las trazas `console.error` impresas por las pruebas corresponden a casos negativos esperados (401 `INVALID_CURRENT_PASSWORD`, 422 de validación, 500 simulado de logout).

---

## 5. Archivos escritos en esta corrida

- `docs/api/auth.md` (3 ediciones: 422 de `/sesiones/otras`, 422 de `/sesiones/:sessionId`, nota de procedencia del ejemplo de `GET /sesiones`).
- `docs/api/README.md` (nueva línea de revisión `2026-11-17 (delta sincronizador: sesiones, logout, usuarios/update)`).
- `docs/api/2026-11-17_19-57-42_documentacion-endpoints.md` (este archivo).

Sin cambios: `docs/api/usuarios.md`, `docs/api/inventario-endpoints.json`, `postman/`, `engineering/`, código. Los cambios previos sin commitear de `docs/api/` se conservaron.
