# Delta de documentación de endpoints — 2026-11-27 22:40:20

**Tipo de corrida:** verificación del delta de sync de Postman (sin cambios de contrato nuevos).
**Base de comparación:** estado de `docs/api/` tras los commits `d14a611` (422 `URL_NOT_ALLOWED`) y `25899bf` (paginación por cursor de comentarios). La colección Postman y `docs/api/inventario-endpoints.json` fueron actualizados por el agente `sincronizador` en el commit `1435809`.
**Brief de origen:** `engineering/working/postman-sync/2026-11-27_delta-para-agente-api.md`.
**Resultado:** **0 endpoints nuevos, 0 eliminados, 0 cambios de contrato no documentados.** El contenido del delta ya estaba en `docs/api/` (escrito dentro de los commits de código) y es correcto contra el código. Se corrigieron **citas `archivo:línea` desactualizadas** en `comentarios.md` y `posteos.md` y se **completó** la mención de `URL_NOT_ALLOWED` donde faltaba.

---

## 1. `GET /api/comentarios/:posteoId/comentarios` — verificado, contenido correcto

Fuente de verdad contrastada: `routes/comentarios.js:29-40`, `controllers/comentarios.js:113-188` (`obtenerComentarios`), `helpers/responder.js:38-44` (`construirLinkPagina`), `helpers/validar-id-posteo.js:14-36`, `middlewares/validar-campos.js:6-32`.

| Punto del brief | Estado en `docs/api/comentarios.md` | Verificación contra el código |
|---|---|---|
| Query param `orden` (`asc`\|`desc`, default `desc`) | ✓ documentado (tabla de params) | `routes/comentarios.js:33` (`optional().isIn(['asc','desc'])`) + default en `controllers/comentarios.js:98-99,119` |
| Query param `cursor` (MongoId) | ✓ documentado ("no se construye a mano, viene en `pagination.next`") | `routes/comentarios.js:34` (`optional().isMongoId()`) + `controllers/comentarios.js:120,127-129` (`$gt`/`$lt` según dirección) |
| `pagination.next` lleva `orden`+`cursor`+`limite` | ✓ documentado con ejemplo exacto | `controllers/comentarios.js:177-179` → `construirLinkPagina(basePath, page + 1, limit, { orden, cursor })` (`helpers/responder.js:38-44` emite `page`+`limite` primero, luego extras) |
| `pagination.prev: null` con cursor | ✓ documentado (ejemplo y nota) | `controllers/comentarios.js:180`: `!cursor && page > 1 ? … : null` |
| `page` sin cursor = `skip` (compatibilidad); con cursor solo dato | ✓ documentado | `controllers/comentarios.js:116,139` (`$skip` solo si no hay cursor) |
| `limite` canónico, default 10, cap 100; `limit` alias | ✓ documentado (default 10, clamp silencioso 1–100) | `controllers/comentarios.js:118` (`req.query.limite ?? req.query.limit`) |
| `$lookup` del autor después de paginar; conteo en paralelo | ✓ documentado (middleware chain y notas) | `controllers/comentarios.js:131-161` |

**Correcciones aplicadas a esta sección (solo citas de línea desplazadas por el commit):**
- `Archivo de ruta`: `routes/comentarios.js:28` → **`:29`** (la línea 28 es el comentario `//?`).
- `Controlador`: `obtenerComentarios` línea 119 → **113**.
- Fila 422: checks en `routes/comentarios.js:30-33` → **`:32-37`** (posteoId `:32`, orden `:33`, cursor `:34`, page `:35`, limite `:36`, limit `:37`).
- Fila 500: `controllers/comentarios.js:159` → **`:186`**.

## 2. `422 URL_NOT_ALLOWED` en `texto` — verificado, completado donde faltaba

Fuente de verdad contrastada: `helpers/enlaces-permitidos.js:1-77` (host allow-list `HOSTS_MAPAS`, `https` obligatorio, sin credenciales ni puerto, máx. 2048 chars) y `middlewares/validar-texto.js:37-78` (`crearValidadorTexto`: el check de URL corre para posteos y comentarios por igual; el `throw new ValidationError` está en la línea **73**; el mensaje literal es `"Solo se permiten enlaces de Google Maps (https://maps.app.goo.gl/...)."` con `errors[].code: "URL_NOT_ALLOWED"`).

| Endpoint | Estado encontrado | Acción |
|---|---|---|
| `POST /api/comentarios/:posteoId/comentarios` | Ya documentado en la fila `texto` (params) y en las notas (`comentarios.md:38,91`) | Sin cambios de contenido. La fila 422 de la tabla de errores no listaba el mensaje de URL → **se agregó** `"Solo se permiten enlaces de Google Maps (https://maps.app.goo.gl/...)."` y se corrigió la cita `validar-texto.js:60` → **`:73`** |
| `POST /api/posteos` | Nota de enlaces ya presente (`posteos.md:375`), pero la fila `texto` de la tabla de params y la fila 422 no lo mencionaban | **Se agregó** la regla a la fila `texto` (con mensaje literal y `URL_NOT_ALLOWED`) y a la fila 422; cita `validar-texto.js:60` → **`:73`** |
| `PUT /api/posteos/:id` | La fila `texto` remitía genéricamente a POST y no había nota de enlaces | **Se completó** la fila `texto` ("incluida la regla de solo enlaces de Google Maps: otra URL → 422 `URL_NOT_ALLOWED`") y se **añadió** una nota de enlaces propia; fila 422 ampliada y cita `validar-texto.js:60` → **`:73`** |

Detalle técnico verificado (para el frontend): un dominio suelto sin esquema (`tienda.com`) **no** se detecta ni se rechaza — no es clicable tampoco en el frontend (`helpers/enlaces-permitidos.js:9-12`). La regla rechaza `http://`, credenciales (`user:pass@host`), puerto explícito y hosts suplantadores (`maps.app.goo.gl.evil.com`) por diseño (`:52-68`).

## 3. Re-baseline de citas `archivo:línea` (drift acumulado por los commits)

Los commits habían corrido las líneas de los archivos citados. Se re-contrastó **una a una** contra el código y se corrigieron:

### `docs/api/comentarios.md`
- Montaje: `models/server.js:134` → **`:138`**.
- Notas y hallazgos del toggle: `routes/comentarios.js:59` → **`:61`** (3 menciones: encabezado, nota del toggle, resumen de hallazgos).
- POST: sin cambios de ruta/controlador (`routes/comentarios.js:20`, `agregarComentario` línea 10 ✓).
- count: `routes/comentarios.js:38` → **`:42`**; `obtenerCountComentarios` línea 186 → **190**; checks `:40` → **`:45`**; errores `controllers/comentarios.js:174` → **`:201`** y `:182` → **`:209`**.
- DELETE: `routes/comentarios.js:45` → **`:50`**; `eliminarComentario` línea 209 → **213**; errores `:202,244` → **`:229,271`**, `:203` → **`:230`**, `:211` → **`:238`**, `:219` → **`:246`**, `:251` → **`:278`**.
- toggle: `routes/comentarios.js:55` → **`:57`**; checks `:58-59` → **`:60-61`**; errores `controllers/comentarios.js:270` → **`:297`** y `:281` → **`:308`** (`toggleComentariosPosteo` línea 282 sigue correcta).

### `docs/api/posteos.md`
- Montaje: `models/server.js:126` → **`:130`**.
- GET `/`: `posteosGet` línea 41 → **44**; checks `routes/posteos.js:36-41` → **`:38-43`**; errores `controllers/posteos.js:67` → **`:70`** y `:157` → **`:176`** (ruta `:32` ✓).
- GET `/post/:id`: `routes/posteos.js:47` → **`:49`**; `posteoGet` línea 161 → **180**; bloque con sesión `:185-206` → **`:204-225`**; check `:50` → **`:52`**; 401 `:169` → **`:188`**; 500 `:211` → **`:230`**.
- GET `/usuario/:idUsuario`: `routes/posteos.js:57` → **`:59`**; `posteosUsuarioGet` línea 215 → **234**; checks `:61-65` → **`:65-69`**; 500 `:304` → **`:339`**.
- POST `/`: `routes/posteos.js:71` → **`:75`**; `posteosPost` línea 311 → **346**; `validarTexto` `validar-texto.js:68` → **`:81`** (default export); reglas de ubicación `:353-376` → **`:388-411`**; `resolverLocalidad` `:24-36` → **`:27-39`**; checks visibilidad `:85` → **`:91`**, lat/lng `:89-90` → **`:95-96`**, municipio/localidad `:92-93` → **`:98-99`**; errores 400 `:28` → **`:31`** y `:33` → **`:36`** (500 `:456` ✓; difusión `:435-439` y `difundir-publicacion.js:134-205` ✓).
- PUT `/:id`: `routes/posteos.js:98` → **`:104`**; `posteosPut` línea 419 → **460**; propiedad `:484-491` → **`:525-532`**; reglas `:436-480` → **`:488-521`**; checks `:106-113` → **`:114-121`**; errores 400 `:28,33` → **`:31,36`**; 403 `:495` → **`:536`**; 500 `:510` → **`:551`**.
- DELETE `/:id/ubicacion`: `routes/posteos.js:121` → **`:129`**; `posteoUbicacionDelete` línea 539 → **580**; check `:125` → **`:135`**; 403 `:550` → **`:591`**; 500 `:556` → **`:597`**.
- DELETE `/:id`: `routes/posteos.js:131` → **`:141`**; `posteosDelete` línea 514 → **555**; check `:135` → **`:147`**; 403 `:527` → **`:568`**; 500 `:533` → **`:574`**.

### `docs/api/README.md`
- Encabezado: «última revisión» → **2026-11-27**; entrada de revisión de esta corrida (la más reciente, al final del log).
- Nota de `extraQuery` en «Formato de éxito»: «hoy solo `tipo` en `GET /api/notificaciones`» → ahora también **`orden` + `cursor`** en `GET /api/comentarios/:posteoId/comentarios` (`helpers/responder.js:38-44` sigue correcto).

### Citas verificadas sin drift (sin cambios)
`middlewares/rate-limiter.js` (`floodLecturaIpLimiter:270-279`, `floodEscrituraIpLimiter:282-291`, `feedUsuarioLimiter:309-314`, `comentariosUsuarioLimiter:317-322`, `posteoUsuarioLimiter:349-354`, `comentarioUsuarioLimiter:357-362`, `posteoPublicoLimiter:210`), `middlewares/validar-jwt-cookies-sesion.js:34,38,46,48-49,52,60,67-68`, `middlewares/validar-campos.js:28`, `helpers/validar-id-posteo.js:14,19,23,26-32`, `helpers/validar-id-usuario.js:10,14`, `middlewares/validar-imagen-posteo.js:7,12,16,19,25,27`, `helpers/multer.js:22,27`, `controllers/comentarios.js:59-87` (bloque `notificar`).

## 4. Endpoints no cubiertos por esta corrida

Solo se verificaron los endpoints del delta (según el brief): `GET /api/comentarios/:posteoId/comentarios` y el contrato 422 de `POST /api/posteos`, `PUT /api/posteos/:id` y `POST /api/comentarios/:posteoId/comentarios`. El resto de secciones de `comentarios.md` y `posteos.md` solo recibió el re-baseline de citas de línea; su contenido no se re-auditó en esta corrida.

## 5. Sin cambios

- Conteo total: **90** (65 red social + 25 panel). No hay endpoints nuevos ni eliminados; el índice de `README.md` no cambia.
- `docs/api/inventario-endpoints.json`: mantenido por el agente `sincronizador` (commit `1435809`); no se tocó en esta corrida.
- Ninguna colección Postman fue modificada (es dominio del agente `sincronizador`).
