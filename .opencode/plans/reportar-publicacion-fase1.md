# Plan: Reportar una publicación — Fase 1

> **SPECS:** `SPECS-REPORTES.md`
> **Estado:** Aprobado para implementación

---

## Resumen

Implementar la funcionalidad de reportar publicaciones en el frontend. El botón "Reportar publicación" vive dentro del `ModalOpcionesPublicacion`, solo visible para usuarios autenticados que no son autores del posteo. Tras reportar exitosamente, el posteo se oculta inmediatamente del feed y del perfil del autor para el reportante (sin eliminarse).

## Decisiones de diseño

1. **Vista pública (sin sesión):** NO se muestra el botón Reportar. La API exige autenticación; redirigir a login es mala UX.
2. **Ocultamiento inmediato:** Se replica el patrón de eliminación — el posteo se remueve del array local (feed y grid de perfil) sin re-fetch.
3. **Gap existente:** Se corrige el gap de `PosteoCard` en el feed (no propagaba `onPostDeleted`) agregando `removePost` al hook `useInfinitePosts`.
4. **Callback separado:** Se usa `onPostReported` (no reutilizar `onPostDeleted`) para mantener semántica clara, aunque ambos hacen lo mismo (remover de la lista).

---

## Tarea 1: Foundation — Constantes, schema, tipos, apiClient

### 1a. `src/lib/validaciones.ts`

Agregar al final del archivo (después de `validarUbicacionPost`):

```ts
export const CATEGORIAS_REPORTE = [
  { slug: 'contenido_inapropiado', label: 'Contenido inapropiado (desnudez/sexual)', prioridad: 1 },
  { slug: 'contenido_ofensivo', label: 'Contenido ofensivo o discurso de odio', prioridad: 2 },
  { slug: 'acoso_bullying', label: 'Acoso o bullying', prioridad: 3 },
  { slug: 'suplantacion_identidad', label: 'Suplantación de identidad', prioridad: 4 },
  { slug: 'informacion_falsa', label: 'Información falsa', prioridad: 5 },
  { slug: 'spam', label: 'Spam o publicidad no autorizada', prioridad: 6 },
  { slug: 'otro', label: 'Otro', prioridad: 7 },
] as const;

export type CategoriaReporteSlug = (typeof CATEGORIAS_REPORTE)[number]['slug'];

const categoriaSlugs = CATEGORIAS_REPORTE.map((c) => c.slug) as [
  CategoriaReporteSlug,
  ...CategoriaReporteSlug[],
];

export const reporteSchema = z
  .object({
    categoria: z.enum(categoriaSlugs, {
      error: () => ({ message: 'Selecciona un motivo para el reporte' }),
    }),
    descripcion: z
      .string()
      .trim()
      .max(200, 'La descripción no puede superar los 200 caracteres')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.categoria === 'otro' && !data.descripcion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Describe brevemente el motivo del reporte',
        path: ['descripcion'],
      });
    }
  });

export type ReporteFormData = z.infer<typeof reporteSchema>;
```

### 1b. `src/types/types.ts`

Agregar al final del archivo:

```ts
// ======================================
// 📦 Reportes
// ======================================

export interface ReporteResponse {
  success: boolean;
  msg: string;
  data: { reporteId: string };
}
```

### 1c. `src/lib/apiClient.ts`

- Agregar `REPORTE_BLOCKED: 'REPORTE_BLOCKED'` en `ApiErrorCode` (después de `POST_DETAIL_BLOCKED`).
- Agregar `| 'reportar'` al union `Operacion` (antes de `| 'default'`).
- Agregar `reportar: 'No se pudo enviar el reporte. Intenta de nuevo.'` en `MENSAJES_POR_DEFECTO`.

---

## Tarea 2: Hook `useInfinitePosts` — `removePost`

**Archivo:** `src/app/hooks/useInfinitePosts.ts`

Agregar después de `updatePost`:

```ts
const removePost = useCallback(
  (postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  },
  []
);
```

Agregar `removePost` al return del hook:

```ts
return {
  posts,
  loading,
  observerRef,
  finished,
  error,
  clearError,
  updateFollowState,
  updateFavoritoState,
  updatePost,
  removePost,
};
```

---

## Tarea 3: `PosteoCard` — Props extendidas

### 3a. `src/types/types.ts`

Modificar `PosteoCardProps`:

```ts
export interface PosteoCardProps {
  post: Posteo;
  isDetail?: boolean;
  showUserUrl?: boolean;
  onPostUpdated?: (posteo: Posteo) => void;
  onPostDeleted?: (postId: string) => void;
  onPostReported?: (postId: string) => void;
}
```

### 3b. `src/app/components/PosteoCard.tsx`

1. Actualizar desestructuración de props para incluir `onPostDeleted` y `onPostReported`.
2. Modificar `handlePostDeleted` para propagar:

```ts
const handlePostDeleted = () => {
  closeOptions();
  onPostDeleted?.(posteoActual._id);
  if (isDetail && user) {
    router.push(`/${user.url}`);
  }
};
```

3. Agregar `handlePostReported`:

```ts
const handlePostReported = (postId: string) => {
  closeOptions();
  onPostReported?.(postId);
  if (isDetail && user) {
    router.push(`/${user.url}`);
  }
};
```

4. Pasar `onPostReported={handlePostReported}` al `<ModalOpcionesPublicacion>`.

---

## Tarea 4: Componente `ModalReportePublicacion`

**Archivo nuevo:** `src/app/components/reportes/ModalReportePublicacion.tsx`

### Interfaz

```ts
interface ModalReportePublicacionProps {
  isOpen: boolean;
  posteoId: string;
  onClose: (reported: boolean) => void;
}
```

### Estructura

- Sub-modal Bootstrap centrado (como `EditarPosteoModal`).
- Header: "Reportar publicación" con botón cerrar.
- Formulario con `react-hook-form` + `zodResolver(reporteSchema)`.
- 7 radio buttons (uno por categoría), cada uno con su label.
- Textarea condicional: solo visible si `categoria === 'otro'`. Contador de caracteres `X/200`.
- Botón "Enviar reporte" con estado de carga (`isSubmitting`).
- Error inline si el backend devuelve 409/422.

### Lógica de envío

```ts
const onSubmit = async (data: ReporteFormData) => {
  setIsSubmitting(true);
  setServerError(null);
  try {
    const body: Record<string, string | null> = { categoria: data.categoria };
    body.descripcion = data.categoria === 'otro' ? (data.descripcion ?? null) : null;

    const res = await apiPost<ReporteResponse>(
      fetchWithAuth,
      `/api/reportes/${posteoId}`,
      body
    );

    setToast({ message: res.msg || 'Reporte enviado correctamente', type: 'success' });
    setTimeout(() => onClose(true), 600);
  } catch (err) {
    const code = getApiErrorCode(err);
    if (code === ApiErrorCode.CONFLICT) {
      setServerError(getApiErrorMessage(err, 'No se pudo enviar el reporte'));
    } else {
      const msg = getUserMessage(err, 'reportar');
      setServerError(msg);
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

### CSS

Usar CSS module nuevo en `src/app/ui/reportes/reporte.module.css` o Bootstrap utility classes directamente (preferir Bootstrap para consistencia con el resto de modales).

---

## Tarea 5: `ModalOpcionesPublicacion` — Integración

**Archivo:** `src/app/components/ModalOpcionesPublicacion.tsx`

### 5a. Importar

```ts
import { FiFlag } from 'react-icons/fi';
import ModalReportePublicacion from './reportes/ModalReportePublicacion';
```

### 5b. Interfaz

Agregar a `ModalOpcionesPublicacionProps`:

```ts
onPostReported?: (postId: string) => void;
```

### 5c. Estado

```ts
const [showReportModal, setShowReportModal] = useState(false);
```

### 5d. Botón Reportar

En la rama `else` (posteo ajeno, con sesión), después de `FavoritoButton`, agregar:

```tsx
<div className="col-md-12 mb-2">
  <button
    type="button"
    className={`${perfil.btn_opciones_publicaciones} text-danger`}
    onClick={() => setShowReportModal(true)}
  >
    <FiFlag className="me-1" size={14} />
    Reportar publicación
  </button>
</div>
```

### 5e. Renderizar sub-modal

Al final del JSX, junto a los otros modales:

```tsx
{showReportModal && selectedImage && (
  <ModalReportePublicacion
    isOpen={showReportModal}
    posteoId={selectedImage._id}
    onClose={(reported) => {
      setShowReportModal(false);
      if (reported) {
        onPostReported?.(selectedImage._id);
        onClose();
      }
    }}
  />
)}
```

---

## Tarea 6: Consumidores — Conectar callbacks

### 6a. Feed: `src/app/components/inicio/PublicacionUsuario.tsx`

```ts
const { posts, loading, observerRef, finished, error, clearError, updatePost, removePost } =
  useInfinitePosts(`${process.env.NEXT_PUBLIC_API_URL}/api/posteos`);
```

Pasar a `PosteoCard`:

```tsx
<PosteoCard
  key={post._id}
  post={post}
  onPostUpdated={handlePostUpdated}
  onPostDeleted={removePost}
  onPostReported={removePost}
/>
```

### 6b. Perfil: `src/app/components/perfil/ImageModal.tsx`

Agregar `onPostReported?: (id: string) => void` a `PropsImageModal`.

Pasar al `<ModalOpcionesPublicacion>`:

```tsx
onPostReported={(postId) => {
  setIsOptionsOpen(false);
  onClose();
  if (onPostReported) {
    onPostReported(postId);
  }
}}
```

### 6c. Perfil: `src/app/components/perfil/PublicacionesUsuarioGrid.tsx`

Pasar `handlePostDeleted` también como `onPostReported` al ImageModal:

```tsx
<ImageModal
  ...
  onPostDeleted={handlePostDeleted}
  onPostReported={handlePostDeleted}
/>
```

### 6d. Detalle: `src/app/components/PosteoDetalle.tsx`

Pasar `onPostDeleted` y `onPostReported` al PosteoCard (ambos navegan al perfil del usuario logueado, igual que `handlePostDeleted` en PosteoCard con `isDetail`).

```tsx
<PosteoCard
  post={post}
  isDetail={true}
  showUserUrl={true}
  onPostDeleted={() => router.push(`/${user?.url}`)}
  onPostReported={() => router.push(`/${user?.url}`)}
/>
```

---

## Archivos afectados (resumen)

| Archivo | Cambio |
|---|---|
| `src/lib/validaciones.ts` | +`CATEGORIAS_REPORTE`, `reporteSchema`, `ReporteFormData` |
| `src/types/types.ts` | +`ReporteResponse`, ampliar `PosteoCardProps` |
| `src/lib/apiClient.ts` | +`REPORTE_BLOCKED`, `'reportar'` operacion |
| `src/app/hooks/useInfinitePosts.ts` | +`removePost` |
| `src/app/components/PosteoCard.tsx` | +`onPostDeleted`, `onPostReported` props |
| `src/app/components/reportes/ModalReportePublicacion.tsx` | **NUEVO** — formulario de reporte |
| `src/app/components/ModalOpcionesPublicacion.tsx` | +botón Reportar, +sub-modal |
| `src/app/components/inicio/PublicacionUsuario.tsx` | conectar `removePost` |
| `src/app/components/perfil/ImageModal.tsx` | +`onPostReported` prop |
| `src/app/components/perfil/PublicacionesUsuarioGrid.tsx` | pasar `onPostReported` |
| `src/app/components/PosteoDetalle.tsx` | pasar callbacks de navegación |

## Verificación

1. `pnpm build` — sin errores de TypeScript.
2. Feed: reportar posteo ajeno → desaparece del feed, toast de confirmación.
3. Perfil del autor: reportar → desaparece del grid.
4. Detalle: reportar → redirige al perfil propio.
5. Posteo propio: no aparece botón Reportar.
6. Vista pública: no aparece botón Reportar.
7. Reportar dos veces el mismo posteo: el backend devuelve 409 (no debería llegarse porque el posteo ya se ocultó).
8. Categoría "otro" sin descripción: error de validación inline.
9. Rate limit: toast genérico de rate limit.
