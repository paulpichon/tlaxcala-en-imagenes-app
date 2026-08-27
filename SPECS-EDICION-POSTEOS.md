# SPECS — Edición de Posteos (validadores tolerantes + eliminación de ubicación)

Especificación de los cambios en el backend relativos a la **edición de posteos** (`PUT /api/posteos/:id`) y a la **eliminación de la ubicación** de un posteo. Contrato antes/después para que el frontend adapte sus pantallas, flujos y manejo de errores.

> **Contexto del problema resuelto:** al editar solo el texto de un posteo **sin ubicación**, el formulario enviaba `municipio: null, lat: null, lng: null` junto con el texto, y el backend respondía `422 VALIDATION_FAILED` porque los validadores de `lat`/`lng` no toleraban `null`/`''`. Además, el backend reconstruía el objeto `ubicacion` completo en cada edición, lo que podía borrar datos de ubicación guardados cuando el formulario hacía "eco" de campos vacíos.

---

## 1. Resumen ejecutivo

| Aspecto | Antes | Ahora |
|---|---|---|
| Editar solo texto de un posteo sin ubicación | `422` por `lat`/`lng` nulos | ✅ Funciona (validadores toleran `null`/`''`/`undefined`) |
| Editar solo texto de un posteo con ubicación | Reconstruía `ubicacion`, podía borrar coordenadas GPS | ✅ No toca la ubicación existente (los vacíos = "no tocar") |
| Quitar la ubicación de un posteo | `PUT` con `municipio:null` + `lat:null` (trío de nulls) | **NUEVO** `DELETE /api/posteos/:id/ubicacion` |
| Contrato de "no tocar ubicación" | No existía | `null`/`''`/`undefined` en campos de ubicación = no tocar |

---

## 2. Contrato de edición parcial (`PUT /api/posteos/:id`)

### 2.1 Regla de oro para el frontend

> **Enviá SOLO los campos que el usuario modifica.** No hagas eco de todo el formulario. Los campos de ubicación en `null`/`''`/`undefined` se interpretan como "no tocar" y **ya no borran ni reconstruyen** la ubicación guardada.

### 2.2 Qué enviar en cada caso

| Acción del usuario | Payload |
|---|---|
| Agregar/modificar solo el texto | `{ "texto": "nuevo texto" }` |
| Cambiar texto + ubicación manual | `{ "texto": "...", "municipio": "<mongoId>", "localidadClave": "0024", "ciudad": "...", "estado": "...", "pais": "México" }` (lat/lng opcionales/omitidos) |
| Cambiar texto + ubicación GPS | `{ "texto": "...", "municipio": "<mongoId>", "localidadClave": "0024", "ciudad": "...", "estado": "...", "pais": "México", "lat": 19.3467, "lng": -98.1374 }` |
| Quitar la ubicación | Usar `DELETE /api/posteos/:id/ubicacion` (ver §3) |

### 2.3 Notas de comportamiento

- **`lat`/`lng` son opcionales en PUT.** Si no se envían, `esExacta` queda en `false` y `coordinates` en `null` (selección manual). Si se envían ambos, se guardan **redondeados a 3 decimales (~110 m)** — la BD nunca almacena la ubicación GPS exacta.
- **`municipio` y `localidadClave` van juntos**: si envías `localidadClave` sin `municipio`, el backend responde `400 BAD_REQUEST` (las claves INEGI solo son únicas dentro de su municipio).
- **Regla de Oro (vigente):** si el usuario eligió municipio manualmente, `coordinates` queda en `null`. Solo se guardan coordenadas cuando la selección fue automática/GPS.
- Si el posteo **no tiene** ubicación y solo envías texto, la respuesta traerá `ubicacion: null` (no cambia).

---

## 3. NUEVO endpoint: `DELETE /api/posteos/:id/ubicacion`

Elimina **solo la ubicación** del posteo (el posteo e imagen permanecen intactos).

### 3.1 Request

- **Método:** `DELETE`
- **Ruta:** `/api/posteos/:id/ubicacion`
- **Autenticación:** requiere sesión (`verificarTokenSesion`) y ser el dueño del posteo
- **Body:** no aplica

### 3.2 Respuestas

| Caso | Status | Body |
|---|---|---|
| Éxito (posteo sin ubicación previa) | 200 | `{ "success": true, "msg": "Ubicación eliminada correctamente", "data": { "posteo": { ... "ubicacion": null } } }` |
| Éxito (con ubicación previa) | 200 | Mismo shape; `posteo.ubicacion` pasa de objeto a `null` |
| Posteo inexistente / eliminado | 404 | `NOT_FOUND` |
| No dueño del posteo | 403 | `FORBIDDEN` |
| `id` no es MongoId válido | 400 | `BAD_REQUEST` |

> El `data.posteo` devuelto es el documento actualizado (`returnDocument: 'after'`), útil para sincronizar el estado local sin otro `GET`.

### 3.3 Cambio en el frontend

Si tu pantalla de edición tiene el botón/acción **"Quitar ubicación"**, ahora debe llamar a este endpoint en lugar de reenviar el trío de nulls en el PUT:

```js
// ANTES (deprecado, ya NO funciona):
await api.put(`/api/posteos/${id}`, { municipio: null, lat: null, lng: null, texto });

// AHORA (nuevo):
await api.delete(`/api/posteos/${id}/ubicacion`);
```

---

## 4. Validadores (detalle técnico)

| Campo | Validación | Tolerancia |
|---|---|---|
| `lat` | `optional({ values: 'falsy' }).isFloat()` | `null`, `''`, `undefined` pasan; si llega valor, debe ser numérico |
| `lng` | `optional({ values: 'falsy' }).isFloat()` | idem |
| `municipio` | `optional({ values: 'falsy' }).isMongoId()` | idem (sin cambios, ya toleraba) |
| `localidadClave` | `optional({ values: 'falsy' }).matches(/^\d{4}$/)` | idem (sin cambios) |

> `lat`/`lng = 0` también pasan como "vacío" (imposibles en México ~19°N / ~-98°W); no es un caso real.

---

## 4.5 Forma garantizada de `data.posteo` (consistencia de contrato)

Las respuestas de **POST `/api/posteos`**, **PUT `/api/posteos/:id`** y **DELETE `/api/posteos/:id/ubicacion`** devuelven el documento real de la BD (post-escritura) con el autor **poblado**, idéntico al que devuelven los GETs:

```jsonc
{
  "success": true,
  "msg": "...",
  "data": {
    "posteo": {
      "_id": "...",
      "_idUsuario": {
        "_id": "...",
        "nombre_completo": "...",
        "imagen_perfil": { "public_id": "..." },
        "url": "..."
      },
      "texto": "...",
      "ubicacion": { "ciudad": "...", "municipio": "<mongoId crudo>", "localidadClave": "0024", "localidadNombre": "...", "estado": "...", "pais": "México", "coordinates": { "type": "Point", "coordinates": [-98.137, 19.347] }, "esExacta": true },
      "public_id": "...",
      "secure_url": "...",
      "posteo_publico": true,
      "fecha_creacion": "...",
      "fecha_actualizacion": "...",
      "comentariosActivos": true,
      "comentariosCount": 0
    }
  }
}
```

> **`_idUsuario` siempre viene poblado** (no un ObjectId crudo). Sincroniza con **merge** (`{ ...posteoViejo, ...data.posteo }`) sobre tu estado.

### 4.5.1 Campos garantizados vs. ausentes por diseño

| Campo | ¿Viene en escrituras? | Garantía |
|---|---|---|
| `_idUsuario` (poblado) | ✅ | Siempre: `{ _id, nombre_completo, imagen_perfil.public_id, url }` |
| `ubicacion` | ✅ | Documento completo; **`ubicacion.municipio` = ObjectId crudo en TODAS las respuestas** (GETs y escrituras — sin populate por diseño); `ubicacion: null` tras DELETE-ubicacion |
| `texto`, `public_id`, `secure_url`, `posteo_publico`, `fechas`, `comentariosActivos` | ✅ | Documento real de la BD (post-escritura, `returnDocument: 'after'`) |
| `comentariosCount` | ✅ | **Autoritativo** — viene del documento real (refleja comentarios ajenos intermedios) |
| `likesCount` | ❌ | Solo lo computan los GETs con sesión |
| `hasLiked` | ❌ | Ídem |
| `isFavorito` | ❌ | Ídem |
| `isFollowing` | ❌ | Ídem |

### 4.5.2 Guía de merge para el frontend

- **Preservar flags de sesión**: como `likesCount`/`hasLiked`/`isFavorito`/`isFollowing` no vienen en escrituras, el spread `{ ...posteoViejo, ...data.posteo }` los conserva por construcción (claves ausentes no sobreescriben). Mantener `fusionarCambios` tal como está.
- **Sincronizar `comentariosCount` desde la respuesta**: sí viene y es autoritativo; no usar un valor optimista viejo para contadores.
- **POST (posteo nuevo)**: no existe `posteoViejo` — inicializar defaults correctos por definición: `likesCount: 0`, `hasLiked: false`, `isFavorito: false`, `isFollowing: false`.
- **`ubicacion.municipio` es un ObjectId crudo** (igual en GETs y escrituras): resolver el nombre del municipio client-side desde el catálogo cacheado de `GET /api/municipios` (`_id` → `nombreMunicipio`), como ya se hace para el cascading. No existe ningún endpoint que devuelva `municipio` poblado.
- Si se requiere autoridad fresca de los 4 flags de sesión, el frontend hace refetch del detalle (`GET /api/posteos/post/:id`) — no está previsto computarlos en escrituras (coste sin valor de producto).

---

## 5. Matriz de pruebas para QA/frontend

| # | Escenario | Payload | Resultado esperado |
|---|---|---|---|
| 1 | Posteo sin ubicación, agregar texto | `{ "texto": "hola" }` | 200, `ubicacion: null` (intacto) |
| 2 | Posteo sin ubicación, texto + campos vacíos (caso del bug) | `{ "texto": "hola", "municipio": null, "lat": null, "lng": null }` | ✅ 200 — ya **no** da `422` |
| 3 | Posteo con ubicación, solo texto | `{ "texto": "hola" }` | 200, `ubicacion` **sin cambios** (conserva coordenadas/localidad) |
| 4 | Posteo con ubicación, texto + campos vacíos | `{ "texto": "hola", "municipio": null, "ciudad": "", "estado": null }` | 200, `ubicacion` sin cambios |
| 5 | Quitar ubicación (flujo nuevo) | `DELETE /api/posteos/:id/ubicacion` | 200, `posteo.ubicacion === null` |
| 6 | Quitar ubicación de posteo sin ubicación | `DELETE` idem | 200 (idempotente, `ubicacion: null`) |
| 7 | Quitar ubicación de posteo ajeno | `DELETE` idem | 403 `FORBIDDEN` |
| 8 | Editar con GPS | `{ texto, lat, lng, municipio, localidadClave }` | 200, `coordinates` redondeado a ≤3 decimales, `esExacta: true` |
| 9 | Editar con selección manual | `{ texto, municipio, localidadClave, ciudad, estado, pais }` (sin lat/lng) | 200, `esExacta: false`, `coordinates: null` |
| 10 | `localidadClave` sin `municipio` | `{ "texto": "x", "localidadClave": "0024" }` | 400 `BAD_REQUEST` |

---

## 6. Archivos modificados en el backend

| Archivo | Cambio |
|---|---|
| `routes/posteos.js` | `lat`/`lng` con `optional({ values: 'falsy' })` en POST y PUT; nueva ruta `DELETE /:id/ubicacion` |
| `controllers/posteos.js` | `hayDatosUbicacion` solo cuenta valores reales (`!== undefined && !== null && !== ''`); eliminado el "Caso A" de borrado implícito; nuevo controlador `posteoUbicacionDelete`; constante `PROYECCION_AUTOR_POSTEO` usada en GETs y en las respuestas de escritura (POST/PUT/DELETE-ubicacion) para que `_idUsuario` siempre venga poblado |
| `CHANGELOG.md` | Entradas en Agregado/Cambiado |
| `helpers/redondear-coordenadas.js` | (previo) redondeo de coordenadas a 3 decimales |