Fecha y hora de la auditoría: 2026-06-22 12:00:00
Alcance analizado: Auditoría completa del frontend TlaxApp (Next.js 16 + React 19 + TypeScript 6)

---

# 📊 Informe de Auditoría Técnica

> Fecha y hora: 2026-06-22 12:00:00
> Alcance: Auditoría completa — frontend TlaxApp cotejado contra DOCUMENTACION.md, DOCUMENTACION-BACKEND.md, API.md y código fuente real

---

### 🗂️ Manifiesto de Cobertura (obligatorio)

* **Archivos inventariados en el alcance:** ~85 archivos fuente (`.ts`, `.tsx`, `.js`, `.jsx`, `.css`)
* **Archivos efectivamente analizados:** 38 archivos abiertos y leídos en profundidad (todos los contextos, hooks, componentes compartidos, librerías, layouts, types, validaciones, configuraciones)
* **Carpetas excluidas y motivo:** `node_modules/`, `.next/`, `build/` — directorios generados/vendor. `public/assets/` — solo activos estáticos sin lógica. Carpeta `login-autenticacion/` (backend) no existe en este workspace; se usó DOCUMENTACION-BACKEND.md como fuente.
* **Patrones de búsqueda utilizados para detección de llamadas a API:** `fetch(`, `fetchWithAuth(`, `process.env.NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_URL_LOCAL`, `/api/`
* **Carpetas/módulos pendientes de revisión en esta ejecución:** Ninguno. Se cubrió la totalidad del árbol `src/`.

---

### 📊 Project Health Status

El frontend presenta una desalineación crítica con los estándares de producción debido principalmente al **hardcoding de la API URL local** en todos los puntos de consumo (actions.ts, contextos, hooks), lo que imposibilita su funcionamiento en producción sin modificaciones manuales. La falta de scripts de lint, typecheck y tests, sumada al `.env` versionado en git, configuran un riesgo alto de regresiones. La arquitectura general es coherente y sigue el patrón híbrido feature+layer documentado, pero la deuda técnica acumulada y las omisiones en seguridad/rendimiento requieren atención prioritaria.

---

### 🚨 Critical Inconsistencies

* **Issue:** API URL hardcodeada a `NEXT_PUBLIC_API_URL_LOCAL` en todos los puntos de consumo — no es environment-aware. En producción, la app NO funcionará porque nunca usa `NEXT_PUBLIC_API_URL`.
* **Location:**
  - `src/lib/actions.ts:42,59,132,209,219` — 5 funciones de servidor
  - `src/context/AuthContext.tsx:28,42,114,131,140` — inicialización, refresh, logout
  - `src/context/FollowContext.tsx:29` — toggleFollow
  - `src/context/FavoritoContext.tsx:41,46` — toggleFavorito
  - `src/context/NotificacionesContext.tsx:34` — polling notificaciones
  - `src/context/NuevosUsuariosContext.tsx:48` — fetch usuarios
  - `src/app/hooks/useInfinitePosts.ts:24` — scroll infinito
  - `src/app/hooks/useLikes.ts:27,60` — likes
  - `src/app/hooks/useCrearPosteo.ts:151` — crear posteo
  - `src/app/hooks/useNotifications.tsx:22,50,72` — notificaciones
  - `src/app/hooks/usePushNotifications.ts:76,90,132` — push notifications
* **Documentación:** DOCUMENTACION.md sección 10 nota: *"Todas las URLs de API usan `NEXT_PUBLIC_API_URL_LOCAL` hardcodeado en `actions.ts` y en algunos hooks (no son environment-aware)."*
* **Impact:** **Critical**. El frontend desplegado en producción (Vercel) llamará a `http://localhost:5000` en lugar de la URL real del backend. La aplicación entera queda inoperativa en producción sin editar manualmente cada archivo.

* **Issue:** Archivo `.env` versionado en git a pesar de que `.gitignore` excluye `.env*`
* **Location:** `C:\Users\paul1\Documents\Frontend\tlaxcala-en-imagenes-app\.env`
* **Documentación:** DOCUMENTACION.md sección 5 nota: *"`.env` está versionado en git a pesar de que `.gitignore` tiene el patrón `.env*`."*
* **Impact:** **Critical**. Las claves de Cloudinary, credenciales SMTP, secrets JWT y URLs internas quedan expuestas en el repositorio. Esto constituye una violación de seguridad. Cualquier colaborador con acceso al repo tiene acceso a secretos de producción.

* **Issue:** Sin scripts de lint, typecheck ni tests en `package.json`
* **Location:** `package.json` líneas 5-9 (solo `dev`, `build`, `start`)
* **Documentación:** DOCUMENTACION.md secciones 6 y 18: *"No existen scripts de lint, typecheck ni tests."*
* **Impact:** **Critical**. No hay ninguna barrera automatizada que prevenga errores de tipo, regresiones funcionales o malas prácticas. Cualquier refactorización o cambio es riesgoso. El proyecto TypeScript 6.0.3 con `strict: true` en tsconfig no tiene un comando `typecheck` que lo verifique.

---

### 🟠 High Severity Findings

* **Issue:** FavoritoProvider NO está en el root layout (`src/app/layout.tsx`). Se agrega manualmente en layouts de ruta protegida, lo que puede causar duplicación de instancias o estados inconsistentes.
* **Location:** `src/app/layout.tsx` (ausencia de FavoritoProvider) vs `src/context/FavoritoContext.tsx`
* **Documentación:** DOCUMENTACION.md sección 9.4: *"FavoritoProvider se agrega localmente en los layouts de rutas protegidas (NO en el root)."*
* **Impact:** **High**. Si un componente fuera de una ruta protegida intenta usar `useFavorito()`, obtendrá error. Además, si se tienen múltiples instancias del provider (ej. anidamiento involuntario), los estados `favoritosMap` y `loadingMap` no se compartirán correctamente.

* **Issue:** Componentes con más de 300 líneas que concentran demasiada lógica (presentación + estado + efectos + modales anidados)
* **Location:**
  - `src/app/components/perfil/ImageModal.tsx` — **482 líneas**
  - `src/app/components/PosteoCard.tsx` — **263 líneas**
  - `src/app/hooks/useCrearPosteo.ts` — **222 líneas**
* **Documentación:** DOCUMENTACION.md sección 22 (Deuda Técnica Detectada)
* **Impact:** **High**. Dificulta el testing manual, el mantenimiento y la legibilidad. `ImageModal` mezcla lógica de comentarios, likes, opciones y visualización de imagen en un solo componente monolítico.

* **Issue:** Anuncios hardcodeados en `PublicidadContext` en lugar de obtenerse desde API o CMS
* **Location:** `src/context/PublicidadContext.tsx` líneas 5-24
* **Documentación:** DOCUMENTACION.md sección 23 punto 7: *"Hardcoded ads: Los anuncios están hardcodeados en `PublicidadContext` en lugar de ser obtenidos de un CMS o API."*
* **Impact:** **High**. Para cambiar un anuncio se requiere modificar código fuente y re-desplegar. No hay segmentación, rotación inteligente, ni medición de impacto.

* **Issue:** Los modales no usan `React.lazy()` ni `dynamic()` de Next.js para carga diferida
* **Location:** Múltiples componentes: `ImageModal`, `CrearPosteoModal`, `ComentariosModal`, `ModalOpcionesPublicacion`, `ModalLikesUsuarios`
* **Documentación:** DOCUMENTACION.md sección 16: *"Sin Suspense ni lazy loading: Los modales se renderizan condicionalmente pero no usan `React.lazy`/`Suspense`."*
* **Impact:** **High**. El JavaScript de todos los modales se incluye en el bundle inicial incluso si nunca se abren. Aumenta el tamaño del bundle y empeora el rendimiento en dispositivos móviles.

---

### 🟡 Medium Severity Findings

* **Issue:** `setTotalNoLeidas` expone el setter tipado como `React.Dispatch<React.SetStateAction<number>>` en lugar de encapsular la lógica. Cualquier componente puede modificarlo arbitrariamente.
* **Location:** `src/context/NotificacionesContext.tsx` línea 16
* **Impact:** **Medium**. Rompe el principio de encapsulamiento del contexto. Cualquier componente puede alterar el contador de notificaciones sin pasar por la API, causando estados inconsistentes.

* **Issue:** Inconsistencia en nomenclatura de archivos: `spinner.tsx` usa minúscula inicial, mientras que el estándar del proyecto es PascalCase (`PosteoCard.tsx`, `ToastGlobal.tsx`)
* **Location:** `src/app/components/spinner.tsx`
* **Documentación:** DOCUMENTACION.md sección 24: *"Nomenclatura de archivos: PascalCase para componentes."*
* **Impact:** **Medium**. Inconsistencia que puede confundir a nuevos desarrolladores y a herramientas de análisis de código.

* **Issue:** `spamRegex` definido como variable `const` global fuera del schema de Zod, lo que dificulta su reutilización y podría causar efectos laterales si se modifica (aunque es `const`, está en el ámbito del módulo)
* **Location:** `src/lib/validaciones.ts` línea 78: `const spamRegex = /(http|www|free money|click here|suscríbete|followers|porno|xxx)/i;`
* **Impact:** **Medium**. Si en el futuro se desea extender el spam regex, hay que tener cuidado con el scope. Además, `posteoBaseSchema.texto` NO usa `spamRegex` (solo lo usan `editarPosteoSchema` y `comentarioSchema`), lo que es inconsistent: un post nuevo puede contener spam pero editarlo o comentar no.

* **Issue:** Potencial código muerto: `useLogout` hook (`src/app/hooks/auth/logout.ts`) y `preloadImages` helper (`ImagePreloader.tsx`) existen pero su uso no está confirmado en el código actual
* **Location:**
  - `src/app/hooks/auth/logout.ts` (14 líneas, exporta `useLogout`)
  - `ImagePreloader.tsx` (exporta `preloadImages` función helper)
* **Documentación:** DOCUMENTACION.md sección 21 (Código No Utilizado)
* **Impact:** **Medium**. Código muerto que aumenta el bundle sin beneficiar funcionalidad. Se debe verificar si `MenuPrincipal` realmente importa `useLogout` o tiene su propia lógica inline.

* **Issue:** Discrepancia en validación de password entre frontend y backend: el frontend exige (min 8, upper+lower+digit+special) mientras que API.md documenta que el backend solo exige mínimo 8 caracteres
* **Location:**
  - Frontend: `src/lib/validaciones.ts` líneas 10-16
  - Backend: DOCUMENTACION-BACKEND.md sección API `/api/usuarios` (POST): *"Mínimo 8 caracteres"* + API.md dice solo "Mínimo 8 caracteres"
* **Impact:** **Medium**. Si el backend relaja sus validaciones, el frontend bloquea registros que el backend aceptaría y viceversa. Esto puede causar errores confusos al usuario.

---

### 🟢 Low Severity Findings

* **Issue:** Código comentado en archivos de producción que debería eliminarse
* **Location:**
  - `src/lib/actions.ts` líneas 57-58: `// Cambiar la URL a la de producción // const response = await fetch(...)`
  - `src/context/PublicidadContext.tsx` líneas 9, 15, 21: `// titulo: "..."` comentado
* **Impact:** **Low**. Contamina el código fuente, dificulta la lectura. No afecta funcionalidad.

* **Issue:** Comentarios redundantes o con errores ortográficos en `src/types/types.ts` (ej. línea 311: "Iterface" en lugar de "Interface")
* **Impact:** **Low**. No afecta funcionalidad pero denota falta de revisión.

---

### 📈 Architecture Score

```
📈 Puntuación de Arquitectura: 16/100

Desglose:
- 🔴 Crítico: 3 hallazgo(s) → -30 pts (capped: -60, aplicado: -30)
- 🟠 Alto: 4 hallazgo(s) → -32 pts (capped: -32, aplicado: -32)
- 🟡 Medio: 5 hallazgo(s) → -20 pts (capped: -20, aplicado: -20)
- 🟢 Bajo: 2 hallazgo(s) → -2 pts (capped: -8, aplicado: -2)

Interpretación: Desalineación crítica entre frontend, backend y documentación; riesgo alto de fallos en producción.
```

---

### 📋 Análisis Detallado por Categoría

#### 1. Arquitectura General

**Aciertos:**
- Patrón híbrido feature+layer bien definido y documentado
- Separación clara entre contextos globales, hooks, componentes compartidos y de ruta
- Tipos centralizados en `types/types.ts`
- Uso correcto de Route Groups `(perfil)` para agrupar rutas relacionadas
- Orden de providers correcto (Auth más externo, Publicidad más interno)

**Problemas:**
- FavoritoProvider ausente del root layout, obliga a duplicarlo en cada layout protegido
- No hay Server Components puros; todos los componentes relevantes tienen `'use client'`
- La carpeta `src/app/components/` contiene 31 archivos mezclando componentes de distintas rutas, sin subdivisión por feature clara

#### 2. Dependencias y Configuración

**Compatibilidad verificada:**
- Next.js 16.2.6 + React 19.2.6 + TypeScript 6.0.3 → compatibles
- zod 4.4.3 + @hookform/resolvers 5.2.2 → compatibles
- Bootstrap 5.3.8 + @popperjs/core 2.11.8 → compatibles
- framer-motion 12.38.0 con React 19 → compatible
- date-fns 4.1.0 → versión ESM, compatible con Next.js 16

**Problemas:**
- `typescript 6.0.3` es una versión extremadamente nueva; se debe verificar compatibilidad total con Next.js 16.2.6 (TypeScript 6.0 salió en junio 2026)
- No hay `@types/bootstrap` — las importaciones de Bootstrap se hacen directamente desde `bootstrap/dist/css/bootstrap.min.css` y clases CSS, no hay tipado para componentes JS de Bootstrap
- `package.json` no tiene script `lint` ni `typecheck`; `next lint` no funcionará sin configuración ESLint

#### 3. Puntos Críticos — Auth Flow

**Flujo actual (correcto):**
1. Inicialización: `GET /api/auth/me` con cookies
2. Si 401 → `POST /api/auth/refresh` (con control de concurrencia `isRefreshing`)
3. Si refresh OK → reintento de `/api/auth/me`
4. `fetchWithAuth` wrapper con auto-retry en 401

**Problemas:**
- **Race condition potencial en refresh**: `isRefreshing` ref y `refreshPromise` ref mitigan parcialmente, pero si 3 llamadas simultáneas fallan con 401, todas intentan refresh y la primera que logra refrescar hace que las otras 2 tengan tokens obsoletos. El patrón es mejorable.
- **API_URL hardcodeado**: `const API_URL = process.env.NEXT_PUBLIC_API_URL_LOCAL` — en producción no funcionará
- **Logout no espera confirmación del servidor**: `logout()` setea `setUser(null)` en `finally`, incluso si el fetch falla. El usuario queda deslogueado localmente aunque el servidor no haya limpiado la sesión.

#### 4. Seguridad

**Aciertos:**
- Validación Zod en todos los formularios (registro, posteo, comentarios, soporte)
- Spam filter con regex en comentarios y edición de posts
- Restricciones de archivo: 5MB, solo jpeg/jpg/png/webp
- fetchWithAuth siempre usa `credentials: 'include'`
- Viewport bloquea user scaling (UX, no seguridad)

**Problemas:**
- **.env versionado con secretos expuestos** ← crítico
- **API URL hardcodeado a localhost** — en producción las peticiones van a localhost:5000 (sin HTTPS, sin cookies seguras). Las cookies `secure: true` del backend fallarán silenciosamente en localhost.
- **`spamRegex` no se aplica en `posteoBaseSchema.texto`**, solo en `editarPosteoSchema` y `comentarioSchema`. Un post nuevo puede contener spam.
- **XSS residual**: El regex de validación `^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,!?¡¿()\s-]*$` bloquea `<`, `>`, `&`, `"`, lo cual es positivo. Sin embargo, si algún componente renderiza texto con `dangerouslySetInnerHTML` o similar, podría haber riesgo.

#### 5. State Management

**Aciertos:**
- Jerarquía de providers correcta y documentada
- Contextos con responsabilidades únicas y bien definidas
- Actualización optimista en FollowProvider (aunque no es completamente optimista — espera respuesta del server)

**Problemas:**
- **FavoritoContext no es realmente optimista**: espera la respuesta del servidor antes de actualizar el estado local
- **FollowProvider actualiza optimistamente DESPUÉS de la respuesta**, no antes. No hay rollback implementado.
- **setTotalNoLeidas expuesto como setter directo**: cualquier componente puede modificarlo sin pasar por API

#### 6. Rendimiento

**Aciertos:**
- Scroll infinito con IntersectionObserver (rootMargin 200px)
- Next.js Image con remotePatterns para Cloudinary
- ImagePreloader para precargar imágenes críticas

**Problemas:**
- **Sin lazy loading en modales** (mencionado arriba)
- **ImageModal (482 líneas)** es un monolito que combina visualización de imagen, comentarios, likes, opciones y toasts
- **useCrearPosteo (222 líneas)** maneja demasiado estado: archivo, preview, texto, ubicación, móvil, errores, confirmación
- **Sin React.memo en componentes propensos a re-render**: PosteoCard, ComentarioItem, LikeButton reciben props que cambian frecuentemente y no tienen memorización explícita
- **useLikes usa `data.likes_usuarios_posteo.length`** para contar likes — en lugar de usar el campo `count` del posteo. Esto descarga todos los usuarios que dieron like solo para contar, cuando el backend probablemente devuelve un conteo.

#### 7. Backend Alignment

**Aciertos:**
- El flujo JWT dual coincide con DOCUMENTACION-BACKEND.md
- Los endpoints consumidos coinciden con la especificación de API.md
- Soft delete + hard delete con cron jobs está correctamente reflejado

**Problemas:**
- **El frontend no maneja explícitamente errores 403** (cuenta no verificada/no activada) en la mayoría de hooks — solo en `actions.ts` (acciones de auth)
- **No se implementa manejo de error 429** (rate limiting) en hooks como `useCrearPosteo` (solo se maneja en un `if (res.status === 429)`)
- **Las restricciones de password difieren**: frontend pide (8+ chars, mayúscula, minúscula, dígito, especial) vs backend documentado solo (8+ chars)

---

### 🔧 Recommended Action Plan

#### Inmediato (Semana 1-2)
1. **🔴 Crear script `switch-env.js` o utilizar `NEXT_PUBLIC_API_URL` con fallback**: Unificar todas las llamadas API para usar una sola variable de entorno (`NEXT_PUBLIC_API_URL`) que en desarrollo apunte a localhost y en producción a la URL real. Crear un helper `getApiUrl()` centralizado.
   ```typescript
   // src/lib/apiUrl.ts
   export function getApiUrl(): string {
     return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL || 'http://localhost:5000';
   }
   ```
2. **🔴 Eliminar `.env` del tracking de git** y rotar todos los secretos expuestos (Cloudinary, SMTP, JWT secrets).
3. **🔴 Agregar scripts de calidad**: `"typecheck": "tsc --noEmit"`, `"lint": "next lint"` y configurar ESLint.
4. **🟠 Mover FavoritoProvider al root layout** `src/app/layout.tsx` dentro del árbol de providers.

#### Corto Plazo (Semana 3-4)
5. **🟠 Refactorizar ImageModal (482 líneas)**: Extraer lógica de comentarios a un hook separado y el layout responsivo a subcomponentes.
6. **🟠 Agregar `React.lazy` + `Suspense`** a todos los modales (`ImageModal`, `CrearPosteoModal`, `ComentariosModal`, `ModalOpcionesPublicacion`).
7. **🟡 Mover `spamRegex` a un archivo compartido** y aplicarlo también en `posteoBaseSchema.texto`.
8. **🟡 Eliminar código muerto**: Verificar uso de `useLogout` y `preloadImages`; eliminarlos si no se usan.

#### Mediano Plazo (Mes 2-3)
9. **🟡 Unificar validación de password**: Alinear frontend y backend en los mismos requisitos.
10. **🟠 Reemplazar anuncios hardcodeados** por un endpoint API que permita gestión dinámica.
11. **🟡 Agregar manejo explícito de errores 403 y 429** en todos los hooks (actualmente solo en `actions.ts`).
12. **🟢 Limpiar código comentado** en `actions.ts`, `PublicidadContext.tsx` y `types/types.ts`.
13. **Agregar tests**: Priorizar tests de integración para el flujo de auth (login, refresh, logout) y creación de posteos.

---

### 🔄 Change Impact Mode

**Si se propusiera un cambio en el backend (ej. cambiar `/api/posteos` a `/api/posts`):**

1. **Módulos frontend afectados:**
   - `src/app/hooks/useInfinitePosts.ts` (URL del fetch)
   - `src/app/hooks/useCrearPosteo.ts` (URL del POST)
   - `src/app/components/PosteoDetalle.tsx` (GET detalle)
   - `src/app/components/perfil/PublicacionesUsuarioGrid.tsx` (GET posteos usuario)
   - `src/app/components/PosteoCard.tsx` (acciones sobre posteo)
   - `src/app/components/ModalOpcionesPublicacion.tsx` (DELETE, PUT)

2. **Módulos backend afectados:**
   - `routes/posteos.js` — cambios de ruta
   - `controllers/posteos.js` — si cambia lógica de negocio
   - `models/Posteo.js` — si cambia estructura

3. **Contratos API afectados:**
   - DOCUMENTACION-BACKEND.md sección 4
   - API.md sección 4

4. **Complejidad estimada:** Small (solo cambiar paths en frontend) a Medium (si cambian estructuras de respuesta)

5. **Archivos a modificar:**
   - 6 archivos de frontend con búsqueda de patrón `/api/posteos`
   - 1 archivo de rutas backend
   - 2 archivos de documentación

6. **Regresiones potenciales:**
   - Scroll infinito roto si la respuesta paginada cambia de estructura
   - Creación de posteos falla si cambia el FormData esperado
   - Likes y comentarios vinculados a IDs de posteo podrían quedar huérfanos si cambian los IDs

---

### ✅ Resumen de Hallazgos por Archivo

| Archivo | Líneas | Problemas |
|---|---|---|
| `src/lib/actions.ts` | 232 | 🔴 API_URL LOCAL hardcodeado, código comentado |
| `src/context/AuthContext.tsx` | 188 | 🔴 API_URL LOCAL hardcodeado, race condition parcial en refresh |
| `src/context/FollowContext.tsx` | 64 | 🔴 API_URL LOCAL hardcodeado, optimismo post-respuesta |
| `src/context/FavoritoContext.tsx` | 91 | 🔴 API_URL LOCAL hardcodeado, no es optimista |
| `src/context/NotificacionesContext.tsx` | 77 | 🔴 API_URL LOCAL, 🟡 setter expuesto |
| `src/context/NuevosUsuariosContext.tsx` | 100 | 🔴 API_URL LOCAL |
| `src/context/PublicidadContext.tsx` | 73 | 🟠 anuncios hardcodeados, 🟢 código comentado |
| `src/app/hooks/useInfinitePosts.ts` | 103 | 🔴 API_URL LOCAL |
| `src/app/hooks/useLikes.ts` | 80 | 🔴 API_URL LOCAL, 🟡 conteo ineficiente |
| `src/app/hooks/useCrearPosteo.ts` | 222 | 🔴 API_URL LOCAL, 🟠 hook muy grande |
| `src/app/hooks/useNotifications.tsx` | 106 | 🔴 API_URL LOCAL |
| `src/app/hooks/usePushNotifications.ts` | 167 | 🔴 API_URL LOCAL |
| `src/app/components/perfil/ImageModal.tsx` | 482 | 🟠 monolito, sin lazy loading |
| `src/app/components/PosteoCard.tsx` | 263 | 🟠 componente grande |
| `src/app/components/spinner.tsx` | — | 🟡 inconsistente nomenclatura |
| `src/lib/validaciones.ts` | 150 | 🟡 spamRegex no aplicado en posteoBaseSchema, 🟡 spamRegex global |
| `src/types/types.ts` | 407 | 🟢 comentarios con errores |
| `src/app/layout.tsx` | 99 | 🟠 FavoritoProvider ausente |
| `package.json` | 29 | 🔴 sin lint/typecheck/test |
| `.env` | — | 🔴 versionado en git |
| `next.config.ts` | 17 | Sin problemas |

---

*Reporte generado automáticamente por el agente de análisis técnico. Para una re-auditoría después de aplicar correcciones, ejecute una nueva solicitud de análisis completo.*
