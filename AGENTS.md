# Tlaxcala en Imágenes App — AGENTS.md

## Stack
- **Framework:** Next.js 16 (App Router), React 19
- **Package manager:** pnpm (`pnpm-lock.yaml`)
- **UI:** Bootstrap 5.3, CSS Modules, Framer Motion
- **Forms:** react-hook-form + Zod 4
- **Images:** Cloudinary (presets: `feed`/`detalle`/`perfil`/`grid`/`mini`)
- **Auth:** Cookie-based JWT with automatic refresh (`fetchWithAuth` in AuthContext)
- **Push notifications:** `public/sw.js` (Service Worker)

## Commands
```bash
pnpm dev        # Next.js dev server (Turbopack)
pnpm build      # Production build
pnpm start      # Start production server
```
No lint, typecheck, or test scripts exist (no test deps in package.json).

## Environment
- **`.env` is tracked** (gitignore has `.env*` but `.env` is already committed).
- All client vars use `NEXT_PUBLIC_*` prefix.
- Backend URL: `NEXT_PUBLIC_API_URL_LOCAL=http://localhost:5000` (dev), `NEXT_PUBLIC_API_URL=https://plankton-app-f5l4n.ondigitalocean.app` (prod).

## Architecture
```
src/
  app/              # Next.js App Router pages
    (perfil)/[url]/ # User profile (Route Group)
    cuentas/        # Auth flows (login, register, password reset)
    inicio/         # Main feed (requires auth)
    configuracion/  # Settings (editar-perfil, notificaciones, etc.)
    posteo/[id]/    # Post detail
    legal/          # Privacy, terms, FAQ
    layout.tsx      # Root: wraps providers (see below)
    page.tsx        # Landing page (unauthenticated)
  components/       # Shared components (ProtectedRoute, AlreadyAuthRedirect)
  context/          # React Context providers
  lib/              # actions.ts (API calls), validaciones.ts (Zod schemas),
                    # cloudinary/getCloudinaryUrl.ts
  types/types.ts    # All TypeScript interfaces
```

## Providers (wrapped in root layout, order matters)
`AuthProvider` → `NotificacionesProvider` → `FollowProvider` → `NuevosUsuariosProvider` → `PublicidadProvider`

## Auth Pattern
- Cookie-based JWT with `/api/auth/refresh` endpoint.
- `useAuth()` provides `fetchWithAuth(url, init)` which auto-retries on 401.
- `credentials: 'include'` on every fetch.
- Actions in `src/lib/actions.ts` still hardcode `NEXT_PUBLIC_API_URL_LOCAL` (not switching to prod URL).

## Validation
- Post text: max 200 chars, regex `^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,!?¡¿()\s-]*$`.
- Image upload: max 5MB, types: jpeg/jpg/png/webp.
- Spam regex blocks `http`, `www`, `free money`, `click here`, `suscríbete`, `followers`, `porno`, `xxx`.

## Cloudinary
- `getCloudinaryUrl(publicId, preset, options?)` builds secure URLs.
- `preset="custom"` forwards raw options; otherwise picks from predefined presets.
- Deliberately avoids `f_auto`, `q_auto`, `g_auto` (avoids broken image bug).
- Cloud name from `NEXT_PUBLIC_CLOUDINARY_NAME`.
- Allowed remote pattern in `next.config.ts`: `res.cloudinary.com/dy9prn3ue/**`.

## SEO
- `robots.ts` disallows: `/api/`, `/posteo/`, `/configuracion/`, `/notificaciones/`.
- `sitemap.ts` covers: home, login, register, legal, contact.
- Root metadata: title template `"%s | TlaxApp"`, lang `es`, locale `es_MX`.

## Key GOTCHAS
1. **No lint/typecheck scripts** — must run `tsc --noEmit` explicitly if needed.
2. **API URL not environment-aware** in `actions.ts` — always uses `NEXT_PUBLIC_API_URL_LOCAL`.
3. **`.env` is version-controlled** despite `.env*` in gitignore (pre-existing).
4. **Viewport blocks user scaling** (`userScalable: false`).
5. **Posteo text cannot be empty unless an image is attached** (`posteoSchema.refine`).
6. **CSS Modules live alongside global CSS** — Module files in `src/app/ui/` mirrors route structure.
