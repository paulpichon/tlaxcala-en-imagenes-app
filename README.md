# Tlaxcala en Imágenes App (TlaxApp)

Red social enfocada en Tlaxcala, México. Comparte fotos, sigue perfiles, da likes y comentarios.

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 6
- **UI:** Bootstrap 5.3, CSS Modules, Framer Motion
- **Formularios:** react-hook-form + Zod 4
- **Imágenes:** Cloudinary (presets: feed/detalle/perfil/grid/mini)
- **Auth:** Cookie-based JWT con refresh automático
- **Notificaciones Push:** Service Worker (Web Push API)
- **Paquetería:** pnpm

## Comandos

```bash
pnpm dev      # Desarrollo (Turbopack)
pnpm build    # Build producción
pnpm start    # Iniciar servidor producción
```

## Variables de Entorno

Ver `.env` para valores actuales. Variables principales:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend producción |
| `NEXT_PUBLIC_API_URL_LOCAL` | Backend local |
| `NEXT_PUBLIC_CLOUDINARY_NAME` | Cloudinary cloud name |
| `NEXT_PUBLIC_IMAGEN_PERFIL_DEFAULT` | Avatar por defecto |
| `NEXT_PUBLIC_BASE_URL` | URL del frontend |

## Documentación

- `DOCUMENTACION.md` — Documentación completa del frontend
- `API.md` — Endpoints del backend
- `DOCUMENTACION-BACKEND.md` — Documentación del backend
- `AGENTS.md` — Contexto para asistentes IA

## Rutas Principales

| Ruta | Descripción | Auth |
|---|---|---|
| `/` | Landing page | Pública |
| `/inicio` | Feed principal | Requiere login |
| `/cuentas/login` | Inicio de sesión | Solo no auth |
| `/cuentas/crear-cuenta` | Registro | Solo no auth |
| `/[url]` | Perfil de usuario | Requiere login |
| `/posteo/[id]` | Detalle de publicación | Requiere login |
| `/configuracion` | Ajustes | Requiere login |
| `/notificaciones` | Centro notificaciones | Requiere login |
| `/favoritos` | Publicaciones favoritas | Requiere login |
| `/contacto` | Contacto | Pública |
| `/legal/*` | Términos, privacidad, FAQ | Pública |
