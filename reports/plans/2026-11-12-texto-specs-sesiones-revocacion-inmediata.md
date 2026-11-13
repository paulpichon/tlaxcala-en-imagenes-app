---
title: "Texto para SPECS-SESIONES.md - revocación inmediata de sesión (F8)"
type: plan
status: completed
completed: "2026-11-12"
created: "2026-11-12"
expires: "2027-02-10"
related: "Plan: reports/plans/2026-11-12-plan-revocacion-inmediata-sesiones.md. Destino: backend docs/specs/SPECS-SESIONES.md (repo login-autenticacion)."
branch: desarrollo
---

# Texto para copiar a `SPECS-SESIONES.md` — REEMPLAZADO

> **Reemplazado el 2026-11-12.** Este borrador proponía un caché de 15 s y aceptar tokens sin `sid`, lo que duplica E3/E4 y contradice la decisión 1 del backend. La versión vigente ya está escrita en el backend (`SPECS-SESIONES.md` §4.2, §4.4 y decisiones I, J, K). Se conserva solo como historial; no copiar.

> Borrador redactado desde el frontend. El número de sección y las referencias a archivos del backend se ajustan al copiarlo. Cuando se implemente, actualizar también `docs/api/auth.md` (logout, `SESSION_REVOKED`, nota H24).

---

## § Revocación inmediata de sesión (F8)

**Estado:** decidido (2026-11-12) · pendiente de implementar.

### Problema
La revocación de sesiones (cambio de contraseña, `DELETE /api/auth/sesiones/...`, logout desde otro dispositivo) borra el refresh token en `UserToken`, pero el `accessToken` (JWT, hasta 1 h) de la sesión revocada sigue siendo válido por firma. Esa sesión continúa funcionando hasta que el access token expire y falle el refresh (hallazgo H24). Se observó en pruebas: tras cambiar la contraseña en un navegador, la sesión de otro navegador siguió activa.

### Decisiones
1. **Ventana de revocación: 15 segundos.** Una sesión revocada deja de ser aceptada como máximo 15 s después de la revocación.
2. **Claim `sid`** en el access token: identifica la sesión (el `_id` del documento `UserToken` o un identificador equivalente generado al crear la sesión y estable durante sus rotaciones de refresh).
3. **Código `401 SESSION_REVOKED`** cuando el `sid` del access token ya no corresponde a una sesión viva.
4. **Tokens sin `sid`** (emitidos antes del despliegue): se aceptan hasta que expiren (máx. 1 h). No se fuerza el cierre de sesión a nadie al desplegar. Los tokens nuevos siempre llevan `sid`.
5. **Logout sin cookie `refreshToken`** (F8d): `POST /api/auth/logout` funciona sin sesión, borra el hash del refresh token solo si la cookie existe y **siempre** responde `200` limpiando las cookies `accessToken` y `refreshToken`. Se elimina `validarRefreshToken` de esa ruta. Modelo: `POST /api/v1/admin/auth/logout`.

### Comportamiento de `verificarTokenSesion`
1. Verifica firma y expiración del access token (como hoy).
2. Si el token trae `sid`: comprueba que la sesión exista en `UserToken` (y no esté revocada) usando un **caché en memoria** de sesiones vivas con TTL de 15 s. Si no existe, responde `401` con `code: 'SESSION_REVOKED'`.
3. Si el token no trae `sid`: continúa sin comprobar (compatibilidad temporal, decisión 4). Retirar esta rama cuando haya pasado más de 1 h desde el despliegue más una holgura razonable.
4. Se mantiene el resto de las comprobaciones actuales (`tokenVersion`, estatus de la cuenta, etc.).

### Caché
- Clave: `sid`. Valor: sesión viva (o ausencia confirmada). TTL: 15 s.
- **Invalidación explícita:** al revocar una sesión (cambio de contraseña, logout, cierre de sesión individual o de "otras" en F6, detección de reuso) se elimina la entrada del caché en el proceso que revoca, para que ese proceso no espere los 15 s.
- Con varias instancias, cada una tiene su caché: la ventana real en otra instancia es de hasta 15 s. No requiere caché compartido.
- Un fallo al consultar `UserToken` (error de base de datos) responde `5xx`; nunca se interpreta como sesión revocada.

### Contrato de error
| Status | code | Cuándo | Cookies |
|---|---|---|---|
| 401 | `SESSION_REVOKED` | El `sid` del access token no corresponde a una sesión viva | Limpia `accessToken` y `refreshToken` |

- No es un token vencido: el frontend **no** debe llamar a `/api/auth/refresh` ante este código, no consume `refreshLimiter` y no lo reintenta.
- Se decide por `code`, nunca por `detail`.

### Impacto en otras tareas
- **F2 / E1b2 (cambio de contraseña):** tras revocar las demás sesiones, `sesionesCerradas` sigue indicando cuántas; la sesión actual conserva su `sid`.
- **F6 (sesiones activas):** `DELETE /api/auth/sesiones/:sessionId` y `/otras` dependen de este mecanismo para que la sesión cerrada deje de funcionar en ≤ 15 s.
- **F5 (`403 ACCOUNT_RESTRICTED`):** independiente; no se mezcla con `SESSION_REVOKED`.

### Criterios de aceptación (backend)
- Con dos sesiones, cambiar la contraseña en una hace que la otra reciba `401 SESSION_REVOKED` en su siguiente petición, con retraso ≤ 15 s y sin tocar cookies.
- La sesión que cambió la contraseña sigue funcionando.
- Un access token sin `sid` (emitido antes del despliegue) sigue aceptándose hasta su `exp`.
- `POST /api/auth/logout` sin cookie `refreshToken` responde `200` y limpia ambas cookies; tras recargar, `/api/auth/me` responde `401`.
- Un error de base de datos al validar la sesión produce `5xx`, no `SESSION_REVOKED`.

### Orden de despliegue
1. Backend F8d (independiente).
2. Backend `sid` + validación + `SESSION_REVOKED`.
3. Frontend F8a–F8c. El frontend nuevo es seguro con un backend viejo (nunca recibe `SESSION_REVOKED`); un backend nuevo con frontend viejo funciona, pero el frontend viejo intentaría un refresh inútil ante el `401`, así que conviene desplegar el frontend poco después.
