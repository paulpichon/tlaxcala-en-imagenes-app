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
| F8c | Revalidar la sesión al volver a la pestaña (`visibilitychange`) con una llamada ligera autenticada, para que una pestaña en segundo plano no espere a la siguiente acción del usuario. Respetar el Web Lock y los límites de refresh. | `AuthContext.tsx` |

## Criterios de aceptación

- Con dos navegadores abiertos, al cambiar la contraseña en uno, el otro queda en el login en menos de la ventana acordada (TTL del caché) tras su siguiente petición o al volver a la pestaña, sin tocar cookies.
- El `401 SESSION_REVOKED` no llama a `/api/auth/refresh` ni gasta `refreshLimiter`.
- La sesión que cambió la contraseña sigue activa.
- Un fallo de red o `5xx` en la revalidación no cierra la sesión.

## Dependencias y orden

- Backend primero: el frontend (F8a–F8c) no tiene efecto hasta que el backend emita `SESSION_REVOKED`. El orden inverso es seguro: un backend viejo nunca envía ese código.
- Conviene resolverlo antes de la Ola 4 (F6), que depende del mismo comportamiento.

## Pendiente de decidir

- TTL del caché de sesiones en el backend (ventana máxima aceptable).
- Nombre definitivo del código (`SESSION_REVOKED`) y del claim (`sid` / `jti`).
- Si se añade como ola propia o dentro de la Ola 3 / Ola 4.
- Documentar el resultado en `AGENTS.md` y `SPECS/SPECS-FRONTEND-SESION-Y-CONTRATOS.md` (requiere autorización explícita del humano).
