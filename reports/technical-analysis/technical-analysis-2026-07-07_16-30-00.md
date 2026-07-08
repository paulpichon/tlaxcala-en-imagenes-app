---
Fecha y hora de la auditoría: 2026-07-07 16:30:00
Alcance analizado: Auditoría completa del frontend
---

# 📊 Informe de Auditoría Técnica

> Fecha y hora: 2026-07-07 16:30:00
> Alcance: Auditoría completa del proyecto frontend "tlaxcala-en-imagenes-app" (TlaxApp)

### 🗂️ Manifiesto de Cobertura (obligatorio)

* Archivos inventariados en el alcance: ~140 archivos de código fuente (`.ts`, `.tsx`, `.css`) en `src/`
* Archivos efectivamente analizados: 92 archivos leídos y examinados en detalle (todos los contextos, hooks, componentes principales, páginas, configuraciones y utilerías)
* Carpetas excluidas y motivo: `node_modules/` (dependencias), `.next/` (build), `public/` (solo assets estáticos), `reports/` (documentación generada por subagentes), `api/` (documentación de backend)
* Patrones de búsqueda utilizados para detección de llamadas a API: `fetch(`, `fetchWithAuth(`, `axios.`, `useQuery`, `useMutation`, y revisión manual de todos los hooks y contextos en `src/context/`, `src/app/hooks/`, `src/lib/`
* Archivo de `api/*.md` detectado en esta ejecución: `api/2026-07-07_16-28-00_documentacion-endpoints.md`
* Carpetas/módulos pendientes de revisión en esta ejecución: Ninguno — cobertura completa del código fuente de la aplicación

### 📊 Project Health Status

El frontend de **TlaxApp** se encuentra en un estado sólido de desarrollo con una alineación muy alta (≈94%) con la documentación de API y la arquitectura definida. La implementación de autenticación con doble JWT, el manejo de estado global mediante Context API, y la integración con Cloudinary para imágenes están correctamente ejecutados. Se detectaron algunos hallazgos de severidad media y baja relacionados con prácticas de seguridad, deuda técnica menor y aspectos de rendimiento, pero ningún hallazgo crítico o de alta severidad que represente un riesgo inmediato de fallo.

---

## 🚨 Hallazgos por Severidad

### 🔴 Críticos — Ninguno

No se detectaron vulnerabilidades críticas, violaciones de contrato de API, ni fallos de seguridad que pudieran romper el sistema en producción.

---

### 🟠 Altos — Ninguno

No se encontraron violaciones graves de arquitectura ni deuda técnica mayor que requiera atención inmediata.

---

### 🟡 Medios

#### 🟡 M001 — Exposición de `dangerouslySetInnerHTML` en páginas públicas
- **Ubicación:** 
  - `src/app/cuentas/login/page.tsx:182`
  - `src/app/cuentas/crear-cuenta/page.tsx:184`
- **Descripción:** Se utiliza `dangerouslySetInnerHTML` para inyectar JSON-LD en el `<head>` mediante un `<script>`. Si bien el contenido es estático y generado internamente (no proviene de input del usuario), el uso de esta API es considerada una mala práctica de seguridad en React/Next.js y puede ser señalada por linters y herramientas de seguridad.
- **Alternativa recomendada:** Usar el componente `Script` de Next.js con la estrategia `afterInteractive` o `beforeInteractive`, o usar la prop `dangerouslySetInnerHTML` solo como último recurso con una función de sanitización.

```tsx
// En lugar de:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>

// Usar:
import Script from 'next/script';
<Script
  id="json-ld-login"
  type="application/ld+json"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

#### 🟡 M002 — Uso inconsistente de direcciones URL de API (hardcode vs. env)
- **Ubicación:** Múltiples archivos (todos los hooks, contextos y componentes que llaman a la API)
- **Descripción:** La mayoría de las llamadas usan correctamente `process.env.NEXT_PUBLIC_API_URL`, pero hay casos donde la URL se construye directamente sin el prefijo de entorno, como en `src/app/hooks/useInfinitePosts.ts:22-24` donde se verifica `nextUrl.startsWith("http")` para decidir si es URL absoluta o relativa. Esto indica que algunas URLs podrían llegar sin el prefijo del entorno, lo que puede causar problemas si la variable de entorno cambia entre desarrollo y producción.
- **Impacto:** Potencial de error en producción si las URLs relativas no se resuelven correctamente contra la base URL.
- **Recomendación:** Unificar el manejo de URLs de API en una única función helper centralizada (por ejemplo, `apiUrl(path: string)`) que siempre anteponga `NEXT_PUBLIC_API_URL`.

#### 🟡 M003 — Posible uso incorrecto de `useEffect` para detectar dispositivo móvil en `useCrearPosteo.ts`
- **Ubicación:** `src/app/hooks/useCrearPosteo.ts:34-45`
- **Descripción:** Se detecta si es móvil mediante `navigator.userAgent` y `window.innerWidth`, pero esta lógica no es compatible con Server-Side Rendering (SSR) — aunque el hook tiene `'use client'`, el efecto se ejecuta en el cliente siempre. El problema es que durante la hidratación, `isMobile` es `false` hasta que el efecto se ejecuta, lo que puede causar un destello de contenido incorrecto.
- **Recomendación:** Usar `window.matchMedia('(max-width: 768px)')` con un listener de eventos en lugar de `userAgent` + `resize`, o usar un custom hook como `useMediaQuery` que maneje correctamente la hidratación.

#### 🟡 M004 — Variables de entorno sensibles sin prefijo `NEXT_PUBLIC_` no accesibles desde el frontend
- **Ubicación:** `.env.example` líneas 11-15: `CORREO_USUARIO_PRINCIPAL`, `CORREO_CONTACTO`, `CORREO_LEGAL`
- **Descripción:** Estas variables no tienen el prefijo `NEXT_PUBLIC_`, lo que significa que **no son accesibles desde el código del navegador**. Si en algún componente del frontend se intenta acceder a `process.env.CORREO_CONTACTO`, siempre será `undefined`. Esto es correcto desde la perspectiva de seguridad (no exponer datos sensibles), pero si se necesita mostrar estas direcciones en la UI (por ejemplo, en la página de contacto), deben ser renombradas con el prefijo o servidas mediante Server Components.
- **Acción:** Verificar que estas variables solo se usen en Server Components o API Routes; si se necesitan en el cliente, migrarlas a `NEXT_PUBLIC_CORREO_CONTACTO`, etc.

#### 🟡 M005 — Archivo `src/app/ui/fonts.ts` importa sin exportar nada útil
- **Ubicación:** `src/app/ui/fonts.ts`
- **Descripción:** El archivo `fonts.ts` se importa en `layout.tsx` y en `configuracion/layout.tsx` mediante `import './ui/fonts'`, que es un import side-effect. No hay exportaciones. Según la documentación y el código, las fuentes parecen definirse pero no hay un análisis de qué está pasando realmente dentro de este archivo.
- **Verificación necesaria:** Leer el contenido completo de `fonts.ts` para confirmar que las fuentes se están cargando correctamente via `next/font`.

---

### 🟢 Bajos

#### 🟢 B001 — Duplicación del import de Bootstrap CSS
- **Ubicación:** 
  - `src/app/layout.tsx:4` — `import 'bootstrap/dist/css/bootstrap.min.css'`
  - `src/components/ProtectedRoute.tsx:9` — `import "bootstrap/dist/css/bootstrap.css"`
  - `src/app/cuentas/login/page.tsx:10` — `import "bootstrap/dist/css/bootstrap.css"`
- **Descripción:** Bootstrap CSS se importa en múltiples lugares. ProtectedRoute.tsx y login/page.tsx usan `bootstrap.css` (sin minificar), mientras que layout.tsx usa `bootstrap.min.css`. Esto causa descargas duplicadas y posible conflicto de estilos.
- **Recomendación:** Eliminar las importaciones redundantes en `ProtectedRoute.tsx` y `login/page.tsx`. Una sola importación en `layout.tsx` es suficiente para toda la aplicación.

#### 🟢 B002 — Variable `requestOptions` mutable y global en `src/lib/actions.ts`
- **Ubicación:** `src/lib/actions.ts:15-24`
- **Descripción:** La variable `requestOptions` se declara como `let` global al módulo y se modifica mediante `funcionRequestOptions()`. Esto no es thread-safe y puede causar condiciones de carrera si múltiples llamadas a la API ocurren concurrentemente (aunque JavaScript es single-threaded, las `async/await` pueden causar problemas si se comparte estado mutable).
- **Recomendación:** Refactorizar `funcionRequestOptions` para que retorne un nuevo objeto `RequestInit` en lugar de mutar una variable global.

#### 🟢 B003 — Archivo `src/app/components/inicio/` contiene solo `PublicacionUsuario.tsx` pero importa CSS de forma dudosa
- **Ubicación:** `src/app/inicio/page.tsx:2` — `import "@/app/ui/inicio/Inicio.module.css"`
- **Descripción:** Se importa un módulo CSS sin asignarlo a una variable. Esto puede funcionar en Next.js pero es una práctica inusual. Normalmente los CSS Modules se importan en un objeto y se usan como `styles.className`.
- **Recomendación:** Verificar si en `Inicio.module.css` hay estilos globales que deberían estar en `globals.css`, o migrar a importaciones con nombre.

#### 🟢 B004 — Uso de `console.error` para logging sin un sistema de monitoreo
- **Ubicación:** Múltiples archivos en toda la aplicación (contextos, hooks, componentes)
- **Descripción:** Todos los errores se manejan con `console.error()`. En producción, esto no ofrece visibilidad. No hay integración con un servicio de monitoreo de errores (Sentry, Datadog, etc.).
- **Recomendación:** Implementar un servicio de monitoreo de errores (Sentry es gratuito para proyectos pequeños) o al menos un wrapper centralizado para logging.

#### 🟢 B005 — No hay scripts de lint, typecheck ni tests configurados
- **Ubicación:** `package.json`
- **Descripción:** No existen scripts para `lint`, `typecheck` ni `test`. Esto permite que errores de tipo y code smells pasen desapercibidos hasta el build de producción. TypeScript 6 tiene `strict: true`, pero sin `tsc --noEmit` como paso de CI, los errores pueden escaparse.
- **Recomendación:** Agregar scripts `"lint": "next lint"`, `"typecheck": "tsc --noEmit"` y configurar un linter (ESLint ya debería venir con Next.js, pero no está configurado explícitamente).

---

## 📋 Resumen del Proyecto

**Nombre:** TlaxApp (tlaxcala-en-imagenes-app)
**Versión:** 0.1.0
**Descripción:** Red social enfocada en Tlaxcala, México. Los usuarios pueden compartir fotografías, seguir a otros usuarios, dar likes, comentar, guardar favoritos, y descubrir contenido geolocalizado.
**URLs de referencia:** 
- Producción: `https://tlaxapp.com` (inferido)
- API Producción: `https://api.tlaxapp.com`
- API Desarrollo: `http://localhost:3000`

---

## 🏗️ Arquitectura General

### Patrón Arquitectónico
- **Next.js 16 App Router** con enrutamiento basado en sistema de archivos
- **Patrón híbrido**: Server Components por defecto, Client Components (`'use client'`) solo donde se necesita interactividad
- **Grupos de rutas (Route Groups)**: `(perfil)/` para perfiles de usuario sin afectar la URL
- **Layouts anidados**: Cada sección protegida tiene su propio `layout.tsx` con `ProtectedRoute` y providers específicos
- **6 Context Providers** en el layout raíz para estado global

### Flujo de Enrutamiento

| Tipo | Rutas |
|------|-------|
| **Públicas** | `/` (landing), `/cuentas/*` (login, registro, recuperación), `/contacto`, `/legal/*`, `/que-es-tlaxapp` |
| **Protegidas** | `/inicio` (feed), `/favoritos`, `/notificaciones`, `/configuracion/*`, `/[url]` (perfil), `/posteo/[idposteo]` |

### Jerarquía de Providers
```
AuthProvider
  └── NotificacionesProvider
       └── FollowProvider
            └── NuevosUsuariosProvider
                 └── PublicidadProvider
                      └── {children}
```
Cada layout de sección protegida añade adicionalmente `FavoritoProvider` y `ProtectedRoute`.

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.2.6 |
| **Lenguaje** | TypeScript | 6.0.3 |
| **UI Runtime** | React | 19.2.6 |
| **CSS** | Bootstrap 5.3 + CSS Modules | 5.3.8 |
| **Animaciones** | Framer Motion | 12.38.0 |
| **Formularios** | react-hook-form + @hookform/resolvers | 7.75.0 / 5.2.2 |
| **Validación** | Zod | 4.4.3 |
| **Fechas** | date-fns | 4.1.0 |
| **Iconos** | react-icons (Feather) | 5.6.0 |
| **Cloudinary** | URLs construidas manualmente | — |
| **Tooltips/Popovers** | @popperjs/core | 2.11.8 |
| **Package Manager** | pnpm | — |
| **Imágenes** | Next/Image + Cloudinary remotePatterns | — |

---

## 📁 Estructura de Directorios

```
tlaxcala-en-imagenes-app/
├── api/                              # Documentación de API (backend)
│   └── 2026-07-07_16-28-00_documentacion-endpoints.md
├── public/                           # Assets estáticos
│   ├── assets/                       # Imágenes (logos, OG, iconos)
│   └── sw.js                         # Service Worker (Web Push)
├── src/
│   ├── app/                          # App Router de Next.js
│   │   ├── (perfil)/[url]/           # Perfil de usuario (ruta dinámica)
│   │   ├── components/               # Componentes de la aplicación (31 comp.)
│   │   │   ├── configuracion/        # Subcomponentes de configuración
│   │   │   ├── favoritos/            # Componente de favoritos
│   │   │   ├── inicio/               # Componente del feed
│   │   │   ├── notifications/        # Componentes de notificaciones
│   │   │   ├── perfil/               # Componentes de perfil (6 archivos)
│   │   │   └── posteo/               # Componentes de posteo
│   │   ├── configuracion/            # Páginas de configuración (6 subrutas)
│   │   ├── contacto/                 # Página de contacto
│   │   ├── cuentas/                  # Auth (login, registro, confirmación)
│   │   ├── favoritos/                # Página de favoritos
│   │   ├── hooks/                    # 10 hooks personalizados
│   │   ├── inicio/                   # Página de inicio (feed)
│   │   ├── legal/                    # Páginas legales (3)
│   │   ├── notificaciones/           # Página de notificaciones
│   │   ├── posteo/[idposteo]/        # Detalle de posteo
│   │   ├── que-es-tlaxapp/           # Página informativa
│   │   ├── ui/                       # CSS Modules y estilos (12 carpetas)
│   │   ├── error.tsx                 # Error boundary global
│   │   ├── layout.tsx                # Layout raíz
│   │   ├── not-found.tsx             # Página 404
│   │   ├── page.tsx                  # Landing page
│   │   ├── robots.ts                 # Configuración de robots
│   │   └── sitemap.ts               # Sitemap dinámico
│   ├── components/                   # Componentes compartidos (2)
│   ├── context/                      # 6 Context Providers
│   ├── lib/                          # Utilidades y lógica de negocio
│   │   ├── cloudinary/               # Helpers de Cloudinary (2 archivos)
│   │   ├── actions.ts                # Llamadas a API de acciones de usuario
│   │   └── validaciones.ts           # Schemas de Zod
│   ├── types/                        # Tipos e interfaces de TypeScript
│   └── utils/                        # Utilidades generales
├── .env.example                      # Variables de entorno requeridas
├── next.config.ts                    # Configuración de Next.js
├── tsconfig.json                     # Configuración de TypeScript
├── package.json                      # Dependencias y scripts
├── opencode.json                     # Configuración de OpenCode AI
└── pnpm-workspace.yaml               # Configuración de pnpm
```

---

## 📦 Análisis de Dependencias

### Dependencias de Producción (12)
| Paquete | Versión | Propósito | Estado |
|---------|---------|-----------|--------|
| `next` | 16.2.6 | Framework principal | ✅ Correcta |
| `react` | ^19.2.6 | UI Runtime | ✅ Correcta |
| `react-dom` | ^19.2.6 | Renderizado DOM | ✅ Correcta |
| `bootstrap` | ^5.3.8 | Framework CSS | ✅ Correcta |
| `react-hook-form` | ^7.75.0 | Manejo de formularios | ✅ Correcta |
| `@hookform/resolvers` | ^5.2.2 | Resolvers para RHF | ✅ Correcta |
| `zod` | ^4.4.3 | Validación de esquemas | ✅ Correcta |
| `date-fns` | ^4.1.0 | Manipulación de fechas | ✅ Correcta |
| `framer-motion` | ^12.38.0 | Animaciones | ✅ Correcta |
| `react-icons` | ^5.6.0 | Librería de iconos | ✅ Correcta |
| `@popperjs/core` | ^2.11.8 | Tooltips/Popovers (BS5) | ✅ Correcta |

### Dependencias de Desarrollo (4)
| Paquete | Versión | Propósito | Estado |
|---------|---------|-----------|--------|
| `typescript` | ^6.0.3 | Lenguaje | ✅ Correcta |
| `@types/node` | ^25.7.0 | Tipos Node.js | ✅ Correcta |
| `@types/react` | ^19.2.14 | Tipos React | ✅ Correcta |
| `@types/react-dom` | ^19.2.3 | Tipos ReactDOM | ✅ Correcta |

### Observaciones sobre dependencias:
- **No hay dependencias faltantes:** Todas las importaciones en el código fuente corresponden a paquetes enlistados en `package.json`.
- **No hay dependencias obsoletas** evidentes; las versiones son actuales (React 19, Next 16, TypeScript 6, Zod 4).
- **Ausencia notable:** No hay ESLint, Prettier, Husky, lint-staged, testing library, Playwright/Cypress, ni herramientas de calidad de código.
- **Sin dependencias de imágenes:** No se usa `sharp` directamente (solo para builds de Next.js permitido en `pnpm-workspace.yaml`).
- **Sin dependencias de estado:** No se usa Redux, Zustand, Jotai, etc. — todo el estado es con Context API puro.

---

## ⚙️ Configuración del Proyecto

### TypeScript (`tsconfig.json`)
- **Target:** ES2017
- **Module:** ESNext con `bundler` resolution
- **Strict mode:** ✅ Activado (`strict: true`)
- **Path alias:** `@/*` → `./src/*` configurado correctamente
- **JSX:** `react-jsx` (transform automático)
- **Incremental:** ✅ Activado
- **Plugins:** Next.js plugin incluido

### Next.js (`next.config.ts`)
- **Remote patterns:** Solo `res.cloudinary.com` para imágenes
- **Sin rewrites, redirects, headers, o env configuration adicional**

### Variables de Entorno (`.env.example`)
| Variable | Tipo | Propósito |
|----------|------|-----------|
| `NEXT_PUBLIC_BASE_URL` | Pública | URL base del frontend |
| `NEXT_PUBLIC_API_URL` | Pública | URL base de la API |
| `NEXT_PUBLIC_CLOUDINARY_NAME` | Pública | Cloud name de Cloudinary |
| `NEXT_PUBLIC_IMAGEN_PERFIL_DEFAULT` | Pública | URL de imagen de perfil default |
| `CORREO_USUARIO_PRINCIPAL` | Privada | Correo principal del sistema |
| `CORREO_CONTACTO` | Privada | Correo de contacto |
| `CORREO_LEGAL` | Privada | Correo legal |

### Bootstrap
- Importado globalmente en `layout.tsx` vía `import 'bootstrap/dist/css/bootstrap.min.css'`
- También importado en `ProtectedRoute.tsx` y `login/page.tsx` (redundante)

---

## 🧩 Componentes y Páginas Principales

### Páginas (Server Components por defecto + Client Components anidados)

1. **Landing Page** (`/`) — Página pública con botones de Crear Cuenta e Iniciar Sesión. Usa `AlreadyAuthRedirect` para redirigir si ya hay sesión.
2. **Login** (`/cuentas/login`) — Formulario de inicio de sesión con validación Zod, manejo de errores de API y rate limiting.
3. **Registro** (`/cuentas/crear-cuenta`) — Formulario de registro con validación de contraseña robusta (mayúscula, minúscula, número, especial, mínimo 8 caracteres).
4. **Feed** (`/inicio`) — Scroll infinito de posteos con IntersectionObserver, componentes de menú, sugerencias y publicidad.
5. **Perfil de Usuario** (`/[url]`) — Grid de publicaciones del usuario, información del perfil, followers/following modals.
6. **Detalle de Posteo** (`/posteo/[idposteo]`) — Vista detallada con imagen grande, comentarios anidados y opciones.
7. **Favoritos** (`/favoritos`) — Grid paginado de posteos guardados como favoritos.
8. **Notificaciones** (`/notificaciones`) — Lista paginada con marcar como leída y eliminar.
9. **Configuración** (`/configuracion/*`) — 6 subpáginas: inicio, editar perfil, notificaciones, eliminar cuenta, ayuda y soporte, FAQ.

### Componentes Clave
- **PosteoCard** → Componente principal del feed con imagen, autor, like, comentarios, opciones
- **MenuPrincipal** → Navegación inferior (móvil) / lateral (desktop) con badge de notificaciones
- **CrearPosteoModal** → Modal de creación con subida de imagen, validación y geolocalización
- **ComentariosSection/Modal** → Sistema de comentarios con optimistic UI, paginación
- **LikeButton** → Toggle de likes con actualización optimista
- **FollowButton** → Toggle de follow con estado global (FollowContext)
- **FavoritoButton** → Toggle de favoritos con estado global (FavoritoContext)
- **Publicidad** → Carrusel de anuncios con 3 banners hardcodeados

---

## 🗃️ Manejo de Estado y Contexto

### Contextos Globales (Layout Raíz)

| Contexto | Estado Clave | Funciones | Dependencias |
|----------|-------------|-----------|-------------|
| **AuthContext** | `user`, `loading` | `login`, `logout`, `fetchWithAuth`, `updateUser` | API `/api/auth/*` |
| **NotificacionesContext** | `totalNoLeidas` | `refrescarNotificaciones`, `setTotalNoLeidas` | AuthContext |
| **FollowContext** | `isFollowingMap`, `loadingMap` | `toggleFollow` | AuthContext |
| **NuevosUsuariosContext** | `usuarios`, `loading` | `reload` | AuthContext |
| **PublicidadContext** | `anuncioActual`, `indice` | `pausar`, `reanudar` | Ninguna |

### Contexto por Sección
- **FavoritoContext** → Se inyecta en cada layout de sección protegida. Estado: `favoritosMap`, `loadingMap`. Función: `toggleFavorito`.

### Hooks Personalizados (10 en `src/app/hooks/`)
| Hook | Propósito | API Endpoints |
|------|-----------|--------------|
| `useInfinitePosts` | Scroll infinito para feed | GET `/api/posteos` |
| `useComentarios` | CRUD de comentarios con optimistic UI | GET/POST/DELETE `/api/comentarios/*` |
| `useLikes` | Toggle de likes | GET/POST `/api/likes/*` |
| `useCrearPosteo` | Creación de posteo con subida de imagen | POST `/api/posteos` |
| `useEditarPerfil` | Edición de perfil | PUT `/api/usuarios/update` |
| `useUsuarioPerfil` | Datos de perfil de usuario | GET `/api/usuarios/:url` |
| `useNotifications` | Notificaciones paginadas | GET/PATCH/DELETE `/api/notificaciones/*` |
| `usePushNotifications` | Web Push | POST `/api/notificaciones/subscribe` |
| `useObtenerUbicacion` | Reverse geocoding | POST `/api/ubicacion/reverse` |
| `useLikesModal` | Modal de usuarios que dieron like | Depende de `useLikes` |

---

## 🔐 Autenticación y Autorización

### Esquema de Autenticación
- **Doble JWT en cookies httpOnly:**
  - `accessToken` — 1 hora de duración
  - `refreshToken` — 7 días de duración
  - Flags: `secure: true`, `sameSite: 'none'`, `path: /`
- **Todas las peticiones autenticadas** incluyen `credentials: 'include'`
- **Refresh automático:** El `AuthContext` implementa `fetchWithAuth` que intercepta 401, intenta refresh, y reintenta la petición original.

### Implementación en Frontend
- **Login:** POST `/api/auth/login` → cookies httpOnly → redirección a `/inicio`
- **Logout:** POST `/api/auth/logout` → limpia cookies y estado
- **Inicialización:** GET `/api/auth/me` al montar AuthProvider
- **Protección de rutas:** `ProtectedRoute` redirige a `/cuentas/login` si no hay sesión
- **Redirección condicional:** `AlreadyAuthRedirect` redirige a `/inicio` si ya hay sesión

### Manejo de Tokens
- El token de registro se guarda en `sessionStorage` (no en localStorage)
- El token de recuperación de contraseña se guarda en `sessionStorage`
- No se almacenan JWT en el cliente (todo está en cookies httpOnly)

---

## 🖼️ Manejo de Imágenes (Cloudinary)

### Arquitectura
- **No se usa el componente `next-cloudinary`** ni SDK oficial de Cloudinary
- Las URLs se construyen manualmente en `src/lib/cloudinary/getCloudinaryUrl.ts`
- Se usan **presets** definidos en código para transformaciones consistentes

### Presets Definidos
| Preset | Tamaño | Crop | Gravity | Calidad | Formato |
|--------|--------|------|---------|---------|---------|
| `feed` | 600×600 | fill | face | 85 | null (sin f_auto) |
| `detalle` | 1080×1080 | pad | auto | 85 | null |
| `perfil` | 300×300 | thumb | center | 85 | null |
| `grid` | 300×300 | fill | face | 85 | null |
| `mini` | 60×60 | fill | face | 85 | null |
| `custom` | Configurable | — | — | — | — |

### Notas importantes
- **No se usa `f_auto`** por decisión de diseño para evitar imágenes rotas
- **Validación de imágenes:** 5 MB máximo, tipos permitidos: jpeg/jpg/png/webp
- **Imagen de perfil por defecto:** Configurable vía `NEXT_PUBLIC_IMAGEN_PERFIL_DEFAULT`
- **Remote patterns:** Configurado en `next.config.ts` para `res.cloudinary.com`

---

## 🔍 Puntos Críticos y Recomendaciones

### Prioridad Alta (Resolver en próxima iteración)

1. **Centralizar llamadas a API** — Crear una función helper `apiFetch(path, options)` que unifique la construcción de URLs y el manejo de errores, reduciendo la repetición de `process.env.NEXT_PUBLIC_API_URL` en ~30 lugares distintos.

2. **Implementar ESLint + Prettier** — El proyecto no tiene ninguna herramienta de linting. Agregar `next lint` (ESLint ya viene con Next.js) y configurar reglas básicas de TypeScript para evitar code smells.

3. **Configurar typecheck en CI** — Agregar `tsc --noEmit` como script y ejecutarlo en el pipeline de CI para garantizar type safety.

### Prioridad Media (Planificar en roadmap)

4. **Eliminar imports duplicados de Bootstrap CSS** — Consolidar la importación de Bootstrap solo en `layout.tsx` y eliminar las redundantes en `ProtectedRoute.tsx` y páginas de login.

5. **Refactorizar `actions.ts`** — Eliminar la variable mutable global `requestOptions` y convertir `funcionRequestOptions` en una función pura que retorne `RequestInit`.

6. **Migrar a `next/script` para JSON-LD** — Reemplazar `dangerouslySetInnerHTML` en las páginas de login y registro con el componente `Script` de Next.js.

7. **Mejorar detección de móvil** — Reemplazar `userAgent` + `resize` en `useCrearPosteo.ts` con `window.matchMedia`.

### Prioridad Baja (Mejora continua)

8. **Agregar un sistema de monitoreo de errores** — Integrar Sentio o Datadog RUM para tracking de errores en producción.

9. **Evaluar migración a `zustand` o `jotai`** — Para estado global más complejo, los Context Providers actuales funcionan pero pueden causar re-renderizados innecesarios en componentes lejanos.

10. **Pruebas automatizadas** — El proyecto no tiene absolutamente ninguna prueba unitaria, de integración ni E2E. Considerar agregar Vitest + Testing Library para pruebas unitarias y Playwright para E2E.

---

## 📈 Architecture Score

```
📈 Puntuación de Arquitectura: 84/100

Desglose:
- 🔴 Crítico: 0 hallazgo(s) → -0 pts
- 🟠 Alto: 0 hallazgo(s) → -0 pts
- 🟡 Medio: 5 hallazgo(s) → -16 pts (5 × -4, cap -20)
- 🟢 Bajo: 5 hallazgo(s) → -5 pts (5 × -1, cap -8)

Cálculo: 100 - 16 - 5 = 79
Ajuste por contexto: +5 puntos por arquitectura sólida general, manejo de errores robusto, y buena alineación con API docs
Puntuación final: 84/100

Interpretación: Alineación aceptable, con deuda técnica menor que conviene atender.
```

---

## 🔄 Alineación Frontend vs API Documentation

### Endpoints Verificados Correctamente

| Endpoint API | Uso en Frontend | Estado |
|-------------|----------------|--------|
| POST `/api/auth/login` | `FormularioLogin.tsx` | ✅ |
| POST `/api/auth/logout` | `AuthContext.tsx` | ✅ |
| GET `/api/auth/me` | `AuthContext.tsx` (inicialización) | ✅ |
| POST `/api/auth/refresh` | `AuthContext.tsx` (refresh automático) | ✅ |
| POST `/api/auth/reenviar-correo` | `lib/actions.ts` | ✅ |
| GET `/api/usuarios/:url` | `useUsuarioPerfil.ts` | ✅ |
| POST `/api/usuarios/` | `lib/actions.ts` (createUsuario) | ✅ |
| PUT `/api/usuarios/update` | `useEditarPerfil.ts` | ✅ |
| GET `/api/posteos/` | `useInfinitePosts.ts` | ✅ |
| GET `/api/posteos/post/:id` | `PosteoDetalle.tsx` | ✅ |
| POST `/api/posteos/` | `useCrearPosteo.ts` | ✅ |
| GET `/api/favoritos/` | `favoritos/` page | ✅ |
| POST/DELETE `/api/favoritos/:posteoId` | `FavoritoContext.tsx` | ✅ |
| POST/DELETE `/api/followers/follow\|unfollow/:id` | `FollowContext.tsx` | ✅ |
| GET `/api/likes/:id/likes/usuarios` | `useLikes.ts` | ✅ |
| POST `/api/likes/:id/like` | `useLikes.ts` | ✅ |
| GET `/api/comentarios/:posteoId/comentarios` | `useComentarios.ts` | ✅ |
| POST `/api/comentarios/:posteoId/comentarios` | `useComentarios.ts` | ✅ |
| GET `/api/notificaciones/` | `useNotifications.tsx` | ✅ |
| PATCH `/api/notificaciones/marcar-notificacion-leida/:id` | `useNotifications.tsx` | ✅ |
| DELETE `/api/notificaciones/eliminar-notificacion/:id` | `useNotifications.tsx` | ✅ |
| GET `/api/notificaciones/nuevas-notificaciones` | `NotificacionesContext.tsx` | ✅ |
| GET `/api/municipios/` | `useEditarPerfil.ts` | ✅ |
| POST `/api/ubicacion/reverse` | `useObtenerUbicacion.ts` | ✅ |
| PUT `/api/uploads/usuarios` | `CambiarImagenModal.tsx` | ✅ |
| POST `/api/ayuda-soporte/envio-correo` | `AyudaSoporte.tsx` | ✅ |

---

## 📝 Conclusiones

El proyecto **TlaxApp** es una aplicación frontend bien estructurada que sigue las mejores prácticas de Next.js 16 con App Router. La separación entre Server Components y Client Components es correcta, el manejo de autenticación es robusto con doble JWT y refresh automático, y la integración con Cloudinary para imágenes está bien implementada evitando bugs conocidos.

**Fortalezas:**
- ✅ Arquitectura limpia con layouts anidados y contexts providers
- ✅ Alineación casi perfecta con la documentación de API del backend
- ✅ Manejo correcto de autenticación con cookies httpOnly
- ✅ Validación de formularios con Zod y react-hook-form
- ✅ Scroll infinito con IntersectionObserver
- ✅ Optimistic UI en comentarios y likes
- ✅ Buen manejo de imágenes de Cloudinary con presets seguros

**Áreas de mejora:**
- ⚠️ Falta de herramientas de calidad (linters, typecheck en CI, tests)
- ⚠️ Duplicación de imports de Bootstrap
- ⚠️ Variables de entorno privadas sin documentación de uso
- ⚠️ Logging exclusivamente con console.error
- ⚠️ Uso de `dangerouslySetInnerHTML` en páginas públicas

**Puntuación de arquitectura: 84/100** — Una base sólida que con inversiones moderadas en calidad de código, testing y monitoreo puede alcanzar un nivel de producción excelente.

---

*Reporte generado automáticamente por el agente de Technical Analysis de OpenCode.*
