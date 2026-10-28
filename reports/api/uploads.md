# Subida de imagen de perfil (`/api/uploads`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:125`. Multer en memoria: `helpers/multer.js` (límite 8 MB, solo `.jpg/.jpeg/.png/.webp` y MIME `image/jpeg|png|webp`).

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [PUT] /api/uploads/:coleccion

**Descripción:** Sube una nueva imagen de perfil del usuario autenticado a Cloudinary (sin transformaciones en la subida), borra la imagen anterior si no era la predeterminada y guarda `secure_url` y `public_id` en el usuario.
**Archivo de ruta:** `routes/uploads.js:17`
**Controlador:** `controllers/uploads.js` — `actualizarImagen` (línea 9)

### Autenticación y permisos
- Requiere token: **Sí** (cookie `accessToken`).
- Cadena de middlewares, en orden:
  1. `imagenPerfilLimiter` (`middlewares/rate-limiter.js:191`)
  2. `verificarTokenSesion`
  3. `upload.single('img')` (`helpers/multer.js`)
  4. `validarCampoImg` (`middlewares/validar-imagen-posteo.js:16`)
  5. `validarImagenesMulter` (`middlewares/validar-imagen-posteo.js:25`)
  6. `check('coleccion').custom(coleccionesPermitidas(c, ['usuarios']))` (`helpers/colecciones-permitidas.js:6`)
  7. `validarCampos` → `actualizarImagen`
- Rate limiter: `imagenPerfilLimiter`, 15 min / 10, código `IMAGEN_BLOCKED`.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `coleccion` | string | Sí | Solo `"usuarios"` (`coleccionesPermitidas`); cualquier otro valor → 422 |
| body (multipart) | `img` | archivo | Sí | Campo **exacto** `img`. Extensión `.jpg/.jpeg/.png/.webp` (`helpers/multer.js:17-22`), MIME `image/jpeg`, `image/png` o `image/webp` (`:25-28`), tamaño máximo 8 MB (`:11`) |

### Ejemplo de request
```http
PUT /api/uploads/usuarios
Content-Type: multipart/form-data; boundary=----X
Cookie: accessToken=…

------X
Content-Disposition: form-data; name="img"; filename="perfil.jpg"
Content-Type: image/jpeg

<bytes>
------X--
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Imagen de perfil actualizada correctamente",
  "data": {
    "imagen_perfil": {
      "secure_url": "https://res.cloudinary.com/…/imagenes-perfiles-usuarios/6650a1…/…jpg",
      "public_id": "…"
    }
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 429 | `IMAGEN_BLOCKED` | Rate Limit Exceeded | "Demasiadas subidas de imagen de perfil, intenta de nuevo en 15 minutos" | `middlewares/rate-limiter.js:198-200` |
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" / "Sesión expirada - inicia sesión nuevamente" | `middlewares/validar-jwt-cookies-sesion.js:14,45,35` |
| 404 | `NOT_FOUND` | Resource Not Found | "No hay ninguna imagen para subir" (no llega archivo en `img`) | `middlewares/validar-imagen-posteo.js:19` |
| 400 | `BAD_REQUEST` | Bad Request | "La imagen excede el tamaño máximo permitido (8 MB)" (`LIMIT_FILE_SIZE`) | `middlewares/validar-imagen-posteo.js:7,27` |
| 400 | `BAD_REQUEST` | Bad Request | `Campo de archivo no esperado: "img"` (`LIMIT_UNEXPECTED_FILE`: el archivo viene en otro nombre de campo) | `middlewares/validar-imagen-posteo.js:12,27` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Ocurrió un error inesperado. Por favor, intente más tarde." (extensión o MIME no permitidos: ver nota) | `helpers/multer.js:22,27` → `middlewares/validar-imagen-posteo.js:31` → `middlewares/error-handler.js:108-118` |
| 422 | `VALIDATION_FAILED` | Validation Failed | `La coleccion: <valor> no esta permitida, se permiten: usuarios` (en `errors[0].message`) | `helpers/colecciones-permitidas.js:10` → `middlewares/validar-campos.js:28` |
| 400 | `BAD_REQUEST` | Bad Request | `No existe un usuario con el ID: <id>` | `controllers/uploads.js:24` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al actualizar la imagen" (incluye fallos de Cloudinary y de `save()`) | `controllers/uploads.js:89` |

### Notas para el Frontend
- Envía **`multipart/form-data`** con el campo **`img`**. Un nombre distinto da 400, no 404.
- ⚠ **Extensión o MIME no permitidos → 500**, no 400. El `fileFilter` de Multer lanza un `Error` sin `code`, que `validarImagenesMulter` no reconoce y reenvía al handler global (`helpers/multer.js:22,27`; `middlewares/validar-imagen-posteo.js:31`). Valida tipo y tamaño en el cliente antes de enviar.
- El límite real es **8 MB**. El mensaje `"5MB"` de `middlewares/error-handler.js:45` queda sin uso para este endpoint (el mensaje de 8 MB se aplica antes).
- La respuesta incluye `secure_url` (a diferencia de posteos). Para mostrar la imagen usa `secure_url` o aplica transformaciones con `public_id` según la política del frontend.
- Subida cruda a Cloudinary (sin transformaciones en el backend). **[REQUIERE VERIFICACIÓN MANUAL]** la respuesta exacta de Cloudinary y el borrado previo.
- Efecto secundario: borra la imagen anterior de Cloudinary si no era `DEFAULT_USER_IMAGE`; un error al borrar se ignora (`controllers/uploads.js:49-52`).
- Cuenta contra `imagenPerfilLimiter` (10 por 15 min) incluso si luego falla la validación de la colección.
