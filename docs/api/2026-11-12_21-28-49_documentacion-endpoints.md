# Delta de documentación — 2026-11-12 21:28:49

**Base de comparación:** corrida 2026-10-27 (README + archivos de dominio) + deltas `2026-11-10_12-12-40_documentacion-endpoints.md` y la revisión «2026-11-10 (cierre de hallazgo)» del `README.md`.
**Rango de código cubierto:** commits fusionados a `desarrollo` después de la corrida de 2026-11-10:
- `66dea8b` — feat(usuarios): endpoint `PUT /api/usuarios/password` para cambiar la contraseña (E1b) — 2026-11-12 15:12.
- `138afe1` — feat(usuarios): borrar la cuenta exige la contraseña actual y elimina sus sesiones (E1c) — 2026-11-12 15:18.
Ambos entran vía merge `a166082` (Feat-ola2). El diff del merge contra su primer padre toca, en superficie de API: `routes/usuarios.js`, `controllers/usuarios.js`, `middlewares/rate-limiter.js` (+ `test/cambio-password.test.js`, nuevo).

**Alcance:** 1 endpoint nuevo, 1 endpoint modificado. 0 eliminados. Documentación tocada: `usuarios.md` (reescrituras + re-baseline de citas), `README.md` (encabezado, log de revisiones, índice, tabla de limiters, tabla de endpoints renumerada, totales, hallazgos H13/H14). `auth.md` y el resto de dominios: **sin cambios** (verificado: el diff del merge no toca otras rutas ni controladores).

**No verificado en ejecución:** no se levantó el servidor (requiere MongoDB/SMTP/Cloudinary). Los ejemplos nuevos son **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**, excepto los comportamientos de cableado de la cadena de middlewares, que están verificados por las pruebas de `test/cambio-password.test.js` (archivo nuevo del merge).

---

## 1. NUEVO — `PUT /api/usuarios/password` (E1b)

Documento: nueva sección en `usuarios.md` entre `PUT /api/usuarios/update` y `DELETE /api/usuarios/delete`.

| Aspecto | Fuente |
|---|---|
| Ruta y cadena de middlewares | `routes/usuarios.js:103-120`: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `passwordUsuarioLimiter` → checks de `passwordActual`/`passwordNueva` → `validarCampos` → `usuariosPasswordPut` |
| Controlador | `controllers/usuarios.js:244-307` (`usuariosPasswordPut`) |
| Exige cookie `refreshToken` | `controllers/usuarios.js:247,251-253` → 403 `FORBIDDEN` "No hay refresh token" si falta |
| Contraseña actual incorrecta | `controllers/usuarios.js:260-262` → 401 `INVALID_CURRENT_PASSWORD` "La contraseña actual es incorrecta" (`errors/error-classes.js:33-37`: HTTP 401, code `INVALID_CURRENT_PASSWORD`, title `Authentication Required`) |
| Nueva igual a la actual | `controllers/usuarios.js:264-269` → 422 `VALIDATION_FAILED` con `errors: [{ field: "passwordNueva", code: "SAME_AS_CURRENT" }]` |
| Transacción: hash nuevo + borrado de demás sesiones | `controllers/usuarios.js:277-294`: `withTransaction` hace `Usuario.updateOne` (password, `intentos_login: 0`, `fecha_actualizacion`) y `UserToken.deleteMany({ userId, token: { $ne: hashToken(refreshToken) } })` |
| Respuesta de éxito | `controllers/usuarios.js:296-299`: `{ success, msg: "Contraseña actualizada. Se cerraron las demás sesiones.", data: { sesionesCerradas: <deletedCount> } }` |
| Validación del body | `routes/usuarios.js:109-118`: `passwordActual` isString/notEmpty/max 128 (sin chequeo de complejidad); `passwordNueva` isString/8–128 + regex de complejidad del registro |
| Limiter nuevo | `middlewares/rate-limiter.js:351-359`: `passwordUsuarioLimiter` 15 min / 5, clave usuario, código `PASSWORD_BLOCKED`, comentario explícito sobre el anti-guessing (E1b) |
| Cableado verificado | `test/cambio-password.test.js:48-54` (orden IP → sesión → limiter) y `:77-97` (429 `PASSWORD_BLOCKED` al 6.º intento, cubo por usuario) |

Nota que no incrementa `tokenVersion` (verificado: no hay tal línea en el controlador): los access tokens de otros dispositivos siguen válidos hasta `exp`; el front debe distinguir `INVALID_CURRENT_PASSWORD` de un 401 de sesión por `code` para no disparar el refresh.

## 2. MODIFICADO — `DELETE /api/usuarios/delete` (E1c)

Documento: sección reescrita en `usuarios.md`.

Cambios respecto a la documentación anterior:

1. **Exige `passwordActual`** (`routes/usuarios.js:129-132`: isString/notEmpty/max 128; el controlador lo compara en `controllers/usuarios.js:353-355` **antes** de tocar nada, abortando la transacción si falla → 401 `INVALID_CURRENT_PASSWORD`). Antes no pedía body. Cableado del limiter estricto verificado en `test/cambio-password.test.js:20-27` (orden: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `cuentaUsuarioLimiter` → `passwordUsuarioLimiter`).
2. **Borra todas las sesiones del usuario dentro de la transacción**: `controllers/usuarios.js:484-486` (`UserToken.deleteMany({ userId }, { session })`). Antes solo se eliminaba la fila del refresh actual (vía `cerrarSesionCookies`) y las demás quedaban huérfanas hasta el TTL.
3. **Limiter `passwordUsuarioLimiter`** agregado a la cadena; el cubo (5/15 min por usuario) es la misma instancia que la de `PUT /password`, así que los intentos de ambos endpoints se suman.
4. Tabla de errores re-citada sobre el código actual: 403 `controllers/usuarios.js:329`; 404 `:341`; 400 `:348`; 401 `INVALID_CURRENT_PASSWORD` `:353-355`; 500 `:520`. La fila de 401 `INVALID_CURRENT_PASSWORD` es nueva.

## 3. Re-baseline de citas de línea (`usuarios.md`)

La inserción de la ruta nueva corrió `routes/usuarios.js` (+35 líneas desde la línea 68) y `controllers/usuarios.js` (+~80 líneas desde la línea 239). Citas actualizadas en `usuarios.md` (todos los cambios provienen solo del desplazamiento; ningún comportamiento de estos endpoints cambió en el merge):

- Montaje: `models/server.js:124` → `models/server.js:125`.
- `GET /:url`: ruta `:18` → `:19`; controlador `usuarioGet` `:33` → `:34`.
- `POST /api/usuarios`: ruta `:30` → `:33`; controlador `:76` → `:77`; checks `:32-36/:38-42/:44-46/:48-52/:32-52` → `:35-39/:41-45/:47-49/:51-55/:35-59`; `registroLimiter :86` → `:173-182`; controladores `:79/:117/:118-121/:123/:118-123` → `:80/:118/:119-122/:124/:119-124`.
- `PUT /api/usuarios/update`: ruta `:65` → `:68`; controlador `:131` → `:132`; checks `:69-74/:76-81/:83/:85/:87/:89/:91/:93/:69-93` → `:74-79/:81-86/:88/:90/:92/:94/:96/:98/:74-98`; `ALLOWED_FIELDS :25-30` → `:26-31`; errores `:155/:173-176/:235` → `:156/:174-177/:236`; notas `:165-171/:217/:140-143/:51-52` → `:170-177/:218/:141-144/:53-54`.
- `DELETE /api/usuarios/delete` y `GET /registrados/nuevos-usuarios-registrados`: re-citados al reescribir (ruta `:97` → `:122` y `:102` → `:136`; controladores `:243` → `:313` y `:449` → `:530`; 500 en `:516` → `:597`).

En la sección de notas de `PUT /update` se añadió el apuntador al nuevo flujo recomendado (`PUT /password`) y se anotó que H13 sigue vigente para `PUT /update`.

## 4. `README.md`

- Encabezado: total 80 → **81** (red social 56 · panel 25).
- Log de revisiones: agregado bloque `> **Revisión 2026-11-12 (step-up de contraseña, E1b/E1c).**` (más reciente al final).
- Índice de archivos: `usuarios.md` 5 → 6 endpoints, descripción ampliada.
- Tabla de limiters: fila nueva `passwordUsuarioLimiter` (`:354-359`, 15 min/5, usuario, `PASSWORD_BLOCKED`) con nota de cubo compartido con `DELETE /delete`.
- Tabla de endpoints: fila nueva **16** `PUT /api/usuarios/password`; `DELETE /api/usuarios/delete` ahora es #17 con auth "Usuario + cookie refresh + contraseña" y el limiter nuevo en su columna; renumeración +1 de los endpoints 16–80 antiguos (ahora 17–81).
- Totales: filas 52, 446 y 454/456 actualizadas a 81; nota explícita de que `inventario-endpoints.json` ya lista los 81 métodos/rutas (entradas agregadas por el merge) pero su campo `"total"` sigue en 80 (corrección pendiente del agente `sincronizador`).
- H13: anotado **MITIGADO PARCIALMENTE (2026-11-12)** con cita nueva `controllers/usuarios.js:141-144` + `routes/usuarios.js:103-120`.
- H14: anotado con las reglas completas del nuevo endpoint (`routes/usuarios.js:53-54,88,114-118`); la inconsistencia persiste en `PUT /update`, reestablecer y panel.
- Nota de método final: 80 → 81.

## 5. Verificaciones cruzadas realizadas

- `git diff --name-status a166082^1 a166082`: solo `routes/usuarios.js`, `controllers/usuarios.js`, `middlewares/rate-limiter.js` cambian la superficie de API (el resto del diff es documentación/specs/test). Por eso `auth.md` y los demás dominios no se tocaron.
- `inventario-endpoints.json`: contiene `PUT /api/usuarios/password` y la entrada actualizada de `DELETE /api/usuarios/delete` (coincide con lo documentado aquí), aunque su `total` dice 80.
- Clase de error: `InvalidCurrentPasswordError` (`errors/error-classes.js:33-37`) ya estaba en la tabla de clases del README (fila `:33`); no requirió cambio en esa tabla.

## 6. Pendientes / señales para otras corridas

- `inventario-endpoints.json` `"total": 80` → 81: carril del agente `sincronizador` (fuera de alcance de este agente).
- `PUT /api/usuarios/update` sigue aceptando `password` sin contraseña actual (H13 parcial): señal ya registrada para el auditor de seguridad.
- El mensaje de error handler "5MB" de `LIMIT_FILE_SIZE` sigue sin tocar (quirk conocido de AGENTS.md, sin cambios en este merge).
