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
| F2 | Pantalla «Cambiar contraseña» (actual / nueva / confirmar) que llama a `PUT /api/usuarios/password`; quitar `password` y `confirmPassword` del perfil | nueva ruta bajo `src/app/configuracion/`, `PerfilForm.tsx`, `useEditarPerfil.ts`, `Configuraciones.tsx` | Ola 2 (con E1b; antes de E1b2) | pendiente |
| F3 | `EliminarCuenta.tsx`: campo de contraseña; `apiDelete` acepta body | `EliminarCuenta.tsx`, `apiClient.ts` | Ola 2 (con E1c) | hecho (2026-11-12) |
| F5 | `403 ACCOUNT_RESTRICTED`: cerrar sesión local, mostrar «cuenta restringida» y no entrar en el ciclo de refresh; mensaje en el login | `AuthContext.tsx`, `FormularioLogin.tsx` | Ola 3 (con E4) | pendiente |
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
  - `403 FORBIDDEN` (sin cookie de refresh; access vivo y refresh vencido o borrado) → no es error de contraseña: pedir iniciar sesión de nuevo. Distinguirlo de `ACCOUNT_RESTRICTED` (F5, también `403`) por `code`, nunca por `detail`.
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
  - `403 FORBIDDEN` (sin cookie de refresh; access vivo y refresh vencido o borrado) → no es error de contraseña: pedir iniciar sesión de nuevo. No confundir con `ACCOUNT_RESTRICTED` (F5): decidir por `code`.
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

## Verificación

No hay tests, linter ni typecheck propios (ver `AGENTS.md`). Cada tarea se valida con `pnpm build` (incluye tipos) y una prueba manual contra el backend en desarrollo, descrita en el commit.
