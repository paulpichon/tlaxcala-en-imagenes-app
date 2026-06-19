# TlaxApp API — Documentación del Backend

**TlaxApp** es una red social enfocada en el estado de Tlaxcala, México. Este backend gestiona la autenticación de usuarios, interacciones sociales (publicaciones, likes, comentarios, follows, favoritos), detección de municipios por geolocalización, notificaciones Web Push, correos electrónicos y mantenimiento automatizado mediante cron jobs.

> **Stack:** Node.js + Express 5 + MongoDB (Mongoose 9)  
> **Auth:** JWT access/refresh token con httpOnly cookies  
> **Imágenes:** Cloudinary  
> **Correo:** Nodemailer (Titan SMTP)  
> **Rate Limiting:** express-rate-limit v8 (9 limitadores)  
> **Validación:** express-validator v7  
> **Cron Jobs:** node-cron  
> **Parser de dispositivo:** ua-parser-js  
> **Notificaciones Push:** web-push (VAPID)

---

## Tabla de Contenidos

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Requisitos Previos e Instalación](#requisitos-previos-e-instalación)
3. [Variables de Entorno](#variables-de-entorno)
4. [Scripts Disponibles](#scripts-disponibles)
5. [Flujo de Autenticación](#flujo-de-autenticación)
6. [Modelos de Base de Datos](#modelos-de-base-de-datos)
7. [API - Referencia Completa](#api---referencia-completa)
8. [Middleware](#middleware)
9. [Rate Limiting](#rate-limiting)
10. [Formato de Respuesta de Error](#formato-de-respuesta-de-error)
11. [Cron Jobs](#cron-jobs)
12. [Servicios de Correo](#servicios-de-correo)
13. [Notas Técnicas y Particularidades](#notas-técnicas-y-particularidades)

---

## Estructura del Proyecto

```
login-autenticacion/
├── app.js                              # Punto de entrada (carga dotenv, cron jobs, Server)
├── package.json
├── .env.example                        # Plantilla de variables de entorno
├── .env.development                    # Variables de entorno para desarrollo
├── .env.template                       # Plantilla adicional
├── AGENTS.md                           # Contexto para asistentes de IA
├── ANALISIS-TECNICO.md                 # Análisis técnico del proyecto
│
├── config/
│   ├── cloudinary.js                   # Configuración de Cloudinary SDK
│   └── nodemailer-transporter.js       # Fábrica de transporters Nodemailer (pooled)
│
├── database/
│   └── config.js                       # Conexión a MongoDB (Mongoose, DNS personalizado)
│
├── models/
│   ├── server.js                       # Clase Server de Express (CORS, cookieParser, rutas)
│   ├── Usuario.js                      # Modelo de Usuario
│   ├── UserToken.js                    # Almacenamiento de Refresh Tokens
│   ├── Posteo.js                       # Modelo de Publicaciones/Posteos
│   ├── Like.js                         # Modelo de Likes
│   ├── Follow.js                       # Modelo de Seguidores/Seguidos
│   ├── Favorito.js                     # Modelo de Favoritos
│   ├── Comentario.js                   # Modelo de Comentarios
│   ├── Municipio.js                    # Modelo de Municipios (Tlaxcala) con GeoJSON
│   └── Notificacion.js                 # Modelo de Notificaciones
│
├── routes/
│   ├── bienvenida.js                   # GET / y GET /api/health
│   ├── auth.js                         # Autenticación (login, registro, verificación, etc.)
│   ├── usuarios.js                     # CRUD de usuarios
│   ├── uploads.js                      # Carga de imágenes de perfil
│   ├── posteos.js                      # CRUD de publicaciones
│   ├── likes.js                        # Likes a publicaciones
│   ├── followers.js                    # Seguir/dejar de seguir usuarios
│   ├── favoritos.js                    # Favoritos de publicaciones
│   ├── comentarios.js                  # Comentarios en publicaciones
│   ├── municipios.js                   # Obtener municipios
│   ├── ubicacion.js                    # Geolocalización inversa
│   ├── notificaciones.js               # Web Push y notificaciones
│   └── soporte.js                      # Tickets de ayuda y soporte
│
├── controllers/
│   ├── bienvenida.js                   # Controlador de bienvenida y health
│   ├── auth.js                         # Lógica de autenticación
│   ├── usuarios.js                     # Lógica de usuarios
│   ├── uploads.js                      # Lógica de carga de imágenes
│   ├── posteos.js                      # Lógica de publicaciones
│   ├── likes.js                        # Lógica de likes
│   ├── followers.js                    # Lógica de follows
│   ├── favoritos.js                    # Lógica de favoritos
│   ├── comentarios.js                  # Lógica de comentarios
│   ├── municipios.js                   # Lógica de municipios
│   ├── ubicacion.js                    # Lógica de geolocalización inversa
│   ├── notificaciones.js               # Lógica de notificaciones push
│   └── soporte.js                      # Lógica de soporte
│
├── middlewares/
│   ├── index.js                        # Re-exportaciones (barrel)
│   ├── rate-limiter.js                 # 9 limitadores de velocidad
│   ├── validar-campos.js               # Manejador de errores de express-validator
│   ├── validar-jwt-cookies-sesion.js   # Verificación de JWT en cookies
│   ├── validar-token-en-url.js         # Valida que el token exista en la URL
│   ├── validar-url-usuario.js          # Valida que la URL del usuario exista y esté activa
│   ├── validar-imagen-posteo.js        # Validación de imágenes con Multer
│   └── validar-texto.js                # Validación de texto con regex
│
├── helpers/
│   ├── index.js                        # Re-exportaciones (barrel)
│   ├── crear-jwt.js                    # Creación de JWT (JWT_SEED)
│   ├── validar-jwt.js                  # Verificación de JWT
│   ├── tokensUtils.js                  # Generadores de access/refresh token
│   ├── hashToken.js                    # Hash SHA-256 para tokens
│   ├── cerrar-sesion-cookies.js        # Logout: limpiar cookies + eliminar refresh token
│   ├── obtener-informacion-dispositivo.js  # Parseo de User-Agent (UAParser)
│   ├── multer.js                       # Configuración de Multer (memoria, 5MB)
│   ├── subir-archivo.js                # Stream de subida a Cloudinary
│   ├── crear-url-usuario.js            # Generador de URL única (slug)
│   ├── eliminar-archivos-usuario.js    # Eliminar carpeta de Cloudinary del usuario
│   ├── validar-correo-usuario.js       # Validador de correo único
│   ├── validar-id-usuario.js           # Validador de ID de usuario existente
│   ├── validar-id-posteo.js            # Validador de ID de posteo existente
│   ├── colecciones-permitidas.js       # Validación de colecciones permitidas
│   └── web-push.js                     # Configuración de Web Push (VAPID)
│
├── email/
│   ├── servicios-autenticacion-correo.js       # Lógica de verificación de correo
│   ├── servicios-correo-reestablecer-password.js  # Lógica de restablecimiento de contraseña
│   ├── servicio-ayuda-soporte-usuario.js          # Correos de soporte
│   └── servicio-correo-notificacion-comentario.js # Notificaciones de comentarios
│
├── errors/
│   └── custom.errors.js               # Clase CustomError (400, 401, 403, 404, 500)
│
├── jobs/
│   ├── eliminar-registros-cuentas-no-validadas.js   # Elimina cuentas no verificadas
│   ├── eliminar-cuentas-de-usuarios.js              # Elimina cuentas de usuarios (hard delete)
│   ├── eliminar-fisicamente-publicaciones-de-usuarios.js  # Elimina posteos (hard delete)
│   ├── eliminar-fisicamente-comentarios.js          # Elimina comentarios (hard delete)
│   ├── limpiar-suscripciones-web-push-antiguas.js   # Limpia suscripciones push viejas
│   └── functions/
│       ├── cron-jobs-functions.js       # Toda la lógica de los cron jobs
│       ├── eliminar-carpeta-cloudinary.js
│       ├── eliminar-imagen-perfil.js
│       └── eliminar-posteos-usuario.js
│
├── public/                             # Archivos estáticos
├── opencode/                           # Configuración de asistentes IA
└── node_modules/
```

---

## Requisitos Previos e Instalación

### Requisitos

- **Node.js** 18+ (el proyecto usa módulos ESM, `"type": "module"`)
- **MongoDB** (Atlas o instancia local)
- **Cuenta de Cloudinary** (almacenamiento de imágenes)
- **Servidor SMTP** (recomendado: Titan.Email)
- **Llaves VAPID** para Web Push (opcional, pero necesario para notificaciones)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd login-autenticacion

# 2. Instalar dependencias (usar pnpm, no npm)
pnpm install

# 3. Crear archivo .env (ver sección de variables de entorno)
#    Copiar desde .env.example o .env.development como base

# 4. Iniciar servidor de desarrollo
pnpm run dev
```

El servidor se inicia en `http://localhost:5000` por defecto.

> **Importante:** Este proyecto usa `pnpm` como gestor de paquetes. No usar `npm` ni `yarn`.

---

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# ─── Servidor ───
PORT=5000
NODE_ENV=development
BACKEND_URL=https://api.tlaxapp.com
FRONTEND_URL=http://localhost:3000

# ─── MongoDB ───
MONGODB_CONNECTION=mongodb+srv://usuario:password@cluster.mongodb.net/tlaxapp

# ─── JWT ───
# Semilla principal para tokens de verificación y restablecimiento
JWT_SEED=tu_seed_jwt
# Secretos separados para cada tipo de token
EMAIL_VERIFICATION_SECRET=secreto_verificacion_email
RESET_PASSWORD_SECRET=secreto_restablecer_password
# Tokens de sesión
ACCESS_TOKEN_SECRET=secreto_access_token
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_SECRET=secreto_refresh_token
REFRESH_TOKEN_EXPIRY=7d

# ─── Cloudinary ───
CLOUDINARY_URL=cloudinary://key:secret@cloudname
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
FOLDER_PRINCIPAL_IMAGENES=tlx-imagenes
CARPETA_IMAGENES_POSTEOS=imagenes-posteos-usuarios
DEFAULT_USER_IMAGE=https://res.cloudinary.com/.../no-imagen-usuario.webp

# ─── SMTP (Titan Email) ───
MAILER_HOST=smtp.titan.email
MAILER_PORT=465
MAILER_AUTH_USER=tlaxapp@tlaxapp.com
MAILER_AUTH_PASSWORD=contraseña_principal
MAILER_USER_NOREPLY=no-reply@tlaxapp.com
MAILER_AUTH_PASSWORD_NOREPLY=
MAILER_USER_VERIFICAR=verificar@tlaxapp.com
MAILER_AUTH_PASSWORD_VERIFICAR=contraseña_verificar
MAILER_USER_AYUDA_SOPORTE=soporte@tlaxapp.com
MAILER_AUTH_PASSWORD_AYUDA_SOPORTE=
MAILER_USER_LEGAL=legal@tlaxapp.com
MAILER_AUTH_PASSWORD_LEGAL=
MAILER_USER_INFO=info@tlaxapp.com
MAILER_AUTH_PASSWORD_INFO=
MAILER_USER_NOTIFICACIONES=notificaciones@tlaxapp.com
MAILER_AUTH_PASSWORD_NOTIFICACIONES=

# ─── Web Push (VAPID) ───
VAPID_PUBLIC_KEY=tu_llave_publica_vapid
VAPID_PRIVATE_KEY=tu_llave_privada_vapid

# ─── Feature Flags ───
SEND_EMAIL=false
```

### Variables Destacadas

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (5000 por defecto) |
| `NODE_ENV` | `development` o `production` |
| `FRONTEND_URL` | URL del frontend (para CORS y links en correos) |
| `MONGODB_CONNECTION` | Cadena de conexión a MongoDB |
| `JWT_SEED` | Semilla para tokens de verificación de cuenta y restablecimiento de password |
| `ACCESS_TOKEN_SECRET` | Secreto para firmar access tokens |
| `REFRESH_TOKEN_SECRET` | Secreto para firmar refresh tokens |
| `CLOUDINARY_URL` | URL completa de Cloudinary (opcional si se usan las variables individuales) |
| `DEFAULT_USER_IMAGE` | URL de imagen de perfil por defecto |
| `SEND_EMAIL` | Cuando es `false`, se omite el envío de correos (útil en desarrollo) |

---

## Scripts Disponibles

| Comando | Descripción |
|---|---|
| `pnpm run dev` | Inicia el servidor en modo desarrollo con `nodemon` (recarga automática) |
| `pnpm run start` | Inicia el servidor en producción con `node` |
| `pnpm run test` | Placeholder (no hay tests configurados) |
| `pnpm add <paquete>` | Instala una dependencia (usar **pnpm**, no npm) |

---

## Flujo de Autenticación

Esta API utiliza una **estrategia de doble JWT** con **cookies httpOnly**.

### Diagrama de Flujo

```
Frontend                          Backend
   │                                │
   │  POST /api/auth/login          │
   │  { correo, password }          │
   │───────────────────────────────>│
   │                                │─ Verificar credenciales (bcryptjs)
   │                                │─ Generar accessToken (1h)
   │                                │─ Generar refreshToken (7d)
   │                                │─ Guardar refreshToken (hash SHA-256) en UserToken
   │                                │─ Establecer cookies httpOnly
   │<───────────────────────────────│
   │  Set-Cookie: accessToken       │
   │  Set-Cookie: refreshToken      │
   │                                │
   │  GET /api/auth/me              │
   │  (cookies se envían auto)      │
   │───────────────────────────────>│
   │                                │─ Verificar accessToken cookie
   │<───────────────────────────────│
   │  { usuario }                   │
   │                                │
   │  POST /api/auth/refresh        │
   │  (cookies se envían auto)      │
   │───────────────────────────────>│
   │                                │─ Verificar refreshToken cookie
   │                                │─ Emitir nuevo par de tokens
   │                                │─ Rotar refresh token en BD
   │<───────────────────────────────│
   │  Set-Cookie: accessToken       │
   │  Set-Cookie: refreshToken      │
   │                                │
   │  POST /api/auth/logout         │
   │───────────────────────────────>│
   │                                │─ Eliminar refreshToken de BD
   │                                │─ Limpiar cookies
   │<───────────────────────────────│
   │  { msg: "Sesión cerrada" }     │
```

### Detalles de Tokens

| Token | Payload | Expiración | Variable de Entorno | Almacenado en |
|---|---|---|---|---|
| **accessToken** | `{ id }` | 1 hora | `ACCESS_TOKEN_SECRET` | Cookie httpOnly |
| **refreshToken** | `{ id }` | 7 días | `REFRESH_TOKEN_SECRET` | Cookie httpOnly + BD (hash) |
| **Verificación** | `{ nombre, correo }` | 1 hora | `EMAIL_VERIFICATION_SECRET` | BD (registro del usuario) |
| **Reset Password** | `{ nombre, correo }` | 1 hora | `RESET_PASSWORD_SECRET` | BD (registro del usuario) |

- El **accessToken** debe estar presente en las cookies para todos los endpoints protegidos.
- El **refreshToken** se usa exclusivamente en `POST /api/auth/refresh` para obtener un nuevo par.
- Los tokens de verificación y restablecimiento se envían por correo y se validan contra la BD.

### Flujo de Estados de la Cuenta

1. Usuario se registra → `estatus: 0`, `email_validated: false`
2. Se envía correo de verificación con enlace JWT
3. Usuario hace clic → `GET /api/auth/verificar-correo/:token`
4. Si el token es válido → `email_validated: true`, `estatus: 1`
5. Para iniciar sesión se requiere `email_validated: true` Y `estatus: 1`

### Cookies de Sesión

Ambas cookies se configuran con:
- `httpOnly: true` — No accesible desde JavaScript
- `secure: true` — Solo por HTTPS
- `sameSite: 'none'` — Permite cross-site (frontend y backend en diferentes dominios)
- `path: '/'` — Disponible en toda la aplicación

---

## Modelos de Base de Datos

### 1. Usuario (Usuario)

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre_completo.nombre` | String (req) | Nombre(s) |
| `nombre_completo.apellido` | String | Apellido(s) |
| `correo` | String (único) | Correo electrónico |
| `password` | String | Contraseña encriptada con bcrypt |
| `url` | String (único) | Slug del perfil (ej. `juanperez`) |
| `lugar_radicacion` | Objeto | `{ claveEntidad, nombreEntidad, claveMunicipio, nombreMunicipio, codigoPostal }` |
| `genero` | String | `MASCULINO` / `FEMENINO` / `PREFIERO NO DECIR` |
| `fecha_nacimiento` | Date | Fecha de nacimiento |
| `imagen_perfil` | Objeto | `{ secure_url, public_id }` (Cloudinary) |
| `estatus` | Number (0-4) | 0=no activada, 1=activa, 2=infringió normas, 3=suspendida, 4=eliminada |
| `email_validated` | Boolean | Correo verificado |
| `intentos_login` | Number | Intentos fallidos de inicio de sesión |
| `verificacion_token` | String | Token JWT para verificar correo |
| `reset_password_token` | String | Token JWT para restablecer contraseña |
| `notificaciones_activadas` | Boolean | Notificaciones push activadas |
| `pushSubscriptions` | Array | Suscripciones Web Push `[{ endpoint, keys, userAgent, createdAt, lastUsedAt }]` |
| `ultimo_correo_enviado` | Date | Último envío de correo (cooldown de 5 min) |
| `ultimo_inicio_sesion` | Date | Último inicio de sesión |
| `isDeleted` | Boolean | Soft delete |
| `deletedAt` | Date | Fecha de soft delete |
| `fecha_registro` | Date (auto) | Fecha de creación de la cuenta |
| `fecha_actualizacion` | Date | Fecha de última actualización |

**Índices:** `{ url: 1 }` único, `{ isDeleted: 1, deletedAt: 1 }`, `{ estatus: 1, isDeleted: 1 }`

---

### 2. UserToken (Almacenamiento de Refresh Tokens)

| Campo | Tipo | Descripción |
|---|---|---|
| `userId` | ObjectId (ref) | Referencia al Usuario |
| `token` | String | Hash SHA-256 del refresh token JWT |
| `ip` | String | Dirección IP al crear el token |
| `userAgent` | String | Cabecera User-Agent |
| `deviceName` | String | Nombre del dispositivo (navegador + SO) |
| `lastUsed` | Date | Último uso del token |
| `createdAt` | Date (auto) | TTL index: auto-eliminación después de 30 días |

---

### 3. Posteo (Publicación)

| Campo | Tipo | Descripción |
|---|---|---|
| `_idUsuario` | ObjectId (ref) | Autor de la publicación |
| `public_id` | String | ID público en Cloudinary |
| `secure_url` | String | URL segura en Cloudinary |
| `texto` | String | Texto de la publicación |
| `ubicacion` | Objeto | `{ ciudad, municipio, estado, pais, coordinates, esExacta }` |
| `posteo_publico` | Boolean | Visibilidad pública (default: true) |
| `comentariosActivos` | Boolean | Comentarios habilitados (default: true) |
| `comentariosCount` | Number | Contador de comentarios (desnormalizado) |
| `isDeleted` | Boolean | Soft delete |
| `deleteReason` | String | `"manual"` / `"accountDeletion"` / `null` |
| `deletedAt` | Date | Fecha de soft delete |
| `fecha_creacion` | Date (auto) | Fecha de creación |
| `fecha_actualizacion` | Date | Fecha de actualización |

**Índices:** `{ _idUsuario: 1, isDeleted: 1 }`, `{ fecha_creacion: -1 }`, `{ isDeleted: 1, deleteReason: 1 }`

---

### 4. Like

| Campo | Tipo | Descripción |
|---|---|---|
| `_idUsuario` | ObjectId (ref) | Usuario que dio like |
| `_idCreadorPosteo` | ObjectId (ref) | Autor de la publicación |
| `posteoId` | ObjectId (ref) | Publicación que recibió el like |
| `isDeleted` | Boolean | Soft delete |
| `deletedAt` | Date | Fecha de soft delete |
| `createdAt` | Date (auto) | Fecha de creación |

**Índices:** Único compuesto `{ _idUsuario: 1, posteoId: 1 }`

---

### 5. Follow (Seguidores)

| Campo | Tipo | Descripción |
|---|---|---|
| `follower` | ObjectId (ref) | Usuario que sigue |
| `following` | ObjectId (ref) | Usuario siendo seguido |
| `isDeleted` | Boolean | Soft delete |
| `createdAt` | Date (auto) | |
| `deletedAt` | Date | |

**Índices:** Único compuesto `{ follower: 1, following: 1 }`

---

### 6. Favorito

| Campo | Tipo | Descripción |
|---|---|---|
| `usuarioId` | ObjectId (ref) | Usuario que guardó el favorito |
| `posteoId` | ObjectId (ref) | Publicación favorita |
| `autorId` | ObjectId (ref) | Autor de la publicación |
| `isDeleted` | Boolean | Soft delete |
| `createdAt` | Date (auto) | |
| `deletedAt` | Date | |

**Índices:** Único parcial `{ usuarioId: 1, posteoId: 1 }` donde `isDeleted: false`

---

### 7. Comentario

| Campo | Tipo | Descripción |
|---|---|---|
| `texto` | String (req) | Texto del comentario (máx. 250 caracteres) |
| `posteoId` | ObjectId (ref) | Publicación padre |
| `autorId` | ObjectId (ref) | Autor del comentario |
| `isDeleted` | Boolean | Soft delete |
| `eliminadoPor` | ObjectId (ref) | Quién eliminó el comentario |
| `deleteReason` | String | `"manual"` / `"accountDeletion"` / `null` |
| `deletedAt` | Date | |
| `createdAt` | Date (auto) | (timestamps: true) |
| `updatedAt` | Date (auto) | (timestamps: true) |

---

### 8. Municipio (Tlaxcala)

| Campo | Tipo | Descripción |
|---|---|---|
| `claveEntidad` | Number | Código del estado (29 = Tlaxcala) |
| `nombreEntidad` | String | Nombre del estado |
| `claveMunicipio` | Number | Código del municipio |
| `nombreMunicipio` | String | Nombre del municipio |
| `codigoPostal` | String | Código postal |
| `geometry` | GeoJSON | `Polygon` o `MultiPolygon` (índice 2dsphere) |

**Índices:** `{ geometry: "2dsphere" }`, índice de texto en `nombreMunicipio`

---

### 9. Notificación

| Campo | Tipo | Descripción |
|---|---|---|
| `receptor` | ObjectId (ref) | Usuario que recibe la notificación |
| `emisor` | ObjectId (ref) | Usuario que origina la notificación |
| `tipo` | String | `follow` / `like` / `comentario` / `nueva_publicacion` |
| `referencia` | ObjectId (ref) | Referencia polimórfica (Posteo, etc.) |
| `tipoReferencia` | String | `Posteo` / `Follow` / `Like` / `null` |
| `mensaje` | String | Texto corto de la notificación |
| `notificacion_leida` | Boolean | Leída/no leída |
| `isDeleted` | Boolean | Soft delete |
| `deletedAt` | Date | |
| `createdAt` | Date (auto) | |

**Índices:** `{ receptor: 1, notificacion_leida: 1, isDeleted: 1 }`

---

## API - Referencia Completa

URL Base: `http://localhost:5000` (desarrollo)  
Todos los endpoints protegidos requieren la cookie `accessToken`.

> Para una documentación detallada de cada endpoint con esquemas de request/response, consultar el archivo **API.md**.

### 1. Bienvenida y Salud

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/` | Información básica de la API | No |
| GET | `/api/health` | Estado del servidor (uptime, memoria, BD, etc.) | No |

### 2. Autenticación

| Método | Ruta | Descripción | Rate Limit |
|---|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión | `loginLimiter` |
| POST | `/api/auth/refresh` | Renovar tokens | `refreshLimiter` |
| POST | `/api/auth/logout` | Cerrar sesión | No |
| GET | `/api/auth/me` | Obtener perfil del usuario autenticado | No |
| GET | `/api/auth/verificar-correo{/:token}` | Verificar correo electrónico | No |
| POST | `/api/auth/reenviar-correo` | Reenviar correo de verificación | `reenvioCorreoLimiter` |
| POST | `/api/auth/cuentas/password-olvidado` | Enviar correo de restablecimiento | `recoveryLimiter` |
| POST | `/api/auth/reenviar-correo-restablecer-password` | Reenviar correo de restablecimiento | `recoveryLimiter` |
| GET | `/api/auth/cuentas/restablecer-password/validar-token-reset-password{/:token}` | Validar token de restablecimiento | No |
| POST | `/api/auth/cuentas/reestablecer-password{/:token}` | Restablecer contraseña | No |

### 3. Usuarios

| Método | Ruta | Descripción | Rate Limit |
|---|---|---|---|
| GET | `/api/usuarios` | Listar usuarios (deshabilitado) | `lecturaLimiter` |
| GET | `/api/usuarios/:url` | Obtener perfil por URL | No |
| POST | `/api/usuarios` | Registrar nuevo usuario | `registroLimiter` |
| PUT | `/api/usuarios/update` | Actualizar perfil | No |
| DELETE | `/api/usuarios/delete` | Eliminar cuenta (soft delete) | No |
| GET | `/api/usuarios/registrados/nuevos-usuarios-registrados` | Últimos 3 usuarios registrados | No |

### 4. Publicaciones (Posteos)

| Método | Ruta | Descripción | Rate Limit |
|---|---|---|---|
| GET | `/api/posteos` | Obtener publicaciones paginadas | `lecturaLimiter` |
| GET | `/api/posteos/post/:id` | Obtener una publicación por ID | No |
| GET | `/api/posteos/usuario/:idUsuario` | Publicaciones de un usuario | No |
| POST | `/api/posteos` | Crear publicación con imagen | `posteoLimiter` |
| PUT | `/api/posteos/:id` | Actualizar publicación | No |
| DELETE | `/api/posteos/:id` | Eliminar publicación (soft delete) | No |

### 5. Likes

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/likes/:id/like` | Dar/quitar like a una publicación |
| GET | `/api/likes/posteo/:id` | Contar likes de una publicación |
| GET | `/api/likes/:id/likes/usuarios` | Usuarios que dieron like |

### 6. Followers (Seguidores)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/followers/follow/:id` | Seguir a un usuario |
| DELETE | `/api/followers/unfollow/:id` | Dejar de seguir a un usuario |
| GET | `/api/followers/usuario/lista-followers/:id` | Obtener seguidores |
| GET | `/api/followers/usuario/lista-followings/:id` | Obtener seguidos |

### 7. Favoritos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/favoritos` | Obtener favoritos del usuario |
| POST | `/api/favoritos/:posteoId` | Agregar a favoritos |
| DELETE | `/api/favoritos/:posteoId` | Eliminar de favoritos |

### 8. Comentarios

| Método | Ruta | Rate Limit |
|---|---|---|
| POST | `/api/comentarios/:posteoId/comentarios` | Agregar comentario | `comentarioLimiter` |
| GET | `/api/comentarios/:posteoId/comentarios` | Obtener comentarios paginados | No |
| GET | `/api/comentarios/:posteoId/comentarios/count` | Contar comentarios | No |
| DELETE | `/api/comentarios/:comentarioId` | Eliminar comentario | No |
| PUT | `/api/comentarios/:posteoId/comentarios/toggle` | Activar/desactivar comentarios | No |

### 9. Municipios y Ubicación

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/municipios` | Obtener todos los municipios de Tlaxcala |
| GET | `/api/ubicacion` | Obtener municipios (alias) |
| POST | `/api/ubicacion/reverse` | Geocodificación inversa (coordenadas → municipio) |

### 10. Notificaciones y Web Push

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/notificaciones` | Obtener notificaciones paginadas |
| GET | `/api/notificaciones/nuevas-notificaciones` | Contar notificaciones no leídas |
| GET | `/api/notificaciones/vapidPublicKey` | Obtener clave pública VAPID |
| PATCH | `/api/notificaciones/marcar-notificacion-leida/:id` | Marcar notificación como leída |
| DELETE | `/api/notificaciones/eliminar-notificacion/:id` | Eliminar notificación |
| POST | `/api/notificaciones/subscribe` | Suscribir a notificaciones push |
| POST | `/api/notificaciones/unsubscribe` | Desuscribir de notificaciones push |

### 11. Uploads (Imagen de Perfil)

| Método | Ruta | Descripción |
|---|---|---|
| PUT | `/api/uploads/:coleccion` | Actualizar imagen de perfil (solo `coleccion=usuarios`) |

### 12. Soporte

| Método | Ruta | Rate Limit |
|---|---|---|
| POST | `/api/ayuda-soporte/envio-correo` | Enviar ticket de soporte | `soporteLimiter` |

---

## Middleware

### Middleware de Autenticación

| Middleware | Archivo | Descripción |
|---|---|---|
| `verificarTokenSesion` | `validar-jwt-cookies-sesion.js` | Verifica cookie `accessToken`, carga el usuario, establece `req.usuario = user.id` |
| `validarRefreshToken` | `validar-jwt-cookies-sesion.js` | Verifica que exista la cookie `refreshToken` (para logout) |

### Middleware de Validación

| Middleware | Archivo | Descripción |
|---|---|---|
| `validarCampos` | `validar-campos.js` | Procesa errores de express-validator; retorna 400 o 409 (correo duplicado) |
| `validarTokenEnURL` | `validar-token-en-url.js` | Asegura que el parámetro `:token` esté presente en la URL |
| `validarUrlUsuario` | `validar-url-usuario.js` | Valida que el slug del usuario exista y la cuenta esté activa |
| `validarTexto` | `validar-texto.js` | Validación regex para texto de publicaciones: `/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,!?¡¿()\s-]*$/` |

### Middleware de Imágenes

| Middleware | Archivo | Descripción |
|---|---|---|
| `upload.single('img')` | `helpers/multer.js` | Multer con almacenamiento en memoria, límite 5MB, solo jpg/jpeg/png/webp |
| `validarCampoImg` | `validar-imagen-posteo.js` | Verifica que `req.file` exista |
| `validarImagenesMulter` | `validar-imagen-posteo.js` | Traduce códigos de error de Multer a mensajes amigables |

---

## Rate Limiting

Nueve limitadores configurados en `middlewares/rate-limiter.js`:

| Limitador | Ventana | Máximo | Código | Aplicado a |
|---|---|---|---|---|
| `loginLimiter` | 15 min | 5 | `LOGIN_BLOCKED` | `POST /api/auth/login` |
| `recoveryLimiter` | 15 min | 3 | `RECOVERY_BLOCKED` | Endpoints de restablecimiento de contraseña |
| `reenvioCorreoLimiter` | 5 min | 3 | `EMAIL_BLOCKED` | Reenvío de correo de verificación |
| `registroLimiter` | 1 hora | 3 | `REGISTER_BLOCKED` | `POST /api/usuarios` |
| `posteoLimiter` | 15 min | 20 | `POSTEO_BLOCKED` | `POST /api/posteos` |
| `soporteLimiter` | 15 min | 5 | `SOPORTE_BLOCKED` | `POST /api/ayuda-soporte/envio-correo` |
| `lecturaLimiter` | 15 min | 100 | `READ_BLOCKED` | GET endpoints (lista de posteos, usuarios) |
| `comentarioLimiter` | 1 min | 10 | `COMENTARIO_BLOCKED` | Creación de comentarios |
| `refreshLimiter` | 15 min | 10 | `REFRESH_BLOCKED` | Renovación de tokens |

Todos los limitadores tienen `validate: false` para evitar la dependencia de IPv6.  
`loginLimiter` usa un `keyGenerator` personalizado: `IP + correo` (o solo `IP` si no hay correo en el body).

---

## Formato de Respuesta de Error

### Formato Estándar

```json
{
  "ok": false,
  "status": 429,
  "msg": "Demasiados intentos de inicio de sesión...",
  "code": "LOGIN_BLOCKED"
}
```

### Códigos de Estado HTTP Utilizados

| Código | Significado | Uso |
|---|---|---|
| `200` | Éxito | Operación exitosa |
| `201` | Creado | Recurso creado (posteo, comentario) |
| `400` | Bad Request | Errores de validación (express-validator) |
| `401` | Unauthorized | Token faltante/inválido, credenciales incorrectas |
| `403` | Forbidden | Cuenta no verificada, no activada, o permisos insuficientes |
| `404` | Not Found | Recurso no existe |
| `409` | Conflict | Correo electrónico duplicado |
| `429` | Too Many Requests | Límite de tasa excedido (con campo `code`) |
| `500` | Internal Server Error | Error inesperado del servidor |

### Clase de Error Personalizada

`errors/custom.errors.js` provee la clase `CustomError` con métodos factory estáticos:

- `CustomError.badRequest(message)` → 400
- `CustomError.unauthorized(message)` → 401
- `CustomError.forbidden(message)` → 403
- `CustomError.notFound(message)` → 404
- `CustomError.internalServer(message)` → 500

---

## Cron Jobs

Todos los cron jobs se cargan automáticamente al iniciar `app.js` (se importan antes de la clase Server).

| Job | Schedule (Dev) | Schedule (Prod) | Descripción |
|---|---|---|---|
| **Eliminar cuentas no verificadas** | Cada 10 min | Cada 10 min | Elimina cuentas con `email_validated: false` creadas hace > 61 min |
| **Eliminar cuentas de usuario** | Cada 4 min | Diario 3:00 AM (CDT) | Hard-delete de cuentas con `estatus: 4` y `deletedAt` > 5 min; elimina imágenes de Cloudinary, posteos, likes, follows, favoritos, notificaciones, comentarios |
| **Eliminar posteos soft-delete** | Cada 2 min | Cada 2 min | Elimina permanentemente posteos con `isDeleted: true`, `deleteReason: "manual"`, y `deletedAt` > 2 min; también elimina likes, comentarios y favoritos asociados |
| **Eliminar comentarios soft-delete** | Cada 4 min | Diario 3:00 AM (CDT) | Elimina permanentemente comentarios con `isDeleted: true`, `deleteReason: "manual"`, y `deletedAt` > 5 min |
| **Limpiar suscripciones push viejas** | Semanal 4 AM (UTC) | Semanal 4 AM (UTC) | Elimina suscripciones Web Push no usadas en más de 2 días; desactiva notificaciones si no quedan suscripciones |

> **Nota:** Los tiempos en entorno de desarrollo son intencionalmente cortos (minutos) para pruebas. En producción se deben ajustar (valores comentados en el código).

---

## Servicios de Correo

Todos los correos se envían mediante Nodemailer usando Titan SMTP (`smtp.titan.email`, puerto 465, seguro). La fábrica de transporters (`config/nodemailer-transporter.js`) crea conexiones pooled con hasta 5 conexiones y 100 mensajes por conexión, cacheadas por tipo de cuenta.

### Cuentas de Correo

| Cuenta | Variable de Usuario | Variable de Contraseña | Propósito |
|---|---|---|---|
| `verificar` | `MAILER_USER_VERIFICAR` | `MAILER_AUTH_PASSWORD_VERIFICAR` | Verificación, restablecimiento, soporte, notificaciones |

Actualmente todas las funcionalidades de correo usan la cuenta `verificar`.

### Correos Enviados

| Tipo de Correo | Disparador | Destinatario | Plantilla |
|---|---|---|---|
| Verificación de cuenta | Registro de usuario | Correo del usuario | HTML con botón corporativo |
| Restablecer contraseña | Flujo "Olvidé mi contraseña" | Correo del usuario | HTML con botón de restablecimiento |
| Ticket de soporte (al equipo) | Usuario envía formulario de soporte | `MAILER_USER_AYUDA_SOPORTE` | HTML con detalles del ticket y botón de respuesta |
| Confirmación de soporte | Envío de formulario de soporte | Correo del usuario | HTML con ID de ticket |
| Notificación de comentario | Primer comentario en una publicación | Correo del autor | HTML con texto del comentario y enlace |

Todas las plantillas incluyen el logotipo de TlaxApp, diseño HTML responsivo y son compatibles con dispositivos móviles.

---

## Notas Técnicas y Particularidades

### 1. `path-to-regexp` v8 - Cambio Importante

Express 5 usa `path-to-regexp` v8+, que cambió la sintaxis de parámetros opcionales:

| Sintaxis Anterior (v7) | Sintaxis Nueva (v8+) |
|---|---|
| `/ruta/:param?` | `/ruta{/:param}` |

Todas las rutas en este proyecto han sido actualizadas. Ejemplos:

```javascript
// Verificación de correo - token opcional
router.get('/verificar-correo{/:token}', ...);

// Validar token de restablecimiento - token opcional
router.get('/cuentas/restablecer-password/validar-token-reset-password{/:token}', ...);

// Restablecer contraseña - token opcional
router.post('/cuentas/reestablecer-password{/:token}', ...);
```

### 2. Estrategia de Soft Delete

La mayoría de los datos usa un borrado en dos fases:

1. **Soft delete** (`isDeleted: true`, `deletedAt`, `deleteReason`) — inmediato, visible para el usuario
2. **Hard delete** — ejecutado por cron jobs después de un período de retención

### 3. Gestión de Imágenes en Cloudinary

- Las imágenes se almacenan en carpetas estructuradas: `{FOLDER_PRINCIPAL_IMAGENES}/{categoria}/{userId}/{uuid}`
- Imágenes de posteos: `tlx-imagenes/imagenes-posteos-usuarios/{userId}/{uuid}`
- Imágenes de perfil: `tlx-imagenes/imagenes-perfiles-usuarios/{userId}/{uuid}`
- Transformaciones aplicadas: máximo 1080px de ancho, formato/calidad automático, carga progresiva, preparado para retina
- Las imágenes antiguas se eliminan antes de subir nuevas (imágenes de perfil)
- Cuando se elimina una cuenta, toda la carpeta del usuario en Cloudinary se elimina

### 4. `keyGenerator` Personalizado en Rate Limiting

El `loginLimiter` usa una estrategia única de clave:

```javascript
keyGenerator: (req) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const correo = req.body?.correo;
  return correo ? `${ip}:${correo}` : ip;
}
```

Esto vincula el rate limiting tanto a la dirección IP como al correo intentado, evitando que un solo usuario bloquee globalmente a través de diferentes cuentas.

### 5. DNS Personalizado

En `database/config.js` se fuerza el uso de DNS de Google para evitar problemas de resolución en ciertos entornos:

```javascript
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
```

### 6. Conexión a MongoDB

Configuración optimizada:

```javascript
await mongoose.connect(process.env.MONGODB_CONNECTION, {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 30000,
});
```

Se maneja el cierre controlado de la conexión en caso de señales `SIGINT` y `SIGTERM`.

### 7. Formato de Datos de Ubicación

El modelo `Posteo` utiliza el formato GeoJSON estándar de MongoDB para coordenadas:

```javascript
coordinates: {
  type: { type: String, enum: ['Point'] },
  coordinates: [Number]  // [longitud, latitud] - orden de MongoDB
}
```

### 8. Transacciones en MongoDB

La eliminación de cuenta de usuario (`controllers/usuarios.js` - `usuariosDelete`) utiliza una **transacción de MongoDB** para asegurar atomicidad. Si alguna operación falla, todas las modificaciones se revierten automáticamente.

### 9. Archivos Públicos

El directorio `public/` contiene activos estáticos servidos en la raíz (`/`):
- `icono-tlaxapp-beige.png`
- `icono-tlaxapp-blanco.png`

### 10. Configuración de Agentes IA

El archivo `AGENTS.md` proporciona contexto del proyecto para asistentes de IA, útil para herramientas de generación de código.
