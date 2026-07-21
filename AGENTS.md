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

- Helper `src/lib/cloudinary/getCloudinaryUrl.ts` builds URLs manually — **not** using Next.js image loader
- Presets: `feed` (600×600 fill), `detalle` (1080×1080 pad), `perfil` (300×300 thumb), `grid` (300×300 fill), `mini` (60×60 fill)
- All presets intentionally omit `f_auto` to avoid broken-image bugs
- `remotePatterns` configured for `res.cloudinary.com` in `next.config.ts`
- File validation: max 5 MB, allowed types jpeg/jpg/png/webp

## Env Variables

Copied from `.env.example`. Key vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_URL_LOCAL`, `NEXT_PUBLIC_CLOUDINARY_NAME`, `NEXT_PUBLIC_IMAGEN_PERFIL_DEFAULT`, `NEXT_PUBLIC_BASE_URL`.

## Key Conventions

- Full Spanish UI (`lang="es"`, locale `es_MX`)
- Viewport locks `userScalable: false` (mobile-first)
- Route groups: `(perfil)/[url]` for user profiles
- No test infrastructure at all
- Reports directory (`reports/`) is empty — used by OpenCode subagents
- Existing OpenCode subagents: `documentador` (writes to `reports/documentador/`), `technical-analysis` (writes to `reports/technical-analysis/`)

## Error Handling

- **All API calls must go through `src/lib/apiClient.ts`** (`apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`). Raw `fetch` is only allowed inside `fetchWithAuth`.
- The backend returns RFC 9457 error objects with `code`, `detail`, `status`, etc. Use the helpers exported by `apiClient.ts`:
  - `isApiError(err)` / `getApiErrorCode(err)` / `getApiErrorMessage(err, fallback)`
  - `isNotFound(err)`, `isUnauthorized(err)`, `isForbidden(err)`, `isValidationFailed(err)`, `isRateLimit(err)`
- Never compare error message strings (e.g. `error === "La publicación no fue encontrada"`) to decide UI behavior like `notFound()`. Use boolean flags (`isNotFoundError`) or the error-type helpers from `apiClient.ts` instead.
- **Never use `data.status` from the response body to decide if a request failed.** The source of truth is `res.ok`, handled inside `handleApiResponse`.
- Data-fetching hooks and contexts should expose `{ error: string | null; clearError: () => void }` so UI components can display failures consistently.
- Anti-enumeration endpoints (e.g. password recovery) return a generic 200 message on purpose; do not add frontend checks that reveal whether an email/account exists.
