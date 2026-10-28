# Ayuda y soporte (`/api/ayuda-soporte`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:133`.

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [POST] /api/ayuda-soporte/envio-correo

**Descripción:** Envía un ticket de soporte por correo al equipo de TlaxApp (con datos del usuario y estado de su cuenta) y un correo de confirmación al usuario (sin bloquear la respuesta). Devuelve un `ticketId` generado en el momento, **no persistido**.
**Archivo de ruta:** `routes/soporte.js:9`
**Controlador:** `controllers/soporte.js` — `ayudaSoporteEnvioCorrreo` (línea 23). Servicio de correo: `email/servicio-ayuda-soporte-usuario.js` (`envioCorreoAyudaSoporte`, `envioConfirmacionUsuario`).

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares, en orden:
  1. `soporteLimiter` (`middlewares/rate-limiter.js:116`)
  2. `verificarTokenSesion`
  3. `check('tipo_problema').notEmpty().isIn([...])`
  4. `check('descripcion_problema_usuario').notEmpty().isString().trim().isLength({min: 15, max: 1000})`
  5. `validarCampos` → `ayudaSoporteEnvioCorrreo`
- Rate limiter: `soporteLimiter`, **15 min / 5**, código `SOPORTE_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `tipo_problema` | string (enum) | Sí | `notEmpty()` + `isIn(["cuenta","publicacion","seguridad","reporte","otro"])`; mensaje `"El tipo_problema es obligatorio: [cuenta, publicacion, seguridad, reporte, otro]"` → 422 |
| body | `descripcion_problema_usuario` | string | Sí | `notEmpty()`, `isString()`, `trim()`, `isLength({min: 15, max: 1000})`. **El mensaje dice "minimo 10 caracteres" pero el mínimo aplicado es 15** (`routes/soporte.js:15`) |

### Ejemplo de request
```http
POST /api/ayuda-soporte/envio-correo
Content-Type: application/json
Cookie: accessToken=…

{
  "tipo_problema": "cuenta",
  "descripcion_problema_usuario": "No puedo cambiar mi foto de perfil desde el móvil."
}
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Solicitud de soporte recibida correctamente",
  "data": { "ticketId": "TLX-1793128234000" }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `SOPORTE_BLOCKED` | Rate Limit Exceeded | "Demasiados tickets de soporte, intenta de nuevo más tarde" | `middlewares/rate-limiter.js:122-124` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "El tipo_problema es obligatorio: [cuenta, publicacion, seguridad, reporte, otro]" | `routes/soporte.js:13` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La descripcion_problema_usuario es obligatoria: minimo 10 caracteres, maximo 1000" (aplica min 15) | `routes/soporte.js:15` |
| 400 | `BAD_REQUEST` | Bad Request | "Tipo de problema no válido" (inalcanzable: lo valida la ruta) | `controllers/soporte.js:30` |
| 404 | `NOT_FOUND` | Resource Not Found | "Usuario no encontrado" | `controllers/soporte.js:36` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error en el servidor" (incluye fallo del envío de correo: `"No se pudo enviar el correo de soporte."`) | `controllers/soporte.js:66`; `email/servicio-ayuda-soporte-usuario.js:95` |

### Notas para el Frontend
- Mensaje de validación inconsistente: si envías 10–14 caracteres, recibes 422 aunque el texto del error diga 10. Usa 15 como mínimo en la UI.
- El `ticketId` tiene la forma `TLX-<milisegundos>`. **No es un identificador consultable**: no hay endpoint para ver tickets.
- La confirmación al usuario se envía sin esperar; si falla, no afecta la respuesta.
- Límite de 5 tickets por 15 min por IP.
- El texto del usuario se escapa en la plantilla de correo (`helpers/escape-html.js`) (según AGENTS.md).
