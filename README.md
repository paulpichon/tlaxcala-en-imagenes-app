# Tlaxcala en Imágenes App (TlaxApp) — Coming Soon

Página pública de acceso anticipado para TlaxApp: la red social de Tlaxcala.
Durante esta etapa, los visitantes pueden conocer qué es TlaxApp y registrarse
en la lista de espera para obtener una invitación.

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **UI:** Bootstrap 5.3, CSS Modules
- **Formularios:** react-hook-form + Zod
- **Paquetería:** pnpm

## Comandos

```bash
pnpm dev      # Desarrollo
pnpm build    # Build de producción
pnpm start    # Servir build
```

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend (ej. `https://api.tlaxapp.com`) |
| `NEXT_PUBLIC_BASE_URL` | URL pública del frontend (ej. `https://www.tlaxapp.com`) |

## Rutas principales

| Ruta | Descripción | Indexable |
|---|---|---|
| `/` | Landing con registro a acceso anticipado | Sí |
| `/que-es-tlaxapp` | Información sobre TlaxApp | Sí |
| `/contacto` | Contacto y soporte | Sí |
| `/legal/politica-de-privacidad` | Política de privacidad | Sí |
| `/legal/terminos-y-condiciones` | Términos y condiciones | Sí |
| `/legal/preguntas-frecuentes` | Preguntas frecuentes | Sí |

## Documentación

- `QUE-ES-TLAXAPP.md` — Copia oficial y fuente de verdad de la página "¿Qué es TlaxApp?"
- `SPEC-early-access.md` — Especificación del endpoint de registro a la lista de acceso anticipado

## Despliegue

Optimizado para Vercel con `pnpm`.
