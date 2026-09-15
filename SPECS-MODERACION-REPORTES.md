# SPECS — Moderación de Reportes de Publicaciones (Fase 2)

Especificación de la **Fase 2** de la función "Reportar una publicación". Contrato para el **futuro panel/frontend de moderación** (sistema de administración aparte que gestionará reportes de publicaciones, de usuarios, soporte, etc.). En esta fase el backend ya está listo; la moderación se opera vía API (Postman o el panel futuro).

> **Contexto:** la Fase 1 guardó los reportes y ocultó el posteo para el reportante. La Fase 2 agrega: identidad de moderador, cola de reportes **priorizada dinámicamente**, ocultamiento global de posteos, eliminación por moderación con notificación anónima al autor, recategorización y limpieza de reportes huérfanos.

---

## 1. Resumen ejecutivo

| Aspecto | Comportamiento |
|---|---|
| Base path | `/api/moderacion` |
| Autenticación | `verificarTokenSesion` + `verificarModerador` (colección `Moderador`) |
| Identidad moderador | Cuenta normal de TlaxApp promovida en la colección `Moderador` (sin tocar el modelo `Usuario`) |
| Cola de reportes | Solo `estatus: pendiente`, ordenada por **score dinámico** (gravedad + volumen + antigüedad) |
| Ocultamiento global | Posteo invisible para **todos excepto su autor**; reversible; NO es `isDeleted` |
| Eliminación por moderación | `isDeleted: true` + `deleteReason: 'moderation'` + notificación anónima al autor |
| Cascada | Resolver/descartar un reporte aplica a **todos** los pendientes del mismo posteo |
| Reportero | Se expone **solo** en moderación; jamás fuera de ella |
| Anclar casos | Iteración posterior (fuera de esta spec) |

---

## 2. Identidad del moderador

- **`models/Moderador.js`** (colección `moderadores`): `{ usuarioId → Usuario (unique), activo, agregadoPor, createdAt }`.
- El moderador inicia sesión con su cuenta normal de TlaxApp (mismas cookies/JWT). El permiso vive en la colección, **no** en el token.
- Promoción: `node --env-file=.env.development scripts/crear-moderador.js --correo=admin@tlaxapp.com` (o `--id=<mongoId>`). Requiere cuenta activa (`estatus: 1`, `email_validated: true`).
- Desactivación: `Moderador.updateOne({ usuarioId }, { activo: false })` → pierde acceso al instante sin perder historial.
- El middleware `verificarModerador` responde `403` si la cuenta no es moderador activo.

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
5. Calibración de pesos: editar `PESO_CATEGORIA` / `PESO_VOLUMEN` en `controllers/moderacion.js` — sin migración.

---

## 4. Contrato de la API

Todos los endpoints requieren **sesión + moderador**. No hay rate limiter propio (acceso restringido por rol).

### 4.1 `GET /api/moderacion/reportes`

Cola de reportes pendientes paginada (`?page=&limite=`), ordenada por score desc + antigüedad asc.

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

### 4.2 `GET /api/moderacion/reportes/:id`

Detalle del reporte + `posteo`, `autorPosteo`, `reportero` y `otrosPendientes[]` (reportes pendientes del mismo posteo). Sirve cualquier `estatus`.

### 4.3 `PUT /api/moderacion/reportes/:id/resolver`

Confirma violación. Efectos:
1. Elimina el posteo: `isDeleted: true, deleteReason: 'moderation', deletedAt: now` (si aún existía).
2. **Cascada**: todos los pendientes del posteo → `resuelto` (`resueltoPor`, `resueltoAt`).
3. **Notifica al autor** (email + notificación in-app): mensaje genérico con la categoría del catálogo. **Sin mención de reportes ni reportantes.**

`400` si el reporte ya fue atendido. `404` si no existe.

### 4.4 `PUT /api/moderacion/reportes/:id/descartar`

No confirma violación. Efectos:
1. **Cascada**: pendientes del posteo → `descartado`.
2. **Restauración global**: si el posteo estaba `ocultoPorModeracion` y **ya no quedan pendientes** → se restaura (`ocultoPorModeracion: false`). El ocultamiento **personal** de cada reportante no se revierte (decisión Fase 1).

### 4.5 `PUT /api/moderacion/reportes/:id/recategorizar`

Body: `{ "categoria": "<slug válido>" }`. Actualiza `categoria` + recalcula `prioridad`. No cambia `estatus`. Requiere reporte `pendiente`.

### 4.6 `PUT /api/moderacion/posteos/:posteoId/ocultar`

Ocultamiento global preventivo: `ocultoPorModeracion: true, ocultadoPor, ocultadoAt`. No toca `isDeleted`, no notifica. `404` si el posteo no existe o está eliminado.

### 4.7 `PUT /api/moderacion/posteos/:posteoId/restaurar`

Reverse del ocultamiento: revierte los 3 campos. El posteo vuelve a ser visible para todos (salvo los ocultamientos personales por reportes de Fase 1).

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
| `Posteo` | `ocultoPorModeracion` (Boolean, default false), `ocultadoPor` (ref Usuario), `ocultadoAt` (Date) |
| `Posteo.deleteReason` | enum ampliado: `["manual", "accountDeletion", "moderation", null]` |
| `Notificacion.tipo` | enum ampliado: `'posteo_eliminado_moderacion'` |
| `ReportePosteo` | sin cambios (campos `estatus/resueltoPor/resueltoAt` ya listos en Fase 1) |

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