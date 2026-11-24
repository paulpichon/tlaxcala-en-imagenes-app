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
  - **Modelo de sesiones (rediseño Fase E, desplegado 2026-11-17):**
    - Cada login crea una sesión en el servidor (`sid` en los tokens) y cada request la valida.
    - Cerrar una sesión corta su access token al instante.
    - La sesión dura como máximo 90 días.
    - Contrato completo: `SPECS/SPECS-FRONTEND-SESION-Y-CONTRATOS.md` §3. Decidir siempre por `code`, nunca por `detail`.
  - **Refresh:**
    - Se serializa entre pestañas con un Web Lock (`tlaxapp:auth-refresh`), además del mutex en memoria, para no gastar `refreshLimiter` (10 / 15 min).
    - Un `409` del refresh significa que otra petición ya renovó (gracia de 30 s): se espera y se reintenta una vez (F4).
    - Ya no existe la «sesión comprometida» que revocaba todas las sesiones.
  - **Códigos sin refresh** (`CODIGOS_401_SIN_REFRESH`): `TOKEN_EXPIRED`, `INVALID_CURRENT_PASSWORD` y `SESSION_REVOKED`.
  - **Cierre forzado:**
    - `401 SESSION_REVOKED` o `403 ACCOUNT_RESTRICTED` en cualquier respuesta (incluido el refresh) → `cerrarSesionPorMotivo`.
    - Esa función limpia el estado, guarda `motivoCierreSesion` en `sessionStorage` (el login lo muestra una vez) y llama a `POST /api/auth/logout`, sin esperar el resultado, para borrar las cookies httpOnly.
    - Al volver a la pestaña se revalida con `GET /api/auth/me`, como máximo una vez cada 30 s.
  - **Qué nunca cierra la sesión:** un fallo de **red**, un `5xx` (incluido el `500` por fallo de BD al validar la sesión) o un `429`. Se conserva la sesión y se expone `error`/`clearError` en el contexto. Solo `401`/`403` del refresh o los códigos de cierre forzado cierran sesión.
  - **`logout()`:** limpia además las claves de `sessionStorage` ligadas a la sesión (`registroToken`, `passForgetToken`, `passwordResetSuccess`, `reporteExitoso`, `motivoCierreSesion`).
  - **Step-up con `passwordActual`:**
    - Pantallas: cambiar contraseña (`PUT /api/usuarios/password`, `/configuracion/cambiar-password`), eliminar cuenta (`DELETE /api/usuarios/delete`) y cerrar las demás sesiones (`DELETE /api/auth/sesiones/otras`).
    - Las tres comparten el límite `429 PASSWORD_BLOCKED` (5 / 15 min).
    - `PUT /api/usuarios/update` ya no acepta `password`.
  - **Sesiones activas** (`/configuracion/sesiones`, `useSesionesActivas`):
    - `GET /api/auth/sesiones` y `DELETE /api/auth/sesiones/:sessionId` (un `404` = ya cerrada, no es error).
    - Cupo `429 SESIONES_BLOCKED` de 30 / 15 min: la lista se carga solo al montar o tras una acción.
    - La sesión actual no tiene botón de cierre: se usa el logout normal.
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
- Pantallas con `HeaderSuperior` (`sticky-top`, 56 px): la raíz usa `min-vh-100`, nunca `vh-100` (fija la altura y el contenido extra se sale del borde) ni `overflow-auto` propio (doble scroll). Un título fijo de la pantalla va con `position: sticky; top: 56; zIndex: 1010` (ver `/notificaciones` y `/configuracion/notificaciones`).
- No test infrastructure at all
- Documentation management: see section `## Gestión documental` below
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

## Notificaciones (push y `/notificaciones`)

Seguimiento del rediseño del backend: `reports/plans/2026-11-18-plan-notificaciones-backend.md`.

- **Service worker** (`public/sw.js`): payload estándar del backend `{ title, body, icon, badge, tag, url, data: { tipo, ... } }` (`url` va en el nivel raíz).
  - Llama a `showNotification` en **cada** push, aunque el payload venga vacío o inválido: iOS revoca la suscripción si recibe pushes silenciosos. No añadir ramas que omitan la notificación.
  - `tag` reemplaza la notificación anterior con el mismo tag (`renotify: true`). `icon` por defecto: asset local `/assets/icono-tlaxapp-beige.png`.
  - `url` solo se abre si es del mismo origen (si no, la raíz). `notificationclick` reutiliza una ventana abierta (`focus` + `navigate`) antes de abrir otra.
- **Tipos en `/notificaciones`:** `follow` navega al perfil del emisor; `comentario` navega a `/posteo/<referencia._id>` (si `referencia` es `null` solo se marca como leída); `posteo_eliminado_moderacion` no navega (ver Moderación). `like`, `nueva_publicacion`, `reporte_*` y `sistema` aún no se renderizan (Fases 3 y 6 del backend).
- **Acciones en `/notificaciones`** (`useNotifications`, Fase 5): «Marcar todas como leídas» (`PATCH /marcar-todas-leidas`), «Eliminar todas» (`DELETE /api/notificaciones`, con confirmación; no se deshace desde la app) y filtro por tipo (`?tipo=`). Las acciones masivas aplican a todas, no solo al filtro. Eliminar una es soft delete: un `404` cuenta como éxito. El backend borra físicamente las leídas a los 90 días, las no leídas a los 180 y las eliminadas a los 30, así que las muy antiguas desaparecen sin aviso.
- **Suscripción:** `POST /api/notificaciones/subscribe` es idempotente (mismo `endpoint` actualiza y reactiva `notificaciones_activadas`); máximo 10 dispositivos por usuario. Si `notificaciones_activadas` llega en `false`, mostrar el botón de activar.
- **Activación** (`usePushNotifications` + `ConfiguracionNotificaciones`, `af4a5c6`): estados `cargando`, `no_soportado`, `instalar_pwa`, `permiso_pendiente`, `bloqueado` y `activo`.
  - Web Push en iOS solo funciona con la **PWA instalada** (iOS 16.4+); por eso existe `src/app/manifest.ts` (`display: standalone`) y `appleWebApp`/icono de Apple en `layout.tsx`. En una pestaña de Safari `PushManager` no existe.
  - El SW se registra y la clave VAPID se precarga **al abrir la pantalla**; dentro del click, `Notification.requestPermission()` es la **primera operación asíncrona** (iOS la ignora tras `await`s largos o en un `useEffect`). No reordenar.
  - Si `POST /subscribe` falla, se hace `subscription.unsubscribe()`. La confirmación usa `registration.showNotification` (`new Notification()` no existe en móviles).
  - Con permiso `denied` no se puede volver a pedir: se muestran instrucciones (Ajustes > Notificaciones > TlaxApp en iOS).
  - Al abrir la pantalla se pide `GET /api/notificaciones/estado` y se reconcilia con `SHA-256(endpoint)` contra `dispositivos[].endpointHash` (`hashEndpoint` en `src/lib/dispositivos.ts`). Si hay suscripción local y el backend no la tiene, se repite `POST /subscribe` (idempotente); si `/estado` falla se repite a ciegas. Sin polling: solo al montar y tras cada acción.
  - Lista «Dispositivos con notificaciones» en `ConfiguracionNotificaciones`: el dispositivo actual (`esEste`) se gestiona con el interruptor; los demás se cierran con `DELETE /api/notificaciones/dispositivos/:id` (`404` = ya cerrado).
- **PWA en iOS** (`src/lib/pwa.ts`, `public/assets/splash/`, `public/assets/pwa/`):
  - iOS **ignora** `background_color` y los iconos del manifest al abrir la PWA; sin una imagen `apple-touch-startup-image` que coincida exactamente con la pantalla, muestra solo blanco. Hay 22 imágenes (logo beige sobre blanco, solo vertical) declaradas con `appleWebApp.startupImage`. Un modelo nuevo de iPhone/iPad (o el modo horizontal) cae en blanco: añadir su fila en `src/lib/pwa.ts` y su PNG de `ancho*dpr` × `alto*dpr`.
  - `apple-touch-icon` de 180×180 **opaco** con fondo blanco (el PNG transparente se veía sobre negro). El manifest declara iconos 192, 512 y maskable para Android.
  - Los PNG se generan con `sharp` a partir de `icono-tlaxapp-beige.png`; `sharp` no es dependencia directa, así que el script no vive en el repo. Si cambia el logo hay que regenerarlos. iOS guarda estos recursos al instalar: para verlos hay que quitar la app de inicio y volver a añadirla.
- **Verificado en iPhone** (2026-11-19/20): instalar la PWA, activar, y recibir push de seguir y comentar funcionan.
- **Preferencias por tipo y canal** (Fase 4, `usePreferenciasNotificaciones` + tarjeta «Qué te avisamos» en `ConfiguracionNotificaciones`):
  - `GET /api/notificaciones/preferencias` al montar y `PUT` parcial por interruptor (p. ej. `{ "push": { "follow": false } }`). El backend responde siempre las preferencias completas.
  - Solo afectan al push y al correo; `/notificaciones` siempre muestra todo. No existen `correo.like` ni `correo.nueva_publicacion`.
  - El cambio es optimista y se revierte si el `PUT` falla. Solo hay un `PUT` en curso a la vez para que dos respuestas desordenadas no reviertan otro cambio.
  - Hook independiente de `usePushNotifications`: el correo vale sin soporte de push, y `/estado` (que también trae `preferencias`) se recarga tras cada acción de push.
  - Un `404` en el `GET` oculta la sección (backend sin la Fase 4).
  - `TIPOS_PREFERENCIA` solo lista `follow` y `comentario`. `like` (Fase 3), `nueva_publicacion` y `sistema` (Fase 6) se añaden al implementarse. Moderación no lleva interruptor: no se puede silenciar.
- **Verificado en producción** (2026-11-23): preferencias de la Fase 4 con el backend desplegado.
- **Pendiente:** Fases 3, 6 y 8 del backend (likes agrupados, tipos nuevos, contrato final); ver plan de seguimiento.

## Error Handling

- **All API calls must go through `src/lib/apiClient.ts`** (`apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`). Raw `fetch` is only allowed inside `fetchWithAuth`.
- The backend returns RFC 9457 error objects with `code`, `detail`, `status`, etc. Use the helpers exported by `apiClient.ts`:
  - `isApiError(err)` / `getApiErrorCode(err)` / `getApiErrorMessage(err, fallback)`
  - `isNotFound(err)`, `isUnauthorized(err)`, `isForbidden(err)`, `isValidationFailed(err)`, `isRateLimit(err)`
- Never compare error message strings (e.g. `error === "La publicación no fue encontrada"`) to decide UI behavior like `notFound()`. Use boolean flags (`isNotFoundError`) or the error-type helpers from `apiClient.ts` instead.
- **Never use `data.status` from the response body to decide if a request failed.** The source of truth is `res.ok`, handled inside `handleApiResponse`.
- Data-fetching hooks and contexts should expose `{ error: string | null; clearError: () => void }` so UI components can display failures consistently.
- Anti-enumeration endpoints (e.g. password recovery) return a generic 200 message on purpose; do not add frontend checks that reveal whether an email/account exists.

## Gestión documental

Sistema de documentación del proyecto. Dos zonas con roles distintos:

- **Oficial / referencia** (vigente, nunca se auto-archiva ni auto-elimina): `README.md`, `CHANGELOG.md`, `AGENTS.md`, `QUE-ES-TLAXAPP.md`, `QUE-NO-ES-TLAXAPP.md`, `SPECS/`, y **`docs/api/`** (referencia completa de endpoints del backend).
- **Trabajo** (`reports/`): documentos generados durante desarrollo (análisis, planes, auditorías, snapshots de `documentador`). Histórico archivado en `reports/archive/`.

### Dónde guardar documentos (agentes IA)

| Tipo de documento | Ubicación | Nombre |
|---|---|---|
| Plan de implementación / fix | `reports/plans/` | `YYYY-MM-DD-plan-{tema}.md` |
| Code review | `reports/code-reviews/` | `YYYY-MM-DD-code-review-{tema}.md` |
| Bug investigation | `reports/bug-investigations/` | `YYYY-MM-DD-bug-{tema}.md` |
| Hallazgos de análisis puntuales | subcarpeta de `reports/` existente (ej. `technical-analysis/`) | `YYYY-MM-DD-{tipo}-{tema}.md` |
| Especificación vigente (contrato estable) | `SPECS/` | `SPECS-FRONTEND-{tema}.md` con `Fecha` y `Estado` en el cuerpo — **requiere aprobación humana** |

- Nunca escribir a la raíz del repo ni modificar documentación oficial sin autorización explícita del humano.
- No eliminar ni sobrescribir documentos existentes: crear uno nuevo (agregar fecha) o actualizar `status` del front matter. Archivar/eliminar requiere autorización explícita.

### Front matter obligatorio (documentos de `reports/`, excluye `docs/api/` y los subagentes de OpenCode que ya definieron su propio formato)

```yaml
---
title: "Título descriptivo"
type: plan            # plan | code-review | technical-analysis | bug-investigation | feature-spec | dependency-auditor
status: working       # working → completed → archived
created: "YYYY-MM-DD"
---
```

Opcionales: `completed`, `expires` (retención 90 d para plans, 180 d para análisis), `related`, `branch`.

### Reglas de vigencia

- El registro canónico de cambios termina en `CHANGELOG.md`; los documentos de `reports/` son evidencia/complemento.
- `docs/api/` es la única fuente de verdad del contrato del backend. No generan reemplazos de esa referencia salvo solicitud del humano.
- Un hallazgo estable que afecta contratos va a `AGENTS.md` o a un spec vigente de `SPECS/` (con aprobación humana), no queda solo en un reporte.
- Snapshots de `documentador`: como máximo 2 vigentes + archivadas en `reports/archive/documentador/` (con revisión humana al archivar).
- Antes de reanalizar un tema, consultar `reports/archive/` y la corrida más reciente de `reports/` — puede que ya esté estudiado.
