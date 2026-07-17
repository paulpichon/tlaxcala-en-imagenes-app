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
| `contacto` | `string` | Sí | Correo electrónico o número telefónico. Se valida que no esté vacío (trim). |

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

#### ❌ 400 — Error de validación

```json
{
  "type": "about:blank",
  "title": "Validation Failed",
  "status": 400,
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

Disparo: body vacío o `contacto` ausente/vacío.

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

### Formato de error común

Todos los errores siguen [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457). El campo `code` es la forma machine-readable de identificar el tipo de error. Compara siempre contra `code`, no contra `status`:

| Código | Significado |
|---|---|
| `VALIDATION_FAILED` | Error de validación (400) |
| `CONFLICT` | Contacto duplicado (409) |
| `EARLY_ACCESS_BLOCKED` | Rate limit superado (429) |
| `INTERNAL_ERROR` | Error interno (500) |

---

### Ejemplo con fetch

```js
// Registrar contacto
const response = await fetch('https://api.tlaxapp.com/api/early-access', {
  method: 'POST',
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
2. **Maneja el 429** silenciosamente (deshabilitar el botón por 10 minutos o mostrar el mensaje del servidor).
3. **No requieres token** ni cookie de sesión para este endpoint.
4. **El rate limiter es por IP**, no por usuario. Bloquea después de 5 intentos en 10 minutos.
5. **El `contacto` puede ser correo o teléfono**. No se valida formato, solo que no esté vacío. Si es correo (contiene `@`), el usuario recibe un correo de confirmación automático.
