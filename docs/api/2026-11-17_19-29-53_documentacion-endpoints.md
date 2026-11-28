# Delta de documentación — 2026-11-17 19:29:53

**Base de comparación:** `README.md`, `auth.md` y `usuarios.md` tal como quedaron en la revisión del 2026-11-13 (`2026-11-13_12-15-58_documentacion-endpoints.md`, commit `4c6cb8e`).
**Código contrastado (HEAD `d35a1e0`, rama `Feat-ola4-E5a-E6-E8`):** `routes/auth.js`, `routes/usuarios.js` (sin cambios), `controllers/auth.js`, `controllers/sesiones.js` (nuevo), `controllers/usuarios.js`, `middlewares/validar-jwt-cookies-sesion.js`, `middlewares/rate-limiter.js`, `helpers/estado-cuenta-sesion.js` (nuevo), `helpers/cerrar-sesion-cookies.js`, `helpers/enmascarar-ip.js` (nuevo), `helpers/senales-riesgo-sesion.js` (nuevo), `helpers/vigencia-sesion.js` (nuevo), `helpers/tokensUtils.js`, `helpers/clave-limite.js`, `helpers/obtener-informacion-dispositivo.js`, `models/UserToken.js`, `errors/error-classes.js`, `errors/index.js`, `email/servicios-correo-reestablecer-password.js`, `models/server.js` (montaje). `admin/routes/` no cambió desde la base (sin drift de rutas en el panel).
**Commits revisados:** `9f14360` (PUT /update sin body), `9669fce` (E2), `e63a0d6` (E3), `a398f7b` (E4), `17f2a8e` (E3b), `1f9b243` (E6), `fa9352a` (E5a), `d35a1e0` (decisiones O/P/Q, solo docs). El working tree solo modifica documentación (`AGENTS.md`, `README.md` raíz, `docs/specs/*`, un plan de `engineering/`): **sin cambios de código** pendientes.

**Ejecución:** se corrieron con `node --test` las suites `test/integration/sesiones-activas.test.js`, `test/integration/refresh-sesion.test.js`, `test/integration/refresh-senales-riesgo.test.js`, `test/integration/verificar-sesion.test.js` y `test/logout.test.js` (MongoDB en memoria): **54/54 en verde**. Los ejemplos de `GET/DELETE /api/auth/sesiones*` reproducen sus aserciones; el resto de ejemplos sigue marcado **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**. No se levantó el servidor completo.

**Alcance:** 3 endpoints **nuevos**, 7 con **cambio de contrato**, 0 eliminados. Conteo 81 → **84** (red social 56 → 59; panel 25). Documentación tocada: `auth.md` (reescrito con citas re-contrastadas), `usuarios.md`, `README.md` y la fila de errores de sesión + citas del middleware en `comentarios.md`, `favoritos.md`, `followers.md`, `likes.md`, `municipios-ubicacion.md`, `notificaciones.md`, `posteos.md`, `reportes.md`, `soporte.md`, `uploads.md`.

---

## 1. NUEVOS — sesiones activas (E6, commit `1f9b243`)

| Endpoint | Ruta | Controlador | Cadena | Respuesta 200 | Errores propios |
|---|---|---|---|---|---|
| `GET /api/auth/sesiones` | `routes/auth.js:104-107` | `controllers/sesiones.js:26` `listarSesiones` | `floodLecturaIpLimiter` → `verificarTokenSesion` → `sesionesUsuarioLimiter` | `{ success, data: [{ sessionId, deviceName, paisUltimo, ipUltima, lastUsed, esActual }] }` sin `msg`; filtra `expiraEn > now`, orden `lastUsed` desc, IP enmascarada (`controllers/sesiones.js:28-43`) | 500 "Hubo un problema al procesar la solicitud" (`:22`) |
| `DELETE /api/auth/sesiones/otras` | `routes/auth.js:110-119` | `controllers/sesiones.js:80` `cerrarOtrasSesiones` | `floodEscrituraIpLimiter` → `verificarTokenSesion` → `sesionesUsuarioLimiter` → `passwordUsuarioLimiter` → `check('passwordActual')` (string, no vacío, ≤128) → `validarCampos` | `{ success, msg: "Sesiones cerradas", data: { cerradas } }` (`:96-99`); `deleteMany({ userId, sessionId: { $ne: req.sessionId } })` sin `tokenVersion++` (`:91-94`) | 422 validación (`routes/auth.js:114-118`), 404 "Usuario no encontrado" (`:84`), 401 `INVALID_CURRENT_PASSWORD` (`:88`), 500 (`:22`) |
| `DELETE /api/auth/sesiones/:sessionId` | `routes/auth.js:120-125` | `controllers/sesiones.js:52` `cerrarSesion` | `floodEscrituraIpLimiter` → `verificarTokenSesion` → `sesionesUsuarioLimiter` → `check('sessionId').isUUID(4)` → `validarCampos` | `{ success, msg: "Sesión cerrada" }`; si es la actual → `cerrarSesionCookies` (borra fila + limpia cookies, `:56-59`); si no → `deleteOne({ sessionId, userId, expiraEn > now })` sin cookies (`:61-70`) | 422 "El id de sesión no es válido" (`routes/auth.js:123`), 404 "Sesión no encontrada" (ajena/vencida/inexistente, `:67`), 500 (`:22`) |

- `/sesiones/otras` está declarada antes de `/sesiones/:sessionId` (`routes/auth.js:108`); además `otras` no pasaría `isUUID(4)`.
- Limiter nuevo **`sesionesUsuarioLimiter`**: 15 min / 30, clave `u:<idUsuario>` (`helpers/clave-limite.js:13-26`), `SESIONES_BLOCKED`, "Demasiadas operaciones sobre tus sesiones, intenta de nuevo más tarde" (`middlewares/rate-limiter.js:364-369`). Exportado en `:400`.
- `passwordUsuarioLimiter` pasa a ser compartido por **tres** endpoints (`routes/auth.js:113`, `routes/usuarios.js:106,127`).
- Enmascarado de IP (`helpers/enmascarar-ip.js:39-58`): IPv4 `a.b.x.x`, `::ffff:a.b.c.d` como IPv4, IPv6 dos grupos + `:x:x:x:x:x:x`, inválida → `null`. Verificado: `187.162.77.2` → `187.162.x.x`, `2806:2f0:1a2b::1` → `2806:2f0:x:x:x:x:x:x` (`test/integration/sesiones-activas.test.js:103-111`).

## 2. MODIFICADO (transversal) — validación de sesión en cada request (E4, commit `a398f7b`)

`verificarTokenSesion` se reescribió (`middlewares/validar-jwt-cookies-sesion.js:28-70`). Afecta a **todos** los endpoints con sesión de usuario.

| Aspecto | Antes (documentado) | Ahora (código) | Fuente |
|---|---|---|---|
| Algoritmo JWT | Sin fijar | Solo HS256 en sign y verify | `helpers/tokensUtils.js:23-24,76-78` |
| Claim `sid` | No existía | Obligatorio; sin él → `401 SESSION_REVOKED` | `middlewares/validar-jwt-cookies-sesion.js:38` |
| Sesión en BD | No se consultaba | `UserToken.exists({ sessionId, userId, expiraEn > now })` en paralelo con `Usuario.findById`; ausente → `401 SESSION_REVOKED` | `:40-46` |
| Estatus 2/3 | Pasaban (H3) | `403 ACCOUNT_RESTRICTED`, sin borrar la sesión | `helpers/estado-cuenta-sesion.js:26` vía `:48-49` |
| Estatus 0 / no verificado, inexistente / 4 | 403 / 401 en el propio middleware | Igual, centralizado en `errorEstadoCuenta` | `helpers/estado-cuenta-sesion.js:17-28` |
| `req.sessionId` | No existía | Se deja junto a `req.usuario` | `:64-65`, `:80-81` |
| Fallo de BD | — | `next(error)` → 500, nunca 401 | `:67-68` |
| Citas de línea | `:14`, `:27`, `:31`, `:35`, `:45`, `:8-47`, `:51-68` | `:60` (sin token), `:34` (token no válido), `:38,46` (`SESSION_REVOKED`), `:52` (sesión expirada por `tokenVersion`), `:58-70`, `:74-87` | — |

Clases nuevas (exportadas en `errors/index.js`): `SessionRevokedError` (401, `SESSION_REVOKED`, "La sesión fue cerrada. Inicia sesión nuevamente.", `errors/error-classes.js:59-63`) y `AccountRestrictedError` (403, `ACCOUNT_RESTRICTED`, "Tu cuenta está restringida", `:78-82`).

Aplicación en los dominios: se añadió en 36 tablas de errores de endpoints con `verificarTokenSesion` (35 en los demás dominios y `GET /registrados/nuevos-usuarios-registrados`; el resto de `usuarios.md` y `auth.md` se editó a mano) una fila de referencia `401 / 403 / 500 · SESSION_REVOKED · ACCOUNT_RESTRICTED · FORBIDDEN · INTERNAL_ERROR` que apunta a la nueva sección [README § Errores comunes de la sesión de usuario](README.md#errores-comunes-de-la-sesión-de-usuario), y se corrigieron sus citas `:14,45` → `:60,34` (y `:14,45,35` → `:60,34,52`).

## 3. MODIFICADO (contrato) — `POST /api/auth/refresh` (E3, E3b, E5a)

| Aspecto | Antes (documentado) | Ahora (código) | Fuente |
|---|---|---|---|
| Identificación | Buscar el hash del refresh en `UserToken` | Por `sid` + `userId` del refresh firmado | `controllers/auth.js:451-462` |
| Refresh sin `sid` o sin `type: 'refresh'` | — | `401 SESSION_REVOKED` | `:452-455` |
| Firma inválida | 403 "Token no registrado" (si no existía la fila) | 403 "Token no registrado" siempre, sin efectos | `:449` |
| Refresh vencido | 401 "Token no válido o expirado" + borrado del registro | 401 "Token no válido o expirado" **sin** borrar nada | `:445-446` |
| Sesión inexistente o vencida | Rama de reuso: `tokenVersion++` y borrar todas | `401 SESSION_REVOKED` sin efectos | `:465` |
| Reuso fuera de la gracia | 401 "Sesión comprometida…" + revocación global | Borra **solo esa sesión**, log `[SEGURIDAD]`, `401 SESSION_REVOKED` | `:471-475` |
| Carrera legítima (≤ 30 s) | Caía en reuso (H23) | `409 CONFLICT` "La sesión ya se renovó en otra solicitud; reintenta con las cookies actuales", sin cookies | `:467-470`, `:512-516`; `helpers/vigencia-sesion.js:73` |
| Estado de la cuenta | No se revisaba | `errorEstadoCuenta`: 401 / 403 `FORBIDDEN` / 403 `ACCOUNT_RESTRICTED` (sin borrar la sesión) | `:478-479` |
| `tokenVersion` | Se copiaba al access nuevo | Distinto del claim → `401 SESSION_REVOKED` | `:481` |
| Rotación | Reemplazo simple del hash | `findOneAndUpdate` condicionado a `{ token: hashRecibido, expiraEn > now }`; guarda `tokenAnterior`, `rotadoAt`, `lastUsed`, `expiraEn`, `ipUltima`, `userAgent`, `deviceName` | `:494-511` |
| Vida de la sesión | TTL 30 d sobre `createdAt` (H22) | `expiraEn` deslizante con tope `creadaEn + SESION_MAX_ABSOLUTA_DIAS` (90) | `helpers/vigencia-sesion.js:14,23-26,36-68` |
| Señales de riesgo (E5a) | — | `ip_nueva` (+ `ipHistorial` máx. 5) y `ua_nuevo` (navegador/OS sin versión) en `riesgo.motivos` con `$addToSet`; log `[RIESGO]` solo si la rotación ganó. **Nunca bloquean** ni cambian la respuesta | `helpers/senales-riesgo-sesion.js:22-28,42-59,69-78`; `controllers/auth.js:485-486,507,520-523` |
| Mensajes eliminados | "Sesión comprometida. Inicia sesión nuevamente." | Ya no existe en `controllers/auth.js` | — |

## 4. MODIFICADO (contrato) — `POST /api/auth/login` (E2/E3)

- Crea una fila `UserToken` por sesión con `sessionId = crypto.randomUUID()`, `ipPrimera`/`ipUltima`, `userAgent`, `deviceName`, `creadaEn`, `lastUsed`, `expiraEn` (`controllers/auth.js:164-181`). Access y refresh llevan el mismo `sid`; el refresh añade `jti` y `type: 'refresh'` (`helpers/tokensUtils.js:7-9`).
- Respuesta y errores sin cambio de forma; citas re-baselizadas (`controllers/auth.js:105,112,115,118,125,150,154,200-218,223`).

## 5. MODIFICADO (contrato) — `POST /api/auth/logout` (E3)

- Identifica la sesión por `sid`: primero del `accessToken` y, si falla, del `refreshToken`, con firma HS256 y `ignoreExpiration: true` (`controllers/auth.js:542-553`). Borra con `deleteOne({ sessionId, userId })` (`helpers/cerrar-sesion-cookies.js:19-21`). Antes: hash del refresh.
- Siempre 200 y limpieza de ambas cookies. El 500 ahora tiene `detail` "Hubo un error al cerrar la sesión: <mensaje>" (`helpers/cerrar-sesion-cookies.js:25`, observado en `test/logout.test.js`).
- H24 (logout no revoca el access) queda **resuelto**: la copia del access recibe `401 SESSION_REVOKED`.

## 6. MODIFICADO — `GET /api/auth/me`

Sin cambio en la respuesta. La tabla de errores incorpora `SESSION_REVOKED`, `ACCOUNT_RESTRICTED` y el 500 de BD; citas del middleware actualizadas; `Usuario.toJSON` pasa de `models/Usuario.js:192-200` a `:206-214` y además elimina `reset_sesion_token`/`reset_sesion_expira` (drift de cita).

## 7. MODIFICADO (contrato) — `PUT /api/usuarios/password` y `DELETE /api/usuarios/delete` (E4)

| Endpoint | Antes | Ahora | Fuente |
|---|---|---|---|
| `PUT /password` | Exigía cookie `refreshToken`; sin ella 403 "No hay refresh token"; borraba por `token: { $ne: hash(refresh) }` | Sin cookie de refresh; borra `sessionId: { $ne: req.sessionId }`; las sesiones cerradas reciben `401 SESSION_REVOKED` al instante | `controllers/usuarios.js:248-302`, `:282-285` |
| `DELETE /delete` | Exigía cookie `refreshToken`; 403 si faltaba; `cerrarSesionCookies(res, refreshToken)` | Sin cookie de refresh; `cerrarSesionCookies(res)` solo limpia cookies | `controllers/usuarios.js:320-322,494-496` |

Citas re-baselizadas (`controllers/usuarios.js` se acortó): `usuariosPasswordPut` `:248`, 404 `:254`, 401 `:258`, 422 `SAME_AS_CURRENT` `:261-266`, transacción `:273-290`, 500 `:301`; `usuariosDelete` `:309`, 404 `:333`, 400 `:340`, 401 `:345-348`, `UserToken.deleteMany` `:478`, `cerrarSesionCookies` `:496`, 500 `:511`; `nuevosUsuariosRegistrados` `:521`, 500 `:588`.

## 8. DRIFT corregido (no relacionado con E6/E5a)

1. **`POST /api/auth/cuentas/reestablecer-password` sí revoca sesiones** desde E1a (`f022c39`, 2026-11-11): `tokenVersion++` + `UserToken.deleteMany` en transacción (`email/servicios-correo-reestablecer-password.js:229-240`). `auth.md` decía "no revoca sesiones" y el README mantenía **H11** abierto. Corregido; citas del servicio actualizadas (`:202,205,206,208-210,219-220`).
2. **`PUT /api/usuarios/update` sin body** responde 200 desde `9f14360` (`controllers/usuarios.js:136,143`): se quitó la fila 500 **[REQUIERE VERIFICACIÓN MANUAL]** de `usuarios.md` y se cerró el punto 11 de verificación manual del README.
3. **Tabla de clases de error del README** incompleta y desfasada: faltaban `ExpiredTokenError` (`TOKEN_EXPIRED`, `:47`), `SessionRevokedError` (`:59`) y `AccountRestrictedError` (`:78`); las líneas de las demás clases se corrieron (`ForbiddenError` `:40` → `:66`, …, `InternalError` `:106` → `:144`).
4. **Citas de línea desplazadas en `auth.md`** para endpoints sin cambio de contrato (`controllers/auth.js` creció): `verificarCorreo` `:31` → `:36`, `reenviarCorreoVerificacion` `:45` → `:50`, flujo de recuperación +10 líneas (`:323` → `:333`, `:271` → `:281`, `:333` → `:343`, `:356` → `:366`, `:394` → `:404`), rutas de `routes/auth.js` +5 líneas. Montaje `models/server.js:123` → `:124`.
5. **`usuarios.md`, `GET /:url`:** citas de limiters `:219-225`/`:139-148` → `:304-309`/`:248-257`.
6. **README, H4** (tokens de enlace vencidos → 500) seguía como abierto aunque se resolvió el 2026-11-10: marcado como resuelto.
7. **README, tokensUtils:** default de access `:17` → `:20`; cookies `:35-53` → `:88-106`.

## 9. Cambios en `README.md`

- Encabezado: última revisión **2026-11-17**, total **84** (59 + 25). Montaje `models/server.js:123-140`.
- Log: bloque **`Revisión 2026-11-17 (sesiones de usuario, Fase E: olas 3 y 4 — E2, E3, E3b, E4, E5a, E6)`** al final.
- Índice: `auth.md` 10 → **13**.
- §Autenticación: filas de access/refresh con claims, HS256, tope absoluto y modelo `UserToken`; descripción nueva de `verificarTokenSesion`/`verificarTokenSesionOpcional`; **sección nueva** «Errores comunes de la sesión de usuario» con acción recomendada por `code`.
- Clases de error: tabla completa (14 clases).
- Rate limiting: fila `sesionesUsuarioLimiter`; `passwordUsuarioLimiter` compartido por 3 endpoints.
- Tabla de endpoints: filas 13–15 nuevas (sesiones), logout como "Público (cookies opcionales)", `PUT /password` y `DELETE /delete` como "Usuario + contraseña"; renumeración 1–84.
- Hallazgos: H3, H4, H11, H23, H24 resueltos; H22 resuelto para usuarios (vigente en el panel); **nuevos H25** (cubo de contraseña compartido por 3 endpoints) y **H26** (`[SEGURIDAD]`/`[RIESGO]` solo en logs, sin E9/E10). I9 resuelto.
- Verificación manual: 11 cerrado; nuevos 12 (alcance de los campos de `GET /sesiones` frente al contrato del frontend) y 13 (rama "Sesión expirada" por `tokenVersion` casi inalcanzable).

## 10. Discrepancias y observaciones (no corregidas fuera de `docs/api/`)

1. **`inventario-endpoints.json` desactualizado:** 81 entradas y `"total": 81`; faltan los 3 endpoints de sesiones. Lo corrige el agente `sincronizador` (no se tocó).
2. **`tokenVersion` distinto en el middleware → `UNAUTHORIZED`, no `SESSION_REVOKED`** (`middlewares/validar-jwt-cookies-sesion.js:51-53`), mientras que el refresh responde `SESSION_REVOKED` para el mismo caso (`controllers/auth.js:481`). El cliente haría un refresh inútil antes de ir al login. Casi inalcanzable hoy (ver verificación 13).
3. **`POST /api/auth/login` responde "Cuenta no activada" (`FORBIDDEN`) para estatus 2/3** (`controllers/auth.js:118`), no `ACCOUNT_RESTRICTED`. Coherente con AGENTS.md (login exige `estatus: 1`), pero el frontend recibe dos `code` distintos para la misma condición según el punto de entrada.
4. **500 del logout expone el mensaje interno** ("Hubo un error al cerrar la sesión: <mensaje de Mongo>", `helpers/cerrar-sesion-cookies.js:25` → `controllers/auth.js:564`): mismo patrón que H8.
5. **`DELETE /api/auth/sesiones/otras` no filtra `expiraEn`** en el `deleteMany` (`controllers/sesiones.js:91-94`): borra también filas vencidas que el TTL aún no eliminó, así que `data.cerradas` puede contar sesiones que `GET /sesiones` no mostraba. Inocuo.
6. **`deviceName` y `userAgent` se sobrescriben en cada refresh** (`controllers/auth.js:504-506`): la lista muestra el último navegador, no el del login. Intencional según E5a.

## 11. Archivos tocados en esta corrida

- `docs/api/auth.md` (reescrito en sitio: 10 endpoints re-contrastados + 3 nuevos).
- `docs/api/usuarios.md` (editado: `GET /:url`, `PUT /update`, `PUT /password`, `DELETE /delete`, `GET /registrados/...`).
- `docs/api/README.md` (editado: ver §9).
- `docs/api/comentarios.md`, `favoritos.md`, `followers.md`, `likes.md`, `municipios-ubicacion.md`, `notificaciones.md`, `posteos.md`, `reportes.md`, `soporte.md`, `uploads.md` (solo la fila de errores de sesión y las citas del middleware; 36 tablas actualizadas de forma mecánica, una de ellas en `usuarios.md`).
- `docs/api/2026-11-17_19-29-53_documentacion-endpoints.md` (**nuevo**, este informe).

No se tocaron: `docs/api/inventario-endpoints.json`, los dominios del panel (`admin-*.md`), `bienvenida.md`, `early-access.md`, los informes delta anteriores ni ningún archivo fuera de `docs/api/`.
