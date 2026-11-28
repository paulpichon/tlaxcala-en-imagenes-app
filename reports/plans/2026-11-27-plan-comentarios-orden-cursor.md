---
title: "Comentarios: orden cronológico (asc) y paginación por cursor"
type: plan
status: working
created: "2026-11-27"
related: "backend 25899bf (orden + cursor), backend d14a611 (enlaces de Google Maps)"
branch: desarrollo
---

# Comentarios: orden cronológico (asc) y paginación por cursor

## Contexto

Hoy los comentarios se muestran del más reciente al más antiguo. Eso rompe la
lectura de una conversación: si alguien pregunta «¿dónde queda?» y el autor
responde (por ejemplo con un enlace de Google Maps, ya permitido), la respuesta
aparece **arriba** de la pregunta. Se decidió mostrar los comentarios en orden
cronológico: **más antiguos primero**.

El backend ya está listo (commit `25899bf` en `login-autenticacion`). Referencia
completa: `docs/api/comentarios.md` del backend, sección `[GET] /api/comentarios/:posteoId/comentarios`.

## Qué cambió en el backend

`GET /api/comentarios/:posteoId/comentarios`

| Query | Valores | Notas |
|---|---|---|
| `orden` | `asc` \| `desc` | Default `desc` **por compatibilidad**. El frontend debe pedir `asc`. |
| `cursor` | `_id` de comentario | No se construye a mano: viene dentro de `pagination.next`. |
| `limite` | 1–100 | Default 10 (sin cambios). |
| `page` | número | Solo compatibilidad. Con cursor no se usa para paginar. |

Respuesta (`pagination`):

```json
{
  "page": 1, "limit": 10, "total": 12, "totalPages": 2,
  "orden": "asc",
  "next": "/api/comentarios/<posteoId>/comentarios/?page=2&limite=10&orden=asc&cursor=<_id>",
  "prev": null
}
```

- `next` es `null` cuando no hay más comentarios.
- `prev` es `null` siempre que se pagina por cursor (solo se avanza).
- `orden` es nuevo: devuelve el orden aplicado.
- Errores nuevos (`422 VALIDATION_FAILED`): `"El orden debe ser \"asc\" o \"desc\""` y `"El cursor no es válido"`. No deberían ocurrir si se sigue `next` tal cual.

**Efecto inmediato sin tocar el frontend:** como `useComentarios.ts` ya sigue
`pagination.next` tal cual, «Cargar más» ahora usa cursor y **ya no duplica
comentarios** cuando alguien comenta mientras otro lee. El orden sigue siendo
`desc` hasta que el frontend pida `asc`.

## Qué hacer en el frontend

### 1. `src/app/hooks/useComentarios.ts`

1. **Primera carga con `orden=asc`** en `fetchComentarios`:
   ```ts
   `/api/comentarios/${postId}/comentarios?orden=asc`
   ```
   `cargarMasComentarios` no cambia: sigue usando `nextUrl` tal cual (ya trae `orden` y `cursor`).

2. **Comentario nuevo al final** en `agregarComentario` (hoy se agrega al inicio):
   ```ts
   setComentarios((prev) => [...prev, tempComment]);
   ```

3. **Deduplicar al cargar más.** Con `asc`, si el usuario comenta mientras aún
   hay páginas sin cargar (`hasMore`), su comentario es el más nuevo y el
   backend lo devolverá otra vez en la última página. Hay que fusionar por `_id`:
   ```ts
   setComentarios((prev) => {
     const ids = new Set(prev.map((c) => c._id));
     return [...prev, ...data.data.filter((c) => !ids.has(c._id))];
   });
   ```
   Hay un detalle visual aceptable: mientras queden páginas sin cargar, el
   comentario propio aparece al final de lo cargado (antes de «Cargar más») y,
   al terminar de cargar, se queda en su lugar real (el último). Si se prefiere
   evitarlo, se puede ocultar el temporal mientras `hasMore` sea `true` y
   mostrar un toast «Comentario publicado».

### 2. Componentes con lista de comentarios

`src/app/components/ComentariosModal.tsx` y `src/app/components/perfil/ImageModal.tsx`:

- Mover el botón **«Cargar más comentarios»** (`hasMore && …`) al **final** de la lista, después del último comentario (con `asc`, lo que falta es lo más nuevo).
- Tras publicar un comentario, **hacer scroll hasta el final** de la lista para que el usuario vea el suyo (un `ref` en el contenedor + `scrollTo({ top: scrollHeight, behavior: 'smooth' })`).
- Revisar `src/app/components/posteo/ComentariosSection.tsx` por si asume que el primer elemento es el más reciente.

### 3. Tipos (`src/types/types.ts`)

Agregar a `Pagination` el campo opcional:
```ts
orden?: 'asc' | 'desc';
```

## Despliegue

1. Backend `25899bf` puede ir primero (compatible: default `desc`).
2. Desplegar el frontend con los cambios de arriba.
3. Avisar al backend para cambiar el default de `orden` a `asc` (cambio de una línea, `ORDEN_COMENTARIOS_DEFAULT` en `controllers/comentarios.js`). El frontend no se ve afectado porque ya pide `asc` explícitamente.

## Implementación (2026-11-27, rama `Feat-agregar-links-google-maps-posteo-comentarios`)

Diferencias respecto al plan original:

- **«Cargar más» no se movió:** ya estaba al final de la lista en `ComentariosModal`, `ComentariosSection` e `ImageModal`.
- **Deduplicación con la posición del servidor** (en lugar del filtro del punto 1.3): se quitan de lo cargado los `_id` que llegan en la página nueva y luego se añade la página. Así el comentario propio publicado con páginas pendientes termina en su lugar real (el último), sin ocultar el temporal ni mostrar un toast.
- **Carrera POST + «Cargar más»:** si la página trae el comentario con su `_id` real antes de que responda el `POST`, al reemplazar el temporal se descarta esa copia (evita la key duplicada).
- **Scroll al final** tras publicar en los tres componentes. `ImageModal` usa un solo `ref` porque monta solo un layout (móvil o escritorio) a la vez.
- `ComentariosSection` no asumía que el primer elemento fuera el más reciente: solo necesitó el scroll.

## Relacionado: enlaces de Google Maps (commit `6d604df`)

Mismo ciclo de trabajo, ya hecho en este repo (commit `6d604df`):
`src/lib/enlaces.ts`, `src/app/components/TextoConEnlaces.tsx`, `src/lib/validaciones.ts`,
`ComentarioItem.tsx`, `PosteoCard.tsx`, `perfil/ImageModal.tsx`. El backend
(commit `d14a611`) rechaza cualquier URL que no sea de Google Maps con
`422` y `errors[].code: "URL_NOT_ALLOWED"`.

## Checklist de verificación

- [ ] Al abrir comentarios, el más antiguo aparece arriba y el más reciente abajo.
- [ ] «Cargar más» está al final y trae los siguientes en orden, sin duplicados.
- [ ] Comentar agrega el comentario al final y hace scroll hasta él.
- [ ] Comentar con páginas pendientes y luego «Cargar más» no duplica el comentario propio.
- [ ] Borrar un comentario y luego «Cargar más» no salta comentarios.
- [ ] El contador (`total`) sigue correcto al agregar y borrar.
