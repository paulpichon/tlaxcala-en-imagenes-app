# Reportes de publicaciones (`/api/reportes`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:135`. Modelo: `models/ReportePosteo.js` (índice único parcial `{reporteroId, posteoId}` con `isDeleted: false`). Catálogo de categorías: `helpers/categorias-reporte.js`.

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

**Reglas de producto (AGENTS.md):** el reporte es anónimo para el autor; el posteo queda oculto para quien reporta (feed, perfil, favoritos) de forma permanente, aunque la moderación descarte el reporte; el link directo sigue visible.

---

## [POST] /api/reportes/:posteoId

**Descripción:** Registra un reporte del usuario autenticado sobre un posteo ajeno. Guarda la categoría, su prioridad (1–7) denormalizada y una descripción opcional (obligatoria en `otro`). El posteo deja de aparecer en el feed del reportero.
**Archivo de ruta:** `routes/reportes.js:13`
**Controlador:** `controllers/reportes.js` — `reportarPosteo` (línea 12)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares, en orden:
  1. `reporteLimiter` (`middlewares/rate-limiter.js:206`)
  2. `verificarTokenSesion`
  3. `check('posteoId').isMongoId()`
  4. `check('categoria').notEmpty().isIn(CATEGORIAS_VALIDAS)`
  5. `check('descripcion')` opcional, `isString`, `trim`, máx. 200 UTF-16
  6. `check('descripcion')` obligatoria si `categoria === 'otro'`
  7. `validarCampos`
  8. `validarIdPosteo` (ocultos → 404 a no-autores; eliminados → 404)
  9. `reportarPosteo`
- Rate limiter: `reporteLimiter`, **15 min / 10**, código `REPORTE_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `posteoId` | ObjectId | Sí | `isMongoId()`; `"El posteoId debe ser válido"` → 422 |
| body | `categoria` | string | Sí | `notEmpty()` + `isIn([...])`. Valores: `contenido_inapropiado` (1), `contenido_ofensivo` (2), `acoso_bullying` (3), `suplantacion_identidad` (4), `informacion_falsa` (5), `spam` (6), `otro` (7). Mensaje: `"La categoria es obligatoria: [contenido_inapropiado, …, otro]"` |
| body | `descripcion` | string | Condicional | Opcional salvo `categoria: 'otro'`. `isString()`, `trim()`, `length <= 200` (UTF-16). Mensaje: `"La descripcion debe ser texto de maximo 200 caracteres"` |
| body | `descripcion` (regla `otro`) | string | Sí si `otro` | `"La descripcion es obligatoria cuando la categoria es \"otro\""` (`routes/reportes.js:30-36`) |

Efecto del catálogo: `prioridad` se deriva en el servidor de la categoría; no se acepta del cliente.

### Ejemplo de request
```http
POST /api/reportes/6650d4a1f0c2a3b4c5d6e7f8
Content-Type: application/json
Cookie: accessToken=…

{ "categoria": "spam", "descripcion": "Publicidad no autorizada" }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: **`201`**
```json
{
  "success": true,
  "msg": "Reporte recibido. Esta publicación ya no aparecerá en tu feed.",
  "data": { "reporteId": "6651d9…" }
}
```
No devuelve reportero ni autor (anonimato).

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `REPORTE_BLOCKED` | Rate Limit Exceeded | "Demasiados reportes enviados, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:213-215` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El posteoId debe ser válido" | `routes/reportes.js:17` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `La categoria es obligatoria: [contenido_inapropiado, contenido_ofensivo, acoso_bullying, suplantacion_identidad, informacion_falsa, spam, otro]` | `routes/reportes.js:19-21` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La descripcion debe ser texto de maximo 200 caracteres" | `routes/reportes.js:25-29` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `La descripcion es obligatoria cuando la categoria es "otro"` | `routes/reportes.js:30-36` |
| 404 | `NOT_FOUND` | Resource Not Found | `El posteo con ID: <id> …` (eliminado, inexistente u oculto para no-autores) | `helpers/validar-id-posteo.js:19,23,30` |
| 409 | `CONFLICT` | Conflict | "No puedes reportar tu propia publicación" | `controllers/reportes.js:21` |
| 409 | `CONFLICT` | Conflict | "Ya reportaste esta publicación" (`E11000` del índice único parcial) | `controllers/reportes.js:47` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Hubo un error al enviar el reporte, contactar a soporte." | `controllers/reportes.js:50` |

### Notas para el Frontend
- **Orden de validación:** primero la validación de cuerpo (422), después el posteo (404) y después la regla del autor (409). Un 409 "propia publicación" solo aparece si el posteo existe y es visible para ti.
- Después de un 201, quita el posteo de la vista actual (feed, perfil y favoritos); no lo vuelvas a pedir en esas listas.
- El enlace directo `/api/posteos/post/:id` **sigue funcionando** para ese posteo.
- Repetir el reporte devuelve 409: trátalo como "ya reportado".
- **Anonimato:** el backend nunca expone el reportero fuera de la moderación. No intentes mostrarlo.
