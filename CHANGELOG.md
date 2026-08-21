# Changelog

Todos los cambios notables de este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

> **Nota sobre el versionado:** este repositorio **no cuenta con etiquetas de Git (`git tags`) ni versiones publicadas**, por lo que este archivo **no inventa números de versión**. Las secciones se organizan por **rangos de fechas** derivados directamente del historial de commits (de la más reciente a la más antigua), agrupando los grandes ciclos de trabajo del proyecto. La sección `[No publicado]` corresponde al ciclo de trabajo en curso (agosto de 2026). Al momento de generar este archivo el árbol de trabajo estaba limpio y la rama `desarrollo` estaba sincronizada con `origin/desarrollo`, por lo que **no hay cambios sin confirmar** que documentar.

---

## [No publicado] — 2026-08-04 a 2026-08-19 · Sistema de entregas de imágenes Cloudinary

Ciclo centrado en la infraestructura de imágenes: loaders propios de `next/image`, transformaciones de Cloudinary y hardening de la subida de imágenes.

### Añadido

- Loader personalizado para `next/image` (`src/lib/cloudinary/cloudinaryLoader.ts`) que evita que el optimizador de Next.js re-optimice las imágenes provenientes de Cloudinary. (`3d33f64`)
- Soporte de **DPR** (device pixel ratio) en `getCloudinaryUrl.ts` (transformación `dpr_`) y su tipo correspondiente en `types.ts`. (`849689e`, `2b22654`)
- Loaders especializados por contexto de renderizado — avatares de perfil y miniatura, feed, detalle, grid y modal de imagen — aplicados en los componentes que muestran imágenes. (`407af81`)
- Manejo del nuevo rate limiter `IMAGEN_BLOCKED` en `apiClient.ts`, devuelto por el backend cuando se abusa de la subida de imagen de perfil. (`8f9b367`)
- Helper `getUserMessage` para mensajes de error orientados al usuario, junto con un `console.error` para diagnóstico. (`9f850e5`)
- Variables de entorno para las imágenes de PUBLICIDAD en `PublicidadContext.tsx`. (`12766a5`)

### Cambiado

- Cambios de infraestructura en las transformaciones de imágenes en todos los componentes que las renderizan (avatares, posteos, notificaciones, modales, comentarios). (`34bda74`)
- Validación de imágenes subidas a **8 MB**, tipado TypeScript, centralización de avatares, fallbacks de `secure_url` hacia `obtenerImagenPerfilUsuario`, preloader y metadatos OG / Twitter (X). (`d8d0911`)
- Cap del loader del modal de imagen aumentado de 1400 a **1920 px**. (`ec2dd86`)
- Nueva forma de visualizar las imágenes del feed de inicio (`PosteoCard` + loader). (`c572c8e`)
- El modal de imagen se puede cerrar con la tecla **ESC** y se rediseñaron los estilos del botón de cerrar. (`a82f028`)
- Bloqueo del scroll del documento mientras el modal está abierto, restaurando el valor previo al cerrarlo. (`574b4d4`)
- Cloud name dinámico (variable de entorno) en `next.config.ts` en lugar de un valor fijo. (`61c7c21`)
- Implementación de los cambios del backend para la generación de URLs de usuario (**slugs**), incluyendo validaciones y tipos. (`97a207e`)
- Se quitó `image/jpg` de los tipos MIME permitidos al subir imágenes. (`b9e3846`)
- Limpieza menor de lógica en `useCrearPosteo`. (`6f33528`)

### Eliminado

- Componente `ImagePreloader` y sus importaciones. (`09b7331`, `c233789`)
- Documentación antigua, reemplazada por los nuevos documentos de endpoints y especificaciones. (`470a10c`)

### Documentación

- Documentación completa de **ENDPOINTS** y del archivo **SPECS-CAMBIOS-IMG**. (`eb7cd2d`)
- Especificaciones de subida de imagen (backend). (`b3e4449`)
- Actualización de AGENTS.md y de los comentarios históricos sobre el "bug" de imágenes rotas. (`9c7af65`, `867e50f`)

---

## 2026-07-07 a 2026-07-30 · Cliente API central y manejo estandarizado de errores

### Añadido

- Cliente API central `src/lib/apiClient.ts` (con métodos tipo `apiGet`, `apiPost`, etc.), al que se migraron todas las llamadas HTTP de la aplicación. (`86058ab`)
- Optimización de likes con los campos `hasLiked` y `likesCount` por posteo. (`65670b6`)
- Tipo `ApiErrorCode` y tipos adicionales para el manejo de errores y mensajes. (`59ed0da`, `13a0b06`)
- Especificaciones de **Error Handling** y archivo `SPECS.md` con los cambios del backend (verificación de cuenta y formato de respuesta). (`030f644`, `9abde9e`)
- **POLLING cada 60 s** para refrescar cambios en Nuevos Usuarios. (`0086c05`)
- Configuración y reporte del agente de **auditoría de dependencias**. (`27e3e69`, `8440eb7`, `38e8f24`)
- Configuración del agente escritor de changelog. (`d2eedf2`)
- Documentación de endpoints del backend y del proyecto. (`7d28712`, `a6da697`)

### Cambiado

- Todas las peticiones HTTP pasan por `handleApiResponse` en `apiClient.ts`, garantizando que los errores HTTP se manejen como `ApiError` con `status` y `data` consistentes. (`6132a83`)
- Migración del manejo de errores: `status` → `code` y `data.msg` → `data.detail`, con tipado de `ApiErrorData` y manejo de `NOT_FOUND`. (`b071a07`)
- El detalle de posteo (`posteo/[idposteo]`) ahora es **público**: no requiere autenticación, mediante los nuevos componentes `PosteoPageClient` y `PosteoPublicoCTA`. (`b1efeaa`, `ac46715`)
- Migración al formato de respuesta exitosa **estándar** del backend en toda la app. (`3683d45`)
- Se distingue entre casos esperados (usuario no existe, 404/`VALIDATION_FAILED`) y errores reales (red, 500, etc.). (`aedc687`)
- Se quitó `limit: 15` para que la API use su valor por defecto de 20. (`7b93f11`)
- Mensajes actualizados para las páginas `notFound()`. (`5c18db1`, `27142de`)
- Campo `uid` reemplazado por `_id`. (`3eb54cb`)
- Actualización de AGENTS.md con la sección de ERROR HANDLING. (`642d709`, `a714af8`)

### Corregido

- Bug de actualización de contraseña, con nuevo indicador de requisitos (`PasswordRequisitos`). (`07f7eed`)

### Eliminado

- Documentación antigua de APIs y de backend. (`47b9643`, `c7ac9df`, `80ee513`)
- Archivo TODO con tareas terminadas. (`2692f51`)

### Infraestructura

- Actualización de **Next.js**. (`8a92545`)
- Actualización de paquetes y de **TypeScript** a la última versión estable. (`0a483e0`)
- Declaración del package manager y aclaración de que no es un monorepo en `package.json`. (`b6c1ab2`)

---

## 2026-06-01 a 2026-06-29 · Agentes de OpenCode, auditorías y renombres de campos

### Añadido

- Agentes de **OpenCode** para contexto de IA (creación de AGENTS y subagente de auditoría). (`c1ad0d8`, `639b7eb`, `080a9b7`)
- Plantilla de `.env` y auditorías generadas a partir del subagente de auditoría. (`a463127`)
- Documentación del proyecto. (`190f335`)

### Cambiado

- Renombres de campos para alinear con el backend: `autor` → `autorId` y `_idPosteo` → `posteoId`. (`e973ea3`, `aa3d1dd`, `567c2a4`, `b023413`)
- Validación de contraseña reforzada: **8 caracteres con mayúscula, minúscula y números**. (`3df75bf`)
- Mensajes del frontend actualizados. (`7f79107`)
- Renombrado de variable de entorno y de la carpeta `.opencode` → `opencode`. (`ab6b4d9`, `71281c1`, `71918b4`)

### Eliminado

- Archivos de reportes y archivos `.md` obsoletos. (`9adce9e`, `1e4c1f8`)

### Infraestructura

- `pnpm-workspace.yaml` añadido tras la migración a la versión actual de pnpm. (`25bad4b`)

---

## 2026-04-06 a 2026-05-26 · Comentarios en posteos, ubicación GPS y actualización de dependencias

### Añadido

- Funcionalidad de **comentarios en posteos**: componentes, estilos y validaciones. (`b6a5932`, `17bd60a`, `136c6af`)
- Página **que-es-tlaxapp**. (`82c2522`)
- Agente para contexto de IA. (`b896089`)
- Alertas/warnings para **rate-limits** en formularios y creación de posteos. (`7c60ef6`)
- Propiedad `coordinates` en la interface `Posteo` para la ubicación GPS. (`15a372f`)

### Cambiado

- Obtención de la ubicación del usuario al editar posteo: coordenadas **lat/lng**, detección automática o manual según el usuario. (`60c9740`, `5d16176`, `3796ff3`, `2a5e8e5`)
- Texto opcional a la hora de editar un posteo. (`dba4bf4`)
- Propiedad `sizes` en imágenes de Editar Perfil. (`985ef41`)

### Corregido

- Bugs tras la actualización de **Zod** (`errorMap`/`error` → `errors`/`issues`). (`f7ae4cb`)
- Problemas de renderizado de nuevos usuarios. (`9120564`, `b9dda28`)
- Problemas de scroll infinito en el perfil de usuario al cargar los posteos. (`ed8a54b`)
- Bug al cambiar la imagen de perfil y reabrir el modal: mostraba la imagen anterior. (`10231d6`)
- Problema con la imagen de perfil en el modal de imagen de la página de perfil. (`0d7b11f`)

### Eliminado

- Variables de `localStorage` y `sessionStorage` al iniciar sesión. (`5b66154`, `103cc9e`)

### Infraestructura

- Actualización de paquetes a las últimas versiones. (`aef29a2`)
- Migración de archivos CSS a **CSS Modules**. (`71a1548`, `2235d9a`)

---

## 2026-02-02 a 2026-03-19 · SEO, accesibilidad y páginas informativas

### Añadido

- **SEO** completo: metadatos por página, `sitemap`, `robots`, og-image y documentación asociada; se eliminaron layouts intermedios para facilitar la generación de metadatos. (`2b16a4b`, `f6ebb89`, `0782ae9`, `01d008b` y commits relacionados)
- Página de **FAQ / preguntas frecuentes** (layout y page). (`58a37a8`, `76e4096`)
- Página de **ayuda y soporte** con validación del formulario. (`4170e71`, `190c954`)
- Favicon/ICO de TlaxApp para la pestaña de navegación. (`ff6a7f5`)
- Links de términos y condiciones, privacidad y contacto en ayuda y soporte. (`340fc31`)
- Link a preguntas frecuentes en el menú interno de la app. (`1cb1ac6`)
- Validación de extensiones de imagen al subir en `validaciones.ts`. (`185e930`)

### Cambiado

- Slogan cambiado a **"La red social de Tlaxcala."** (`0788acb`)
- Se muestra el nombre de usuario como URL en lugar del nombre completo en toda la app. (`34840a8`)
- `FollowProvider` centralizado solo en el layout principal para sincronizar el estado de follow. (`d23d1b5`)
- Límite de favoritos ahora lo decide el backend (se quitó el límite estático). (`b1626b9`)
- Icono de la web push notification cambiado por el de TlaxApp. (`556ed9f`)
- Longitud mínima de la contraseña cambiada de 6 a **8 caracteres**. (`142b59e`)
- `FormEvent` reemplazado por `SubmitEvent` en formularios de perfil. (`929d232`, `9bdb91e`)
- `loading=eager` para la carga inmediata de imágenes en la página de inicio. (`fc60c72`)
- Correos de contacto oficiales de TlaxApp. (`dd71e6e`, `d90d02b`)
- Botón para cerrar sesión eliminado del menú principal. (`77fa4ec`)
- `handleShare` refactorizado para compartir publicaciones. (`328458b`)

### Corregido

- Corregido ~60 % del problema de reescalado de imágenes en la página de inicio. (`8ff38d6`)
- Correcciones al `AuthContext` para sesiones de usuario abiertas. (`6b03641`)
- Corrección de la URL de la og-image para SEO. (`4152c7f`)
- Corrección de links internos. (`19df444`)
- Mejoras al `ProtectedRoute`. (`6514d93`)

### Infraestructura

- Actualización de **React y Next.js** a las versiones más actuales. (`f81db7d`)
- Mejoras de **rendimiento, accesibilidad (aria-label, role, alt) y optimizaciones** generales. (`1ed5215`, `84629e0`, `4eb3852`, `1a7dc05`, `66430ea`)

---

## 2026-01-23 a 2026-01-30 · Identidad TlaxApp y páginas legales

### Añadido

- Página de **contacto**. (`44d3209`)
- Páginas de **política de privacidad** y **términos y condiciones de servicio**. (`1092bb6`)
- Icono oficial de TlaxApp (assets) aplicado a la app y a la página de bienvenida. (`10510e5`, `90ca740`, `1959b82`, `4aeabc3`)

### Cambiado

- Rediseño de la página de cuenta-verificada. (`996ae85`)
- Longitud mínima de la contraseña extendida a 8 caracteres. (`0c6d8f7`)

---

## 2025-12-08 a 2025-12-19 · Seguridad, ubicación en posteos y eliminación de cuenta

### Añadido

- Página para **eliminar la cuenta de usuario**, con su componente y la función (endpoint) para hacerlo. (`15825b7`, `81c2f22`)
- Página `not-found` usada en `PosteoDetalle` cuando se busca un posteo que no existe o fue eliminado. (`290fce3`)
- **Ubicación en posteos**: obtención automática por GPS mediante el hook `useObtenerUbicacion` y **selector manual de municipio** (`ManualMunicipioSelector` con interface `DatosUbicacion`). (`f3f1274`, `baf3c98`, `9c2b0f4`, `d123997`, `d1abab6`)
- Mostrar la ubicación del posteo en el diseño de `PosteoCard`. (`5f18638`, `5efb797`)
- Propiedad `municipio` en la interface `Posteo.ubicacion`. (`88d2183`)

### Cambiado

- Rebranding: **"Tlaxcala en Imágenes" → "TlaxApp"** en los textos de la app. (`3b1c932`, `4a61635`)
- Correo electrónico visible en editar perfil (solo lectura). (`2ab3c62`, `2458793`)
- Callback `onPostUpdated` para re-renderizar la información del posteo al actualizarlo. (`db70dab`, `ce26763`, `2e87570`)
- Toasts para errores/éxitos en formularios en lugar de listas de errores. (`ee7ddce`)
- Imagen de perfil por defecto referenciada por variable de entorno. (`09137c6`)
- Validación Zod para actualizar una publicación. (`ffcbe8f`)

### Corregido

- Distorsión del preview de imagen al actualizar la imagen de perfil. (`aac8d35`)

### Infraestructura

- Parche de seguridad de Vercel para **Next.js/React Flight RCE** (actualización de Next.js). (`d4f95a7`, merge `56eb608`)

---

## 2025-10-27 a 2025-11-25 · Web push, notificaciones, favoritos y modales de seguidores

### Añadido

- **Web push notifications**: service worker (`public/sw.js`), funciones de suscripción y envío. (`a0dd73a`, `5fb4d0f`)
- Página de **Notificaciones** con activar/desactivar y componente de configuración. (`6b0a751`, `7d3140e`, `a5c987a`)
- `NotificacionesContext`: contexto global con conteo de notificaciones no leídas en tiempo real y eliminación de notificaciones. (`e57dc8e`, `8e822bf`, `3e79ece`)
- Paginación de notificaciones con **agrupación por fecha** (hoy, semana, este mes). (`48875ab`)
- Página de **Favoritos** con los posteos guardados por el usuario y opción de eliminarlos. (`f24249c`, `5205e4d`)
- **Edición de posteos**: modal, esquema Zod y función para editar publicaciones propias. (`0c52e82`, `bf3d648`, `a3cc231`, `6cf5e6f`)
- Modales de **seguidores y seguidos** del usuario (interfaces `FollowerUserItemProps` y `FollowingUserItemProps`). (`ae3b5fe`, `1644890`)
- `NuevosUsuariosContext` para el estado global de nuevos usuarios registrados; el componente "Imágenes más votadas" fue sustituido por **NuevosUsuariosRegistrados**. (`8ccb2f5`, `cfc2791`, `337e561`)
- `PublicidadProvider` para el estado global de la publicidad, añadido al layout principal. (`ec28e48`, `fa3c487`)

### Cambiado

- Imagen de perfil en notificaciones con fallback a imagen por defecto. (`58a483f`)
- Propiedad `imagenUrl` eliminada de `FavoritoButton`, `FavoritoContext` y `FavoritoButtonProps`. (`eeb5145`, `9d63c90`, `ea00c99`, `6ae5d58`)
- Links a seguidores, seguidos y favoritos desde el menú. (`718a2fa`)
- Notificaciones leídas se descuentan en tiempo real al marcarlas con clic. (`0706734`, `e3e9c64`)

---

## 2025-09-29 a 2025-10-24 · Creación de posteos, perfil configurable y URLs dinámicas de Cloudinary

### Añadido

- **Crear posteos**: modal, función de creación y validación Zod (texto con máximo de caracteres y tipo de imágenes). (`7ae9f63`, `fc4ba46`, `072f806`, `63b6043`)
- Función para **tomar fotografía desde el móvil**. (`080cd16`)
- Helper `getCloudinaryUrl.ts` para construir **URLs dinámicas de Cloudinary** con presets según el contexto, junto con la interface `CloudinaryCustomOptions`. (`734fedf`, `0e9dd1e`, `ec4209a`)
- Función `obtenerImagenPerfilUsuario` para resolver si el usuario tiene imagen de perfil o se usa la imagen por defecto. (`c609386`, `33a2789`)
- Página de **configuraciones** y de **editar perfil** (hooks, formularios y estilos). (`75966f7`, `825f655`, `8f83900`, `e2003ca`)
- Modal para **cambiar la imagen de perfil** con actualización del estado global (`updateUser`). (`a1b4d04`, `ca31faf`, `c9600cc`, `da7da35`)
- **Eliminar publicación propia** con actualización del número de publicaciones del usuario. (`b8e1d7c`, `70098ef`)
- Componente **Toast global**. (`9c9b4bb`)
- `not-found.tsx` para perfiles de usuario inexistentes. (`06af726`)
- Validaciones al subir imagen de perfil. (`bea9a15`)
- **Scroll infinito** en el perfil de usuario con paginación. (`623e5e7`)

### Cambiado

- Renderizado de imágenes migrado de `secure_url` a **`public_id`** con presets responsivos de Cloudinary (modal, feed, menú principal, grid del perfil). (`4de6066`, `8b97905`, `91c8247`, `fd92dc1`, `87a8332`)
- Publicaciones del perfil paginadas. (`60bec6c`)
- Extensión **.png** permitida para subir imágenes a posteos. (`77b05b0`)
- Interfaces centralizadas en `types.ts` (CloudinaryPreset, LikeUsuario, props de modales). (`b3068c1`, `8a48870`, `7619562`)

### Corregido

- El modal se quedaba abierto después de crear un posteo. (`72507b5`)
- Doble llamada de posteos en la página de inicio que duplicaba las publicaciones. (`0f219dc`)

---

## 2025-08-13 a 2025-09-26 · Feed público, scroll infinito, likes y contexto global

### Añadido

- `fetchWithAuth` en `AuthContext`: actualiza el `accessToken` antes de cada petición cuando ha expirado. (`7206ef7`, `7c14ea3`)
- Feed de inicio con los **posteos de todos los usuarios** e **scroll infinito** con hook propio. (`5794f64`, `1ec6c6b`, `2e0cdf5`, `bef9e75`)
- **Likes a publicaciones**: función, contador de me gusta y modal con los usuarios que dieron like (interfaces `LikeUsuario`, `LikesUsuarioResponse`). (`fd1898d`, `4dd93ef`, `9d9533d`)
- Componentes y hooks de **seguir usuario** (`FollowButton`, `useFollow`) y **favoritos** (`FavoritoButton`). (`7092f55`, `4ca4ca9`, `f959f63`, `17fc1bf`)
- Página **posteo/[id]** (`PosteoDetalle`) con la interface `PosteoDetalleResponse`. (`cb66ada`, `23cff1d`, `9c68b9d`, `0e2d1b8`)
- Componente reutilizable **`PosteoCard`** para detalle y perfil. (`2253593`, `5acf311`)
- Página de **perfil de usuario** con su información y botón seguir/dejar de seguir. (`476f999`, `e69f44c`, `15ba3cc`)
- `FollowContext` y `FavoritoContext` para manejar de forma global el estado de seguir y favoritos (reemplazan a los hooks locales `useFollow`/`useFavorito`). (`628506f`, `2062325`, `1dec7d9`, `334e555`)
- Animaciones con **framer-motion** en modales y overlay de publicaciones. (`25ac59c`, `3b2f78f`)
- Spinner de carga de posteos. (`73536b6`, `aa83ff5`)

### Cambiado

- `next.config.ts` configurado para permitir imágenes remotas de Cloudinary. (`c3c75c8`)
- Etiquetas `<a>` sustituidas por el componente `Link` de Next.js en navegación interna. (`4283255`, `cbcc6e2`, `aa83ff5`, `d1df808`)
- URL del perfil de usuario simplificada a la URL principal más la url del usuario. (`f6bdcd0`, `24fd5d0`)
- Endpoints actualizados (incluye `api/likes`). (`e69f44c`, `8afd8df`, `8c22ffe`)

### Corregido

- Los likes del usuario con sesión activa no se marcaban correctamente. (`f7e6035`)

---

## 2025-03-03 a 2025-06-06 · Registro, verificación y restablecimiento de contraseña

### Añadido

- Validación de formularios con **Zod** y **react-hook-form** (`@hookform/resolvers`). (`d3c2ed7`, `f4511bd`, `a199f08`)
- Creación de usuario contra la API con redireccionamiento. (`1df79c9`, `1f4f4eb`, `aca3b15`)
- Flujo de **contraseña olvidada**: envío de correo, session storage y reenvío de correo con contador de 5 minutos. (`4ebcdf7`, `2537be0`, `51115fa`, `34c7b46`, `4aa3ef8`)
- Verificación de cuenta por **token** en rutas `[token]` con páginas de loading. (`cb17450`, `4823aca`, `5287039`, `c8ed322`)
- Restablecimiento de contraseña: formulario, esquema de password y validación del token. (`beac9a9`, `2d44050`, `83b6a5a`, `0c96abc`)
- **AuthContext** con hook `useAuth`, `ProtectedRoute` y `AlreadyAuthRedirect` (protección inversa para usuarios ya autenticados). (`45159e8`, `a131239`, `df228ad`, `e725a82`, `51cf0e0`)
- Manejo de sesión con **cookies** (`credentials: include`) y refresh de token ante 401. (`ad4a7c7`, `e242f2c`, `03f1d8c`)
- Componente **Spinner** para la carga de sesión. (`0f51a5f`, `6f72fcb`, `580d57f`)
- Dropdown de sub-menú "más opciones" con **cierre de sesión** y modal de confirmación (hook `useCerrarSesion`). (`caa6a5f`, `fea7cf3`, `c7859f3`, `79d1934`)
- Extracción del usuario de `useAuth` para mostrar su información en el frontend. (`a64d732`)

### Corregido

- Reenvío de correo al crear cuenta cuando el JWT expira (`jwt expired` en respuestas 500). (`841dae3`, `ee2f702`)

---

## 2025-01-07 a 2025-02-26 · Página de inicio, perfil de usuario y modales

### Añadido

- Página de **inicio**. (`e1f5995`)
- **Menú principal** de la app, header superior "Tlaxcala en Imágenes" y componente de publicaciones de usuario. (`827a356`, `a59441f`, `a313ac6`)
- **ModalOpciones** (opciones de cada publicación) y **grid de imágenes del usuario** con el modal que se abre al hacer clic en una imagen. (`0c39aca`, `6fd2197`, `6d81882`)
- Página **perfil/perfil de usuario** con componente de información del perfil. (`f19ac8c`, `e84489e`, `a706630`)
- Sección de **sugerencias**: imágenes más votadas, publicidad y footer de sugerencias. (`bd4bd9b`, `a313ac6`, `c73bf5d`)
- Página **not-found** y página global de **error**. (`513fb21`, `fd1d776`)
- Variable `link-activo` y estilos para el link activo del menú. (`622f10c`, `8ebf948`)

### Cambiado

- Migración de estilos a **CSS Modules** en todo el proyecto. (`eb91818` y ~40 commits de febrero)
- Estilos globales de header, footer, inicio y perfil. (`a964ccb`, `d246238`, `be7e595` y commits de estilos)

---

## 2024-11-21 a 2024-12-18 · Creación del proyecto

### Añadido

- Proyecto inicial creado con Create Next App y primeras configuraciones. (`f85ad16`, `a195a7e`)
- Proyecto **Tlaxcala en Imágenes**. (`a9edc32`)
- Páginas de **iniciar sesión**, **crear cuenta** (layout anidado), **contraseña olvidada**, **correo enviado**, **password restablecido** y **cuenta creada**. (`5bb5b6a`, `eed2ded`, `060045c`, `5ba9d8d`, `5af86cc`, `7636fbf`, `407274b`, `0551b3f`)
- Componentes **HeaderPrincipal** y **FooterMain**, con `Link` de Next.js en el footer. (`d57e721`, `cae2062`, `504d812`, `9bf0c4e`)
- Dependencias `react-icons` y `react-dialog` para iconos y modales. (`fee03e1`)
- Componente dinámico para crear cuenta y restablecer password. (`3db81eb`)

---

*Generado el 2026-08-20 a partir del historial de Git: 819 commits (incluyendo merges) del 2024-11-21 al 2026-08-19. Autor principal: Paúl Pichón (más un commit de Vercel). Los commits puramente cosméticos (estilos, renombres menores, ajustes de comentarios y pruebas de despliegue) se resumieron o omitieron de forma intencional.*
