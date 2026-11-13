---
title: "Plan - revocación inmediata de sesiones (F8, pendiente)"
type: plan
status: working
created: "2026-11-12"
expires: "2027-02-10"
related: "Frontend: reports/plans/2026-11-11-plan-frontend-rediseno-sesiones.md. Backend (repo login-autenticacion): docs/specs/SPECS-SESIONES.md. Este documento debe copiarse o enlazarse allí porque el repo del backend no está en este equipo."
branch: desarrollo
---

# Revocación inmediata de sesiones — PENDIENTE

Estado: **pendiente** · No iniciada · Requiere decisión de diseño del backend.

## Problema observado (2026-11-12, entorno local)

Con dos sesiones abiertas (Edge normal y Edge privado), se cambió la contraseña en la sesión privada:

- La respuesta de `PUT /api/usuarios/password` informó `sesionesCerradas` correctamente y `usertokens` quedó con una sola sesión viva.
- Aun así, la sesión del navegador normal **siguió funcionando**. Solo se cerró al borrar la cookie `accessToken` a mano, porque entonces el siguiente request intentó `/api/auth/refresh` y el refresh token ya estaba revocado.

## Causa

El cambio de contraseña revoca los **refresh tokens** en la base de datos, pero el `accessToken` (JWT) de las otras sesiones sigue siendo válido por firma hasta que expire. `verificarTokenSesion` no consulta `usertokens` en cada petición, y el frontend no tiene forma de enterarse de la revocación. Es una limitación del diseño actual, no un bug del frontend.

Esto afecta igual a F6 (cerrar una sesión concreta u «otras» desde Sesiones activas): sin este cambio, la sesión «cerrada» seguiría activa hasta que expire su access token.

## Hallazgo relacionado: logout sin cookie `refreshToken` (2026-11-12)

Al borrar la cookie `refreshToken` con el access token vivo:
- F2 y F3 muestran correctamente «Tu sesión ya no es válida…» (`403 FORBIDDEN`).
- Pero cerrar sesión no funciona: `POST /api/auth/logout` exige `refreshToken` y responde `401`, sin limpiar la cookie `accessToken`. El estado local se limpia, y al recargar `/api/auth/me` acepta el access token y devuelve al usuario a `/inicio`.
- Contexto: `docs/api/auth.md` indica que el access token dura hasta 1 h con la configuración por defecto y que el logout no lo invalida (hallazgo H24).
- El logout de administración (`/api/v1/admin/auth/logout`) ya funciona sin sesión y usa la cookie solo si existe; es el modelo a seguir.

## Objetivo

Que una sesión revocada (por cambio de contraseña, por «cerrar sesión» desde otro dispositivo o por F6) deje de funcionar de forma definitiva en un tiempo acotado y corto, y que el frontend la cierre y avise al usuario.

## Propuesta

### Backend (decisión y trabajo pendientes; repo `login-autenticacion`)

1. **Validar la sesión en cada petición autenticada** (opción recomendada).
   - El access token incluye el identificador de sesión (`sid`, o `jti` si ya existe).
   - `verificarTokenSesion` comprueba que esa sesión siga viva en `usertokens`.
   - Si no existe, responde `401` con `code: 'SESSION_REVOKED'`.
   - Para limitar el costo, caché en memoria con TTL corto (10–30 s). Ese TTL pasa a ser la ventana máxima de revocación; documentarlo en `SPECS-SESIONES.md`.
2. Alternativas descartadas por ahora: acortar solo el TTL del access token (reduce la ventana pero no la elimina y aumenta los refresh, límite 10 / 15 min) y notificación en tiempo real por SSE/websocket (demasiada infraestructura).

### Frontend (F8)

| Paso | Detalle | Archivos |
|---|---|---|
| F8a | Añadir `SESSION_REVOKED` a `ApiErrorCode` y a `CODIGOS_401_SIN_REFRESH`: ese `401` no intenta refresh, cierra la sesión local de inmediato (misma lógica que F1). | `src/lib/apiClient.ts`, `src/context/AuthContext.tsx` |
| F8b | Al cerrar por `SESSION_REVOKED`, redirigir al login con un mensaje claro («Tu sesión se cerró porque se cambió la contraseña o se cerró desde otro dispositivo»). Decidir por `code`, nunca por `detail`. | `AuthContext.tsx`, `FormularioLogin.tsx` |
| F8d | Backend (prerrequisito): `POST /api/auth/logout` debe funcionar sin cookie `refreshToken` (sin `validarRefreshToken`): borrar el hash si la cookie existe y **siempre** limpiar `accessToken` y `refreshToken`. El frontend no necesita cambios. Tras desplegarlo, repetir la prueba de borrar `refreshToken` y cerrar sesión. | backend (`controllers/auth.js`, `routes/auth.js`) | — |
| F8c | Revalidar la sesión al volver a la pestaña (`visibilitychange`) con una llamada ligera autenticada, para que una pestaña en segundo plano no espere a la siguiente acción del usuario. Respetar el Web Lock y los límites de refresh. | `AuthContext.tsx` |

## Criterios de aceptación

- Con dos navegadores abiertos, al cambiar la contraseña en uno, el otro queda en el login en menos de la ventana acordada (TTL del caché) tras su siguiente petición o al volver a la pestaña, sin tocar cookies.
- El `401 SESSION_REVOKED` no llama a `/api/auth/refresh` ni gasta `refreshLimiter`.
- La sesión que cambió la contraseña sigue activa.
- Un fallo de red o `5xx` en la revalidación no cierra la sesión.
- Con el access token vivo y sin cookie `refreshToken`, «Cerrar sesión» limpia ambas cookies y al recargar se llega al login (F8d).

## Dependencias y orden

- Backend primero: el frontend (F8a–F8c) no tiene efecto hasta que el backend emita `SESSION_REVOKED`. El orden inverso es seguro: un backend viejo nunca envía ese código.
- Conviene resolverlo antes de la Ola 4 (F6), que depende del mismo comportamiento.

## Decisiones tomadas (2026-11-12)

1. **Ventana de revocación: 15 segundos.** TTL del caché en memoria de sesiones vivas en el backend; es lo máximo que tarda en cerrarse una sesión revocada.
2. **Claim `sid`** en el access token y **`401 SESSION_REVOKED`** cuando la sesión ya no existe en `usertokens`.
3. **F8d:** `POST /api/auth/logout` funciona sin cookie `refreshToken` y siempre limpia ambas cookies.

### Confirmado (2026-11-12)
- Los access tokens emitidos antes del despliegue no traen `sid`: el backend los acepta hasta que expiren (máx. 1 h) para no cerrar la sesión a todos los usuarios al desplegar. Los tokens nuevos sí validan `sid`.

### Orden de implementación
1. Backend F8d (independiente, puede salir primero).
2. Backend: `sid` en el JWT + validación con caché de 15 s + `SESSION_REVOKED`. Invalidar la entrada del caché al revocar una sesión (cambio de contraseña, logout, F6) para que el proceso que revoca no espere los 15 s.
3. Frontend F8a–F8c.

Texto listo para copiar al backend: `2026-11-12-texto-specs-sesiones-revocacion-inmediata.md`.

## Dónde documentar
- Backend: `docs/specs/SPECS-SESIONES.md` (contrato), su plan de implementación y `docs/api/auth.md` (logout, `SESSION_REVOKED`, nota H24).
- Frontend: este plan ahora; al terminar, `SPECS/SPECS-FRONTEND-SESION-Y-CONTRATOS.md`, `AGENTS.md` y `CHANGELOG.md` dentro de F7 (requiere autorización explícita del humano). `docs/api/` se refresca desde el backend.

## Pendiente de decidir
- Si se añade como ola propia (Ola 2.5, ya registrada en el plan principal) o dentro de la Ola 3 / Ola 4.
