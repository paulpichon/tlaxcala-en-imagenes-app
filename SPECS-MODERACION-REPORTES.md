# SPECS — Moderación de Reportes de Publicaciones (Panel de Administración)

Contrato del módulo de moderación de reportes de publicaciones del **Panel de Administración** de TlaxApp. Reemplaza al sistema legado `/api/v1/admin/moderacion` (colección `Moderador` eliminada).

> **Contexto:** la Fase 1 guardó los reportes y ocultó el posteo para el reportante. La Fase 2 del panel implementa: identidad de administrador con rol `MODERADOR`, cola de reportes **priorizada dinámicamente**, ocultamiento global de posteos, eliminación por moderación con notificación anónima al autor, recategorización y limpieza de reportes huérfanos.

---

## 1. Resumen ejecutivo

| Aspecto | Comportamiento |
|---|---|
| Base path | `/api/v1/admin/moderacion` |
| Autenticación | Sesión del panel (`adminAccessToken`) + `verificarPermisoAdmin(...)` |
| Identidad moderador | Cuenta `Admin` con rol `MODERADOR` (separada del modelo `Usuario`) |
| Cola de reportes | Solo `estatus: pendiente`, ordenada por **score dinámico** (gravedad + volumen + antigüedad) |
| Ocultamiento global | Posteo invisible para **todos excepto su autor**; reversible; NO es `isDeleted` |
| Eliminación por moderación | `isDeleted: true` + `deleteReason: 'moderation'` + notificación anónima al autor |
| Cascada | Resolver/descartar un reporte aplica a **todos** los pendientes del mismo posteo, con transición atómica; un solo ganador notifica |
| Reportero | Se expone **solo** en moderación; jamás fuera de ella |
| Rate limiting | `adminModeracionLecturaLimiter` (15 min / 300) y `adminModeracionEscrituraLimiter` (15 min / 60), clave `Admin._id` |
| Anclar casos | Iteración posterior (fuera de esta spec) |

---

## 2. Identidad del moderador

- El sistema legado (`models/Moderador.js`, colección `moderadores`, middleware `verificarModerador`, script `crear-moderador.js`) fue eliminado.
- El moderador opera con una cuenta `Admin` (modelo `admin/models/Admin.js`, colección `admins`) con rol `MODERADOR`.
- Inicia sesión con el flujo de 2 pasos del panel (TOTP o código de respaldo) y recibe cookies `adminAccessToken` / `adminRefreshToken` con `path: '/api/v1/admin'`.
- El permiso vive en `Admin.permisos` (snapshot por cuenta), **no** en el token. Quitar un permiso surte efecto inmediato.
- Alta de moderadores: `node --env-file=.env.development admin/scripts/crear-admin.js --correo=mod@tlaxapp.com --rol=MODERADOR`.
- Desactivación: `Admin.updateOne({ _id }, { activo: false })` → pierde acceso al instante sin perder historial.
- El middleware `verificarPermisoAdmin(...)` responde `403` si la cuenta no tiene el permiso requerido.

---

## 3. Priorización dinámica de la cola (score)

Se calcula **en cada query** (nada se persiste). Cambios de pesos/categorías aplican al instante sin migración.

```
score = (PRIORIDAD_MAX + 1 − prioridad) × PESO_CATEGORIA + volumen × PESO_VOLUMEN
```

| Constante | Valor | Función |
|---|---|---|
| `PRIORIDAD_MAX` | derivada del catálogo (hoy `7`) | inversión de la escala de gravedad |
| `PESO_CATEGORIA` | `1000` | la gravedad domina |
| `PESO_VOLUMEN` | `100` | empuje secundario por volumen |
| `VOLUMEN_MAX` | `10` | tope anti ataque coordinado |

**Inversión `(PRIORIDAD_MAX + 1 − prioridad)`** — la BD guarda `1` = más grave, pero el score sube con la urgencia:

| prioridad (BD) | score de categoría |
|---|---|
| 1 (inapropiado) | 7 × 1000 = 7000 |
| 2 (ofensivo) | 6000 |
| 3 (acoso) | 5000 |
| 4 (suplantación) | 4000 |
| 5 (info. falsa) | 3000 |
| 6 (spam) | 2000 |
| 7 (otro) | 1000 |

**`volumen`** = reportes **pendientes** del mismo posteo (**incluye el reporte en curso**, mínimo 1), saturado a 10. **Antigüedad** = desempate del `$sort` (`score: -1, createdAt: 1`), no va en la fórmula.

**Ejemplos numéricos** (volumen ≥ 1 porque incluye el propio reporte):

| Caso | Cálculo | Resultado |
|---|---|---|
| 1 × `acoso` (cat. 3) | 5000 + 100 | 5100 |
| 5 × `info. falsa` (cat. 5) | 3000 + 500 | 3500 → **no** supera al acoso ✓ |
| 5 × `ofensivo` (cat. 2) | 6000 + 500 | 6500 → **no** supera cat. 1 (7100) ✓ |
| 1 × `info. falsa` vs 4 × `info. falsa` (mismo posteo) | 3100 vs 3400 | el multitudinario va primero dentro de su categoría ✓ |

**Receta: cómo agregar o repriorizar una categoría**
1. Editar `helpers/categorias-reporte.js` (fuente única: `slug → { label, prioridad }`).
2. Actualizar el enum `categoria` (+ `prioridad`) en `models/ReportePosteo.js`.
3. Si cambiaron prioridades: **backfill** → `ReportePosteo.updateMany({ categoria: 'x' }, { $set: { prioridad: nueva } })`.
4. Las rutas derivan las categorías válidas de forma automática (`Object.keys(CATEGORIAS_REPORTE)`); el score usa `PRIORIDAD_MAX` derivado (nada de literales).
5. Calibración de pesos: editar `PESO_CATEGORIA` / `PESO_VOLUMEN` en `admin/controllers/moderacion.js` — sin migración.

---

## 4. Contrato de la API

Todos los endpoints requieren **sesión completa del panel + permiso**. Además aplican los limiters `adminModeracionLecturaLimiter` (lecturas) y `adminModeracionEscrituraLimiter` (escrituras), clave `Admin._id`, código `ADMIN_MODERACION_BLOCKED`.

### 4.1 `GET /api/v1/admin/moderacion/reportes`

Cola de reportes pendientes paginada (`?page=&limite=`), ordenada por score desc + antigüedad asc. **Excluye** los reportes cuyo posteo está eliminado (`posteo.isDeleted: true`): no tiene sentido moderar un posteo que ya no existe.

**Respuesta (`200`):** `responderPaginado` con `data[]`:

```json
{
  "_id": "reporteId",
  "categoria": "contenido_ofensivo",
  "prioridad": 2,
  "descripcion": "texto opcional",
  "createdAt": "ISO",
  "score": 6500,
  "volumen": 5,
  "posteo": { "_id": "...", "public_id": "...", "texto": "...", "visibilidad": "publico", "ocultoPorModeracion": false, "isDeleted": false, "fecha_creacion": "ISO" },
  "autorPosteo": { "_id": "...", "nombre_completo": { "nombre": "...", "apellido": "..." }, "url": "..." },
  "reportero": { "_id": "...", "nombre_completo": { "nombre": "...", "apellido": "..." }, "url": "..." }
}
```

### 4.2 `GET /api/v1/admin/moderacion/reportes/:id`

Detalle del reporte + `posteo`, `autorPosteo`, `reportero` y `otrosPendientes[]` (reportes pendientes del mismo posteo). Sirve cualquier `estatus`.

### 4.3 `PUT /api/v1/admin/moderacion/reportes/:id/resolver`

Confirma violación. Efectos (dentro de una transacción `session.withTransaction`):
1. **Claim atómico** del reporte `{ _id, estatus: 'pendiente', isDeleted: false }`; si no lo gana → `400`/`404`.
2. Elimina el posteo: `isDeleted: true, deleteReason: 'moderation', deletedAt: now` (solo si aún estaba `isDeleted: false`; si una eliminación manual ganó la carrera, **no** se pisa `deleteReason`).
3. **Cascada**: todos los pendientes del posteo → `resuelto` (`resueltoPorAdmin`, `resueltoAt`).
4. **Notifica al autor** (email + notificación in-app) **después del commit**: mensaje genérico con la categoría del catálogo. **Sin mención de reportes ni reportantes.** Solo notifica la llamada que ganó la transición `isDeleted: false → true` (evita correos duplicados).

> **Notificación in-app — contrato:** tipo `posteo_eliminado_moderacion`, llega **sin** el campo `emisor` (notificación de sistema: el `$lookup` de `GET /api/notificaciones` lo omite cuando `emisor: null`). El frontend la debe renderizar como **notificación de sistema**: logotipo de TlaxApp + `mensaje`, sin avatar ni link a perfil. `referencia` = posteo eliminado (`{ public_id, texto }` mientras el doc soft-deleted exista; puede **desaparecer** tras el hard-delete del cron → el renderer debe tolerarlo). La URL del logotipo/ícono del sistema es la misma que el backend usa como `ICONO_SISTEMA_TLAXAPP` (definida en `.env`); el frontend la consume desde su propio `.env` con el mismo valor.

`400` si el reporte ya fue atendido (incluye carreras entre moderadores). `404` si no existe.

### 4.4 `PUT /api/v1/admin/moderacion/reportes/:id/descartar`

No confirma violación. Efectos (dentro de una transacción `session.withTransaction`):
1. **Claim atómico** del reporte `{ _id, estatus: 'pendiente', isDeleted: false }`; si no lo gana → `400`/`404`.
2. **Cascada**: pendientes del posteo → `descartado` (`resueltoPorAdmin`, `resueltoAt`).
3. **Restauración global**: si el posteo estaba `ocultoPorModeracion` y **ya no quedan pendientes** → se restaura (`ocultoPorModeracion: false`). El conteo y la escritura comparten el snapshot transaccional, por lo que no puede quedar un posteo oculto sin pendientes. El ocultamiento **personal** de cada reportante no se revierte (decisión Fase 1).

### 4.5 `PUT /api/v1/admin/moderacion/reportes/:id/recategorizar`

Body: `{ "categoria": "<slug válido>" }`. Actualiza `categoria` + recalcula `prioridad`. No cambia `estatus`. Requiere reporte `pendiente` (transición condicional atómica): si el reporte dejó de estar `pendiente` → `400` y **no** se altera su historial.

### 4.6 `PUT /api/v1/admin/moderacion/posteos/:posteoId/ocultar`

Ocultamiento global preventivo: `ocultoPorModeracion: true, ocultadoPorAdmin: <Admin._id>, ocultadoAt`. No toca `isDeleted`, no notifica. `404` si el posteo no existe o está eliminado. (`ocultadoPor` quedó como campo legado de la etapa anterior —cuenta de TlaxApp— y ya no se escribe.)

### 4.7 `PUT /api/v1/admin/moderacion/posteos/:posteoId/restaurar`

Reverse del ocultamiento: revierte los 3 campos (`ocultoPorModeracion`, `ocultadoPorAdmin`, `ocultadoAt`). El posteo vuelve a ser visible para todos (salvo los ocultamientos personales por reportes de Fase 1). `ocultar`/`restaurar` usan una transición condicional atómica (`{ _id, isDeleted: false }`) vía `findOneAndUpdate`.

### 4.8 Concurrencia y atomicidad

Para evitar efectos parciales y notificaciones duplicadas cuando dos moderadores actúan a la vez:

- **Transiciones condicionales**: los cambios de estado usan `findOneAndUpdate` con el estado esperado (`estatus: 'pendiente'`, `isDeleted: false`) y verifican el resultado. El helper `reclamarReportePendiente` concentra el claim y preserva el contrato `404`/`400`.
- **Transacciones**: `resolver` (posteo + reportes) y `descartar` (reportes + conteo + restauración) corren en `session.withTransaction`, por lo que son "todo o nada". `withTransaction` reintenta `WriteConflict` y errores transitorios de forma automática.
- **Efectos externos post-commit**: correo y notificación in-app se disparan únicamente después de confirmar la transacción y son *best-effort* (un fallo no revierte la moderación, como antes). Nunca se envían si la transacción aborta.
- **Un solo ganador**: solo la llamada que gana la transición `isDeleted: false → true` notifica al autor.
- **Carreras esperadas**: si dos moderadores atienden reportes del mismo posteo a la vez, la transacción perdedora reintenta y recibe `400` ("ya fue atendido"): **solo una** responde `200` y notifica. La cascada es idempotente y nunca hay doble notificación.
- **Cola**: excluye reportes de posteos eliminados; el detalle (`GET /reportes/:id`) sigue sirviendo cualquier `estatus`.

---

## 5. Visibilidad del posteo oculto globalmente

| Vista | Autor | Visitante / sin sesión |
|---|---|---|
| `GET /api/posteos` (feed) | — (no aparecen propios) | excluido |
| `GET /api/posteos/usuario/:idUsuario` | **visible** con `ocultoPorModeracion: true` (badge "En revisión") | excluido |
| `GET /api/posteos/post/:id` (link directo) | `200` | `404` (no revela existencia) |
| `GET /api/favoritos` | excluido | excluido |
| Likes / comentarios / toggle | autor puede interactuar | `404` |
| Edición / eliminación (`PUT`/`DELETE /:id`) | autor puede | `404` |

> Regla de implementación (backend): en `helpers/validar-id-posteo.js`, un posteo oculto + no-autor → `404`. En las queries de feed/perfil ajeno/favoritos → `ocultoPorModeracion: { $ne: true }`.

---

## 6. Modelos modificados

| Modelo | Cambio |
|---|---|
| `Posteo` | `ocultoPorModeracion` (Boolean, default false), `ocultadoPor` (ref Usuario, legado), `ocultadoPorAdmin` (ref Admin), `ocultadoAt` (Date) |
| `Posteo.deleteReason` | enum ampliado: `["manual", "accountDeletion", "moderation", null]` |
| `Notificacion.tipo` | enum ampliado: `'posteo_eliminado_moderacion'` |
| `ReportePosteo` | `resueltoPorAdmin` (ref Admin) agregado; `resueltoPor` (ref Usuario) es legado |

---

## 7. Limpieza de reportes huérfanos (cron)

Los reportes se limpian en los flujos existentes (sin cron nuevo):

- Hard-delete de posteos: borra `ReportePosteo` del posteo y acepta `deleteReason: ['manual','moderation']`.
- Eliminación de cuentas (cron y transacción de `controllers/usuarios.js`): reportes `reporteroId` y `autorId` de la cuenta.

---

## 8. Fuera de alcance (iteraciones futuras)

- **Anclar casos** (fijar un reporte arriba de la cola) — 1 campo + 1 línea del sort.
- Priorización por impacto (likes/vistas del posteo).
- Ocultamiento global **automático** por categoría 1 con un solo reporte (decisión: manual por ahora).
- Panel UI de moderación y sistema de administración aparte.
- Reportes de usuarios y soporte.