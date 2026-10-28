# Municipios, localidades y ubicación (`/api/municipios`, `/api/ubicacion`)

Volver al [índice](README.md). Convenciones globales: [README § Convenciones globales](README.md#convenciones-globales).

Montaje: `models/server.js:130` (municipios) y `:132` (ubicación). Modelo: `models/Municipio.js` (60 municipios, localidades embebidas, `geometry` GeoJSON). Los polígonos (`geometry`) **nunca** se devuelven en estas rutas.

> **Ejemplos:** **[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]**.

---

## [GET] /api/municipios

**Descripción:** Catálogo de municipios de Tlaxcala, ordenado por `nombreMunicipio`, sin `geometry` ni `localidades`.
**Archivo de ruta:** `routes/municipios.js:8`
**Controlador:** `controllers/municipios.js` — `obtenerMunicipios` (línea 7)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `obtenerMunicipios`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/municipios
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Municipios obtenidos correctamente",
  "data": {
    "municipios": [
      {
        "_id": "6650c3f0c2a3b4c5d6e7f8a9",
        "claveEntidad": 29,
        "nombreEntidad": "Tlaxcala",
        "claveMunicipio": 9,
        "nombreMunicipio": "Apizaco",
        "codigoPostal": "90300"
      }
    ]
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener los municipios" | `controllers/municipios.js:21` |

### Notas para el Frontend
- Lista completa (60 elementos), no paginada.
- `claveMunicipio` es número en la base, no string con ceros.
- Mismo controlador que `GET /api/ubicacion` (duplicado de ruta).

---

## [GET] /api/municipios/:claveMunicipio/localidades

**Descripción:** Localidades (catálogo INEGI) de un municipio, identificado por su clave numérica.
**Archivo de ruta:** `routes/municipios.js:13`
**Controlador:** `controllers/municipios.js` — `obtenerLocalidadesPorMunicipio` (línea 26)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `check('claveMunicipio').isInt({min:1, max:60})` → `validarCampos` → `obtenerLocalidadesPorMunicipio`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| params | `claveMunicipio` | entero (string) | Sí | `isInt({min:1, max:60})`; `"La clave del municipio debe ser un numero entre 1 y 60"` → 422. Acepta ceros a la izquierda (`"034"`) (verificado con `validator`) |

### Ejemplo de request
```http
GET /api/municipios/9/localidades
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "msg": "Localidades obtenidas correctamente",
  "data": {
    "municipio": "Apizaco",
    "localidades": [
      {
        "clave": "0024",
        "nombre": "Apizaco",
        "altitud": 2370,
        "location": { "type": "Point", "coordinates": [-98.147, 19.417] }
      }
    ]
  }
}
```

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La clave del municipio debe ser un numero entre 1 y 60" | `routes/municipios.js:15` + `middlewares/validar-campos.js:28` |
| 404 | `NOT_FOUND` | Resource Not Found | "Municipio no encontrado" | `controllers/municipios.js:37` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener las localidades" | `controllers/municipios.js:49` |

### Notas para el Frontend
- El parámetro es la **clave numérica** del municipio (1–60), no el `_id`.
- Las claves de localidad (`clave`) son de 4 dígitos (`"0024"`) y solo son únicas dentro del municipio.
- La lista no está paginada. Cada localidad incluye `location` (GeoJSON `[lng, lat]`).

---

## [POST] /api/ubicacion/reverse

**Descripción:** Geolocalización inversa. Dado un punto (lat/lng), devuelve el municipio que lo contiene (intersección exacta o, como respaldo, cercanía de 100 m) y la localidad más cercana dentro de ese municipio (haversine en JS).
**Archivo de ruta:** `routes/ubicacion.js:10`
**Controlador:** `controllers/ubicacion.js` — `obtenerMunicipioPorCoords` (línea 41)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `check('lat').isFloat().notEmpty()` → `check('lng').isFloat().notEmpty()` → `validarCampos` → `obtenerMunicipioPorCoords`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
| Ubicación | Campo | Tipo | Requerido | Validación exacta |
|---|---|---|---|---|
| body | `lat` | number (o string numérico) | Sí | `isFloat()` + `notEmpty()`; `"La latitud es obligatoria y debe ser un número"` → 422 |
| body | `lng` | number (o string numérico) | Sí | `isFloat()` + `notEmpty()`; `"La longitud es obligatoria y debe ser un número"` → 422 |

**Sin validación de rango** (no se comprueba que lat esté entre -90 y 90, etc.). Coordenadas fuera de México devuelven 404.

### Ejemplo de request
```http
POST /api/ubicacion/reverse
Content-Type: application/json
Cookie: accessToken=…

{ "lat": 19.417, "lng": -98.147 }
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200`
```json
{
  "success": true,
  "data": {
    "municipio": {
      "_id": "6650c3f0c2a3b4c5d6e7f8a9",
      "claveEntidad": 29,
      "nombreEntidad": "Tlaxcala",
      "claveMunicipio": 9,
      "nombreMunicipio": "Apizaco",
      "codigoPostal": "90300"
    },
    "localidad_cercana": { "clave": "0024", "nombre": "Apizaco", "distancia_metros": 120 },
    "metodo": "database_geo_intersect",
    "precision": "exacta"
  }
}
```
Si la intersección falla y el respaldo de cercanía sí encuentra municipio: `"metodo": "database_geo_near_fallback"`, `"precision": "aproximada (radio 100m)"`. `localidad_cercana` puede ser `null`.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 422 | `VALIDATION_FAILED` | Validation Failed | "La latitud es obligatoria y debe ser un número" / "La longitud es obligatoria y debe ser un número" | `routes/ubicacion.js:14-15` |
| 404 | `NOT_FOUND` | Resource Not Found | "Ubicación fuera de la zona de cobertura (Tlaxcala)" | `controllers/ubicacion.js:84` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error interno al obtener la ubicación" (incluye coordenadas inválidas que rechaza MongoDB, derivado) | `controllers/ubicacion.js:103` |

### Notas para el Frontend
- Es un `POST` de solo lectura: no escribe en la base.
- `precision` distingue exacta (`"exacta"`) de aproximada (`"aproximada (radio 100m)"`). Muéstralo al usuario si lo necesitas.
- El `municipio` devuelto no incluye `geometry` ni `localidades`.
- **Privacidad:** el backend guarda posteos con coordenadas redondeadas a 3 decimales; este endpoint recibe coordenadas exactas, por lo que el cliente no debería persistirlas.

---

## [GET] /api/ubicacion

**Descripción:** Mismo catálogo que `GET /api/municipios`.
**Archivo de ruta:** `routes/ubicacion.js:20`
**Controlador:** `controllers/municipios.js` — `obtenerMunicipios` (línea 7)

### Autenticación y permisos
- Requiere token: **Sí**.
- Cadena de middlewares: `verificarTokenSesion` → `obtenerMunicipios`.
- Rate limiter: **ninguno**.

### Parámetros de entrada
Ninguno.

### Ejemplo de request
```http
GET /api/ubicacion
Cookie: accessToken=…
```
[EJEMPLO CONSTRUIDO A PARTIR DEL ESQUEMA — NO VERIFICADO EN EJECUCIÓN]

### Ejemplo de response — éxito
- Código de estado: `200` — misma forma que `GET /api/municipios`.

### Códigos de error posibles
| Status | code | title | detail | Dónde se lanza |
|---|---|---|---|---|
| 401 | `UNAUTHORIZED` | Authentication Required | "No hay token en la petición" / "Token no válido" | `middlewares/validar-jwt-cookies-sesion.js:14,45` |
| 500 | `INTERNAL_ERROR` | Internal Server Error | "Error al obtener los municipios" | `controllers/municipios.js:21` |

### Notas para el Frontend
- Ruta duplicada con `/api/municipios`. Usa una sola en el cliente.
