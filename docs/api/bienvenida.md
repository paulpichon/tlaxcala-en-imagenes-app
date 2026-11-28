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

**Descripción:** Health check mínimo: reporta `ok` si la conexión a MongoDB está activa o `degraded` si no. Pensado para monitoreo, no para lógica de negocio.
**Archivo de ruta:** `routes/bienvenida.js:8`
**Controlador:** `controllers/bienvenida.js` — `getHealth` (líneas 12-15)

> **Actualizado 2026-11-10 (sync Postman):** corrección de metadata. El limiter real es `healthLimiter` (1 min / 60, `HEALTH_BLOCKED`) y la respuesta se redujo a `{ "status": "ok" | "degraded" }` con 200/503. La versión anterior de esta doc describía `lecturaLimiter` y una respuesta extensa con `uptime`, `pid` y `memory`, que ya no existe en el código.

### Autenticación y permisos
- Requiere token: **No**
- Cadena de middlewares: `healthLimiter` → `getHealth`.
- Rate limiter: `healthLimiter` (`middlewares/rate-limiter.js:233-242`), **1 minuto / 60 por IP**, código `HEALTH_BLOCKED`.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/health
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200` si `mongoose.connection.readyState === 1` (`helpers/estado-db.js:25`); `503` en cualquier otro estado.
- Cuerpo (**sin envelope `success`**; forma exacta de `controllers/bienvenida.js:14`).

Conexión activa (200):
```json
{ "status": "ok" }
```

Conexión caída (503):
```json
{ "status": "degraded" }
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `HEALTH_BLOCKED` | Rate Limit Exceeded | "Demasiadas solicitudes de health check, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:236-240` (limiter :233-242) |
| 503 | — | — | **No es un error RFC 9457:** la degradación se expresa con `503` + `{ "status": "degraded" }`, sin `code` ni `title` | `controllers/bienvenida.js:14` |

### Notas para el Frontend
- ✅ **Actualizado 2026-11-10:** la respuesta ya **no** incluye `uptime`, `timestamp`, `pid`, `memory`, `version`, `environment` ni `db.status`; solo `{ "status": "ok" | "degraded" }`. Decidir por el par status HTTP + campo `status`.
- `200` no implica que el resto del backend funcione: solo mide `mongoose.connection.readyState === 1`.
- El `503` **no** viene en formato RFC 9457 (respuesta directa del controlador, sin `code`): no intentar parsear `title`/`detail` en ese caso.
- Headers `RateLimit-*` disponibles; con más de 60 peticiones/min por IP responde `429 HEALTH_BLOCKED` en formato RFC 9457.
