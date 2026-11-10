---
title: "Plan de ejecución: fix de rate limiting en el frontend"
type: plan
status: working
created: "2026-11-05"
branch: "Fix-demasiadas-solitudes"
related: ["SPECS-FRONTEND-RATE-LIMITING.md"]
---

# Plan de ejecución: fix de rate limiting en el frontend

**Rama:** `Fix-demasiadas-solitudes`  
**Backend contrato:** `SPECS-FRONTEND-RATE-LIMITING.md` (rama `Feat-Implementacion-Fase-B`)  
**Fecha:** 2026-11-05  
**Objetivo:** eliminar el `429 READ_BLOCKED` que aparece al hacer scroll en el feed, usando `totalComentarios` del backend, quitando el polling duplicado de notificaciones y manejando el nuevo código `FLOOD_BLOCKED`.

---

## 1. Contexto y diagnóstico

### Síntoma

En la página de inicio, al hacer scroll y cargar más posteos, aparece de inmediato:

```
Has hecho demasiadas solicitudes. Espera un momento e intenta de nuevo.
ApiError: Demasiadas solicitudes, intenta de nuevo más tarde
    at handleApiResponse (apiClient.ts:250:11)
    at async NotificacionesProvider.useCallback[refrescarNotificaciones] (NotificacionesContext.tsx:35:20)
```

### Causa raíz

El mensaje proviene de `NotificacionesContext.tsx`, pero **el cupo se agota en el feed**, no en notificaciones. Hasta la Fase B todos los endpoints de lectura compartían `lecturaLimiter` (`READ_BLOCKED`, 100/15 min). La cadena que agota el cupo es:

1. `useInfinitePosts` pide una página de 15 posteos → 1 request.
2. Cada `PosteoCard` monta `useComentarios(post._id)`.
3. `useComentarios` hace `GET /api/comentarios/:posteoId/comentarios/count` en el mount → 15 requests.
4. Resultado: **16 requests por página**. En ~6 páginas se agotan las 100 peticiones.
5. El siguiente polling de notificaciones es el que recibe el `429` porque es la primera petición después de agotar el cubo compartido.

Además, hay un segundo `setInterval` en `MenuPrincipal.tsx` que duplica el polling de notificaciones.

### Solución del backend (ya implementada)

- Separó los cubos de lectura: feed, comentarios, notificaciones, social, catálogo.
- Añadió `totalComentarios` a `GET /api/posteos` y `GET /api/posteos/usuario/:idUsuario`.

### Lo que falta en el frontend

1. Usar `totalComentarios` del feed/perfil en lugar de pedir `count` por tarjeta.
2. Quitar el polling duplicado de notificaciones.
3. Manejar `FLOOD_BLOCKED` y asegurar que `429` no cierre sesión.
4. Ajustar tipos y tests.

---

## 2. Cambios detallados

### 2.1 Tipos — `src/types/types.ts`

Añadir `totalComentarios: number` al tipo `Posteo`.

```ts
export interface Posteo {
  _id: string;
  public_id: string;
  texto: string;
  // ... otros campos
  likesCount: number;
  hasLiked: boolean;
  totalComentarios: number; // ← NUEVO
}
```

**Criterio:** el proyecto compila sin errores de tipos.

---

### 2.2 Eliminar count por tarjeta — `src/app/components/PosteoCard.tsx`

**Línea aproximada:** 34

**Actual:**
```tsx
const { total: totalComentarios } = useComentarios(post._id);
```

**Nuevo:**
```tsx
const totalComentarios = post.totalComentarios ?? 0;
```

**Notas:**
- Conservar `useComentarios` solo para abrir el modal de comentarios (lista paginada), no para el contador.
- Si el badge de comentarios se muestra antes de abrir el modal, debe usar `post.totalComentarios`.
- Al crear/eliminar un comentario dentro del modal, se puede actualizar el estado local opcionalmente; al cerrar y reabrir se resincroniza.

---

### 2.3 Lazy load del count/lista de comentarios — `src/app/hooks/useComentarios.ts`

**Líneas aproximadas:** 25-46 (`fetchTotal`)

**Decisión:** el hook no debe llamar al `count` automáticamente al montar. Debe exponer una función para cargar la lista cuando se abra el modal.

**Opciones:**

- **Opción A (recomendada):** mantener `fetchTotal` pero no llamarlo en `useEffect` de montaje. El modal llama `fetchComentarios()` al abrirse, y el total se obtiene de la respuesta paginada o de un campo `total` de la API.
- **Opción B:** si el frontend necesita el total al abrir el modal, puede seguir usando `GET /api/comentarios/:posteoId/comentarios/count`, pero **solo en ese momento**, no por cada tarjeta.

**Criterio:** al renderizar una página de 15 posteos, no se dispara ninguna petición a `/api/comentarios/.../count`.

---

### 2.4 Quitar polling duplicado — `src/app/components/MenuPrincipal.tsx`

**Líneas aproximadas:** 41-46

**Actual:** hay un `useEffect` con `setInterval(refrescarNotificaciones, 60000)`.

**Acción:** eliminar ese `useEffect` y su `clearInterval`. El polling debe quedar solo en `NotificacionesContext.tsx`.

**Criterio:** con el DevTools Network abierto, en 60 s solo se ve **una** petición a `/api/notificaciones/nuevas-notificaciones`.

---

### 2.5 Ajustar intervalo de notificaciones (opcional) — `src/context/NotificacionesContext.tsx`

**Línea aproximada:** 53

**Actual:** `setInterval(refrescarNotificaciones, 60000)`.

**Recomendado:** mantener 60 s o subir a 30 s. Con el nuevo límite de 120/15 min (`notificacionesUsuarioLimiter`) hay margen para 8 peticiones/min.

**Nota:** no bajar de 15 s para no forzar al usuario a la frontera del límite.

---

### 2.6 Manejar `FLOOD_BLOCKED` — `src/lib/apiClient.ts`

**Línea aproximada:** 216-220

**Acción:** añadir `FLOOD_BLOCKED` al mapa de mensajes de 429.

```ts
if (isRateLimit(err)) {
  const code = err.code;
  if (code === 'FLOOD_BLOCKED') {
    return 'Demasiadas solicitudes desde tu red. Espera un momento e intenta de nuevo.';
  }
  return 'Has hecho demasiadas solicitudes. Espera un momento e intenta de nuevo.';
}
```

**Criterio:** un `429 FLOOD_BLOCKED` muestra un mensaje distintivo; un `429 READ_BLOCKED` mantiene el mensaje genérico actual.

---

### 2.7 Asegurar que `429` no cierre sesión — `src/context/AuthContext.tsx`

**Líneas aproximadas:** interceptor de errores.

**Acción:** verificar que solo `401`/`403` disparen logout/refresh. Un `429` debe propagarse como error de la operación sin tocar la sesión.

**Criterio:** al recibir un `429`, el usuario sigue autenticado y puede reintentar tras la ventana.

---

### 2.8 Revisar `useInfinitePosts` — `src/app/hooks/useInfinitePosts.ts`

**Línea aproximada:** 85-100 (`IntersectionObserver`)

**Acción:** asegurar que el observer no dispare `fetchPosts` múltiples veces para la misma página. Actualmente `loading` debería prevenirlo, pero verificar que no haya condiciones de carrera.

**Criterio:** al hacer scroll rápido, no se piden dos páginas con el mismo `nextUrl`.

---

## 3. Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/types/types.ts` | Añadir `totalComentarios: number` a `Posteo`. |
| `src/app/components/PosteoCard.tsx` | Usar `post.totalComentarios` en lugar de `useComentarios(post._id).total`. |
| `src/app/hooks/useComentarios.ts` | No llamar `fetchTotal` en el mount; cargar lista solo al abrir modal. |
| `src/app/components/MenuPrincipal.tsx` | Eliminar el segundo `setInterval` de notificaciones. |
| `src/context/NotificacionesContext.tsx` | (Opcional) mantener o ajustar intervalo a 30-60 s. |
| `src/lib/apiClient.ts` | Añadir mensaje para `FLOOD_BLOCKED`. |
| `src/context/AuthContext.tsx` | Verificar que `429` no dispare logout. |
| `src/app/hooks/useInfinitePosts.ts` | Verificar deduplicación de páginas. |

---

## 4. Archivos que NO deben modificarse

- No cambiar URLs, payloads ni cookies.
- No tocar `middlewares/rate-limiter.js` ni ningún archivo del backend (ese trabajo ya está en la rama del backend).
- No modificar `SPECS-VISIBILIDAD-POSTEOS.md` ni `SPECS-EDICION-POSTEOS.md` (probablemente serán eliminados a corto plazo).

---

## 5. Criterios de aceptación

1. **Tests en verde:** `pnpm run build` y `pnpm run test` (o el comando que use el frontend) pasan sin errores.
2. **Scroll sin 429:** cargar 10 páginas de feed (150 posteos) no produce `READ_BLOCKED`.
3. **Polling único:** en 60 s solo hay una petición a `/api/notificaciones/nuevas-notificaciones`.
4. **Comentarios correctos:** el badge de comentarios muestra `totalComentarios` del feed; al abrir el modal se cargan los comentarios reales.
5. **Manejo de errores:** un `429` muestra toast/amigable y no cierra sesión.
6. **Tipado:** `tsc --noEmit` (o equivalente) no reporta errores.

---

## 6. Comandos de verificación

```bash
# Compilar
pnpm run build

# Tests
pnpm run test

# Type check (si existe script)
pnpm run type-check
```

---

## 7. Notas de coordinación con el backend

- El campo `totalComentarios` ya está disponible en `GET /api/posteos` y `GET /api/posteos/usuario/:idUsuario`.
- Si el backend no está corriendo localmente, los mocks de tests deben incluir `totalComentarios` en los posteos de prueba.
- Una vez mergeado el backend, este plan puede ejecutarse sin más cambios de contrato.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El badge de comentarios queda desfasado tras crear/eliminar comentario | Actualizar estado local del modal o recargar al cerrar/reabrir. |
| `useComentarios` se usa en otros lugares y se rompe | Buscar todos los usos de `useComentarios` y adaptar cada uno. |
| El tipo `Posteo` se usa en muchos lugares | Añadir `totalComentarios` como opcional primero si hay dudas, luego volverlo obligatorio. |
| El frontend aún recibe `429` por `FLOOD_BLOCKED` en una red compartida | El mensaje debe ser claro; no es un bug. |
