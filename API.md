# TlaxApp API — Documentación Detallada de Endpoints

**Versión:** 1.0.0  
**URL Base:** `http://localhost:5000` (desarrollo)  
**Formato de Respuesta:** JSON  
**Autenticación:** Cookies httpOnly (accessToken + refreshToken)

---

## Convenciones

- Todos los endpoints protegidos requieren la cookie `accessToken`.
- Los endpoints con `{/:param}` usan la sintaxis de parámetros opcionales de `path-to-regexp` v8.
- Los errores siguen el formato estándar: `{ ok, status, msg, code }`.
- Los cuerpos de las solicitudes POST/PUT deben enviarse como JSON (excepto `/api/posteos` y `/api/uploads` que usan `multipart/form-data`).

---

## Índice de Endpoints

| # | Sección | Rutas |
|---|---------|-------|
| 1 | [Bienvenida y Salud](#1-bienvenida-y-salud) | 2 |
| 2 | [Autenticación](#2-autenticación) | 10 |
| 3 | [Usuarios](#3-usuarios) | 6 |
| 4 | [Publicaciones (Posteos)](#4-publicaciones-posteos) | 6 |
| 5 | [Likes](#5-likes) | 3 |
| 6 | [Followers](#6-followers) | 4 |
| 7 | [Favoritos](#7-favoritos) | 3 |
| 8 | [Comentarios](#8-comentarios) | 5 |
| 9 | [Municipios y Ubicación](#9-municipios-y-ubicación) | 3 |
| 10 | [Notificaciones y Web Push](#10-notificaciones-y-web-push) | 7 |
| 11 | [Uploads (Imagen de Perfil)](#11-uploads-imagen-de-perfil) | 1 |
| 12 | [Soporte](#12-soporte) | 1 |

---

## 1. Bienvenida y Salud

### `GET /`

Información básica de la API.

**Auth:** No requerida

**Response `200`:**
```json
{
  "name": "TlaxApp API",
  "status": "online",
  "auth": "required",
  "message": "Esta API requiere autenticación."
}
```

---

### `GET /api/health`

Estado completo del servidor.

**Auth:** No requerida

**Response `200`:**
```json
{
  "status": "ok",
  "uptime": 1234.56,
  "timestamp": "2026-06-12T10:00:00.000Z",
  "service": "TlaxApp API",
  "version": "1.0.0",
  "environment": "development",
  "memory": {
    "rss": 50000000,
    "heapTotal": 30000000,
    "heapUsed": 15000000,
    "external": 5000000
  },
  "heapUsedPercentage": "50.00%",
  "pid": 12345,
  "db": {
    "status": "connected"
  }
}
```

---

## 2. Autenticación

### `POST /api/auth/login`

Iniciar sesión. Establece cookies httpOnly.

**Auth:** No  
**Rate Limit:** `loginLimiter` — 5 intentos por 15 minutos (clave: IP + correo)

**Request Body:**
```json
{
  "correo": "usuario@ejemplo.com",
  "password": "MiPassword123!"
}
```

**Response `200` (éxito):**
```json
{
  "status": 200,
  "usuario": {
    "nombre_completo": {
      "nombre": "Juan",
      "apellido": "Pérez"
    },
    "lugar_radicacion": {
      "claveEntidad": 29,
      "nombreEntidad": "Tlaxcala",
      "claveMunicipio": "33",
      "nombreMunicipio": "Zacatelco",
      "codigoPostal": "90750"
    },
    "correo": "usuario@ejemplo.com",
    "imagen_perfil": {
      "secure_url": "https://...",
      "public_id": "tlx-imagenes/imagenes-perfiles-usuarios/abc123/def456"
    },
    "genero": "MASCULINO",
    "fecha_nacimiento": "1990-01-01",
    "fecha_actualizacion": null,
    "url": "juanperez",
    "uid": "60d21b4667d0d8992e610c85",
    "_id": "60d21b4667d0d8992e610c85"
  },
  "msg": "Login exitoso"
}
```

**Cookies establecidas:**
- `accessToken` (httpOnly, secure, sameSite=none, maxAge: 1 hora)
- `refreshToken` (httpOnly, secure, sameSite=none, maxAge: 7 días)

**Errors:**

| Código | Condición | Respuesta |
|---|---|---|
| `401` | Correo no existe o cuenta eliminada | `{ "status": 401, "msg": "Correo no existe" }` |
| `403` | Cuenta no verificada | `{ "status": 403, "msg": "Cuenta no verificada" }` |
| `403` | Cuenta no activada | `{ "status": 403, "msg": "Cuenta no activada" }` |
| `401` | Contraseña incorrecta | `{ "status": 401, "msg": "Password incorrecto" }` |
| `429` | Rate limit excedido | `{ "ok": false, "status": 429, "msg": "...", "code": "LOGIN_BLOCKED" }` |

---

### `POST /api/auth/refresh`

Renovar el par de tokens (access + refresh). Las cookies se rotan.

**Auth:** Requiere cookies `accessToken` y `refreshToken`  
**Rate Limit:** `refreshLimiter` — 10 solicitudes por 15 minutos

**Request Body:** Ninguno

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Token renovado"
}
```

**Cookies actualizadas:**
- Nuevo `accessToken` (maxAge: 1 hora)
- Nuevo `refreshToken` (maxAge: 7 días)

**Errors:**

| Código | Condición | Respuesta |
|---|---|---|
| `401` | No hay cookie de refresh token | `{ "status": 401, "msg": "No hay cookies de sesion..." }` |
| `403` | Token no registrado en BD | `{ "status": 403, "msg": "Token no registrado" }` |
| `429` | Rate limit excedido | Código `REFRESH_BLOCKED` |

---

### `POST /api/auth/logout`

Cerrar sesión. Elimina el refresh token de la BD y limpia las cookies.

**Auth:** Requiere cookie `refreshToken`  
**Middleware:** `validarRefreshToken`

**Request Body:** Ninguno

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Sesión cerrada"
}
```

---

### `GET /api/auth/me`

Obtener el perfil del usuario autenticado.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Usuario obtenido",
  "ok": true,
  "usuario": {
    "_id": "60d21b4667d0d8992e610c85",
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": { ... },
    "imagen_perfil": { "secure_url": "...", "public_id": "..." },
    "correo": "usuario@ejemplo.com",
    "url": "juanperez",
    "genero": "MASCULINO",
    "fecha_nacimiento": "1990-01-01"
  }
}
```

---

### `GET /api/auth/verificar-correo{/:token}`

Verificar el correo electrónico del usuario mediante el enlace enviado por email.

**Nota de ruta:** El token es opcional en la URL (sintaxis `{/:token}`). Si no se incluye, el middleware `validarTokenEnURL` retorna error 400.

**Auth:** No  
**Middleware:** `validarTokenEnURL`, `check('token').isJWT()`

**Response `200`:**
```json
{
  "ok": true,
  "msg": "Correo verificado"
}
```

**Efectos secundarios:**
- `email_validated` → `true`
- `estatus` → `1`
- `verificacion_token` → eliminado

**Errors:**

| Código | Condición |
|---|---|
| `400` | Token faltante en la URL |
| `401` | Token inválido o expirado |

---

### `POST /api/auth/reenviar-correo`

Reenviar el correo de verificación. Tiene un cooldown de 5 minutos.

**Auth:** No  
**Rate Limit:** `reenvioCorreoLimiter` — 3 por 5 minutos

**Request Body:**
```json
{
  "token": "jwt-del-sessionstorage"
}
```

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Correo reenviado a usuario@ejemplo.com"
}
```

**Errors:**

| Código | Condición | Respuesta |
|---|---|---|
| `401` | Correo no existe | `{ "msg": "Correo no existe" }` |
| `403` | Cuenta ya verificada | `{ "msg": "Cuenta ya verificada" }` |
| `429` | Cooldown de 5 min | `{ "msg": "Espera X minutos..." }` |
| `429` | Rate limit | Código `EMAIL_BLOCKED` |

---

### `POST /api/auth/cuentas/password-olvidado`

Solicitar restablecimiento de contraseña. Envía un correo con enlace.

**Auth:** No  
**Rate Limit:** `recoveryLimiter` — 3 por 15 minutos

**Request Body:**
```json
{
  "correo": "usuario@ejemplo.com"
}
```

**Response `200`:**
```json
{
  "status": 200,
  "token": "jwt-para-sessionstorage",
  "msg": "Correo enviado con el link para reestablecer password"
}
```

**Errors:**

| Código | Condición |
|---|---|
| `401` | Correo no existe |
| `403` | Cuenta no verificada o no activada |
| `429` | Cooldown de 5 min o rate limit (`RECOVERY_BLOCKED`) |

---

### `POST /api/auth/reenviar-correo-restablecer-password`

Reenviar el correo de restablecimiento de contraseña (cooldown 5 min).

**Auth:** No  
**Rate Limit:** `recoveryLimiter`

**Request Body:**
```json
{
  "token": "jwt-del-paso-anterior"
}
```

**Response** (mismo formato que `password-olvidado`).

---

### `GET /api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}`

Validar el token de restablecimiento de contraseña del enlace del correo.

**Nota de ruta:** Token opcional (`{/:token}`).

**Auth:** No  
**Middleware:** `validarTokenEnURL`, `check('token').isJWT()`

**Response `200` (token válido):**
```json
{
  "status": 200,
  "msg": "Token válido",
  "valid": true
}
```

**Errors:**

| Código | Condición |
|---|---|
| `400` | Token faltante |
| `401` | Token inválido, expirado, o usuario no existe |
| `403` | Cuenta no verificada o no activada |

---

### `POST /api/auth/cuentas/reestablecer-password{/:token}`

Establecer una nueva contraseña usando el token de restablecimiento.

**Nota de ruta:** Token opcional (`{/:token}`) pero requerido.

**Auth:** No

**Request Body:**
```json
{
  "password": "NuevaContraseña123!"
}
```

**Restricciones del password:**
- Mínimo 8 caracteres

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Password reestablecido"
}
```

**Errors:**

| Código | Condición |
|---|---|
| `401` | Token inválido o expirado |
| `500` | Error interno |

---

## 3. Usuarios

### `GET /api/usuarios`

Listar todos los usuarios (actualmente deshabilitado).

**Auth:** No  
**Rate Limit:** `lecturaLimiter`

**Response `200`:**
```json
{
  "msg": "DE MOMENTO ESTA API PARA MOSTRAR A LOS USUARIOS NO SE VA A OCUPAR"
}
```

---

### `GET /api/usuarios/:url`

Obtener perfil público de un usuario por su slug (URL). Retorna datos enriquecidos.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`, `validarUrlUsuario`

**Response `200`:**
```json
{
  "usuario": {
    "_id": "60d21b4667d0d8992e610c85",
    "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
    "lugar_radicacion": { ... },
    "imagen_perfil": { "secure_url": "...", "public_id": "..." },
    "url": "juanperez",
    "totalPosteos": 15,
    "totalSeguidores": 42,
    "totalSeguidos": 10,
    "isFollowing": true
  }
}
```

**Errors:**

| Código | Condición |
|---|---|
| `404` | URL no existe |
| `401` | Cuenta no verificada o suspendida |

---

### `POST /api/usuarios`

Registrar un nuevo usuario.

**Auth:** No  
**Rate Limit:** `registroLimiter` — 3 registros por hora

**Request Body:**
```json
{
  "nombre_completo": {
    "nombre": "Juan",
    "apellido": "Pérez"
  },
  "correo": "usuario@ejemplo.com",
  "password": "MiPassword123!"
}
```

**Restricciones del password:**
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Al menos un carácter especial (`!@#$%^&*(),.?":{}|<>_-+=[]`)

**Response `200`:**
```json
{
  "status": 200,
  "token": "jwt-para-sessionstorage"
}
```

**Efectos secundarios:**
- Se envía correo de verificación
- El usuario queda con `estatus: 0`, `email_validated: false`

**Errors:**

| Código | Condición |
|---|---|
| `400` | Error de validación de campos |
| `409` | Correo ya registrado |

---

### `PUT /api/usuarios/update`

Actualizar perfil del usuario autenticado.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Request Body (todos los campos opcionales):**
```json
{
  "nombre_completo": {
    "nombre": "Juan",
    "apellido": "López"
  },
  "password": "NuevaContraseña123!",
  "lugar_radicacion": {
    "nombreEntidad": "Tlaxcala",
    "claveMunicipio": "33",
    "nombreMunicipio": "Zacatelco"
  },
  "genero": "MASCULINO",
  "fecha_nacimiento": "1990-06-15"
}
```

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Usuario actualizado",
  "usuario": {
    "_id": "...",
    "nombre_completo": { ... },
    "lugar_radicacion": { ... },
    "correo": "usuario@ejemplo.com",
    "url": "juanperez",
    "genero": "MASCULINO",
    "fecha_nacimiento": "1990-06-15"
  }
}
```

---

### `DELETE /api/usuarios/delete`

Eliminar la cuenta del usuario autenticado (soft delete con transacción).

**Auth:** Requiere cookies `accessToken` y `refreshToken`  
**Middleware:** `verificarTokenSesion`

**Request Body:** Ninguno

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Cuenta eliminada exitosamente. Tus datos serán eliminados permanentemente en unos días."
}
```

**Efectos secundarios (dentro de una transacción de MongoDB):**
- Usuario: `estatus: 4`, `isDeleted: true`
- Posteos: `isDeleted: true`, `deleteReason: "accountDeletion"`
- Follows: `isDeleted: true` (tanto follower como following)
- Likes: `isDeleted: true` (dados y recibidos)
- Notificaciones: `isDeleted: true` (enviadas y recibidas)
- Favoritos: `isDeleted: true` (del usuario y de sus posteos)
- Comentarios: `isDeleted: true`, `deleteReason: "accountDeletion"`

---

### `GET /api/usuarios/registrados/nuevos-usuarios-registrados`

Obtener los últimos 3 usuarios registrados.

**Auth:** No

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Usuario obtenido",
  "usuarios": [
    {
      "_id": "...",
      "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
      "url": "juanperez",
      "imagen_perfil": { "secure_url": "...", "public_id": "..." }
    }
  ]
}
```

---

## 4. Publicaciones (Posteos)

### `GET /api/posteos`

Obtener publicaciones paginadas para el feed.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`  
**Rate Limit:** `lecturaLimiter` — 100 por 15 minutos

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `desde` | Number | 0 | Offset para paginación |
| `limite` | Number | 5 | Límite de resultados |

**Response `200`:**
```json
{
  "total": 100,
  "posteos": [
    {
      "_id": "...",
      "_idUsuario": {
        "_id": "...",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "url": "juanperez",
        "imagen_perfil": { "secure_url": "...", "public_id": "..." }
      },
      "texto": "Texto de la publicación",
      "secure_url": "https://res.cloudinary.com/...",
      "public_id": "tlx-imagenes/imagenes-posteos-usuarios/...",
      "ubicacion": {
        "ciudad": "Zacatelco",
        "municipio": "Zacatelco",
        "estado": "Tlaxcala",
        "pais": "México"
      },
      "comentariosActivos": true,
      "comentariosCount": 5,
      "fecha_creacion": "2026-06-12T10:00:00.000Z",
      "likeCount": 10,
      "likedByCurrentUser": false,
      "favoritedByCurrentUser": true
    }
  ]
}
```

---

### `GET /api/posteos/post/:id`

Obtener una publicación por ID.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:** Mismo formato que un posteo individual (similar al array superior).

---

### `GET /api/posteos/usuario/:idUsuario`

Obtener publicaciones de un usuario específico.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Query Parameters:** `?desde=0&limite=5`

**Response `200`:** Mismo formato que `GET /api/posteos`.

---

### `POST /api/posteos`

Crear una nueva publicación con imagen.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`, `upload.single('img')`, `validarCampoImg`, `validarImagenesMulter`, `validarTexto`  
**Rate Limit:** `posteoLimiter` — 20 por 15 minutos

**Content-Type:** `multipart/form-data`

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `img` | File | Sí | Imagen (jpg/jpeg/png/webp, máx 5MB) |
| `texto` | String | No | Texto de la publicación (regex: letras, números, signos básicos) |

**Response `201`:**
```json
{
  "ok": true,
  "msg": "Posteo creado exitosamente.",
  "posteo": { ... }
}
```

---

### `PUT /api/posteos/:id`

Actualizar el texto de una publicación existente.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Request Body:**
```json
{
  "texto": "Texto actualizado"
}
```

**Response `200`:**
```json
{
  "msg": "Posteo actualizado",
  "posteo": { ... }
}
```

---

### `DELETE /api/posteos/:id`

Eliminar una publicación (soft delete). Solo el autor puede eliminar.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:**
```json
{
  "msg": "Publicación eliminada"
}
```

---

## 5. Likes

### `POST /api/likes/:id/like`

Dar o quitar like a una publicación (toggle).

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200` (like agregado):**
```json
{
  "msg": "Like agregado exitosamente",
  "liked": true
}
```

**Response `200` (like quitado):**
```json
{
  "msg": "Like eliminado exitosamente",
  "liked": false
}
```

---

### `GET /api/likes/posteo/:id`

Obtener el conteo de likes de una publicación.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:**
```json
{
  "likeCount": 42,
  "posteoId": "..."
}
```

---

### `GET /api/likes/:id/likes/usuarios`

Obtener los usuarios que dieron like a una publicación.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:**
```json
{
  "usuarios": [
    {
      "_id": "...",
      "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
      "url": "juanperez",
      "imagen_perfil": { "secure_url": "...", "public_id": "..." }
    }
  ]
}
```

---

## 6. Followers

### `POST /api/followers/follow/:id`

Seguir a un usuario.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`, `validarIdUsuario`

**Response `200`:**
```json
{
  "msg": "Ahora sigues a {nombre}"
}
```

---

### `DELETE /api/followers/unfollow/:id`

Dejar de seguir a un usuario.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`, `validarIdUsuario`

**Response `200`:**
```json
{
  "msg": "Has dejado de seguir a {nombre}"
}
```

---

### `GET /api/followers/usuario/lista-followers/:id`

Obtener lista de seguidores de un usuario.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:**
```json
{
  "followers": [
    {
      "_id": "...",
      "follower": {
        "_id": "...",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "url": "juanperez",
        "imagen_perfil": { "secure_url": "...", "public_id": "..." }
      }
    }
  ]
}
```

---

### `GET /api/followers/usuario/lista-followings/:id`

Obtener lista de usuarios seguidos por un usuario.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:**
```json
{
  "followings": [
    {
      "_id": "...",
      "following": {
        "_id": "...",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "url": "juanperez",
        "imagen_perfil": { "secure_url": "...", "public_id": "..." }
      }
    }
  ]
}
```

---

## 7. Favoritos

### `GET /api/favoritos`

Obtener publicaciones favoritas del usuario autenticado.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:**
```json
{
  "favoritos": [
    {
      "_id": "...",
      "usuarioId": "...",
      "posteoId": {
        "_id": "...",
        "_idUsuario": { ... },
        "texto": "...",
        "secure_url": "...",
        "ubicacion": { ... }
      },
      "createdAt": "2026-06-12T10:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/favoritos/:posteoId`

Agregar una publicación a favoritos.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`, `validarIdPosteo`

**Response `200`:**
```json
{
  "msg": "Agregado a favoritos",
  "favorito": { ... }
}
```

---

### `DELETE /api/favoritos/:posteoId`

Eliminar una publicación de favoritos.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`, `validarIdPosteo`

**Response `200`:**
```json
{
  "msg": "Eliminado de favoritos"
}
```

---

## 8. Comentarios

### `POST /api/comentarios/:posteoId/comentarios`

Agregar un comentario a una publicación.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`  
**Rate Limit:** `comentarioLimiter` — 10 por minuto

**Request Body:**
```json
{
  "texto": "¡Excelente foto! (máx. 250 caracteres)"
}
```

**Response `201`:**
```json
{
  "ok": true,
  "msg": "Comentario agregado correctamente"
}
```

---

### `GET /api/comentarios/:posteoId/comentarios`

Obtener comentarios de una publicación (paginados).

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Query Parameters:** `?desde=0&limite=10`

**Response `200`:**
```json
{
  "total": 25,
  "comentarios": [
    {
      "_id": "...",
      "texto": "¡Excelente foto!",
      "autorId": {
        "_id": "...",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "url": "juanperez",
        "imagen_perfil": { "secure_url": "...", "public_id": "..." }
      },
      "createdAt": "2026-06-12T10:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/comentarios/:posteoId/comentarios/count`

Obtener el conteo de comentarios de una publicación.

**Auth:** No

**Response `200`:**
```json
{
  "count": 25
}
```

---

### `DELETE /api/comentarios/:comentarioId`

Eliminar un comentario. Solo el autor o el dueño del posteo pueden eliminar.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:**
```json
{
  "msg": "Comentario eliminado"
}
```

---

### `PUT /api/comentarios/:posteoId/comentarios/toggle`

Activar o desactivar los comentarios en una publicación. Solo el autor del posteo.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:**
```json
{
  "msg": "Comentarios desactivados",
  "comentariosActivos": false
}
```

---

## 9. Municipios y Ubicación

### `GET /api/municipios`

Obtener todos los municipios de Tlaxcala.

**Auth:** No

**Response `200`:**
```json
{
  "municipios": [
    {
      "_id": "...",
      "claveEntidad": 29,
      "nombreEntidad": "Tlaxcala",
      "claveMunicipio": 33,
      "nombreMunicipio": "Zacatelco",
      "codigoPostal": "90750"
    }
  ],
  "total": 60
}
```

---

### `GET /api/ubicacion`

Alias para obtener municipios (misma funcionalidad que `GET /api/municipios`).

**Auth:** No

---

### `POST /api/ubicacion/reverse`

Geocodificación inversa: dado un punto geográfico, retorna el municipio correspondiente.

**Auth:** No

**Request Body:**
```json
{
  "latitude": 19.2151,
  "longitude": -98.2398
}
```

**Response `200`:**
```json
{
  "lugar_radicacion": {
    "claveEntidad": 29,
    "nombreEntidad": "Tlaxcala",
    "claveMunicipio": "33",
    "nombreMunicipio": "Zacatelco",
    "codigoPostal": "90750"
  },
  "esExacta": true
}
```

**Errors:**

| Código | Condición |
|---|---|
| `404` | No se encontró el municipio |
| `400` | Coordenadas inválidas |

---

## 10. Notificaciones y Web Push

### `GET /api/notificaciones`

Obtener notificaciones del usuario autenticado (paginadas).

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Query Parameters:** `?desde=0&limite=20`

**Response `200`:**
```json
{
  "total": 50,
  "notificaciones": [
    {
      "_id": "...",
      "emisor": {
        "_id": "...",
        "nombre_completo": { "nombre": "Juan", "apellido": "Pérez" },
        "url": "juanperez",
        "imagen_perfil": { "secure_url": "...", "public_id": "..." }
      },
      "receptor": "...",
      "tipo": "like",
      "referencia": "...",
      "tipoReferencia": "Posteo",
      "mensaje": "A Juan le gusta tu publicación",
      "notificacion_leida": false,
      "createdAt": "2026-06-12T10:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/notificaciones/nuevas-notificaciones`

Contar notificaciones no leídas del usuario.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:**
```json
{
  "nuevasNotificaciones": 5
}
```

---

### `GET /api/notificaciones/vapidPublicKey`

Obtener la clave pública VAPID para el cliente Web Push.

**Auth:** No

**Response `200`:**
```json
{
  "publicKey": "BG..._base64_vapid_public_key..."
}
```

---

### `PATCH /api/notificaciones/marcar-notificacion-leida/:id`

Marcar una notificación como leída.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Notificación marcada como leída"
}
```

---

### `DELETE /api/notificaciones/eliminar-notificacion/:id`

Eliminar una notificación.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Notificación eliminada",
  "ok": true
}
```

---

### `POST /api/notificaciones/subscribe`

Suscribir el navegador del usuario a notificaciones push.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Request Body:**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "base64_encoded_public_key",
      "auth": "base64_encoded_auth_secret"
    }
  }
}
```

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Suscripción guardada exitosamente"
}
```

---

### `POST /api/notificaciones/unsubscribe`

Desuscribir al usuario de notificaciones push.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Suscripción eliminada exitosamente"
}
```

---

## 11. Uploads (Imagen de Perfil)

### `PUT /api/uploads/:coleccion`

Actualizar la imagen de perfil del usuario autenticado.

**Auth:** Requiere cookie `accessToken`  
**Middleware:** `verificarTokenSesion`, `upload.single('img')`, `validarImagenesMulter`, `coleccionesPermitidas`

| Parámetro | Valor permitido |
|---|---|
| `:coleccion` | `usuarios` |

**Content-Type:** `multipart/form-data`

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `img` | File | Sí | Imagen de perfil (jpg/jpeg/png/webp, máx 5MB) |

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Imagen actualizada correctamente",
  "usuario": {
    "_id": "...",
    "imagen_perfil": {
      "secure_url": "https://res.cloudinary.com/...",
      "public_id": "tlx-imagenes/imagenes-perfiles-usuarios/..."
    }
  }
}
```

---

## 12. Soporte

### `POST /api/ayuda-soporte/envio-correo`

Enviar un ticket de soporte o ayuda.

**Auth:** No  
**Rate Limit:** `soporteLimiter` — 5 por 15 minutos

**Request Body:**
```json
{
  "correo": "usuario@ejemplo.com",
  "nombre": "Juan Pérez",
  "asunto": "Problema con el inicio de sesión",
  "comentario": "No puedo iniciar sesión desde mi teléfono..."
}
```

**Response `200`:**
```json
{
  "status": 200,
  "msg": "Correo de ayuda/soporte enviado correctamente"
}
```

---

## Resumen de Códigos de Estado

| Código | Significado |
|---|---|
| `200` | Éxito |
| `201` | Creado (posteo, comentario) |
| `400` | Error de validación |
| `401` | No autorizado (token faltante/inválido, credenciales incorrectas) |
| `403` | Prohibido (cuenta no verificada/activada, permisos insuficientes) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (correo duplicado) |
| `429` | Demasiadas solicitudes (rate limit) |
| `500` | Error interno del servidor |

## Códigos de Rate Limit

| Código | Límite Excedido |
|---|---|
| `LOGIN_BLOCKED` | Inicio de sesión |
| `RECOVERY_BLOCKED` | Restablecimiento de contraseña |
| `EMAIL_BLOCKED` | Reenvío de correo |
| `REGISTER_BLOCKED` | Registro de usuario |
| `POSTEO_BLOCKED` | Creación de publicaciones |
| `SOPORTE_BLOCKED` | Envío de soporte |
| `READ_BLOCKED` | Lectura de listados |
| `COMENTARIO_BLOCKED` | Creación de comentarios |
| `REFRESH_BLOCKED` | Renovación de tokens |
