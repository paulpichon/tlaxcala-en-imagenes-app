# SPECS — Cambios de subida de imágenes (Cloudinary)

> **Dirigido a:** FRONTEND
> **Fecha:** 2026-08-11
> **Estado:** Implementado en el backend
> **Impacto:** Requiere cambios obligatorios en el frontend para evitar degradación visual y aprovechar la máxima calidad.

---

## 1. Resumen del cambio

El backend **ya no comprime ni redimensiona** las imágenes al subirlas a Cloudinary. Ahora cada imagen se almacena **tal cual la envía el usuario** (raw upload), sin re-encoding.

**Antes (comportamiento obsoleto):**
- El backend aplicaba `quality: 'auto:good'`, `width: 1080`, `crop: "limit"`, `dpr: 'auto'` en la subida.
- Resultado: imágenes ya comprimidas en origen → las transformaciones al vuelo del frontend degradaban aún más (doble pérdida de calidad).

**Ahora:**
- El original se guarda intacto (máxima calidad disponible).
- Todas las optimizaciones visuales deben aplicarse **en la URL de entrega desde el frontend**, usando el `public_id`.

Este es el patrón recomendado por Cloudinary: *"store original, transform on the fly"*.

---

## 2. Qué cambió en el backend (referencia)

| Archivo | Cambio |
|---|---|
| `helpers/subir-archivo.js` | Eliminado `transformation` (width/crop/quality/dpr/progressive) y `strip_profile`. Sube raw. |
| `helpers/multer.js` | Límite de archivo subido por el usuario: **5 MB → 8 MB**. |
| `middlewares/validar-imagen-posteo.js` | Mensaje de error actualizado a `8 MB`. |
| `controllers/uploads.js` / `controllers/posteos.js` | Callers limpios (ya no pasan width/crop ignorados). |

**Límites vigentes:**
- Tamaño máximo: **8 MB**.
- Formatos aceptados: `.jpg`, `.jpeg`, `.png`, `.webp`.

---

## 3. Qué debe cambiar el FRONTEND (OBLIGATORIO)

### 3.1. Construir las URLs de entrega con transformaciones al vuelo

Para **todas** las imágenes subidas por usuarios (posteos y avatares custom), el frontend debe construir URLs de Cloudinary a partir del `public_id` y agregar transformaciones.

**URL base:**
```
https://res.cloudinary.com/<CLOUD_NAME>/image/upload/<transformaciones>/<public_id>
```

- `<CLOUD_NAME>` viene del env del frontend (ya está configurado en el frontend según `.env.example` del backend: *"Si en BACKEND cambia CLOUDINARY_CLOUD_NAME, tambien debe cambiar en FRONTEND en configuraciones de next, ENV"*).
- `<transformaciones>`: cadena de parámetros de Cloudinary.
- `<public_id>`: lo devuelve el backend en las respuestas (ver sección 4).

**Transformaciones recomendadas por caso de uso:**

| Uso | Transformación | Ejemplo |
|---|---|---|
| Avatar perfil (cuadrado) | `w_<px>,h_<px>,c_fill,q_auto,f_auto,dpr_auto` | `w_100,h_100,c_fill,q_auto,f_auto,dpr_auto` |
| Thumbnail avatar en listados | `w_50,h_50,c_fill,q_auto,f_auto` | `w_50,h_50,c_fill,q_auto,f_auto` |
| Imagen de posteo (feed) | `w_<px>,q_auto,f_auto` (mantener proporción) | `w_800,q_auto,f_auto` |
| Posteo full (detalle) | `w_<px>,q_auto,f_auto,dpr_auto` | `w_1200,q_auto,f_auto,dpr_auto` |

**Nota sobre `c_fill`:** recorta y centra manteniendo relación de aspecto. Para avatares cuadrados usa `c_fill` + `w`/`h` iguales. Para posteos NO uses `c_fill` (recortaría contenido); usa solo `w_` para que Cloudinary mantenga la proporción.

### 3.2. NUNCA usar `secure_url` para render de imágenes subidas por usuarios

- La `secure_url` devuelta apunta al **original sin optimizar** (ahora puede pesar varios MB).
- Si el frontend la usa directa, las vistas cargarán imágenes pesadas y sin recorte.
- **Excepción única:** `DEFAULT_USER_IMAGE` (avatar por defecto) — ver sección 5.

### 3.3. Verificar que el env `CLOUDINARY_CLOUD_NAME` del frontend sea correcto

Si el `cloud_name` no coincide con el del backend, las URLs construidas manualmente no funcionarán. Validar contra el valor actual de `CLOUDINARY_CLOUD_NAME` en el backend.

---

## 4. Estructura de datos que devuelve el backend

### 4.1. Imagen de perfil de usuario

`GET/POST` de usuarios y login devuelven `usuario.imagen_perfil`:

```json
{
  "imagen_perfil": {
    "secure_url": "https://res.cloudinary.com/<cloud>/image/upload/v123/...",
    "public_id": "tlx-imagenes/imagenes-perfiles-usuarios/<uid>/<uuid>"
  }
}
```

- **`public_id`**: usar este campo para construir la URL con transformaciones.
- **`secure_url`**: usar solo como fallback o para la imagen por defecto (sección 5).

### 4.2. Posteo

Las respuestas de `/api/posteos` devuelven:

```json
{
  "public_id": "tlx-imagenes/imagenes-posteos-usuarios/<uid>/<uuid>",
  "secure_url": "https://res.cloudinary.com/<cloud>/image/upload/v123/..."
}
```

---

## 5. Excepción: avatar por defecto (`DEFAULT_USER_IMAGE`)

El avatar por defecto de cuentas sin imagen custom se entrega **solo** como `secure_url` (asset estático pre-optimizado y cacheable en CDN).

**Regla para el frontend:**
- Si `usuario.imagen_perfil.public_id` existe → construir URL con transformaciones.
- Si **NO** existe `public_id` (solo `secure_url`) → usar `secure_url` directo (es el default).

**Ejemplo de lógica:**
```js
function getAvatarUrl(imagenPerfil, size = 100) {
  if (imagenPerfil?.public_id) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    return `https://res.cloudinary.com/${cloudName}/image/upload/w_${size},h_${size},c_fill,q_auto,f_auto,dpr_auto/${imagenPerfil.public_id}`;
  }
  return imagenPerfil?.secure_url; // default pre-optimizado
}
```

---

## 6. Validaciones de subida (frontend también debe avisar antes de enviar)

Para evitar errores 400 del backend y una mala UX, validar en el frontend **antes** de enviar:

- Tamaño máximo: **8 MB**.
- Extensiones permitidas: `.jpg`, `.jpeg`, `.png`, `.webp`.
- MIME permitidos: `image/jpeg`, `image/png`, `image/webp`.

Error de exceso de tamaño que devuelve el backend:
```json
{
  "status": 400,
  "detail": "La imagen excede el tamaño máximo permitido (8 MB)",
  "code": "BAD_REQUEST"
}
```

---

## 7. Imágenes existentes (legacy) — sin migración

Las imágenes subidas **antes** de este cambio siguen almacenadas con la compresión antigua. No se re-procesan automáticamente.

- Se verán con menor calidad hasta que el usuario reemplace su avatar/imagen.
- El frontend NO necesita lógica especial para distinguirlas: la construcción de URL es la misma (`public_id` → transformaciones). Solo difiere la calidad del original almacenado.
- El `public_id` de las imágenes legacy también funciona para transformaciones al vuelo (Cloudinary las genera sobre el asset almacenado, aunque esté comprimido).

---

## 8. Resumen de acciones para el equipo frontend

1. **Reemplazar** el uso de `secure_url` por URLs construidas con `public_id` + transformaciones para imágenes de usuarios.
2. **Agregar helper de construcción de URL** (ver ejemplo en sección 5) que maneje el caso default vs custom.
3. **Configurar/verificar** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
4. **Actualizar validación** de subida a 8 MB / jpg-jpeg-png-webp.
5. **Probar nitidez**: comparar una imagen nueva (subida tras este cambio) renderizada con `w_100,h_100,c_fill,q_auto,f_auto` vs el flujo anterior. Debe verse notablemente más nítida.

---

## 9. Referencia de Cloudinary

- Patrón recomendado (store original, transform on the fly): https://cloudinary.com/documentation/transform_on_the_upload
- Parámetros de transformación (w, h, c_fill, q_auto, f_auto, dpr): https://cloudinary.com/documentation/transformation_reference
- Construcción de delivery URLs: https://cloudinary.com/documentation/transformations
