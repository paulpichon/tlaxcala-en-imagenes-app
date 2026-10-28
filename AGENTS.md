# Tlaxcala en Imágenes App — Agent Guide

## Commands (pnpm only)

- `pnpm dev` — dev server (Turbopack)
- `pnpm build` — production build
- `pnpm start` — serve production build
- No lint, typecheck, or test scripts exist. No linter/formatter configured.

## Architecture

- **Next.js 16 App Router**, React 19, TypeScript 6
- **Bootstrap 5.3** (imported globally in `src/app/layout.tsx:4`)
- **CSS Modules** for component-level styles under `src/app/ui/`
- **pnpm** single workspace (workspace yaml only allows `sharp` builds)
- **Path alias**: `@/*` → `./src/*` (tsconfig paths)

## State & Auth

- Six React Context providers nested in `layout.tsx`: Auth, Notificaciones, Follow, NuevosUsuarios, Publicidad (plus FavoritoContext used elsewhere)
- **Auth**: cookie-based JWT with automatic token refresh in `AuthContext.tsx`; `fetchWithAuth` wrapper included
  - El refresh se serializa **entre pestañas** con un Web Lock (`tlaxapp:auth-refresh`) además del mutex en memoria: `/api/auth/refresh` rota el token y dos pestañas concurrentes dispararían el falso positivo de reuso (el backend revoca todas las sesiones).
  - Solo un `401`/`403` del refresh cierra sesión. Un fallo de **red** (o `5xx`/`429`) conserva la sesión y expone `error`/`clearError` en el contexto.
  - `logout()` limpia además las claves de `sessionStorage` ligadas a la sesión (`registroToken`, `passForgetToken`, `passwordResetSuccess`, `reporteExitoso`).
  - Duplicados: usar `isDuplicateKey(err, field)` de `apiClient.ts` (`409` + `errors[].code === 'DUPLICATE_KEY'`); no basta con `code === 'CONFLICT'`.
- Forms use `react-hook-form` + `@hookform/resolvers` + Zod 4 schemas in `src/lib/validaciones.ts`

## Images (Cloudinary)

- El backend **nunca** envía `secure_url`; todo se renderiza desde `public_id`.
- `src/lib/cloudinary/getCloudinaryUrl.ts` construye las URLs de entrega a partir de `public_id` con transformaciones.
- **Loader de next/image** en `src/lib/cloudinary/cloudinaryLoader.ts`: cada `<Image>` usa `src={public_id}` + `loader={xxxLoader}` (bypass del optimizer de Next; Cloudinary sirve directo con `srcset` responsive y `q_auto,f_auto`).
  - Loaders listos: `avatarPerfilLoader` (cap 200), `avatarMiniLoader` (cap 120), `feedLoader` (cap 800), `detalleLoader` (cap 1080), `gridLoader` (cap 400), `imageModalLoader` (custom `c_limit`, cap 1400).
  - El loader hace passthrough de URLs completas (`http/https`), blobs (`blob:`) y data URIs.
- `src/lib/cloudinary/obtenerImagenPerfilUsuario.ts` devuelve **src** (el `public_id` o `NEXT_PUBLIC_IMAGEN_PERFIL_DEFAULT`), no una URL completa.
- Presets base en `getCloudinaryUrl.ts` usan `q_85` determinista; los auto-flags los inyecta el loader. `f_auto`/`q_auto` son **seguros** — el histórico "bug de imágenes rotas" era en realidad un merge de `options` que pisaba el `crop` con `undefined` (`g_face` sin `c_fill` → 400); corregido filtrando `undefined` antes del merge.
- OG/Twitter metadata usa `getCloudinaryUrl(public_id, "detalle")` directo (sin loader).
- `remotePatterns` para `res.cloudinary.com` en `next.config.ts` (solo para imágenes sin loader, ej. Publicidad).
- File validation: max **8 MB**, MIME `image/jpeg|png|webp`, extensiones `jpg|jpeg|png|webp` (constantes en `src/lib/validaciones.ts`).

## Env Variables

Copied from `.env.example`. Key vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_URL_LOCAL`, `NEXT_PUBLIC_CLOUDINARY_NAME`, `NEXT_PUBLIC_IMAGEN_PERFIL_DEFAULT`, `NEXT_PUBLIC_BASE_URL`.

## Key Conventions

- Full Spanish UI (`lang="es"`, locale `es_MX`)
- Viewport locks `userScalable: false` (mobile-first)
- Route groups: `(perfil)/[url]` for user profiles
- No test infrastructure at all
- Reports directory (`reports/`) is empty — used by OpenCode subagents
- Existing OpenCode subagents: `documentador` (writes to `reports/documentador/`), `technical-analysis` (writes to `reports/technical-analysis/`)

## Posteo visibility (`visibilidad`)

- The field `posteo_publico` is **DEPRECATED** and no longer used in the frontend (transition complete). The source of truth is `visibilidad: 'publico' | 'perfil'` (type `Visibilidad` in `src/types/types.ts`).
  - `'publico'`: appears in feed + profile; direct link accessible without session.
  - `'perfil'`: only in the author's profile; direct link requires session (backend returns `401` with code `AUTHENTICATION_ERROR` without token).
- Sending: create/edit posteos send `visibilidad` (FormData `append('visibilidad', …)` for POST, JSON field for PUT). Never send `posteo_publico`.
- Sharing: the share button is blocked for `visibilidad === 'perfil'` — `ModalOpcionesPublicacion` never generates a link and shows a small inline warning instead.
- The `401` `AUTHENTICATION_ERROR` on `GET /api/posteos/post/:id` is handled in `PosteoDetalle` as "requires login" (screen with `Ir a login` action), not as a fatal error. `isUnauthorized()` in `apiClient.ts` matches both `UNAUTHORIZED` and `AUTHENTICATION_ERROR`.

## Texto de posteos y comentarios

- El backend es la **única fuente de validación de caracteres**. El frontend no usa regex de allow-list para `texto`; solo aplica `maxLength` UTF-16 y, en comentarios, `trim` + obligatoriedad.
- Límites centralizados en `src/lib/validaciones.ts`:
  - Posteos: `MAX_TEXTO_POSTEO = 500`.
  - Comentarios: `MAX_TEXTO_COMENTARIO = 250`.
- Los contadores usan `String.length` (unidades UTF-16), igual que `maxLength` nativo y el backend.
- Se mantuvo `spamRegex` en `editarPosteoSchema` y `comentarioSchema` para bloquear URLs/frases de spam; no afecta caracteres permitidos.
- Emoji picker:
  - Componente propio ligero en `src/app/components/EmojiPicker.tsx` con lista curada y "recientes" en `localStorage`.
  - Botón visible en todos los dispositivos; la lista curada permite insertar emojis sin depender del teclado nativo.
  - Inserta el emoji en la posición del cursor respetando `maxLength`.
  - Superficies con picker: `CrearPosteoModal`, `EditarPosteoModal`, `ComentariosSection`, `ComentariosModal` e `ImageModal` (mobile + desktop inputs).
  - El hook `useIsMobile` ya no existe; la detección móvil que aún necesitan `useCrearPosteo` e `ImageModal` sigue siendo local.

## Reportes de publicación (Fase 1)

- **Endpoint:** `POST /api/reportes/:posteoId` con body JSON `{ categoria, descripcion }`.
- **Autenticación:** requerida (`fetchWithAuth`). El botón "Reportar publicación" solo aparece en posteos ajenos con sesión activa (`ModalOpcionesPublicacion`); nunca en vista pública ni en posteos propios.
- **Motivos:** 7 categorías predefinidas en `CATEGORIAS_REPORTE` (`src/lib/validaciones.ts`): slug + label + prioridad denormalizada (para la cola de moderación en Fase 2).
- **Validación:** `reporteSchema` (Zod) con `descripcion` obligatoria solo para la categoría `'otro'` (max 200 chars). No se aplica `spamRegex` — la descripción va a moderación y no se renderiza públicamente (puede citar URLs como evidencia).
- **Efecto inmediato:** el posteo se oculta del feed y del perfil del autor para el reportante (optimista local vía `removePost` en `useInfinitePosts` / `removerPosteoDelGrid` en el grid; el backend refuerza con `$nin`).
- **Ocultamiento permanente:** no se revierte aunque moderación descarte el reporte (Fase 2).
- **Link directo:** `GET /api/posteos/post/:id` sigue devolviendo el posteo (el autor nunca se entera). Un segundo reporte al mismo posteo devuelve `409 CONFLICT` — manejado con `getApiErrorCode` (sin comparar strings).
- **Rate limit:** `REPORTE_BLOCKED` (15 min / 10), cubierto automáticamente por `isRateLimit()` vía sufijo `_BLOCKED`.
- **Anonimato:** el frontend nunca expone `reporteroId`; `ReporteResponse` solo tipa `{ reporteId }`.
- **Toast post-navegación:** al reportar desde `/posteo/[id]` se persiste el flag `reporteExitoso` en `sessionStorage` (en `PosteoCard`) y se lee/limpia en `PerfilUsuarioContainer` (patrón establecido en `Formulario.tsx:33` de restablecer-password).
- **Mensaje de confirmación:** centralizado en `MENSAJE_REPORTE_EXITOSO` (`src/lib/validaciones.ts`).

## Moderación de posteos (Fase 2) — impacto en el frontend

La moderación se opera **exclusivamente desde el panel de administración** (`/api/v1/admin/moderacion`, identidad `Admin` con rol `MODERADOR`), un sistema aparte **fuera de este repo**. El sistema legado (`/api/moderacion`, colección `Moderador`, middleware `verificarModerador`) fue **eliminado**: la web app no tiene —ni debe tener— pantallas, guards ni llamadas de moderación. El frontend de usuarios solo adopta el impacto de visibilidad y notificaciones:

- **`Posteo.ocultoPorModeracion?: boolean`** (`types.ts`): posteo oculto **globalmente** por moderación. El backend solo lo expone al **propio autor** (feed/perfil ajeno/favoritos/likes/comentarios lo excluyen; link directo da `404` a no-autores).
- **Badge "En revisión"** para el autor en: grid del perfil (`PublicacionesUsuarioGrid` + clase `badge_en_revision`), `ImageModal` y `PosteoCard` en detalle (banner amarillo `#fff3cd`). El autor llega por link directo; visitantes ven la página `not-found` existente (mensaje neutro, no revela moderación).
- **Compartir bloqueado**: `ModalOpcionesPublicacion` usa `bloquearShare = esSoloPerfil || ocultoPorModeracion` — botón atenuado + warning inline dinámico. Los shares ya emitidos antes del ocultamiento quedan muertos por el backend (404 a no-autores).
- **Notificación de sistema sin emisor**: `Notificacion.tipo` incluye `'posteo_eliminado_moderacion'`; `NotificacionItem` la renderiza **sin nombre de emisor** (ícono `FiShield` TlaxApp), y `Notificaciones.tsx` no navega a un perfil si `urlUsuario` viene vacío. La notificación es 100% sistema (backend, sin identidad asociada) y **nunca** menciona reportes ni reporteros. **Contrato tolerante:** `emisor` puede llegar `undefined` y `referencia` puede llegar `null`/ausente (el cron de hard-delete borra el posteo referenciado pasado el plazo); el render usa solo `mensaje`/`createdAt`/`notificacion_leida` y no debe mostrar "undefined" si en el futuro se añade un preview.
- **Botón Reportar tras 409**: `ModalReportePublicacion` comunica `onFinish(false, true)` en conflicto; `ModalOpcionesPublicacion` deshabilita el botón con "Ya reportaste esta publicación" (el backend no expone `isReportado` en los GETs; estado local por sesión de UI).

> **404 "esperable" del fetch de metadata (no es bug):** al abrir el detalle de un posteo oculto por moderación, `generateMetadata` en `src/app/posteo/[idposteo]/page.tsx` hace un `fetch` **anónimo** (sin cookies, necesario para el ISR `revalidate: 60` compartido por todos los visitantes). Para un posteo oculto, el backend responde `404 NotFoundError` (no-autor) y **lo registra en consola** — esto es correcto: la petición de metadata equivale a un visitante y no debe revelar existencia (spec §5). El fetch del contenido en `PosteoDetalle` sí va con sesión (`fetchWithAuth`), por lo que el **autor** ve el posteo y el banner sin problema. `generateMetadata` ya maneja `!res.ok` devolviendo metadata neutra sin index. Ocurre a lo sumo 1 vez por minuto por posteo (cache ISR). El ruido en consola del backend puede atenuarse allá (bajar nivel de log de `NotFoundError` en `GET /api/posteos/post/:id` para requests sin sesión).

## Error Handling

- **All API calls must go through `src/lib/apiClient.ts`** (`apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`). Raw `fetch` is only allowed inside `fetchWithAuth`.
- The backend returns RFC 9457 error objects with `code`, `detail`, `status`, etc. Use the helpers exported by `apiClient.ts`:
  - `isApiError(err)` / `getApiErrorCode(err)` / `getApiErrorMessage(err, fallback)`
  - `isNotFound(err)`, `isUnauthorized(err)`, `isForbidden(err)`, `isValidationFailed(err)`, `isRateLimit(err)`
- Never compare error message strings (e.g. `error === "La publicación no fue encontrada"`) to decide UI behavior like `notFound()`. Use boolean flags (`isNotFoundError`) or the error-type helpers from `apiClient.ts` instead.
- **Never use `data.status` from the response body to decide if a request failed.** The source of truth is `res.ok`, handled inside `handleApiResponse`.
- Data-fetching hooks and contexts should expose `{ error: string | null; clearError: () => void }` so UI components can display failures consistently.
- Anti-enumeration endpoints (e.g. password recovery) return a generic 200 message on purpose; do not add frontend checks that reveal whether an email/account exists.
