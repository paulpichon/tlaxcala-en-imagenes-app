# Delta de documentación de endpoints — 2026-11-26 (cableado de rate limiting de 5 escrituras de `/api/notificaciones`)

**Generado:** 2026-11-26 12:53:18
**Alcance:** corregir el drift de `docs/api/` provocado por un cambio de código **no commiteado** en `routes/notificaciones.js` (cinco escrituras pasaron del cubo de lectura al de escritura por IP). No se documentaron de nuevo dominios sin cambios; no se tocó código fuente, ni `test/`, ni `admin/`, ni `postman/`.
**Base de comparación:** HEAD `69aa3ad` + **árbol de trabajo** (`git status`: `routes/notificaciones.js` modificado; `test/notificaciones-rate-limiter.test.js` sin seguimiento; `AGENTS.md`, `CHANGELOG.md` y el plan de notificaciones modificados). Documentación de referencia: `docs/api/README.md` con última revisión 2026-11-25 y `docs/api/2026-11-25_20-27-06_documentacion-endpoints.md` (incluido su «Addendum (admin)»).
**Endpoints nuevos:** **0**. **Modificados:** **5** (solo cableado de rate limiting, **sin cambio de contrato**). **Eliminados:** 0. **Conteo:** **90** (red social 65 + panel 25), sin cambios.
**Archivos de dominio editados:** `notificaciones.md` y `README.md`, más este delta.

**Método:** lectura del código en HEAD + `git diff` del árbol de trabajo (rutas → controladores → middlewares → limiters), spot-check del panel contra `admin/routes/*.js` y `admin/controllers/moderacion.js`, y auditoría de conteos contra los registros `router.<método>(` de `routes/*.js` (65) y `admin/routes/*.js` (25). Sí se ejecutó una prueba sin dependencias externas: `node --test test/notificaciones-rate-limiter.test.js` → **26/26 pass** (ver §7). No se levantó el servidor.

---

## 1. Cambio de código que originó el delta

`git diff routes/notificaciones.js` (árbol de trabajo, sin commitear): cinco registros de ruta cambian su primer middleware de `floodLecturaIpLimiter` a `floodEscrituraIpLimiter`. Reemplazo simétrico, por lo que **las líneas del router no se desplazaron**.

Motivo (comentario del propio test nuevo, `test/notificaciones-rate-limiter.test.js:11-14`): «toda ruta que muta usa el cubo de escritura por IP; las lecturas, el de lectura; el polling, su cubo propio». Corresponde al **§9 del plan de notificaciones** (`engineering/working/implementation-plans/2026-11-18-plan-sistema-notificaciones.md:374-411`, «Resuelto: cubos de rate limiting de las escrituras de notificaciones»; opción 1, resuelta el 2026-11-26, `:241`), que registraba cinco escrituras cableadas al cubo de lectura.

| Limiter | Definición | Ventana | Máximo | Clave | `code` | Mensaje literal |
|---|---|---|---|---|---|---|
| `floodLecturaIpLimiter` (antes) | `middlewares/rate-limiter.js:270-279` | 15 min | 3000 (env `FLOOD_LECTURA_IP_MAX`) | IP | `FLOOD_BLOCKED` | "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" |
| `floodEscrituraIpLimiter` (después) | `middlewares/rate-limiter.js:282-291` | 15 min | **600** (env `FLOOD_ESCRITURA_IP_MAX`) | IP | `FLOOD_BLOCKED` | "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" |

Ambos topes se leen con `enteroPositivoEnv` (`helpers/entero-env.js`); los valores vigentes en producción viven en App Platform → **[REQUIERE VERIFICACIÓN MANUAL]**.

> **Nota de historial:** el delta anterior (`2026-11-25_20-27-06_documentacion-endpoints.md`, §6 punto 2) documentó este cableado como **observación no corregida** («`DELETE /dispositivos/:id` y `DELETE /eliminar-notificacion/:id` usan `floodLecturaIpLimiter` aunque sean mutaciones… Se documenta tal cual (no se corrigió)»). El código ya está corregido en el árbol de trabajo, así que ese punto queda **superado**; no se edita el delta anterior (append-only), se corrige la documentación viva.

---

## 2. Endpoints afectados (5)

| # | Método | Ruta | Registro | Controlador | Cadena de middlewares (antes → después) |
|---|---|---|---|---|---|
| 50 | POST | `/api/notificaciones/subscribe` | `routes/notificaciones.js:24-29` | `controllers/notificaciones.js` — `subscribirNotificacionesWebPush` (`:11`) | `floodLecturaIpLimiter` → **`floodEscrituraIpLimiter`** → `verificarTokenSesion` → `notificacionesUsuarioLimiter` |
| 51 | POST | `/api/notificaciones/unsubscribe` | `routes/notificaciones.js:31-36` | `unsubscribeNotificacionesWebPush` (`:216`) | idem |
| 56 | DELETE | `/api/notificaciones/dispositivos/:id` | `routes/notificaciones.js:58-63` | `eliminarDispositivo` (`:188`) | idem + `check('id').isMongoId()` (`:61`) + `validarCampos` |
| 60 | PATCH | `/api/notificaciones/marcar-notificacion-leida/:id` | `routes/notificaciones.js:85-94` | `marcarNotificacionLeida` (`:354`) | idem + `check('id').isMongoId()` (`:91`) + `validarCampos` |
| 62 | DELETE | `/api/notificaciones/eliminar-notificacion/:id` | `routes/notificaciones.js:104-115` | `eliminarNotificacion` (`:409`) | idem + `check('id').notEmpty()` (`:110`) + `check('id').isMongoId()` (`:112`) + `validarCampos` |

**Sin cambios de contrato:** mismos métodos, rutas, parámetros, cuerpos, respuestas de éxito y códigos de error. Lo único que cambia para el cliente es **qué cubo de IP consume** y su mensaje `detail` asociado:

| Antes | Después |
|---|---|
| `429 FLOOD_BLOCKED` — "Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde" — `middlewares/rate-limiter.js:270-279` (cupo compartido con todas las lecturas: 3000/15 min por IP) | `429 FLOOD_BLOCKED` — "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde" — `middlewares/rate-limiter.js:282-291` (cupo propio de escrituras: 600/15 min por IP) |
| Las cinco escrituras gastaban el cupo de **lectura**, compitiendo con feed, perfil, municipios, etc. | Gastan el cupo de **escritura**, separado del de lectura |

El `429 READ_BLOCKED` de `notificacionesUsuarioLimiter` (15 min / 120 por usuario, "Demasiadas solicitudes, intenta de nuevo más tarde", `middlewares/rate-limiter.js:325-330`) **se conserva** en los cinco endpoints: en el mismo request conviven el cubo por IP (primero) y el cubo por usuario (después de `verificarTokenSesion`).

---

## 3. Correcciones en `notificaciones.md`

1. **Nota de revisión nueva** al inicio del archivo (2026-11-26) con el alcance del cambio y las líneas del router.
2. `POST /subscribe` (`:107-112`): cadena de middlewares y bloque de limiters reescritos con `floodEscrituraIpLimiter` (600/15 min, mensaje de escritura).
3. `POST /unsubscribe` (`:182-185`): idem.
4. `DELETE /dispositivos/:id` (`:479-482`): idem y **eliminada** la nota «**Ojo:** consume el cubo de **lectura**, no el de escritura», que quedó invertida.
5. `PATCH /marcar-notificacion-leida/:id` (`:617-620`): idem.
6. `DELETE /eliminar-notificacion/:id` (`:814-817`): idem y **eliminada** la nota «**Consume el cubo de lectura**, aunque sea un DELETE», por la misma razón.
7. **Tablas de «Códigos de error posibles»** de los cinco endpoints: la fila `429 FLOOD_BLOCKED` ahora cita `middlewares/rate-limiter.js:282-291` y el detalle "Demasiadas acciones desde esta conexión, intenta de nuevo más tarde". La fila `429 READ_BLOCKED` (`:325-330`) se conservó sin cambios.
8. **Citas `archivo:línea` del router re-verificadas, sin cambios:** `routes/notificaciones.js:24,31,58,85,104` (registro de cada ruta), `:61,91,110,112` (validadores). El reemplazo fue simétrico, así que el archivo no se desplazó; el resto de citas (`:325-330` de `notificacionesUsuarioLimiter`, `:270-279` de `floodLecturaIpLimiter`, `:297-306` de `pollingIpLimiter`) siguen vigentes.
9. **Revisado el resto del documento:** no hay tabla global de rate limiting ni otra afirmación sobre los cubos de estos cinco endpoints. Las menciones a `floodLecturaIpLimiter` que quedan pertenecen a endpoints de **lectura** y son correctas: `GET /vapidPublicKey` (`:42`), `GET /estado` (`:44`), `GET /preferencias` (`:49`) y `GET /` (`:65`). `GET /nuevas-notificaciones` sigue con `pollingIpLimiter` (`:97`).

---

## 4. Correcciones en `README.md`

1. **Encabezado:** `última revisión: 2026-11-25` → **2026-11-26** (el total sigue en 90).
2. **Registro de revisiones:** entrada nueva al final del bloque, con formato idéntico a las anteriores: **Revisión 2026-11-26 (cableado de rate limiting de 5 escrituras de notificaciones)** — 0 nuevos, 5 modificados, 0 eliminados, total 90, motivo (§9 del plan) y verificación de admin e inventario.
3. **Índice de endpoints** (tabla «Notificaciones — notificaciones.md»): filas **50, 51, 56, 60 y 62** pasan de `floodLecturaIpLimiter` a `floodEscrituraIpLimiter`. No se renumeró nada.
4. **Revisado el resto del README:** la tabla de limiters (filas de `floodLecturaIpLimiter`, `floodEscrituraIpLimiter`, `pollingIpLimiter`) describe instancias, no endpoints, y sigue correcta; la nota de topes NAT/CGNAT (`:246`) también. No quedan referencias vivas a los cubos de estos cinco endpoints.

---

## 5. Verificación del dominio admin (0 drift)

**Base:** `docs/api/admin-*.md` (última revisión 2026-11-25) frente al código actual. El refactor de `admin/controllers/moderacion.js` (`trasResponder`/`enParalelo`, commit `c4167a2`) es **anterior** a la corrida de documentación, así que se esperaba que las citas ya estuvieran al día; se confirmó con spot-check.

| Módulo | Rutas en código | Documentadas | Estado |
|---|---|---|---|
| `admin/routes/index.js` (auth + TOTP + cuentas) | 13 | 10 (auth 6 + TOTP 4) + 3 (cuentas) | ✓ |
| `admin/routes/moderacion.js` | 7 | 7 | ✓ |
| `admin/routes/influencers.js` | 5 | 5 | ✓ |
| **Total panel** | **25** | **25** | ✓ |

**Citas re-verificadas en `admin/controllers/moderacion.js`** (todas correctas, sin desplazamiento): `:310` `NotFoundError('El reporte no existe')`, `:313` `BadRequestError('Este reporte ya fue atendido (resuelto o descartado)')`, `:449-451` aviso genérico a reportantes tras resolver, `:458` `InternalError('Hubo un error al resolver el reporte')`, `:528` `trasResponder('descartarReporte', …)` con `reporte_descartado`, `:534` `InternalError('Hubo un error al descartar el reporte')`, `:560` `ValidationError('La descripcion es obligatoria cuando la categoria es "otro"')`, `:578` `InternalError('Hubo un error al recategorizar el reporte')`.

**Resultado:** 0 endpoints nuevos, 0 eliminados y **0 drift de contrato** en el panel. No se editó ningún `admin-*.md`.

---

## 6. Verificación del inventario y del conteo global

**Conteo por archivo (`router.<método>(`):**

| Archivo | Endpoints | Archivo | Endpoints |
|---|---|---|---|
| `routes/auth.js` | 13 | `routes/municipios.js` | 2 |
| `routes/bienvenida.js` | 2 | `routes/notificaciones.js` | 13 |
| `routes/comentarios.js` | 5 | `routes/posteos.js` | 7 |
| `routes/earlyaccess.js` | 2 | `routes/reportes.js` | 1 |
| `routes/favoritos.js` | 3 | `routes/soporte.js` | 1 |
| `routes/followers.js` | 4 | `routes/ubicacion.js` | 2 |
| `routes/likes.js` | 3 | `routes/uploads.js` | 1 |
| — | — | `routes/usuarios.js` | 6 |
| **Subtotal red social** | | | **65** |
| `admin/routes/index.js` | 13 | `admin/routes/moderacion.js` | 7 |
| `admin/routes/influencers.js` | 5 | **Subtotal panel** | **25** |

**Total: 90** (65 + 25), igual que el documentado. No hay endpoints sin documentar ni documentados de más.

**`docs/api/inventario-endpoints.json`:** coherente con el código — `"total": 90`, `actualizado: "2026-11-25"`, **20 módulos** que suman 90 entradas, **13** en `notificaciones`, y las 20 claves de `modulo` coinciden con los 18 archivos de dominio (+ los desdobles `admin-auth`/`admin-totp`). No hay rutas sin listar.

> **Pendiente para el agente `sincronizador` (no corregido aquí):** las 5 entradas del inventario conservan `limiter: "floodLecturaIpLimiter 15m/3000 + notificacionesUsuarioLimiter"` en su campo informativo. No altera el conteo ni el contrato, y ese archivo es el snapshot del sync; lo actualizará `sincronizador` en su próxima corrida (o al commitear el cambio de `routes/notificaciones.js`). Se deja constancia en lugar de editarlo desde este agente.

---

## 7. Pruebas ejecutadas en esta corrida

- `node --test test/notificaciones-rate-limiter.test.js` → **26 tests, 26 pass, 0 fail** (683 ms). El test (archivo nuevo, aún sin commitear) recorre `router.stack` y afirma, para cada una de las **13** rutas de `/api/notificaciones`, que el **primer** middleware es el cubo esperado (`floodEscrituraIpLimiter` en `post`/`put`/`patch`/`delete`, `pollingIpLimiter` en `/nuevas-notificaciones`, `floodLecturaIpLimiter` en el resto), que hay **un solo** cubo por IP y que `notificacionesUsuarioLimiter` está presente salvo en `/vapidPublicKey` (`test/notificaciones-rate-limiter.test.js:16-56`). Confirma en ejecución el cableado que documenta este delta.
- No se ejecutó el resto de la suite: requiere MongoDB, Cloudinary y SMTP. El contenido de la documentación se verificó por lectura del código en HEAD `69aa3ad` + árbol de trabajo.

---

## 8. [REQUIERE VERIFICACIÓN MANUAL]

1. Valores reales en producción de `FLOOD_ESCRITURA_IP_MAX` y `FLOOD_LECTURA_IP_MAX` (defaults 600/3000 en código; los vigentes se configuran en App Platform). El cambio de cubo es efectivo en el próximo despliegue, que además reinicia los contadores en memoria.
2. Impacto real en el frontend del nuevo tope de 600/15 min por IP para estas cinco escrituras en redes compartidas (NAT/CGNAT): el techo anterior era el de lectura (3000). Si un edificio con muchas cuentas marca notificaciones como leídas en masa, podría alcanzar el `429` antes que antes; el `detail` ahora dice "acciones" y no "solicitudes".
3. El macro de `Retry-After`/`RateLimit-*` en CORS ya está documentado (`models/server.js`); no se probó en ejecución.

---

## 9. Drift encontrado y descartado

| Observación | Resultado |
|---|---|
| Endpoints nuevos o eliminados desde el 2026-11-25 | **Ninguno.** Los commits posteriores a `e5d81f9` (`6278e87`, `69aa3ad`) solo tocan `AGENTS.md`, `CHANGELOG.md`, `README.md`, `docs/specs/` y el plan; `git show --stat` no muestra código. |
| Drift de contrato en el panel tras el refactor `trasResponder`/`enParalelo` | **Ninguno.** Citas de `admin/controllers/moderacion.js` re-verificadas (§5). |
| `bienvenida.md` con citas desfasadas de `healthLimiter` (`:233-242` frente a `:250-259`) | **Sigue pendiente**, ya anotado en el delta del 2026-11-25 (§6 punto 7). Fuera del alcance de esta corrida; el contenido sustantivo (1 min/60) es correcto. |
| Campo `limiter` de las 5 entradas en `inventario-endpoints.json` | **Pendiente del `sincronizador`** (§6). |
| `GET /api/notificaciones` proyecta `leida` (campo inexistente) | **Sigue vigente** (I12 del README); es código, no documentación. No se tocó. |

---

## 10. Archivos escritos en esta corrida

- `docs/api/notificaciones.md` (nota de revisión nueva; 5 secciones de endpoint y 5 tablas de error corregidas; 2 notas invertidas eliminadas).
- `docs/api/README.md` (fecha de última revisión; entrada nueva del registro de revisiones; 5 filas del índice de endpoints).
- `docs/api/2026-11-26_12-53-18_documentacion-endpoints.md` (este archivo).

Sin cambios: código fuente (`routes/`, `admin/`, `controllers/`, `middlewares/`), `test/`, `docs/api/inventario-endpoints.json`, `postman/`, `engineering/`, `docs/specs/`. Los deltas anteriores no se modificaron.
