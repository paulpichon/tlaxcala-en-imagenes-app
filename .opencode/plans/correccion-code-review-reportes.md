# Plan de Corrección — Code Review "Reportar Publicaciones"

> **Origen:** hallazgos del code review a la implementación de `SPECS-REPORTES.md` (Fase 1).
> **Estado:** pendiente de aprobación.
> **Build baseline:** `pnpm build` pasa sin errores con el estado actual.

---

## Resumen ejecutivo

9 tareas organizadas en 4 fases. Las tareas de la Fase 1 son independientes entre sí y pueden hacerse en cualquier orden (o en paralelo). La Fase 2 es secuencial (T5 → T6 → T7). La Fase 3 es independiente. La Fase 4 va al final.

| Fase | Tarea | Hallazgos | Archivos | Riesgo de ruptura |
|---|---|---|---|---|
| 1 | T1 — Backdrop guard | B1 | `ModalReportePublicacion.tsx` | Ninguno |
| 1 | T2 — Toast en detalle | B2 | `PosteoCard.tsx`, `PerfilUsuarioContainer.tsx` | Ninguno |
| 1 | T3 — Zod cleanup + docs inline | B4, M4, S1 | `validaciones.ts` | Ninguno |
| 1 | T4 — Copy empty-state | B6 | `PublicacionUsuario.tsx` | Ninguno |
| 2 | T5 — Constante compartida | M1 | `validaciones.ts` + 3 consumidores | Ninguno |
| 2 | T6 — Unificar handlers | M2 | `PublicacionesUsuarioGrid.tsx`, `PosteoCard.tsx`, `ImageModal.tsx` | Ninguno |
| 2 | T7 — Toast ownership + renombrar | B3, M5, M6 | `ModalOpcionesPublicacion.tsx`, `ModalReportePublicacion.tsx` | Ninguno |
| 3 | T8 — Accesibilidad | M3 | `ModalReportePublicacion.tsx` | Ninguno |
| 4 | T9 — Documentación | — | `AGENTS.md`, `CHANGELOG.md`, `README.md` | Ninguno |

---

## Fase 1 — Correcciones de bugs (independientes)

### T1 — B1: Backdrop guard inconsistente durante submit

**Problema:** el click en el backdrop de `ModalReportePublicacion` no está bloqueado durante `isSubmitting`, mientras que el botón Cancelar y el btn-close sí lo están. Si el usuario cierra el modal mientras el POST viaja, el resultado de la promesa se aplica sobre un modal desmontado: el padre oculta el posteo y muestra toast de éxito aunque el usuario "canceló".

**Archivos:**
- `src/app/components/reportes/ModalReportePublicacion.tsx`

**Cambios:**

1. Bloquear el click del backdrop cuando `isSubmitting`:
```tsx
// Línea 90 (motion.div del backdrop)
onClick={() => { if (!isSubmitting) onClose(false); }}
```

2. Agregar flag `activo` con cleanup de useEffect para ignorar resultados tardíos del POST (defensa por si el modal se desmonta por otra razón — ej. el posteo fue eliminado desde otra pestaña):
```tsx
const activoRef = useRef(true);

useEffect(() => {
  return () => { activoRef.current = false; };
}, []);
```

3. En `onSubmit`, verificar el flag antes de propagar:
```tsx
const onSubmit = async (data: ReporteFormData) => {
  setServerError(null);
  const body = { /* ... */ };
  try {
    const res = await apiPost<ReporteResponse>(fetchWithAuth, `/api/reportes/${posteoId}`, body);
    if (!activoRef.current) return;
    onClose(true, res.msg || "Reporte enviado correctamente");
  } catch (err) {
    if (!activoRef.current) return;
    // ...manejo de errores existente
  }
};
```

**Nota:** no se introduce `AbortController` — no es convención del codebase y la capa de defensa del flag es suficiente. El backend creará el reporte igual (spec: efecto inmediato), y el posteo se ocultará en el próximo fetch del feed (el backend excluye con `$nin`).

**Verificación:** abrir modal → seleccionar categoría → enviar → cerrar rápidamente durante "Enviando...". No debe aparecer toast ni ocultarse el posteo.

---

### T2 — B2: Toast perdido en página de detalle

**Problema:** al reportar desde `/posteo/[id]`, el flujo es `setToast → onPostReported → router.push()`. La navegación desmonta todo el árbol (incluido `ToastGlobal`), así que el usuario nunca ve la confirmación.

**Archivos:**
- `src/app/components/PosteoCard.tsx`
- `src/app/components/perfil/PerfilUsuarioContainer.tsx`

**Cambios:**

1. **PosteoCard.tsx** — `handlePostReported`: escribir sessionStorage antes de navegar cuando `isDetail`:
```tsx
const handlePostReported = (postId: string) => {
  closeOptions();
  onPostReported?.(postId);
  if (isDetail && user) {
    sessionStorage.setItem("reporteExitoso", "true");
    router.push(`/${user.url}`);
  }
};
```
Patrón ya establecido: `Formulario.tsx:33` usa `sessionStorage.setItem('passwordResetSuccess', 'true')` para el mismo propósito.

2. **PerfilUsuarioContainer.tsx** — useEffect al montar que lee y limpia el flag:
```tsx
const [toastReporte, setToastReporte] = useState<{ message: string; type: "success" } | null>(null);

useEffect(() => {
  const flag = sessionStorage.getItem("reporteExitoso");
  if (flag) {
    sessionStorage.removeItem("reporteExitoso");
    setToastReporte({
      message: "Reporte recibido. Esta publicación ya no aparecerá en tu feed.",
      type: "success",
    });
  }
}, []);
```
Renderizar el toast junto al `redirectMessage` existente:
```tsx
{toastReporte && (
  <ToastGlobal message={toastReporte.message} type={toastReporte.type} onClose={() => setToastReporte(null)} />
)}
```

**Verificación:** reportar desde detalle → redirige al perfil → toast de confirmación visible → se auto-cierra.

---

### T3 — B4 + M4 + S1: Limpieza del schema Zod + documentación inline

**Problema:** `.or(z.literal(''))` es redundante (B4); el cast de tupla carece de comentario (M4); no hay documentación sobre la decisión de no aplicar `spamRegex` (S1).

**Archivos:**
- `src/lib/validaciones.ts`

**Cambios:**

1. Eliminar `.or(z.literal(''))` de `descripcion`:
```ts
descripcion: z
  .string()
  .trim()
  .max(200, 'La descripción no puede superar los 200 caracteres')
  .optional(),
```

2. Agregar comentario al cast de tupla:
```ts
// Zod requiere un tuple [T, ...T[]] para z.enum(); .map() devuelve T[]
// por lo que se castea al tuple mínimo para satisfacer el tipo.
const categoriaSlugs = CATEGORIAS_REPORTE.map((c) => c.slug) as [
  CategoriaReporteSlug,
  ...CategoriaReporteSlug[],
];
```

3. Agregar comentario sobre `spamRegex` y `maxLength`:
```ts
// NOTA: a diferencia de comentarioSchema y editarPosteoSchema, NO se aplica
// spamRegex. La descripción de un reporte es para moderación (Fase 2), no se
// renderiza públicamente; filtrar URLs bloquearía descripciones legítimas
// usadas como evidencia (ej. "esta foto es de https://...").
//
// NOTA: maxLength=200 en el textarea cuenta caracteres crudos; Zod valida
// el valor post-trim. Un texto con trailing spaces puede ser válido para el
// backend pero bloqueado por maxLength — se acepta como trade-off por mantener
// la red de seguridad del navegador.
```

**Verificación:** enviar reporte con descripción vacía en categoría "otro" → error inline. Enviar con 200 caracteres → éxito.

---

### T4 — B6: Copy neutral del empty-state tras remover

**Problema:** al remover el último posteo del feed (con `finished=true`), aparece "Aún no hay publicaciones / Sé el primero en compartir algo con la comunidad" — implica BD vacía cuando en realidad el usuario ocultó todo.

**Archivos:**
- `src/app/components/inicio/PublicacionUsuario.tsx`

**Cambios:**
```tsx
// Reemplazar:
<h4 className="mb-2">Aún no hay publicaciones</h4>
<p className="text-muted">Sé el primero en compartir algo con la comunidad</p>

// Por:
<h4 className="mb-2">No hay publicaciones para mostrar</h4>
<p className="text-muted">Las publicaciones aparecerán aquí cuando estén disponibles.</p>
```

**Verificación:** reportar/eliminar todos los posteos del feed → mensaje neutral, no implica BD vacía.

---

## Fase 2 — Refactors de mantenibilidad (secuenciales: T5 → T6 → T7)

### T5 — M1: Constante de mensaje compartido

**Problema:** el mensaje de éxito del reporte está duplicado en 4 lugares. Si cambia, se desincroniza.

**Archivos:**
- `src/lib/validaciones.ts` (crear constante)
- `src/app/components/inicio/PublicacionUsuario.tsx` (consumir)
- `src/app/components/perfil/PerfilUsuarioContainer.tsx` (consumir — T2)
- `src/app/components/perfil/PublicacionesUsuarioGrid.tsx` (consumir)

**Cambios:**

En `validaciones.ts`, agregar junto a `CATEGORIAS_REPORTE`:
```ts
export const MENSAJE_REPORTE_EXITOSO =
  'Reporte recibido. Esta publicación ya no aparecerá en tu feed.';
```

Consumir en los 3 puntos:
```tsx
import { MENSAJE_REPORTE_EXITOSO } from "@/lib/validaciones";

// PublicacionUsuario.tsx:
setToast({ message: MENSAJE_REPORTE_EXITOSO, type: "success" });

// PerfilUsuarioContainer.tsx (T2):
setToastReporte({ message: MENSAJE_REPORTE_EXITOSO, type: "success" });

// PublicacionesUsuarioGrid.tsx:
setToast({ message: MENSAJE_REPORTE_EXITOSO, type: "success" });
```

**Verificación:** cambiar el texto de la constante en un solo lugar → los 3 puntos reflejan el cambio.

---

### T6 — M2: Unificar handlers duplicados

**Problema:** handlers de eliminación y reporte son casi idénticos en 3 componentes.

**Archivos:**
- `src/app/components/perfil/PublicacionesUsuarioGrid.tsx`
- `src/app/components/perfil/ImageModal.tsx`
- `src/app/components/PosteoCard.tsx`

**Cambios:**

1. **PublicacionesUsuarioGrid.tsx** — extraer función interna:
```tsx
const removerPosteoDelGrid = (postId: string, mensaje: string) => {
  setPosteos((prev) => prev.filter((p) => p._id !== postId));
  onPostCountChange?.(posteos.length - 1);
  setIsFirstModalOpen(false);
  setSelectedImage(null);
  setToast({ message: mensaje, type: "success" });
};

const handlePostDeleted = (id: string) =>
  removerPosteoDelGrid(id, "Publicación eliminada correctamente");

const handlePostReported = (id: string) =>
  removerPosteoDelGrid(id, MENSAJE_REPORTE_EXITOSO);
```

2. **ImageModal.tsx** — unificar wrappers de onPostDeleted y onPostReported:
```tsx
onPostDeleted={() => {
  setIsOptionsOpen(false);
  onClose();
  onPostDeleted?.(posteoActual?._id ?? "");
}}
onPostReported={() => {
  setIsOptionsOpen(false);
  onClose();
  onPostReported?.(posteoActual?._id ?? "");
}}
```
> Nota: los wrappers son idénticos en estructura pero se mantienen como props separadas porque la semántica difiere (eliminación vs. ocultamiento) y pueden divergir en Fase 2 (ej. animación distinta, diferente callback al grid).

3. **PosteoCard.tsx** — mantener `handlePostDeleted` y `handlePostReported` separados: tienen semántica distinta (eliminación es destructiva, reporte es ocultamiento) y los callbacks a los padres son diferentes. No se unifican.

**Verificación:** eliminar posteo desde grid → toast "eliminada". Reportar desde grid → toast "reporte recibido". Mismo comportamiento, menos código.

---

### T7 — B3 + M5 + M6: Toast ownership + renombrar callback + render condicional

**Problema:** toast de éxito duplicado en modal y padres (B3); `onClose(reported, msg)` shadow-prone (M5); span vacío de error (M6).

**Archivos:**
- `src/app/components/ModalOpcionesPublicacion.tsx`
- `src/app/components/reportes/ModalReportePublicacion.tsx`

**Cambios:**

1. **ModalOpcionesPublicacion.tsx** — eliminar `setToast` del handler de reporte (los padres ya manejan su toast):
```tsx
// ANTES:
onClose={(reported, msg) => {
  setShowReportModal(false);
  if (reported) {
    setToast({ message: msg || "Reporte enviado correctamente", type: "success" });
    onPostReported?.(selectedImage._id);
    onClose();
  }
}}

// DESPUÉS:
onFinish={(reported) => {
  setShowReportModal(false);
  if (reported) {
    onPostReported?.(selectedImage._id);
    onClose();
  }
}}
```

2. **ModalReportePublicacion.tsx** — renombrar `onClose` a `onFinish` y simplificar firma:
```tsx
// Interface:
interface ModalReportePublicacionProps {
  isOpen: boolean;
  posteoId: string;
  onFinish: (reported: boolean) => void;
}
```
El mensaje de éxito ya no se pasa (lo maneja el padre). El fallback interno se elimina.

3. **ModalReportePublicacion.tsx** — render condicional del span de error:
```tsx
// ANTES:
<span className="text-danger small">{errors.descripcion?.message ?? ""}</span>

// DESPUÉS:
{errors.descripcion && (
  <span className="text-danger small">{errors.descripcion.message}</span>
)}
```

**Verificación:** reportar desde feed → un solo toast (del feed). Reportar desde grid → un solo toast (del grid). Reportar desde detalle → toast en página destino (T2).

---

## Fase 3 — Accesibilidad

### T8 — M3: Accesibilidad del modal de reporte

**Problema:** el modal carece de `role="dialog"`, `aria-modal`, manejo de Escape y scroll lock del body.

**Archivos:**
- `src/app/components/reportes/ModalReportePublicacion.tsx`

**Cambios:**

1. Agregar atributos ARIA al `motion.div` contenedor:
```tsx
<motion.div
  role="dialog"
  aria-modal="true"
  aria-labelledby="reporte-titulo"
  className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75"
  style={{ zIndex: 2000 }}
  // ...
>
  <motion.div /* ... */>
    <h5 id="reporte-titulo" className="mb-0">
```

2. Agregar useEffect con Escape + scroll lock (replicar patrón `ImageModal.tsx:62-79`):
```tsx
useEffect(() => {
  if (!isOpen) return;

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !isSubmitting) {
      onClose(false);
    }
  };
  window.addEventListener("keydown", handleKeyDown);

  return () => {
    document.body.style.overflow = previousOverflow;
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [isOpen, isSubmitting, onClose]);
```
> Nota: Escape se ignora durante `isSubmitting` para evitar cancelar el POST en vuelo. El backdrop click también está bloqueado (T1).

3. Autofocus en el primer radio button:
```tsx
useEffect(() => {
  if (isOpen) {
    const firstRadio = document.querySelector<HTMLInputElement>(
      'input[name="categoria"]'
    );
    firstRadio?.focus();
  }
}, [isOpen]);
```
> Nota: no se implementa focus trap completo (no es convención del codebase; `EditarPosteoModal` tampoco lo tiene).

**Verificación:** abrir modal → foco en primer radio. Presionar Escape → se cierra (no durante submit). Scroll del body bloqueado. Screen reader anuncia "diálogo".

---

## Fase 4 — Documentación

### T9 — Actualización de AGENTS.md, CHANGELOG.md y README.md

**Archivos:**
- `AGENTS.md` — nueva sección "Reportes de publicación (Fase 1)"
- `CHANGELOG.md` — nueva entrada del ciclo
- `README.md` — verificar tabla de rutas

**AGENTS.md** — agregar sección después de "Posteo visibility":

```markdown
## Reportes de publicación (Fase 1)

- **Endpoint:** `POST /api/reportes/:posteoId` con body `{ categoria, descripcion }`.
- **Autenticación:** requerida (`fetchWithAuth`).
- **Motivos:** 7 categorías predefinidas en `CATEGORIAS_REPORTE` (`src/lib/validaciones.ts`), slug + label + prioridad denormalizada para Fase 2.
- **Validación:** `reporteSchema` (Zod) con descripción obligatoria solo para categoría `'otro'` (max 200 chars). No se aplica `spamRegex` (la descripción va a moderación, no se renderiza públicamente).
- **Efecto inmediato:** el posteo se oculta del feed y perfil del autor para el reportante (optimista local vía `removePost` / filter del grid; el backend refuerza con `$nin`).
- **Ocultamiento permanente:** no se revierte aunque moderación descarte el reporte (Fase 2).
- **Link directo:** `GET /api/posteos/post/:id` sigue devolviendo el posteo (spec: el autor nunca se entera). Un segundo reporte al mismo posteo devuelve `409 CONFLICT` — manejado con `getApiErrorCode`.
- **Reporte duplicado / propio:** `409 CONFLICT`. El botón no aparece para posteos propios (UI) ni sin sesión.
- **Rate limit:** `REPORTE_BLOCKED` (15 min / 10), cubierto automáticamente por `isRateLimit()` vía sufijo `_BLOCKED`.
- **Anonimato:** el frontend nunca expone `reporteroId`; `ReporteResponse` solo tipa `{ reporteId }`.
- **Toast post-navegación:** al reportar desde `/posteo/[id]` se usa `sessionStorage` + lectura en `PerfilUsuarioContainer` (patrón establecido en `Formulario.tsx:33`).
```

**CHANGELOG.md** — nueva entrada antes de la entrada actual:

```markdown
## [No publicado] — 2026-09-08 · Reportar publicaciones (Fase 1)

Ciclo centrado en la adopción del endpoint `POST /api/reportes/:posteoId` (SPECS-REPORTES.md). Los usuarios autenticados pueden reportar publicaciones ajenas por 7 motivos predefinidos; el posteo reportado se oculta inmediatamente del feed y perfil del autor para el reportante.

### Añadido

- Botón "Reportar publicación" en `ModalOpcionesPublicacion` (solo posteo ajeno con sesión activa).
- Componente `ModalReportePublicacion` con formulario react-hook-form + Zod (7 categorías, descripción condicional para "otro").
- Hook `removePost` en `useInfinitePosts` para ocultamiento optimista del feed (también corrige gap pre-existente de eliminación).
- Props `onPostDeleted`/`onPostReported` en `PosteoCard`, `ImageModal` y `PublicacionesUsuarioGrid`.
- `REPORTE_BLOCKED` en `ApiErrorCode`; operación `'reportar'` en `getUserMessage`.
- Tipos `ReporteResponse`, `CategoriaReporteSlug`, `ReporteFormData`.
- Constante `CATEGORIAS_REPORTE` y schema `reporteSchema` en `validaciones.ts`.

### Corregido

- Gap de eliminación en el feed: `PosteoCard` ahora propaga `onPostDeleted` al padre, que remueve el posteo de la lista (antes quedaba visible hasta recargar).

### Documentación

- `AGENTS.md`: sección "Reportes de publicación (Fase 1)".
- `SPECS-REPORTES.md`: especificación del backend (sin cambios en frontend).
```

**README.md** — verificar si hay tabla de rutas con `/posteo/[id]` que necesite actualizar (reporte no agrega ruta nueva, solo funcionalidad en modales existentes). Si no hay tabla, no se modifica.

**Verificación:** leer AGENTS.md → sección clara y completa. CHANGELOG.md → entrada coherente con el estilo existente.

---

## Verificación final

```bash
pnpm build
```

Pruebas manuales:
1. **Feed:** reportar posteo ajeno → posteo desaparece, toast "Reporte recibido..."
2. **Grid perfil:** reportar posteo ajeno → posteo desaparece del grid, toast
3. **Detalle:** reportar → redirige al perfil propio, toast de confirmación
4. **Posteo propio:** botón Reportar no aparece
5. **Vista pública:** botón Reportar no aparece
6. **Backdrop durante submit:** click no cierra el modal
7. **Escape durante submit:** no cierra el modal
8. **Escape sin submit:** cierra el modal
9. **Scroll lock:** body no scrollea con modal abierto
10. **Categoría "otro" sin descripción:** error inline
11. **Rate limit:** toast genérico de rate limit

---

## Archivos afectados (resumen)

| Archivo | Tareas |
|---|---|
| `src/lib/validaciones.ts` | T3, T5 |
| `src/app/components/reportes/ModalReportePublicacion.tsx` | T1, T7, T8 |
| `src/app/components/ModalOpcionesPublicacion.tsx` | T7 |
| `src/app/components/PosteoCard.tsx` | T2, T6 |
| `src/app/components/perfil/PerfilUsuarioContainer.tsx` | T2, T5 |
| `src/app/components/perfil/PublicacionesUsuarioGrid.tsx` | T5, T6 |
| `src/app/components/perfil/ImageModal.tsx` | T6 |
| `src/app/components/inicio/PublicacionUsuario.tsx` | T4, T5 |
| `AGENTS.md` | T9 |
| `CHANGELOG.md` | T9 |
| `README.md` | T9 (verificar) |
