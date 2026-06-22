# Informe de Auditoría Técnica — Tlaxcala en Imágenes App

> **Fecha:** 2026-06-19
> **Proyecto:** Tlaxcala en Imágenes App (TlaxApp)
> **Stack:** Next.js 16, React 19, TypeScript 6, Bootstrap 5.3, Zod 4

---

## Resumen de Salud del Proyecto

El proyecto es una red social visual con arquitectura coherente de Next.js App Router, providers en cadena y autenticación JWT por cookies. Sin embargo, se identificaron **3 errores críticos** que lo hacen inoperable en producción parcialmente, además de deuda técnica significativa.

**Puntuación: 27/100**

---

## 🚨 Inconsistencias Críticas

### 1. 🔴 URL de API hardcodeada a `localhost` en `actions.ts`
- **Archivo:** `src/lib/actions.ts` — líneas 42, 59, 132, 209, 219
- **Problema:** Usa `NEXT_PUBLIC_API_URL_LOCAL` exclusivamente en 5 endpoints (registro, reenvío de correo, restablecimiento de password, validación de token)
- **Impacto:** En producción todas esas peticiones apuntan a `localhost:5000`. La app queda inoperable para esos flujos.
- **Evidencia:**
  ```typescript
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/usuarios`, requestOptions);
  ```

### 2. 🔴 Archivo `.env` versionado en Git
- **Archivo:** `.env` (raíz)
- **Problema:** El `.gitignore` contiene `.env*` pero el archivo ya fue commiteado y permanece tracked
- **Impacto:** Exposición de claves de Cloudinary, URLs de API, correos del sistema

### 3. 🔴 Bug visual en `FavoritoButton`
- **Archivo:** `src/app/components/FavoritoButton.tsx:43-44`
- **Problema:** `fill` siempre es `"red"` sin importar el estado
- **Impacto:** El icono de favorito no refleja el estado real
- **Evidencia:**q
| 13 | **`useLikes.ts` obtiene TODOS los usuarios para verificar un booleano** — ineficiente | `src/app/hooks/useLikes.ts:27-41` |

---

## 🟢 Hallazgos Bajos

| # | Hallazgo | Archivo(s) |
|---|---|---|
| 14 | Comentarios mixtos español/inglés y spanglish | Múltiples archivos |
| 15 | Formato inconsistente en `types.ts` — mezcla tabs y espacios | `src/types/types.ts` |
| 16 | `rel="noopener noreferrer"` en link interno (`/que-es-tlaxapp`) | `src/app/components/FooterMain.tsx:15` |
| 17 | Import duplicado de Bootstrap CSS — en `layout.tsx` y `ProtectedRoute.tsx` | `src/app/layout.tsx:4`, `src/components/ProtectedRoute.tsx:9` |
| 18 | `handleChange.ts` en `src/utils/` — función de 23 líneas infrautilizada | `src/utils/handleChange.ts` |
| 19 | `useLikesModal.ts` con lógica duplicada de `useLikes.ts` | `src/app/hooks/useLikes.ts:27`, `useLikesModal.ts:21` |

---

## 📈 Análisis de Dependencias

| Paquete | Versión | Estado |
|---|---|---|
| `next` | 16.2.6 | ✅ Actual |
| `react` | 19.2.6 | ✅ Actual |
| `typescript` | 6.0.3 | ✅ Actual |
| `bootstrap` | 5.3.8 | ✅ Estable |
| `zod` | 4.4.3 | ✅ Actual |
| `react-hook-form` | 7.75.0 | ✅ Actual |
| `framer-motion` | 12.38.0 | ✅ Actual |
| `date-fns` | 4.1.0 | ⚠️ Breaking changes vs v3 |
| `@hookform/resolvers` | 5.2.2 | ✅ Compatible con Zod 4 |

**Faltantes:** `@tanstack/react-query`, `vitest`, `@testing-library/react`, `eslint-config-next`

---

## 🔍 Puntos Críticos (Hotspots)

1. **`src/lib/actions.ts`** (232 líneas) — Estado mutable global, URLs hardcodeadas
2. **`src/app/components/PosteoCard.tsx`** (263 líneas) — Demasiadas responsabilidades
3. **`src/context/AuthContext.tsx`** (188 líneas) — Provider más complejo, punto único de falla
4. **Hooks de fetching manual** (10+ hooks) — Cada uno implementa su propia lógica de loading/error

---

## 🔒 Seguridad

- 🔴 `.env` versionado — expone Cloudinary keys, URLs, correos
- 🟠 `dangerouslySetInnerHTML` en 4 páginas
- ✅ Buenas prácticas: `credentials: 'include'`, refresh de token con concurrencia controlada, cookies httpOnly
- ✅ Validación Zod robusta con spam regex

---

## ⚡ Rendimiento

- 🟡 Sin caché de datos — fetching en cada montaje de componente
- 🟡 `loading="eager"` en imágenes de `PosteoCard`
- 🟢 Sin `React.memo` en componentes de lista
- 🟢 `NotificacionesContext` refresca cada 60s incluso si el usuario no está en esa página

---

## Plan de Acción Recomendado

### Prioridad 1: Corregir errores críticos (inmediato)

1. **Arreglar `actions.ts`** para usar la URL correcta según entorno (crear helper centralizado)
2. **Remover `.env` del tracking de Git:** `git rm --cached .env` y crear `.env.example`
3. **Corregir bug de `FavoritoButton`:** cambiar `fill` a `esFavorito ? "red" : "none"`

### Prioridad 2: Estabilizar arquitectura (corto plazo)

4. **Crear un `AppLayout` compartido** para eliminar ~600 líneas duplicadas
5. **Refactorizar `actions.ts`:** eliminar estado mutable global, convertir a funciones puras

### Prioridad 3: Calidad y mantenibilidad (mediano plazo)

6. **Agregar scripts:** `typecheck`, `lint`, `test` en `package.json`
7. **Instalar `@tanstack/react-query`** y migrar hooks de fetching manual
8. **Instalar `vitest` + `@testing-library/react`** con tests para validaciones y componentes clave

### Prioridad 4: Rendimiento (mediano plazo)

9. **Optimizar `PosteoCard`** con `React.memo` y `loading="lazy"`
10. **Optimizar `useLikes`** para que el endpoint devuelva solo `hasLiked` + `count`
11. **Migrar `PublicidadContext`** a API externa o CMS
