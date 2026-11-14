---
title: "Plan frontend - rediseño de sesiones (Fase E del backend)"
type: plan
status: working
created: "2026-11-11"
expires: "2027-02-09"
related: "Backend: docs/specs/SPECS-SESIONES.md y engineering/working/implementation-plans/2026-11-11-plan-implementacion-rediseno-sesiones.md"
branch: desarrollo
---

# Plan frontend — rediseño de sesiones

Contrapartida del plan del backend (repo `login-autenticacion`). Resultado de revisar este repo el 2026-11-11: no hay sesión en servidor (sin `middleware`/`cookies()`), todo vive en `src/context/AuthContext.tsx`, `src/lib/apiClient.ts` y los formularios. Las decisiones están aprobadas en `SPECS-SESIONES.md` §10 del backend.

## Estado

Leyenda: `pendiente` · `en curso` · `hecho (fecha)` · `desplegado (fecha)`. Se actualiza en el mismo commit que implementa la tarea.

| ID | Tarea | Archivos | Se despliega con | Estado |
|---|---|---|---|---|
| F1 | Añadir `INVALID_CURRENT_PASSWORD` a `CODIGOS_401_SIN_REFRESH` y a `ApiErrorCode` (también `ACCOUNT_RESTRICTED`, `PASSWORD_BLOCKED`) | `src/context/AuthContext.tsx`, `src/lib/apiClient.ts` | Ola 1 (antes de E1b y E3) | hecho (2026-11-11) · desplegado (2026-11-11) |
| F4 | `pedirRefresh()`: un `409` del refresh no es fallo de red ni sesión inválida; esperar ~300 ms y reintentar la petición original una sola vez | `src/context/AuthContext.tsx` | Ola 1 (antes de E3b) | hecho (2026-11-11) · desplegado (2026-11-11) |
| F2 | Pantalla «Cambiar contraseña» (actual / nueva / confirmar) que llama a `PUT /api/usuarios/password`; quitar `password` y `confirmPassword` del perfil | nueva ruta bajo `src/app/configuracion/`, `PerfilForm.tsx`, `useEditarPerfil.ts`, `Configuraciones.tsx` | Ola 2 (con E1b; antes de E1b2) | hecho (2026-11-12) · desplegado (2026-11-12) |
| F3 | `EliminarCuenta.tsx`: campo de contraseña; `apiDelete` acepta body | `EliminarCuenta.tsx`, `apiClient.ts` | Ola 2 (con E1c) | hecho (2026-11-12) · desplegado (2026-11-12) |
| F8 | Revocación inmediata: `401 SESSION_REVOKED` sin refresh, mensaje en el login y revalidación al volver a la pestaña (F8a–F8c). El backend lo entrega con E3+E4; antes sale E1d (logout sin `refreshToken`), sin cambios en el frontend. Detalle en `2026-11-12-plan-revocacion-inmediata-sesiones.md` | `apiClient.ts`, `AuthContext.tsx`, `FormularioLogin.tsx` | Ola 3 (con E4, junto a F5) | hecho (2026-11-13) · probado (2026-11-13) · sin desplegar (sale con la ola 3) |
| F5 | `403 ACCOUNT_RESTRICTED`: cerrar sesión local, mostrar «cuenta restringida» y no entrar en el ciclo de refresh; mensaje en el login | `AuthContext.tsx`, `FormularioLogin.tsx` | Ola 3 (con E4) | hecho (2026-11-13) · probado (2026-11-13) · sin desplegar (sale con la ola 3) |
| F6 | «Sesiones activas» en Configuración → Cuenta: lista, cerrar una, cerrar otras (pide contraseña) | nueva ruta bajo `src/app/configuracion/`, `Configuraciones.tsx` | Ola 4 (con E6) | pendiente |
| F7 | Actualizar `SPECS/SPECS-FRONTEND-SESION-Y-CONTRATOS.md` (copia local), `AGENTS.md` (sección Auth) y `CHANGELOG.md` | `SPECS/`, `AGENTS.md`, `CHANGELOG.md` | Ola 4 (con E8) | pendiente |

> `SPECS/` y `AGENTS.md` son documentación oficial: F7 requiere autorización explícita del humano antes de editarlos.

## Detalle y criterios de aceptación

### F1 — códigos de 401 que no son sesión
- El backend responde `401 INVALID_CURRENT_PASSWORD` cuando la contraseña actual es incorrecta. Hoy `fetchWithAuth` solo exceptúa `TOKEN_EXPIRED`, así que un error de contraseña rotaría las cookies, gastaría `refreshLimiter` (10 / 15 min) y reintentaría.
- Aceptación: con una contraseña actual incorrecta no se llama a `/api/auth/refresh`, y el error llega al formulario.

### F4 — `409` en `/api/auth/refresh`
- Significa «otra solicitud ya renovó esta sesión» (gracia de 30 s del backend). No es red ni sesión inválida.
- Hoy cae en `'error'` y mostraría «problema de conexión».
- Aceptación: ante `409` se espera, se reintenta la petición original una vez con las cookies actuales y no se muestra error ni se cierra sesión. Un segundo `409` consecutivo se trata como `'error'`.

### F2 — cambiar contraseña
- Body: `{ passwordActual, passwordNueva }`. Reusar `PasswordRequisitos` y las reglas Zod de `perfilSchema`.
- Reglas de longitud (backend E1b): `passwordActual` obligatoria, máx. 128 caracteres; `passwordNueva` entre 8 y 128 con la misma complejidad del registro.
- Errores: `401 INVALID_CURRENT_PASSWORD` → mensaje en el campo; `422` → validación; `*_BLOCKED` → mensaje de límite (`PASSWORD_BLOCKED`, 5 / 15 min).
  - `422` con `errors[0] = { field: 'passwordNueva', code: 'SAME_AS_CURRENT' }` (nueva igual a la actual) → mensaje en el campo de contraseña nueva.
  - `403 FORBIDDEN` (sin cookie de refresh; access vivo y refresh vencido o borrado) → no es error de contraseña: pedir iniciar sesión de nuevo. Distinguirlo de `ACCOUNT_RESTRICTED` (F5, también `403`) por `code`, nunca por `detail`. **Desde E4 (ola 3) el backend ya no lo emite** (ver «Cambios de contrato del backend en la ola 3»); conservar el manejo no hace daño.
- Tras éxito (`200`): las demás sesiones se cierran en el servidor; `data.sesionesCerradas` trae el número. Mostrar aviso de que se cerraron las otras sesiones. La actual sigue activa.
- Fuente del contrato: backend `docs/specs/SPECS-SESIONES.md` §6.1 (endpoint implementado en el commit de E1b).
- Aceptación: el perfil ya no envía `password`; `PUT /api/usuarios/update` no recibe ese campo.

### F3 — eliminar cuenta
- Mantener la confirmación escrita `ELIMINAR` y añadir contraseña. `apiDelete` hoy no acepta body.
- Contrato (backend E1c, implementado): `DELETE /api/usuarios/delete` con body `{ passwordActual }` (obligatoria, texto, máx. 128 caracteres; no validar su formato, solo que no esté vacía).
- Errores, siempre por `code`:
  - `401 INVALID_CURRENT_PASSWORD` → mensaje en el campo de contraseña; la cuenta no se toca y la sesión sigue. F1 ya evita el refresh.
  - `422` (campo ausente o inválido) → validación en el campo.
  - `429 PASSWORD_BLOCKED` (5 / 15 min) → mensaje de límite. El cubo es el mismo que el del cambio de contraseña (F2): intentos fallidos en una pantalla cuentan en la otra. También puede llegar `CUENTA_BLOCKED` o `FLOOD_BLOCKED`.
  - `403 FORBIDDEN` (sin cookie de refresh; access vivo y refresh vencido o borrado) → no es error de contraseña: pedir iniciar sesión de nuevo. No confundir con `ACCOUNT_RESTRICTED` (F5): decidir por `code`. **Desde E4 (ola 3) el backend ya no lo emite** (ver «Cambios de contrato del backend en la ola 3»).
- Tras éxito (`200`): el backend borra todas las sesiones del usuario y limpia las cookies; cerrar la sesión local como hoy.
- Despliegue: el backend nuevo (E1c) rechaza el borrado sin `passwordActual`, así que F3 debe estar desplegado **antes o junto con** E1c. El orden inverso sí es seguro: un backend viejo ignora el body.
- Fuente del contrato: backend `docs/specs/SPECS-SESIONES.md` §6.1.
- Aceptación: contraseña incorrecta muestra el error sin cerrar sesión ni refrescar.

### F5 — cuenta restringida
- Decidir por `code === 'ACCOUNT_RESTRICTED'`, nunca por `detail`. El `403` no dispara refresh (solo el `401` lo hace).
- Aceptación: usuario con estatus 2 o 3 y sesión viva queda fuera con un mensaje claro.

### F6 — sesiones activas
- `GET /api/auth/sesiones`, `DELETE /api/auth/sesiones/:sessionId`, `DELETE /api/auth/sesiones/otras` (esta pide `passwordActual`).
- Mostrar dispositivo, IP enmascarada, última actividad y cuál es la sesión actual (`esActual`).

## Cambios de contrato del backend en la ola 3 (E4, 2026-11-13)

Implementados en la rama de la ola 3 del backend (commit `a398f7b`), **sin desplegar**: salen juntos con E3b y E7. Fuente: backend `docs/specs/SPECS-SESIONES.md` §4.2 y §6.1.

**Respuestas de cualquier ruta autenticada** (`verificarTokenSesion`), siempre decidir por `code`:

| Caso | Respuesta | Qué hace el frontend |
|---|---|---|
| Sesión cerrada, revocada o vencida; token sin `sid` (anterior al rediseño) | `401 SESSION_REVOKED` | F8: sin refresh, cierre local y mensaje |
| Cuenta en estatus 2 o 3 | `403 ACCOUNT_RESTRICTED` | F5: cierre local y mensaje de cuenta restringida |
| Cuenta no activada (estatus 0) | `403 FORBIDDEN` | Sin cambios |
| Access vencido o firma inválida, `tokenVersion` distinta, usuario eliminado | `401 UNAUTHORIZED` | Sin cambios: flujo de refresh |
| Fallo de base de datos al validar la sesión | `500` (**antes `401`**) | No es sesión inválida: no refrescar ni cerrar sesión (criterio de F8) |

**Cambio 1 — ya no se exige la cookie `refreshToken`** en `PUT /api/usuarios/password` ni en `DELETE /api/usuarios/delete`. La sesión actual sale del `sid` del access token, así que desaparece su `403 FORBIDDEN` «No hay refresh token». El manejo actual en F2/F3 puede quedarse (ya no se dispara) o retirarse en F7. El resto del contrato de ambos endpoints no cambia; el cambio de contraseña sigue cerrando todas las demás sesiones y devolviendo `data.sesionesCerradas`, y esas otras sesiones reciben `401 SESSION_REVOKED` en su siguiente petición.

**Cambio 2 — un fallo de BD en la validación de sesión responde `500`** en lugar de `401`. Antes un error transitorio de Mongo se veía como sesión inválida y disparaba un refresh. Ahora el frontend debe tratarlo como error del servidor: no llamar a `/api/auth/refresh` ni cerrar la sesión. Aplica también a la revalidación de F8c.

Además, con el despliegue de la ola 3 todas las sesiones existentes se invalidan una vez (re-login único, decisión 1): el primer request de cada usuario recibirá `401 SESSION_REVOKED`.

### Respuestas de `POST /api/auth/refresh` (E3b, 2026-11-13)

Implementadas en la rama de la ola 3 del backend, **sin desplegar**. Fuente: backend `SPECS-SESIONES.md` §4.3. `pedirRefresh()` ya las cubre por status (`409` → `'carrera'`; `401`/`403` → `'sesion_invalida'`), así que **no requiere cambios para funcionar**; los `code` sirven para el mensaje de F5/F8b.

| Caso | Respuesta | Lectura en el frontend |
|---|---|---|
| Otra petición renovó la sesión hace ≤ 30 s (doble pestaña, retry) | `409 CONFLICT`, sin cookies nuevas | F4: esperar y reintentar con las cookies actuales |
| Sesión cerrada, vencida, revocada o anterior al rediseño | `401 SESSION_REVOKED` | Sesión cerrada (mensaje de F8b) |
| Reuso de un refresh ya rotado fuera de la gracia | `401 SESSION_REVOKED` | Igual; el backend cierra **solo esa sesión** (antes cerraba todas las del usuario) |
| Cuenta en estatus 2 o 3 | `403 ACCOUNT_RESTRICTED` | F5: mensaje de cuenta restringida |
| Cuenta no activada (estatus 0) | `403 FORBIDDEN` | Sesión inválida |
| Refresh vencido, sin cookie o usuario eliminado | `401 UNAUTHORIZED` | Sesión inválida |
| Firma inválida | `403 FORBIDDEN` | Sesión inválida |

Otros efectos:
- La sesión dura como máximo **90 días** desde el login aunque se renueve (`SESION_MAX_ABSOLUTA_DIAS`). Al acercarse al tope, la cookie `refreshToken` dura menos de 7 días; al vencer, el usuario debe iniciar sesión de nuevo.
- Ya no existe la «sesión comprometida» que cerraba todas las sesiones al detectar reuso: el `401` del refresh ya no implica que las otras pestañas o dispositivos se cerraron.

## Implementación de F8 y F5 (2026-11-13)

- `apiClient.ts`: `ApiErrorCode.SESSION_REVOKED`. `types.ts`: `MotivoCierreSesion` (`'sesion_revocada' | 'cuenta_restringida'`) y `motivoCierreSesion` / `clearMotivoCierreSesion` en `IAuthContext`.
- `AuthContext.tsx`:
  - `SESSION_REVOKED` entra en `CODIGOS_401_SIN_REFRESH` (F8a). `MOTIVO_POR_CODIGO` traduce `SESSION_REVOKED` y `ACCOUNT_RESTRICTED` a un motivo de cierre.
  - `fetchWithAuth` revisa toda respuesta `401`/`403`, incluida la que se reintenta tras el refresh. Si trae uno de esos códigos, llama a `cerrarSesionPorMotivo`. `pedirRefresh` devuelve también el motivo con el que se rechazó el refresh (`401 SESSION_REVOKED`, `403 ACCOUNT_RESTRICTED`).
  - `cerrarSesionPorMotivo` limpia el estado y las claves de sesión, guarda el motivo en `sessionStorage` (`motivoCierreSesion`, sobrevive a una recarga) y llama a `POST /api/auth/logout` sin esperar el resultado (desde E1d funciona sin sesión válida). Un ref evita repetir el logout cuando varias peticiones detectan el cierre a la vez; se reinicia en `login()`. Ver «Decisión: logout del servidor en los cierres forzados».
  - `inicializar` (`/api/auth/me` al montar): aplica el motivo sin refresh y trata los `5xx` como transitorios, por el `500` de E4 cuando falla la BD: reintenta con backoff y muestra el mensaje de conexión sin cerrar la sesión. Antes un `5xx` dejaba `user = null`.
  - F8c: con sesión activa, al volver a la pestaña (`visibilitychange`) se llama a `GET /api/auth/me` vía `fetchWithAuth`, como máximo una vez cada 30 s. Sus errores se ignoran, porque los cierres ya los aplicó `fetchWithAuth`.
- `FormularioLogin.tsx` (F8b / F5): aviso amarillo (`aviso_sesion`) con el mensaje que corresponde al motivo. Se limpia al iniciar sesión o con `logout()` manual. El texto de `sesion_revocada` sirve también para el re-login único de la ola 3.
- `pnpm build` en verde.

### Decisión: logout del servidor en los cierres forzados (revisada y aceptada el 2026-11-13)

Ante `401 SESSION_REVOKED` o `403 ACCOUNT_RESTRICTED`, el frontend no se limita a limpiar el estado local: también llama a `POST /api/auth/logout`.

- **Por qué:** las cookies `accessToken`/`refreshToken` son httpOnly y solo el backend puede borrarlas. Sin el logout, cada recarga mandaría las mismas cookies, `/api/auth/me` devolvería el mismo error y el aviso del login reaparecería siempre. Al borrarlas, la siguiente carga es la de un visitante anónimo (`401 UNAUTHORIZED` → refresh `401` → sin aviso) y el motivo se muestra una sola vez (queda en `sessionStorage` hasta el siguiente login o logout manual).
- **`SESSION_REVOKED`:** sin efecto en el servidor, porque la fila de `UserToken` ya no existe; solo se limpian las cookies.
- **`ACCOUNT_RESTRICTED`:** el logout **borra la fila de la sesión**, que la decisión B1 del backend conserva a propósito (el `403` no borra la sesión). En la práctica no cambia nada: mientras la cuenta tenga estatus 2 o 3, la sesión no sirve, y si se reactiva el usuario vuelve a iniciar sesión. Se acepta un re-login a cambio de no repetir el error en cada recarga.
- **Requisito:** depende de que `POST /api/auth/logout` funcione sin sesión válida (E1d, desplegado el 2026-11-12). Si el backend volviera a exigir sesión en el logout, la llamada fallaría en silencio (best-effort) y el aviso volvería a repetirse en cada recarga.
- **Alternativa descartada:** solo limpieza local (como pedía F5 originalmente). Deja las cookies vivas y el aviso se repite en cada recarga.

### Pruebas manuales (contra la rama de la ola 3 del backend) — ejecutadas el 2026-11-13, todas con el resultado esperado
- [x] Dos navegadores: cambiar la contraseña en uno → el otro, en su siguiente acción, queda en el login con el aviso. En Network no aparece `POST /api/auth/refresh` y `POST /api/auth/logout` limpia las cookies. La sesión que cambió la contraseña sigue activa.
- [x] Igual, con el otro navegador en una pestaña en segundo plano: al volver a ella (tras > 30 s) se cierra sola (F8c).
- [x] Token anterior al rediseño (sesión abierta con el backend viejo): al cargar la app se llega al login con el aviso y sin refresh. Al recargar, el aviso no se repite en bucle ni llegan más `SESSION_REVOKED`.
- [x] Cuenta con estatus 2 o 3 y sesión viva: en la siguiente acción (o al recargar) se llega al login con el aviso de cuenta restringida, sin refresh.
- [x] Iniciar sesión tras un cierre forzado: el aviso desaparece.
- [x] Backend detenido o `500` en `/api/auth/me`: la sesión no se cierra y aparece el mensaje de conexión.
- [x] Access vencido (borrar la cookie `accessToken`): el refresh renueva sin aviso y sin cerrar la sesión.
- [x] Dos pestañas que refrescan a la vez: ninguna cierra la sesión (`409` → reintento, F4).

## Verificación

No hay tests, linter ni typecheck propios (ver `AGENTS.md`). Cada tarea se valida con `pnpm build` (incluye tipos) y una prueba manual contra el backend en desarrollo, descrita en el commit.

## Pruebas manuales de la Ola 2 (F2 y F3)

Contra el backend de desarrollo con E1b y E1c. Ejecutadas el 2026-11-12: todas dieron el resultado esperado, salvo el hallazgo indicado; al terminar todas, hacer push y pasar F2 y F3 a `desplegado`.

### F2 — cambiar contraseña (`/configuracion/cambiar-password`)
- [x] Éxito: aparece el aviso con el número de sesiones cerradas y la sesión actual sigue activa (probado 2026-11-12).
- [x] Contraseña actual incorrecta: error en el campo, sin llamada a `/api/auth/refresh` en Network y sin cerrar sesión.
- [x] Nueva igual a la actual: mensaje en el campo de contraseña nueva (`422 SAME_AS_CURRENT`).
- [x] Nueva que incumple la complejidad o confirmación distinta: errores del formulario sin enviar la petición.
- [x] Cinco intentos fallidos seguidos: mensaje de límite (`PASSWORD_BLOCKED`).
- [x] Borrar la cookie `refreshToken` con el access vivo y enviar: mensaje de iniciar sesión de nuevo (`403 FORBIDDEN`). **Hallazgo:** el mensaje sale bien, pero no hay forma de cerrar la sesión (ver «Hallazgo» abajo y E1d).
- [x] Perfil: guardar cambios en `/configuracion/editar-perfil` y comprobar en Network que `PUT /api/usuarios/update` no incluye `password`.
- [x] El perfil ya no muestra campos de contraseña y existe el enlace «Cambiar contraseña» en Configuración → Cuenta.

### F3 — eliminar cuenta (`/configuracion/eliminar-cuenta`)
- [x] Sin escribir `ELIMINAR` o sin contraseña, el botón está deshabilitado.
- [x] Contraseña incorrecta: error en el campo, sin refresh y sin cerrar sesión; la cuenta sigue intacta.
- [x] Cinco intentos fallidos: mensaje de límite. Este cubo se comparte con F2: los fallos de una pantalla cuentan en la otra.
- [x] Contraseña correcta: mensaje de éxito en verde, `logout()` y redirección a `/login` a los 2 s. Usar una cuenta de prueba, el borrado es irreversible.
- [x] Verificar en la base de datos que se borraron todas las sesiones del usuario.

### Orden de despliegue
- F2 antes de E1b2 del backend; F3 antes o junto con E1c.

### Hallazgo (2026-11-12): no se puede cerrar sesión sin cookie `refreshToken`
- `POST /api/auth/logout` exige la cookie `refreshToken` (`validarRefreshToken`) y responde `401` sin ella. Esa respuesta no limpia la cookie `accessToken` (httpOnly, el frontend no puede borrarla).
- El `logout()` del frontend limpia el estado local y parece cerrar la sesión, pero al recargar `/api/auth/me` acepta el `accessToken` vivo y vuelve a `/inicio`.
- Es un fallo de contrato del backend, no corregible solo en el frontend. **Resuelto con E1d (backend, desplegado y verificado el 2026-11-12):** el logout limpia ambas cookies sin `refreshToken` y `/api/auth/me` responde `401` tras recargar. Se registró como E1d (backend) en `2026-11-12-plan-revocacion-inmediata-sesiones.md`.
