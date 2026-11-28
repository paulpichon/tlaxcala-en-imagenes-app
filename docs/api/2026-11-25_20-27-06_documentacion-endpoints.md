# Delta de documentación de endpoints — 2026-11-25 (Fases 3–7 de notificaciones y cambios globales de rate limiting/errores)

**Generado:** 2026-11-25 20:27:06
**Alcance:** actualizar `docs/api/` al estado real del backend en HEAD `dd88f4b` (árbol de trabajo limpio). No se documentaron de nuevo dominios sin cambios; no se tocó código, ni `docs/api/inventario-endpoints.json`, ni `postman/`.
**Base de comparación:** `docs/api/README.md` con última revisión 2026-11-17 y `docs/api/2026-11-17_19-57-42_documentacion-endpoints.md`.
**Endpoints nuevos:** **6**. **Modificados:** **7**. **Eliminados:** 0. **Conteo:** 84 → **90** (red social 65 + panel 25).
**Archivos de dominio editados:** `notificaciones.md` (reescrito completo), `README.md`, `followers.md`, `comentarios.md`, `likes.md`, `reportes.md`, `auth.md`, `usuarios.md`, `posteos.md`, `favoritos.md`, `municipios-ubicacion.md`, `uploads.md` (estos tres últimos solo por los umbrales/citas de `flood*`).

**Método:** lectura del código en HEAD (rutas → controladores → middlewares → helpers → modelos → limiters → cron). **No se levantó el servidor ni se ejecutaron pruebas**: requieren MongoDB, Cloudinary y SMTP. Todo lo marcado "derivado" se deduce de la lectura; todo lo demás está verificado en el archivo citado.

---

## 1. Endpoints nuevos (6) — `/api/notificaciones`

Router real: `routes/notificaciones.js` (117 líneas, **13 rutas**). Controlador: `controllers/notificaciones.js` (484 líneas).

### 1.1 `GET /api/notificaciones/estado`

- Ruta: `routes/notificaciones.js:44-47`. Cadena: `floodLecturaIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `obtenerEstadoNotificaciones`.
- Controlador: `controllers/notificaciones.js:107-134`. Proyección `notificaciones_activadas pushSubscriptions preferencias_notificaciones` (`:109-111`); `404` si no hay usuario (`:113-115`); dispositivos serializados con `serializarDispositivo` y ordenados por `ultimoUso` desc (`:118-120`); `activadas = Boolean(notificaciones_activadas) && dispositivos.length > 0` (`:125`); `preferenciasEfectivas` (`:127`); `500` "Error al obtener el estado de las notificaciones" (`:132`).
- Serialización con lista blanca: `helpers/dispositivos-push.js:21-27` (`id`, `userAgent`, `creadoAt`, `ultimoUso`, `endpointHash`). `endpointHash` = SHA-256 hex (`:13`). Nunca `endpoint` ni `keys`.

### 1.2 `GET /api/notificaciones/preferencias`

- Ruta: `routes/notificaciones.js:49-52`. Misma cadena que `/estado`.
- Controlador: `controllers/notificaciones.js:138-155`. `404` "Usuario no encontrado" (`:145`); `data.preferencias` = valores efectivos (`:149`); `500` (`:153`).

### 1.3 `PUT /api/notificaciones/preferencias`

- Ruta: `routes/notificaciones.js:53-56`. Cadena: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `actualizarPreferencias`.
- Controlador: `controllers/notificaciones.js:159-184`. Valida con `validarCambioPreferencias` (`:161-164`) y actualiza con `$set` parcial (`:166-170`); `404` (`:173`); `msg` "Preferencias actualizadas correctamente" y preferencias efectivas (`:176-179`); `500` (`:182`).
- Validador: `helpers/preferencias-notificaciones.js:63-85`. Reglas y mensajes literales: `"El cuerpo debe ser un objeto"` (`:65`), `"Canal no válido: <canal>"` (`:71`), `"El canal <canal> debe ser un objeto"` (`:72`), `"Preferencia no válida: <canal>.<clave>"` (`:75`), `"<canal>.<clave> debe ser booleano"` (`:78`), `"Indica al menos una preferencia"` (`:83`).
- **Contrato relevante:** todos esos rechazos son **400 `BAD_REQUEST`** (`controllers/notificaciones.js:163`), no 422, porque no hay `express-validator` en la ruta.
- Claves y defaults: `helpers/preferencias-notificaciones.js:9-21` (push: `follow`, `comentario`, `like`, `nueva_publicacion` (**false**), `sistema`; correo: `follow`, `comentario`, `sistema`). Tipos sin clave no silenciables: `canalPermitido` (`:50-53`).

### 1.4 `DELETE /api/notificaciones/dispositivos/:id`

- Ruta: `routes/notificaciones.js:58-63`. Cadena: `floodLecturaIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `check('id').isMongoId()` (`:61`) → `validarCampos` → `eliminarDispositivo`.
- Controlador: `controllers/notificaciones.js:188-214`. `$pull` atómico acotado al dueño (`:194-198`); `404` "Dispositivo no encontrado" si no coincide (`:200-202`); apaga `notificaciones_activadas` si el array queda vacío (`:205-207`); `msg` "Dispositivo eliminado correctamente" (`:209`); `500` (`:212`).
- 422 con `detail` "La solicitud contiene errores de validación" (`middlewares/validar-campos.js:28`) y `errors[0].message` "El id del dispositivo debe ser un MongoId válido".

### 1.5 `PATCH /api/notificaciones/marcar-todas-leidas`

- Ruta: `routes/notificaciones.js:75-78`. Cadena: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `marcarTodasLeidas`.
- Controlador: `controllers/notificaciones.js:436-450`. `updateMany({ receptor, notificacion_leida: false, isDeleted: false })` (`:438-441`); `data.actualizadas = modifiedCount` (`:444`); `500` "Error al marcar las notificaciones como leídas" (`:448`).

### 1.6 `DELETE /api/notificaciones`

- Ruta: `routes/notificaciones.js:80-83`. Cadena: `floodEscrituraIpLimiter` → `verificarTokenSesion` → `notificacionesUsuarioLimiter` → `eliminarTodasNotificaciones`.
- Controlador: `controllers/notificaciones.js:454-468`. Soft delete masivo (`$set: { isDeleted: true, deletedAt }`, `:456-459`); `data.eliminadas = modifiedCount` (`:462`); `500` (`:466`).
- Purga física a los 30 días por cron: `helpers/retencion-notificaciones.js:34-40` + `jobs/limpiar-notificaciones-antiguas.js:5-6` (diario 05:00).

---

## 2. Endpoints modificados (7)

### 2.1 `POST /api/notificaciones/subscribe`

- `controllers/notificaciones.js:11-103`. **Nuevo `data.id`** con el `_id` de la suscripción (`:87-97`).
- Antes de registrar, `desvincularEndpointDeOtrasCuentas` (`:34`; helper `helpers/dispositivos-push.js:42-63`): un endpoint pertenece a una sola cuenta y las cuentas que se quedan sin dispositivos apagan `notificaciones_activadas`.
- Upsert idempotente reactivador (`:39-49`) + tope **10 dispositivos** conservando los 10 más recientes por `createdAt` (`:55,68-69`).
- Valida además `endpointPushValido` (`:18`; `helpers/enviar-push.js`: string, `<= 2048`, regex `^https:\/\/[^\s]+$`).
- Errores: 400 "Suscripción inválida" (`:22`), 404 "Usuario no encontrado" (`:81`), 500 "Error al guardar suscripción" (`:101`).

### 2.2 `POST /api/notificaciones/unsubscribe`

- `controllers/notificaciones.js:216-251`. Nuevo 400 **"Endpoint de suscripción inválido"** cuando no pasa `endpointPushValido` (`:225-227`), además de "Falta el endpoint de la suscripción" (`:221-223`). Idempotente; apaga el switch si no quedan dispositivos (`:242-244`).

### 2.3 `GET /api/notificaciones/vapidPublicKey`

- Ruta: `routes/notificaciones.js:42` — **solo `floodLecturaIpLimiter`**, sin `verificarTokenSesion` ni limiter por usuario (comentario `:38-41`: iOS exige pedir el permiso dentro del gesto). Sigue devolviendo `data.key` (`controllers/notificaciones.js:259`) y `500` "Falta la clave pública VAPID" si `VAPID_PUBLIC_KEY` está vacía (`:257`).

### 2.4 `GET /api/notificaciones`

- Ruta: `routes/notificaciones.js:65-73`. **Nuevo query `tipo`**, `optional().isIn(Notificacion.schema.path('tipo').enumValues)` (`:71`) → 422 "El tipo de notificación no es válido".
- Controlador: `controllers/notificaciones.js:266-352`. `page` clamp mínimo 1 (`:269`); **`limite` con tope 100** y default 20 (`:272`), alias `limit`; `$match` con `tipo` opcional (`:279`); proyección de `contador` (nunca `emisores`) (`:326`); `extraQuery: { tipo }` en los links (`:345`, `helpers/responder.js:38-44`).
- Se mantiene el drift documentado: la proyección pide `leida`, campo inexistente; el real es `notificacion_leida` (`:321`; `models/Notificacion.js:48-51`).

### 2.5 `DELETE /api/notificaciones/eliminar-notificacion/:id`

- `controllers/notificaciones.js:409-432`. **Ya no es borrado físico**: `findOneAndUpdate({ _id, receptor, isDeleted: false }, { $set: { isDeleted: true, deletedAt } })` (`:417-421`); 404 si es ajena, inexistente o ya eliminada (`:423-425`). Antes usaba `findOneAndDelete` (drift corregido en `notificaciones.md`).

### 2.6 `GET /api/notificaciones/nuevas-notificaciones`

- Ruta: `routes/notificaciones.js:97-102`. **`pollingIpLimiter`** (antes `floodLecturaIpLimiter`), y sigue detrás `notificacionesUsuarioLimiter`. Mismo contrato: `data.totalNoLeidas` (`controllers/notificaciones.js:402`).

### 2.7 `PATCH /api/notificaciones/marcar-notificacion-leida/:id`

- Sin cambio de contrato (`controllers/notificaciones.js:354-385`). Se re-citaron líneas. 404 "Notificación no encontrada" (`:377`), 500 (`:383`).

---

## 3. Cambios globales reflejados en el `README.md`

### 3.1 Rate limiting (`middlewares/rate-limiter.js`)

| Limiter | Antes | Ahora | Cita |
|---|---|---|---|
| `floodLecturaIpLimiter` | 300/15 min | **3000**/15 min, env `FLOOD_LECTURA_IP_MAX` | `:270-279` |
| `floodEscrituraIpLimiter` | 60/15 min | **600**/15 min, env `FLOOD_ESCRITURA_IP_MAX` | `:282-291` |
| `pollingIpLimiter` | no existía | **3000**/15 min, env `POLLING_IP_MAX`; usado por `GET /notificaciones/nuevas-notificaciones` (`routes/notificaciones.js:97`) y `GET /usuarios/registrados/nuevos-usuarios-registrados` (`routes/usuarios.js:136`) | `:297-306` |
| `registroLimiter` | 3/h | **10**/h | `:174-183` |
| `refreshIpLimiter` | no existía | 300/15 min solo IP, delante de `refreshLimiter` | `:224-233`; `routes/auth.js:95` |
| `refreshLimiter` | 10/15 min por IP | 10/15 min por **`sid`** del refresh (`claveSesionRefresh`) | `:237-247`; `helpers/clave-limite.js:67-78` |

- `enteroPositivoEnv` (`helpers/entero-env.js`) hace que env vacío/`0`/negativo/no numérico caiga al default (comentario `:264-267`).
- CORS expone `Retry-After` y `RateLimit-*`: `models/server.js:110` (`exposedHeaders`).

### 3.2 Errores (`middlewares/error-handler.js`)

- **`detail` de 5xx oculto fuera de development:** `if (err.statusCode >= 500 && !isDev) body.detail = 'Ocurrió un error inesperado. Por favor, intente más tarde.'` (`:36-45`). El catch-all aplica la misma regla (`:113-123`).
- Los **4xx conservan** su `detail` real. Se corrigió en el README la afirmación de que «el `detail` de `AppError` se devuelve tal cual, incluso en producción» y el hallazgo **H8** (ahora resuelto, parcial por diseño).
- Se re-baselizaron las citas del handler en el README (`:48-63`, `:66-82`, `:85-95`, `:98-110`, `:113-123`).

### 3.3 Conteo

- README: encabezado, índice, tabla de endpoints, §Totales y nota al pie de la tabla → **90** (65 + 25).
- `docs/api/inventario-endpoints.json` **no se tocó** y sigue en **84** entradas: pendiente del agente `sincronizador`.

---

## 4. Afirmaciones obsoletas corregidas por dominio

### 4.1 `followers.md`

- El alta crea `Notificacion` in-app `follow` **y** push **y** correo con cooldown, **después de responder**, deduplicada (`controllers/followers.js:47-75`; `helpers/notificar.js:19-45,228-256`).
- Se corrigió la cita del 500 (`:109` → `:79`) y las citas de limiters.
- Nuevo aviso: `tag: follow-<idSeguidor>`, correo silenciable con `correo.follow`.

### 4.2 `comentarios.md`

- **Eliminada** la afirmación «correo solo en el primer comentario». Ahora hay `Notificacion` in-app `comentario` + push + correo **con cooldown de 15 min por usuario y tipo** (`controllers/comentarios.js:59-87`; `helpers/notificar.js:245-256`).
- Corregida la nota de errores posteriores a la respuesta: `notificar()` nunca lanza (`helpers/notificar.js:257-260`), así que no puede haber `next(err)` con la respuesta ya enviada (H20 residual).
- Re-baselizadas todas las citas de `controllers/comentarios.js` (agregarComentario `:10`, throws `:21,25,29,92`; obtener `:159,174,182`; eliminar `:202-251`; toggle `:270,281`) y de limiters.

### 4.3 `likes.md`

- Corregida la nota «No notifica al autor». El alta **sí** notifica: `like` agrupado, in-app + push (máx. 1 por posteo cada 10 min), **sin correo**; like propio excluido; quitar el like **no** modifica la notificación (`controllers/likes.js:15-47,66-81`; `helpers/notificar.js:104-160`).
- Re-baselizadas rutas (`routes/likes.js:12,24,37`) y citas de controlador (`:53,64,85,89,98,102,117`).

### 4.4 `reportes.md`

- Añadida la Fase 6: al resolver/descartar desde el panel, **todos** los reportantes reciben `reporte_resuelto`/`reporte_descartado` (in-app + push, sin correo, mensaje genérico, sin `referencia`, sin categoría ni datos del autor; no silenciable) (`admin/controllers/moderacion.js:323-356,449-451,527-528`).
- El contrato de `POST /api/reportes/:posteoId` no cambia (verificado en `controllers/reportes.js:1-54`: ese controlador no notifica).

### 4.5 `auth.md`

- `POST /api/auth/refresh`: dos capas — `refreshIpLimiter` 300/15 min por IP + `refreshLimiter` 10/15 min por `sid` (leído sin verificar firma, `helpers/clave-limite.js:51-78`); se corrigió la nota de «pestañas tras NAT comparten el cubo». Nota nueva: ante `429 REFRESH_BLOCKED`, esperar `Retry-After`, no cerrar sesión local.
- `POST /api/auth/login`: efecto secundario documentado — aviso `seguridad` de dispositivo nuevo (in-app + push + correo, sin cooldown), best-effort y después de responder; la primera vez se siembra sin avisar (`controllers/auth.js:225-231`; `helpers/avisos-cuenta.js:76-106`; `helpers/dispositivos-conocidos.js:22-59`).
- `POST /api/auth/cuentas/reestablecer-password`: genera aviso `seguridad` (in-app + push + correo) (`controllers/auth.js:425`; `helpers/avisos-cuenta.js:32-62`).
- Re-baselizadas las citas de limiters (`flujoTokenIpLimiter :41-51`, `verificacionLimiter :140-154`, `reenvioCorreoLimiter :157-171`, `recuperacion* :59-136`, `loginLimiter :18-32`, `sesionesUsuarioLimiter :401-406`, `passwordUsuarioLimiter :391-396`) y `helpers/clave-limite.js:22-28`.

### 4.6 `usuarios.md`

- `GET /api/usuarios/registrados/nuevos-usuarios-registrados`: usa **`pollingIpLimiter`** (antes `floodLecturaIpLimiter`), `routes/usuarios.js:136`.
- `registroLimiter`: 1 h / **10** (antes 3).
- `PUT /api/usuarios/password`: añadido el aviso `seguridad` (`controllers/usuarios.js:298-299`).
- `POST /api/usuarios`: añadida nota de que la bienvenida `sistema` (in-app + correo, sin push) se dispara al **verificar el correo**, no en el alta (`controllers/auth.js:46-48`; `helpers/avisos-cuenta.js:115-133`).
- Re-baselizadas citas de `controllers/usuarios.js` (alta `:79-126`, update `:138-242`, password `:250-306`, delete `:338-516`, nuevos `:526-593`).

### 4.7 `posteos.md`

- `POST /api/posteos`: documentada la difusión `nueva_publicacion` a seguidores con la preferencia activa, después de responder y best-effort, sin correo; topes 60 min/autor y 10/24 h/receptor; editar de `perfil` a `publico` **no** difunde (`controllers/posteos.js:435-439`; `helpers/difundir-publicacion.js:134-205`).
- Actualizados `floodLecturaIpLimiter` a 3000 y `floodEscrituraIpLimiter` a 600, con citas (`:270-279`, `:282-291`, `feedUsuarioLimiter :309-314`).

### 4.8 Barrido mecánico de umbrales

`favoritos.md`, `municipios-ubicacion.md`, `uploads.md` (y los anteriores) cambian **solo** los umbrales y citas de `floodLecturaIpLimiter` (300 → 3000) y `floodEscrituraIpLimiter` (60 → 600). **No** se tocaron los limiters por usuario (`socialUsuarioLimiter` 300, `comentariosUsuarioLimiter` 300, `catalogoUsuarioLimiter` 100, `imagenUsuarioLimiter` 10, `reporteUsuarioLimiter` 10, `passwordUsuarioLimiter` 5, `sesionesUsuarioLimiter` 30, `cuentaUsuarioLimiter` 10, `posteoUsuarioLimiter` 20, `comentarioUsuarioLimiter` 10/min), ni los del panel (`admin*`) ni `healthLimiter`/`atribucionLimiter` (1 min/60).

---

## 5. Tipos de notificación documentados (Fases 3 y 6)

Enum real (9 valores): `models/Notificacion.js:28-31`.

| Tipo | Canales | Silenciable | Productor verificado |
|---|---|---|---|
| `follow` | in-app + push + correo (cooldown) | `push.follow`, `correo.follow` | `controllers/followers.js:54-75` |
| `comentario` | in-app + push + correo (cooldown) | `push.comentario`, `correo.comentario` | `controllers/comentarios.js:63-87` |
| `like` | in-app (agrupada) + push (1/posteo/10 min) | `push.like` | `controllers/likes.js:26-43` |
| `nueva_publicacion` | in-app (solo opt-in) + push | `push.nueva_publicacion` (default **false**) | `helpers/difundir-publicacion.js:134-205` |
| `posteo_eliminado_moderacion` | in-app + push + correo propio | **No** | `admin/controllers/moderacion.js:429-446` |
| `reporte_resuelto` / `reporte_descartado` | in-app + push, sin `referencia` | **No** | `admin/controllers/moderacion.js:343-356,451,528` |
| `seguridad` | in-app + push + correo (sin cooldown) | **No** | `helpers/avisos-cuenta.js:32-106` |
| `sistema` | in-app + correo | `correo.sistema` | `helpers/avisos-cuenta.js:115-133` |

Agrupación de likes: índice único parcial `like_agrupado_unico` (`models/Notificacion.js:99-102`); `contador`/`emisores`/`ultimoPushAt` (`:52-70`); upsert atómico con reintento por `E11000` (`helpers/notificar.js:104-145`). `emisores` nunca se expone (`select: false`, `models/Notificacion.js:61-65`).

Retención: leídas 90 d, no leídas 180 d, eliminadas 30 d desde `deletedAt`; las ramas por antigüedad exigen `isDeleted: false` (`helpers/retencion-notificaciones.js:15-40`).

---

## 6. Drift y observaciones encontrados fuera del brief

1. **`GET /api/notificaciones` proyecta `leida`**, campo que no existe en el modelo; nunca aparece en la respuesta. Se mantiene documentado como I12 (README) y como ⚠ en `notificaciones.md`. No se corrigió (es código).
2. **`DELETE /api/notificaciones/dispositivos/:id` y `DELETE /api/notificaciones/eliminar-notificacion/:id` usan `floodLecturaIpLimiter`** (cubo de lectura) aunque sean mutaciones; `POST /subscribe` y `POST /unsubscribe` también. Se documenta tal cual (no se corrigió). Consistente con el diseño de cubos, pero el frontend debe saber que consumen el cupo de lectura.
3. **`PUT /api/notificaciones/preferencias` devuelve 400, no 422**, por validación manual (único caso del dominio). Documentado para que el frontend no lo trate como genérico.
4. **`POST /api/notificaciones/subscribe` puede devolver `data.id: null`** en una carrera concreta (`controllers/notificaciones.js:89-97`): el endpoint está registrado pero el `findOne` posterior no lo encuentra. Derivado del código.
5. **H20 (respuesta ya enviada) queda como riesgo residual, no como bug activo**: `notificar()` nunca lanza (`helpers/notificar.js:257-260`) y `POST /api/posteos` usa `trasResponder` (`helpers/tras-responder.js:16-22`). Actualizado en el README.
6. **`referencia` se omite, no llega como `null`**, cuando el `tipoReferencia` no es `Posteo` (derivado de `$arrayElemAt` sobre array vacío, `controllers/notificaciones.js:294-306,327-328`). La doc anterior decía «puede ser `null`»; corregido en `notificaciones.md`.
7. **`bienvenida.md` conserva citas de `middlewares/rate-limiter.js` desfasadas** (`healthLimiter :233-242`, `:236-240` frente a los reales `:250-259`/`:253-258`). El dominio no estaba en el alcance de esta corrida y su contenido sustantivo (`1 min / 60`) es correcto; queda anotado para una próxima pasada.

---

## 7. Pendientes (no corregidos)

- **`docs/api/inventario-endpoints.json`**: *(superado el 2026-11-25)* la nota original decía 84 entradas; la corrida concurrente del agente `sincronizador` lo actualizó a **90** (`"total": 90`, `actualizado: 2026-11-25`), incluidas las 6 rutas nuevas de notificaciones. Las referencias vivas del README ya reflejan ese estado.
- Los **4 hallazgos abiertos** del README que no dependen de este cambio siguen vigentes (H1, H5, H6, H7, H9, H10, H12, H14, H16–H19, H21, H22-panel, H25, H26).

---

## 8. [REQUIERE VERIFICACIÓN MANUAL]

1. Entrega real de Web Push para los tipos nuevos (payload, `tag`, reemplazo en el navegador). Los datos están en el código; no se probó en ejecución.
2. Valores reales en producción de `FLOOD_LECTURA_IP_MAX`, `FLOOD_ESCRITURA_IP_MAX`, `POLLING_IP_MAX`, `NOTIF_CORREO_COOLDOWN_MIN`, `NOTIF_LIKE_PUSH_COOLDOWN_MIN`, `NOTIF_NUEVA_PUBLICACION_AUTOR_MIN`, `NOTIF_NUEVA_PUBLICACION_RECEPTOR_MAX_DIA` y `NOTIF_*_DIAS` (defaults en código; los vigentes viven en App Platform).
3. Ejecución del cron de retención (`jobs/limpiar-notificaciones-antiguas.js`, 05:00): filtro verificado por lectura, no ejecutado.
4. Forma exacta de `data.dispositivos` frente a suscripciones reales de FCM/APNs (`endpointHash` depende del endpoint devuelto por el navegador).
5. Comportamiento de iOS con `vapidPublicKey` público y el gesto de permiso (diseño declarado en `routes/notificaciones.js:38-41`; no probado en dispositivo).

---

## 9. Pruebas ejecutadas en esta corrida

Ninguna. El entorno no tiene levantados MongoDB, Cloudinary ni SMTP, y las pruebas del repo requieren esas dependencias. Todo el contenido se verificó por lectura del código en `dd88f4b`. Los ejemplos de request/response están etiquetados **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## 10. Archivos escritos en esta corrida

- `docs/api/notificaciones.md` (reescrito completo: 13 endpoints + secciones de tipos, canales, silenciabilidad, agrupación de likes y retención).
- `docs/api/README.md` (encabezado y totales 90; nueva entrada del registro de revisiones; índice; tabla de paginación; formato de error y tabla del handler; tabla de limiters; CORS/`exposedHeaders`; tabla de endpoints renumerada 1–90; hallazgos H8/H9/H20 e I12; §Totales; verificación manual; nota de método).
- `docs/api/followers.md`, `comentarios.md`, `likes.md`, `reportes.md`, `auth.md`, `usuarios.md`, `posteos.md` (contrato de notificaciones, limiters y re-baseline de citas).
- `docs/api/favoritos.md`, `municipios-ubicacion.md`, `uploads.md` (solo umbrales/citas de `flood*`).
- `docs/api/2026-11-25_20-27-06_documentacion-endpoints.md` (este archivo).

Sin cambios: código fuente, `docs/api/inventario-endpoints.json`, `postman/`, `engineering/`, `docs/specs/`.

---

## Addendum (admin) — verificación de los 25 endpoints

**Generado:** 2026-11-25 (seguimiento de la misma corrida)
**Alcance:** auditoría del dominio **admin**, que faltó en la corrida anterior. No se abrieron rutas nuevas ni se eliminó ninguna.
**Base de comparación:** los propios archivos `docs/api/admin-*.md` (última revisión 2026-11-17) frente al código en HEAD `dd88f4b`.

### Qué se verificó (25/25)

| Dominio | Endpoints | Rutas verificadas | Resultado |
|---|---|---|---|
| `admin-auth-totp.md` | 10 | `admin/routes/index.js:51,58,65,68,71,74,84,87,94,101` | Sin cambios de contrato; **citas re-baselizadas** |
| `admin-cuentas.md` | 3 | `admin/routes/index.js:111,120,126` | **Sin drift** (rutas, controlador y citas ya correctas) |
| `admin-moderacion.md` | 7 | `admin/routes/moderacion.js:28,45,54,63,73,95,105` | **1 drift de contrato corregido** (notificaciones) + citas re-baselizadas |
| `admin-influencers.md` | 5 | `admin/routes/influencers.js:27,47,61,84,105` | Sin cambios de contrato; **citas re-baselizadas** |

En los 25 se comprobó: método, ruta, orden de la cadena (`verificarSesionAdmin` → `verificarPermisoAdmin` → limiter → validadores → controlador), permiso exacto y limiter. Los permisos coinciden (`moderacion:leer|resolver|descartar|recategorizar`, `posteos:ocultar|restaurar`, `cuentas:crear|leer|desactivar`, `influencers:leer|crear|editar|eliminar`; `admin/routes/*`). Los limiters del panel **no cambiaron**: login 15/5 (`admin/middlewares/rate-limiter.js:28-45`), TOTP 5/5 (`:48-61`), refresh 15/10 (`:64-77`), moderación lectura 300 (`:80-95`) y escritura 60 (`:98-113`), influencers lectura 300 (`:116-131`) y escritura 60 (`:134-149`). Solo se corrigieron sus citas de línea.

### Drift encontrado (el único de contrato): notificaciones a los reportantes

Código de referencia: `admin/controllers/moderacion.js` (commits `eca1e44`, `35ece87`, `c4167a2`).

1. **`PUT /api/v1/admin/moderacion/reportes/:id/resolver`**
   - Además del correo + in-app al autor (`posteo_eliminado_moderacion`, `:420-447`), avisa a **todos los reportantes** del posteo (el reclamado y los pendientes de la cascada) con `Notificacion.tipo: 'reporte_resuelto'` (`:451`).
   - El conjunto se calcula **dentro de la transacción y antes de la cascada** con `reporterosDelPosteo` (`:323-330,390`): un reintento de `withTransaction` recalcula la lista y no duplica.
   - Aviso (`notificarResultadoReporte`, `:343-356`): in-app + push, **sin correo**, mensaje literal "Gracias por tu reporte. Revisamos la publicación y tomamos medidas.", **sin `referencia`**, sin categoría ni datos del autor ni de otros reporteros (anonimato), `tag: 'reporte'`. Tipo sin clave de preferencia → **no silenciable**.
   - La respuesta (`responder`, `:414`) se envía **antes** de los efectos externos (`trasResponder`, `:416-452`): un fallo no revierte la transacción ni cambia el `200`.
   - Corregida además la nota antigua "si el posteo ya estaba eliminado… no se notifica de nuevo": es válido **para el autor**, pero los reportantes **sí** reciben `reporte_resuelto` (`:449-451`).
2. **`PUT /api/v1/admin/moderacion/reportes/:id/descartar`**
   - Mismo aviso con `tipo: 'reporte_descartado'`, mensaje literal "Gracias por tu reporte. Revisamos la publicación y no encontramos una infracción a nuestras normas.", in-app + push, sin correo ni `referencia` (`:528`).
   - **Corregida** la nota "Tras descartar, el reportero no recibe ninguna señal": ya no es cierta. Lo que se mantiene es que el posteo sigue oculto para quien lo reportó.
   - La respuesta (`:526`) precede a los efectos (`trasResponder`, `:528`).
3. **`PUT .../recategorizar`, `PUT .../posteos/:posteoId/ocultar` y `PUT .../posteos/:posteoId/restaurar`:** **no notifican**. Verificado: no hay llamadas a `notificar` en `:543-580`, `:585-634` ni `:639-667`. No se añadió nada inventado; solo una nota explícita de que no hay efecto de notificación.

### Citas re-baselizadas (archivo tocado → cambios)

- `admin-moderacion.md`: controlador (`obtenerColaReportes 52→54`, `obtenerDetalleReporte 170→172`, `resolverReporte 321→361`, `reclamarReportePendiente 291→293`, `descartarReporte 406→467`, `recategorizarReporte 477→543`, `ocultarPosteo 519→585`, `restaurarPosteo 573→639` y todos los `throw` citados), limiters (`73→80`, `80-82→86-89`, `92→98`, `98-100→104-107`) y líneas de validación (`32-38→32-40`, `77-81→77-85`).
- `admin-auth-totp.md`: montaje `models/server.js:137→141`; controladores de auth (`loginPaso1 58→60`, `loginTotp 118→120`, `refreshAdmin 189→191`, `logoutAdmin 248→250`, `getMeAdmin 262→264`, `cambiarPasswordAdmin 279→281`, estados `100-103→102-105`) y todos los `throw`; controladores de TOTP (`setupTotp 35→36`, `activateTotp 76→77`, `regenerarBackups 120→121`, `reemitirTotp 155→156` y sus errores); limiters (`23→28`, `29-31→34-37`, `43→48`, `50-52→54-57`, `58→64`, `65-67→70-73`).
- `admin-influencers.md`: `actualizarInfluencer 133→137`, `eliminarInfluencer 167→171`, `obtenerMetricasInfluencers 196→200`, `throw` de rango `208→212` (el `212` es el de "desde > hasta"; el `208` era "hasta no es válida"), errores `140→144`, `152→156`, `178→182`; limiters `111→116`, `118-120→122-125`, `130→134`, `137-139→140-143`; `middlewares/error-handler.js:108-118→113-123` (4×); `models/server.js:53-55→55-57`.
- `admin-cuentas.md`: **sin cambios de citas**; solo se añadió la nota de verificación.

### Endpoints nuevos/eliminados en admin

**0 nuevos, 0 eliminados.** El conteo del panel sigue en **25** (auth/TOTP 10 + cuentas 3 + moderación 7 + influencers 5), y el total general sigue en **90** (65 red social + 25 panel). `docs/api/inventario-endpoints.json` no se tocó desde este agente: ya estaba en **90** (`"total": 90`) por la corrida del `sincronizador` del mismo día, y su inventario de admin coincide con estas 25 rutas.

### Archivos escritos en este addendum

- `docs/api/admin-moderacion.md` (drift de notificaciones + citas).
- `docs/api/admin-auth-totp.md` (citas + montaje).
- `docs/api/admin-influencers.md` (citas + nota de verificación).
- `docs/api/admin-cuentas.md` (solo nota de verificación).
- `docs/api/2026-11-25_20-27-06_documentacion-endpoints.md` (este addendum).

Sin cambios: código fuente, `docs/api/inventario-endpoints.json`, `postman/`, `engineering/`.
