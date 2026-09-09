# SPECS — Reportar una publicación

Especificación de la **Fase 1** de la función "Reportar una publicación". Contrato para que el frontend implemente el formulario de reporte, el mensaje de confirmación y el ocultamiento del posteo reportado.

> **Contexto:** un usuario detecta una publicación que considera contraria a las normas de TlaxApp y la reporta. El reporte se guarda con un motivo predefinido y, como efecto inmediato, **la publicación desaparece de forma permanente para el usuario que reportó** (feed y perfil del autor). El autor del posteo **nunca** se entera de que fue reportado ni de quién lo hizo. La moderación (revisar, resolver o descartar reportes) es **Fase 2**, no implementada en el backend todavía.

---

## 1. Resumen ejecutivo

| Aspecto | Comportamiento |
|---|---|
| Endpoint | `POST /api/reportes/:posteoId` |
| Autenticación | Requerida (`verificarTokenSesion`) |
| Motivos (categorías) | 7 predefinidos + texto opcional (obligatorio en "otro") |
| Efecto inmediato | El posteo se oculta del feed, del perfil y de la lista de favoritos **solo para el reportante** |
| Ocultamiento | **Permanente** — no se revierte aunque moderación descarte el reporte |
| Autor del posteo | No recibe notificación del reporte ni conoce al reportante |
| Anonimato | El backend nunca expone `reporteroId` fuera de moderación |
| Reportes duplicados | Rechazados: `409` (un usuario no puede reportar dos veces el mismo posteo) |
| Reportar posteo propio | Rechazado: `409` |
| Rate limit | `reporteLimiter` (15 min / 10) → `REPORTE_BLOCKED` |

---

## 2. Categorías y prioridad de revisión

Las categorías tienen una **prioridad fija** (1 = más grave) que se guarda denormalizada en el documento `ReportePosteo` y servirá para ordenar la cola de moderación en la Fase 2.

| # | `categoria` (slug) | Label | Prioridad |
|---|---|---|---|
| 1 | `contenido_inapropiado` | Contenido inapropiado (desnudez/sexual) | 1 |
| 2 | `contenido_ofensivo` | Contenido ofensivo o discurso de odio | 2 |
| 3 | `acoso_bullying` | Acoso o bullying | 3 |
| 4 | `suplantacion_identidad` | Suplantación de identidad | 4 |
| 5 | `informacion_falsa` | Información falsa | 5 |
| 6 | `spam` | Spam o publicidad no autorizada | 6 |
| 7 | `otro` | Otro | 7 |

> **Nota de priorización dinámica (Fase 2):** la prioridad actual es **fija por categoría**. La calificación dinámica (volumen de reportes del mismo posteo, antigüedad, recurrencia del autor, impacto, recategorización manual) se implementará en la Fase 2, junto con el panel de moderación. El modelo y sus índices (`estatus + prioridad + createdAt`, `posteoId + estatus`) quedan preparados para eso sin migración.

---

## 3. Contrato de la API

### 3.1 `POST /api/reportes/:posteoId`

**Body (JSON):**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `categoria` | String | Sí | Una de las 7 slugs de la tabla |
| `descripcion` | String | Condicional | Debe ser **texto** (max 200 caracteres en unidades de código UTF-16, igual que el `maxlength` del modelo); **obligatoria si `categoria === 'otro'`** (`422` si falta o queda vacía tras `trim`). Valores `null`/`''`/ausentes con otra categoría se normalizan a `null` en la BD. |

**Respuestas:**

| Caso | Código | Cuerpo |
|---|---|---|
| Reporte creado | `201` | `{ success: true, msg: "Reporte recibido. Esta publicación ya no aparecerá en tu feed.", data: { reporteId } }` |
| Posteo propio | `409` | `ConflictError` — "No puedes reportar tu propia publicación" |
| Reporte duplicado | `409` | `ConflictError` — "Ya reportaste esta publicación" |
| Posteo eliminado / no existe | `404` | `NotFoundError` (vía `validarIdPosteo`) |
| Categoría inválida | `422` | `ValidationError` |
| "otro" sin descripción | `422` | `ValidationError` |
| Rate limit | `429` | `REPORTE_BLOCKED` |

> La respuesta de éxito **no** incluye el posteo, el reportante ni el autor: solo `reporteId`. El toast de confirmación lo muestra el frontend.

---

## 4. Ocultamiento del posteo para el reportante

El solo hecho de **existir** un `ReportePosteo` (activo, `isDeleted: false`) del usuario hacia un posteo lo oculta para ese usuario, sin una colección aparte. Se aplica en:

| Consulta | Efecto |
|---|---|
| `GET /api/posteos` (feed) | Excluye los `posteoId` reportados con `$nin` |
| `GET /api/posteos/usuario/:idUsuario` (perfil) | Excluye los `posteoId` reportados con `$nin` |
| `GET /api/favoritos` (favoritos del usuario) | Excluye los favoritos cuyo `posteoId` fue reportado (el favorito persiste en BD, solo deja de mostrarse) |
| `GET /api/posteos/post/:id` (link directo) | **Sin cambios** — el posteo sigue visible por link directo |

> **Ocultamiento permanente:** análogo a "ocultar" en otras redes. Aunque en la Fase 2 un moderador descarte el reporte, el posteo **no reaparece** para el usuario que lo reportó (decisión personal de no verlo). El `estatus` del reporte no afecta al ocultamiento.

---

## 5. Anonimato y notificaciones

- **No** se genera notificación (in-app ni correo) al autor al momento de reportar.
- El reportante **no** es expuesto en ninguna respuesta de la Fase 1.
- Fase 2: si la moderación **elimina** el posteo, el autor verá un mensaje genérico — "Tu publicación fue eliminada por infringir las normas: [categoría]" — sin mención del reporte ni del reportante.

---

## 6. Modelo `ReportePosteo`

| Campo | Tipo | Notas |
|---|---|---|
| `reporteroId` | ObjectId ref `Usuario` | Quién reporta |
| `posteoId` | ObjectId ref `Posteo` | Posteo reportado |
| `autorId` | ObjectId ref `Usuario` | Autor del posteo (denormalizado) |
| `categoria` | String enum 7 slugs | Motivo |
| `prioridad` | Number enum 1-7 | Derivada de la categoría |
| `descripcion` | String (max 200, trim) | `null` salvo "otro" |
| `estatus` | String enum `pendiente/resuelto/descartado` | default `pendiente` (Fase 2) |
| `resueltoPor` / `resueltoAt` | ObjectId / Date | `null` (Fase 2) |
| `createdAt` | Date | default `Date.now` |
| `isDeleted` / `deletedAt` | Boolean / Date | Soft delete |

**Índices:** único parcial `(reporteroId, posteoId)` con `isDeleted: false` (evita duplicados **y** cubre la query de ocultamiento del feed/perfil); `(posteoId, estatus)` (conteo por posteo); `(estatus, prioridad, createdAt)` (cola de moderación); `(isDeleted, deletedAt)` (limpieza).

---

## 7. Validaciones y edge cases

| Caso | Resultado |
|---|---|
| Reportar posteo ya reportado | `409` (índice único parcial → `E11000` capturado en controller) |
| Reportar posteo propio | `409` |
| Posteo con `isDeleted: true` | `404` (`validarIdPosteo`) |
| Categoría fuera del enum | `422` |
| "otro" sin descripción | `422` |
| Descripción > 200 | `422` |
| Descripción no-string (número/objeto) | `422` |
| Descripción con emojis/símbolos no-BMP (≥200 unidades de código) | `422` |
| Sin sesión | `401` |

---

## 8. Recomendaciones para el frontend

### 8.1 Flujo del formulario de reporte

1. Botón "Reportar" en el posteo (feed, perfil, detalle o favoritos). En los posteos **propios** el botón debe ocultarse o deshabilitarse: el backend responde `409` "No puedes reportar tu propia publicación".
2. Modal/formulario con las **7 categorías** (usar los `slug` como valor y los `label` como texto visible). Si la categoría es `otro`, mostrar un `textarea` **obligatorio** (máx. 200 caracteres); en las demás, opcional.
3. Enviar `POST /api/reportes/:posteoId` con `{ categoria, descripcion? }`.

### 8.2 Tras un `201` exitoso

El backend **no** devuelve ningún campo tipo `isReportado` y no elimina el posteo: simplemente deja de aparecer en las próximas respuestas de feed, perfil y favoritos. Para mantener la UI consistente sin esperar un fetch nuevo:

- **Remover el posteo de la lista en memoria** (feed, perfil o favoritos según dónde se haya reportado).
- Mostrar el toast de confirmación (el mensaje del backend puede usarse tal cual o sustituirse por uno propio).

> ⚠️ Si no se remueve localmente, el posteo seguirá visible hasta el siguiente fetch y la paginación puede quedar desalineada.

### 8.3 Manejo de errores

| Código | Mensaje de referencia | Acción sugerida |
|---|---|---|
| `409` | "Ya reportaste esta publicación" | Mostrar aviso y **deshabilitar/ocultar** el botón Reportar para ese posteo (reporte único por usuario) |
| `409` | "No puedes reportar tu propia publicación" | Ocultar/deshabilitar el botón en posteos propios (evitar llegar aquí) |
| `422` | "La descripcion es obligatoria cuando la categoria es 'otro'" / "La descripcion debe ser texto de maximo 200 caracteres" | Validar en el formulario: mostrar el `textarea` obligatorio en `otro`, `maxLength={200}`, bloquear envío |
| `404` | Posteo eliminado/no existe | Mostrar aviso; quitar el posteo de la UI si aún aparecía |
| `429` | `REPORTE_BLOCKED` (15 min / 10 reportes) | Mostrar mensaje de "demasiados reportes, intenta más tarde"; deshabilitar temporalmente |

### 8.4 Ocultamiento transparente

- En feed/perfil/favoritos el frontend **no** necesita cambios de contrato: los posteos reportados simplemente dejan de llegar en las respuestas.
- El **link directo** (`GET /api/posteos/post/:id`) sigue mostrando el posteo aunque esté reportado (decisión de producto); el botón Reportar seguirá funcionando ahí (responderá `409` si ya se reportó).

---

## 9. Fuera de alcance (Fase 2)

- Panel de administración / rol admin y endpoints de moderación.
- Resolución de reportes (`resuelto`/`descartado`) y recategorización.
- Priorización dinámica (volumen, antigüedad, recurrencia, impacto).
- Ocultamiento global automático por categoría 1 (un solo reporte).
- Notificación al autor tras eliminación por moderación.
