# Early Access API

> **⚠️ Temporal:** Este endpoint estará disponible solo durante el periodo de acceso anticipado. Será eliminado sin previo aviso. No lo acoples a lógica permanente del frontend.

## `POST /api/early-access`

Registra un contacto (correo o teléfono) en la lista de acceso anticipado.

---

### Headers

| Header | Valor | Obligatorio |
|---|---|---|
| `Content-Type` | `application/json` | Sí |

No requiere autenticación ni cookies.

---

### Request Body

```json
{
  "contacto": "usuario@ejemplo.com"
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `contacto` | `string` | Sí | Correo electrónico o número telefónico. Se valida que no esté vacío (trim) y que no exceda 120 caracteres. |

---

### Respuestas

#### ✅ 200 — Contacto registrado exitosamente

```json
{
  "ok": true,
  "contacto": "usuario@ejemplo.com",
  "msg": "Contacto registrado correctamente"
}
```

#### ❌ 422 — Error de validación

```json
{
  "type": "about:blank",
  "title": "Validation Failed",
  "status": 422,
  "detail": "El contacto es obligatorio",
  "instance": "/api/early-access",
  "code": "VALIDATION_FAILED",
  "trace_id": "req_abc123",
  "errors": [
    {
      "field": "contacto",
      "code": "notEmpty",
      "message": "El contacto es obligatorio"
    }
  ]
}
```

Disparo: body vacío, `contacto` ausente/vacío, o `contacto` con más de 120 caracteres.

#### ❌ 409 — Contacto ya registrado

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "El contacto usuario@ejemplo.com ya está registrado",
  "instance": "/api/early-access",
  "code": "CONFLICT",
  "trace_id": "req_abc123",
  "errors": []
}
```

Disparo: el `contacto` ya existe en la base de datos (unique).

#### ❌ 429 — Rate limit excedido

```json
{
  "type": "about:blank",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Demasiados intentos. Intenta más tarde.",
  "code": "EARLY_ACCESS_BLOCKED",
  "instance": "/api/early-access",
  "trace_id": "req_abc123"
}
```

Disparo: más de 5 solicitudes desde la misma IP en 10 minutos.

| Propiedad | Valor |
|---|---|
| Ventana | 10 minutos |
| Máximo de intentos | 5 |
| Código para detectar | `EARLY_ACCESS_BLOCKED` |
| Incluye `retry_after` | No |

#### ❌ 500 — Error interno

```json
{
  "type": "about:blank",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "Error interno del servidor",
  "instance": "/api/early-access",
  "code": "INTERNAL_ERROR",
  "trace_id": "req_abc123",
  "errors": []
}
```

Disparo: fallo inesperado en el servidor.

---

## `GET /api/early-access/atribucion`

Captura la atribución de origen promocional (influencer / campaña) cuando un
visitante llega a la landing con parámetros `ref` y, opcionalmente,
`utm_source` y `utm_content`. El backend firma una cookie `HttpOnly`
(`early_access_atribucion`) que luego se envía automáticamente con el
`POST /api/early-access` para asociar el registro al influencer.

### Query params

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `ref` | `string` | Sí | Código del influencer. Se normaliza a mayúsculas. |
| `utm_source` | `string` | No | Plataforma de origen (ej. `instagram`). Se normaliza a minúsculas. |
| `utm_content` | `string` | No | Ubicación creativa (ej. `bio`, `story_1`). Se normaliza a minúsculas. |

### Respuestas

#### ✅ 204 — Captura procesada (o ignorada)

No devuelve body. Se emite o conserva la cookie de atribución.

#### ❌ 429 — Rate limit de captura excedido

Única respuesta distinta de `204` y solo bajo abuso (la captura es
fire-and-forget y la landing actual la ignora silenciosamente).

```json
{
  "type": "about:blank",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Demasiadas solicitudes de atribución. Intenta más tarde.",
  "code": "ATRIBUCION_BLOCKED",
  "instance": "/api/early-access/atribucion",
  "trace_id": "req_abc123"
}
```

| Propiedad | Valor |
|---|---|
| Ventana | 1 minuto |
| Máximo de intentos | 60 (generoso, para no afectar NAT/CGNAT) |
| Código para detectar | `ATRIBUCION_BLOCKED` |
| Configurable por env | `EARLY_ACCESS_ATRIBUCION_RATE_LIMIT_MAX` / `EARLY_ACCESS_ATRIBUCION_RATE_LIMIT_WINDOW_MS` |

#### ❌ — Sin otros errores expuestos

Cualquier parámetro inválido, influencer inexistente o error interno responde
`204` para no interrumpir la experiencia de la landing.

### Ejemplo con fetch

```js
await fetch(
  `https://api.tlaxapp.com/api/early-access/atribucion?ref=ANA2026&utm_source=instagram&utm_content=bio`,
  {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  }
);
```

### Reglas importantes

- **Primer clic gana**: si el visitante ya tiene una cookie vigente, los
  clics posteriores con otro `ref` no la sobreescriben.
- **Vigencia**: la cookie dura 30 días desde el primer clic.
- **Sin autenticación**: no requiere sesión de usuario.
- **Rate limiter generoso**: 60 req/min por IP (configurable por env). Bajo abuso responde `429 ATRIBUCION_BLOCKED`; la landing actual lo ignora silenciosamente.

---

### Formato de error común

Todos los errores siguen [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457). El campo `code` es la forma machine-readable de identificar el tipo de error. Compara siempre contra `code`, no contra `status`:

| Código | Significado |
|---|---|
| `VALIDATION_FAILED` | Error de validación (422) |
| `CONFLICT` | Contacto duplicado (409) |
| `EARLY_ACCESS_BLOCKED` | Rate limit del POST superado (429) |
| `ATRIBUCION_BLOCKED` | Rate limit de captura de atribución superado (429) |
| `INTERNAL_ERROR` | Error interno (500) |

---

### Ejemplo con fetch

```js
// Registrar contacto
const response = await fetch('https://api.tlaxapp.com/api/early-access', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contacto: 'usuario@ejemplo.com' })
});

const data = await response.json();

if (response.ok) {
  // data.ok === true, data.msg contiene mensaje de éxito
  console.log('Registrado:', data.contacto);
} else {
  switch (data.code) {
    case 'CONFLICT':
      // El contacto ya existe
      break;
    case 'EARLY_ACCESS_BLOCKED':
      // Esperar antes de reintentar
      break;
    case 'VALIDATION_FAILED':
      // Mostrar errors[0].message
      break;
    default:
      // Error inesperado
  }
}
```

---

### Notas para el frontend

1. **No guardes estado permanente** basado en este endpoint — será eliminado.
2. **Maneja el 429 del POST** silenciosamente (deshabilitar el botón por 10 minutos o mostrar el mensaje del servidor).
3. **No requieres token** ni cookie de sesión para este endpoint, pero el POST
   **debe enviar cookies** (`credentials: 'include'`) para que la atribución del
   influencer se asocie al registro.
4. **El rate limiter del POST es por IP**, no por usuario. Bloquea después de 5 intentos en 10 minutos.
5. **El `contacto` puede ser correo o teléfono**. No se valida formato, pero no puede estar vacío ni exceder 120 caracteres. Agrega `maxLength={120}` al input. Si es correo (contiene `@`), el usuario recibe un correo de confirmación automático.
6. **La captura de atribución es automática** en la landing actual a través del
   componente `<AttributionCapture />` montado en el layout. Si construyes una
   landing alternativa, dispara el `GET /api/early-access/atribucion` con
   `credentials: 'include'` cuando exista el query param `ref`.
7. **La captura de atribución es fire-and-forget**: un 429 `ATRIBUCION_BLOCKED`
   del GET no requiere manejo en el frontend; el formulario sigue funcionando sin atribución.
