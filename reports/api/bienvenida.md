# Bienvenida y health check

Volver al [índice](README.md). Convenciones globales (auth, errores, rate limiting): ver [README](README.md#convenciones-globales).

> **Ejemplos:** todos los ejemplos de este archivo están **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [GET] /

**Descripción:** Devuelve un JSON informativo de la API. No usa el envelope `{ success, data }`.
**Archivo de ruta:** `routes/bienvenida.js:7`
**Controlador:** `controllers/bienvenida.js` — `getBienvenida` (línea 3)

### Autenticación y permisos
- Requiere token: **No**
- Cadena de middlewares: ninguna (solo el middleware global de la sección de convenciones).
- Rate limiter: **ninguno**.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
- Cuerpo (forma exacta según `controllers/bienvenida.js:4-9`):
```json
{
  "name": "TlaxApp API",
  "status": "online",
  "auth": "required",
  "message": "Esta API requiere autenticación."
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| — | — | — | Ninguno propio. Solo aplican los errores globales (CORS/CSRF no aplican a `GET`). | — |

### Notas para el Frontend
- No envía `success`; no usar el envelope para parsear esta respuesta.
- No requiere cookies.

---

## [GET] /api/health

**Descripción:** Health check: estado del proceso, uptime, memoria, PID y estado de la conexión a MongoDB.
**Archivo de ruta:** `routes/bienvenida.js:8`
**Controlador:** `controllers/bienvenida.js` — `getHealth` (línea 12)

### Autenticación y permisos
- Requiere token: **No**
- Cadena de middlewares: `lecturaLimiter` → `getHealth`.
- Rate limiter: `lecturaLimiter` (`middlewares/rate-limiter.js:131`), 15 min / 100, código `READ_BLOCKED`.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/health
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
- Cuerpo (forma según `controllers/bienvenida.js:15-35`; **sin envelope `success`**):
```json
{
  "status": "ok",
  "uptime": 1234.56,
  "timestamp": "2026-10-27T19:10:34.000Z",
  "service": "TlaxApp API",
  "version": "1.0.0",
  "environment": "development",
  "memory": { "rss": 0, "heapTotal": 0, "heapUsed": 0, "external": 0 },
  "heapUsedPercentage": "00.00%",
  "pid": 12345,
  "db": { "status": "connected" }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `READ_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:137-139` |

### Notas para el Frontend
- `db.status` es `connected` solo si `mongoose.connection.readyState === 1`; cualquier otro estado devuelve `disconnected` **con HTTP 200** (el endpoint no cambia el status code).
- Úsalo para monitoreo, no para lógica de negocio.
- ⚠ Hallazgo: expone `pid`, `memory` y `environment` sin autenticación (ver [README § Hallazgos](README.md#resumen-de-la-documentación-inconsistencias-y-hallazgos)).
- ⚠ Discrepancia: el inventario base describe la respuesta como `{status, uptime, timestamp, version, db}`; el código devuelve además `service`, `environment`, `memory`, `heapUsedPercentage` y `pid`.
