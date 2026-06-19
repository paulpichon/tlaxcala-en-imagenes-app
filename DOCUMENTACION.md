# Documentación del Proyecto: Tlaxcala en Imágenes App (TlaxApp)

## 1. Resumen General

Red social enfocada en Tlaxcala, México. Permite a los usuarios compartir imágenes, seguir perfiles, dar likes, comentar publicaciones y mantenerse conectados con su comunidad local.

- **Usuario objetivo**: Habitantes y visitantes de Tlaxcala interesados en compartir y descubrir contenido visual de la región.
- **Funcionalidades principales**: Feed infinito de publicaciones, perfiles de usuario, likes, comentarios, favoritos, seguir/dejar de seguir, notificaciones push, ubicación geográfica con municipios de Tlaxcala, publicidad rotativa.

---

## 2. Stack Tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| UI Library | React | 19.2.6 |
| Lenguaje | TypeScript | 6.0.3 |
| CSS Framework | Bootstrap | 5.3.8 |
| CSS Modules | Sí | — |
| Animaciones | Framer Motion | 12.38.0 |
| Formularios | react-hook-form | 7.75.0 |
| Validación | Zod | 4.4.3 |
| Resolvedor Zod | @hookform/resolvers | 5.2.2 |
| Iconos | react-icons | 5.6.0 |
| Fechas | date-fns | 4.1.0 |
| Tooltips/Popovers | @popperjs/core | 2.11.8 |
| Imágenes | Cloudinary | — |
| Notificaciones Push | Service Worker (Web Push API) | — |
| Paquetería | pnpm | — |

---

## 3. Requisitos Previos

- Node.js 20+
- pnpm (instalar con `npm install -g pnpm`)
- Cuenta en Cloudinary (para transformación de imágenes)
- Backend ejecutándose (local o producción)

---

## 4. Instalación y Configuración

```bash
# Instalar dependencias
pnpm install

# Desarrollo (Turbopack)
pnpm dev

# Build producción
pnpm build

# Iniciar servidor producción
pnpm start
```

---

## 5. Variables de Entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | URL base del frontend | `https://tlaxcala-en-imagenes-app.vercel.app` |
| `NEXT_PUBLIC_API_URL` | URL del backend (producción) | `https://plankton-app-f5l4n.ondigitalocean.app` |
| `NEXT_PUBLIC_API_URL_LOCAL` | URL del backend (desarrollo) | `http://localhost:5000` |
| `NEXT_PUBLIC_CLOUDINARY_NAME` | Cloud name de Cloudinary | `dy9prn3ue` |
| `NEXT_PUBLIC_IMAGEN_PERFIL_DEFAULT` | Imagen de perfil por defecto | URL completa de Cloudinary |
| `CORREO_USUARIO_PRINCIPAL` | Correo principal del sistema | `tlaxapp@tlaxapp.com` |
| `CORREO_CONTACTO` | Correo de contacto | `contacto@tlaxapp.com` |
| `CORREO_LEGAL` | Correo para asuntos legales | `legal@tlaxapp.com` |

**Nota**: `.env` está versionado en git a pesar de que `.gitignore` tiene el patrón `.env*`.

---

## 6. Scripts Disponibles

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `next dev` | Servidor de desarrollo con Turbopack |
| `build` | `next build` | Build de producción |
| `start` | `next start` | Iniciar servidor de producción |

No existen scripts de lint, typecheck ni tests.

---

## 7. Arquitectura del Proyecto

### 7.1 Estructura de Carpetas

```
tlaxcala-en-imagenes-app/
├── public/
│   ├── sw.js                         # Service Worker (notificaciones push)
│   └── assets/                       # Imágenes estáticas (logo, OG image)
├── src/
│   ├── app/                          # App Router (rutas, páginas, UI)
│   │   ├── (perfil)/[url]/           # Perfil de usuario (Route Group)
│   │   ├── componentes/              # Componentes específicos de rutas (43 archivos)
│   │   ├── configuracion/            # Ajustes (6 sub-rutas)
│   │   ├── contacto/                 # Página de contacto
│   │   ├── cuentas/                  # Auth (login, registro, password)
│   │   ├── favoritos/                # Publicaciones favoritas
│   │   ├── hooks/                    # Hooks personalizados (11 archivos)
│   │   ├── inicio/                   # Feed principal
│   │   ├── legal/                    # Términos, privacidad, FAQ público
│   │   ├── notificaciones/           # Centro de notificaciones
│   │   ├── posteo/[idposteo]/        # Detalle de publicación
│   │   ├── que-es-tlaxapp/           # Página "Acerca de"
│   │   ├── ui/                       # CSS Modules y estilos globales
│   │   ├── layout.tsx                # Layout raíz (providers)
│   │   ├── page.tsx                  # Landing page
│   │   ├── error.tsx                 # Error boundary global
│   │   └── not-found.tsx             # Página 404
│   ├── components/                   # Componentes compartidos (2 archivos)
│   │   ├── ProtectedRoute.tsx
│   │   └── AlreadyAuthRedirect.tsx
│   ├── context/                      # Context providers (6 archivos)
│   ├── lib/                          # Utilidades (API calls, validación, Cloudinary)
│   ├── types/types.ts                # Interfaces TypeScript (407 líneas)
│   └── utils/                        # Utilidades genéricas
├── AGENTS.md                         # Contexto para asistentes IA
├── API.md                            # Documentación de endpoints del backend
├── DOCUMENTACION-BACKEND.md          # Documentación del backend
└── DOCUMENTACION.md                  # Este archivo
```

### 7.2 Patrón Arquitectónico

El proyecto usa un patrón **híbrido feature-based + layer-based**:

- **Routes** en `src/app/` siguiendo el App Router de Next.js
- **Componentes compartidos** en `src/components/` (reutilizables entre rutas)
- **Componentes de ruta** en `src/app/components/` (específicos de features)
- **Contextos globales** en `src/context/`
- **Hooks** feature-specific en `src/app/hooks/`
- **Utilidades** en `src/lib/` y `src/utils/`
- **Tipos centralizados** en `src/types/types.ts`

### 7.3 Flujo de Datos

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Componente  │────▶│  Hook/Contexto   │────▶│  fetchWithAuth │
│  (UI)        │◀────│  (Estado+ Lógica)│◀────│  (Auth auto)  │
└──────────────┘     └──────────────────┘     └──────┬──────┘
                                                      │
                                                      ▼
                                              ┌──────────────┐
                                              │  Backend API  │
                                              │  (JWT cookies)│
                                              └──────────────┘
```

**Flujo de autenticación**:
```
Inicialización → GET /api/auth/me
  ├── 200 → usuario autenticado
  └── 401 → POST /api/auth/refresh
       ├── éxito → reintenta GET /api/auth/me
       └── fallo → usuario null (no autenticado)
```

**Flujo de feed**:
```
useInfinitePosts(initialUrl)
  → fetchWithAuth(GET /api/posteos)
  → IntersectionObserver detecta sentinel
  → fetchWithAuth(nextUrl) (pagina)
  → posts[] se actualiza
  → PosteoCard renderiza cada post
```

**Flujo de likes/follows**:
```
Usuario acciona botón
  → Hook/Contexto optimista (cambia UI inmediatamente)
  → fetchWithAuth llama endpoint
  → Si éxito: estado confirmado
  → Si error: reversión del estado
```

---

## 8. Enrutamiento

| Ruta | Página | Protección | Layout | Lazy |
|---|---|---|---|---|
| `/` | Landing | AlreadyAuthRedirect | Root | No |
| `/inicio` | Feed | ProtectedRoute | InicioLayout | No |
| `/[url]` | Perfil usuario | ProtectedRoute | PerfilLayout | No |
| `/posteo/[idposteo]` | Detalle post | ProtectedRoute | PosteoLayout | No |
| `/cuentas/login` | Login | AlreadyAuthRedirect | LoginLayout | No |
| `/cuentas/crear-cuenta` | Registro | AlreadyAuthRedirect | CrearCuentaLayout | No |
| `/cuentas/login/password-olvidado` | Olvidé password | Pública | Root | No |
| `/cuentas/login/restablecer-password/[token]` | Reset password | Pública (token) | Root | No |
| `/cuentas/crear-cuenta/cuenta-verificada/[token]` | Verificar email | Pública (token) | Root | No |
| `/cuentas/confirmacion/correo-enviado` | Confirmación email | Pública | Root | No |
| `/cuentas/confirmacion/correo-enviado-restablecer-password` | Confirmación reset | Pública | Root | No |
| `/cuentas/confirmacion/password-restablecido` | Password restablecido | Pública | Root | No |
| `/configuracion` | Ajustes | ProtectedRoute | ConfigLayout | No |
| `/configuracion/editar-perfil` | Editar perfil | ProtectedRoute | EditarPerfilLayout | No |
| `/configuracion/notificaciones` | Config notificaciones | ProtectedRoute | NotifConfigLayout | No |
| `/configuracion/faq` | FAQ (interno) | ProtectedRoute | FaqLayout | No |
| `/configuracion/eliminar-cuenta` | Eliminar cuenta | ProtectedRoute | EliminarCuentaLayout | No |
| `/configuracion/ayuda-y-soporte` | Ayuda | ProtectedRoute | AyudaSoporteLayout | No |
| `/notificaciones` | Centro notificaciones | ProtectedRoute | NotificacionesLayout | No |
| `/favoritos` | Favoritos | ProtectedRoute | FavoritosLayout | No |
| `/contacto` | Contacto | Pública | Root | No |
| `/legal/terminos-y-condiciones` | Términos | Pública | Root | No |
| `/legal/politica-de-privacidad` | Privacidad | Pública | Root | No |
| `/legal/preguntas-frecuentes` | FAQ público | Pública | Root | No |
| `/que-es-tlaxapp` | Acerca de | Pública | Root | No |

**ProtectedRoute**: Redirige a `/cuentas/login` si el usuario no está autenticado. Muestra Spinner durante la carga.

**AlreadyAuthRedirect**: Redirige a `/inicio` si el usuario ya está autenticado (para landing, login, registro).

---

## 9. Gestión de Estado (Context Providers)

### 9.1 AuthProvider (`src/context/AuthContext.tsx`) — Provider más externo

| Expone | Tipo | Descripción |
|---|---|---|
| `user` | `UsuarioLogueado \| null` | Usuario actual o null |
| `loading` | `boolean` | True durante inicialización |
| `login(user)` | `(user) => void` | Establece usuario, limpia almacenamiento local |
| `logout()` | `() => Promise<void>` | POST /api/auth/logout, limpia estado |
| `fetchWithAuth(url, init?)` | `(url, init?) => Promise<Response>` | Fetch con auto-refresh en 401 |
| `updateUser(data)` | `(Partial<UsuarioLogueado>) => void` | Merge parcial en usuario actual |

**APIs**: `GET /api/auth/me`, `POST /api/auth/refresh`, `POST /api/auth/logout`

### 9.2 NotificacionesProvider (`src/context/NotificacionesContext.tsx`)

| Expone | Tipo | Descripción |
|---|---|---|
| `totalNoLeidas` | `number` | Conteo de notificaciones no leídas |
| `setTotalNoLeidas` | `Dispatch` | Setter directo |
| `refrescarNotificaciones` | `() => Promise<void>` | Refresca conteo desde API |

**Comportamiento**: Polling cada 60s automáticamente cuando hay usuario autenticado.
**API**: `GET /api/notificaciones/nuevas-notificaciones`

### 9.3 FollowProvider (`src/context/FollowContext.tsx`)

| Expone | Tipo | Descripción |
|---|---|---|
| `isFollowingMap` | `Record<string, boolean>` | Mapa userId → sigue/no sigue |
| `loadingMap` | `Record<string, boolean>` | Mapa userId → cargando |
| `toggleFollow(userId, initialFollowing?)` | `(string, boolean?) => Promise<void>` | Seguir/dejar de seguir |

**APIs**: `POST /api/followers/follow/:userId`, `DELETE /api/followers/unfollow/:userId`

### 9.4 FavoritoProvider (`src/context/FavoritoContext.tsx`)

| Expone | Tipo | Descripción |
|---|---|---|
| `favoritosMap` | `Record<string, boolean>` | Mapa posteoId → favorito/no favorito |
| `loadingMap` | `Record<string, boolean>` | Mapa posteoId → cargando |
| `toggleFavorito(posteoId, autorId, initialFavorito?)` | `(string, string, boolean?) => Promise<void>` | Agregar/quitar favorito |

**APIs**: `POST /api/favoritos/:posteoId`, `DELETE /api/favoritos/:posteoId`

### 9.5 NuevosUsuariosProvider (`src/context/NuevosUsuariosContext.tsx`)

| Expone | Tipo | Descripción |
|---|---|---|
| `usuarios` | `UsuarioNuevo[]` | Usuarios recién registrados |
| `loading` | `boolean` | Estado de carga |
| `reload` | `() => void` | Recarga la lista |

**API**: `GET /api/usuarios/registrados/nuevos-usuarios-registrados`

### 9.6 PublicidadProvider (`src/context/PublicidadContext.tsx`) — Provider más interno

| Expone | Tipo | Descripción |
|---|---|---|
| `anuncioActual` | `{ id, imagen, url }` | Anuncio actual del carrusel |
| `indice` | `number` | Índice actual (0-2) |
| `pausar` | `() => void` | Pausa rotación |
| `reanudar` | `() => void` | Reanuda rotación |

**Comportamiento**: 3 anuncios hardcodeados rotan cada 8 segundos. No hace llamadas API.

### Orden de Providers (layout.tsx)

```
<AuthProvider>
  <NotificacionesProvider>
    <FollowProvider>
      <NuevosUsuariosProvider>
        <PublicidadProvider>
          {children}
        </PublicidadProvider>
      </NuevosUsuariosProvider>
    </FollowProvider>
  </NotificacionesProvider>
</AuthProvider>
```

`FavoritoProvider` se agrega localmente en los layouts de rutas protegidas (NO en el root).

---

## 10. Capa de API

### Endpoints consumidos por el frontend

| Endpoint | Método | Autenticación | Uso |
|---|---|---|---|
| `/api/auth/me` | GET | Cookie JWT | AuthContext (inicialización) |
| `/api/auth/refresh` | POST | Cookie JWT | AuthContext (refresh automático) |
| `/api/auth/logout` | POST | Cookie JWT | AuthContext (logout) |
| `/api/notificaciones/nuevas-notificaciones` | GET | Cookie JWT | NotificacionesContext (polling) |
| `/api/followers/follow/:userId` | POST | Cookie JWT | FollowContext |
| `/api/followers/unfollow/:userId` | DELETE | Cookie JWT | FollowContext |
| `/api/favoritos/:posteoId` | POST | Cookie JWT | FavoritoContext |
| `/api/favoritos/:posteoId` | DELETE | Cookie JWT | FavoritoContext |
| `/api/usuarios/registrados/nuevos-usuarios-registrados` | GET | Cookie JWT | NuevosUsuariosContext |
| `/api/usuarios` | POST | No | `createUsuario` (registro) |
| `/api/auth/reenviar-correo` | POST | Token | `reenviarCorreo` |
| `/api/auth/reenviar-correo-restablecer-password` | POST | Token | `reenviarCorreoRestablecerPassword` |
| `/api/auth/cuentas/password-olvidado` | POST | No | `envioCorreoRestablecerPassword` |
| `/api/auth/cuentas/restablecer-password/validar-token-reset-password/:token` | GET | No | `validarTokenRestablecerPassword` |
| `/api/auth/verificar-correo/:token` | GET | No | Página cuenta-verificada |
| `/api/posteos` | GET | Cookie JWT | `useInfinitePosts` (feed) |
| `/api/posteos` | POST | Cookie JWT | `useCrearPosteo` |
| `/api/posteos/:id` | GET | Cookie JWT | `PosteoDetalle` |
| `/api/likes/:postId/like` | POST | Cookie JWT | `useLikes` |
| `/api/likes/:postId/likes/usuarios` | GET | Cookie JWT | `useLikes` / `useLikesModal` |
| `/api/comentarios/:postId/comentarios` | GET | Cookie JWT | `useComentarios` |
| `/api/comentarios/:postId/comentarios/count` | GET | Cookie JWT | `useComentarios` |
| `/api/comentarios/:postId/comentarios` | POST | Cookie JWT | `useComentarios` (crear) |
| `/api/comentarios/:commentId` | DELETE | Cookie JWT | `useComentarios` (eliminar) |
| `/api/notificaciones?page=N&limit=15` | GET | Cookie JWT | `useNotifications` |
| `/api/notificaciones/marcar-notificacion-leida/:id` | PATCH | Cookie JWT | `useNotifications` |
| `/api/notificaciones/eliminar-notificacion/:id` | DELETE | Cookie JWT | `useNotifications` |
| `/api/ubicacion/reverse` | POST | Cookie JWT | `useObtenerUbicacion` |
| `/api/usuarios/:url` | GET | Cookie JWT | `useUsuarioPerfil` |
| `/api/usuarios/update` | PUT | Cookie JWT | `useEditarPerfil` |
| `/api/municipios/` | GET | Cookie JWT | `useEditarPerfil`, `ManualMunicipioSelector` |
| `/api/uploads/usuarios` | PUT | Cookie JWT | `CambiarImagenModal` |
| `/api/ayuda-soporte/envio-correo` | POST | Cookie JWT | `AyudaSoporte` |
| `/api/notificaciones/vapidPublicKey` | GET | Cookie JWT | `usePushNotifications` |
| `/api/notificaciones/subscribe` | POST | Cookie JWT | `usePushNotifications` |
| `/api/notificaciones/unsubscribe` | POST | Cookie JWT | `usePushNotifications` |
| `/api/favoritos` | GET | Cookie JWT | Página favoritos |

**Nota**: Todas las URLs de API usan `NEXT_PUBLIC_API_URL_LOCAL` hardcodeado en `actions.ts` y en algunos hooks (no son environment-aware).

---

## 11. Componentes

### 11.1 Componentes Compartidos (`src/components/`)

#### ProtectedRoute

| Propiedad | Valor |
|---|---|
| Props | `{ children: React.ReactNode }` |
| Estado interno | Ninguno (delega en contexto) |
| Efectos | Redirige a `/cuentas/login` si `!loading && !user` |
| Contextos | `useAuth()` |
| Hooks externos | `useRouter()` |
| Render | Spinner durante carga, `{children}` si autenticado |

#### AlreadyAuthRedirect

| Propiedad | Valor |
|---|---|
| Props | `{ children: React.ReactNode }` |
| Estado interno | Ninguno |
| Efectos | Redirige a `/inicio` si `!loading && user` |
| Contextos | `useAuth()` |
| Hooks externos | `useRouter()` |
| Render | `null` durante carga/autenticado, `{children}` si no autenticado |

### 11.2 Componentes de Aplicación (`src/app/components/`)

#### Spinner

| Propiedad | Valor |
|---|---|
| Props | `{ size?: number\|string, color?: string }` (default: `80px`, `#EBCA9A`) |
| Estado | Ninguno |
| Efectos | Ninguno |
| Render | SVG animado centrado |

#### ToastGlobal

| Propiedad | Valor |
|---|---|
| Props | `{ message: string, type?: "success"\|"danger"\|"warning"\|"creacion", onClose?: () => void }` |
| Estado | Ninguno |
| Efectos | Auto-cierra a los 4s vía setTimeout |
| Render | `AnimatePresence` → badge fijo top-center con color según type |

#### HeaderSuperior

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Estado | Ninguno |
| Efectos | Ninguno |
| Render | Logo + "TlaxApp" link. Banner estático. |

#### HeaderPrincipalTei

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Export | Named export (no default) |
| Estado | Ninguno |
| Efectos | Ninguno |
| Render | Logo centrado + título + subtítulo (páginas públicas) |

#### MenuPrincipal

| Propiedad | Valor |
|---|---|
| Props | `{ onPostCreated?: () => void }` |
| Estado | `dropdownOpen`, `showModal`, `showCrearPost` |
| Efectos | (1) Polling notificaciones cada 60s. (2) Click-outside cierra dropdown. (3) Body scroll lock con modales. |
| Contextos | `useAuth()`, `useNotificaciones()` |
| Render | Nav Bootstrap: Home, Notificaciones (con badge), Crear, Ajustes, perfil, dropdown Cuenta |

#### FooterMain

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Estado | Ninguno |
| Efectos | Ninguno |
| Render | 5 links legales + copyright |

#### FooterSugerencias

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Estado | Ninguno |
| Efectos | Ninguno |
| Render | 3 links compactos + copyright |

#### ImagePreloader

| Propiedad | Valor |
|---|---|
| Props | `{ images: string[] }` |
| Estado | Ninguno |
| Efectos | Crea `new Image()` para cada URL en mount |
| Render | `null` (no renderiza) |
| Exports adicionales | `preloadImage`, `preloadImages` (funciones helper) |

#### Publicidad

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Estado | Ninguno |
| Contextos | `usePublicidad()` |
| Render | Link con Image (fill, cover), badge "Patrocinado", overlay gradient. Pausa/reanuda en hover. |

#### ManualMunicipioSelector

| Propiedad | Valor |
|---|---|
| Props | `{ municipio: string\|null, onSelect: (id, data: DatosUbicacion) => void }` |
| Estado | `municipios: Municipio[]` |
| Efectos | Fetch de municipios en mount |
| Contextos | `useAuth()` (fetchWithAuth) |
| Render | `<select>` con opción "No seleccionar" + municipios |

#### LikeButton

| Propiedad | Valor |
|---|---|
| Props | `{ postId: string, onOpenLikesModal?: () => void }` |
| Estado | Delega a `useLikes` |
| Hooks | `useLikes(postId)` |
| Render | Heart icon (FiHeart, rojo si liked) + contador clickable |

#### FollowButton

| Propiedad | Valor |
|---|---|
| Props | `{ userId: string, initialFollowing?: boolean, className?, onToggle? }` |
| Estado | Delega a `FollowContext` |
| Contextos | `useFollow()` |
| Render | Botón "Seguir"/"Dejar de seguir" con Spinner durante carga |

#### FavoritoButton

| Propiedad | Valor |
|---|---|
| Props | `{ posteoId, autorId, initialFavorito?, className?, onRemoved?, iconOnly? }` |
| Estado | Delega a `FavoritoContext` |
| Contextos | `useFavorito()` |
| Render | Botón con texto o icon-only (FiHeart, siempre rojo, filled si favorito) |

#### PosteoCard

| Propiedad | Valor |
|---|---|
| Props | `{ post: Posteo, isDetail?: boolean, showUserUrl?: boolean }` |
| Estado | `isOptionsOpen`, `isLikesOpen`, `likesUsuarios`, `loaded`, `posteoActual`, `showComments` |
| Contextos | `useAuth()` |
| Hooks | `useRouter()`, `useComentarios(post._id)`, `getCloudinaryUrl()`, `obtenerImagenPerfilUsuario()` |
| Render | Card: avatar + username, imagen, LikeButton + comentarios + texto + fecha. Modales: opciones, likes, comentarios. |

#### PosteoDetalle

| Propiedad | Valor |
|---|---|
| Props | Ninguno (lee `useParams()`) |
| Estado | `post`, `loading`, `error` |
| Efectos | Fetch de detalle cuando `fetchWithAuth` está listo |
| Contextos | `useAuth()` |
| Render | Spinner/Error/PosteoCard según estado |

#### PublicacionesUsuarioGridItem

| Propiedad | Valor |
|---|---|
| Props | `{ posteo: Posteo, onClick: (posteo: Posteo) => void }` |
| Estado | Ninguno |
| Render | Col Bootstrap con card-image clickable |

#### NuevosUsuariosRegistrados

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Contextos | `useNuevosUsuarios()` |
| Render | Sección "Nuevos usuarios" con avatar + nombre + url + FollowButton |

#### CambiarImagenModal

| Propiedad | Valor |
|---|---|
| Props | `{ currentImage, show, onClose, onSuccess }` |
| Estado | `loading`, `toast`, `preview`, `imageLoaded` |
| Efectos | Reset preview en show/close |
| Contextos | `useAuth()` |
| Render | Modal animado: preview circular, file input oculto, botones. Upload vía `PUT /api/uploads/usuarios`. |

#### CrearPosteoModal

| Propiedad | Valor |
|---|---|
| Props | `{ show, onClose, onPostCreated? }` |
| Estado | `toastMessage`, `toastType` |
| Hooks | `useCrearPosteo(onPostCreated, handleSuccess)` |
| Efectos | Toast en errores, auto-clear 6s |
| Render | Modal con dos estados: upload (drag-drop o camera/gallery) → preview con ubicación + texto + privacidad |

#### EditarPerfil

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Hooks | `useEditarPerfil()`, `useRouter()` |
| Render | Header + ToastGlobal + PerfilHeader + PerfilForm + CambiarImagenModal |

#### Configuraciones

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Estado | `showModal` (confirmación logout) |
| Hooks | `useLogout()` |
| Render | Cards: Cuenta (Editar perfil, Eliminar cuenta), General (Notificaciones, Ayuda, FAQ). Botón cerrar sesión rojo. |

#### ModalLikesUsuarios

| Propiedad | Valor |
|---|---|
| Props | `{ isOpen, onClose, usuarios: LikeUsuario[] }` |
| Estado | Ninguno |
| Efectos | Bloquea scroll cuando abierto |
| Render | Modal Bootstrap con lista de usuarios (avatar + nombre + link a perfil) |

#### ModalOpcionesPublicacion

| Propiedad | Valor |
|---|---|
| Props | `{ isOpen, selectedImage, onClose, onPostDeleted?, onPostUpdated? }` extendiendo `PropsModalOpcionesPublicacion` |
| Estado | `showEditModal`, `showConfirmDelete`, `isDeleting`, `toast` |
| Contextos | `useAuth()`, `useFavorito()` |
| Render | Múltiples modales: opciones principales, confirmar eliminar, editar posteo. Share con `navigator.share`. |

#### ComentarioItem

| Propiedad | Valor |
|---|---|
| Props | `{ comentario: Comentario, onDelete?, posteoAutorId? }` |
| Estado | `deleting` |
| Contextos | `useAuth()` (permisos) |
| Render | Avatar + nombre + fecha + texto + botón eliminar condicional |

#### ComentariosModal

| Propiedad | Valor |
|---|---|
| Props | `{ isOpen, onClose, postId, comentariosActivos?, posteoAutorId? }` |
| Estado | `texto`, `sending`, `toast` |
| Efectos | Fetch en open, body scroll lock, auto-focus textarea |
| Hooks | `useComentarios(postId)` |
| Render | Modal Bootstrap: header, scroll de comentarios, input con textarea + send |

#### ComentariosSection

| Propiedad | Valor |
|---|---|
| Props | `{ postId, comentariosActivos?, posteoAutorId? }` |
| Estado | `texto`, `sending`, `toast` |
| Efectos | Fetch en mount |
| Hooks | `useComentarios(postId)` |
| Render | Sección inline (no modal): header con total, lista, input sticky |

#### EditarPosteoModal

| Propiedad | Valor |
|---|---|
| Props | `{ isOpen, posteo, onClose }` |
| Estado | `texto`, `loading`, `toastMessage`, `toastType` |
| Efectos | Auto-clear toast, inicializa ubicación desde posteo |
| Contextos | `useAuth()` |
| Hooks | `useObtenerUbicacion()` |
| Render | Modal animado: ubicación + textarea (200 chars) + guardar |

#### ImageModal (perfil)

| Propiedad | Valor |
|---|---|
| Props | `{ isOpen, selectedImage, onClose, onPostDeleted?, onPostUpdated? }` |
| Estado | `isOptionsOpen`, `isLikesModalOpen`, `usuariosLikes`, `isMobile`, `posteoActual`, `comentarioTexto`, `sendingComentario`, `toastComentario` |
| Efectos | Sync posteoActual, resize listener, fetch comentarios en open |
| Contextos | `useAuth()` |
| Render | Full-screen: mobile (vertical stack) / desktop (side-by-side image + comments panel) |

#### PublicacionesUsuarioGrid

| Propiedad | Valor |
|---|---|
| Props | `{ usuarioId?, refreshTrigger?, onPostCountChange? }` |
| Estado | `posteos[]`, `nextUrl`, `loading`, `loadingMore`, `refreshing`, `selectedImage`, `isFirstModalOpen`, `toast` |
| Efectos | Fetch en cambio de usuarioId/refreshTrigger, IntersectionObserver para scroll infinito |
| Contextos | `useAuth()` |
| Render | Grid 6-col de imágenes, ImageModal al click, sentinel infinito |

#### PerfilUsuarioContainer

| Propiedad | Valor |
|---|---|
| Props | `{ url: string }` |
| Estado | `refreshPosteos`, `totalPosteos` |
| Hooks | `useUsuarioPerfil(url)` |
| Render | Layout 3-columnas: MenuPrincipal | HeaderSuperior + InformacionUsuarioPerfil + PublicacionesUsuarioGrid | sidebar |

#### InformacionUsuarioPerfil

| Propiedad | Valor |
|---|---|
| Props | `{ usuario: UsuarioPerfil, totalPosteos?: number }` |
| Estado | `imagenPerfil`, `showModal`, `showFollowersModal`, `hover`, `totalPublicaciones`, `showFollowingModal` |
| Contextos | `useAuth()` |
| Render | Avatar + nombre + FollowButton + stats (posts, seguidores, siguiendo) + modales |

#### FollowingModal / FollowersModal

| Propiedad | Valor |
|---|---|
| Props | `{ userId, loggedUserId?, show, onClose }` |
| Estado | `following[]/followers[]`, `loading` |
| Efectos | Fetch en open |
| Render | Modal animado con lista de usuarios + FollowButton |

#### Notificaciones (lista)

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Hooks | `useNotifications()` |
| Render | Lista agrupada por fecha (Hoy / Esta semana / Este mes / Anteriores) con NotificacionItem |

#### NotificacionItem

| Propiedad | Valor |
|---|---|
| Props | `{ notif: Notificacion, onClick, onEliminar }` |
| Estado | `menuAbierto`, `eliminando`, `toast` |
| Render | Avatar + mensaje + badge "No leído" + fecha + menú eliminar |

#### ConfiguracionNotificaciones

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Estado | `toast` |
| Hooks | `usePushNotifications()` |
| Render | Card con toggle switch para notificaciones push |

#### EliminarCuenta

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Estado | `confirmacion`, `loading`, `mensaje` |
| Contextos | `useAuth()` |
| Render | Formulario con advertencia, input "ELIMINAR", botón danger |

#### AyudaSoporte

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Estado | `tipoAyuda`, `mensaje`, `loading`, `formErrors`, `toast` |
| Contextos | `useAuth()` |
| Render | Formulario: select tipo + textarea (1000 chars) + envío. POST a `/api/ayuda-soporte/envio-correo`. |

#### PerfilHeader

| Propiedad | Valor |
|---|---|
| Props | `{ url, imagenPerfil, onCambiarFoto }` |
| Render | `@url` + imagen circular + botón "Cambiar foto" |

#### PerfilForm

| Propiedad | Valor |
|---|---|
| Props | `{ formData, errors, municipios, loading, handleChange, handleSubmit }` |
| Render | Formulario: nombre, apellido, fecha nac, correo (read-only), entidad, municipio, género, password |

#### Favoritos (página)

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Estado | `favoritos[]`, `loading`, `next` |
| Efectos | Fetch en mount |
| Contextos | `useAuth()`, `useFavorito()` |
| Render | Grid de imágenes favoritas con FavoritoButton overlay + "Cargar más" |

#### PublicacionUsuario (feed)

| Propiedad | Valor |
|---|---|
| Props | Ninguno |
| Hooks | `useInfinitePosts()` |
| Render | Spinner inicial / empty state / PosteoCard grid + sentinel infinito |

---

## 12. Hooks Personalizados

| Hook | Archivo | Parámetros | Retorno | APIs |
|---|---|---|---|---|
| `useAuth` | `src/context/AuthContext.tsx` | — | `{ user, loading, login, logout, fetchWithAuth, updateUser }` | `/api/auth/me`, `/api/auth/refresh`, `/api/auth/logout` |
| `useLogout` | `src/app/hooks/auth/logout.ts` | — | `{ handleLogout }` | Delega a AuthContext |
| `useNotificaciones` | `src/context/NotificacionesContext.tsx` | — | `{ totalNoLeidas, setTotalNoLeidas, refrescarNotificaciones }` | `GET /api/notificaciones/nuevas-notificaciones` |
| `useFollow` | `src/context/FollowContext.tsx` | — | `{ isFollowingMap, loadingMap, toggleFollow }` | `POST/DELETE /api/followers/{follow,unfollow}/:userId` |
| `useFavorito` | `src/context/FavoritoContext.tsx` | — | `{ favoritosMap, loadingMap, toggleFavorito }` | `POST/DELETE /api/favoritos/:posteoId` |
| `useNuevosUsuarios` | `src/context/NuevosUsuariosContext.tsx` | — | `{ usuarios, loading, reload }` | `GET /api/usuarios/registrados/nuevos-usuarios-registrados` |
| `usePublicidad` | `src/context/PublicidadContext.tsx` | — | `{ anuncioActual, indice, pausar, reanudar }` | Ninguno (hardcodeado) |
| `useCrearPosteo` | `src/app/hooks/useCrearPosteo.ts` | `onPostCreated?, onSuccess?` | `{ file, preview, texto, loading, handleSubmit, resetForm, ... }` | `POST /api/posteos` (FormData) |
| `useEditarPerfil` | `src/app/hooks/useEditarPerfil.ts` | — | `{ user, formData, errors, handleSubmit, ... }` | `GET /api/municipios/`, `PUT /api/usuarios/update` |
| `useObtenerUbicacion` | `src/app/hooks/useObtenerUbicacion.ts` | — | `{ lat, lng, obtenerUbicacion, loadingUbicacion, ... }` | `POST /api/ubicacion/reverse` |
| `useUsuarioPerfil` | `src/app/hooks/useUsuarioPerfil.ts` | `url: string\|undefined` | `{ usuario, loading, error, setUsuario }` | `GET /api/usuarios/:url` |
| `useInfinitePosts` | `src/app/hooks/useInfinitePosts.ts` | `initialUrl: string` | `{ posts, loading, observerRef, finished, updateFollowState, updateFavoritoState }` | Feed paginado |
| `useLikes` | `src/app/hooks/useLikes.ts` | `postId: string` | `{ likeState, toggleLike, loading }` | `GET/POST /api/likes/:postId/like` |
| `useLikesModal` | `src/app/hooks/useLikesModal.ts` | — | `{ isLikesOpen, likesUsuarios, loading, openLikesModal, closeLikesModal }` | `GET /api/likes/:postId/likes/usuarios` |
| `useNotifications` | `src/app/hooks/useNotifications.tsx` | — | `{ notificaciones, page, totalPages, loading, cargarNotificaciones, marcarComoLeida, eliminarNotificacion }` | `GET /api/notificaciones`, `PATCH`, `DELETE` |
| `useComentarios` | `src/app/hooks/useComentarios.ts` | `postId: string` | `{ comentarios, total, fetchComentarios, agregarComentario, eliminarComentario, ... }` | CRUD `/api/comentarios/:postId/comentarios` |
| `usePushNotifications` | `src/app/hooks/usePushNotifications.ts` | — | `{ estado, activarNotificaciones, desactivarNotificaciones }` | VAPID, subscribe, unsubscribe |

---

## 13. Utilidades y Helpers

### `src/utils/handleChange.ts`
Manejador genérico de cambios en inputs para formularios. Actualiza estado por `e.target.name`.

```typescript
handleChange(e, setFormData, formData)
// e: ChangeEvent<HTMLInputElement>
// setFormData: Dispatch<SetStateAction<IUsuarioData>>
// formData: IUsuarioData
```

### `src/lib/cloudinary/getCloudinaryUrl.ts`
Construye URLs de Cloudinary con transformaciones predefinidas por preset.

```typescript
getCloudinaryUrl(publicId, preset = "feed", options?)
// publicId: string — ID público de Cloudinary
// preset: "feed"|"detalle"|"perfil"|"grid"|"mini"|"custom"
// options?: CloudinaryCustomOptions — solo usado con preset="custom"
```

| Preset | Width | Height | Crop | Gravity | Quality |
|---|---|---|---|---|---|
| `feed` | 600 | 600 | fill | face | 85 |
| `detalle` | 1080 | 1080 | pad (bg auto) | auto | 85 |
| `perfil` | 300 | 300 | thumb | center | 85 |
| `grid` | 300 | 300 | fill | face | 85 |
| `mini` | 60 | 60 | fill | face | 85 |

### `src/lib/cloudinary/obtenerImagenPerfilUsuario.ts`
Obtiene URL de imagen de perfil, usando Cloudinary si existe o valor por defecto.

```typescript
obtenerImagenPerfilUsuario(user, preset)
// user: UsuarioLogueado
// preset: CloudinaryPreset
```

### `src/lib/actions.ts`
Funciones de servidor para operaciones de autenticación.

| Función | Propósito |
|---|---|
| `createUsuario(formData)` | Registro de usuario (POST /api/usuarios) |
| `reenviarCorreo(token)` | Reenviar correo de verificación |
| `reenviarCorreoRestablecerPassword(token)` | Reenviar correo de restablecimiento |
| `envioCorreoRestablecerPassword(correo)` | Enviar correo para olvidé password |
| `validarTokenRestablecerPassword(token)` | Validar token de restablecimiento |

### `src/lib/validaciones.ts`
Schemas de validación con Zod 4.

| Schema | Validación |
|---|---|
| `usuarioSchema` | Registro: nombre, apellido, correo (email), password (8+ chars, upper+lower+digit+special) |
| `correoSchema` | Solo email (pick de usuarioSchema) |
| `passwordSchema` | Solo password (pick de usuarioSchema) |
| `resetPasswordSchema` | Password + confirmPassword deben coincidir |
| `posteoBaseSchema` | Texto (max 200, regex), archivo (max 5MB, jpeg/jpg/png/webp), público/privado |
| `posteoSchema` | posteoBaseSchema + refine: texto o imagen requerido |
| `editarPosteoSchema` | Texto (max 200, regex, spam filter), opcional |
| `comentarioSchema` | Texto (max 250, regex, spam filter) |
| `schemaAyudaSoporte` | tipo_problema enum + descripción (10-1000 chars) |
| `imageFileSchema` | File: tipo jpeg/jpg/png/webp |

**Spam regex**: `/(http|www|free money|click here|suscríbete|followers|porno|xxx)/i`

---

## 14. Sistema de Tipos (`src/types/types.ts` — 407 líneas)

### Interfaces Principales

| Interfaz | Campos clave |
|---|---|
| `UsuarioLogueado` | `nombre_completo: {nombre, apellido}`, `correo`, `imagen_perfil?: {secure_url, public_id}`, `url`, `_id`, `lugar_radicacion?`, `genero?`, `fecha_nacimiento?` |
| `UsuarioPerfil` (extiende `UsuarioLogueado`) | `totalPosteos`, `totalSeguidores`, `totalSeguidos`, `isFollowing` |
| `Posteo` | `_idUsuario: UsuarioLogueado`, `texto`, `secure_url`, `public_id`, `ubicacion?` (con `municipio?`, `ciudad?`, `estado?`, `pais?`, `coordinates?`), `posteo_publico`, `fecha_creacion`, `isFollowing`, `isFavorito`, `comentariosActivos?` |
| `Comentario` | `_id`, `texto`, `createdAt`, `autorId: {_id, nombre_completo, imagen_perfil?, url}` |
| `Notificacion` | `_id`, `tipo: "follow"\|"like"\|"comentario"\|"nueva_publicacion"`, `mensaje`, `notificacion_leida`, `emisor: {_id, nombre_completo, url, imagen_perfil?}` |
| `LikeUsuario` | `_id`, `_idUsuario: UsuarioLogueado`, `posteoId` |
| `Favorito` | `_id`, `usuarioId`, `posteoId: Posteo`, `autorId: UsuarioLogueado` |
| `Municipio` | `_id`, `claveEntidad`, `nombreEntidad`, `claveMunicipio`, `nombreMunicipio`, `codigoPostal` |
| `IAuthContext` | `user`, `loading`, `login`, `logout`, `fetchWithAuth`, `updateUser` |

### Type Aliases

| Type | Definición |
|---|---|
| `FormErrors` | `{ [key in keyof UsuarioSchema]?: string }` |
| `CloudinaryPreset` | `"feed"\|"detalle"\|"perfil"\|"grid"\|"mini"\|"custom"` |

### Interfaces de Props (componentes)

`CrearPosteoModalProps`, `PosteoCardProps`, `ApiResponsePosteos`, `PropsModalOpcionesPublicacion`, `PosteoDetalleResponse`, `LikeButtonProps`, `FavoritoButtonProps`, `FollowButtonProps`, `PublicacionesUsuarioProps`, `ToastGlobalProps`, `CloudinaryCustomOptions`, `ComentariosResponse`, `ComentariosCountResponse`, `CambiarImagenModalProps`, `DatosUbicacion`, `FormDataEditarPerfil`, `ApiResponseFavoritos`, `EditarPosteoModalProps`, `FollowerUserItemProps`, `FollowingUserItemProps`

---

## 15. Estilos y Diseño

- **Base**: Bootstrap 5.3 (importado globalmente en layout.tsx)
- **CSS Modules**: Archivos `.module.css` en `src/app/ui/` que reflejan la estructura de rutas
- **Global CSS**: `src/app/ui/globals.css`
- **Fuentes**: `src/app/ui/fonts.ts` (side-effect import en layout.tsx)
- **Animaciones**: Framer Motion para modales, toasts, transiciones
- **Iconos**: react-icons (principalmente Feather icons: FiHeart, FiBell, FiTrash2, etc.)
- **Responsive**: Bootstrap grid system (col-md, col-lg, col-xl) con 3 columnas en páginas protegidas

### CSS Modules disponibles

`Home.module.css`, `Inicio.module.css`, `perfil.module.css`, `PosteoCard.module.css`, `CrearPosteoModal.module.css`, `ComentariosModal.module.css`, `ComentariosSection.module.css`, `login.module.css`, `CrearCuenta.module.css`, `PasswordOlvidado.module.css`, `RestablecerPassword.module.css`, `CuentaVerificada.module.css`, `CorreoEnviado.module.css`, `PasswordRestablecido.module.css`, `EditarPerfil.module.css`, `Notificaciones.module.css`, `AyudaSoporte.module.css`, `Favorito.module.css`, `PrivacidadTerminosCondiciones.module.css`, `error.css`, `not-found.css`

---

## 16. Rendimiento y Optimización

- **Scroll infinito**: `IntersectionObserver` en `useInfinitePosts` y `PublicacionesUsuarioGrid` con rootMargin 200px
- **Precarga de imágenes**: `ImagePreloader` component + `preloadImage`/`preloadImages` helpers
- **Next.js Image**: Componente `Image` de Next.js con optimización automática y remotePatterns para Cloudinary
- **Framer Motion**: Solo para animaciones de entrada/salida (modales, toasts)
- **Actualizaciones optimistas**: Likes, follows y favoritos actualizan UI inmediatamente antes de confirmación del servidor
- **Sin Suspense ni lazy loading**: Los modales se renderizan condicionalmente pero no usan `React.lazy`/`Suspense`
- **Debounce en refresh**: `isRefreshing` ref previene llamadas concurrentes a `/api/auth/refresh`

---

## 17. Consideraciones de Seguridad

- **Autenticación**: Cookies httpOnly con JWT, renovación automática con refresh token
- **fetchWithAuth**: Wrapper que añade `credentials: 'include'` a todas las peticiones y maneja refresh automático en 401
- **Validación Zod**: Schemas estrictos para texto (regex, longitud máxima, spam filter)
- **Spam filter**: Regex que bloquea URLs y palabras clave en comentarios y edición de posts
- **File upload**: Solo imágenes (jpeg/jpg/png/webp), máximo 5MB
- **User scaling**: Bloqueado (`userScalable: false`, `maximumScale: 1`) por restricción de diseño
- **XSS**: Las validaciones de texto permiten caracteres limitados (sin `<`, `>`, etc.)
- **Rate limiting**: Manejo de error 429 en `AyudaSoporte` y `reenviarCorreo`

---

## 18. Pruebas

No hay tests configurados en el proyecto. No hay dependencias de testing en `package.json`.

---

## 19. Despliegue

```bash
# Build de producción
pnpm build

# Iniciar servidor
pnpm start
```

**Requisitos**:
- Variables de entorno configuradas (ver sección 5)
- Backend accesible desde `NEXT_PUBLIC_API_URL` o `NEXT_PUBLIC_API_URL_LOCAL`
- Service Worker en `public/sw.js` para notificaciones push

**SEO**:
- `robots.ts`: Deshabilita `/api/`, `/posteo/`, `/configuracion/`, `/notificaciones/`
- `sitemap.ts`: Cubre home, login, register, legal, contacto
- Meta tags: Open Graph, Twitter Cards, keywords

---

## 20. Salud de Dependencias

### Dependencias de Producción

| Paquete | Versión | Uso |
|---|---|---|
| `next` | 16.2.6 | Framework |
| `react` | 19.2.6 | UI |
| `react-dom` | 19.2.6 | Renderizado |
| `bootstrap` | 5.3.8 | CSS Framework |
| `react-icons` | 5.6.0 | Iconos |
| `framer-motion` | 12.38.0 | Animaciones |
| `react-hook-form` | 7.75.0 | Formularios |
| `zod` | 4.4.3 | Validación |
| `@hookform/resolvers` | 5.2.2 | Integración Zod+react-hook-form |
| `date-fns` | 4.1.0 | Formateo de fechas |
| `@popperjs/core` | 2.11.8 | Tooltips/Popovers Bootstrap |

### Dependencias de Desarrollo

| Paquete | Versión |
|---|---|
| `typescript` | 6.0.3 |
| `@types/node` | 25.7.0 |
| `@types/react` | 19.2.14 |
| `@types/react-dom` | 19.2.3 |

No se detectan dependencias no utilizadas ni faltantes evidentes.

---

## 21. Código No Utilizado (potencial)

- `src/app/hooks/auth/logout.ts`: Creado como hook separado pero `MenuPrincipal` tiene su propia lógica inline. Verificar si se usa realmente.
- `preloadImages` (función helper): Exportada desde `ImagePreloader.tsx` pero su uso directo no está confirmado.

---

## 22. Deuda Técnica Detectada

| Problema | Archivo | Descripción |
|---|---|---|
| API_URL_LOCAL hardcodeado | `src/lib/actions.ts` | Usa `NEXT_PUBLIC_API_URL_LOCAL` en lugar de ser environment-aware |
| API_URL_LOCAL hardcodeado | Varios hooks | `useInfinitePosts` hardcodea URL local |
| `.env` versionado | Raíz | `.env` está en git a pesar de `.gitignore` tener `.env*` |
| Sin scripts de lint | `package.json` | No hay `lint` ni `typecheck` |
| Sin tests | Proyecto | No hay cobertura de tests |
| Componentes grandes | `ImageModal.tsx`, `PosteoCard.tsx` | >300 líneas, mucha lógica inline |
| Hooks grandes | `useCrearPosteo.ts` | >250 líneas, maneja demasiado estado |
| Código comentado | Varios archivos | Fragmentos de código comentados en componentes |
| `any` usage | Types | Verificar en archivos específicos |

---

## 23. Problemas Conocidos y Limitaciones

1. **API URL no environment-aware**: `actions.ts` y varios hooks usan `NEXT_PUBLIC_API_URL_LOCAL` fijo. No cambian a producción automáticamente.
2. **Sin tests**: No hay cobertura de pruebas unitarias ni de integración.
3. **Sin lint/typecheck**: No hay scripts para verificar calidad de código.
4. **`.env` versionado**: Las variables de entorno están en el repositorio.
5. **Sin lazy loading**: Los modales no usan `React.lazy`/`dynamic` de Next.js.
6. **FavoritoProvider no está en root**: Se agrega manualmente en cada layout de ruta protegida, lo que puede causar duplicación.
7. **Hardcoded ads**: Los anuncios están hardcodeados en `PublicidadContext` en lugar de ser obtenidos de un CMS o API.

---

## 24. Convenciones del Proyecto

- **Nomenclatura de archivos**: PascalCase para componentes (`PosteoCard.tsx`), camelCase para hooks/utilidades (`useInfinitePosts.ts`, `handleChange.ts`)
- **Rutas**: Directorios en minúsculas con kebab-case para palabras múltiples (`crear-cuenta`, `ayuda-y-soporte`)
- **CSS Modules**: `NombreComponente.module.css` o reflejando la estructura de ruta
- **Contextos**: Nombre descriptivo + `Context`/`Provider` (`AuthContext`, `AuthProvider`)
- **Hooks**: Prefijo `use` (`useAuth`, `useInfinitePosts`)
- **Tipos**: Centralizados en `src/types/types.ts`
- **Imports**: Usan alias `@/` que resuelve a `src/`
- **Componentes**: Mayormente Server Components por defecto; solo se añade `'use client'` cuando es necesario

---

## 25. Glosario

| Término | Definición |
|---|---|
| **TlaxApp** | Nombre comercial de la aplicación |
| **Posteo** | Publicación individual (foto + texto opcional + ubicación) |
| **VAPID** | Protocolo para notificaciones push web |
| **Cloudinary Preset** | Conjunto predefinido de transformaciones de imagen |
| **fetchWithAuth** | Wrapper de fetch con manejo automático de autenticación |
| **ProtectedRoute** | Componente que redirige a login si no hay sesión |
| **AlreadyAuthRedirect** | Componente que redirige a inicio si ya hay sesión |
| **Route Group** | Grupo de rutas en Next.js App Router (paréntesis en el nombre del directorio) |
