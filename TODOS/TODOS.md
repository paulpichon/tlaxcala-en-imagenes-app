# Plan de correcciones — API Frontend vs Documentación

**Generado:** 2026-07-08

## Convenciones del plan

- **🔴 Rojo**: Requiere cambios en el backend (API Node.js)
- **🟡 Amarillo**: Solo cambios en frontend (Next.js)

---

## ✅ ~~🥇 Prioridad 1~~ — Ineficiencia en `useLikes.ts` — **Completado**

**Problema:** Se usa `GET /api/likes/{postId}/likes/usuarios` para obtener el conteo de likes y saber si el usuario ya dio like. Este endpoint devuelve **todos** los usuarios que likearon, lo cual es ineficiente a escala (si un posteo tiene 1000 likes, descarga 1000 objetos).

**Archivo:** `src/app/hooks/useLikes.ts`

### 🔴 Cambios en backend

Agregar `likesCount` y `hasLiked` en la respuesta de los endpoints de posteos:

| Endpoint | Campo a agregar |
|---|---|
| `GET /api/posteos/` | `likesCount: number`, `hasLiked: boolean` en cada posteo de `posteosConEstado[]` |
| `GET /api/posteos/post/:id` | `likesCount: number`, `hasLiked: boolean` en el objeto `posteo` |
| `GET /api/posteos/usuario/:idUsuario` | `likesCount: number`, `hasLiked: boolean` en cada posteo de `posteos[]` |

**Respuesta esperada del backend (adicional en cada posteo):**
```json
{
  "posteo": {
    "...": "...",
    "likesCount": 15,
    "hasLiked": false
  }
}
```

### 🟡 Cambios en frontend

1. `src/types/types.ts` — agregar `likesCount: number` y `hasLiked: boolean` a la interfaz `Posteo`
2. `src/app/hooks/useLikes.ts` — refactorizar para que **no haga fetch inicial**; recibir `likesCount` y `hasLiked` como props/initialState; el toggle actualiza estado local sin refetch
3. `src/app/hooks/useLikesModal.ts` — mantener el uso de `GET /api/likes/{id}/likes/usuarios` solo para abrir el modal
4. `src/app/components/PosteoCard.tsx` — pasar `likesCount` y `hasLiked` a `useLikes`

---

## ✅ ~~🥇 Prioridad 2~~ — Cliente API centralizado — **Completado**

**Problema:** Más de 40 lugares construyen la URL manualmente con `process.env.NEXT_PUBLIC_API_URL + "/api/..."`. Frágil ante cambios de esquema de URLs.

**Sin cambios en backend.**

### 🟡 Cambios en frontend

1. Crear `src/lib/apiClient.ts`:
   ```typescript
   const API_URL = process.env.NEXT_PUBLIC_API_URL;

   export function apiUrl(path: string) {
     return `${API_URL}${path}`;
   }

   export async function handleApiResponse<T>(res: Response): Promise<T> {
     const data = await res.json();
     if (!res.ok) {
       throw { status: res.status, ...data };
     }
     return data as T;
   }
   ```
2. Migrar progresivamente todos los hooks y componentes a usar `apiUrl('/api/...')` en lugar de concatenar manualmente.

**Archivos a modificar (~20):**
- `src/lib/actions.ts`
- `src/context/FavoritoContext.tsx`
- `src/context/FollowContext.tsx`
- `src/context/NotificacionesContext.tsx`
- `src/context/NuevosUsuariosContext.tsx`
- `src/context/AuthContext.tsx`
- `src/app/hooks/useNotifications.tsx`
- `src/app/hooks/useLikes.ts`
- `src/app/hooks/useLikesModal.ts`
- `src/app/hooks/useComentarios.ts`
- `src/app/hooks/useCrearPosteo.ts`
- `src/app/hooks/useInfinitePosts.ts`
- `src/app/hooks/useUsuarioPerfil.ts`
- `src/app/hooks/useEditarPerfil.ts`
- `src/app/hooks/useObtenerUbicacion.ts`
- `src/app/hooks/usePushNotifications.ts`
- `src/app/components/CambiarImagenModal.tsx`
- `src/app/components/ModalOpcionesPublicacion.tsx`
- `src/app/components/PosteoCard.tsx`
- `src/app/components/PosteoDetalle.tsx`
- `src/app/components/perfil/PublicacionesUsuarioGrid.tsx`
- `src/app/components/perfil/ImageModal.tsx`
- `src/app/components/perfil/FollowersModal.tsx`
- `src/app/components/perfil/FollowingModal.tsx`
- `src/app/components/ManualMunicipioSelector.tsx`
- `src/app/components/favoritos/Favoritos.tsx`
- `src/app/components/configuracion/ayuda-y-soporte/AyudaSoporte.tsx`
- `src/app/components/configuracion/eliminar-cuenta-usuario/EliminarCuenta.tsx`
- `src/app/components/posteo/EditarPosteoModal.tsx`
- `src/app/cuentas/login/components/FormularioLogin.tsx`
- `src/app/cuentas/login/restablecer-password/components/Formulario.tsx`

---

## ✅ ~~🥈 Prioridad 3~~ — `uid` vs `_id` en Favoritos — **Completado**

**Problema:** `src/app/components/favoritos/Favoritos.tsx:118` usa `fav.autorId.uid`. La API documentada devuelve `autorId._id`. Si el backend no serializa `uid`, `FavoritoButton` recibe `undefined`.

### 🔴 Opción A — Cambiar backend

Agregar `uid` al objeto `autorId` en la respuesta de `GET /api/favoritos/` para mantener consistencia con el resto del frontend.

**Respuesta esperada:**
```json
{
  "autorId": {
    "_id": "60f...",
    "uid": "60f...",
    "nombre_completo": { "nombre": "...", "apellido": "..." },
    "url": "..."
  }
}
```

### 🟡 Opción B — Cambiar frontend

Cambiar `Favoritos.tsx` para usar `fav.autorId._id` en lugar de `uid`. Ajustar la interfaz `FavoritoButtonProps` si es necesario.

---

## ✅ ~~🥈 Prioridad 4~~ — Estado mutable compartido en `actions.ts` — **Completado**

**Problema:** `funcionRequestOptions` muta una variable `requestOptions` global al módulo. Si dos llamadas ocurren casi simultáneas, hay race condition.

**Sin cambios en backend.**

### 🟡 Cambios en frontend

Refactorizar `src/lib/actions.ts` para crear un objeto `RequestInit` nuevo en cada llamada:

```typescript
function crearRequestOptions(raw: BodyInit): RequestInit {
  return {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: raw,
    redirect: "follow",
  };
}
```

Eliminar la variable global `requestOptions` y la función `funcionRequestOptions`.

---

## ✅ ~~🥈 Prioridad 5~~ — `fetchWithAuth` sin reintento ante error de red — **Completado**

**Problema:** Solo reintenta si el backend responde con `401`. Si hay error de red (fetch lanza excepción), la petición falla sin reintento.

**Sin cambios en backend.**

### 🟡 Cambios en frontend

Agregar reintento con backoff simple en `src/context/AuthContext.tsx`:

```typescript
const fetchWithAuth = useCallback(
  async (input: RequestInfo, init?: RequestInit, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        let response = await fetch(input, { ...init, credentials: "include" });
        if (response.status === 401) {
          const refreshed = await refreshToken();
          if (refreshed) {
            response = await fetch(input, { ...init, credentials: "include" });
          } else {
            setUser(null);
          }
        }
        return response;
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  },
  [refreshToken]
);
```

---

## 🟢 Prioridad 6 — Manejo inconsistente de errores

**Problema:** Cada archivo maneja errores distinto: unos verifican `res.ok`, otros `res.status`, otros `data.status` del body.

**Sin cambios en backend.**

### 🟡 Cambios en frontend

1. Agregar `handleApiResponse` en `src/lib/apiClient.ts` (ver Prioridad 2):
   ```typescript
   export async function handleApiResponse<T>(res: Response): Promise<T> {
     const data = await res.json();
     if (!res.ok) {
       throw { status: res.status, ...data };
     }
     return data as T;
   }
   ```

2. Migrar hooks a usar `handleApiResponse` para unificar el manejo de errores.

---

## 🟢 Prioridad 7 — `PosteoDetalle.tsx` usa `notFound()` agresivamente

**Problema:** Si hay error de red (no solo 404), redirige a la página 404. El usuario no sabe qué pasó realmente.

**Sin cambios en backend.**

### 🟡 Cambios en frontend

Separar el caso "posteo no existe" (404) de otros errores en `src/app/components/PosteoDetalle.tsx`:

```typescript
if (error) {
  if (res.status === 404) return notFound();
  return <p className="text-center mt-5 text-danger">{error}</p>;
}
```

---

## 🟢 Prioridad 8 — Límite de notificaciones divergente

**Problema:** Frontend forza `limit=15` pero el default documentado de la API es 20.

**Sin cambios en backend.**

### 🟡 Cambios en frontend

Eliminar el parámetro `limit=15` y dejar que la API use su default:

```typescript
// Actual:
`/api/notificaciones?page=${pagina}&limit=15`
// Nueva:
`/api/notificaciones?page=${pagina}`
```

**Archivo:** `src/app/hooks/useNotifications.tsx`

---

## Resumen de cambios requeridos en backend — ✅ Todos completados

| Prioridad | Endpoint | Campo a agregar | Estado |
|---|---|---|---|
| Alta | `GET /api/posteos/` | `likesCount: number`, `hasLiked: boolean` en cada posteo | ✅ |
| Alta | `GET /api/posteos/post/:id` | `likesCount: number`, `hasLiked: boolean` en el posteo | ✅ |
| Alta | `GET /api/posteos/usuario/:idUsuario` | `likesCount: number`, `hasLiked: boolean` en cada posteo | ✅ |
| Media | `GET /api/favoritos/` | Ninguno (se eligió Opción B — frontend usa `_id`) | ✅ N/A |
