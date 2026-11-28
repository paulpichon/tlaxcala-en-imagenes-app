# Delta de documentación — 2026-11-12 21:40:05 (corrida de VERIFICACIÓN)

**Tipo:** re-corrida de verificación ligera. **Sin cambios de código desde la corrida anterior** (HEAD sigue en `d3ab71f`; último commit de API `138afe1`). Base: `docs/api/usuarios.md` y `README.md` con los cambios sin commit de la corrida 21:28:49.

## 1. Verificación contra el código — resultado

**0 discrepancias de contenido.** Re-contrastado una a una:

- `routes/usuarios.js`: `PUT /api/usuarios/password` en `:103` con la cadena `floodEscrituraIpLimiter` → `verificarTokenSesion` → `passwordUsuarioLimiter` → checks → `validarCampos` (`:103-120`); `passwordActual` (`:109-112`: isString/notEmpty/max 128) y `passwordNueva` (`:114-118`: isString/8–128 + regex de complejidad); `DELETE /api/usuarios/delete` en `:122` con `passwordUsuarioLimiter` agregado (`:122-134`, checks de `passwordActual` en `:129-132`); refs re-baselizadas: GET `:19`, POST `:33`, PUT/update `:68` (check de password con mensaje "6" y min 8 en `:88`), GET registrados `:136`. ✓
- `controllers/usuarios.js`: `usuarioGet` `:34`, `usuariosPost` `:77` (body en `:80`, `responder` `:118`, catch 500 `:124`), `usuariosPut` `:132` (password sin step-up `:141-144`, 404 `:156`, cooldown `:174-177`, `$set` `:218`, 500 `:236`), `usuariosPasswordPut` `:244-307` (cookie refresh `:247`, 403 `:252`, 404 `:257`, `InvalidCurrentPasswordError` `:260-262`, 422 `SAME_AS_CURRENT` `:264-269`, transacción `:277-294` con `UserToken.deleteMany({ userId, token: { $ne: tokenActual } })` `:286-289` y `sesionesCerradas` `:290,298`, respuesta `:296-299`, 500 `:305`), `usuariosDelete` `:313-528` (403 `:329`, 404 `:341`, 400 `:348`, step-up `:353-356`, `UserToken.deleteMany` en transacción `:484-486`, `cerrarSesionCookies` `:505`, 500 `:520`), `nuevosUsuariosRegistrados` `:530` (500 `:597`). ✓
- `middlewares/rate-limiter.js`: `passwordUsuarioLimiter` `:354-359` (15 min/5, clave usuario, `PASSWORD_BLOCKED`), comentado para E1b; importado y cableado en ambas rutas. ✓
- `errors/error-classes.js`: `InvalidCurrentPasswordError` `:33-37` (HTTP 401, code `INVALID_CURRENT_PASSWORD`, title `Authentication Required`, detail default "La contraseña actual es incorrecta"). ✓
- `models/server.js`: montaje de `/api/usuarios` en `:125`. ✓

**Spot-check de conteos por dominio** (`router.<method>( ` por archivo): auth 10 · bienvenida 2 · comentarios 5 · earlyaccess 2 · favoritos 3 · followers 4 · likes 3 · municipios 2 + ubicacion 2 (=4) · notificaciones 7 · posteos 7 · reportes 1 · soporte 1 · uploads 1 · usuarios 6 → **red social 56**. Panel: `admin/routes/index.js` 13 (auth/TOTP 10 + cuentas 3) · moderacion 7 · influencers 5 → **panel 25**. **Total 81** — coincide con el índice del README y la tabla de endpoints renumerada. ✓

## 2. Discrepancia encontrada y corregida

- **`docs/api/README.md` (2 referencias vivas):** decían que `inventario-endpoints.json` tenía `"total": 80` («aunque su campo aún dice 80… pendiente del agente sincronizador»). El agente `sincronizador` corrió concurrentemente y **ya lo corrigió a 81** (verificado: 81 entradas `"metodo"` y `"total": 81`; su brief `engineering/working/postman-sync/2026-11-12_delta-para-agente-api.md` confirma que los dos endpoints del delta ya estaban documentados por esta serie). Corregido in situ:
  - Pie de la tabla de endpoints (`README.md:450`): ahora dice "coincide con las 81 entradas y el `total: 81` de `inventario-endpoints.json` (actualizado por el agente `sincronizador` el 2026-11-12)".
  - §Totales (`README.md:458`): misma corrección.
  - El bloque de revisión de 21:28 del propio README se **conserva tal cual** (era cierto al momento de escribirse; el nuevo bloque de revisión lo supersede). El delta `2026-11-12_21-28-49_…md` no se toca (append-only).

## 3. Lo que NO cambió

- Ningún archivo de dominio: `usuarios.md` verificado sin encontrar drift, sin edición.
- Ningún código fuente; ningún reporte anterior; `postman/` y `engineering/` no son carril de este agente.
- Hallazgos H13/H14 y su estado "mitigado parcialmente": re-verificados contra `controllers/usuarios.js:141-144` y `routes/usuarios.js:103-120` — siguen correctos.
