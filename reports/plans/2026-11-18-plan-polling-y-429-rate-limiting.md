---
title: "Plan: polling de notificaciones/nuevos usuarios y manejo de 429"
type: plan
status: completed
created: "2026-11-18"
completed: "2026-11-18"
related: "Backend: engineering/working/implementation-plans/2026-11-18-plan-topes-ip-rate-limiting-nat.md"
branch: "desarrollo"
---

# Plan: polling de notificaciones/nuevos usuarios y manejo de 429

> **Estado:** plan aprobado por el responsable (2026-11-18), pendiente de implementar. Es la parte frontend del plan del backend de topes por IP; ambas son independientes y complementarias (el backend va primero).

## 0. Estado del backend (actualizado 2026-11-18)

Backend, rama `Fix-rate-limiting-nat`, **commit 1 implementado** (los commits 2 y 3 siguen pendientes). Lo que ya cambió y es relevante para este plan:

- Los tres endpoints de polling/lectura afectados siguen respondiendo igual; solo cambian los topes por IP (15 min): lecturas **3000** (antes 300), escrituras **600** (antes 60).
- `GET /api/notificaciones/nuevas-notificaciones` y `GET /api/usuarios/registrados/nuevos-usuarios-registrados` tienen ahora un **cubo por IP propio** de 3000 (`pollingIpLimiter`), separado del de lecturas: el polling ya no consume el cupo del feed ni de los municipios.
- El 429 por IP **no cambia de forma**: `code: "FLOOD_BLOCKED"`, mismo mensaje «Demasiadas solicitudes desde esta conexión, intenta de nuevo más tarde». El frontend no necesita adaptar el manejo de errores.
- `POST /api/usuarios` (registro): 3 → **10** por hora por IP (`REGISTER_BLOCKED`). Si algún texto del frontend menciona «3 cuentas por hora», hay que actualizarlo (revisar `crear-cuenta`).
- **Commit 2 implementado** (backend): CORS ya expone `Retry-After`, `RateLimit`, `RateLimit-Policy`, `RateLimit-Limit`, `RateLimit-Remaining` y `RateLimit-Reset` (`Access-Control-Expose-Headers`), así que F2 puede leerlos con `response.headers.get(...)`. `POST /api/auth/refresh` ahora limita por sesión (10/15 min) con techo por IP de 300; el 429 sigue siendo `REFRESH_BLOCKED`, sin cambios de forma para el frontend.
- Formato de los headers (express-rate-limit 8, `standardHeaders: true`): `RateLimit-Reset` y `Retry-After` en **segundos** (enteros). `Retry-After` solo viene en respuestas 429.
- Solo falta en backend el commit 3 (documentación); no bloquea al frontend.
- **El frontend ya puede implementarse.** Para probar en local contra el backend nuevo hay que usar la rama `Fix-rate-limiting-nat`. En producción, los headers solo serán legibles tras desplegar el backend; hasta entonces la utilidad debe caer al tiempo de espera mínimo (ver §4 punto 1).
- Este plan sigue sin implementarse en el frontend.

## 1. Contexto

Con 10+ sesiones simultáneas en la misma red, la consola muestra `429` en:

- `GET /api/usuarios/registrados/nuevos-usuarios-registrados`
- `GET /api/notificaciones/nuevas-notificaciones`
- `Polling de notificaciones limitado (429); reintenta en el próximo ciclo.`

El mensaje del backend («Demasiadas solicitudes desde esta conexión…», `FLOOD_BLOCKED`) es el tope **por IP**, compartido por todos los dispositivos de una red. La causa es del backend (el backend sube los topes y separa un cubo de polling), pero el frontend aporta carga evitable.

## 2. Hallazgos en el frontend (verificados)

- `src/context/NotificacionesContext.tsx`: `setInterval(refrescarNotificaciones, 60000)` por pestaña, **sin pausar** con la pestaña oculta. Un 429 solo hace `console.warn`.
- `src/context/NuevosUsuariosContext.tsx`: polling cada 60 s, ya pausado con la pestaña oculta (patrón a reutilizar). Datos de poco valor para esa frecuencia.
- `src/context/AuthContext.tsx`: `fetchConReintentos` solo reintenta errores de red, **no** 429; no hay bucle de reintentos. Un 429 al renovar sesión muestra «No pudimos renovar tu sesión por un problema de conexión» sin cerrar sesión.
- `src/lib/catalogos.ts`: municipios cacheados en memoria por pestaña y con deduplicación; un fallo no queda cacheado. No requiere cambios.
- Ningún cliente respeta `Retry-After` / `RateLimit-Reset`: tras un 429 siguen en el siguiente ciclo, y cada petición rechazada también cuenta en el backend.

## 3. Decisiones (aprobadas 2026-11-18)

| # | Decisión |
|---|---|
| F1 | Pausar el polling de notificaciones con la pestaña oculta y hacer un fetch inmediato al volver (mismo patrón que `NuevosUsuariosContext`). |
| F2 | Ante un 429, leer `Retry-After` / `RateLimit-Reset` y no volver a consultar hasta ese momento, en ambos contextos. |
| F3 | Subir el polling de nuevos usuarios de **60 s a 3 min** (180 000 ms). |

## 4. Cambios

1. **Utilidad compartida de espera por 429** (p. ej. `src/lib/polling.ts`): dado un error, devuelve los ms de espera usando `Retry-After` (segundos) o `RateLimit-Reset`; con tope razonable (p. ej. 15 min) y un mínimo (p. ej. 30 s) si el header no viene.
   - Verificar primero si `ApiError` (`src/lib/apiClient.ts`) expone los headers de la respuesta; si no, añadirlos de forma retrocompatible (sin romper `isRateLimit`/`getUserMessage`).
   - Verificar que el backend expone los headers al navegador: CORS necesita `Access-Control-Expose-Headers` para `RateLimit-*`/`Retry-After` en peticiones cross-origin (`models/server.js` del backend). Si no los expone, se usa el mínimo fijo y se anota como pendiente de backend.
2. **`NotificacionesContext.tsx`**: reemplazar el `setInterval` por el patrón de `NuevosUsuariosContext` (arranca solo si la pestaña está visible; `visibilitychange` detiene o reinicia; fetch inmediato al volver, con guarda de intervalo mínimo para no duplicar). Mantener el `console.warn` degradado del 429.
3. **`NuevosUsuariosContext.tsx`**: intervalo 60 000 → 180 000 ms; fetch inmediato al volver a la pestaña se mantiene, con la misma guarda de intervalo mínimo.
4. **Ambos contextos**: si el fetch falla con 429, registrar un «no antes de» (`Date.now() + espera`) y omitir los ciclos y los fetch por visibilidad hasta entonces.
5. **Opcional pequeño**: jitter (±10 %) en el intervalo para que muchas pestañas abiertas a la vez no sincronicen sus peticiones.

Sin cambios en `AuthContext` ni en `catalogos.ts`.

## 5. Pruebas y verificación

- Sin suite de tests de contextos: verificar manualmente.
  1. Con la pestaña oculta no salen peticiones de polling (Network); al volver sale una inmediata.
  2. Con el backend devolviendo 429 (bajar `POLLING_IP_MAX` en local) no hay nuevas peticiones hasta el tiempo indicado.
  3. El polling de nuevos usuarios corre cada 3 min.
- `pnpm build` sin errores nuevos. (No existe script `lint` en el proyecto: ver AGENTS.md.)
- Prueba final conjunta con el backend: 10+ dispositivos >15 min sin 429 en la consola.

## 6. Orden, commits y riesgos

- Se implementa después del backend, o en paralelo; no depende de él para funcionar.
- Commits en `desarrollo` (sin push): (1) utilidad + headers de `ApiError`, (2) contextos. Actualizar `CHANGELOG.md` según la convención del repo.
- Riesgo: menos frescura del badge de notificaciones al volver a la pestaña; se mitiga con el fetch inmediato al volver. Nuevos usuarios pasa a refrescarse cada 3 min (decisión del responsable).

## 7. Fuera de alcance

Cambios de límites en el backend, `AuthContext`, caché de catálogos y reintentos automáticos de peticiones 429.

## 8. Verificación local (2026-11-18)

Commits en `Fix-rate-limiting-nat` (sin push): `ac9a748` (utilidad y `ApiError`), `4f340b7` (contextos y CHANGELOG). `pnpm build` sin errores.

Pruebas manuales automatizadas contra backend local (Playwright sobre Chrome, cuenta de prueba):

- **Polling normal (F1, F3):** notificaciones cada ~60 s; nuevos usuarios cada ~3 min (198 s observados, en el borde del jitter). Con la pestaña oculta, 0 peticiones en 130 s; al volver, fetch inmediato de ambos.
- **429 (F2)** con `POLLING_IP_MAX=3`: notificaciones `Retry-After: 838` y nuevos usuarios `Retry-After: 712`. Sin peticiones durante los 240 s observados en ambos contextos.

Pendiente de observación natural en producción: reanudación tras la ventana completa del 429 (~12–14 min).

**Prueba conjunta en despliegue (2026-11-18):** ~1 hora con 12 navegadores en distintos dispositivos de la misma red, sin 429 de rate limiting que afectara la experiencia. Cubre §5, punto 2.

**Estado:** `completed`.
