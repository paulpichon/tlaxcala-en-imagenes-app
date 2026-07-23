# SPECs de Respuestas — Antes vs Después (HIGH-01)

**Migración completada:** 2026-07-22
**Endpoints migrados:** 46 (12 controladores)
**Endpoint desactivado:** 1 (`GET /api/usuarios` → 410 Gone)
**Endpoints exentos:** 2 (`GET /` bienvenida, `GET /api/health`)

---

## Formato actual unificado

Todas las respuestas exitosas siguen uno de estos 3 patrones:

### Patrón A — Simple (sin datos o acciones)
```json
{ "success": true, "msg": "Posteo creado correctamente" }
```

### Patrón B — Con datos (un recurso o varios campos)
```json
{
  "success": true,
  "msg": "Login exitoso",
  "data": { "usuario": { "uid": "...", "correo": "..." } }
}
```

### Patrón C — Paginado (listas)
```json
{
  "success": true,
  "data": [ /* ... */ ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 120,
    "totalPages": 8,
    "next": "/api/posteos?page=2&limit=15",
    "prev": null
  }
}
```

### Reglas para el frontend
- Verificar éxito: `if (res.success)` o `if (res.status >= 200 && res.status < 300)`
- Leer mensaje: `res.msg` (siempre presente en patrón A y B)
- Leer payload: `res.data` (nunca en raíz)
- Leer paginación: `res.pagination.page`, `res.pagination.limit`, `res.pagination.total`, `res.pagination.totalPages`, `res.pagination.next`, `res.pagination.prev`
- HTTP status en cabecera: 200, 201 para creación, 410 Gone para desactivado

---

## Cambios por endpoint

### `controllers/auth.js` — 10 endpoints

#### 1. `GET /api/auth/verificar-correo{/:token}` → `verificarCorreo`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ ok: true, msg: "Correo verificado" }` | `{ success: true, msg: "Correo verificado" }` |
| Cambio | `ok` → `success` |

#### 2. `POST /api/auth/reenviar-correo` → `reenviarCorreoVerificacion`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Correo reenviado a ..." }` | `{ success: true, msg: "Correo reenviado a ..." }` |
| Cambio | Se eliminó `status` del body, se renombró a `success` |

#### 3. `POST /api/auth/login` → `login`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, usuario: {...}, msg: "Login exitoso" }` | `{ success: true, msg: "Login exitoso", data: { usuario: {...} } }` |
| Cambio | `usuario` → `data.usuario` |

#### 4. `GET /api/auth/me` → `getMe`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Usuario obtenido", ok: true, usuario: {...} }` | `{ success: true, msg: "Usuario obtenido", data: { usuario: {...} } }` |
| Cambio | Eliminados `status` y `ok`, `usuario` → `data.usuario` |

#### 5. `POST /api/auth/cuentas/password-olvidado` → `envioCorreoReestablecerPassword` (delega a `procesarEnvioReestablecerPassword`)
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Si el correo está registrado..." }` | `{ success: true, msg: "Si el correo está registrado..." }` |
| Cambio | `status` eliminado, `success` añadido |
| ⚠️ | Anti-enumeración: siempre 200 con el mismo msg, indistinguible del éxito real |

#### 6. `POST /api/auth/reenviar-correo-restablecer-password` → `reenvioCorreoRestablecerPassword` (delega a `procesarEnvioReestablecerPassword`)
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, token: "eyJ...", msg: "Si el correo está registrado..." }` | `{ success: true, msg: "Si el correo está registrado...", data: { token: "eyJ..." } }` |
| Cambio | `token` → `data.token` |
| ⚠️ | Anti-enumeración: siempre 200 con el mismo msg |

#### 7. `GET /api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}` → `validarTokenRestablecerPassword`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Token válido", valid: true }` | `{ success: true, msg: "Token válido", data: { valid: true } }` |
| Cambio | `valid` → `data.valid` |

#### 8. `POST /api/auth/cuentas/reestablecer-password{/:token}` → `reestablecerPassword`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Password reestablecido" }` | `{ success: true, msg: "Password reestablecido" }` |

#### 9. `POST /api/auth/refresh` → `refreshToken`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Token renovado" }` | `{ success: true, msg: "Token renovado" }` |

#### 10. `POST /api/auth/logout` → `logout`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Sesión cerrada" }` | `{ success: true, msg: "Sesión cerrada" }` |

---

### `controllers/usuarios.js` — 6 endpoints

#### 11. `GET /api/usuarios` → `usuariosGet` (DESACTIVADO)
| Campo | Antes | Después |
|---|---|---|
| Body | `{ msg: "DE MOMENTO ESTA API PARA MOSTRAR A LOS USUARIOS NO SE VA A OCUPAR" }` | **410 Gone** (formato RFC 9457 de error) |
| Cambio | Endpoint desactivado. Retorna error con `code: "GONE"` |

```json
{
  "type": "about:blank",
  "title": "Gone",
  "status": 410,
  "detail": "Este endpoint ya no está disponible",
  "code": "GONE",
  "instance": "/api/usuarios",
  "trace_id": "req_xxx"
}
```

#### 12. `GET /api/usuarios/:url` → `usuarioGet`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ usuario: {...} }` | `{ success: true, data: { usuario: {...} } }` |
| Cambio | `usuario` → `data.usuario`, agregado `success` |

#### 13. `POST /api/usuarios` → `usuariosPost`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, token: "eyJ..." }` | `{ success: true, data: { token: "eyJ..." } }` |
| Cambio | `token` → `data.token`, eliminado `status`, agregado `success` |

#### 14. `PUT /api/usuarios/update` → `usuariosPut`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Usuario actualizado", usuario: {...} }` | `{ success: true, msg: "Usuario actualizado", data: { usuario: {...} } }` |
| Cambio | `usuario` → `data.usuario` |

#### 15. `DELETE /api/usuarios/delete` → `usuariosDelete`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Cuenta eliminada exitosamente..." }` | `{ success: true, msg: "Cuenta eliminada exitosamente..." }` |

#### 16. `GET /api/usuarios/registrados/nuevos-usuarios-registrados` → `nuevosUsuariosRegistrados`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Nuevos Usuarios Registrados", nuevosUsuariosRegistrados: [...] }` | `{ success: true, msg: "Nuevos Usuarios Registrados", data: { nuevosUsuariosRegistrados: [...] } }` |
| Cambio | `nuevosUsuariosRegistrados` → `data.nuevosUsuariosRegistrados` |

---

### `controllers/posteos.js` — 6 endpoints

#### 17. `GET /api/posteos?page=&limite=` → `posteosGet` (PAGINADO)
| Campo | Antes | Después |
|---|---|---|
| Body | `{ page, next, prev, limite, total_registros, mostrando, posteosConEstado: [...] }` | `{ success: true, data: [...], pagination: { page, limit, total, totalPages, next, prev } }` |
| Cambio | Estructura completa migrada a `pagination` |
| ⚠️ | `limite` → `pagination.limit`, `total_registros` → `pagination.total`, `mostrando` eliminado, `posteosConEstado` → `data` (array directo) |

```json
// Después
{
  "success": true,
  "data": [ /* posteos */ ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 120,
    "totalPages": 8,
    "next": "/api/posteos?page=2&limit=15",
    "prev": null
  }
}
```

#### 18. `GET /api/posteos/post/:id` → `posteoGet`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ posteo: {...}, isFollowing: bool, isFavorito: bool }` | `{ success: true, data: { posteo: {...}, isFollowing: bool, isFavorito: bool } }` |
| Cambio | Todo el payload → `data` |

#### 19. `GET /api/posteos/usuario/:idUsuario?page=&limite=` → `posteosUsuarioGet` (PAGINADO)
| Campo | Antes | Después |
|---|---|---|
| Body | `{ page, next, prev, limite, total_registros, mostrando, posteos: [...] }` | `{ success: true, data: [...], pagination: { page, limit, total, totalPages, next, prev } }` |
| Cambio | `posteos` → `data`, `limite` → `pagination.limit`, `total_registros` → `pagination.total`, `mostrando` eliminado |
| ⚠️ | `next`/`prev` ahora usan el path `/api/posteos/usuario/:idUsuario` |

#### 20. `POST /api/posteos` → `posteosPost` (Status 201)
| Campo | Antes | Después |
|---|---|---|
| HTTP Status | 201 | 201 (sin cambio) |
| Body | `{ status: 201, msg: "Posteo creado correctamente" }` | `{ success: true, msg: "Posteo creado correctamente", data: { posteo: {...} } }` |
| Cambio | Se agregó `data: { posteo }` con el objeto del posteo recién creado |

#### 21. `PUT /api/posteos/:id` → `posteosPut`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Posteo actualizado correctamente", posteo: {...} }` | `{ success: true, msg: "Posteo actualizado correctamente", data: { posteo: {...} } }` |
| Cambio | `posteo` → `data.posteo` |

#### 22. `DELETE /api/posteos/:id` → `posteosDelete`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Posteo con imagen eliminado correctamente" }` | `{ success: true, msg: "Posteo con imagen eliminado correctamente" }` |

---

### `controllers/comentarios.js` — 5 endpoints

#### 23. `POST /api/comentarios/:posteoId/comentarios` → `agregarComentario` (Status 201)
| Campo | Antes | Después |
|---|---|---|
| HTTP Status | 201 | 201 (sin cambio) |
| Body | `{ ok: true, status: 201, msg: "Comentario agregado", comentario: {...} }` | `{ success: true, msg: "Comentario agregado", data: { comentario: {...} } }` |
| Cambio | `ok`/`status` → `success`, `comentario` → `data.comentario` |

#### 24. `GET /api/comentarios/:posteoId/comentarios?page=&limit=` → `obtenerComentarios` (PAGINADO)
| Campo | Antes | Después |
|---|---|---|
| Body | `{ ok: true, status: 200, page, limit, next, prev, total, totalPages, comentarios: [...] }` | `{ success: true, data: [...], pagination: { page, limit, total, totalPages, next, prev } }` |
| Cambio | `ok`/`status` → `success`, `comentarios` → `data`, paginación → `pagination` |
| ⚠️ | `next`/`prev` usan path `/api/comentarios/:posteoId/comentarios/` |

#### 25. `GET /api/comentarios/:posteoId/comentarios/count` → `obtenerCountComentarios`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ ok: true, status: 200, count: 42 }` | `{ success: true, data: { count: 42 } }` |
| Cambio | `count` → `data.count` |

#### 26. `DELETE /api/comentarios/:comentarioId` → `eliminarComentario`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ ok: true, status: 200, msg: "Comentario eliminado" }` | `{ success: true, msg: "Comentario eliminado" }` |
| Cambio | `ok`/`status` → `success` |

#### 27. `PUT /api/comentarios/:posteoId/comentarios/toggle` → `toggleComentariosPosteo`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ ok: true, status: 200, msg: "...", comentariosActivos: bool }` | `{ success: true, msg: "...", data: { comentariosActivos: bool } }` |
| Cambio | `comentariosActivos` → `data.comentariosActivos` |

---

### `controllers/followers.js` — 4 endpoints

#### 28. `POST /api/followers/follow/:id` → `followUsuario`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Has comenzado a seguir a este usuario", success: true }` | `{ success: true, msg: "Has comenzado a seguir a este usuario" }` |
| Cambio | Eliminado `status` (ya estaba `success`) |

#### 29. `DELETE /api/followers/unfollow/:id` → `unfollowUsuario`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Dejaste de seguir a este usuario" }` | `{ success: true, msg: "Dejaste de seguir a este usuario" }` |

#### 30. `GET /api/followers/usuario/lista-followers/:id` → `obtenerFollowers`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Seguidores obtenidos...", totalSeguidores: 10, seguidores: [...] }` | `{ success: true, msg: "Seguidores obtenidos...", data: { totalSeguidores: 10, seguidores: [...] } }` |
| Cambio | `totalSeguidores`/`seguidores` → `data.totalSeguidores`/`data.seguidores` |

#### 31. `GET /api/followers/usuario/lista-followings/:id` → `obtenerFollowings`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Usuarios seguidos...", totalSeguidos: 10, siguiendo: [...] }` | `{ success: true, msg: "Usuarios seguidos...", data: { totalSeguidos: 10, siguiendo: [...] } }` |
| Cambio | `totalSeguidos`/`siguiendo` → `data.totalSeguidos`/`data.siguiendo` |

---

### `controllers/likes.js` — 3 endpoints

#### 32. `POST /api/likes/:id/like` → `likeDislikePosteo`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Like añadido" }` o `{ status: 200, msg: "Like eliminado" }` | `{ success: true, msg: "Like añadido" }` o `{ success: true, msg: "Like eliminado" }` |

#### 33. `GET /api/likes/posteo/:id` → `getLikesPosteos`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ likes: 42, posteo: "id" }` | `{ success: true, data: { likes: 42, posteo: "id" } }` |
| Cambio | Todo → `data`, agregado `success` |

#### 34. `GET /api/likes/:id/likes/usuarios` → `getLikesUsuariosPosteos`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Likes de usuarios...", likes_usuarios_posteo: [...] }` | `{ success: true, msg: "Likes de usuarios...", data: { likes_usuarios_posteo: [...] } }` |
| Cambio | `likes_usuarios_posteo` → `data.likes_usuarios_posteo` |

---

### `controllers/favoritos.js` — 3 endpoints

#### 35. `GET /api/favoritos?page=&limite=` → `obtenerFavoritosUsuario` (PAGINADO)
| Campo | Antes | Después |
|---|---|---|
| Body | `{ page, next, prev, limite, total_registros, mostrando, favoritos: [...] }` | `{ success: true, data: [...], pagination: { page, limit, total, totalPages, next, prev } }` |
| Cambio | `favoritos` → `data`, `limite` → `pagination.limit`, `total_registros` → `pagination.total`, `mostrando` eliminado |

#### 36. `POST /api/favoritos/:posteoId` → `agregarPosteoFavorito`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Agregado en Favoritos" }` | `{ success: true, msg: "Agregado en Favoritos" }` |

#### 37. `DELETE /api/favoritos/:posteoId` → `eliminarPosteoFavorito`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Eliminado de Favoritos" }` | `{ success: true, msg: "Eliminado de Favoritos" }` |

---

### `controllers/notificaciones.js` — 7 endpoints

#### 38. `POST /api/notificaciones/subscribe` → `subscribirNotificacionesWebPush`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ message: "Suscripción registrada correctamente" }` | `{ success: true, msg: "Suscripción registrada correctamente" }` |
| Cambio | `message` → `msg`, agregado `success` |
| ⚠️ | La clave cambió de nombre: `message` → `msg` |

#### 39. `POST /api/notificaciones/unsubscribe` → `unsubscribeNotificacionesWebPush`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ success: true, msg: "Suscripción eliminada correctamente" }` | `{ success: true, msg: "Suscripción eliminada correctamente" }` |
| Cambio | Sin cambios (ya cumplía el formato) |

#### 40. `GET /api/notificaciones/vapidPublicKey` → `getVapidPublicKey`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ key: "BPl..." }` | `{ success: true, data: { key: "BPl..." } }` |
| Cambio | `key` → `data.key`, agregado `success` |

#### 41. `GET /api/notificaciones?page=&limit=` → `obtenerNotificaciones` (PAGINADO)
| Campo | Antes | Después |
|---|---|---|
| Body | `{ page, limit, next, prev, total, totalPages, notificaciones: [...] }` | `{ success: true, data: [...], pagination: { page, limit, total, totalPages, next, prev } }` |
| Cambio | `notificaciones` → `data`, paginación → `pagination`, agregado `success` |

#### 42. `PATCH /api/notificaciones/marcar-notificacion-leida/:id` → `marcarNotificacionLeida`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Notificación marcada como leída" }` | `{ success: true, msg: "Notificación marcada como leída" }` |

#### 43. `GET /api/notificaciones/nuevas-notificaciones` → `obtenerTotalNotificacionesNoLeidas`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, totalNoLeidas: 5 }` | `{ success: true, data: { totalNoLeidas: 5 } }` |
| Cambio | `totalNoLeidas` → `data.totalNoLeidas`, agregado `success` |

#### 44. `DELETE /api/notificaciones/eliminar-notificacion/:id` → `eliminarNotificacion`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Notificación eliminada correctamente" }` | `{ success: true, msg: "Notificación eliminada correctamente" }` |

---

### `controllers/municipios.js` — 1 endpoint

#### 45. `GET /api/municipios` → `obtenerMunicipios`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Municipios obtenidos correctamente", municipios: [...] }` | `{ success: true, msg: "Municipios obtenidos correctamente", data: { municipios: [...] } }` |
| Cambio | `municipios` → `data.municipios` |

---

### `controllers/ubicacion.js` — 1 endpoint

#### 46. `POST /api/ubicacion/reverse` → `obtenerMunicipioPorCoords`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, municipio: {...}, metodo: "...", precision: "..." }` | `{ success: true, data: { municipio: {...}, metodo: "...", precision: "..." } }` |
| Cambio | Todo → `data`, agregado `success` |

---

### `controllers/soporte.js` — 1 endpoint

#### 47. `POST /api/ayuda-soporte/envio-correo` → `ayudaSoporteEnvioCorrreo`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, ticketId: "TLX-123", msg: "Solicitud de soporte recibida correctamente" }` | `{ success: true, msg: "Solicitud de soporte recibida correctamente", data: { ticketId: "TLX-123" } }` |
| Cambio | `ticketId` → `data.ticketId` |

---

### `controllers/uploads.js` — 1 endpoint

#### 48. `PUT /api/uploads/:coleccion` → `actualizarImagen`
| Campo | Antes | Después |
|---|---|---|
| Body | `{ status: 200, msg: "Imagen de perfil actualizada correctamente", usuario: { imagen_perfil: {...} } }` | `{ success: true, msg: "Imagen de perfil actualizada correctamente", data: { imagen_perfil: {...} } }` |
| Cambio | `usuario.imagen_perfil` → `data.imagen_perfil` (sin envoltura `usuario`) |

---

## Endpoints exentos (no migrados)

### `controllers/bienvenida.js` — 2 endpoints

#### `GET /` → `getBienvenida` (META-ENDPOINT)
```json
{
  "name": "TlaxApp API",
  "status": "online",
  "auth": "required",
  "message": "Esta API requiere autenticación."
}
```

#### `GET /api/health` → `getHealth` (META-ENDPOINT)
```json
{
  "status": "ok",
  "uptime": 12345.67,
  "timestamp": "2026-07-22T14:30:00.000Z",
  "service": "TlaxApp API",
  "version": "1.0.0",
  "environment": "development",
  "memory": {
    "rss": 12345678,
    "heapTotal": 12345678,
    "heapUsed": 12345678,
    "external": 12345678
  },
  "heapUsedPercentage": "45.67%",
  "pid": 12345,
  "db": { "status": "connected" }
}
```

> Los meta-endpoints de infraestructura (`getBienvenida`, `getHealth`) mantienen su formato propio por diseño.

---

## Guía rápida para el frontend

### Ejemplo: Login
```js
// Antes
const res = await fetch('/api/auth/login', { ... });
const data = await res.json();
console.log(data.msg);          // ✅ Igual
console.log(data.usuario);      // ⚠️ Cambió: ahora data.data.usuario

// Después
const res = await fetch('/api/auth/login', { ... });
const json = await res.json();
if (json.success) {
  console.log(json.msg);              // "Login exitoso"
  console.log(json.data.usuario);     // { uid, correo, ... }
}
```

### Ejemplo: Lista paginada
```js
// Antes
const res = await fetch('/api/posteos?page=1&limite=15');
const data = await res.json();
console.log(data.posteosConEstado);  // ⚠️ Cambió
console.log(data.limite);            // ⚠️ Cambió
console.log(data.total_registros);   // ⚠️ Cambió

// Después
const res = await fetch('/api/posteos?page=1&limit=15');
const json = await res.json();
if (json.success) {
  console.log(json.data);                   // Array directo
  console.log(json.pagination.limit);       // 15
  console.log(json.pagination.total);       // 120
  console.log(json.pagination.totalPages);  // 8
  console.log(json.pagination.next);        // URL o null
  console.log(json.pagination.prev);        // URL o null
}
```

### Ejemplo: Endpoint desactivado
```js
// Antes
const res = await fetch('/api/usuarios');
const data = await res.json();
console.log(data.msg);  // Mensaje de stub

// Después
const res = await fetch('/api/usuarios');
console.log(res.status);  // 410
const error = await res.json();
console.log(error.code);  // "GONE"
```

---

## Resumen de cambios clave

| Cambio | Impacto |
|---|---|
| `ok` / `success` → `success` | Todos los endpoints |
| `message` → `msg` | `notificaciones::subscribe` |
| `status: 200/201` eliminado del body | Todos los endpoints (HTTP status sigue en cabecera) |
| Campos sueltos → `data` | 25+ endpoints |
| `limite` → `pagination.limit` | 4 endpoints paginados |
| `total_registros` → `pagination.total` | 4 endpoints paginados |
| `mostrando` eliminado | 3 endpoints paginados (info redundante con `data.length`) |
| Estructura de paginación unificada | 4 endpoints: `posteosGet`, `posteosUsuarioGet`, `obtenerComentarios`, `obtenerNotificaciones`, `obtenerFavoritosUsuario` |
| `GET /api/usuarios` → 410 Gone | Endpoint desactivado |
