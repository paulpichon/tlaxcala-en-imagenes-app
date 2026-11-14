---
title: "Plan - revocación inmediata de sesiones (F8 y E1d)"
type: plan
status: working
created: "2026-11-12"
expires: "2027-02-10"
related: "Frontend: reports/plans/2026-11-11-plan-frontend-rediseno-sesiones.md. Backend (C:\Users\paul1\Documents\Backend\login-autenticacion): docs/specs/SPECS-SESIONES.md (§4.2, §4.4, decisiones I-K) y engineering/working/implementation-plans/2026-11-11-plan-implementacion-rediseno-sesiones.md (E1d, E4)."
branch: desarrollo
---

# Revocación inmediata de sesiones — F8 (frontend) y E1d (backend)

Estado: **F8 implementado y probado (2026-11-13), sin desplegar**: sale con el deploy de la ola 3 (E7). Pruebas manuales en `2026-11-11-plan-frontend-rediseno-sesiones.md`, «Implementación de F8 y F5». Reconciliado con el diseño del backend el 2026-11-12: **no se adelanta una solución parcial**; la revocación inmediata se entrega con E3 + E4 (ola 3).

## Problema observado (2026-11-12, entorno local)

Con dos sesiones (Edge normal y Edge privado), al cambiar la contraseña en la privada:

- `PUT /api/usuarios/password` informó `sesionesCerradas` y `usertokens` quedó con una sola fila viva.
- La sesión del navegador normal **siguió funcionando**; solo se cerró al borrar la cookie `accessToken` a mano.

**Causa:** se revocan los refresh tokens, pero el `accessToken` (JWT, hasta 1 h) de las otras sesiones sigue siendo válido por firma. Hoy `verificarTokenSesion` no consulta `usertokens` (hallazgo H24 de `docs/api/auth.md`). El frontend no puede enterarse. Es el comportamiento esperado **antes de E4**.

## Segundo hallazgo: logout sin cookie `refreshToken`

Con el access token vivo y la cookie `refreshToken` borrada:

- F2 y F3 muestran bien «Tu sesión ya no es válida…» (`403 FORBIDDEN`).
- Cerrar sesión no funciona: `POST /api/auth/logout` exige `refreshToken` y responde `401` sin limpiar la cookie `accessToken` (httpOnly). El estado local se limpia, pero al recargar `/api/auth/me` acepta el access token y devuelve al usuario a `/inicio`.

## Decisión (2026-11-12): reconciliación con el backend

El `SPECS-SESIONES.md` del backend ya diseña la revocación inmediata: E3 pone `sid` en el access token y E4 lo valida contra `UserToken` en cada petición, sin caché y con re-login forzado (decisión 1, §7). Un adelanto con caché de 15 s y tokens sin `sid` aceptados 1 h duplicaría el trabajo en los mismos middlewares y contradiría la decisión 1. Por eso:

1. **Se descartan** la ventana de 15 s, el caché en memoria y la aceptación de tokens sin `sid`. (Quedaron propuestos y confirmados antes de ver el diseño completo del backend; se retiran.)
2. **Hasta la ola 3** se acepta la ventana de hasta 1 h del access token.
3. **Se mantiene** `SESSION_REVOKED` como código del `401` (decisión I del backend). Se emite cuando falta `sid`, la sesión no existe o venció; también para tokens anteriores al rediseño.
4. **E1d (backend, sale antes de la ola 3):** logout sin cookie `refreshToken` (decisión J). No requiere cambios en el frontend.

## Tareas

### Backend (repo `login-autenticacion`)
| ID | Tarea | Ola | Estado |
|---|---|---|---|
| E1d | `POST /api/auth/logout` sin `validarRefreshToken`: borra la fila solo si identifica la sesión y siempre responde `200` limpiando `accessToken` y `refreshToken` | 2.5 | hecho (2026-11-12) · desplegado (2026-11-12) |
| E4 | Responder `401 SESSION_REVOKED` en lugar del `401` genérico | 3 | hecho en la rama de la ola 3 (2026-11-13, `a398f7b`) · sin desplegar |

### Frontend (F8, se despliega con E4 en la ola 3, junto a F5) — hecho (2026-11-13) · sin desplegar
| Paso | Detalle | Archivos |
|---|---|---|
| F8a | Añadir `SESSION_REVOKED` a `ApiErrorCode` y a `CODIGOS_401_SIN_REFRESH`: ese `401` no intenta refresh y cierra la sesión local de inmediato (misma lógica que F1). | `src/lib/apiClient.ts`, `src/context/AuthContext.tsx` |
| F8b | Al cerrar por `SESSION_REVOKED`, mostrar en el login un mensaje claro («Tu sesión se cerró porque se cambió la contraseña o se cerró desde otro dispositivo»). Decidir por `code`, nunca por `detail`. Comparte mecanismo con el mensaje de F5. | `AuthContext.tsx`, `FormularioLogin.tsx` |
| F8c | Revalidar la sesión al volver a la pestaña (`visibilitychange`) con una llamada ligera autenticada, para que una pestaña en segundo plano no espere a la siguiente acción. Respetar el Web Lock y los límites de refresh. | `AuthContext.tsx` |

F8a–F8c no tienen efecto hasta que el backend emita `SESSION_REVOKED` (E4). El frontend nuevo es seguro con un backend viejo.

## Criterios de aceptación

- [x] **E1d** (verificado en el entorno desplegado, 2026-11-12): con el access token vivo y sin cookie `refreshToken`, «Cerrar sesión» limpia ambas cookies; al recargar, `/api/auth/me` responde `401` y se llega al login.
- **E4 + F8 (ola 3):** con dos navegadores, al cambiar la contraseña en uno, el otro recibe `401 SESSION_REVOKED` en su siguiente petición (o al volver a la pestaña) y queda en el login sin tocar cookies. La sesión que cambió la contraseña sigue activa.
- `SESSION_REVOKED` no llama a `/api/auth/refresh` ni gasta `refreshLimiter`.
- Un fallo de red o `5xx` en la revalidación no cierra la sesión. Desde E4 el backend responde `500` (no `401`) si falla la base de datos al validar la sesión, así que este caso sí puede llegar.

Contrato completo de E4 para el frontend (tabla de códigos y los dos cambios de contrato): sección «Cambios de contrato del backend en la ola 3» de `2026-11-11-plan-frontend-rediseno-sesiones.md`.

## Dónde está documentado

- Backend (ya escrito en la rama `sesiones-revocacion-inmediata`, commit `90deeb8`): `SPECS-SESIONES.md` (§4.2, §4.4, decisiones I, J, K y §11) y el plan de implementación (E1d, E4, F8, ola 2.5, riesgos).
- Frontend: este plan. Al terminar, `SPECS/SPECS-FRONTEND-SESION-Y-CONTRATOS.md`, `AGENTS.md` y `CHANGELOG.md` dentro de F7 (requiere autorización explícita del humano).
