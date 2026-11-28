# Delta de documentación — 2026-11-13 12:15:58

**Base de comparación:** `usuarios.md` tal como quedó tras la revisión de 2026-11-12 (`2026-11-12_21-28-49_documentacion-endpoints.md`) y el `README.md` de esa misma fecha.
**Código contrastado:** `routes/usuarios.js`, `controllers/usuarios.js`, `middlewares/rate-limiter.js`, `errors/error-classes.js`, `helpers/cerrar-sesion-cookies.js`, `models/server.js` (montaje), `test/cambio-password.test.js`, y `node_modules/.pnpm/body-parser@2.3.0_supports-color@5.5.0/node_modules/body-parser/lib/read.js`.

**Alcance:** 1 endpoint con cambio de contrato (`PUT /api/usuarios/update`), 0 nuevos, 0 eliminados. Documentación tocada: `usuarios.md` (secciones de `PUT /update`, `PUT /password`, `DELETE /delete`, `GET /registrados/...` y citas de línea) y `README.md` (encabezado, log de revisiones, H13, H14, I11 y verificación manual). Los demás dominios no se tocaron.

**No verificado en ejecución:** no se levantó el servidor (requiere MongoDB, SMTP y Cloudinary). Los ejemplos no cambiaron y siguen marcados como **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**. Lo verificado es el cableado de rutas y limiters (lectura de código y `test/cambio-password.test.js`).

---

## 1. MODIFICADO (contrato) — `PUT /api/usuarios/update`

| Aspecto | Antes (documentado) | Ahora (código) | Fuente |
|---|---|---|---|
| Campo `password` | Aceptado (`optional`, `trim`, `isLength({min:8})`), mensaje "debe tener al menos 6 caracteres" | **Rechazado** con 422 `VALIDATION_FAILED`, `errors[0] = { field: "password", code: "USE_PASSWORD_ENDPOINT", message: "Usa PUT /api/usuarios/password con { passwordActual, passwordNueva }" }`. Cualquier valor distinto de `undefined` (incluidos `""` y `null`). No escribe nada | `controllers/usuarios.js:136-141`; ya no hay validador de `password` en `routes/usuarios.js:68-99` |
| Campos escritos | `nombre_completo`, `lugar_radicacion`, `genero`, `fecha_nacimiento`, `password` | `nombre_completo`, `lugar_radicacion`, `genero`, `fecha_nacimiento` (whitelist) | `controllers/usuarios.js:26-31` |
| Descripción | Incluía "contraseña" | Excluye la contraseña y remite a `PUT /password` | `controllers/usuarios.js:136-141` |
| Cooldown de nombre | Citas `:170-177` | Mismo comportamiento: 30 días, `RateLimitError` 429 `RATE_LIMIT_EXCEEDED` con `retry_after`. Citas actualizadas a `:174-181` | `controllers/usuarios.js:174-181` |
| Regla de `url` | "cambia solo si nombre_completo cambia de verdad" | Se añade precisión: la comparación es por `nombre` y `apellido` exactos; si coinciden no hay cooldown, ni `url` nueva, ni `url_history` | `controllers/usuarios.js:165` |
| Respuesta 200 | `msg: "Usuario actualizado"`, `data.usuario` | Sin cambio (campos: `_id`, `nombre_completo`, `lugar_radicacion`, `correo`, `url`, `genero`, `fecha_nacimiento`, `nombre_completo_changed_at` con `null` si no existe) | `controllers/usuarios.js:225-234` |
| Errores | 404 `:156`, 429 `:174-177`, 500 `:236`, 422 con mensaje de password | 404 `:160`, 429 `:178-181`, 500 `:240`; se quita el mensaje de password y se añade la fila 422 `USE_PASSWORD_ENDPOINT` (`:136-141`) | `controllers/usuarios.js` |
| Notas H13 / política de contraseña / "no revoca sesiones" | Describían el hueco de `password` en este endpoint | Eliminadas: el hueco ya no existe aquí. Se indica que el cambio va por `PUT /password` | `controllers/usuarios.js:136-141` |

Nuevo punto en la tabla de errores (marcado **[REQUIERE VERIFICACIÓN MANUAL]**): petición sin body JSON → 500 `INTERNAL_ERROR`. Motivo: body-parser 2.3.0 pone `req.body = undefined` cuando no hay cuerpo JSON (`read.js:47`) y el desestructurado `const { _id, correo, ...resto } = req.body;` (`controllers/usuarios.js:143`) lanza `TypeError`, que el `catch` convierte en `InternalError` (`controllers/usuarios.js:240`). Derivado del código, no ejecutado.

## 2. VERIFICADO SIN CAMBIO DE CONTRATO — `PUT /api/usuarios/password`

Contrastado contra `routes/usuarios.js:102-119` y `controllers/usuarios.js:248-311`. El contrato no cambió; se corrigieron las citas de línea y se completó la descripción.

| Tema | Cambio en `usuarios.md` | Cita actual |
|---|---|---|
| Ruta / controlador | `routes/usuarios.js:103` → `:102`; `usuariosPasswordPut` `:244` → `:248` | `routes/usuarios.js:102`, `controllers/usuarios.js:248` |
| Reset de `intentos_login` | **Añadido** a la descripción: `Usuario.updateOne` pone `password`, `intentos_login: 0` y `fecha_actualizacion` | `controllers/usuarios.js:284-289` |
| 403 sin cookie `refreshToken` | `:252` → `:256` | `controllers/usuarios.js:256` |
| 404 usuario | `:257` → `:261` | `controllers/usuarios.js:261` |
| 401 `INVALID_CURRENT_PASSWORD` | `:261` → `:265` | `controllers/usuarios.js:265` |
| 422 `SAME_AS_CURRENT` | `:264-269` → `:268-272` | `controllers/usuarios.js:268-272` |
| Transacción | `:277-294` → `:284-295` | `controllers/usuarios.js:284-295` |
| Respuesta `sesionesCerradas` | `:296-299` / `:286-290,298` → `:300-303` / `:290-294,302` | `controllers/usuarios.js:300-303` |
| 500 | `:305` → `:309` | `controllers/usuarios.js:309` |
| Validación de `passwordNueva` | `routes/usuarios.js:114-118` → `:113-117` | `routes/usuarios.js:113-117` |
| Validación de `passwordActual` | `routes/usuarios.js:109-112` → `:108-111` | `routes/usuarios.js:108-111` |

Limiter `passwordUsuarioLimiter` (15 min / 5, clave usuario, `PASSWORD_BLOCKED`): confirmado en `middlewares/rate-limiter.js:354-359`. Cableado (IP → sesión → limiter) confirmado por `test/cambio-password.test.js:48-54`.

## 3. VERIFICADO SIN CAMBIO DE CONTRATO — `DELETE /api/usuarios/delete`

Contrastado contra `routes/usuarios.js:121-133` y `controllers/usuarios.js:317-531`. El contrato (step-up con `passwordActual`, borrado de `UserToken` dentro de la transacción, cookies vía `cerrarSesionCookies`) ya estaba documentado. Se re-citaron las líneas:

| Tema | Antes | Ahora | Cita actual |
|---|---|---|---|
| Ruta / controlador | `:122` / `:313` | `:121` / `:317` | `routes/usuarios.js:121`, `controllers/usuarios.js:317` |
| Validación de `passwordActual` | `routes/usuarios.js:129-132`, `:353` | `:128-131`, `:357` | `controllers/usuarios.js:357` |
| Cookie `refreshToken` leída / limpiada | `:325`, `:505` | `:329`, `:509` | `controllers/usuarios.js:329,509` |
| 403 | `:329` | `:333` | `controllers/usuarios.js:333` |
| 404 | `:341` | `:345` | `controllers/usuarios.js:345` |
| 400 cuenta ya eliminada | `:348` | `:352` | `controllers/usuarios.js:352` |
| 401 `INVALID_CURRENT_PASSWORD` | `:353-355` | `:357-359` | `controllers/usuarios.js:357-359` |
| Borrado de `UserToken` | `:484-486` | `:490` | `controllers/usuarios.js:490` |
| 500 | `:520` | `:524` | `controllers/usuarios.js:524` |

Nueva nota para el frontend (marcada **[REQUIERE VERIFICACIÓN MANUAL]**): `cerrarSesionCookies` se ejecuta después del commit (`controllers/usuarios.js:509`). Si fallara, la cuenta ya está eliminada pero la respuesta sería 500, porque el `catch` llama a `abortTransaction()` sobre una transacción confirmada.

## 4. Re-baseline de citas — `GET /api/usuarios/:url` y `POST /api/usuarios`

- `GET /:url`: ruta `routes/usuarios.js:19` y controlador `usuarioGet` `controllers/usuarios.js:34` siguen correctos. No se re-verificaron en profundidad los validadores de `validarUrlUsuario` (sin cambios en esta entrega).
- `POST /api/usuarios`: ruta `routes/usuarios.js:33` y controlador `usuariosPost` `controllers/usuarios.js:77` siguen correctos. Respuesta `200` sin `msg`, `data.token` JWT `{ correo }`, sin cambios de contrato. No se re-verificaron en profundidad los `throw` del servicio de correo (`email/servicios-autenticacion-correo.js:186`).

## 5. Re-baseline de citas — `GET /registrados/nuevos-usuarios-registrados`

| Tema | Antes | Ahora | Cita actual |
|---|---|---|---|
| Ruta | `routes/usuarios.js:136` | `:135` | `routes/usuarios.js:135` |
| Controlador | `:530` | `:534` | `controllers/usuarios.js:534` |
| 500 | `:597` | `:601` | `controllers/usuarios.js:601` |

Sin cambio de contrato (máx. 3, excluye al usuario autenticado, `isFollowing` por `$lookup` sobre `follows`).

## 6. Cambios en `README.md`

- Encabezado: `última revisión` 2026-11-12 → **2026-11-13**.
- Log de revisiones: bloque **`Revisión 2026-11-13 (PUT /api/usuarios/update ya no acepta contraseña)`** agregado al final, como última entrada.
- H13: **RESUELTO** para `PUT /update` (antes "mitigado parcialmente"). Cita actualizada a `controllers/usuarios.js:136-141`.
- H14: quitada la mención a `PUT /update`; la cita `routes/usuarios.js:114-118` pasa a `:113-117`.
- I11: la parte de `PUT /update` (mensaje "6" vs 8) queda **resuelta**.
- Verificación manual: nuevo punto **11** (`PUT /update` sin body JSON → 500).
- Totales (81), índice y tabla de endpoints: sin cambios.

## 7. Discrepancias detectadas (no corregidas fuera de `docs/api/`)

1. **Código vs. documentación (corregida en `usuarios.md`):** la documentación previa de `PUT /update` decía que aceptaba `password` (con mensaje "6" y "no revoca sesiones"). El código ya lo rechaza (`controllers/usuarios.js:136-141`). **Drift corregido.**
2. **Citas de línea desplazadas (corregidas):** `routes/usuarios.js` y `controllers/usuarios.js` cambiaron respecto a la revisión de 2026-11-12. Afectan a todas las citas de `PUT /password`, `DELETE /delete` y `GET /registrados/...` (sección 2 a 5).
3. **`PUT /update` sin body JSON (nuevo, verificación manual):** 500 derivado de `controllers/usuarios.js:143` con `req.body` `undefined` (body-parser 2.3.0). Documentado en `usuarios.md` y en README (verificación 11).
4. **DELETE: limpieza de cookies fuera de la transacción (nuevo, verificación manual):** `cerrarSesionCookies` corre después del commit (`controllers/usuarios.js:509`); si falla, el `catch` intenta `abortTransaction()` sobre una transacción ya confirmada. Documentado en la nota de `usuarios.md`.
5. **DELETE: rama 403 sin `abortTransaction` explícito (observación de código, sin documentar como contrato):** la rama `No hay refresh token` (`controllers/usuarios.js:332-334`) hace `return` dentro de la transacción sin abortarla. La transacción queda sin commit y se descarta al cerrar la sesión (`session.endSession()`), así que no hay efecto en BD. Solo es una inconsistencia de estilo frente a las demás ramas de error.
6. **`cerrarSesionCookies` lanza `Error` con argumentos mal formados (observación):** `helpers/cerrar-sesion-cookies.js:26` hace `throw new Error("...", error)`; el segundo argumento de `Error` se ignora, así que el error original se pierde. Afecta al punto 4.
7. **Ningún cambio de contrato en `POST /api/usuarios` ni `GET /:url`:** confirmado sin diferencias de ruta, limiter ni respuesta frente a la documentación existente.

## 8. Archivos tocados en esta corrida

- `docs/api/usuarios.md` (editado en sitio: `PUT /update`, `PUT /password`, `DELETE /delete`, `GET /registrados/...`).
- `docs/api/README.md` (editado en sitio: encabezado, log de revisiones, H13, H14, I11, verificación manual).
- `docs/api/2026-11-13_12-15-58_documentacion-endpoints.md` (**nuevo**, este informe).

No se tocaron: `docs/api/inventario-endpoints.json` (lo mantiene el agente `sincronizador`), ni ningún otro dominio, ni archivos fuera de `docs/api/`, ni los informes delta anteriores.
