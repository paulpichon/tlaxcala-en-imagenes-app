# SPECS para Frontend — Sesión, errores y documentación de API

**Fecha:** 2026-10-27 · **Actualizado:** 2026-11-17 (rediseño de sesiones, Fase E)
**Audiencia:** equipo frontend de la app (red social) y del panel de administración.
**Estado:** vigente. La §3 describe el modelo de sesiones rediseñado (olas 1–4, backend `docs/specs/SPECS-SESIONES.md`) y sustituye a la versión del 2026-10-27.

Este documento resume lo que el frontend debe saber de los cambios recientes en el backend y recomendaciones para consumir la sesión de forma segura. El contrato detallado de cada endpoint vive en `docs/api/README.md` (índice) y en los archivos de dominio de `docs/api/`.

> Copia local del documento del backend (`login-autenticacion/docs/specs/SPECS-FRONTEND-SESION-Y-CONTRATOS.md`, actualizado en E8). Las notas marcadas **«En la app»** describen la implementación de este repo y no están en el original.

---

## 1. Fuente de verdad de la API

- Documentación vigente: `docs/api/README.md` y los archivos por dominio (`auth.md`, `usuarios.md`, `posteos.md`, `admin-auth-totp.md`, etc.).
- `API_REFERENCE_ADMIN_2026-09-15.md` (antes en `reports/api/`, eliminado del repo) está **SUPERSEDIDO**. No lo usen como referencia: sus cifras de cookies del panel (10 min / 4 h) ya no son exactas.
- Los ejemplos de request/response de `docs/api/` están construidos a partir del esquema y **no se ejecutaron contra un servidor real**. Ante una duda, prevalece el comportamiento observado en el entorno de desarrollo.

## 2. Contrato de error de duplicados (409)

La respuesta real de un duplicado de MongoDB es:

```json
{
  "status": 409,
  "code": "CONFLICT",
  "detail": "El recurso ya existe: correo duplicado",
  "errors": [{ "field": "correo", "code": "DUPLICATE_KEY", "message": "El valor para \"correo\" ya está en uso" }]
}
```

- El código de primer nivel es **`CONFLICT`**.
- `DUPLICATE_KEY` está en **`errors[0].code`**, junto con `errors[0].field`.
- Si su código compara `body.code === 'DUPLICATE_KEY'`, esa comparación **nunca coincide**. Debe leer `errors[0].code`.
- Aplica a: registro (`POST /api/usuarios`), early access (`POST /api/early-access`) y cuentas del panel (`POST /api/v1/admin/cuentas`).

Los códigos de error son en **MAYÚSCULAS** (`CONFLICT`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMIT_EXCEEDED`, `INTERNAL_ERROR`, …).

## 3. Sesión de usuario (cookies)

Diseño completo y decisiones: backend `docs/specs/SPECS-SESIONES.md`. Decidir **siempre por `code`**, nunca por el texto de `detail`.

### 3.1 Cómo funciona

- Las cookies `accessToken` y `refreshToken` son **httpOnly**: el frontend **no** las lee ni las escribe. Solo deben enviarse con `credentials: 'include'`.
- Vigencia por defecto: access **1 h**, refresh **7 d**, deslizante en cada refresh y con un **tope de 90 días** desde el login. Al acercarse al tope la cookie de refresh dura menos; al vencer, hay que iniciar sesión otra vez. El frontend no necesita conocer las vigencias: basta con reaccionar a los códigos.
- Cada login crea una **sesión** en el servidor (`sessionId`, que viaja como `sid` en ambos tokens). Cada request autenticado comprueba que esa sesión siga viva: cerrarla (logout, «Sesiones activas», cambio de contraseña en otro dispositivo) corta el access token **al instante**.

### 3.2 `POST /api/auth/refresh`

Cada refresh rota el `refreshToken` de forma atómica. Si dos peticiones llegan con el mismo token, la segunda (dentro de 30 s) recibe `409` y **la sesión sobrevive**. Ya no existe la «sesión comprometida» que cerraba todas las sesiones.

| Caso | Respuesta | Acción del frontend |
|---|---|---|
| Otra petición renovó hace ≤ 30 s (doble pestaña, retry) | `409 CONFLICT`, sin cookies nuevas | Esperar ~300 ms y reintentar la petición original una vez con las cookies actuales |
| Sesión cerrada, vencida, revocada o anterior al rediseño | `401 SESSION_REVOKED` | Sesión cerrada: cierre local con aviso, sin reintentar |
| Reuso de un refresh ya rotado (fuera de la gracia) | `401 SESSION_REVOKED` | Igual. El backend cierra **solo esa sesión** |
| Cuenta en estatus 2 o 3 | `403 ACCOUNT_RESTRICTED` | Cierre local con aviso de cuenta restringida |
| Cuenta no activada (estatus 0) o firma inválida | `403 FORBIDDEN` | Sesión inválida → login |
| Refresh vencido, sin cookie o usuario eliminado | `401 UNAUTHORIZED` | Sesión inválida → login |

Se recomienda seguir con **un único refresh en vuelo** (`renovarSesion`) para no gastar `refreshLimiter` (10 / 15 min), aunque la concurrencia ya no es crítica:

```js
let refreshEnVuelo = null;

async function renovarSesion() {
  if (!refreshEnVuelo) {
    refreshEnVuelo = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      .finally(() => { refreshEnVuelo = null; });
  }
  return refreshEnVuelo;
}
```

**En la app** (`src/context/AuthContext.tsx`):
- **Web Lock entre pestañas:** el refresh sigue dentro de un Web Lock (`tlaxapp:auth-refresh`; en el panel, `tlaxapp:admin-auth-refresh`). Desde la gracia de 30 s ya no es crítico, pero evita gastar `refreshLimiter` con refresh duplicados. Dentro del lock se reintenta primero la petición original: si ya no devuelve `401`, otra pestaña renovó la cookie. Si el navegador no soporta Web Locks, se usa la deduplicación en memoria.
- **El `409`:** `pedirRefresh()` lo trata como «carrera» (F4). Espera, reintenta una vez y, si llega un segundo `409` consecutivo, lo trata como error transitorio.
- **Errores de red:** un fallo de red, un `5xx` o un `429` al renovar **no** invalidan la sesión. Solo un `401`/`403` del refresh la cierra. `IAuthContext` expone `error`/`clearError` para informar el fallo transitorio.

### 3.3 Respuestas de cualquier ruta autenticada

| Situación | Respuesta | Acción |
|---|---|---|
| Access expirado o firma inválida, `tokenVersion` distinta, usuario eliminado | `401 UNAUTHORIZED` | `renovarSesion()` y reintentar una vez |
| Sesión cerrada, revocada o vencida; token sin `sid` | `401 SESSION_REVOKED` | **Sin refresh**: cierre local, aviso en el login y `POST /api/auth/logout` para limpiar las cookies |
| Cuenta en estatus 2 o 3 | `403 ACCOUNT_RESTRICTED` | **Sin refresh**: cierre local con aviso de cuenta restringida y `POST /api/auth/logout` |
| Cuenta no activada (estatus 0) | `403 FORBIDDEN` | Sin cambios |
| Contraseña actual incorrecta (cambio de contraseña, borrar cuenta, cerrar otras sesiones) | `401 INVALID_CURRENT_PASSWORD` | **Sin refresh**: mensaje en el campo |
| Fallo de base de datos al validar la sesión | `500` | Error del servidor: **no** refrescar ni cerrar la sesión |
| Enlace de correo vencido (`verificar-correo`, `validar-token-reset-password`, `reestablecer-password`, `reenviar-correo`) | `401 TOKEN_EXPIRED` | Mostrar «el enlace expiró». **No** llamar a `renovarSesion()` |
| Enlace de correo con firma inválida o mal formado (mismos endpoints) | `401 UNAUTHORIZED` («Token inválido») | Mostrar «enlace no válido». **No** llamar a `renovarSesion()` |

**En la app:**
- **Códigos sin refresh:** `CODIGOS_401_SIN_REFRESH` incluye `TOKEN_EXPIRED`, `INVALID_CURRENT_PASSWORD` y `SESSION_REVOKED`.
- **Cierre forzado:** `fetchWithAuth` revisa toda respuesta `401`/`403`, incluida la que se reintenta tras un refresh. Si trae `SESSION_REVOKED` o `ACCOUNT_RESTRICTED`, llama a `cerrarSesionPorMotivo`.
- **El motivo:** se guarda en `sessionStorage` (`motivoCierreSesion`) y `FormularioLogin` lo muestra una sola vez.
- **Revalidación:** al volver a la pestaña (`visibilitychange`), si hay sesión, se llama a `GET /api/auth/me`, como máximo una vez cada 30 s (F8c).
- **Al montar:** si `/api/auth/me` responde `5xx`, se reintenta con backoff sin cerrar la sesión.

### 3.4 Logout

- `POST /api/auth/logout` **no exige sesión**: borra la sesión del servidor si la identifica y **siempre** responde `200` limpiando `accessToken` y `refreshToken`.
- El access token deja de funcionar al instante (`401 SESSION_REVOKED` en la siguiente petición). Igual hay que limpiar el estado local (usuario, caché, stores).
- **En la app:** se limpian además las claves de `sessionStorage` ligadas a la sesión (`registroToken`, `passForgetToken`, `passwordResetSuccess`, `reporteExitoso`, `motivoCierreSesion`). Así otro usuario en el mismo navegador no hereda estado. No se tocan `lastPasswordRequest` ni `bloqueoReenvioCorreo`, que son temporizadores anti-abuso.

### 3.5 Contraseña y step-up

- `PUT /api/usuarios/password` `{ passwordActual, passwordNueva }`: cierra **todas las demás** sesiones (`data.sesionesCerradas`); la actual sigue. `422` con `errors[0].code: 'SAME_AS_CURRENT'` si la nueva es igual a la actual.
- `PUT /api/usuarios/update` ya no acepta `password`: `422` con `errors[0].code: 'USE_PASSWORD_ENDPOINT'`.
- `DELETE /api/usuarios/delete` exige `{ passwordActual }` en el body y borra todas las sesiones.
- Restablecer la contraseña por correo cierra **todas** las sesiones.
- Los tres endpoints con `passwordActual` (cambio, borrado y `DELETE /api/auth/sesiones/otras`) comparten el límite `429 PASSWORD_BLOCKED` (5 / 15 min): los fallos en una pantalla cuentan en las otras.
- **En la app:** `/configuracion/cambiar-password` (F2) y `/configuracion/eliminar-cuenta` (F3).

### 3.6 Sesiones activas

| Endpoint | Respuesta | Notas |
|---|---|---|
| `GET /api/auth/sesiones` | `200 { data: [{ sessionId, deviceName, paisUltimo, ipUltima, lastUsed, esActual }] }` | Orden `lastUsed` desc. `ipUltima` enmascarada (`187.162.x.x`, `2806:2f0:x:x:x:x:x:x`) o `null`. `deviceName` puede ser `null`; `paisUltimo` es siempre `null` por ahora |
| `DELETE /api/auth/sesiones/:sessionId` | `200 { msg: "Sesión cerrada" }` | UUID v4 (si no, `422`). Ajena, vencida o inexistente → `404`. La actual equivale a logout (limpia cookies) |
| `DELETE /api/auth/sesiones/otras` | `200 { msg: "Sesiones cerradas", data: { cerradas } }` | Body `{ passwordActual }` (`422` si falta). Incorrecta → `401 INVALID_CURRENT_PASSWORD` sin cerrar nada |

Límites: `429 SESIONES_BLOCKED` (30 / 15 min por usuario, compartido por los tres), `429 PASSWORD_BLOCKED` en `/otras` (§3.5) y `FLOOD_BLOCKED` por IP.

**En la app** (`/configuracion/sesiones`, F6: `SesionesActivas.tsx` + `useSesionesActivas`):
- **Carga:** la lista se pide una vez al montar, nunca al volver a la pestaña, para no gastar el cupo de 30 / 15 min. La sesión actual va primero, con la insignia «Este dispositivo».
- **La sesión actual:** no tiene botón de cierre. Para salir se usa el logout normal.
- **Un `404` al cerrar una sesión:** significa que ya no existía. Se quita de la lista sin mostrar error.

## 4. Sesión del panel de administración

- Cookies `adminAccessToken` y `adminRefreshToken` con `path: /api/v1/admin`. Solo viajan a esa base.
- Aplican las mismas reglas de **serializar el refresh** (`POST /api/v1/admin/auth/refresh`, lock entre pestañas) y de logout (limpiar estado local).
- **No hardcodeen** las vidas de las cookies (10 min / 4 h en la doc vieja). Dependen de `ADMIN_ACCESS_TOKEN_EXPIRY` y `ADMIN_REFRESH_TOKEN_EXPIRY` del entorno.
- El panel guía su UI por `permisos` (del payload de `GET /api/v1/admin/auth/me`), no por `rol`.

### 4.1 `401 INVALID_CURRENT_PASSWORD` en el panel

`POST /api/v1/admin/auth/cambiar-password`, `POST /api/v1/admin/auth/totp/regenerar-backups` y `POST /api/v1/admin/auth/totp/reemitir` responden `401` con `code: 'INVALID_CURRENT_PASSWORD'` cuando la contraseña actual no coincide. **No** debe disparar un refresh. El interceptor del panel exceptúa este código (`isInvalidCurrentPassword()` en `src/lib/api/error-utils.ts`); no comparar `detail`. La app aplica la misma regla a sus propios endpoints (§3.3).

## 5. Notificaciones Web Push

- El campo `icon` del payload ahora es `imagen_perfil.secure_url` del autor o, si no hay, `ICONO_SISTEMA_TLAXAPP`.
- Si no hay ninguno de los dos, **el payload viene sin la clave `icon`**. El service worker debe tolerarlo y usar un icono por defecto.
- No hay rutas relativas (`/public/...`) en el payload: los iconos son URLs absolutas.
- **En la app:** `public/sw.js` usa `/assets/icono-tlaxapp-beige.png` como fallback.

## 6. Cookie de atribución (early access)

- `early_access_atribucion` usa `SameSite=Lax`. Si la landing y la API están en dominios distintos, el navegador puede no enviarla ni aceptarla en peticiones cross-site.
- **[REQUIERE VERIFICACIÓN MANUAL]** en producción antes de depender de la atribución (H21).

## 7. Riesgos conocidos

Los riesgos H22, H23, H24 y H3 de la versión anterior **quedaron resueltos** con el rediseño de sesiones (ola 3, 2026-11-13):
- tope de 90 días con vigencia deslizante;
- gracia de 30 s en el refresh concurrente;
- revocación inmediata del access token;
- rechazo de cuentas restringidas en cada request.

Siguen vigentes:
- **Panel de administración**: `AdminToken` mantiene su TTL de 12 h desde el login y la detección de reuso que cierra todas las sesiones del panel (fuera del rediseño, decisión 5 de `SPECS-SESIONES.md`). Serializar `POST /api/v1/admin/auth/refresh` (§4).
- **`429` de Cloudflare**: si la regla de ráfagas de Cloudflare se dispara, la respuesta es HTML (error 1015), no JSON. Tratar un `429` que no sea JSON como error genérico. **En la app:** `handleApiResponse` lo convierte en un `ApiError` sin `code` y la UI muestra el mensaje por defecto de la operación.

## 8. Checklist para el equipo frontend

- [x] Leer `errors[0].code` para detectar duplicados (no `code` de primer nivel). Implementado en `isDuplicateKey()` (`src/lib/apiClient.ts`).
- [x] Refresh único en vuelo con reintento de una sola vez, y Web Lock entre pestañas.
- [x] `409` en `/api/auth/refresh` → esperar y reintentar una vez (F4).
- [x] `401 SESSION_REVOKED` y `403 ACCOUNT_RESTRICTED` → cierre local sin refresh + `POST /api/auth/logout` (F8, F5).
- [x] `401 INVALID_CURRENT_PASSWORD` no dispara refresh (F1; en el panel, §4.1).
- [x] `500` al validar la sesión y los fallos de red no cierran la sesión (F8).
- [x] Pantallas de cambio de contraseña, eliminar cuenta y sesiones activas con `passwordActual` (F2, F3, F6).
- [x] Limpiar estado local y `sessionStorage` al hacer logout.
- [x] Renderer de Web Push: tolerar ausencia de `icon`.
- [x] No hardcodear vidas de cookies ni asumir `15m`/`10m`/`4h`.
- [ ] Usar `docs/api/README.md` como referencia; ignorar `API_REFERENCE_ADMIN_2026-09-15.md` (eliminado, ver §1).
- [ ] Verificar la cookie de atribución `SameSite=Lax` en el dominio real de la landing.

---

## Historial de este documento

- **2026-11-17** — Rediseño de sesiones (Fase E; backend E8, frontend F7):
  - Se sincroniza con la versión del backend: §3 reescrita (refresh con `409`, `SESSION_REVOKED`, `ACCOUNT_RESTRICTED`, logout sin sesión, step-up con `passwordActual`, sesiones activas y tope de 90 días), y §7 da por resueltos H22–H24 y H3.
  - Se conservan las notas «En la app»: Web Lock, errores de red, `sessionStorage`, `sw.js` y §4.1 resumida. Se añaden las de F1–F8.
- **2026-10-28** — Implementación en ambos frontends: Web Locks para el refresh entre pestañas, manejo de errores de red sin cerrar sesión, `INVALID_CURRENT_PASSWORD` como código propio del `401` de contraseña actual, lectura de `errors[0].code` para duplicados, icono por defecto del service worker y limpieza de `sessionStorage` en logout.
- **2026-10-27** — Versión inicial. Derivada de la corrección de sesiones (`helpers/vigencia-cookie.js`, `helpers/tokensUtils.js`, `controllers/comentarios.js`) y de la documentación nueva de `docs/api/` (antes en `reports/api/`).
