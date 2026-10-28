# SPECS para Frontend — Sesión, errores y documentación de API

**Fecha:** 2026-10-27
**Audiencia:** equipo frontend de la app (red social) y del panel de administración.
**Estado:** vigente. Sin breaking changes: rutas, métodos, bodies y formas de respuesta no cambiaron.

Este documento resume lo que el frontend debe saber de los cambios recientes en el backend y recomendaciones para consumir la sesión de forma segura. El contrato detallado de cada endpoint vive en `reports/api/README.md` (índice) y en los archivos de dominio de `reports/api/`.

---

## 1. Fuente de verdad de la API

- Documentación vigente: `reports/api/README.md` y los archivos por dominio (`auth.md`, `usuarios.md`, `posteos.md`, `admin-auth-totp.md`, etc.).
- `reports/api/API_REFERENCE_ADMIN_2026-09-15.md` está **SUPERSEDIDO**. No lo usen como referencia: sus cifras de cookies del panel (10 min / 4 h) ya no son exactas.
- Los ejemplos de request/response de `reports/api/` están construidos a partir del esquema y **no se ejecutaron contra un servidor real**. Ante una duda, prevalece el comportamiento observado en el entorno de desarrollo.

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

### 3.1 Cómo funciona

- Las cookies `accessToken` y `refreshToken` son **httpOnly**: el frontend **no** las lee ni las escribe. Solo deben enviarse con `credentials: 'include'`.
- Vigencia por defecto: access **1 h**, refresh **7 d**. La cookie y el token caducan juntos (el `maxAge` se deriva del propio token).
- El frontend no necesita conocer la vigencia exacta: reaccionar a los `401` es suficiente.

### 3.2 Serializar `POST /api/auth/refresh` (crítico)

Cada `refresh` **rota** el `refreshToken`. Si dos peticiones llegan con el mismo token, la primera rota y la segunda no lo encuentra. El backend interpreta eso como robo y **cierra todas las sesiones del usuario** (`401` con "Sesión comprometida. Inicia sesión nuevamente.").

**Requisito:** un único refresh en vuelo. Las demás peticiones que reciban `401` deben esperar a ese refresh y reintentar una vez.

Patrón recomendado:

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

Reintentar la petición original una sola vez tras `renovarSesion()`. Si el refresh falla, redirigir a login.

**Multi-pestaña (implementado).** La deduplicación en memoria solo cubre una pestaña. Dos pestañas pueden enviar el mismo `refreshToken` a la vez y disparar el falso positivo de reuso. Ambos frontends envuelven el refresh en un **Web Lock** (`navigator.locks.request`): app `tlaxapp:auth-refresh`, panel `tlaxapp:admin-auth-refresh`. Dentro del lock se reintenta primero la petición original; si ya devuelve algo distinto de `401`, otra pestaña renovó la cookie y no se hace un segundo refresh. Si el navegador no soporta Web Locks, el flujo cae a la deduplicación en memoria.

**Errores de red.** Un fallo de red (o un `5xx`/`429`) al renovar **no** invalida la sesión: no se debe expulsar al usuario. Solo un `401`/`403` del refresh (o "Sesión comprometida") cierra sesión. En la app, `IAuthContext` expone `error`/`clearError` para informar el fallo transitorio. Provocar el cierre de sesión por un corte de red es un bug, no un caso esperado.

### 3.3 Manejo de `401`

| Situación | Respuesta | Acción |
|---|---|---|
| Access expirado | `401` `UNAUTHORIZED` ("Token no válido" / "Sesión expirada") | Llamar a `renovarSesion()` y reintentar una vez |
| Refresh expirado o sin registro | `401` en `/api/auth/refresh` | Redirigir a login |
| Reuso detectado | `401` "Sesión comprometida…" | Redirigir a login (todas las sesiones fueron revocadas) |
| Sesión tras 30 días continuos | `401` "Sesión comprometida…" | Redirigir a login (ver riesgo H22 abajo) |

### 3.4 Logout

- `POST /api/auth/logout` borra el refresh en el servidor y limpia las cookies.
- El **access token sigue siendo aceptado por el servidor hasta su expiración** (hasta 1 h). No dependan de la invalidación server-side: limpien su estado local (usuario, caché, stores) al cerrar sesión.
- La app limpia además las claves de `sessionStorage` ligadas a la sesión (`registroToken`, `passForgetToken`, `passwordResetSuccess`, `reporteExitoso`) para que otro usuario en el mismo navegador no herede estado. No se tocan `lastPasswordRequest` ni `bloqueoReenvioCorreo`, que son temporizadores anti-abuso.

### 3.5 Usuarios suspendidos

- Un usuario con `estatus` 2 o 3 que ya tenía sesión **puede seguir renovándola** con `/refresh` hasta que expire. Solo el login lo bloquea. No hay acción de frontend; es un tema de backend pendiente.

## 4. Sesión del panel de administración

- Cookies `adminAccessToken` y `adminRefreshToken` con `path: /api/v1/admin`. Solo viajan a esa base.
- Aplican las mismas reglas de **serializar el refresh** (`POST /api/v1/admin/auth/refresh`, lock entre pestañas) y de logout (limpiar estado local).
- **No hardcodeen** las vidas de las cookies (10 min / 4 h en la doc vieja). Dependen de `ADMIN_ACCESS_TOKEN_EXPIRY` y `ADMIN_REFRESH_TOKEN_EXPIRY` del entorno.
- El panel guía su UI por `permisos` (del payload de `GET /api/v1/admin/auth/me`), no por `rol`.

### 4.1 `401 INVALID_CURRENT_PASSWORD` (no es una sesión vencida)

`POST /api/v1/admin/auth/cambiar-password`, `POST /api/v1/admin/auth/totp/regenerar-backups` y `POST /api/v1/admin/auth/totp/reemitir` responden `401` cuando la contraseña actual no coincide, pero con un código propio:

```json
{
  "status": 401,
  "code": "INVALID_CURRENT_PASSWORD",
  "title": "Authentication Required",
  "detail": "La contraseña actual es incorrecta"
}
```

- El status se mantiene en `401` para no romper clientes que solo miran el status; el `code` es el discriminador.
- **No** debe disparar un refresh: rotaría las cookies, consumiría el rate limit (10/15 min) y, si el refresh fallara, cerraría la sesión por un error de formulario.
- El interceptor del panel exceptúa explícitamente este código. `isInvalidCurrentPassword()` en `src/lib/api/error-utils.ts` lo detecta; no comparar `detail`.

## 5. Notificaciones Web Push

- El campo `icon` del payload ahora es `imagen_perfil.secure_url` del autor o, si no hay, `ICONO_SISTEMA_TLAXAPP`.
- Si no hay ninguno de los dos, **el payload viene sin la clave `icon`**. El service worker debe tolerarlo y usar un icono por defecto.
- No hay rutas relativas (`/public/...`) en el payload: los iconos son URLs absolutas.
- **Implementado:** `public/sw.js` usa `/assets/icono-tlaxapp-beige.png` como fallback. El valor anterior (`/icon-192x192.png`) no existía en `public/`, así que las notificaciones sin `icon` se mostraban sin imagen.

## 6. Cookie de atribución (early access)

- `early_access_atribucion` usa `SameSite=Lax`. Si la landing y la API están en dominios distintos, el navegador puede no enviarla ni aceptarla en peticiones cross-site.
- **[REQUIERE VERIFICACIÓN MANUAL]** en producción antes de depender de la atribución (H21).

## 7. Riesgos conocidos (documentados, aún no corregidos)

Estos comportamientos existen hoy. Están registrados en `AGENTS.md` (§ *Known session gaps*) y en `reports/api/README.md` (H22–H24). Corregirlos se hará en un cambio aparte, pero el frontend debe contemplarlos:

- **H22** — Sesiones de más de 30 días (usuarios) o 12 h (panel) pierden su registro de refresh: el siguiente refresh devuelve "Sesión comprometida". Tratarlo como cualquier `401` de sesión (login).
- **H23** — Refresh concurrente: **mitigado en el frontend** con Web Locks entre pestañas y deduplicación en memoria (§3.2). El backend sigue sin ventana de gracia, así que un cliente que no implemente el lock todavía puede provocar el falso positivo de reuso.
- **H24** — Logout no invalida el access token: ver §3.4.
- **H3** — Suspensión no corta sesiones existentes: ver §3.5.

## 8. Checklist para el equipo frontend

- [x] Leer `errors[0].code` para detectar duplicados (no `code` de primer nivel). Implementado en `isDuplicateKey()` (`src/lib/apiClient.ts`).
- [x] Implementar refresh único en vuelo (`renovarSesion`) con reintento de una sola vez.
- [x] Serializar el refresh **entre pestañas** con Web Locks.
- [x] Redirigir a login ante "Sesión comprometida" o refresh fallido; **no** cerrar sesión por fallos de red.
- [x] Limpiar estado local al hacer logout.
- [x] Renderer de Web Push: tolerar ausencia de `icon`.
- [x] No hardcodear vidas de cookies ni asumir `15m`/`10m`/`4h`.
- [ ] Usar `reports/api/README.md` como referencia; ignorar `API_REFERENCE_ADMIN_2026-09-15.md`.
- [ ] Verificar la cookie de atribución `SameSite=Lax` en el dominio real de la landing.
- [x] No refrescar la sesión ante `401 INVALID_CURRENT_PASSWORD` (panel).

---

## Historial de este documento

- **2026-10-27** — Versión inicial. Derivada de la corrección de sesiones (`helpers/vigencia-cookie.js`, `helpers/tokensUtils.js`, `controllers/comentarios.js`) y de la documentación nueva de `reports/api/`.
- **2026-10-28** — Implementación en ambos frontends: Web Locks para el refresh entre pestañas, manejo de errores de red sin cerrar sesión, `INVALID_CURRENT_PASSWORD` como código propio del `401` de contraseña actual, lectura de `errors[0].code` para duplicados, icono por defecto del service worker y limpieza de `sessionStorage` en logout.
