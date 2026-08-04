# SPECS — Sistema de URL (slug) de usuario

Especificación de cambios en el backend relativos a la generación, validación y regeneración de la URL (slug) del perfil de usuario. Comparativa antes/después para que el frontend pueda adaptar sus pantallas, flujos y manejo de errores.

> **Convención:** en el backend el campo se llama `url` (no `slug`). En este documento se usan ambos términos como sinónimos, pero en las respuestas JSON la clave es siempre `url`.

---

## 1. Resumen ejecutivo

| Aspecto | Antes | Ahora |
|---|---|---|
| Formato del slug | `juanperezlopez` (sin separador) | `juan-perez-lopez` (kebab-case) |
| Sufijo de colisión | `.1`, `.2`, `.3` (secuencial, punto) | `-7a3f9` (5 hex chars aleatorios, guion) |
| Enumeración de homónimos | Posible (sufijo secuencial predecible) | No posible (sufijo aleatorio) |
| Sanitización de entrada | Sólo acentos eliminados | Whitelist estricta `[a-z0-9-]`, sin emojis/CJK/símbolos |
| Longitud del slug | Sin límite | Máximo 50 chars |
| Validación de nombre en registro | `trim().notEmpty()` | `trim()`, `notEmpty()`, `isLength(1,60)`, `matches(regex)` |
| Cambio de URL después del registro | Imposible | Se regenera al cambiar `nombre_completo` |
| Cooldown de cambio de nombre | N/A | 30 días (primer cambio post-registro gratis) |
| URL antigua tras cambio | Se perdía (404) | Redirección soft vía `url_history` |
| Error por duplicado (E11000) | 500 `INTERNAL_ERROR` | 409 `CONFLICT` con `DUPLICATE_KEY` |
| Endpoints nuevos | — | Ninguno (todo reutiliza rutas existentes) |

---

## 2. Formato del slug

### 2.1 Antes

```
juanperezlopez
juanperezlopez.1
juanperezlopez.2
```

- Sin separador entre palabras.
- Sufijo de colisión con punto literal + número secuencial.
- Sólo se eliminaban acentos; emojis, CJK, `<`, `>`, `"` sobrevivían en el slug.

### 2.2 Ahora

```
juan-perez-lopez         <- primer usuario con ese nombre
juan-perez-lopez-7a3f9   <- colisión: 5 hex chars aleatorios
juan-perez-lopez-3b2e1   <- otra colisión: otro sufijo aleatorio
```

- **Kebab-case**: palabras separadas por `-`.
- **Primer usuario** con un nombre base → slug limpio sin sufijo.
- **Colisión** → sufijo aleatorio de 5 hex chars (`/^[0-9a-f]{5}$/`). No revela cuántos homónimos existen.
- **Sanitización estricta** vía `helpers/crear-url-usuario.js::normalizarSlug()`:
  - `.normalize("NFD")` elimina acentos.
  - Whitelist `[a-z0-9-]`: se descartan emojis, CJK, símbolos, `<`, `>`, `"`, `/`, `\`, `.`.
  - Colapsa `-` repetidos, elimina bordes, trunca a 50 chars, lowercase.
  - Fallback `usuario-<hex10>` si el nombre completo es totalmente NO-ASCII.
- **Compatibilidad hacia atrás**: las URLs existentes con formato antiguo (`juanperezlopez`, `juanperezlopez.1`) siguen funcionando tal cual. Sólo las nuevas cuentas usan kebab-case.

> **Acción frontend:** si muestras la URL en algún lugar editable de la UI (ej. campo "Tu dirección de perfil"), puedes warned al usuario que el formato es `tlaxxp.com/<url>` y que admite kebab-case. No necesitas migrar nada.

---

## 3. Endpoints afectados

### 3.1 `POST /api/usuarios` — Registro de cuenta

**Sin cambios en contrato de entrada.** El body sigue enviando `nombre_completo: { nombre, apellido }`, `correo`, `password`.

**Cambios en validación de entrada (422 `VALIDATION_FAILED`)**

| Campo | Validaciones nuevas |
|---|---|
| `nombre_completo.nombre` | `trim()`, `notEmpty()`, `isLength({ min: 1, max: 60 })`, `matches(/^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ .'\-]+$/)` |
| `nombre_completo.apellido` | Igual que `nombre` |

Si el frontend enviaba emojis, secuencias CJK, o strings muy largos en el nombre, ahora recibirá 422 con `errors[]` detallando el campo y el motivo.

Ejemplo de error nuevo:

```json
{
  "type": "about:blank",
  "title": "Validation Failed",
  "status": 422,
  "detail": "La solicitud contiene 2 error(es) de validación",
  "code": "VALIDATION_FAILED",
  "instance": "/api/usuarios",
  "trace_id": "req_829a8f1b",
  "errors": [
    { "field": "nombre_completo.nombre", "code": "invalid", "message": "El nombre no puede exceder 60 caracteres" }
  ]
}
```

**Respuesta exitosa (200):** sin cambios. La URL se genera internamente; **no** se devuelve en la respuesta del registro (sigue devolviendo sólo `{ token }`). El frontend la obtendrá en el siguiente `GET /api/auth/me` (login) o `POST /api/auth/login`.

### 3.2 `PUT /api/usuarios/update` — Actualizar perfil

**Cambios de comportamiento (sin cambios en la ruta ni en el contrato de entrada).**

El body puede incluir `nombre_completo: { nombre, apellido }` (entre otros campos de la whitelist). Si el `nombre_completo` **cambió respecto al valor actual**, el backend:

1. Comprueba el **cooldown de 30 días** desde el último cambio de nombre.
   - Si `nombre_completo_changed_at === null` (primera vez que cambia post-registro) → **sin cooldown**, se permite.
   - Si ya se cambió antes y no han pasado 30 días → **429 `RATE_LIMIT_EXCEEDED`** con `retry_after` en segundos.
2. Regenera la URL aplicando `normalizarSlug` al nuevo nombre completo + resolución de colisión.
3. Si la URL nueva difiere de la actual, empuja la URL anterior al array `url_history` (para soporte de redirección soft).
4. Persiste el nuevo `nombre_completo`, la nueva `url` y `nombre_completo_changed_at = now`.

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "msg": "Usuario actualizado",
  "data": {
    "usuario": {
      "_id": "65a...",
      "nombre_completo": { "nombre": "Juan", "apellido": "Pérez López" },
      "lugar_radicacion": { ... },
      "correo": "juan@...",
      "url": "juan-perez-lopez",
      "genero": "MASCULINO",
      "fecha_nacimiento": "1990-01-01",
      "nombre_completo_changed_at": "2026-08-04T15:30:00.000Z"
    }
  }
}
```

> **Acción frontend:** tras un `PUT /update` exitoso donde se cambió el nombre, **lee `data.usuario.url` de la respuesta** y actualiza en caliente cualquier referencia cliente-side a la URL del perfil:贮存ada en estado global (Redux/Zustand/Context), mostrada en la barra de direcciones si es SPA, enlaces de compartir, metadata, etc. La URL **anterior deja de ser válida como URL activa** (aunque se redirige vía `url_history`, ver §3.3).

**Nuevo error 429 `RATE_LIMIT_EXCEEDED` (cooldown de cambio de nombre):**

```json
{
  "type": "about:blank",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Solo puedes cambiar tu nombre y URL una vez cada 30 días",
  "code": "RATE_LIMIT_EXCEEDED",
  "instance": "/api/usuarios/update",
  "trace_id": "req_829a8f1b",
  "retry_after": 1814400
}
```

`retry_after` está en **segundos**. Sugerencia de UI: mostrar countdown "Puedes volver a cambiar tu nombre en X días" usando `retry_after`.

**Posible error 409 `CONFLICT` (race condition en registro/cola):**

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "El recurso ya existe: url duplicado",
  "code": "CONFLICT",
  "instance": "/api/usuarios/update",
  "trace_id": "req_829a8f1b",
  "errors": [
    { "field": "url", "code": "DUPLICATE_KEY", "message": "El valor para \"url\" ya está en uso" }
  ]
}
```

> El backend reintenta hasta 3 veces ante E11000 antes de propagar este 409. Si lo recibes es porque 3 candidatos aleatorios colisionaron con otros inserts simultáneos (probabilidad muy baja). Acción sugerida: reintentar el PUT desde el frontend 1-2 veces con backoff, o mostrar "intenta de nuevo en unos segundos".

### 3.3 `GET /api/usuarios/:url` — Obtener perfil por URL

**Cambio importante: ahora puede devolver una redirección soft.**

**Caso A — URL activa (comportamiento anterior, sin cambios):**

```json
{
  "success": true,
  "data": {
    "usuario": { "_id": "...", "nombre_completo": {...}, "url": "juan-perez-lopez", "...": "..." }
  }
}
```

**Caso B — URL antigua que está en `url_history` de un usuario activo (NUEVO):**

Si la URL solicitada ya no es la activa de nadie pero pertenece al histórico de un usuario activo (`estatus: 1`, `email_validated: true`, `isDeleted: false`), el backend responde **HTTP 200** con:

```json
{
  "success": true,
  "msg": "La URL ha cambiado",
  "data": {
    "urlActual": "juan-perez-lopez",
    "redirect": "permanent"
  }
}
```

Y agrega el header HTTP:

```
Location: /api/usuarios/juan-perez-lopez
```

**Caso C — URL inexistente o de un usuario inactivo/eliminado:**

404 `NOT_FOUND` (sin cambios respecto al comportamiento previo). Por privacidad, no se revela si la URL existió en el histórico de un usuario inactivo.

> **Acción frontend — formato del "perfil" campo `redirect: "permanent"`:** cuando recibas `data.redirect === "permanent"`, NO muestres perfil vacío ni error. En su lugar:
> 1. Reemplaza la URL en la barra de dirección del navegador (si SPA) por `/${data.urlActual}` usando `history.replaceState`.
> 2. Opcionalmente dispara un fetch a `/api/usuarios/${data.urlActual}` para renderizar el perfil real.
> 3. Si guardabas la URL antigua en algún enlace almacenado (bookmarks, posts compartidos, etc.), actualízala a `data.urlActual`.
> 4. El header `Location` es informativo: apunta a la ruta API del recurso activo. Para el frontend normalmente construirás la ruta pública con `data.urlActual` directamente, sin necesidad de leer el header.

> **Acción frontend — manejo de errores:** si sigues recibiendo 404 para una URL que el usuario "sabía" válida, asume que el dueño cambió de nombre hace más de lo que cubre el histórico, o la cuenta está suspendida/eliminada. Muestra "Este perfil ya no está disponible" sin distinguir motivos.

---

## 4. Códigos de error a manejar en el frontend

Documentación consolidada de los códigos `code` (en mayúsculas) que el frontend debe comparar tras los cambios:

| HTTP | `code` | Contexto | Acción sugerida frontend |
|---|---|---|---|
| 422 | `VALIDATION_FAILED` | Registro o PUT con nombre/apellido fuera de regex o > 60 chars | Mostrar `errors[]` por campo bajo el input correspondiente |
| 429 | `RATE_LIMIT_EXCEEDED` | Cambio de nombre dentro del cooldown de 30 días | Mostrar countdown con `retry_after` (segundos) |
| 409 | `CONFLICT` | Duplicado de `url` por race condition tras reintentos internos | Reintentar PUT 1-2 veces con backoff, o toast "intenta de nuevo" |
| 404 | `NOT_FOUND` | URL no existe ni en histórico activo | Mostrar "perfil no disponible" |
| 200 | — | `data.redirect === "permanent"` | Redirección soft: actualizar URL del navegador y volver a cargar perfil |

> **Nota sobre comparación:** los `code` son siempre **MAYÚSCULAS**. Comparar `error.code === "VALIDATION_FAILED"`, no `"validation_failed"`.

---

## 5. Sugerencias de implementación para el frontend

### 5.1 Servicio centralizado de "obtener perfil por URL"

Implementa un wrapper que cubra los tres casos de `GET /api/usuarios/:url` en un solo flujo:

```ts
// Ejemplo esquemático (adaptar al framework/HTTP client del proyecto)
async function fetchPerfil(url: string): Promise<Perfil | Redireccion | null> {
  const res = await fetch(`/api/usuarios/${encodeURIComponent(url)}`, {
    credentials: "include" // cookies httpOnly JWT
  });

  // Redirección soft
  if (res.ok) {
    const body = await res.json();
    if (body.data?.redirect === "permanent") {
      // Actualizar URL del navegador sin recargar
      window.history.replaceState(null, "", `/${body.data.urlActual}`);
      // Reintentar con la nueva URL
      return fetchPerfil(body.data.urlActual);
    }
    return { tipo: "perfil", usuario: body.data.usuario };
  }

  // Errores
  const err = await res.json();
  if (err.code === "NOT_FOUND") return null;
  throw err;
}
```

### 5.2 Estado global de la URL del usuario logueado

Tras `POST /api/auth/login` y `GET /api/auth/me`, guarda `usuario.url` en el estado global. Tras un `PUT /api/usuarios/update` exitoso que cambió `nombre_completo`, **sobrescribe** la URL almacenada con `data.usuario.url` de la respuesta. No esperes al próximo `getMe` para actualizarla.

### 5.3 Pantalla de "Editar perfil"

- Si el usuario aún **nunca** ha cambiado su nombre post-registro: muestra helper text "Tu URL se regenerará automáticamente según tu nombre. Podrás volver a cambiarla en 30 días."
- Si el usuario **ya** cambió su nombre post-registro y quedan menos de 30 días: muestra "Próximo cambio disponible en X días" calculando desde el máximo entre `ultimo_cambio` (si la API lo expone en `getMe`, pendiente) y `retry_after` del error 429.
- Captura específicamente `error.code === "RATE_LIMIT_EXCEEDED"` y muestra el countdown.
- No muestres el campo `url` como input editable: la URL no es directamente editable, se deriva del `nombre_completo`.

### 5.4 Validación cliente-side espejo

Para evitar ida-vuelta al backend con errores obvios, replica la validación de `nombre_completo.nombre` y `.apellido`:

```ts
const REGEX_NOMBRE = /^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ .'\-]+$/;
const MAX_NOMBRE = 60;

function validarNombre(valor: string): string | null {
  if (!valor.trim()) return "El campo es obligatorio";
  if (valor.length > MAX_NOMBRE) return `Máximo ${MAX_NOMBRE} caracteres`;
  if (!REGEX_NOMBRE.test(valor)) return "Sólo letras, números, espacios, '.', '-' y apóstrofo";
  return null;
}
```

> Esta validación es espejo: la autoritativa sigue siendo el backend. El frontend la replica para UX, no para seguridad.

### 5.5 Manejo del 409 `CONFLICT`

Si tras `PUT /update` recibes 409 `CONFLICT` con `errors[].field === "url"`:

```ts
async function actualizarPerfilConRetry(payload, intentosMax = 2) {
  for (let i = 0; i <= intentosMax; i++) {
    try {
      return await api.put("/api/usuarios/update", payload);
    } catch (err) {
      if (err.code === "CONFLICT" && i < intentosMax) {
        await new Promise(r => setTimeout(r, 300 * (i + 1))); // backoff lineal
        continue;
      }
      throw err;
    }
  }
}
```

### 5.6 UX de redirección soft

Cuando `GET /api/usuarios/:url` devuelve `data.redirect === "permanent"`:

- **No muestres** "página no encontrada" ni "error 404".
- **Sí muestres** sutilmente un toast o aviso "Esta URL ha cambiado, te redirigimos al perfil actual" mientras reemplazas la URL del navegador.
- Si el rendered SPA del perfil anterior está en caché, invalídalo antes de cargar el nuevo.
- Recomienda guardar la nueva URL como referencia si el usuario llegó desde un enlace externo o compartido (para actualizar el enlace en el origen si es posible, ej. mensaje en una publicación donde se compartió).

---

## 6. Campos del modelo relevantes para el frontend

| Campo | Visible en API | Descripción | Contrato de valor |
|---|---|---|---|
| `url` | Sí (`getMe`, `login`, `PUT /update`, `GET /:url`) | Slug único actual, kebab-case | Siempre string, nunca `null` |
| `url_history` | No (se elimina del `toJSON`) | Array interno de URLs anteriores | Sólo se usa para redirección soft |
| `nombre_completo_changed_at` | Sí (`getMe`, `login`, `PUT /update`) | Marca de tiempo del último cambio de nombre | **Siempre `null` o ISO 8601 date string, nunca `undefined`**. `null` = primer cambio gratis |

### 6.1 Contrato de `nombre_completo_changed_at`

Este campo fue normalizado internamente para garantizar consistencia entre usuarios antiguos (creados antes del feature) y nuevos:

| En MongoDB | En la respuesta API |
|---|---|
| Documento sin el campo (usuarios legacy) | `null` (coerción vía hook `post('init')`) |
| `null` (nunca cambió de nombre) | `null` |
| `Date` (cambio realizado) | ISO 8601 date string (ej. `"2026-08-04T15:30:00.000Z"`) |

El frontend **puede usar `=== null` con total confianza** para detectar "primer cambio gratis".

### 6.2 Uso en el frontend

```ts
// Tras getMe() / login() / PUT /update
const { nombre_completo_changed_at } = usuario;

if (nombre_completo_changed_at === null) {
    // El usuario NUNCA ha cambiado su nombre: mostrar "primer cambio gratis, sin cooldown"
    showHelper("Puedes cambiar tu nombre ahora sin restricción.");
} else {
    const ultimoCambio = new Date(nombre_completo_changed_at);
    const TREINTA_DIAS = 30 * 24 * 60 * 60 * 1000;
    const diff = Date.now() - ultimoCambio.getTime();

    if (diff >= TREINTA_DIAS) {
        // Pasaron 30 días: cambio disponible
        showHelper("Puedes cambiar tu nombre ahora.");
    } else {
        // En cooldown, pero sin necesidad de esperar al 429 reactivo
        const diasRestantes = Math.ceil((TREINTA_DIAS - diff) / (24 * 60 * 60 * 1000));
        showHelper(`Podrás cambiar tu nombre en ${diasRestantes} días.`);
        disableButton();
    }
}
```

---

## 7. Matriz de prueba sugerida para el frontend

| Caso | Pasos | Resultado esperado frontend |
|---|---|---|
| Registro con nombre nuevo | `POST /api/usuarios` con nombre único | Login → `getMe` devuelve `url` kebab-case sin sufijo |
| Registro con nombre repetido | Registrar 2 cuentas con el mismo nombre | La 2ª recibe `url` con sufijo `-<5hex>`. No se puede predecir sufijo iterando |
| Cambio de nombre por 1ª vez | `PUT /update` con nuevo `nombre_completo` | 200 con nueva `url` en `data.usuario.url`. Sin 429 |
| Cambio de nombre por 2ª vez dentro de 30 días | `PUT /update` con otro nombre | 429 `RATE_LIMIT_EXCEEDED` con `retry_after` |
| Cambio de nombre por 2ª vez después de 30 días | Esperar 30 días y `PUT /update` | 200 con nueva `url` |
| Visitar URL antigua | `GET /api/usuarios/<urlAntigua>` | 200 con `data.redirect === "permanent"` y `data.urlActual` |
| Visitar URL antigua de usuario eliminado | `GET /api/usuarios/<urlDeEliminado>` | 404 `NOT_FOUND` (sin revelar histórico) |
| Visitar URL con caracteres inválidos en nombre | `POST /api/usuarios` con `nombre: "<script>"` | 422 `VALIDATION_FAILED` con `errors[]` detallando el campo |
| Visitar URL con nombre > 60 chars | `POST /api/usuarios` con nombre de 61 chars | 422 `VALIDATION_FAILED` con `errors[].code === "invalid"` |
| Race condition extrema | Forzar 409 con mocks | Reintentar PUT con backoff, máximo 2 intentos |

---

## 8. Migración

### 8.1 Formato de slug

**No se requiere migración de URLs.** Las URLs existentes (formato antiguo `juanperezlopez`, `juanperezlopez.1`) siguen funcionando:

- Se conservan como `url` activa: el backend las encuentra con `findOne({ url })`.
- El regex `^base(-[a-z0-9]+)?$` las reconoce como ocupadas al generar nuevas URLs.
- Las colisiones nuevas usan sufijo aleatorio, no numérico: el resultado es `juan-perez-lopez-7a3f9`, respetando `juanperezlopez` (sin guion) como base distinta.

Las cuentas de prueba con sufijo secuencial (`mayra-gallegos-ramirez-2`, `-3`) **no se migran**; se eliminan manualmente en dev. En producción, cualquier cuenta existente conserva su URL sin cambios.

### 8.2 Campo `nombre_completo_changed_at`

Para normalizar usuarios legacy que no poseen el campo en su documento, se provee un script de migración:

```
node --env-file=.env.development scripts/migrar-nombre-completo-changed-at.js
```

Éste ejecuta un `updateMany` que establece `nombre_completo_changed_at: null` en todos los documentos donde el campo no existe. Es seguro correrlo incluso después de la puesta en producción (operación idempotente).

---

## 9. Referencias de archivos backend

| Propósito | Ruta |
|---|---|
| Helper generador de slug (sanitización + colisión aleatoria) | `helpers/crear-url-usuario.js` |
| Controlador de registro | `controllers/usuarios.js::usuariosPost` |
| Controlador de actualización (regeneración de URL + cooldown) | `controllers/usuarios.js::usuariosPut` |
| Controlador de login (devuelve `url` en respuesta) | `controllers/auth.js::login` |
| Controlador `getMe` (proyección incluye `url`) | `controllers/auth.js::getMe` |
| Middleware validador de URL (redirección soft vía `url_history`) | `middlewares/validar-url-usuario.js` |
| Manejador de errores (E11000 → 409) | `middlewares/error-handler.js` |
| Modelo Usuario (`url`, `url_history`, `nombre_completo_changed_at`) | `models/Usuario.js` |
| Script de migración (`nombre_completo_changed_at` usuarios legacy) | `scripts/migrar-nombre-completo-changed-at.js` |
| Rutas | `routes/usuarios.js` |

Para el detalle técnico exacto del comportamiento del backend, ver la sección "Slug / URL de usuario" en `AGENTS.md`.