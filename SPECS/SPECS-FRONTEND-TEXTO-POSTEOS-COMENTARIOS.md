# SPECS: Texto de Posteos y Comentarios — Emojis y caracteres extendidos

> Contrato para el frontend de TlaxApp sobre la validación del campo `texto` en publicaciones y comentarios.

## Resumen

El backend amplió los caracteres permitidos en el texto de posteos y comentarios. Ahora se aceptan **emojis**, **hashtags (`#`)**, **menciones (`@`)**, comillas tipográficas (`“”‘’`), guion largo (`—`), elipsis (`…`), la `ü` y texto en otros alfabetos. El cambio se implementa con un regex Unicode compartido, `trim` y límites de longitud claros.

## Endpoints afectados

| Método | Ruta | Campo | Requerido | Límite UTF-16 |
|---|---|---|---|---|
| `POST` | `/api/posteos` | `texto` | No | 500 |
| `PUT` | `/api/posteos/:id` | `texto` | No¹ | 500 |
| `POST` | `/api/comentarios/:posteoId/comentarios` | `texto` | Sí | 250 |

¹ En `PUT`, si `texto` no se envía, no se modifica. Si se envía `texto: ""`, se limpia el texto del posteo.

## Reglas de validación

### Regex del backend

```js
/^[\p{L}\p{N}\p{P}\p{S}\p{M}\p{Z}\t\n\r\u200D\uFE0F\uFE0E]*$/u
```

Permite:

- Letras de cualquier idioma (`a-z`, `ñ`, `ü`, `漢字`, `العربية`, etc.).
- Números.
- Puntuación: `#`, `@`, `.`, `,`, `!`, `?`, `¡`, `¿`, `(`, `)`, `"`, `'`, `“`, `”`, `«`, `»`, `—`, `…`, etc.
- Símbolos: emojis base 🔥, banderas 🇲🇽, tonos de piel 👍🏽, monedas `$ € ¥`, grados `°`, etc.
- Marcas combinantes: keycaps como `#️⃣`.
- Multilínea (`\n`, `\t`, `\r`).
- "Pegamento" de emojis compuestos: ZWJ (`\u200D`) y selectores de variación (`\uFE0F`, `\uFE0E`).

Bloquea (devuelve `422`):

- Bytes nulos y caracteres de control.
- Zero-width spaces (ej. `\u200B`).
- Caracteres bidi de spoofing (`\u202A`–`\u202E`, `\u2066`–`\u2069`).

### Límite de longitud

- El límite se cuenta en **unidades de código UTF-16** (`String.length` en JavaScript), igual que `maxlength` de Mongoose y el atributo `maxLength` nativo de HTML.
- Un emoji simple ocupa **2 unidades** (ej. `🔥`.length === 2).
- Emojis compuestos ocupan más: `👨‍👩‍👧‍👦` ocupa **11 unidades**.
- Ejemplo: si un posteo permite 500 unidades, un texto formado solo por emojis simples admite como máximo 250 emojis.

### Trim

- El backend aplica `trim` antes de validar.
- **Posteos**: un texto vacío o solo espacios se guarda como `""`.
- **Comentarios**: un texto vacío o solo espacios devuelve `422` (`El texto es obligatorio`).

## Errores RFC 9457

Todos los errores de validación usan el formato unificado:

```json
{
  "success": false,
  "status": 422,
  "title": "Validation Failed",
  "code": "VALIDATION_FAILED",
  "message": "El campo de texto contiene caracteres no permitidos",
  "errors": [
    { "field": "texto", "code": "invalid", "message": "..." }
  ]
}
```

Mensajes posibles:

| Condición | `message` |
|---|---|
| Carácter no permitido | `El campo de texto contiene caracteres no permitidos.` |
| Comentario vacío / solo espacios | `El texto es obligatorio.` |
| Excede el máximo | `El texto no puede exceder 500 caracteres.` / `El texto no puede exceder 250 caracteres.` |

## Checklist de implementación para el frontend

- [ ] Quitar cualquier regex propio del frontend que limite a `[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,!?¡¿()\s-]`. El backend ahora es la fuente única de validación de caracteres.
- [ ] En el textarea de crear/editar posteo, agregar `maxLength={500}`.
- [ ] En el textarea de comentarios, mantener `maxLength={250}`.
- [ ] El contador de caracteres debe usar `.length` del string (UTF-16) para coincidir con el backend.
- [ ] Permitir emojis, `#`, `@`, comillas tipográficas, guion largo y elipsis provenientes del teclado del usuario (especialmente iOS/Android, que autocorrijen a estos caracteres).
- [ ] Para comentarios: deshabilitar el botón enviar si el texto, tras trim, queda vacío.
- [ ] No es necesario "sanitizar" HTML del lado del cliente: el backend escapa el texto cuando lo inserta en correos; el frontend debe renderizarlo como texto plano seguro (React ya lo hace por defecto).

## Notas de producto

- Los posteos `visibilidad: 'perfil'` siguen exigiendo sesión en el link directo; este cambio no modifica la lógica de visibilidad.
- Los comentarios ya permitían emojis previamente (no tenían regex), pero ahora comparten la misma política robusta que los posteos y rechazan caracteres peligrosos.
- Los textos existentes en base de datos siguen siendo válidos; no hay migración necesaria.

## Referencias

- `middlewares/validar-texto.js` — fábrica `crearValidadorTexto`.
- `AGENTS.md` — sección "Texto de Posteos y Comentarios (decisiones de producto)".
- `CHANGELOG.md` — entrada bajo `[Unreleased]`.
