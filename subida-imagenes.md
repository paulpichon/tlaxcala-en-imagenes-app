<!-- APLICADO -->
# Flujo de subida de imágenes

## Endpoints

### 1. Imagen de perfil — `PUT /api/uploads/:coleccion`

`routes/uploads.js:16` | Controlador: `controllers/uploads.js::actualizarImagen`

**Middlewares (en orden):**
1. `imagenPerfilLimiter` — 15min/10, code `IMAGEN_BLOCKED`
2. `verificarTokenSesion` — cookie `accessToken`, estatus=1, email_validated
3. `upload.single('img')` — multer en memoria, 5MB, jpg/jpeg/png/webp
4. `validarCampoImg` → `NotFoundError` si no hay archivo
5. `validarImagenesMulter` → convierte errores Multer a `BadRequestError`
6. `check('coleccion').custom(coleccionesPermitidas, ['usuarios'])`
7. `validarCampos`

**Flujo:**
1. Busca `Usuario.findById(idUsuario)` (id viene del token, no de ruta)
2. Si la imagen actual tiene `public_id` y no es la default → `cloudinary.uploader.destroy` (best-effort con try/catch)
3. `subirArchivo(buffer, 'imagenes-perfiles-usuarios', idUsuario)` → carpeta `tlx-imagenes/imagenes-perfiles-usuarios/<id>/`
4. Asigna `usuario.imagen_perfil.secure_url` y `usuario.imagen_perfil.public_id`
5. `usuario.save()`
6. Responde 200 `{ success, msg, data: { imagen_perfil } }`

**Modelo:** `Usuario.imagen_perfil` — `{ secure_url (default DEFAULT_USER_IMAGE), public_id }`

---

### 2. Imagen de posteo — `POST /api/posteos`

`routes/posteos.js:65` | Controlador: `controllers/posteos.js::posteosPost`

**Middlewares (en orden):**
1. `posteoLimiter` — 15min/20, code `POSTEO_BLOCKED`
2. `verificarTokenSesion`
3. `upload.single('img')`
4. `validarCampoImg`
5. `validarImagenesMulter`
6. `validarTexto` — regex sobre `texto` (opcional), `ValidationError` 422
7. `check('posteo_publico').optional().isBoolean()`, `lat`, `lng`
8. `validarCampos`

**Flujo:**
1. Normaliza `posteo_publico` de string a booleano
2. `subirArchivo(buffer, CARPETA_IMAGENES_POSTEOS, idUsuario)` → `tlx-imagenes/imagenes-posteos-usuarios/<id>/`
3. Construye `ubicacionData` (GeoJSON opcional)
4. `new Posteo({ _idUsuario, public_id, secure_url, texto, posteo_publico, ubicacion })`
5. `posteo.save()`
6. **Compensación en catch:** si `save()` falla y `resultado.public_id` existe → `cloudinary.uploader.destroy` (best-effort)
7. Responde 201 `{ success, msg, data: { posteo } }`

**Modelo:** `Posteo.public_id` + `Posteo.secure_url` (ambos `required`)

---

## Configuración compartida

### Multer (`helpers/multer.js`)
- `memoryStorage()` — sin disco, buffer directo a Cloudinary
- Límite: 5 MB (`fileSize: 5 * 1024 * 1024`)
- MIME aceptados: `image/jpeg`, `image/png`, `image/webp`
- Extensiones aceptadas: `.jpg`, `.jpeg`, `.png`, `.webp`
- Campo de formulario: `img` (single)

### Cloudinary (`helpers/subir-archivo.js::subirArchivo`)
- Firma: `subirArchivo(buffer, carpetaImagenes, idUsuario)` (3 params)
- `public_id`: `crypto.randomUUID()`
- Carpeta: `${FOLDER_PRINCIPAL_IMAGENES}/${carpeta}/${idUsuario}/`
- Transformaciones fijas:
  - `width: 1080, crop: "limit", flags: "progressive"`
  - `fetch_format: "auto", quality: "auto:good", dpr: "auto"`
  - `strip_profile: true`
- Usa `upload_stream` + `stream.end(buffer)`

### Crones relacionados

| Cron | Archivo | Función |
|---|---|---|
| Hard-delete posteos | `jobs/eliminar-fisicamente-publicaciones-de-usuarios.js` | Cada 2min (dev). Elimina posteos con `isDeleted:true, deleteReason:"manual"`. **Ejecuta `cloudinary.uploader.destroy(post.public_id)`.** |
| Eliminación de cuentas | `jobs/eliminar-cuentas-de-usuarios.js` | Borra carpeta entera del usuario en Cloudinary vía `eliminarPosteosUsuarioCloudinary` (`delete_resources_by_prefix` + `delete_folder`) + imagen de perfil vía `eliminarImagenPerfil`. |

---

## Errores posibles

| Código HTTP | Code | Origen |
|---|---|---|
| 400 | `BAD_REQUEST` | Colección no permitida, Multer, MIME/extensión inválida, usuario inexistente |
| 401 | `UNAUTHORIZED` | Token ausente/inválido |
| 403 | `FORBIDDEN` | Cuenta no activada (`estatus !== 1` o `email_validated === false`) |
| 404 | `NOT_FOUND` | Archivo no enviado en la petición |
| 422 | `VALIDATION_FAILED` | Texto no cumple regex (solo posteo) |
| 429 | `POSTEO_BLOCKED` | Rate-limit de posteos (15min/20) |
| 429 | `IMAGEN_BLOCKED` | Rate-limit de imagen de perfil (15min/10) |
| 500 | `INTERNAL_ERROR` | Fallo interno (Cloudinary, DB, etc.) |
