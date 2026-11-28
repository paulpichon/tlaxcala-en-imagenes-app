# Documentación de Endpoints — TlaxApp API

**Generado:** 2026-10-27 19:10:34 (última revisión: 2026-11-27)
**Total de endpoints documentados:** 90 (red social: 65 · panel de administración: 25)
**Archivos de rutas explorados:**
- Red social (`routes/`): `bienvenida.js`, `auth.js`, `usuarios.js`, `uploads.js`, `posteos.js`, `likes.js`, `followers.js`, `favoritos.js`, `municipios.js`, `ubicacion.js`, `notificaciones.js`, `comentarios.js`, `reportes.js`, `soporte.js`, `earlyaccess.js`
- Panel (`admin/routes/`): `index.js`, `moderacion.js`, `influencers.js`
- Montaje: `models/server.js` (prefijos en `:23-58`; los `app.use` de las rutas en `:126-143`; `admin` en `:141`; `notificaciones` en `:135`)
- Controladores, middlewares, helpers, errores, modelos, limiters y crons leídos (ver citas en cada archivo de dominio).

**Endpoints no verificables completamente:**
- Ejecución real de todos los flujos: no se levantó el servidor (requiere MongoDB, Cloudinary, SMTP y variables de entorno). Todos los ejemplos son **construidos a partir del esquema** y están etiquetados como tales.
- Comportamiento de Cloudinary (respuestas de subida/borrado) y de Web Push (códigos 404/410 de proveedores externos, entrega real, `icon`/`badge` en iOS) → **[REQUIERE VERIFICACIÓN MANUAL]**.
- Valores reales de variables de entorno (`ACCESS_TOKEN_EXPIRY`, `JWT_SEED`, `NODE_ENV`, `ADMIN_FRONTEND_URL`, `CSRF_ALLOWED_ORIGINS`, `FLOOD_LECTURA_IP_MAX`, `FLOOD_ESCRITURA_IP_MAX`, `POLLING_IP_MAX`, `NOTIF_*`) → **[REQUIERE VERIFICACIÓN MANUAL]**.
- Comportamiento de la cookie de atribución entre dominios (SameSite=Lax) → **[REQUIERE VERIFICACIÓN MANUAL]**.

> **Alcance de esta corrida.** Esta documentación reemplaza la corrida parcial de las 13:36 (`2026-10-27_13-36-09_documentacion-endpoints.md`, que solo documentaba `DELETE /api/v1/admin/influencers/:id`). Ese archivo se **eliminó** al quedar superado por este conjunto (README + dominios).
>
> **Revisión 2026-10-27 (corrección de auth).** Se auditó el sistema de sesiones contra el código y se aplicaron tres cambios: (a) `ACCESS_TOKEN_EXPIRY` pasa a tener default `1h` en código; (b) el `maxAge` de todas las cookies de sesión se deriva del `exp` del JWT (`helpers/vigencia-cookie.js`), de modo que token y cookie no pueden desincronizarse, tampoco en el panel; (c) el icono de Web Push de comentarios ya no cae en un path relativo. Las filas de la tabla de autenticación, los hallazgos H22–H24, I1 e I4 y el archivo `comentarios.md` reflejan el estado nuevo. Los riesgos H22–H24 se **documentan sin corregir** por decisión explícita.
>
> **Delta frente al inventario base** (`docs/api/inventario-endpoints.json`, 80 entradas): se contrastaron método y ruta de los 80 endpoints contra el código. **Sin diferencias de método ni de ruta** (80/80). No se volvió a diffear cada campo del JSON; donde el JSON difiere del código en detalle, se indica en el archivo de dominio correspondiente (por ejemplo, `GET /api/health` devuelve más campos que los listados en el JSON).
>
> **Revisión 2026-11-10 (sync Postman).** Delta de 7 endpoints modificados (0 nuevos, 0 eliminados), documentado en detalle en `2026-11-10_12-12-40_documentacion-endpoints.md` y aplicado a `auth.md` y `bienvenida.md`: (1) capa IP anti-evasión `flujoTokenIpLimiter` (15 min/60, `FLOOD_BLOCKED`, instancia compartida) delante de los limiters con token en `verificar-correo`, `reenviar-correo`, `reenviar-correo-restablecer-password`, `validar-token-reset-password` y `reestablecer-password` (H1); (2) capa IP dedicada `recuperacionSolicitudIpLimiter` (15 min/10) en `password-olvidado` (H2); (3) tokens de enlace vencidos/inválidos ahora responden **401** `TOKEN_EXPIRED`/`UNAUTHORIZED` en lugar de 500 (H6, `helpers/validar-jwt.js`); (4) `password-olvidado` devuelve siempre `data.token` (opaco 64-hex, sesión 60 min) y `reenviar-correo-restablecer-password` recibe ese token opaco (`^[a-f0-9]{64}$`), no un JWT (O1); un reset exitoso limpia la sesión; (5) `GET /api/health`: limiter real `healthLimiter` (1 min/60, `HEALTH_BLOCKED`) y respuesta mínima `{ "status": "ok" | "degraded" }` con 200/503 (la respuesta extensa con `pid`/`memory` ya no existe y su hallazgo queda obsoleto).
>
> **Revisión 2026-11-10 (cierre de hallazgo).** El hallazgo **H2** (_toggle de comentarios con strings_) quedó **resuelto**: `routes/comentarios.js:59` ahora valida con `isBoolean({ strict: true })`, de modo que solo un booleano JSON real llega al controlador; strings y números se rechazan con 422 `VALIDATION_FAILED`. Verificado en ejecución con la cadena exacta de la ruta (`express-validator` 7.3.2 + `validator` 13.15.35). `comentarios.md` actualizado.
>
> **Revisión 2026-11-12 (step-up de contraseña, E1b/E1c).** Delta de 1 endpoint nuevo y 1 modificado, aplicado a `usuarios.md` (detalle con citas `archivo:línea` en `2026-11-12_21-28-49_documentacion-endpoints.md`): (1) **nuevo** `PUT /api/usuarios/password` (commit `66dea8b`): cambio de contraseña autenticado que exige `passwordActual`, valida `passwordNueva` con las reglas del registro (8–128 + complejidad), rechaza una nueva igual a la actual con 422 `SAME_AS_CURRENT`, y en una transacción MongoDB guarda el hash y borra las demás sesiones (`UserToken.deleteMany` con `token: { $ne: hash(refreshToken) }`), respondiendo `data.sesionesCerradas`; limiter nuevo `passwordUsuarioLimiter` (15 min/5, clave usuario, `PASSWORD_BLOCKED`, `middlewares/rate-limiter.js:354-359`); (2) `DELETE /api/usuarios/delete` (commit `138afe1`): ahora exige `passwordActual` (401 `INVALID_CURRENT_PASSWORD` si no coincide) y borra todas las filas `UserToken` del usuario dentro de la transacción (antes quedaban huérfanas hasta el TTL); comparte el cubo de `passwordUsuarioLimiter` con el cambio de contraseña. La sesión actual sobrevive en ambos endpoints. Además se re-baselizaron las citas de línea de `usuarios.md` (el route file se corrió por la inserción de la ruta nueva) y se corrigió la referencia de montaje (`models/server.js:125`). Los hallazgos **H13** y **H14** quedan anotados como mitigados parcialmente: el flujo recomendado exige contraseña, pero `PUT /api/usuarios/update` sigue aceptando `password` sin verificar la actual. Nota para el frontend: un 401 `INVALID_CURRENT_PASSWORD` **no** debe disparar el refresh. `docs/api/inventario-endpoints.json` ya lista los 81 endpoints (commit del merge), pero su campo `"total"` sigue en 80 — lo corrige el agente `sincronizador`.
>
> **Revisión 2026-11-12 (verificación, sin cambios de código).** Re-corrida de verificación ligera (sin backend nuevo: HEAD sigue en `d3ab71f`): 0 discrepancias de contenido contra `routes/usuarios.js`, `controllers/usuarios.js`, `middlewares/rate-limiter.js` y `errors/error-classes.js` (citas de línea re-contrastadas una a una) y spot-check de conteos por dominio contra `routes/` y `admin/routes/` (56 + 25 = 81 ✓). Único drift encontrado: la nota de que `inventario-endpoints.json` tenía `"total": 80` quedó obsoleta — el agente `sincronizador` ya lo corrigió a **81** en su corrida concurrente (ver `engineering/working/postman-sync/2026-11-12_sincronizacion.md`); se actualizaron las referencias vivas de este README (pie de la tabla de endpoints y §Totales). La entrada de la revisión anterior de hoy se conserva tal cual (era correcta al momento de escribirse); no hubo cambios en `usuarios.md` ni en el delta anterior. Delta: `2026-11-12_21-40-05_documentacion-endpoints.md`.
>
> **Revisión 2026-11-13 (`PUT /api/usuarios/update` ya no acepta contraseña).** Delta de 1 endpoint con cambio de contrato, 0 nuevos y 0 eliminados, aplicado a `usuarios.md` (detalle con citas `archivo:línea` en `2026-11-13_12-15-58_documentacion-endpoints.md`): (1) `PUT /api/usuarios/update` rechaza `password` con 422 `VALIDATION_FAILED` y `errors[0].code = USE_PASSWORD_ENDPOINT` (cualquier valor distinto de `undefined`), antes de escribir nada (`controllers/usuarios.js:136-141`); el cambio de contraseña queda solo en `PUT /api/usuarios/password`. Por eso H13 queda **resuelto** para ese endpoint y H14 y I11 dejan de aplicar a `PUT /update`. (2) `PUT /api/usuarios/password` y `DELETE /api/usuarios/delete` se contrastaron contra el código: sin cambio de contrato. Se documentó el reset de `intentos_login` a `0` (`controllers/usuarios.js:287`) y se re-citaron sus líneas de error. (3) Nuevo punto de verificación manual: `PUT /api/usuarios/update` sin body JSON devuelve 500 (`req.body` queda `undefined` y el desestructurado de `controllers/usuarios.js:143` lanza `TypeError`; derivado del código, no ejecutado). (4) Re-baseline de citas de línea en `usuarios.md` (`routes/usuarios.js` y `controllers/usuarios.js` se desplazaron). Sin cambios en el conteo (81) ni en `inventario-endpoints.json`, ni en los dominios distintos de `usuarios.md`.
>
> **Revisión 2026-11-17 (sesiones de usuario, Fase E: olas 3 y 4 — E2, E3, E3b, E4, E5a, E6).** Delta de **3 endpoints nuevos**, 7 con cambio de contrato y 0 eliminados (detalle con citas `archivo:línea` en `2026-11-17_19-29-53_documentacion-endpoints.md`). Base de comparación: el estado del 2026-11-13; se contrastaron los commits `9f14360`…`d35a1e0` y el working tree (este último solo trae cambios de documentación, sin código). (1) **Nuevos** (E6, `1f9b243`): `GET /api/auth/sesiones` (sesiones vigentes, IP enmascarada con `helpers/enmascarar-ip.js`, `esActual`), `DELETE /api/auth/sesiones/otras` (step-up con `passwordActual`, comparte `passwordUsuarioLimiter`) y `DELETE /api/auth/sesiones/:sessionId` (propia; ajena → 404; la actual = logout); limiter nuevo `sesionesUsuarioLimiter` (15 min/30, clave usuario, `SESIONES_BLOCKED`, `middlewares/rate-limiter.js:364-369`). (2) **Validación de sesión en cada request** (E4): `verificarTokenSesion` exige `sid` y una fila viva en `UserToken`; nuevos errores `401 SESSION_REVOKED` y `403 ACCOUNT_RESTRICTED` (estatus 2/3) que afectan a **todos** los endpoints con sesión (sección nueva [Errores comunes de la sesión de usuario](#errores-comunes-de-la-sesión-de-usuario); se añadió una fila de referencia en cada tabla de error de los dominios y se corrigieron las citas de línea del middleware). (3) `POST /api/auth/refresh` (E3b + E5a): rotación atómica, `409 CONFLICT` en la gracia de 30 s, el reuso borra solo esa sesión, revisa el estado de la cuenta, `expiraEn` deslizante con tope de 90 días y señales de riesgo `ip_nueva`/`ua_nuevo` **solo informativas**. (4) `POST /api/auth/login` crea la sesión con `sessionId`; `POST /api/auth/logout` identifica la sesión por `sid` (access o refresh) y corta el access token al instante. (5) `PUT /api/usuarios/password` y `DELETE /api/usuarios/delete` ya no exigen la cookie `refreshToken` (se elimina su 403). (6) **Drift corregido:** `POST /api/auth/cuentas/reestablecer-password` sí revoca todas las sesiones desde E1a (`f022c39`); `PUT /api/usuarios/update` sin body responde 200, no 500 (`9f14360`); tabla de clases de error incompleta (faltaban `ExpiredTokenError`, `SessionRevokedError`, `AccountRestrictedError`) y con líneas desfasadas. Hallazgos **H3, H11, H23, H24** e **I9** quedan **resueltos** para usuarios; **H22** resuelto para usuarios y vigente para el panel; **H4** marcado como resuelto (ya lo estaba desde el 2026-11-10). Conteo: 81 → **84**. `inventario-endpoints.json` sigue con 81 entradas: lo actualiza el agente `sincronizador`.
>
> **Revisión 2026-11-17 (delta sincronizador: sesiones, logout, usuarios/update).** Delta de 0 endpoints nuevos y 0 eliminados (los 3 de sesiones ya estaban documentados en la revisión anterior de hoy); se contrastaron contra el código y las pruebas de sesión: `GET /api/auth/sesiones`, `DELETE /api/auth/sesiones/otras`, `DELETE /api/auth/sesiones/:sessionId` (`routes/auth.js:104-125`, `controllers/sesiones.js`), `POST /api/auth/logout` (`routes/auth.js:96`, `controllers/auth.js:554-566`; siempre 200, sin cookie obligatoria) y `PUT /api/usuarios/update` (`routes/usuarios.js:68-99`, `controllers/usuarios.js:136-141`; `password` → 422 `USE_PASSWORD_ENDPOINT`). Sin cambio de contrato respecto al estado documentado. Drift corregido en `auth.md`: el 422 de `DELETE /api/auth/sesiones/otras` y de `DELETE /api/auth/sesiones/:sessionId` tiene `detail` literal `"La solicitud contiene errores de validación"` (`middlewares/validar-campos.js:28`), no el texto con número de errores. Pruebas ejecutadas: `test/integration/sesiones-activas.test.js` + `test/logout.test.js` (20/20) y `test/cambio-password.test.js` (9/9). Detalle en `2026-11-17_19-57-42_documentacion-endpoints.md`.
>
> **Revisión 2026-11-25 (Fases 3–7 de notificaciones, tope de rate limiting por IP y `detail` de 5xx).** Base: HEAD `dd88f4b` (árbol limpio). Delta de **6 endpoints nuevos**, 7 modificados y 0 eliminados; detalle con citas `archivo:línea` en `2026-11-25_20-27-06_documentacion-endpoints.md`. (1) **Nuevos** en `/api/notificaciones` (el router pasa de 7 a **13** rutas): `GET /estado`, `GET /preferencias`, `PUT /preferencias`, `DELETE /dispositivos/:id`, `PATCH /marcar-todas-leidas` y `DELETE /`. `notificaciones.md` se reescribió entero con secciones de tipos, canales, silenciabilidad, agrupación de likes y retención. (2) **Modificados:** `POST /subscribe` devuelve `data.id` y desvincula el endpoint de otras cuentas (`helpers/dispositivos-push.js:42-63`); `POST /unsubscribe` valida `endpointPushValido` (nuevo 400 "Endpoint de suscripción inválido"); `GET /vapidPublicKey` deja de exigir sesión; `GET /` añade `tipo` (422 si no es del enum) y tope `limite` 100; `DELETE /eliminar-notificacion/:id` pasa a soft delete; `GET /nuevas-notificaciones` usa `pollingIpLimiter`. (3) **Rate limiting global:** `floodLecturaIpLimiter` 300 → **3000**/15 min (env `FLOOD_LECTURA_IP_MAX`), `floodEscrituraIpLimiter` 60 → **600**/15 min (env `FLOOD_ESCRITURA_IP_MAX`), nuevo `pollingIpLimiter` (3000/15 min, env `POLLING_IP_MAX`) para los dos endpoints de polling, `registroLimiter` 3 → **10**/h, y `POST /api/auth/refresh` pasa a `refreshIpLimiter` (300/15 min solo IP) + `refreshLimiter` con clave por **`sid`** (10/15 min). CORS expone `Retry-After` y `RateLimit-*` (`models/server.js`). (4) **Errores:** el `detail` de los `AppError` **5xx** ya no se devuelve fuera de `NODE_ENV=development` (`middlewares/error-handler.js:36-45,112-123`); los 4xx conservan su `detail`. Hallazgo **H8** actualizado. (5) Corregidas las afirmaciones obsoletas de `followers.md`, `comentarios.md`, `likes.md`, `reportes.md`, `auth.md`, `usuarios.md` y `posteos.md` sobre notificaciones y limiters. Conteo: 84 → **90** (65 + 25). `inventario-endpoints.json` quedó actualizado a **90** (`"total": 90`, 13 entradas de notificaciones) en la corrida concurrente del agente `sincronizador` del 2026-11-25 (ver `engineering/working/postman-sync/2026-11-25_sincronizacion.md`).
>
> **Revisión 2026-11-25 (addendum admin: verificación de los 25 endpoints del panel).** Se auditó el dominio `admin`, que faltó en la entrada anterior: **0 endpoints nuevos, 0 eliminados** (siguen **25**: auth/TOTP 10 + cuentas 3 + moderación 7 + influencers 5) y el total se mantiene en **90**. **Único drift de contrato:** en `PUT /api/v1/admin/moderacion/reportes/:id/resolver` y `.../descartar`, los reportantes del posteo ahora reciben `reporte_resuelto` / `reporte_descartado` (in-app + push, sin correo, mensaje genérico y sin `referencia`), después de responder y best-effort (`admin/controllers/moderacion.js:323-356,449-451,526-528`); `recategorizar`, `ocultar` y `restaurar` **no** notifican. Corregida la nota «el reportero no recibe ninguna señal». Se re-baselizaron las citas `archivo:línea` de `admin-moderacion.md`, `admin-auth-totp.md` (incluido el montaje `models/server.js:141`) y `admin-influencers.md`; `admin-cuentas.md` no tenía drift. Limiters del panel sin cambios (login 15/5, TOTP 5/5, refresh 15/10, moderación 300/60, influencers 300/60). Detalle en el apartado «Addendum (admin)» de `2026-11-25_20-27-06_documentacion-endpoints.md`.
>
> **Revisión 2026-11-26 (cableado de rate limiting de 5 escrituras de notificaciones).** Base: HEAD `69aa3ad` + árbol de trabajo con el cambio **no commiteado** de `routes/notificaciones.js` (§9 del plan de notificaciones). **0 endpoints nuevos, 0 eliminados**; **5 modificados**, todos solo en el cableado del rate limiter (**sin cambio de contrato** de request/response, de rutas ni de códigos de error): `POST /api/notificaciones/subscribe`, `POST /api/notificaciones/unsubscribe`, `DELETE /api/notificaciones/dispositivos/:id`, `PATCH /api/notificaciones/marcar-notificacion-leida/:id` y `DELETE /api/notificaciones/eliminar-notificacion/:id` pasan de `floodLecturaIpLimiter` (15 min/3000, "Demasiadas solicitudes desde esta conexión…") a `floodEscrituraIpLimiter` (15 min/**600**, env `FLOOD_ESCRITURA_IP_MAX`, "Demasiadas acciones desde esta conexión…"), ambos `429 FLOOD_BLOCKED` (`middlewares/rate-limiter.js:282-291`); el `429 READ_BLOCKED` de `notificacionesUsuarioLimiter` se conserva en los cinco. Motivo: cinco escrituras consumían el cubo de lectura; lo valida `test/notificaciones-rate-limiter.test.js`. Corregidas en `notificaciones.md` las cadenas de middlewares, la descripción del limiter, las filas `429` de las cinco tablas de error y las dos notas invertidas «consume el cubo de lectura» (`DELETE /dispositivos/:id` y `DELETE /eliminar-notificacion/:id`); también las cinco filas del índice de endpoints de este README. Las citas `archivo:línea` de `routes/notificaciones.js` **no** se desplazaron (`:24,31,58,85,104`) porque el cambio es simétrico. Verificación del panel: **25/25 endpoints, 0 drift** (spot-check del refactor `trasResponder`/`enParalelo` de `admin/controllers/moderacion.js`: citas `:310,313,449-451,458,528,534,560,578` correctas). Conteo: **90** (65 + 25). `inventario-endpoints.json` sigue coherente (`"total": 90`, 13 entradas de notificaciones); solo su campo informativo `limiter` de esas 5 entradas conserva los valores anteriores, y lo actualizará el agente `sincronizador` en su próxima corrida. Detalle en `2026-11-26_12-53-18_documentacion-endpoints.md`.
>
> **Revisión 2026-11-27 (verificación del delta de sync: cursor de comentarios y `URL_NOT_ALLOWED`).** Corrida de **verificación** del delta reportado por el sincronizador (commits `d14a611` y `25899bf`; brief en `engineering/working/postman-sync/2026-11-27_delta-para-agente-api.md`): **0 endpoints nuevos, 0 eliminados, 0 cambios de contrato no documentados**. (1) `GET /api/comentarios/:posteoId/comentarios`: el contenido del delta ya estaba en `comentarios.md` y es **correcto contra el código** — query params `orden` (`asc`|`desc`, default `desc`, `routes/comentarios.js:33`) y `cursor` (MongoId, `:34`), `pagination.next` construido por `construirLinkPagina` con `page`+`limite`+`orden`+`cursor` (`helpers/responder.js:38-44`, `controllers/comentarios.js:177-179`), `prev: null` al paginar por cursor (`:180`), `page` sin cursor como `skip` por compatibilidad, `limite` default 10 con clamp silencioso 1–100 (`:118`). (2) `422 URL_NOT_ALLOWED`: la regla de solo enlaces de Google Maps (`helpers/enlaces-permitidos.js`, inyectada por `crearValidadorTexto` en `middlewares/validar-texto.js:55-61`) ya estaba documentada en la nota de enlaces de `posteos.md` (POST) y en la tabla y notas de `comentarios.md` (POST). **Completado:** la fila `texto` de `POST /api/posteos` y las filas 422 de `POST`/`PUT /api/posteos/:id` no mencionaban el código ni el mensaje literal "Solo se permiten enlaces de Google Maps (https://maps.app.goo.gl/...)." — se agregaron; el `PUT /api/posteos/:id` recibió además una nota de enlaces propia. **Re-baseline de citas `archivo:línea` en `comentarios.md` y `posteos.md`**: los commits habían corrido las líneas de `routes/comentarios.js` (`:28→29`, `:38→42`, `:45→50`, `:55→57`, checks `:30-33→32-37`, toggle `:59→61`), `controllers/comentarios.js` (`obtenerComentarios :119→113`, errores `:159→186`, `:174→201`, `:182→209`, `:202-251→229-278`, `:270→297`, `:281→308`), `routes/posteos.js` (`:47→49`, `:57→59`, `:71→75`, `:98→104`, `:121→129`, `:131→141`, checks y validadores) y `controllers/posteos.js` (las 7 funciones y sus errores; p. ej. `posteosPost :311→346`, 403 `:495→536`/`:527→568`/`:550→591`), así como `middlewares/validar-texto.js` (`throw` `:60→73`; default `validarTexto` `:68→81`) y los montajes (`models/server.js:126→130` posteos, `:134→138` comentarios). Actualizada la nota de `extraQuery` de paginación de este README (los links de comentarios ahora llevan `orden`+`cursor`). Conteo: **90** sin cambios. Detalle en `2026-11-27_22-40-20_documentacion-endpoints.md`.

---

## Índice de archivos

| Archivo | Dominio | Endpoints |
|---|---|---|
| [bienvenida.md](bienvenida.md) | Raíz y health check | 2 |
| [auth.md](auth.md) | Autenticación de usuarios (verificación, login, recuperación, refresh, logout, me, sesiones activas) | 13 |
| [usuarios.md](usuarios.md) | Perfil de usuario (alta, consulta por URL, actualización, cambio de contraseña, baja, nuevos usuarios) | 6 |
| [uploads.md](uploads.md) | Imagen de perfil | 1 |
| [posteos.md](posteos.md) | Posteos (feed, detalle, perfil, alta, edición, eliminación, ubicación) | 7 |
| [likes.md](likes.md) | Likes de posteos | 3 |
| [followers.md](followers.md) | Seguidores / seguidos | 4 |
| [favoritos.md](favoritos.md) | Favoritos | 3 |
| [comentarios.md](comentarios.md) | Comentarios de posteos | 5 |
| [reportes.md](reportes.md) | Reportes de posteos | 1 |
| [municipios-ubicacion.md](municipios-ubicacion.md) | Catálogo de municipios/localidades y geolocalización inversa | 4 |
| [notificaciones.md](notificaciones.md) | Notificaciones in-app, Web Push, dispositivos y preferencias | 13 |
| [soporte.md](soporte.md) | Ayuda y soporte (correo) | 1 |
| [early-access.md](early-access.md) | Acceso anticipado y captura de atribución de influencers | 2 |
| [admin-auth-totp.md](admin-auth-totp.md) | Panel: login en 2 pasos, sesión, cambio de contraseña y TOTP | 10 |
| [admin-cuentas.md](admin-cuentas.md) | Panel: cuentas de administrador | 3 |
| [admin-moderacion.md](admin-moderacion.md) | Panel: moderación de reportes y ocultamiento de posteos | 7 |
| [admin-influencers.md](admin-influencers.md) | Panel: influencers / early access | 5 |

**Total: 90 endpoints** (red social 65 + panel 25). El conteo por dominio está al final de la tabla de endpoints.

---

## Convenciones globales

### Montaje y orden de middlewares globales (`models/server.js`)

Orden real de registro (aplica antes de cualquier ruta):

1. `helmet` (CSP desactivada; `crossOriginResourcePolicy: cross-origin`) — `models/server.js:76-81`
2. `cors` con `credentials: true`, allow-list y `exposedHeaders` (`Retry-After`, `RateLimit-*`) — `models/server.js:83-111`
3. `cookieParser()` — `:113`
4. `express.static('public')` — `:115`
5. `express.json()` (límite por defecto de body-parser: **100 kb**) — `:117`
6. `validarOrigen` (CSRF por Origin/Referer en métodos mutantes) — `:119` → `middlewares/validar-origen.js`
7. `traceId` (genera `req.traceId` y el header `X-Trace-Id`) — `:121` → `middlewares/trace-id.js`
8. Rutas (en el orden de los `app.use` de `models/server.js:126-143`)
9. 404 catch-all → `NotFoundError` (`code: NOT_FOUND`) — `:146-148`
10. `errorHandler` — `:151`

**Consecuencia:** los errores de CORS y de CSRF se producen **antes** de `traceId`, por lo que su `trace_id` es `"unknown"` y no llevan `X-Trace-Id` (ver §Hallazgos).

### Autenticación

| Ámbito | Cookies | Secreto (variable) | Expiración | Atributos |
|---|---|---|---|---|
| Usuarios — access | `accessToken` | `ACCESS_TOKEN_SECRET` | `ACCESS_TOKEN_EXPIRY`; default en código **`1h`** (`helpers/tokensUtils.js:20`), igual que `.env.example` | `httpOnly`, `secure`, `sameSite: none`, `path: /`, `maxAge` **derivado del `exp`** del JWT (`helpers/tokensUtils.js:88-106`). Claims `{ id, tokenVersion, sid }`, solo HS256 (`helpers/tokensUtils.js:7-9,23-24`) |
| Usuarios — refresh | `refreshToken` | `REFRESH_TOKEN_SECRET` | `REFRESH_TOKEN_EXPIRY` (default `7d`), con tope absoluto de sesión `SESION_MAX_ABSOLUTA_DIAS` (default 90, `helpers/vigencia-sesion.js:14,56-68`) | igual (`maxAge` derivado del `exp`). Claims `{ id, tokenVersion, sid, jti, type: "refresh" }`. **Una fila `UserToken` por sesión** (`sessionId` = `sid`, hash SHA-256 del refresh vigente, `tokenAnterior`/`rotadoAt`, `expiraEn` con TTL, metadata de IP/UA y `riesgo.motivos`; `models/UserToken.js:7-90`) |
| Panel — access | `adminAccessToken` | `ADMIN_ACCESS_TOKEN_SECRET` | `ADMIN_ACCESS_TOKEN_EXPIRY` (default `10m`) | `httpOnly`, `secure`, `sameSite: none`, **`path: /api/v1/admin`**, `maxAge` derivado del `exp` (`admin/helpers/sesiones.js:38-42`) |
| Panel — refresh | `adminRefreshToken` | `ADMIN_REFRESH_TOKEN_SECRET` | `ADMIN_REFRESH_TOKEN_EXPIRY` (default `4h`) | igual; hash en `AdminToken` |
| Panel — preAuth | (body `preAuthToken` o header `x-preauth-token`) | `ADMIN_PREAUTH_SECRET` | `5m` fijo (`admin/helpers/tokens.js:54`) | No abre rutas del panel |
| Atribución | `early_access_atribucion` | `EARLY_ACCESS_ATTR_SECRET` (fallback a `ACCESS_TOKEN_SECRET` **solo fuera de producción**) | 30 días | `httpOnly`, `secure` en prod, **`sameSite: lax`**, `path: /api/early-access` (`helpers/atribucion.js:271-277`) |

**Middlewares de sesión de usuario:**
- `verificarTokenSesion` (`middlewares/validar-jwt-cookies-sesion.js:58-70`, lógica en `resolverSesion` `:28-55`): exige cookie `accessToken`; verifica firma HS256 y expiración; exige claim `sid`; consulta **en paralelo** `Usuario.findById` y `UserToken.exists({ sessionId: sid, userId, expiraEn > now })` (sin caché); aplica `errorEstadoCuenta` (`helpers/estado-cuenta-sesion.js:17-28`) y compara `tokenVersion`. Deja `req.usuario` (ObjectId string) y **`req.sessionId`** (el `sid`). Un fallo de BD → 500, nunca 401.
- `verificarTokenSesionOpcional` (`:74-87`): misma lógica, pero **nunca** responde error (tampoco ante fallo de BD); si falla deja `req.usuario` y `req.sessionId` sin definir. Una sesión revocada se trata como anónima.

### Errores comunes de la sesión de usuario

Toda ruta con `verificarTokenSesion` puede responder estos errores **antes** de llegar al controlador. Decidir siempre por `code`, nunca por `detail`.

| Status | code | title | detail | Cuándo | Dónde | Acción del frontend |
|---|---|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" | Sin cookie `accessToken` | `middlewares/validar-jwt-cookies-sesion.js:60` | Intentar `POST /api/auth/refresh` una vez |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido" | Access vencido, firma inválida o algoritmo ≠ HS256 | `:34` | Intentar `POST /api/auth/refresh` una vez |
| 401 | `SESSION_REVOKED` | Authentication Required | "La sesión fue cerrada. Inicia sesión nuevamente." | Access sin `sid` (anterior al rediseño), o su sesión ya no existe o venció (logout, cierre remoto, cambio/reset de contraseña, borrado de cuenta, TTL) | `:38`, `:46` (clase `errors/error-classes.js:59-63`) | **No** refrescar: limpiar estado local e ir al login |
| 401 | `UNAUTHORIZED` | Authentication Required | "Token no válido - usuario no existe" | Usuario inexistente o `estatus: 4` | `helpers/estado-cuenta-sesion.js:20` vía `:48-49` | Ir al login |
| 403 | `FORBIDDEN` | Forbidden | "Cuenta no activada. El usuario debe verificar su cuenta" | `estatus: 0` o `email_validated: false` | `helpers/estado-cuenta-sesion.js:23` vía `:48-49` | Ir a verificación |
| 403 | `ACCOUNT_RESTRICTED` | Forbidden | "Tu cuenta está restringida" | `estatus` 2 (violó reglas) o 3 (suspendida); **la sesión no se borra** (decisión B1) | `helpers/estado-cuenta-sesion.js:26` vía `:48-49` (clase `errors/error-classes.js:78-82`) | **No** refrescar: cerrar sesión local y mostrar "cuenta restringida" |
| 401 | `UNAUTHORIZED` | Authentication Required | "Sesión expirada - inicia sesión nuevamente" | `tokenVersion` distinto con la sesión todavía viva (en la práctica casi inalcanzable: toda revocación con `tokenVersion++` borra también las filas) | `:51-53` | Intentar refresh; el refresh responderá `SESSION_REVOKED` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | Genérico fuera de desarrollo | Fallo de BD en el middleware | `:67-68` → `middlewares/error-handler.js:113-123` | Error genérico; no cerrar sesión |

Orden de evaluación (`resolverSesion`, `:28-55`): firma → `sid` → (consultas en paralelo) sesión viva → estado de la cuenta → `tokenVersion`. Por eso una cuenta suspendida **con la sesión ya cerrada** recibe `SESSION_REVOKED`, no `ACCOUNT_RESTRICTED`. El mismo `errorEstadoCuenta` lo aplica `POST /api/auth/refresh` (ver [auth.md](auth.md)).

**Middlewares de sesión del panel:**
- `verificarSesionAdmin` (`admin/middlewares/verificar-sesion.js:18-43`): cookie `adminAccessToken`; carga `Admin`; 403 si `activo: false`; compara `tokenVersion` (`tv`). Deja `req.admin`.
- `validarPreAuthToken` (`:51-73`): body `preAuthToken` (o header `x-preauth-token`); exige claim `preauth: true`.
- `verificarSesionOPreAuth` (`:84-90`): si viene `preAuthToken` usa ese; si no, la cookie.
- `verificarPermisoAdmin('<recurso>:<acción>')` (`admin/middlewares/verificar-permiso.js:18-29`): 403 si el permiso no está en `Admin.permisos` (o `*`). Catálogo en `admin/helpers/permisos.js:14-41`.

**Roles del panel** (`admin/helpers/permisos.js:44-58`): `SUPERADMIN = ['*']`; `MODERADOR` = `moderacion:leer`, `moderacion:resolver`, `moderacion:descartar`, `moderacion:recategorizar`, `posteos:ocultar`, `posteos:restaurar`. **`MODERADOR` no tiene `influencers:*` ni `cuentas:*`** (el enum `Admin.rol` solo admite `SUPERADMIN` y `MODERADOR`).

### Formato de éxito

Helpers: `helpers/responder.js` (`responder`, `responderPaginado`).

```json
{ "success": true, "msg": "Texto opcional", "data": { ... } }
```

- `msg` solo aparece si el controlador lo pasa; `data` solo si existe.
- **Excepciones al envelope** (no usan `responder`):
  - `GET /` y `GET /api/health` → JSON plano (`controllers/bienvenida.js`).
  - `POST /api/early-access` → `{ "ok": true, "contacto": "...", "msg": "..." }` (`controllers/earlyaccess.js:65-69`), contrato intencional según AGENTS.md.
  - `GET /api/early-access/atribucion` → `204` sin cuerpo.
  - `validarUrlUsuario` (en `GET /api/usuarios/:url`) puede responder `200` con `{ success, msg: "La URL ha cambiado", data: { urlActual, redirect: "permanent" } }` y cabecera `Location` **sin código 301** (`middlewares/validar-url-usuario.js:16-26`).

**Respuesta paginada** (`responderPaginado`, `helpers/responder.js:34-50`):

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1, "limit": 15, "total": 42, "totalPages": 3,
    "next": "/api/posteos?page=2&limite=15",
    "prev": null
  }
}
```

Nota: en las respuestas paginadas **no viene `msg`**. Los enlaces `next`/`prev` son rutas relativas que reconstruyen el query con `page`, `limite` **y los filtros extra** que el controlador pase en `extraQuery` (hoy: `tipo` en `GET /api/notificaciones`; `orden` y `cursor` en `GET /api/comentarios/:posteoId/comentarios`, `helpers/responder.js:38-44`). Nunca emiten `limit`.

### Paginación

- Parámetro canónico: **`limite`**. Alias de compatibilidad: **`limit`** (`req.query.limite ?? req.query.limit`).
- `page` default `1`.
- **Los valores por defecto y los límites NO son uniformes** (ver tabla):

| Endpoint | Default `limite` | Máximo | Cómo se valida |
|---|---|---|---|
| `GET /api/posteos` | 15 | **sin máximo** | `isNumeric()` (422 si no es número) |
| `GET /api/posteos/usuario/:idUsuario` | 15 | **sin máximo** | `isNumeric()` |
| `GET /api/comentarios/:posteoId/comentarios` | **10** | **100** (clamp silencioso) | `isNumeric()` + clamp `Math.min(100, …)` |
| `GET /api/favoritos` | 15 | sin máximo | `isNumeric()` + mínimo 1 (clamp) |
| `GET /api/notificaciones` | **20** | **100** (clamp silencioso) | clamp mínimo 1 + `Math.min(100, …)`; filtro `tipo` validado con 422 |
| `GET /api/v1/admin/moderacion/reportes` | 15 | **100** | `isInt({min:1,max:100})` → 422 |
| `GET /api/v1/admin/influencers` | 15 | **100** | `isInt({min:1,max:100})` → 422 |

- En el panel, `page` tiene máximo `10000` (`isInt({max:10000})`, 422 si excede).
- **`limite=0` en `GET /api/posteos` o `/usuario/:id`:** `Number("0")` → `limit(0)` en MongoDB significa "sin límite"; ver §Hallazgos.
- En notificaciones y comentarios el tope de 100 es un **clamp silencioso** (no hay 422); en el panel y en el feed es validación con 422 (feed: `page` 1–1000 y `limite` 1–50).

### Formato de error (RFC 9457)

Implementado en `middlewares/error-handler.js` y en las clases de `errors/`. Forma real de la respuesta (`errors/app-error.js:40-51`):

```json
{
  "type": "about:blank",
  "title": "Authentication Required",
  "status": 401,
  "detail": "No hay token en la petición",
  "instance": "/api/usuarios/update",
  "code": "UNAUTHORIZED",
  "trace_id": "req_829a8f1b-be1"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `type` | string | Siempre `"about:blank"` |
| `title` | string | Título fijo por clase (tabla abajo) |
| `status` | number | Código HTTP |
| `detail` | string | Mensaje específico. **4xx: se devuelve tal cual, también en producción. 5xx: fuera de `NODE_ENV=development` se sustituye por `"Ocurrió un error inesperado. Por favor, intente más tarde."`** (`middlewares/error-handler.js:36-45`) |
| `instance` | string | `req.originalUrl` |
| `code` | string | Código machine-readable (**en MAYÚSCULAS** en el código real) |
| `trace_id` | string | `req.traceId` (cabecera de cliente `X-Trace-Id` o `req_<uuid12>`) |
| `errors` | array | Solo en validación/conflicto de correo: `[{ field, code, message }]` |
| `retry_after` | number | Solo en `RateLimitError` (segundos) |
| `stack` | string | **Solo con `NODE_ENV=development`** |

**Clases de error del dominio** (`errors/error-classes.js`):

| HTTP | Clase | `code` (real) | `title` | Línea |
|---|---|---|---|---|
| 400 | `BadRequestError` | `BAD_REQUEST` | `Bad Request` | `:14` |
| 401 | `AuthenticationError` | `UNAUTHORIZED` | `Authentication Required` | `:21` |
| 401 | `InvalidCurrentPasswordError` (default "La contraseña actual es incorrecta"; **no** disparar refresh) | `INVALID_CURRENT_PASSWORD` | `Authentication Required` | `:33` |
| 401 | `ExpiredTokenError` (default "El enlace ha expirado"; enlaces de correo) | `TOKEN_EXPIRED` | `Authentication Required` | `:47` |
| 401 | `SessionRevokedError` (default "La sesión fue cerrada. Inicia sesión nuevamente."; **no** disparar refresh) | `SESSION_REVOKED` | `Authentication Required` | `:59` |
| 403 | `ForbiddenError` | `FORBIDDEN` | `Forbidden` | `:66` |
| 403 | `AccountRestrictedError` (default "Tu cuenta está restringida"; estatus 2/3) | `ACCOUNT_RESTRICTED` | `Forbidden` | `:78` |
| 404 | `NotFoundError` | `NOT_FOUND` | `Resource Not Found` | `:85` |
| 409 | `ConflictError` | `CONFLICT` | `Conflict` | `:92` |
| 409 | `InfluencerCodeNotReusableError` | `INFLUENCER_CODE_NOT_REUSABLE` | `Conflict` | `:106` |
| 410 | `GoneError` (**no se usa en ningún endpoint**) | `GONE` | `Gone` | `:113` |
| 422 | `ValidationError` | `VALIDATION_FAILED` | `Validation Failed` | `:120` |
| 429 | `RateLimitError` | `RATE_LIMIT_EXCEEDED` | `Rate Limit Exceeded` | `:131` |
| 500 | `InternalError` | `INTERNAL_ERROR` | `Internal Server Error` | `:144` |

**Errores generados por el error handler** (`middlewares/error-handler.js`):

| Origen | HTTP | `code` | `title` | Línea |
|---|---|---|---|---|
| Multer `LIMIT_*` (no mapeado) | 400 | `FILE_ERROR` | `File Upload Error` | `:48-63` |
| Error de express-validator (`.array()`) | 422 | `VALIDATION_FAILED` | `Validation Failed` | `:66-82` |
| JSON malformado (`entity.parse.failed`) | 400 | `INVALID_JSON` | `Invalid JSON` | `:85-95` |
| Duplicado Mongo `E11000` (`err.code === 11000`) | 409 | `CONFLICT` (con `errors[0].code = "DUPLICATE_KEY"`) | `Conflict` | `:98-110` |
| Cualquier otro error | 500 | `INTERNAL_ERROR` | `Internal Server Error` | `:113-123` |

**Ocultamiento del `detail` en 5xx** (`:36-45`): para un `AppError` con `statusCode >= 500` y `NODE_ENV !== 'development'`, el handler reemplaza el `detail` por `"Ocurrió un error inesperado. Por favor, intente más tarde."`. El `code` sí se conserva (p. ej. `INTERNAL_ERROR`), el `trace_id` se conserva y el `stack` solo aparece en development. Los **4xx** (`BAD_REQUEST`, `VALIDATION_FAILED`, `NOT_FOUND`, `CONFLICT`, `TOKEN_EXPIRED`, `SESSION_REVOKED`, `ACCOUNT_RESTRICTED`, …) mantienen su `detail` real en producción, así que muchos `detail` citados en los dominios siguen siendo observables por el cliente. El catch-all de errores no contemplados (`:113-123`) aplica la misma regla.

### Rate limiting

Todos los limiters de la red social usan `validate: false` y responden RFC 9457 con un `code` propio (`helpers/crear-limiter.js:19-29,46-54`). Los de la red social **no incluyen `retry_after`**; sí lo incluyen los `RateLimitError` de los controladores. El almacén es **en memoria por proceso** (`express-rate-limit` por defecto) → **[REQUIERE VERIFICACIÓN MANUAL]** si hay más de una instancia desplegada.

Regla de doble capa (desde 2026-11-10): todo limiter cuya clave incluya un valor controlado por el cliente (token, correo, `sid`) lleva delante una capa IP-only. Los 5 endpoints de flujo de token comparten `flujoTokenIpLimiter` (60/15 min), `password-olvidado` tiene la capa dedicada `recuperacionSolicitudIpLimiter` (10/15 min) y `POST /api/auth/refresh` lleva `refreshIpLimiter` (300/15 min) delante del limiter por sesión. El componente de token de las claves pasa por `claveToken` (`helpers/ip-cliente.js:166-171`): SHA-256 del token trimmeado, 32 hex, case-sensitive, nunca el token crudo. La IP siempre sale de `ipCliente(req)`, nunca de `req.ip`.

**Topes por IP dimensionados para NAT/CGNAT** (`middlewares/rate-limiter.js:264-306`): los `flood*` y el polling son solo un freno anti-flood; el límite fino lo ponen los limiters por usuario que van detrás. Sus máximos se leen de env con `enteroPositivoEnv` (`helpers/entero-env.js`): valor vacío, `0`, negativo o no numérico → default. Variables: `FLOOD_LECTURA_IP_MAX` (default 3000), `FLOOD_ESCRITURA_IP_MAX` (default 600), `POLLING_IP_MAX` (default 3000). Los valores vigentes en producción se consultan en el dashboard de App Platform → **[REQUIERE VERIFICACIÓN MANUAL]**.

| Limiter | Archivo:línea | Ventana | Máximo | Clave | Código |
|---|---|---|---|---|---|
| `loginLimiter` | `middlewares/rate-limiter.js:18-32` | 15 min | 5 | IP + correo (fallback IP) | `LOGIN_BLOCKED` |
| `flujoTokenIpLimiter` | `:41-51` | 15 min | 60 | solo IP (instancia compartida por los 5 endpoints de flujo de token) | `FLOOD_BLOCKED` |
| `recuperacionSolicitudIpLimiter` | `:59-69` | 15 min | 10 | solo IP (dedicado a `password-olvidado`) | `RECOVERY_BLOCKED` |
| `recuperacionSolicitudLimiter` | `:74-88` | 15 min | 3 | IP + correo | `RECOVERY_BLOCKED` |
| `recuperacionReenvioLimiter` | `:90-104` | 15 min | 3 | IP + token | `RECOVERY_BLOCKED` |
| `recuperacionValidarTokenLimiter` | `:106-120` | 15 min | 20 | IP + token | `RECOVERY_BLOCKED` |
| `recuperacionResetLimiter` | `:122-136` | 15 min | 5 | IP + token | `RECOVERY_BLOCKED` |
| `verificacionLimiter` | `:140-154` | 15 min | 20 | IP + token | `VERIFICATION_BLOCKED` |
| `reenvioCorreoLimiter` | `:157-171` | 5 min | 3 | IP + token | `EMAIL_BLOCKED` |
| `registroLimiter` | `:174-183` | 1 h | **10** | IP | `REGISTER_BLOCKED` |
| `soporteLimiter` | `:186-195` | 15 min | 5 | IP | `SOPORTE_BLOCKED` |
| `lecturaLimiter` | `:198-207` | 15 min | 100 | IP | `READ_BLOCKED` (legacy, no se usa en rutas sociales) |
| `posteoPublicoLimiter` | `:210-219` | 15 min | 100 | IP | `POST_DETAIL_BLOCKED` |
| `refreshIpLimiter` | `:224-233` | 15 min | **300** | solo IP (delante de `refreshLimiter`) | `REFRESH_BLOCKED` |
| `refreshLimiter` | `:237-247` | 15 min | 10 | **`sid`** de la cookie `refreshToken` (ver nota al pie; `claveSesionRefresh`, `helpers/clave-limite.js:67-78`) | `REFRESH_BLOCKED` |
| `healthLimiter` | `:250-259` | 1 min | 60 | IP | `HEALTH_BLOCKED` |
| `floodLecturaIpLimiter` | `:270-279` | 15 min | **3000** (env `FLOOD_LECTURA_IP_MAX`) | IP | `FLOOD_BLOCKED` |
| `floodEscrituraIpLimiter` | `:282-291` | 15 min | **600** (env `FLOOD_ESCRITURA_IP_MAX`) | IP | `FLOOD_BLOCKED` |
| `pollingIpLimiter` | `:297-306` | 15 min | **3000** (env `POLLING_IP_MAX`) | IP (cubo propio del polling) | `FLOOD_BLOCKED` |
| `feedUsuarioLimiter` | `:309-314` | 15 min | 200 | usuario | `READ_BLOCKED` |
| `comentariosUsuarioLimiter` | `:317-322` | 15 min | 300 | usuario | `READ_BLOCKED` |
| `notificacionesUsuarioLimiter` | `:325-330` | 15 min | 120 | usuario | `READ_BLOCKED` |
| `socialUsuarioLimiter` | `:333-338` | 15 min | 300 | usuario | `READ_BLOCKED` |
| `catalogoUsuarioLimiter` | `:341-346` | 15 min | 100 | usuario | `READ_BLOCKED` |
| `posteoUsuarioLimiter` | `:349-354` | 15 min | 20 | usuario | `POSTEO_BLOCKED` |
| `comentarioUsuarioLimiter` | `:357-362` | 1 min | 10 | usuario | `COMENTARIO_BLOCKED` |
| `reporteUsuarioLimiter` | `:365-370` | 15 min | 10 | usuario | `REPORTE_BLOCKED` |
| `imagenUsuarioLimiter` | `:373-378` | 15 min | 10 | usuario | `IMAGEN_BLOCKED` |
| `cuentaUsuarioLimiter` | `:381-386` | 15 min | 10 | usuario | `CUENTA_BLOCKED` |
| `passwordUsuarioLimiter` | `:391-396` | 15 min | 5 | usuario | `PASSWORD_BLOCKED` (compartido entre `PUT /api/usuarios/password`, `DELETE /api/usuarios/delete` y `DELETE /api/auth/sesiones/otras`) |
| `sesionesUsuarioLimiter` | `:401-406` | 15 min | 30 | usuario | `SESIONES_BLOCKED` (compartido por `GET /api/auth/sesiones` y los dos `DELETE /api/auth/sesiones*`; detrás de `floodLecturaIpLimiter`/`floodEscrituraIpLimiter`) |
| `EARLY_ACCESS` (POST) | `routes/earlyaccess.js:8` | 10 min (env `EARLY_ACCESS_RATE_LIMIT_WINDOW_MS`) | 5 (env `EARLY_ACCESS_RATE_LIMIT_MAX`) | IP | `EARLY_ACCESS_BLOCKED` |
| `atribucionLimiter` | `routes/earlyaccess.js:30` | 1 min (env) | 60 (env) | IP | `ATRIBUCION_BLOCKED` |
| `adminLoginLimiter` | `admin/middlewares/rate-limiter.js:23` | 15 min | 5 | IP + correo | `ADMIN_LOGIN_BLOCKED` |
| `adminTotpLimiter` | `:43` | 5 min | 5 | IP | `ADMIN_TOTP_BLOCKED` |
| `adminRefreshLimiter` | `:58` | 15 min | 10 | IP | `ADMIN_REFRESH_BLOCKED` |
| `adminModeracionLecturaLimiter` | `:73` | 15 min | 300 | `Admin._id` | `ADMIN_MODERACION_BLOCKED` |
| `adminModeracionEscrituraLimiter` | `:92` | 15 min | 60 | `Admin._id` | `ADMIN_MODERACION_BLOCKED` |
| `adminInfluencersLecturaLimiter` | `:111` | 15 min | 300 | `Admin._id` | `ADMIN_INFLUENCERS_BLOCKED` |
| `adminInfluencersEscrituraLimiter` | `:130` | 15 min | 60 | `Admin._id` | `ADMIN_INFLUENCERS_BLOCKED` |

**Nota al pie (clave del `refreshLimiter`):** se lee **sin verificar la firma** (`sid:<uuid>` si la cookie trae un `sid` con formato UUID; `tok:<hash>` si el token es ilegible; `ip:<claveIp>` si no hay cookie). Es solo una clave de cubo, nunca una decisión de autorización; por eso el techo por IP (`refreshIpLimiter`) va obligatoriamente delante (`helpers/clave-limite.js:51-78`).

Además, `RateLimitError` (429, `code: RATE_LIMIT_EXCEEDED`) se lanza desde controladores para bloqueos de cuenta y cooldowns (login de usuario, reenvío de correo, cambio de nombre, bloqueo del panel). Esos sí incluyen `retry_after`.

### CORS y CSRF

- **CORS** (`models/server.js:83-111`): sin cabecera `Origin` → permitido. Con `NODE_ENV=development` → **todo origen permitido**. Si no: origen en `FRONTEND_URL`, `ADMIN_FRONTEND_URL` o `CSRF_ALLOWED_ORIGINS` (CSV). `credentials: true`.
  - `exposedHeaders: ['Retry-After', 'RateLimit', 'RateLimit-Policy', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset']` (`:110`): el frontend puede leer `Retry-After` y `RateLimit-*` **cross-origin** para esperar el tiempo exacto tras un `429`. No contienen datos sensibles.
  - Origen no permitido → `callback(new Error('Origen no permitido por CORS'))` → `cors` lo reenvía con `next(err)` (`node_modules/cors/lib/index.js:206`) → el error handler lo convierte en **500 `INTERNAL_ERROR`** (ver §Hallazgos).
- **CSRF** (`middlewares/validar-origen.js`): para `POST/PUT/PATCH/DELETE` se exige `Origin` (o `Referer`) en la allow-list (mismas variables que CORS, más `ADMIN_FRONTEND_URL`):
  - Sin Origin/Referer: en `NODE_ENV=production` → **403** `"Origen no permitido"` (`:49-54`); fuera de producción pasa.
  - Origin no permitido → **403** `"Origen no permitido"` (`:57-59`).
  - Origin mal formado → **403** `"Origen inválido"` (`:61`).
  - Los `GET`, `HEAD` y `OPTIONS` no se validan (`:43`).

### Cabeceras y formato de envío para el frontend

- JSON: `Content-Type: application/json` en todas las peticiones con body (salvo `PUT /api/uploads/:coleccion`, que es `multipart/form-data`).
- Todas las peticiones autenticadas deben enviar cookies: `credentials: 'include'` (o `withCredentials: true`).
- Las cookies usan `sameSite: none` + `secure: true`: requieren HTTPS en el origen de la API.
- Cabecera de respuesta `X-Trace-Id` (no está presente en los rechazos de CORS/CSRF).
- Ante un `429`, leer `Retry-After` (segundos) y `RateLimit-*`: están **expuestos por CORS** (`models/server.js:110`), así que son legibles desde el navegador cross-origin. Los 429 emitidos por los limiters de Express no traen `retry_after` en el cuerpo; los de controlador, sí.
- Si el `429` **no** es JSON (página HTML), viene de la regla de Cloudflare (300 req/10 s por IP, error 1015): trátalo como error genérico, no como un `code` de la API.

---

## Tabla de endpoints

Leyenda de auth: **Público**, **Usuario** (`verificarTokenSesion`), **Opcional** (`verificarTokenSesionOpcional`), **Refresh** (cookie refresh), **Panel** (`verificarSesionAdmin`), **Panel+permiso** (`verificarSesionAdmin` + `verificarPermisoAdmin`), **PreAuth/Sesión** (`verificarSesionOPreAuth`).

### Bienvenida y salud — [bienvenida.md](bienvenida.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 1 | GET | `/` | Público | — |
| 2 | GET | `/api/health` | Público | `healthLimiter` |

### Auth de usuarios — [auth.md](auth.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 3 | GET | `/api/auth/verificar-correo{/:token}` | Público | `verificacionLimiter` |
| 4 | POST | `/api/auth/reenviar-correo` | Público | `reenvioCorreoLimiter` |
| 5 | POST | `/api/auth/login` | Público | `loginLimiter` |
| 6 | POST | `/api/auth/cuentas/password-olvidado` | Público | `recuperacionSolicitudLimiter` |
| 7 | POST | `/api/auth/reenviar-correo-restablecer-password` | Público | `recuperacionReenvioLimiter` |
| 8 | GET | `/api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}` | Público | `recuperacionValidarTokenLimiter` |
| 9 | POST | `/api/auth/cuentas/reestablecer-password{/:token}` | Público | `recuperacionResetLimiter` |
| 10 | POST | `/api/auth/refresh` | Refresh (cookie `refreshToken`) | `refreshIpLimiter` + `refreshLimiter` (clave `sid`) |
| 11 | POST | `/api/auth/logout` | Público (cookies opcionales; identifica la sesión por `sid`) | — |
| 12 | GET | `/api/auth/me` | Usuario | — |
| 13 | GET | `/api/auth/sesiones` | Usuario | `floodLecturaIpLimiter` + `sesionesUsuarioLimiter` |
| 14 | DELETE | `/api/auth/sesiones/otras` | Usuario + contraseña | `floodEscrituraIpLimiter` + `sesionesUsuarioLimiter` + `passwordUsuarioLimiter` |
| 15 | DELETE | `/api/auth/sesiones/:sessionId` | Usuario | `floodEscrituraIpLimiter` + `sesionesUsuarioLimiter` |

### Usuarios — [usuarios.md](usuarios.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 16 | GET | `/api/usuarios/:url` | Usuario | `floodLecturaIpLimiter` + `catalogoUsuarioLimiter` |
| 17 | POST | `/api/usuarios` | Público | `registroLimiter` |
| 18 | PUT | `/api/usuarios/update` | Usuario | `floodEscrituraIpLimiter` + `cuentaUsuarioLimiter` |
| 19 | PUT | `/api/usuarios/password` | Usuario + contraseña | `floodEscrituraIpLimiter` + `passwordUsuarioLimiter` |
| 20 | DELETE | `/api/usuarios/delete` | Usuario + contraseña | `floodEscrituraIpLimiter` + `cuentaUsuarioLimiter` + `passwordUsuarioLimiter` |
| 21 | GET | `/api/usuarios/registrados/nuevos-usuarios-registrados` | Usuario | `pollingIpLimiter` + `catalogoUsuarioLimiter` |

### Imagen de perfil — [uploads.md](uploads.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 22 | PUT | `/api/uploads/:coleccion` | Usuario | `floodEscrituraIpLimiter` + `imagenUsuarioLimiter` |

### Posteos — [posteos.md](posteos.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 23 | GET | `/api/posteos` | Usuario | `floodLecturaIpLimiter` + `feedUsuarioLimiter` |
| 24 | GET | `/api/posteos/post/:id` | Opcional | `posteoPublicoLimiter` |
| 25 | GET | `/api/posteos/usuario/:idUsuario` | Usuario | `floodLecturaIpLimiter` + `feedUsuarioLimiter` |
| 26 | POST | `/api/posteos` | Usuario | `floodEscrituraIpLimiter` + `posteoUsuarioLimiter` |
| 27 | PUT | `/api/posteos/:id` | Usuario | `floodEscrituraIpLimiter` + `posteoUsuarioLimiter` |
| 28 | DELETE | `/api/posteos/:id/ubicacion` | Usuario | `floodEscrituraIpLimiter` + `posteoUsuarioLimiter` |
| 29 | DELETE | `/api/posteos/:id` | Usuario | `floodEscrituraIpLimiter` + `posteoUsuarioLimiter` |

### Likes — [likes.md](likes.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 30 | POST | `/api/likes/:id/like` | Usuario | `floodEscrituraIpLimiter` + `socialUsuarioLimiter` |
| 31 | GET | `/api/likes/posteo/:id` | Usuario | `floodLecturaIpLimiter` + `socialUsuarioLimiter` |
| 32 | GET | `/api/likes/:id/likes/usuarios` | Usuario | `floodLecturaIpLimiter` + `socialUsuarioLimiter` |

### Followers — [followers.md](followers.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 33 | POST | `/api/followers/follow/:id` | Usuario | `floodEscrituraIpLimiter` + `socialUsuarioLimiter` |
| 34 | DELETE | `/api/followers/unfollow/:id` | Usuario | `floodEscrituraIpLimiter` + `socialUsuarioLimiter` |
| 35 | GET | `/api/followers/usuario/lista-followers/:id` | Usuario | `floodLecturaIpLimiter` + `socialUsuarioLimiter` |
| 36 | GET | `/api/followers/usuario/lista-followings/:id` | Usuario | `floodLecturaIpLimiter` + `socialUsuarioLimiter` |

### Favoritos — [favoritos.md](favoritos.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 37 | GET | `/api/favoritos` | Usuario | `floodLecturaIpLimiter` + `socialUsuarioLimiter` |
| 38 | POST | `/api/favoritos/:posteoId` | Usuario | `floodEscrituraIpLimiter` + `socialUsuarioLimiter` |
| 39 | DELETE | `/api/favoritos/:posteoId` | Usuario | `floodEscrituraIpLimiter` + `socialUsuarioLimiter` |

### Comentarios — [comentarios.md](comentarios.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 40 | POST | `/api/comentarios/:posteoId/comentarios` | Usuario | `floodEscrituraIpLimiter` + `comentarioUsuarioLimiter` |
| 41 | GET | `/api/comentarios/:posteoId/comentarios` | Usuario | `floodLecturaIpLimiter` + `comentariosUsuarioLimiter` |
| 42 | GET | `/api/comentarios/:posteoId/comentarios/count` | Usuario | `floodLecturaIpLimiter` + `comentariosUsuarioLimiter` |
| 43 | DELETE | `/api/comentarios/:comentarioId` | Usuario | `floodEscrituraIpLimiter` + `comentarioUsuarioLimiter` |
| 44 | PUT | `/api/comentarios/:posteoId/comentarios/toggle` | Usuario | `floodEscrituraIpLimiter` + `comentarioUsuarioLimiter` |

### Reportes — [reportes.md](reportes.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 45 | POST | `/api/reportes/:posteoId` | Usuario | `floodEscrituraIpLimiter` + `reporteUsuarioLimiter` |

### Municipios y ubicación — [municipios-ubicacion.md](municipios-ubicacion.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 46 | GET | `/api/municipios` | Usuario | `floodLecturaIpLimiter` + `catalogoUsuarioLimiter` |
| 47 | GET | `/api/municipios/:claveMunicipio/localidades` | Usuario | `floodLecturaIpLimiter` + `catalogoUsuarioLimiter` |
| 48 | POST | `/api/ubicacion/reverse` | Usuario | `floodEscrituraIpLimiter` + `catalogoUsuarioLimiter` |
| 49 | GET | `/api/ubicacion` | Usuario | `floodLecturaIpLimiter` + `catalogoUsuarioLimiter` |

### Notificaciones — [notificaciones.md](notificaciones.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 50 | POST | `/api/notificaciones/subscribe` | Usuario | `floodEscrituraIpLimiter` + `notificacionesUsuarioLimiter` |
| 51 | POST | `/api/notificaciones/unsubscribe` | Usuario | `floodEscrituraIpLimiter` + `notificacionesUsuarioLimiter` |
| 52 | GET | `/api/notificaciones/vapidPublicKey` | **Público** (sin sesión desde 2026-11-25) | `floodLecturaIpLimiter` |
| 53 | GET | `/api/notificaciones/estado` | Usuario | `floodLecturaIpLimiter` + `notificacionesUsuarioLimiter` |
| 54 | GET | `/api/notificaciones/preferencias` | Usuario | `floodLecturaIpLimiter` + `notificacionesUsuarioLimiter` |
| 55 | PUT | `/api/notificaciones/preferencias` | Usuario | `floodEscrituraIpLimiter` + `notificacionesUsuarioLimiter` |
| 56 | DELETE | `/api/notificaciones/dispositivos/:id` | Usuario | `floodEscrituraIpLimiter` + `notificacionesUsuarioLimiter` |
| 57 | GET | `/api/notificaciones` | Usuario | `floodLecturaIpLimiter` + `notificacionesUsuarioLimiter` |
| 58 | PATCH | `/api/notificaciones/marcar-todas-leidas` | Usuario | `floodEscrituraIpLimiter` + `notificacionesUsuarioLimiter` |
| 59 | DELETE | `/api/notificaciones` | Usuario | `floodEscrituraIpLimiter` + `notificacionesUsuarioLimiter` |
| 60 | PATCH | `/api/notificaciones/marcar-notificacion-leida/:id` | Usuario | `floodEscrituraIpLimiter` + `notificacionesUsuarioLimiter` |
| 61 | GET | `/api/notificaciones/nuevas-notificaciones` | Usuario | `pollingIpLimiter` + `notificacionesUsuarioLimiter` |
| 62 | DELETE | `/api/notificaciones/eliminar-notificacion/:id` | Usuario | `floodEscrituraIpLimiter` + `notificacionesUsuarioLimiter` |

### Soporte — [soporte.md](soporte.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 63 | POST | `/api/ayuda-soporte/envio-correo` | Usuario | `soporteLimiter` |

### Acceso anticipado — [early-access.md](early-access.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 64 | GET | `/api/early-access/atribucion` | Público | `atribucionLimiter` |
| 65 | POST | `/api/early-access` | Público | `EARLY_ACCESS` (10 min / 5) |

### Panel — login, sesión, cambio de contraseña y TOTP — [admin-auth-totp.md](admin-auth-totp.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 66 | POST | `/api/v1/admin/auth/login` | Público | `adminLoginLimiter` |
| 67 | POST | `/api/v1/admin/auth/login/totp` | PreAuth | `adminTotpLimiter` |
| 68 | POST | `/api/v1/admin/auth/refresh` | Refresh (cookie) | `adminRefreshLimiter` |
| 69 | POST | `/api/v1/admin/auth/logout` | Público (usa cookie si existe) | — |
| 70 | GET | `/api/v1/admin/auth/me` | Panel | — |
| 71 | POST | `/api/v1/admin/auth/cambiar-password` | PreAuth/Sesión | — |
| 72 | POST | `/api/v1/admin/totp/setup` | PreAuth/Sesión | — |
| 73 | POST | `/api/v1/admin/totp/activate` | PreAuth/Sesión | `adminTotpLimiter` |
| 74 | POST | `/api/v1/admin/totp/backup/regenerar` | PreAuth/Sesión | `adminTotpLimiter` |
| 75 | POST | `/api/v1/admin/totp/reemitir` | PreAuth/Sesión | `adminTotpLimiter` |

### Panel — cuentas — [admin-cuentas.md](admin-cuentas.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 76 | POST | `/api/v1/admin/cuentas` | Panel+`cuentas:crear` | — |
| 77 | GET | `/api/v1/admin/cuentas` | Panel+`cuentas:leer` | — |
| 78 | PATCH | `/api/v1/admin/cuentas/:id` | Panel+`cuentas:desactivar` | — |

### Panel — moderación — [admin-moderacion.md](admin-moderacion.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 79 | GET | `/api/v1/admin/moderacion/reportes` | Panel+`moderacion:leer` | `adminModeracionLecturaLimiter` |
| 80 | GET | `/api/v1/admin/moderacion/reportes/:id` | Panel+`moderacion:leer` | `adminModeracionLecturaLimiter` |
| 81 | PUT | `/api/v1/admin/moderacion/reportes/:id/resolver` | Panel+`moderacion:resolver` | `adminModeracionEscrituraLimiter` |
| 82 | PUT | `/api/v1/admin/moderacion/reportes/:id/descartar` | Panel+`moderacion:descartar` | `adminModeracionEscrituraLimiter` |
| 83 | PUT | `/api/v1/admin/moderacion/reportes/:id/recategorizar` | Panel+`moderacion:recategorizar` | `adminModeracionEscrituraLimiter` |
| 84 | PUT | `/api/v1/admin/moderacion/posteos/:posteoId/ocultar` | Panel+`posteos:ocultar` | `adminModeracionEscrituraLimiter` |
| 85 | PUT | `/api/v1/admin/moderacion/posteos/:posteoId/restaurar` | Panel+`posteos:restaurar` | `adminModeracionEscrituraLimiter` |

### Panel — influencers — [admin-influencers.md](admin-influencers.md)

| # | Método | Ruta | Auth | Rate limiter |
|---|---|---|---|---|
| 86 | GET | `/api/v1/admin/influencers` | Panel+`influencers:leer` | `adminInfluencersLecturaLimiter` |
| 87 | GET | `/api/v1/admin/influencers/metricas` | Panel+`influencers:leer` | `adminInfluencersLecturaLimiter` |
| 88 | POST | `/api/v1/admin/influencers` | Panel+`influencers:crear` | `adminInfluencersEscrituraLimiter` |
| 89 | PATCH | `/api/v1/admin/influencers/:id` | Panel+`influencers:editar` | `adminInfluencersEscrituraLimiter` |
| 90 | DELETE | `/api/v1/admin/influencers/:id` | Panel+`influencers:eliminar` | `adminInfluencersEscrituraLimiter` |

> Conteo por dominio: bienvenida 2 · auth **13** · usuarios 6 · uploads 1 · posteos 7 · likes 3 · followers 4 · favoritos 3 · comentarios 5 · reportes 1 · municipios/ubicación 4 · notificaciones **13** · soporte 1 · early-access 2 → **65 (red social)**. Panel: auth/TOTP 10 · cuentas 3 · moderación 7 · influencers 5 → **25 (panel)**. **Total: 90** (contrastado con los registros `router.<método>(` de `routes/` y `admin/routes/`: 65 + 25). ✓ `inventario-endpoints.json` ya lista **90** entradas (`"total": 90`), incluidas las 6 rutas nuevas de notificaciones; lo actualizó el agente `sincronizador` el 2026-11-25.

---

## Resumen de la documentación, inconsistencias y hallazgos

### Totales

- **Endpoints documentados: 90** (red social **65** · panel 25). El inventario `docs/api/inventario-endpoints.json` está actualizado a **90** entradas (`"total": 90`, `actualizado: 2026-11-25`), incluidas las 6 rutas nuevas de notificaciones y la corrección de umbrales de rate limiting; lo actualizó el agente `sincronizador`.
- **Archivos de dominio: 18**, más este índice.
- **Método:** cada endpoint se trazó desde `routes/` o `admin/routes/` hasta su controlador, validadores, middlewares, modelo y helpers, y las citas de línea se tomaron de esos archivos. **No se levantó el servidor** (requiere MongoDB, Cloudinary y SMTP): todos los ejemplos son **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.
- **Pruebas de librería ejecutadas con Node** (scripts temporales, sin tocar código fuente): `validator` 13.15.35 (`isBoolean` y `isInt`) y lectura de `node_modules/cors/lib/index.js`.
- **Contraste con contratos:** se leyó `AGENTS.md` completo y `SPECS-FRONTEND-TEXTO-POSTEOS-COMENTARIOS.md` (coincide con el código: 500 posteos, 250 comentarios, regex Unicode). **Los demás `SPECS-*.md` no se revisaron en detalle en esta corrida.**
- **Corrida anterior:** `2026-11-17_19-57-42_documentacion-endpoints.md` (delta del sincronizador) y `2026-11-17_19-29-53_documentacion-endpoints.md` (sesiones Fase E). Este conjunto de archivos (README + dominios) se mantiene actualizado en el lugar; cada corrida añade solo su delta con marca de tiempo.

### Hallazgos de alta prioridad (verificados en código)

Ordenados por impacto en el frontend y en la seguridad. Ninguno se corrigió: son solo reporte. *(Excepción: H2 quedó mitigado en el código tras esta revisión; ver la corrección de 2026-11-10 en el encabezado.)*

| # | Hallazgo | Dónde |
|---|---|---|
| H1 | **Activar y desactivar cuentas del panel con strings.** `PATCH /api/v1/admin/cuentas/:id` con `{"activo":"false"}` **activa** la cuenta. El validador `isBoolean` acepta `"false"` y el controlador hace `Boolean(activo)`; `Boolean("false") === true`. | `admin/controllers/cuentas.js:148`; validador `admin/routes/index.js:130` |
| H2 | ~~**Toggle de comentarios con strings.**~~ **RESUELTO 2026-11-10.** `"activar": "true"` o `1` ya **no** desactivan los comentarios: `routes/comentarios.js:59` valida con `isBoolean({ strict: true })` y cualquier string o número se rechaza con 422 `VALIDATION_FAILED` antes de llegar al controlador (compara `activar === true` en `controllers/comentarios.js:290`). Verificado en ejecución con `express-validator` 7.3.2 + `validator` 13.15.35. | `routes/comentarios.js:59`; `controllers/comentarios.js:290` |
| H3 | ~~**La suspensión no corta sesiones existentes.**~~ **RESUELTO (2026-11-17, E4):** `verificarTokenSesion` y `POST /api/auth/refresh` aplican `errorEstadoCuenta`: estatus 2/3 → `403 ACCOUNT_RESTRICTED` en cada request y en el refresh (sin borrar la sesión, decisión B1). Verificado por `test/integration/verificar-sesion.test.js` (ejecutado en esta corrida). | `helpers/estado-cuenta-sesion.js:17-28`; `middlewares/validar-jwt-cookies-sesion.js:48-49`; `controllers/auth.js:478-479` |
| H4 | ~~**Tokens de correo y de reset expirados → 500, no 401/400.**~~ **RESUELTO (2026-11-10, H6 del code review):** responden 401 `TOKEN_EXPIRED`/`UNAUTHORIZED` (ver revisión 2026-11-10 y `auth.md`). Texto original: `validarJWT` rechaza con un objeto plano, que no es `AppError`, y los `catch` lo convierten en `InternalError`. Afecta a verificar-correo, reenviar-correo, validar-token-reset, reestablecer-password y reenviar-restablecer. Además, el `detail` expone el texto de `jsonwebtoken`. | `helpers/validar-jwt.js:9-15`; `controllers/auth.js:94,316,355,368`; `email/servicios-autenticacion-correo.js:225` |
| H5 | **Extensión o MIME no permitidos → 500.** `fileFilter` lanza un `Error` sin `code`; `validarImagenesMulter` lo reenvía y el handler global responde 500. Afecta a `PUT /api/uploads/:coleccion` y `POST /api/posteos`. | `helpers/multer.js:22,27`; `middlewares/validar-imagen-posteo.js:31`; `middlewares/error-handler.js:113-123` |
| H6 | **Origen CORS no permitido → 500.** El callback devuelve `Error` y `cors` lo reenvía con `next(err2)`; el handler global lo convierte en 500 sin cabeceras CORS. | `models/server.js:104`; `node_modules/cors/lib/index.js:219-221` |
| H7 | **Carrera de correo en el alta → 500, no 409.** Un `E11000` durante el `save()` cae en el `catch` genérico. | `controllers/usuarios.js:118-123` |
| H8 | ~~**Detalle interno en respuestas 5xx.**~~ **RESUELTO (2026-11-25, parcial por diseño):** `middlewares/error-handler.js:36-45` sustituye el `detail` de cualquier `AppError` con `statusCode >= 500` por `"Ocurrió un error inesperado. Por favor, intente más tarde."` cuando `NODE_ENV !== 'development'`. El `code` y el `trace_id` se conservan y el `stack` solo aparece en development. Los **4xx** siguen devolviendo su `detail` real (mensajes de validación, `TOKEN_EXPIRED`, etc.), que es lo esperado. Texto original: muchos controladores hacen `new InternalError(error.message)` y el handler devolvía el `detail` incluso en producción. | `middlewares/error-handler.js:36-45,113-123`; `controllers/auth.js` |
| H9 | **Paginación sin validar en el feed.** `page=0` (o negativo) da `skip` negativo y, según el driver, 500. `limite=0` equivale a sin límite en Mongo. Sigue **sin tope** de `limite` en posteos y favoritos; notificaciones y comentarios ya tienen tope 100 con clamp silencioso (2026-11-25). *(Probable; confirmar.)* | `controllers/posteos.js:88-90,263-265`; `controllers/favoritos.js:15`; `controllers/notificaciones.js:269-273` |
| H10 | **Cuenta de panel desactivada se revela sin contraseña.** `loginPaso1` responde 403 "desactivada" **antes** de verificar la contraseña. | `admin/controllers/auth.js:67` |
| H11 | ~~**Restablecer contraseña no revoca sesiones.**~~ **RESUELTO (E1a, commit `f022c39`; drift detectado el 2026-11-17):** guarda la contraseña, hace `tokenVersion++` y `UserToken.deleteMany` en una sola transacción. | `email/servicios-correo-reestablecer-password.js:229-240` |
| H12 | **Enumeración de cuentas y contactos.** `POST /api/usuarios` devuelve 409 si el correo existe; `POST /api/early-access` devuelve 409 con el contacto; ~~`password-olvidado` cambia la respuesta en cooldown (sin `data`)~~ **parcialmente resuelto (2026-11-10, O1):** la respuesta de `password-olvidado` ahora es idéntica en todos los casos (incluye `data.token` también en cooldown); persiste el 500 SMTP solo para cuentas elegibles y los 409 de registro/early-access. | `controllers/usuarios.js:76`; `controllers/earlyaccess.js:51`; `controllers/auth.js:271-318` |
| H13 | ~~**Cambio de contraseña sin contraseña actual.** `PUT /api/usuarios/update` acepta `password` solo con sesión válida.~~ **RESUELTO en `PUT /api/usuarios/update` (2026-11-13, E1b2):** el endpoint responde 422 `USE_PASSWORD_ENDPOINT` antes de escribir nada; el único camino para cambiar la contraseña con sesión es `PUT /api/usuarios/password` (exige `passwordActual` y cierra las demás sesiones). | `controllers/usuarios.js:136-141` (rechazo en PUT /update); `routes/usuarios.js:102-119` (PUT /password) |
| H14 | **Políticas de contraseña inconsistentes.** Registro: mayúscula, minúscula, número y especial. `PUT /update`: ya no acepta contraseña (2026-11-13, ver H13). Reestablecer: 8, sin complejidad. Panel `cambiar-password`: 12, sin complejidad. **Actualizado (2026-11-12):** el nuevo `PUT /api/usuarios/password` exige las reglas completas del registro (8–128 + complejidad, `routes/usuarios.js:113-117`); persiste la inconsistencia en reestablecer y panel. | `routes/usuarios.js:53-54,113-117`; `routes/auth.js:66`; `admin/routes/index.js:77` |
| H15 | ~~**`/api/health` expone datos internos sin autenticación**~~ **RESUELTO (2026-11-10):** la respuesta se redujo a `{ "status": "ok" \| "degraded" }` (`controllers/bienvenida.js:12-15`); ya no expone `pid`, memoria ni `environment`. | `controllers/bienvenida.js:12-15` |
| H16 | **`POST /api/favoritos/:posteoId` confía en `autorId` del cliente.** No se compara con el autor real del posteo, así que el favorito guarda un autor arbitrario. | `controllers/favoritos.js:113,124` |
| H17 | **Quitar el ocultamiento sin `reporteId` rompe la restauración.** `ocultarPosteo` sin `reporteId` escribe `ocultadoPorReporteId: null`, y el descarte ya no restaura el posteo. | `admin/controllers/moderacion.js:552` |
| H18 | **Errores de CORS y CSRF sin `trace_id` útil.** `traceId` se registra después de `validarOrigen` y de CORS, así que esos rechazos devuelven `trace_id: "unknown"` y sin `X-Trace-Id`. | `models/server.js:115,117` |
| H19 | **Cuerpos grandes → 500.** `express.json()` usa el límite por defecto (100 kb) y el error `entity.too.large` no tiene rama propia en el handler. *(Derivado; confirmar.)* | `models/server.js:113`; `middlewares/error-handler.js` |
| H20 | **Respuesta 201 seguida de errores (riesgo residual).** En comentarios y seguidores el `responder` ocurre antes de las notificaciones y el `await notificar(...)` sigue dentro del `try` del controlador; como `notificar()` **nunca lanza** (`helpers/notificar.js:257-260`), hoy no puede llegar un `next(err)` con la respuesta ya enviada. En `POST /api/posteos` se usa `trasResponder` (`controllers/posteos.js:439`, `helpers/tras-responder.js:16-22`), que se traga cualquier error. El riesgo vuelve si un efecto posterior lanza. | `controllers/comentarios.js:43-47,63-87`; `controllers/followers.js:49-79`; `controllers/likes.js:80-81` |
| H21 | **Atribución con `SameSite=Lax`.** La landing y la API están en dominios distintos según AGENTS.md; la cookie podría no enviarse ni aceptarse. **[REQUIERE VERIFICACIÓN MANUAL]** | `helpers/atribucion.js:271-277` |
| H22 | **Usuarios: RESUELTO (2026-11-17, E2/E3b)** — el TTL de `UserToken` es sobre `expiraEn` (deslizante, tope 90 d) y una sesión vencida o sin fila responde `401 SESSION_REVOKED` sin tocar las demás (`models/UserToken.js:78-81`, `controllers/auth.js:465`). **Panel: vigente** (fuera de alcance por decisión 5). Texto original: **Falso positivo de reuso por TTL del registro.** El TTL de `UserToken` (30 d) y `AdminToken` (12 h) se mide desde `createdAt` y la rotación **no lo reinicia**. Una sesión más longeva que el TTL pierde su fila; el siguiente `POST /refresh` encuentra un token con firma válida y sin fila → lo trata como robo, incrementa `tokenVersion` y **cierra todas las sesiones**. En el panel la ventana (12 h) es menor que una jornada laboral. *(Documentado por decisión; no corregido.)* | `models/UserToken.js:38`; `admin/models/AdminToken.js:43`; `controllers/auth.js:425-434`; `admin/controllers/auth.js:225-234` |
| H23 | ~~**Refresh concurrente tratado como reuso.**~~ **RESUELTO para usuarios (2026-11-17, E3b):** rotación atómica condicionada al hash vigente con gracia de 30 s: de dos refresh simultáneos uno responde 200 y el otro `409 CONFLICT`, y la sesión sobrevive (`test/integration/refresh-sesion.test.js:145`, ejecutado en esta corrida). Un reuso real fuera de la gracia borra **solo** esa sesión. El panel conserva el comportamiento anterior. | `controllers/auth.js:429-432,467-475,494-518` |
| H24 | ~~**El logout no revoca el access token.**~~ **RESUELTO para usuarios (2026-11-17, E3/E4):** el logout borra la fila por `sessionId` y cada request valida el `sid` contra `UserToken`, así que una copia del access token recibe `401 SESSION_REVOKED` de inmediato. Lo mismo vale para el cierre remoto, el cambio y el reset de contraseña. | `controllers/auth.js:542-566`; `helpers/cerrar-sesion-cookies.js:17-27`; `middlewares/validar-jwt-cookies-sesion.js:40-46` |
| H25 | **`passwordUsuarioLimiter` compartido por tres endpoints.** 5 intentos/15 min por usuario combinados entre `PUT /api/usuarios/password`, `DELETE /api/usuarios/delete` y `DELETE /api/auth/sesiones/otras`. Es intencional (los tres comparan la contraseña), pero un usuario que falla al cerrar otras sesiones queda bloqueado también para cambiar la contraseña. | `routes/auth.js:113`; `routes/usuarios.js:106,127` |
| H26 | **`[SEGURIDAD]` y `[RIESGO]` solo en logs.** El reuso de refresh y las señales de riesgo se registran con `console.warn` (con IP y UA completos); no hay correo al usuario (E9) ni escalada (E10). `riesgo.motivos` e `ipHistorial` no se exponen en ningún endpoint. *(Documentado como pendiente por decisión; no es un fallo.)* | `controllers/auth.js:473,522`; `controllers/sesiones.js:30` |

### Inconsistencias entre código y documentación de referencia

| # | Referencia | Código | Dónde |
|---|---|---|---|
| I1 | AGENTS.md: duplicado Mongo → `409 CONFLICT` con `code: DUPLICATE_KEY`. | ~~El `code` de primer nivel es `CONFLICT`; `DUPLICATE_KEY` está en `errors[0].code`.~~ **RESUELTO (2026-10-27):** AGENTS.md ya describe `code: "CONFLICT"` + `errors[0].code: "DUPLICATE_KEY"`. | `middlewares/error-handler.js:98-110` |
| I2 | Prompt de referencia (y tabla de clases): códigos en minúsculas (`bad_request`, `not_found`, `validation_failed`, `rate_limit_exceeded`, `internal_error`, `file_error`, `invalid_json`). | Los códigos son en **mayúsculas** (`BAD_REQUEST`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMIT_EXCEEDED`, `INTERNAL_ERROR`, `FILE_ERROR`, `INVALID_JSON`). | `errors/error-classes.js:16-82`; `middlewares/error-handler.js` |
| I3 | Prompt de referencia: líneas de `error-classes.js` (49, 60, 73) y del error handler (41-56, 59-75, 78-88, 91-99). | Líneas reales: `ValidationError` `:56`, `RateLimitError` `:67`, `InternalError` `:80`; handler `:43-58`, `:61-77`, `:80-90`, `:93-118`. | `errors/error-classes.js`; `middlewares/error-handler.js` |
| I4 | AGENTS.md: access token de 1 h. | ~~Sin `ACCESS_TOKEN_EXPIRY`, el código usa **`15m`**.~~ **RESUELTO (2026-10-27):** el default del código pasó a **`1h`** y el `maxAge` de la cookie se deriva del `exp` del token, así que token y cookie ya no pueden desincronizarse. | `helpers/tokensUtils.js:17`; `helpers/vigencia-cookie.js` |
| I5 | AGENTS.md: multer 8 MB (y nota sobre el mensaje de 5 MB). | El mensaje de 5 MB sigue en el handler, pero el de 8 MB se aplica primero, así que el de 5 MB no se alcanza. | `middlewares/error-handler.js:45`; `middlewares/validar-imagen-posteo.js:7` |
| I6 | AGENTS.md: "Regla de Oro": con municipio manual, `coordinates` = `null`. | El backend guarda `coordinates` si llegan `lat` y `lng` aunque también llegue `municipio`. Depende del cliente. | `controllers/posteos.js:368,470-478` |
| I7 | AGENTS.md: los iconos de Web Push deben ser URLs absolutas. | ~~El fallback de `comentarios.js` es relativo: `/public/assets/icono-tlaxapp-beige.png`.~~ **RESUELTO (2026-10-27):** el fallback relativo se eliminó; ahora es `imagen_perfil.secure_url` || `ICONO_SISTEMA_TLAXAPP` y, sin ninguna, se omite el `icon`. | `controllers/comentarios.js:73`; `controllers/followers.js:71` |
| I8 | AGENTS.md: tabla de limiters. | No incluye el limiter `EARLY_ACCESS` (POST, 10 min / 5 por defecto). | `routes/earlyaccess.js:8` |
| I9 | AGENTS.md: suspensión de cuenta (estatus 3). | ~~Ver H3: la suspensión no se aplica a sesiones existentes ni al refresh.~~ **RESUELTO (2026-11-17):** coincide con AGENTS.md («Estatus 2/3 → `403 ACCOUNT_RESTRICTED` sin borrar la sesión»). | `helpers/estado-cuenta-sesion.js:26` |
| I10 | `models/Usuario.js:54` y AGENTS.md: los slugs históricos redirigen (301). | La respuesta es **200** con `redirect: "permanent"` y `Location`; no hay 301. | `middlewares/validar-url-usuario.js:16-26` |
| I11 | Mensajes de validación con límite distinto al aplicado. | Soporte dice "mínimo 10" y aplica **15** (`routes/soporte.js:15`). ~~`PUT /update` dice "6" y aplica **8** (`routes/usuarios.js:83`).~~ **RESUELTO (2026-11-13):** `PUT /update` ya no valida `password` (responde 422 `USE_PASSWORD_ENDPOINT`). | ver dominios |
| I12 | Esquema de `notificaciones`: campo `leida`. | La proyección pide `leida`; el campo real es `notificacion_leida`. `leida` no existe en el modelo y por tanto nunca aparece en la respuesta. | `controllers/notificaciones.js:321` |
| I13 | Inventario base `inventario-endpoints.json`: `GET /api/health` (`{status, uptime, timestamp, version, db}`). | ~~El código añade `service`, `environment`, `memory`, `heapUsedPercentage` y `pid`~~ **Obsoleto desde 2026-11-10:** el código actual devuelve solo `{ "status": "ok" \| "degraded" }` con 200/503. | `controllers/bienvenida.js:12-15` |
| I14 | Login vs `/me`: ambos deben devolver el mismo perfil. | El login devuelve `_id` y `uid`; `/me` solo `uid` (por `toJSON`). | `controllers/auth.js:189-201`; `models/Usuario.js:192-200` |
| I15 | Feed de favoritos: `posteoId` como id. | `posteoId` es un **objeto** `{_id, public_id, visibilidad}`. | `controllers/favoritos.js:70-76` |

### Verificación manual pendiente **[REQUIERE VERIFICACIÓN MANUAL]**

1. Cookie `early_access_atribucion` con `SameSite=Lax` en un flujo cross-site real (H21).
2. Respuestas reales de Cloudinary (subida, borrado) y comportamiento de `SEND_EMAIL=false`.
3. Entregas de Web Push y el manejo de suscripciones 404/410.
4. Valores reales de `ACCESS_TOKEN_EXPIRY`, `JWT_SEED`, `NODE_ENV`, `FRONTEND_URL`, `ADMIN_FRONTEND_URL` y `CSRF_ALLOWED_ORIGINS`.
5. Cron de borrado físico de cuentas y posteos (no revisado: `jobs/`).
6. `PATCH /api/v1/admin/influencers/:id` con `nombre: ""`: el validador lo deja pasar (`optional({values:'falsy'})`) y Mongoose lo rechaza por `required`. Resultado esperado: 500 (probable; confirmar).
7. `page=0` en `GET /api/posteos` y `GET /api/posteos/usuario/:id` (H9).
8. Origen del JWT que envía `POST /api/auth/reenviar-correo-restablecer-password`: ningún endpoint lo emite (la respuesta de `password-olvidado` entrega un token opaco).
9. `PUT /api/usuarios/update` con `$set` sobre `nombre_completo` y `lugar_radicacion`: si se envía un subdocumento parcial, ¿se pierden campos? (derivado del código).
10. Rate limiters en memoria por proceso: si hay más de una instancia, los límites no se comparten.
11. ~~`PUT /api/usuarios/update` sin body JSON: 500 esperado.~~ **Cerrado (2026-11-17):** el commit `9f14360` cambió el desestructurado a `req.body ?? {}` (`controllers/usuarios.js:143`); sin body responde 200.
12. `GET /api/auth/sesiones` devuelve solo `ipUltima` enmascarada, `deviceName`, `lastUsed`, `paisUltimo` (`null`) y `esActual`; no expone `ipPrimera`, `ipHistorial` ni `riesgo.motivos`. Confirmar con el frontend que es suficiente (contrato en `docs/specs/SPECS-FRONTEND-SESION-Y-CONTRATOS.md`, no contrastado en detalle en esta corrida).
13. Rama `401 UNAUTHORIZED` "Sesión expirada - inicia sesión nuevamente" de `verificarTokenSesion` (`middlewares/validar-jwt-cookies-sesion.js:51-53`): existe y está probada (`test/integration/verificar-sesion.test.js:174`, `tokenVersion++` directo en BD), pero en los flujos reales parece inalcanzable: todo `tokenVersion++` del código va acompañado de `UserToken.deleteMany`, que dispara antes `SESSION_REVOKED`. Derivado del código.
14. Entregas reales de Web Push de los tipos nuevos (`like` agrupado, `nueva_publicacion`, `reporte_resuelto`/`reporte_descartado`, `seguridad`): el payload y los tags están en el código (`helpers/notificar.js:83-91`; `helpers/difundir-publicacion.js:165-173`), pero la entrega y el reemplazo por `tag` en cada navegador no se probaron en ejecución.
15. Valores reales en producción de `FLOOD_LECTURA_IP_MAX`, `FLOOD_ESCRITURA_IP_MAX`, `POLLING_IP_MAX`, `NOTIF_CORREO_COOLDOWN_MIN`, `NOTIF_LIKE_PUSH_COOLDOWN_MIN`, `NOTIF_NUEVA_PUBLICACION_AUTOR_MIN`, `NOTIF_NUEVA_PUBLICACION_RECEPTOR_MAX_DIA`, `NOTIF_RETENCION_*`: los defaults están en código; los vigentes viven en App Platform.
16. Cron de retención de notificaciones (`jobs/limpiar-notificaciones-antiguas.js`, diario 05:00): el filtro está verificado por lectura (`helpers/retencion-notificaciones.js:34-40`), no se ejecutó el cron.

### Nota de método

Los 90 endpoints están documentados. Los `throw` se citan por línea del archivo real. Donde el código no permite afirmar el comportamiento, se marca **[REQUIERE VERIFICACIÓN MANUAL]**. Donde se deduce de la lectura sin ejecutar, se indica "derivado". Las tablas de error listan el `code` real, aunque no coincida con la referencia del prompt (ver I2).

> **Criterio de contrato:** el frontend debe decidir por `code`, nunca por el texto de `detail`. El `detail` solo es contrato donde el código lo fija en un `throw` propio (todos los citados en los dominios son literales); los mensajes de `express-validator` y los de `mongoose` pueden cambiar entre versiones.
