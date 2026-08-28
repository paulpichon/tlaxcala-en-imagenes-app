# SPECS — Visibilidad de Posteos (`posteo_publico` → `visibilidad`)

Especificación de los cambios en el backend relativos a la **visibilidad de posteos**. Contrato antes/después para que el frontend adapte sus pantallas, flujos, el botón **compartir** y el manejo del error `401`.

> **Contexto del problema resuelto:** el campo booleano `posteo_publico` no distinguía entre "aparecer en el feed" y "quién puede ver el posteo". Ahora se reemplaza por el enum `visibilidad` (`'publico'` | `'perfil'`), extensible en el futuro (`'seguidores'`, `'solo yo'`, etc.), y un posteo con `visibilidad: 'perfil'` ya **no puede abrirse por link directo sin sesión** (devuelve `401`).

---

## 1. Resumen ejecutivo

| Aspecto | Antes | Ahora |
|---|---|---|
| Campo en el schema | `posteo_publico: Boolean` (default `true`) | `visibilidad: String` enum `['publico', 'perfil']` (default `'publico'`) |
| Posteo `publico` | Aparece en el feed; link directo público | Sin cambios: feed + link directo público |
| Posteo `false` / `perfil` | No aparece en el feed; **link directo abierto a cualquiera** | No aparece en el feed; **link directo exige sesión (`401` sin token)** |
| Perfil de otro usuario (autenticado) | Ve todos los posteos (públicos y "privados") | Solo ve los `publico`; el dueño ve todos |
| `posteo_publico` en respuestas | Campo real de la BD | **Virtual** derivado de `visibilidad` (DEPRECATED, compatibilidad temporal) |
| Compartir por link | Permitido siempre | Permitido solo si `visibilidad === 'publico'` |

---

## 2. Semántica de visibilidad

| Valor | Feed | Perfil del autor | Link directo (`GET /post/:id`) | Compartir por link |
|---|---|---|---|---|
| `'publico'` | ✅ | ✅ | Público (sin sesión) | ✅ |
| `'perfil'` | ❌ | ✅ | Solo con sesión (`401` sin sesión) | ❌ (el frontend debe bloquearlo) |

> **No es privacidad estricta:** TlaxApp es una comunidad abierta sin solicitudes de amistad. Cualquier usuario **autenticado** puede ver un posteo `perfil` de otro usuario **dentro de su perfil** e interactuar (comentar, like, favorito). Lo único que cambia es: (1) no aparece en el feed y (2) no se puede abrir por link directo sin sesión.

---

## 3. Creación (`POST /api/posteos`)

### 3.1 Campos aceptados

| Campo | Tipo | Obligatorio | Valores |
|---|---|---|---|
| `visibilidad` | String | No | `'publico'` \| `'perfil'` (default: `'publico'`) |
| `posteo_publico` (DEPRECATED) | Boolean | No | Se acepta solo por compatibilidad temporal; se convierte a `visibilidad` |

### 3.2 Reglas de conversión (solo si NO viene `visibilidad`)

| `posteo_publico` recibido | `visibilidad` resultante |
|---|---|
| `true` / `'true'` | `'publico'` |
| `false` / `'false'` | `'perfil'` |

> Si vienen ambos, gana `visibilidad`. Si no viene ninguno, queda `'publico'`.

### 3.3 Ejemplos

```js
// Nuevo (recomendado)
formData.append('visibilidad', 'perfil');
formData.append('img', file);
formData.append('texto', 'Solo para mi perfil');

// Legacy (DEPRECATED, funciona temporalmente)
formData.append('posteo_publico', 'false');
```

---

## 4. Edición (`PUT /api/posteos/:id`)

Mismas reglas que la creación (§3). Se actualiza `visibilidad` solo si el payload incluye `visibilidad` o `posteo_publico`; si no viene ninguno, la visibilidad no cambia.

```js
// Cambiar un posteo público a solo-perfil
await api.put(`/api/posteos/${id}`, { visibilidad: 'perfil' });

// Legacy equivalente (DEPRECATED)
await api.put(`/api/posteos/${id}`, { posteo_publico: false });
```

---

## 5. Respuestas del backend

Todo posteo devuelto (GETs y escrituras) incluye `visibilidad` y, por compatibilidad temporal, `posteo_publico` (virtual derivado de `visibilidad`):

```jsonc
{
  "success": true,
  "data": {
    "posteo": {
      "_id": "...",
      "visibilidad": "perfil",
      "posteo_publico": false, // virtual DEPRECATED (visibilidad !== 'perfil')
      "texto": "...",
      "public_id": "...",
      "secure_url": "..."
      // ...
    }
  }
}
```

> **Guía para el frontend:** usa **`visibilidad`** como fuente de verdad. Ignora `posteo_publico` salvo para no romper código legacy.

---

## 6. Nueva regla de autenticación en el detalle (`GET /api/posteos/post/:id`)

- Sigue con token **opcional** (`verificarTokenSesionOpcional`) y rate-limited (`posteoPublicoLimiter`).
- Si `visibilidad === 'publico'` → responde `200` con o sin sesión.
- Si `visibilidad === 'perfil'` **y no hay sesión** → responde `401`:

```json
{
  "success": false,
  "error": {
    "title": "Authentication Error",
    "code": "AUTHENTICATION_ERROR",
    "status": 401,
    "detail": "Inicia sesión para ver este posteo"
  }
}
```

- Si `visibilidad === 'perfil'` **con sesión** → responde `200` normal (cualquier usuario autenticado puede verlo; comunidad abierta).

---

## 7. Perfil de usuario (`GET /api/posteos/usuario/:idUsuario`)

- **Dueño del perfil** (`req.usuario === idUsuario`): ve **todos** sus posteos (`publico` y `perfil`).
- **Visitante autenticado** (no dueño): solo ve los `publico` del perfil ajeno.

> El endpoint ya exigía sesión; no hay cambio de autenticación, solo de filtrado.

---

## 8. Favoritos

- Los favoritos **guardados** por el usuario siguen apareciendo en su lista (`GET /api/favoritos`), incluso si el posteo es `perfil`.
- El posteo dentro de la lista de favoritos ahora incluye `visibilidad` y `posteo_publico` (calculado) para que el frontend pueda decidir si el botón compartir es accionable.

---

## 9. Recomendación para el frontend (IMPORTANTE)

### 9.1 Compartir un posteo `perfil` debe estar bloqueado

Cuando el posteo tenga `visibilidad === 'perfil'`, el frontend **debe** impedir el compartir por link. **Decisión de implementación (frontend, 2026-08-27):**

1. El botón **"Compartir"/"Copiar enlace"** **sí se muestra**, pero aparece atenuado (`opacity: 0.6`) como señal de que está bloqueado.
2. Si el usuario intenta compartir, **no se genera ningún link** y se muestra una **advertencia inline pequeña** (fuente `small`, ocultable, se cierra sola a los 5 s):
   > *"Este posteo solo se puede ver dentro de TlaxApp porque está configurado como 'Solo perfil'."*
3. En el selector al crear/editar se etiqueta claramente:
   - **Público** → `publico` — *"Aparecerá en el inicio de todos los usuarios y en tu perfil."*
   - **Solo perfil** → `perfil` — *"Solo se muestra en tu perfil; no aparece en el inicio."*

### 9.2 Manejar el `401` al abrir un link directo

Cuando un visitante **sin sesión** abra un link de un posteo `perfil` (p. ej. desde una notificación o un link ya compartido antes del cambio):

1. Interpretar el `401` con código `AUTHENTICATION_ERROR` como **"este posteo exige iniciar sesión"** (no como error fatal). `isUnauthorized()` del `apiClient` ya matchea tanto `UNAUTHORIZED` como `AUTHENTICATION_ERROR`.
2. Mostrar una pantalla/estado de **"Inicia sesión para ver este posteo"** con acción **Ir a login** (`/cuentas/login`). En la metadata (server) se devuelve título genérico "Publicación" con `robots: { index: false }` y **sin Open Graph** (no revela contenido ni indexa links restringidos).
3. Tras iniciar sesión, re-intentar el `GET /api/posteos/post/:id` (el mismo link debe funcionar con sesión).

> El botón **compartir** de un posteo `perfil` nunca debe generar link; la regla 9.1 previene el caso, y el `401` es la segunda barrera de seguridad (aunque el usuario ya tenga el link, no puede verlo sin sesión).

### 9.3 Al crear/editar

- Enviar `visibilidad` con los valores `'publico'` / `'perfil'`.
- Leer `visibilidad` de la respuesta para sincronizar el estado local.
- **El frontend ya completó la transición (2026-08-27): no envía ni lee `posteo_publico` en ninguna pantalla.**

---

## 10. Matriz de pruebas para QA/frontend

| # | Escenario | Resultado esperado |
|---|---|---|
| 1 | `GET /post/:id` de posteo `publico` sin sesión | `200`, incluye `visibilidad: "publico"` |
| 2 | `GET /post/:id` de posteo `perfil` sin sesión | `401` `AUTHENTICATION_ERROR` |
| 3 | `GET /post/:id` de posteo `perfil` con sesión | `200`, incluye `visibilidad: "perfil"` y `posteo_publico: false` |
| 4 | Feed `GET /posteos` | Solo posteos `visibilidad: "publico"` |
| 5 | `GET /usuario/:id` de perfil ajeno (autenticado) | Solo posteos `publico` del autor |
| 6 | `GET /usuario/:id` del propio perfil | Todos los posteos (públicos y perfil) |
| 7 | `POST /posteos` con `visibilidad: 'perfil'` | `201`, posteo guardado como `perfil` |
| 8 | `POST /posteos` con `posteo_publico: false` (legacy) | `201`, se convierte a `perfil` |
| 9 | `POST /posteos` con `posteo_publico: 'true'` (legacy) | `201`, se convierte a `publico` |
| 10 | `POST /posteos` sin visibilidad | `201`, default `publico` |
| 11 | `POST /posteos` con `visibilidad: 'seguidores'` (inválido hoy) | `422` `VALIDATION_FAILED` |
| 12 | `PUT /:id` con `visibilidad: 'perfil'` | `200`, cambia a `perfil` |
| 13 | `PUT /:id` solo texto (sin visibilidad) | `200`, la visibilidad no cambia |
| 14 | Lista de favoritos con posteo `perfil` guardado | Sigue apareciendo; incluye `visibilidad` |
| 15 | Compartir posteo `perfil` (UI) | Botón oculto/deshabilitado o advertencia |

---

## 11. Archivos modificados en el backend

| Archivo | Cambio |
|---|---|
| `models/Posteo.js` | Campo `posteo_publico` → `visibilidad` (enum `['publico', 'perfil']`); virtual `posteo_publico` (DEPRECATED) + `toObject` con `virtuals: true` |
| `controllers/posteos.js` | Helper `resolverVisibilidad`; feed filtra `visibilidad: 'publico'`; `posteoGet` devuelve `401` si `perfil` sin sesión; `posteosUsuarioGet` filtra `publico` para visitantes; POST/PUT usan `visibilidad` (con fallback legacy) |
| `routes/posteos.js` | Validación `visibilidad` `isIn(['publico','perfil'])` en POST y PUT; `posteo_publico` sigue validado como Boolean (DEPRECATED) |
| `controllers/favoritos.js` | `$project` incluye `visibilidad` y `posteo_publico` calculado |
| `scripts/migrar-visibilidad-posteos.js` | Migración idempotente de datos existentes |
| `AGENTS.md`, `README.md`, `CHANGELOG.md`, `SPECS-EDICION-POSTEOS.md` | Documentación sincronizada |