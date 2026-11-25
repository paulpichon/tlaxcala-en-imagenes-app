---
title: "Plan: rediseño del sistema de notificaciones (seguimiento del backend)"
type: plan
status: working
created: "2026-11-18"
related: "Backend: engineering/working/implementation-plans/2026-11-18-plan-sistema-notificaciones.md"
branch: "Fix-Notificaciones"
---

# Plan: rediseño del sistema de notificaciones (seguimiento del backend)

Espejo del plan del backend: `login-autenticacion/engineering/working/implementation-plans/2026-11-18-plan-sistema-notificaciones.md`.
Se actualiza al terminar cada fase del backend. Creado: 2026-11-18. Última actualización: 2026-11-24.

## Estado de las fases

| Fase | Qué hace el backend | Estado | Impacto en el frontend |
|---|---|---|---|
| 0 | Corrige bugs críticos: el cron borraba las suscripciones push cada domingo; el filtro borraba suscripciones válidas; `subscribe` idempotente | **Hecha y desplegada (2026-11-18)** | Ninguno obligatorio (ver abajo). Los usuarios dejarán de perder el push. |
| 1 | Servicio central `notificar()` (BD + push + correo) | **Hecha y desplegada (2026-11-19).** Los tres productores (seguir, comentar, moderación) ya lo usan. Deuda en backend: tests de integración con BD | Ninguno. Payload de push estandarizado (`title`, `body`, `icon`, `badge`, `tag`, `url`, `data.tipo`); el service worker debe usar `tag` y `data.tipo`. |
| 2 | Seguir envía correo; comentar crea notificación en `/notificaciones`; moderación envía push | **Hecha y desplegada (2026-11-19); seguir, comentar y moderación probados en producción** | Renderizar el tipo `comentario` en `/notificaciones`. |
| 3 | Likes: notificación agrupada por posteo + push con `tag` (sin correo) | **Hecha y desplegada (2026-11-24; commits del backend `869f664` y `2aa097b`); pruebas en producción superadas** | Renderizar `like`, interruptor de push y chip de filtro (ver «Fase 3: contrato»). Frontend implementado (`8f87b00`) y probado con el backend desplegado. |
| 4 | Preferencias por tipo y canal; límite de correos | **Hecha y desplegada (2026-11-23); pruebas en producción superadas** | Pantalla de preferencias en `/configuracion/notificaciones` (ver «Fase 4: contrato»). Frontend implementado y probado con el backend desplegado. |
| 5 | Marcar todas leídas, borrar todas, filtro por tipo, limpieza de viejas | **Hecha y desplegada (2026-11-20); pruebas manuales en producción superadas** | Botones y filtro en `/notificaciones` (ver «Fase 5: contrato»). Frontend implementado y probado con el backend desplegado. |
| 6 | Tipos nuevos: `reporte_resuelto`, `reporte_descartado`, `nueva_publicacion`, `sistema` | Pendiente | Renderizar los tipos nuevos; los de `sistema` no tienen emisor. |
| 7 | `GET /api/notificaciones/estado`, dispositivos, `subscribe` idempotente | **Hecha y desplegada (2026-11-19).** Frontend: activación en iOS probada en iPhone; `/estado`, reconciliación y lista de dispositivos implementados (2026-11-20, probado en producción) | Flujo de activación y arreglo de iOS (ver «Estado del frontend en la Fase 7» y «Fase 7: contrato»). |
| 8 | Documentación, Postman, `SPECS-FRONTEND-NOTIFICACIONES.md` | Pendiente | Contrato final. |

## Tipos de notificación (contrato actual y previsto)

| Tipo | Hoy en `/notificaciones` | Previsto |
|---|---|---|
| `follow` | Sí | Sin cambio |
| `comentario` | Sí (render y navegación; probado en producción) | Hecho (Fase 2) |
| `like` | Sí (agrupado por posteo, corazón, navegación al posteo y chip «Me gusta»; probado en producción) | Hecho (Fase 3) |
| `posteo_eliminado_moderacion` | Sí (sin emisor) | Sin cambio; se añade push |
| `reporte_resuelto` / `reporte_descartado` | No | Fase 6 |
| `nueva_publicacion` | No | Fase 6 |
| `sistema` | No | Fase 6 |

## Tareas del frontend (se detallan por fase al completarse)

### Activación en iOS (Fase 7; se puede avanzar ya)
1. Web Push en iOS solo funciona con la **PWA instalada** (iOS 16.4 o superior). En una pestaña de Safari `PushManager` no existe.
2. Llamar `Notification.requestPermission()` **directamente dentro del handler de un click**. Si va tras `await`s largos o en un `useEffect`, iOS lo ignora.
3. Si el permiso está en `denied`, no se puede volver a pedir: mostrar cómo habilitarlo en Ajustes > Notificaciones > TlaxApp.
4. Convertir bien la clave VAPID de base64url a `Uint8Array` para `applicationServerKey`.
5. Obtener la clave VAPID **antes** del click; dentro del click: `requestPermission` → `pushManager.subscribe` → `POST /api/notificaciones/subscribe`.
6. Si `POST /subscribe` falla, llamar `subscription.unsubscribe()`. Al abrir la pantalla, reconciliar `getSubscription()` con `GET /estado` (cuando exista).
7. Estados de UI: `no_soportado` → `instalar_pwa` → `permiso_pendiente` → `bloqueado` → `activo`.
8. El service worker debe llamar `showNotification` en **cada** push (iOS revoca la suscripción si recibe pushes silenciosos) y abrir `data.url` en `notificationclick`.

## Pendiente: el push sigue llegando tras cerrar sesión o cambiar de cuenta (detectado 2026-11-24)

**Estado: implementado en backend (commit `904f67c`) y frontend el 2026-11-24, sin desplegar; falta la verificación en producción (tarea 2).** Al probar la Fase 3 (like a un posteo «Solo perfil»), el click en el push pareció cerrar la sesión. El click no cierra sesiones: se ve la pantalla «Inicia sesión para ver este posteo» porque el navegador que abre la notificación no tiene sesión. Causa probable (falta confirmar con el dispositivo de la prueba):

- `logout` (`src/context/AuthContext.tsx`) no da de baja la suscripción push del dispositivo: sigue recibiendo los avisos de la cuenta que cerró sesión.
- En el backend, el mismo dispositivo puede quedar suscrito en dos cuentas (A y B en el mismo navegador).

Tareas del frontend:
1. En `logout`, **antes** de `POST /api/auth/logout` (mientras la sesión sigue válida): `getSubscription()` → `POST /api/notificaciones/unsubscribe` con el `endpoint` → `subscription.unsubscribe()`. *Best-effort*: un fallo no debe impedir el logout. Reutilizar la lógica de desactivar de `usePushNotifications`.
   **Hecho (2026-11-24):** `darDeBajaPushDelDispositivo(fetch)` en `src/lib/dispositivos.ts` (usa `getRegistration`, no `ready`, para no colgarse sin service worker; tope de 3 s; nunca lanza). `logout` la espera antes de `POST /api/auth/logout`; `cerrarSesionPorMotivo` también la llama (la sesión ya no vale, así que solo da de baja el navegador y el backend borra el endpoint con el 404/410 del siguiente envío). Al volver a entrar, el usuario debe reactivar el push en `/configuracion/notificaciones`.
   **Backend (`904f67c`):** `subscribe` quita el endpoint de las demás cuentas y apaga `notificaciones_activadas` en las que se quedan sin dispositivos. Sin cambios de contrato.
2. Verificar en producción junto con el arreglo del backend (en `subscribe`, quitar el endpoint de las demás cuentas): cerrar sesión con A → sus avisos ya no llegan a ese dispositivo; entrar con B y activar push → solo llegan los de B.

## Decisiones abiertas (se resuelven al llegar a la fase)

| Decisión | Fase |
|---|---|
| ~~Retención de notificaciones~~ Decidido: leídas 90 días, no leídas 180, eliminadas 30 | 5 |
| ~~Enlace de baja de un clic en correos~~ Decidido: basta el enlace a `/configuracion/notificaciones` | 4 |
| `nueva_publicacion` activada o no por defecto | 6 |
| Correo al reportante por reporte resuelto | 6 |

Decidido: likes = `/notificaciones` + push agrupado, sin correo.

## Fase 0: qué cambió para el frontend

- **Sin cambios de contrato** en `POST /api/notificaciones/subscribe` ni en `/unsubscribe` (misma respuesta `200`).
- `subscribe` ahora es **idempotente**: llamarlo de nuevo con el mismo `endpoint` actualiza la suscripción y reactiva `notificaciones_activadas`, sin duplicar. Es seguro llamarlo al abrir la app para "refrescar" la suscripción.
- Nuevas validaciones (`400`): `endpoint` debe ser una URL `https` de hasta 2048 caracteres, y `keys.p256dh` y `keys.auth` deben ser texto no vacío. Los endpoints reales de FCM, APNs y Mozilla cumplen esto.
- Se conservan máximo 10 dispositivos por usuario; al exceder se descartan los más antiguos.
- **Consecuencia visible:** las suscripciones dejan de perderse cada domingo. Quien ya perdió la suya debe volver a activar las notificaciones. Si `notificaciones_activadas` llega en `false`, mostrar el botón de activar.

## Historial

- 2026-11-18: plan creado.
- 2026-11-18: Fase 0 implementada en el backend y desplegada.
- 2026-11-19: Fase 2 (y núcleo de la Fase 1) implementada en el backend (319/319 tests). Ver la sección «Fase 2» sobre el contrato.
- 2026-11-19: backend y frontend desplegados; seguir, comentar y moderación probados en producción (render del tipo `comentario`, correos y push al autor del posteo eliminado OK).

- 2026-11-19: Fase 1 marcada como completada en el backend (commit `7aa9ff5`); sin cambios de contrato para el frontend.

- 2026-11-19: los correos de notificación (seguir, comentar, eliminación por moderación) pasan a salir desde `notificaciones@tlaxapp.com` en lugar de `verificar@`. Sin impacto en el frontend; solo cambia el remitente que ven los usuarios. Probado en producción, funciona.

- 2026-11-19: verificado en el backend el punto del icono del push: el avatar del emisor sí se usa como `icon` (`secure_url` se guarda en BD y el push se arma en el backend, así que no importa que la API no lo envíe al frontend). Sin acción en el frontend. Si algún avatar no aparece en producción, el arreglo es del backend (transformar la URL de Cloudinary a 192×192 PNG); está descrito en «Nota: tamaño del icono del push» del plan del backend.

- 2026-11-19: Fase 7 implementada en el backend (pendiente de desplegar). Ver «Fase 7: contrato».

- 2026-11-19: backend y frontend de la Fase 7 desplegados. Probado en producción en un iPhone: se instala la PWA, se activan las notificaciones y funcionan. Fase 7 completada; queda como opcional consumir `/estado` y la lista de dispositivos.

- 2026-11-20: pantallas de arranque de iOS, `apple-touch-icon` con fondo blanco e iconos 192/512/maskable del manifest. Revisados por el usuario.

- 2026-11-20: Fase 5 implementada en el backend (pendiente de desplegar); tras su code review, `limite` tiene tope de 100 y `next`/`prev` conservan `tipo`.

- 2026-11-20 (previo): Fase 5 implementada en el backend (pendiente de desplegar). Ver «Fase 5: contrato para el frontend».

- 2026-11-20: frontend consume `/estado`, reconcilia con `endpointHash` y muestra la lista de dispositivos con cierre remoto.

- 2026-11-20: desplegado y probado en producción; la Fase 7 queda completa en backend y frontend. Siguiente: Fase 3 (likes agrupados), a la espera del backend.

- 2026-11-20: Fase 5 desplegada (backend y frontend) y probada manualmente en producción. Pendientes: Fases 3, 4, 6 y 8 (orden recomendado: 4, luego 3 y 6).

- 2026-11-23: Fase 4 implementada en el backend (commits `d807884` y `2c59424`, este último por su code review), pendiente de desplegar. Ver «Fase 4: contrato para el frontend». Siguiente en el frontend: interruptores de preferencias en `ConfiguracionNotificaciones`.

- 2026-11-23: frontend de la Fase 4 implementado (`e221723`), pendiente de probar con el backend desplegado. Además (`a508e66`): las pantallas de configuración pasan de `vh-100` a `min-vh-100` (el contenido se salía del borde) y el título de `/configuracion/notificaciones` queda fijo al hacer scroll.

- 2026-11-23: Fase 4 desplegada (backend y frontend, incluidos los arreglos de `a508e66`) y probada en producción: las preferencias y las pantallas de configuración funcionan como se espera. Pendientes: Fases 3, 6 y 8.

- 2026-11-24: Fase 3 implementada en el backend (pendiente de desplegar). Ver «Fase 3: contrato para el frontend». El frontend actual ya muestra los likes con el render genérico; faltan el interruptor de push, el chip de filtro y, opcionalmente, el icono y `contador`.

- 2026-11-24: frontend de la Fase 3 implementado (`8f87b00`). Corrige además que el clic en un `like` habría abierto el perfil de la última persona en lugar del posteo. Ver «Hecho en el frontend» de la Fase 3.

- 2026-11-24: Fase 3 desplegada (backend y frontend) y probada en producción: funciona correctamente. Pendientes: Fases 6 y 8.

## Fase 3: contrato para el frontend

- **Una sola notificación `like` por posteo** (por receptor), que se actualiza con cada persona nueva: `emisor` = la última persona, `contador` = personas distintas (campo nuevo en `GET /api/notificaciones`, solo en `like`; no baja al quitar un like), `notificacion_leida` vuelve a `false` y `createdAt` pasa a ser la fecha del último like, así que la notificación sube en la lista.
- **`mensaje` ya viene redactado** para el render actual (`<strong>nombre</strong> {mensaje}`): `contador` 1 → «le dio me gusta a tu publicación»; N → «y N−1 más dieron me gusta a tu publicación». No hace falta construir el texto en el frontend.
- **`referencia`** es el posteo (`tipoReferencia: 'Posteo'`): navegar a `/posteo/<referencia._id>` como en `comentario` (si `referencia` es `null`, no navegar).
- La misma persona dando like → unlike → like no cuenta dos veces ni vuelve a avisar. Si el usuario borra la notificación, el siguiente like abre una nueva.
- **Push**: `tag: like-<posteoId>` (reemplaza al anterior; el service worker ya pone `renotify`), `data: { tipo: 'like', posteoId, contador }`, `url: /posteo/<id>`. Como mucho un push por posteo cada 10 min; los likes de esa ventana solo se ven en `/notificaciones`. Sin correo.
- **Preferencias**: la clave `push.like` ya existe desde la Fase 4: añadir `like` a `TIPOS_PREFERENCIA` (solo columna Push; no hay `correo.like`).
- **Filtro**: `GET /api/notificaciones?tipo=like` ya es válido; añadir el chip.
- **Tipos**: añadir `contador?: number` a `Notificacion` en `src/types/types.ts`. Icono opcional para `like` (p. ej. corazón) en `NotificacionItem`.

### Hecho en el frontend (2026-11-24, commit `8f87b00`; probado en producción con el backend desplegado)

- **Navegación** (`Notificaciones.tsx`): el clic en un `like` abre `/posteo/<referencia._id>`, igual que `comentario`; si `referencia` es `null` solo la marca como leída. Antes caía en la rama genérica y habría abierto el perfil del emisor (la última persona que dio like).
- **Filtro**: chip «Me gusta» (`?tipo=like`) en `FILTROS`.
- **Preferencias** (`ConfiguracionNotificaciones`): fila «Me gusta en tus publicaciones» en `TIPOS_PREFERENCIA` con `soloPush`. La celda de Correo queda vacía (no existe `correo.like`) y el interruptor de Push envía `PUT { push: { like } }`.
- **Render** (`NotificacionItem`): avatar de la última persona con un corazón rojo en la esquina. El texto sigue siendo `<strong>nombre</strong> {mensaje}`; no se usa `contador`.
- **Tipos**: `Notificacion.contador?: number` en `types.ts`.
- Sin cambios en `public/sw.js`: ya aplica `tag` con `renotify`, que es lo que necesita `like-<posteoId>`.
- `pnpm build` sin errores.
- Orden de despliegue indiferente: sin el backend de la Fase 3 no llegan notificaciones `like`, el chip devuelve una lista vacía y `push.like` ya existe desde la Fase 4.
- **Probado en producción (2026-11-24), funciona correctamente.** Lo previsto para la prueba: varios likes al mismo posteo forman una sola notificación que sube en la lista y vuelve a no leída; el push reemplaza al anterior (como mucho uno cada 10 min); apagar «Me gusta» en Push corta el push pero no la notificación en `/notificaciones`.

## Fase 4: contrato para el frontend

- **`GET /api/notificaciones/preferencias`** (sesión): `data.preferencias = { push: { follow, comentario, like, nueva_publicacion, sistema }, correo: { follow, comentario, sistema } }`, todos booleanos y siempre completos (los usuarios sin configurar reciben los defaults: push todo `true`; correo `true`).
- **`PUT /api/notificaciones/preferencias`**: body parcial, p. ej. `{ "push": { "like": false }, "correo": { "follow": false } }`. Solo canales `push`/`correo`, claves de arriba (no existe `correo.like` ni `correo.nueva_publicacion`) y booleanos; cualquier otra cosa o un body vacío da `400`. Responde `data.preferencias` completo.
- **`GET /estado`** ahora incluye `preferencias` (mismo formato).
- Las preferencias solo afectan al **push y al correo**; `/notificaciones` siempre muestra todo. Los avisos de moderación no se pueden silenciar: no mostrar interruptor para ellos.
- Los correos de seguir y comentar ya enlazan a `/configuracion/notificaciones`; no hay enlace de baja de un clic.
- Code review (2026-11-23): el `PUT` con un canal heredado (`__proto__`, `constructor`) daba `500`; corregido, ahora da `400`. Sin otros cambios de contrato.
- Backend y frontend ya desplegados; el orden dejó de importar (antes del despliegue `GET /preferencias` daba `404` y la pantalla ocultaba la sección).

### Hecho en el frontend (2026-11-23, commit `e221723`; probado en producción con el backend desplegado)

- Hook `usePreferenciasNotificaciones` (`src/app/hooks/`): `GET /preferencias` al montar y `PUT` parcial por interruptor. El cambio es optimista y se revierte si falla. Solo un `PUT` en curso a la vez, porque cada respuesta trae las preferencias completas y dos en paralelo podrían llegar desordenadas. Un `404` en el `GET` oculta la sección (backend sin la Fase 4).
- Es independiente de `usePushNotifications`: las preferencias de correo valen aunque el navegador no admita push, y `/estado` se recarga tras cada acción de push, lo que podría pisar un cambio en curso. Por eso no se usa `/estado.preferencias`.
- `ConfiguracionNotificaciones`: tarjeta «Qué te avisamos» con columnas Push y Correo. Solo lista `follow` y `comentario`, los tipos que el backend ya produce; `like` (Fase 3), `nueva_publicacion` y `sistema` (Fase 6) se añaden a `TIPOS_PREFERENCIA` al implementarse. Moderación no tiene interruptor; un texto aclara que siempre se envía.
- Tipos `PreferenciasNotificaciones` y `CanalNotificacion` en `types.ts`; operaciones `cargar_preferencias` y `guardar_preferencias` en `apiClient.ts`.
- Probado en producción (2026-11-23): la tarjeta carga, cada interruptor guarda y funciona como se espera.

## Fase 5: contrato para el frontend

- **`PATCH /api/notificaciones/marcar-todas-leidas`** (sin body): `data: { actualizadas }`. Tras la respuesta, poner el contador de no leídas en 0.
- **`DELETE /api/notificaciones`** (sin body): soft delete de todas; `data: { eliminadas }`. Pedir confirmación antes (no es reversible desde la app).
- **`GET /api/notificaciones?tipo=<tipo>`**: filtro opcional (`follow`, `like`, `comentario`, `nueva_publicacion`, `posteo_eliminado_moderacion`). Un valor inválido da `422`. Combina con `page`/`limite`; `pagination.next`/`prev` conservan `tipo`. `limite` tiene tope de 100 (un valor mayor se recorta a 100).
- **`DELETE /api/notificaciones/eliminar-notificacion/:id`**: mismo contrato; ahora es soft delete y un id ya eliminado da `404` (tratarlo como éxito en la UI).
- **Retención:** el backend borra físicamente las leídas a los 90 días, las no leídas a los 180 y las eliminadas a los 30. Las notificaciones muy antiguas desaparecen de `/notificaciones` sin aviso.
- Sin cuenta de no leídas por tipo (opcional, no implementado).

### Hecho en el frontend (2026-11-20; probado en producción con el backend desplegado)

- `useNotifications` + `Notificaciones.tsx`: botones «Marcar todas como leídas» y «Eliminar todas» (confirmación inline), chips de filtro (Todas, Seguidores, Comentarios, Moderación) y `404` al eliminar una = éxito.
- El filtro reinicia la paginación, «Ver más» lo conserva y se descartan respuestas obsoletas. Las acciones masivas aplican a todas las notificaciones, no solo al filtro.
- El chip de `nueva_publicacion` se añade cuando se renderice (Fase 6). El de `like` («Me gusta») se añadió en la Fase 3.
- Backend y frontend ya desplegados; el orden dejó de importar.
- Probado en producción (2026-11-20): marcar todas, borrar todas, filtrar y paginar con filtro.

## Fase 7: contrato para el frontend

- **`GET /api/notificaciones/vapidPublicKey`** ya **no requiere sesión**: se puede pedir al cargar la pantalla, antes del click. Respuesta igual: `data.key`.
- **`GET /api/notificaciones/estado`** (con sesión): `data = { activadas: boolean, dispositivos: [{ id, userAgent, creadoAt, ultimoUso, endpointHash }] }`, del más reciente al más antiguo. `activadas` es `true` solo si hay al menos un dispositivo. No trae `endpoint` ni claves. **Desde la Fase 4 incluye también `preferencias`** (ver «Fase 4: contrato»).
- **Reconciliación**: calcular `SHA-256` hexadecimal (minúsculas) del `subscription.endpoint` del navegador, p. ej. con `crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))`, y compararlo con `dispositivos[].endpointHash`. Casos: hay suscripción local y está en BD → `activo`; hay local pero no en BD → volver a llamar `POST /subscribe` (es idempotente); en BD pero no local (otro dispositivo) → mostrarlo en la lista de dispositivos.
- **`POST /api/notificaciones/subscribe`**: la respuesta ahora incluye `data: { id }` (id del dispositivo). Sigue siendo idempotente; el resto del contrato no cambia.
- **`DELETE /api/notificaciones/dispositivos/:id`** (con sesión): cierra un dispositivo. `200` ok; `404` si no existe o no es del usuario; `422` si el `id` no es válido. Si era el último, `activadas` pasa a `false`.
- El resto de la guía de activación en iOS (sección «Activación en iOS») sigue vigente y es trabajo del frontend.

### Estado del frontend en la Fase 7 (revisado 2026-11-19)

**Implementado y commiteado en `af4a5c6` (`usePushNotifications.ts`, `ConfiguracionNotificaciones.tsx`, `layout.tsx`, `manifest.ts`); pendiente de despliegue y de prueba en un iPhone con la PWA instalada (requiere HTTPS). Quien ya tenía TlaxApp en la pantalla de inicio debe quitarla y volver a añadirla para que iOS lea el manifest:**
- `requestPermission` es la primera operación asíncrona del click; el registro del SW y la clave VAPID se precargan antes (puntos 1, 2 y 5 de la guía).
- Confirmación con `registro.showNotification` (best-effort) en lugar de `new Notification()`; el icono usa `/assets/icono-tlaxapp-beige.png`.
- `unsubscribe()` local si falla `POST /subscribe` (punto 6).
- Estados `cargando`, `no_soportado`, `instalar_pwa`, `permiso_pendiente`, `bloqueado` y `activo`, con instrucciones para instalar la PWA y para desbloquear el permiso; sale de `bloqueado` al volver de Ajustes (puntos 3 y 7).
- PWA: `manifest.ts` (`display: standalone`), `appleWebApp` e icono de Apple en `layout.tsx`.
- Reconciliación: si hay suscripción local, repite `POST /subscribe` (idempotente) al abrir la pantalla.

**Hecho (2026-11-20, commit `833d9b7`):** `GET /estado` con reconciliación por `endpointHash` (`hashEndpoint`, `src/lib/dispositivos.ts`) y lista de dispositivos con `DELETE /dispositivos/:id` en `ConfiguracionNotificaciones`. `/estado` solo se pide al montar y tras cada acción. Si falla, se mantiene el `POST /subscribe` a ciegas. Probado en producción tras el merge a la rama de despliegue: funciona correctamente.

**Hecho tras la prueba en iPhone (2026-11-20):** iOS mostraba solo blanco al abrir la PWA porque ignora el manifest para la pantalla de arranque. Se añadieron 22 imágenes de arranque (`public/assets/splash/`, lista en `src/lib/pwa.ts`), un `apple-touch-icon` de 180×180 con fondo blanco (el PNG transparente se veía sobre negro) y los iconos 192, 512 y maskable del manifest (`public/assets/pwa/`). Solo orientación vertical; un modelo nuevo de iPhone o iPad requiere una fila en `src/lib/pwa.ts` y su PNG.

**Dependencias:** el frontend actual funciona con el backend desplegado o sin desplegar la Fase 7 (el `data.id` extra de `subscribe` se ignora y `vapidPublicKey` sigue aceptando la petición con sesión). El orden de despliegue es indiferente.

## Fase 2: qué cambia para el frontend

- **`GET /api/notificaciones`** ahora devuelve notificaciones de tipo **`comentario`** (`mensaje: "comentó tu publicación"`, con `emisor` y `referencia` = posteo). El frontend debe renderizarlas y llevar al posteo.
- **Payload de push estándar**: `title`, `body`, `icon`, `badge`, `tag`, `url`, `data.tipo` (+ `data.posteoId`/`data.comentarioId` en comentarios). El service worker debe usar `tag` (reemplaza pushes del mismo origen) y abrir `url` en `notificationclick`.
- **Moderación**: el autor recibe ahora un push genérico (`data.tipo = posteo_eliminado_moderacion`, `url: /notificaciones`).
- **Correos**: seguir y comentar envían correo (máx. 1 de cada tipo cada 15 min por usuario) con enlace a `/configuracion/notificaciones`. Esa ruta debe existir en el frontend.
- Sin cambios en endpoints ni en códigos de respuesta.
- `referencia` (posteo) trae `_id`, `public_id`, `texto` e `imagen_perfil.public_id`, o `null` si el posteo ya no existe.

### Hecho en el frontend (2026-11-19)

- `public/sw.js` (commit `2ab094b`): usa `tag` (+ `renotify`), `badge` y `data.tipo`; muestra siempre la notificación aunque el payload venga vacío o inválido; solo abre `url` del mismo origen; reutiliza la ventana abierta en `notificationclick`.
- `/notificaciones`: el click en una notificación `comentario` abre `/posteo/<referencia._id>`; si `referencia` es `null`, solo la marca como leída. `Notificacion.referencia` tipa `_id`. El texto «comentó tu publicación» ya se renderiza con el nombre del emisor.
- Probado de extremo a extremo en producción tras desplegar la Fase 2 (ver Historial).
