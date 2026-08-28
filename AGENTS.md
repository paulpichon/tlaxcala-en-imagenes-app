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

## Error Handling

- **All API calls must go through `src/lib/apiClient.ts`** (`apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`). Raw `fetch` is only allowed inside `fetchWithAuth`.
- The backend returns RFC 9457 error objects with `code`, `detail`, `status`, etc. Use the helpers exported by `apiClient.ts`:
  - `isApiError(err)` / `getApiErrorCode(err)` / `getApiErrorMessage(err, fallback)`
  - `isNotFound(err)`, `isUnauthorized(err)`, `isForbidden(err)`, `isValidationFailed(err)`, `isRateLimit(err)`
- Never compare error message strings (e.g. `error === "La publicación no fue encontrada"`) to decide UI behavior like `notFound()`. Use boolean flags (`isNotFoundError`) or the error-type helpers from `apiClient.ts` instead.
- **Never use `data.status` from the response body to decide if a request failed.** The source of truth is `res.ok`, handled inside `handleApiResponse`.
- Data-fetching hooks and contexts should expose `{ error: string | null; clearError: () => void }` so UI components can display failures consistently.
- Anti-enumeration endpoints (e.g. password recovery) return a generic 200 message on purpose; do not add frontend checks that reveal whether an email/account exists.
