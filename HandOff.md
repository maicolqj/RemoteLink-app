# HandOff — Sistema de alertas de pánico (EntryLink / RemoteLink)

> Traspaso de sesión. Cubre **tres repositorios**. Todo el código está
> **mergeado a `main`** y el backend **ya está desplegado**; no queda ningún PR
> abierto. Lo que bloquea las pruebas hoy es que **los push no se entregan**
> (ver abajo).
> Última actualización: 2026-08-06 (cierre de la segunda sesión).

| Repo | `main` | PRs mergeados hoy |
|---|---|---|
| Backend `…\BACKEND\phone-dialer-nestjs` | `b1639e2` | #138 `bd66195`, #139 `9dfe26b`, #141 `285e935`, #140 `b1639e2` |
| RemoteLink `…\react-native\remotelink` | `d9402ad` | #41 `d78cb42`, #42 `0714db9`, #43 `2649755`, #44 `5d039d4`, #45 `d9402ad` |
| EntryLink `…\react-native\PhoneDialerApp` | `62786ce` | #18 `62786ce` |

#41 se mergeó con **merge commit** a propósito, no con squash: #42 estaba apilado
sobre él y un squash le habría metido los mismos cambios por segunda vez al
re-apuntarlo a `main`.

## DÓNDE SE RETOMA: EL BACKEND YA ESTÁ DESPLEGADO, LOS PUSH NO LLEGAN

**Desplegado el 2026-08-06 por la tarde.** El registro de equipos funciona; la
entrega de notificaciones **no**. Ese es el único frente abierto.

### Lo que está probado

`push_subscriptions` tiene tres filas del equipo de prueba (Xiaomi `2201117TL`,
`app_version 1.0.0`) de las 19:36, 19:51 y 21:28, **con marca y modelo
poblados**. Eso demuestra dos cosas de una: producción corre el código del #138
—acepta los campos nuevos del input— y el registro del token desde la app cierra
bien. El problema está aguas abajo, en el envío.

### Hipótesis principal para mañana (sin confirmar)

`dispatchFCM` empieza con `if (!this.fcmEnabled || subs.length === 0) return;`
(`notifications.service.ts:1798`), y `fcmEnabled` solo se enciende si el entorno
trae las tres variables (`:170`): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`
y `FIREBASE_PRIVATE_KEY`. Si falta una, el servicio **no falla**: escribe un warn
al arrancar y desde ahí descarta cada notificación en silencio. Encaja con el
cuadro completo — tokens registrados, cero entregas, cero errores.

**Primer comando de mañana**, que confirma o tumba la hipótesis:

```
docker logs <contenedor> 2>&1 | grep -iE "Firebase Admin SDK inicializado|Firebase no configurado"
```

- `Firebase no configurado — FCM deshabilitado` → es esto. Faltan variables.
- `Firebase Admin SDK inicializado` → FCM vive; entonces mirar el despacho:
  dispara una notificación y busca `[FCM] Lote enviado`, que reporta exitosos y
  fallidos por lote.

Para revisar el entorno **sin exponer valores**:

```
docker exec <contenedor> printenv | grep -o '^FIREBASE_[A-Z_]*'
```

Dos trampas conocidas si las tres existen:

- `FIREBASE_PRIVATE_KEY` debe ir en **una sola línea con `\n` literales**: el
  código hace `privateKey.replace(/\\n/g, '\n')`. Pegada con saltos reales,
  `cert()` falla y quedas igual de mudo.
- `FIREBASE_PROJECT_ID` debe ser **`entrylink-2dffb`**, el mismo del
  `google-services.json` del APK (verificado: RemoteLink y EntryLink son dos
  clientes del mismo proyecto, sender `292050009865`, y el paquete
  `com.alternaqj.remotelink` sí está registrado). Otro proyecto da
  `messaging/mismatched-credential`.

### Lo que queda por verificar del despliegue

1. Las **tres migraciones** (`CreatePanicAlerts`, `CreatePanicEscalation`,
   `AddDevicePushHealth`).
2. `API_PUBLIC_URL` = `https://api.alternaqj.com`. Sin ella el pánico sale sin
   `ackUrl` y el escalamiento trata toda alerta como no entregada. El arranque lo
   avisa con un warn propio (`:157`).
3. Que el manifiesto haya crecido: `Seeded N trusted queries` / `merged X new`.
   Sin la entrada del #141 el pánico llega **mudo** (no resuelve quién lo disparó).

**No hace falta reconstruir el APK** para nada de esto: reintenta el registro del
token en cada arranque.

---

## 1. Objetivo Actual

Entregar una alerta de pánico de forma **verificable** en Android, en los tres
estados soportados (app abierta, en background, cerrada por swipe), y **saber
cuándo no se entregó** para reaccionar desde el servidor.

Dos niveles:

- **Nivel A** — notificaciones normales (visitas, pagos, paquetería).
- **Nivel B** — pánico con comportamiento de llamada entrante: pantalla completa
  sobre el lock screen, sirena en stream de alarma, no descartable.

**Decisiones de alcance ya tomadas** (no reabrir sin motivo nuevo):

| # | Decisión |
|---|---|
| C1 | Ruta crítica nativa **híbrida**: receiver propio en paralelo, el flujo JS de RNFB intacto |
| C2 | Foreground service **solo en EntryLink**; RemoteLink sigue in-process |
| C3 | Escalamiento con **adaptadores de canal**; se arranca con los canales existentes |
| C4 | `PanicAlert` como **entidad propia**; `notifications` la referencia |
| C5 | **Nivel B solo en EntryLink**. RemoteLink conserva su modal de React |

**Fuera de alcance por diseño:** el estado `FLAG_STOPPED` (app force-stopped)
bloquea todos los broadcasts a nivel de kernel. No se resuelve en el cliente; se
cubre con el escalamiento del backend.

---

## 2. Estado del Proyecto

### ✅ Implementado y compilando

**Backend** (`tsc` y `nest build` limpios)

- `PanicAlert` como agregado + `notifications.panic_alert_id`. Sustituye la
  correlación por ventana de ±30s, que confundía dos pánicos simultáneos.
- `PanicAlertDelivery` (auditoría por destino y canal) y
  `PanicEscalationSettings` (tiempos por complejo).
- `DevicePushHealth` + metadata de equipo en `push_subscriptions`.
- Escalamiento BullMQ 15/45/90s con cancelación por estado y `jobId` determinista.
  Canales operativos: re-push FCM, socket, email. Declarados-no-disponibles:
  WhatsApp, SMS, voz.
- `POST /api/v1/panic/:id/delivered` (204, HMAC en el payload FCM).
- `POST /api/v1/devices/health-check/:healthId/ack` + mutations
  `runPushHealthCheck` / `reportDevicePermissions` + query `devicePushHealth`.
- Cron lunes 3am (envío) y 4am (cierre de ronda), acotado por rol a vigilancia.
- Fan-out inmediato incluye supervisor y administración, con deduplicación.

**EntryLink**

- `PanicAlarmEngine` (singleton de proceso), `PanicAlertReceiver` (prioridad 999),
  `PanicSirenService` (FGS `specialUse` con degradación), `PanicAlertActivity`
  (XML nativo sobre lock screen), `PanicAckClient` (OkHttp), `PanicAutoStop`
  (3 min con fundido), `BootReceiver`, notificación `CallStyle`.
- Canal `panic_v1` nativo con `USAGE_ALARM` + `bypassDnd`.
- Wizard de permisos de 7 pasos adaptativos + banner de equipo sin alertas.

**RemoteLink**

- Canal `panic_v1` nativo, notificación `ongoing` + cancelación al reconocer.
- Guard de `canUseFullScreenIntent` antes de publicar.
- 4 filas de estado de permisos en Ajustes.
- ACK de entrega (background y foreground) + envío de marca/modelo/SO/versión.
- **Auto-apagado nativo a los 3 min** (mismo plazo que EntryLink) y **barrido de
  alerta huérfana** cuando el servidor confirma que ya no hay nada activo.
- `SaveMobileTokenInput` con la metadata de equipo, ya en el espejo del backend
  → tipos generados y mutación tipada.
- **Registro de token tolerante a versiones** (#45): si el servidor rechaza la
  metadata, se reintenta con los tres campos de siempre. Ver §4.18.
- **Ofrecimiento de biometría** una vez por instalación (#44). Se dispara en una
  sesión **restaurada**, no tras el login: el `AlertProvider` muestra una alerta
  a la vez y el primer arranque ya gasta las suyas en la clave de acceso y el
  aviso de autostart. Se salta si hay pánico activo.

**Overrides de schema — eliminados el 2026-08-06** (paso 2 del plan viejo, hecho)

Ambos `schema.overrides.gql` quedaron **sin bloques activos** y ambos siguen
cableados en `codegen.ts`: un overrides con solo comentarios no le molesta a
codegen (verificado en las dos apps) y así el mecanismo espera a la próxima rama.

- RemoteLink: se fue el `extend input SaveMobileTokenInput`. Los tipos generados
  solo perdieron las descripciones —el espejo del backend no publica los
  `"""…"""` de los campos— y `persisted-documents.json` no se movió.
- EntryLink: se fueron las cinco definiciones de salud de equipos. Salida
  generada **byte a byte idéntica**.
- `tsc --noEmit`: RemoteLink limpio. EntryLink arrastra **23 errores previos**
  (parking, `useVoiceDictation`, `audit.store`, `package.store`), ninguno de
  schema ni de pánico — `src/gql/` no cambió, así que no salen de aquí. Sin
  tocar: son de otro frente.

### ⚠️ A mitad de camino

- **Los GIFs del wizard.** El registro `presentation/assets/onboarding/index.ts`
  existe y está **vacío**. Sin assets el wizard muestra solo texto. Es el
  pendiente con más impacto real sobre la tasa de entrega (ver §4.19).
- **`ackUrl` depende de `API_PUBLIC_URL`**, definida en local pero **pendiente de
  verificar en el despliegue**. Sin ella ningún equipo confirma entrega y el
  escalamiento trata toda alerta como no entregada.
- ~~**Manifest de documentos persistidos de RemoteLink desincronizado.**~~
  **Falsa alarma en cuanto a `SaveMobileToken`, verificado.** Lo que cambió fue el
  *input type*, no el texto de la operación, y el hash se calcula sobre el
  documento — `yarn codegen` deja `persisted-documents.json` byte a byte igual.
  **Pero sí faltaba otra entrada**, por otra razón: ver el punto siguiente.
- ~~**`GetResidentByUserId` sin registrar en el manifiesto del backend.**~~
  **Arreglado el 2026-08-06 (#141).** El hash llevaba semanas en la copia de
  trabajo local —escrito por un sync contra el backend de desarrollo— y **nunca
  se commiteó**, así que ningún despliegue lo llevaba. Sin él el pánico habría
  sonado pero la consulta de quién lo disparó se rechazaba con
  `PERSISTED_QUERY_NOT_ALLOWED`: alerta sin decir de dónde viene ni a qué unidad
  acudir. Ver §4.20 para por qué no se detecta en desarrollo.

### ✅ Verificado en producción (2026-08-06)

- **El despliegue subió y el registro de equipos funciona.** Tres filas en
  `push_subscriptions` del Xiaomi de prueba **con marca, modelo y versión**. Que
  esas columnas estén pobladas prueba que producción corre el #138: un servidor
  viejo habría rechazado la mutación entera.
- **Los push no se entregan.** Frente abierto; hipótesis y comandos en el
  encabezado.
- **Tokens huérfanos:** el mismo equipo acumuló tres suscripciones activas.
  `saveMobileToken` busca por `(userId, platform, deviceToken)`, así que cada
  token nuevo crea fila y las viejas quedan `isActive: true` con tokens muertos.
  **No bloquean nada** —`dispatchFCM` envía token por token y desactiva los
  inválidos con la respuesta de FCM— pero se limpiarán recién cuando el envío
  funcione, porque hoy nunca se llega a preguntarle a FCM.

### ✅ Verificado en ejecución (2026-08-05)

- **El backend arranca.** Grafo de inyección correcto; `PanicController` y
  `DeviceHealthController` mapeados; sin warning de `API_PUBLIC_URL`.
- **RemoteLink recibe el pánico con la app cerrada por swipe**, contra el backend
  local. Secuencia capturada en logcat:

  ```
  22:36:51.585  startAlarmService(...)                  ← handler headless de FCM
  22:36:52.530  [PanicAck] 204 ← /api/v1/panic/<id>/delivered
  22:36:57.986  Running "remotelink"                    ← la notificación abre la app
  22:37:03.330  [PanicSound] calling start()            ← el modal adopta la alarma
  22:37:04.729  panic:alert:acknowledged → stop()
  ```

- **El ACK de entrega funciona** (204). Recuerda que eso escribe la fila de
  auditoría; **no** mueve `panic_alerts.status`, que solo cambia con un responder.

### ❌ Sin verificar todavía

**EntryLink no se ha instalado en hardware**; sus criterios del §8 siguen en cero.

De RemoteLink falta probar: el auto-apagado a los 3 min, el barrido de alerta
huérfana, el toggle de opt-out y toda la Fase 4 (escalamiento).

### 🔒 Bloqueado por terceros

| Ítem | Bloqueo |
|---|---|
| SMS y voz | Sin proveedor contratado. Adaptadores listos, declaran indisponibilidad |
| WhatsApp | Falta plantilla de pánico aprobada por Meta; WABA en revisión |
| iOS Critical Alerts | Entitlement de Apple + falta `GoogleService-Info.plist` |
| Declaraciones Play | Trámite no iniciado |

---

## 3. Cambios en Archivos

### Backend — `phone-dialer-nestjs`

**Creados**

```
src/core/database/migrations/1781003300000-CreatePanicAlerts.ts       agregado + enlace
src/core/database/migrations/1781003400000-CreatePanicEscalation.ts   settings + auditoría
src/core/database/migrations/1781003500000-AddDevicePushHealth.ts     salud + metadata equipo
src/modules/notifications/entities/panic-alert.entity.ts
src/modules/notifications/entities/panic-alert-delivery.entity.ts
src/modules/notifications/entities/panic-escalation-settings.entity.ts
src/modules/notifications/entities/device-push-health.entity.ts
src/modules/notifications/enums/panic-alert-{type,status}.enum.ts
src/modules/notifications/enums/panic-delivery-channel.enum.ts
src/modules/notifications/channels/panic-channel.interface.ts         contrato: nunca lanza
src/modules/notifications/channels/{socket,email,fcm-repush}-*.ts     canales operativos
src/modules/notifications/channels/unavailable-panic.channels.ts      whatsapp/sms/voz
src/modules/notifications/queues/panic-escalation.{processor,queue.constants}.ts
src/modules/notifications/services/panic-ack-token.service.ts         HMAC (alerta, exp)
src/modules/notifications/services/device-health.service.ts
src/modules/notifications/controllers/{panic,device-health}.controller.ts
src/modules/notifications/resolvers/device-health.resolver.ts
src/modules/notifications/cron/device-health.cron.ts
src/modules/notifications/dto/inputs/{panic-delivered,health-check-ack}.input.ts
src/modules/notifications/dto/responses/device-push-health.response.ts
src/mail/templates/panic-alert.hbs
```

**Modificados**

- `services/notifications.service.ts` — `openPanicAlert`, plumbing de
  `panicAlertId`, `ackToken`/`ackUrl`/`ttl`/`directBootOk` en el payload, ACK
  restringido a responders, `resolvePanicAlert`, supervisor en fan-out.
- `entities/notification.entity.ts` — columna `panicAlertId`.
- `entities/push-subscription.entity.ts` + `dto/inputs/save-mobile-token.input.ts`
  — metadata de equipo.
- `mail/{mail.service,mail.processor,constants/mail.constants}.ts` — job de
  correo de pánico.
- `notifications.module.ts` — cola, canales, controllers, resolvers, cron.
- `residents/{resolvers/residents.resolver,services/residents.service}.ts` —
  query `residentByUserId`: el push solo lleva el id de quien disparó, y sin esto
  la app no puede decir a qué unidad acudir. Acotada al complejo de quien
  pregunta y devuelve null si ese usuario no es residente (guarda o
  administración disparando).
- `core/infrastructure/bull-board/bull-board.module.ts` — registrar la cola de
  escalamiento en el panel.

### EntryLink — `PhoneDialerApp`

**Creados**

```
android/.../panic/PanicAlarmEngine.kt        motor extraído (sin React context)
android/.../panic/PanicAlertReceiver.kt      c2dm prioridad 999
android/.../panic/PanicSirenService.kt       FGS specialUse, degrada si lo rechazan
android/.../panic/PanicNotifications.kt      canal + CallStyle + guard de FSI
android/.../panic/PanicAlertActivity.kt      XML nativo sobre lock screen
android/.../panic/PanicAckClient.kt          OkHttp
android/.../panic/PanicAutoStop.kt           timeout 3 min con fundido
android/.../panic/PanicPrefs.kt              espejo de opt-out y token FCM
android/.../panic/PanicSilenceReceiver.kt    botón "rechazar" de CallStyle
android/.../panic/BootReceiver.kt
android/app/src/main/res/layout/activity_panic_alert.xml
src/presentation/screens/generals/PermissionsWizardScreen.tsx
src/presentation/utils/onboardingSteps.ts
src/presentation/components/PushHealthBanner.tsx
src/presentation/assets/onboarding/index.ts  registro de GIFs (VACÍO)
src/infraestructure/services/pushHealthCheck.ts
docs/ENTREGA-DE-ALERTAS.md                   análisis §6.4
```

**Modificados:** `PanicSoundModule.kt` (delega en el motor + lectores de
permisos), `MainApplication.kt`, `AndroidManifest.xml`, `styles.xml`,
`PushNotificationService.ts`, `NotificationProvider.tsx`, `AppNavigator.tsx`,
`NavigationTipes.tsx`, `CustomDrawerContent.tsx`, `graphql/{mutations,queries}.ts`.

### RemoteLink

**Creados:** `android/.../PanicChannels.kt` (canal nativo),
`src/infraestructure/services/panicAck.ts`.

**Modificados:** `PanicSoundModule.kt` (+8 métodos de permisos y equipo,
+auto-apagado), `MainApplication.kt`, `AndroidManifest.xml`, `NotifeeService.ts`
(+`clearStalePanicAlert`), `NotificationService.ts`, `index.js`,
`PanicAlertModal.tsx`, `SettingsScreen.tsx`, `RootNavigator.tsx`,
`SocketProvider.tsx`, `shared/modules/PanicSoundModule.ts`,
`schema.overrides.gql`.

---

## 4. Intentos Fallidos y Lecciones Aprendidas

### Bloqueantes descubiertos al implementar

**1. No se puede extender `ReactNativeFirebaseMessagingService`.**
Su `onMessageReceived` es un stub vacío (`// noop - handled in receiver`); el
flujo real vive en `ReactNativeFirebaseMessagingReceiver`, un `BroadcastReceiver`
sobre `c2dm.intent.RECEIVE`. Llamar a `super` **no delega nada** y habría
descartado el flujo JS en silencio.
→ **Solución:** receiver propio en paralelo con `android:priority="999"`, sin
abortar el broadcast. Verificado en el manifiesto fusionado: los tres receivers
coexisten.

**2. Notifee no puede fijar `AudioAttributes.USAGE_ALARM` en un canal.**
`soundURI` es de solo lectura en su API. Sin `USAGE_ALARM` el sonido viaja por el
stream de notificación y **enmudece con el volumen de medios en 0**.
→ Canal creado en Kotlin. Los canales son **inmutables**: quien lo cree primero
gana, así que hubo que sacarlo de JS, no solo duplicarlo.

**3. Notifee no expone `canUseFullScreenIntent()`.**
`AndroidNotificationSettings` solo trae `alarm`.
→ Lectura en el módulo nativo.

**4. `FirebaseMessaging` no está en el classpath del módulo `app`.**
Agregar `firebase-messaging` arriesgaba choque de versión con el BOM que fija
react-native-firebase, y metía una llamada asíncrona en la ruta crítica.
→ El token FCM se espeja en `SharedPreferences` desde JS.

**5. Assets locales con `{ uri: 'ruta/variable' }` no funcionan en release.**
El empaquetador de RN resuelve `require` en tiempo de compilación; una ruta
armada con variables **no entra al bundle**. Habría funcionado en desarrollo y
fallado en producción.
→ Mapa explícito de `require`.

**6. Apollo Client v4: los hooks viven en `@apollo/client/react`.**
`import { useApolloClient } from '@apollo/client'` no compila.

**7. `errorPolicy: 'all'` de Apollo v4 no rechaza la promesa.**
El error llega en `error` (**singular**) junto a `data`. Sin revisarlo, el
registro del token FCM y `markAsRead` daban por buenas mutaciones rechazadas.

### Bugs introducidos en esta sesión y corregidos

**8. Notificación fantasma a los residentes.**
El cron de health-check barría **todos** los Android activos, pero
`push_subscriptions` es una tabla **compartida entre las dos apps** — no hay
columna que diga de qué app viene un token. RemoteLink habría pintado el push de
prueba (sin título ni cuerpo) como notificación en blanco los lunes a las 3am.
→ Cron acotado por rol + descarte defensivo en RemoteLink.
→ **Lección: cualquier envío masivo debe filtrar por rol o app.**

**9. El ACK de entrega desactivaba el escalamiento.**
`markPanicDelivered` promovía `PENDING → DELIVERED` sin mirar quién confirmaba.
Bastaba el teléfono de un **vecino** para que el nivel 1 —que existe para el caso
"nadie la recibió"— se saltara.
→ Solo responders mueven el estado; la auditoría registra a todos.

**10. `ongoing: true` sin nadie que cancele.**
No existía ninguna llamada a `cancelNotification` en RemoteLink: la notificación
habría quedado clavada para siempre.
→ `cancelPanicNotifications()` enganchado donde se apaga la alarma.

**10-bis. La sirena de RemoteLink tampoco tenía quien la apagara.** El único
camino que llamaba a `stop()` era el modal, y el modal solo aparece si alguien
abre la app. Dos escenarios quedaban con la alarma sonando **para siempre** (o
hasta que el sistema matara el proceso) y la notificación clavada: (a) nadie
atiende el teléfono; (b) el pánico se reconoce mientras el equipo está cerrado —
el evento de reconocimiento viaja **por socket**, que con la app cerrada no lo
recibe nadie, así que al abrir la app la alarma seguía sonando por una emergencia
ya terminada.
→ Auto-apagado nativo a los 3 min (`Handler` del lado Kotlin: un temporizador de
JS no sirve, el contexto headless de FCM se destruye al terminar el handler) que
además barre las notificaciones **del canal de pánico** —no por id, que lo arma
Notifee desde el payload—, y `clearStalePanicAlert()` en el socket cuando el
servidor confirma que no queda alerta activa.
→ **Lección: toda alarma necesita un apagador que no dependa de que el usuario
colabore.** Borrar la notificación no pierde el incidente: queda en el backend y
en el buzón de la app.

**10-ter. El modal apagaba la alarma que no había encendido.** Su efecto corría
al montar con `visible` en false —`panicData` todavía no llegaba— y caía en el
`else → stopAll()`, silenciando la sirena del handler headless y cancelando la
notificación. Medido en dispositivo: **3,5 s de silencio** en plena alerta
(`stop()` a los 11 s del arranque, `start()` 3,5 s después). Ahora un
`ownsAlarm` marca si este modal fue quien la encendió; si no lo fue, no la toca.
→ **Lección: en una ruta que arranca fuera de React, el componente no puede
asumir que el estado inicial significa "no hay nada sonando".**

### Restricciones de plataforma confirmadas

**11. Un `setFullScreenIntent` sin permiso NO crashea.**
Android 14+ lo **degrada en silencio** a heads-up, sin error en ningún log. El
diagnóstico inicial ("crashea") era incorrecto. El problema real es peor: como
RemoteLink/EntryLink no son apps de llamadas ni alarmas, es probable que en
instalaciones nuevas sobre Android 14+ **el permiso ya venga denegado** y la toma
del lock screen lleve tiempo sin funcionar.

**12. FGS y MIUI (lección heredada, sigue vigente).**
Un `PanicAlarmService` como foreground service fue construido, probado y
**borrado**: MIUI/HyperOS rechaza `startForeground` y Android mata la app con
`ForegroundServiceDidNotStartInTimeException`. Como el crash ocurría antes de
reconocer, el backend reenviaba la alerta → **loop de crash**.
→ El audio `USAGE_ALARM` suena desde background **sin servicio**. En EntryLink el
FGS existe solo para alargar la vida del proceso y **toda su ruta de error degrada
a "el motor sigue sonando, sin servicio"**.

**13. `CallStyle` obliga a un botón de rechazar.**
`forIncomingCall` lo exige y su etiqueta la pone el sistema (no se puede cambiar).
Se conectó a **silenciar** (no reconoce, no cierra, el escalamiento continúa).
→ **Diferencia consciente frente al criterio §8** "solo ATENDER la detiene".

### Convenciones del proyecto

**14. Enum nativo de Postgres + `synchronize: false`.**
Todo label nuevo de un enum TS necesita migración `ALTER TYPE ... ADD VALUE`. Ya
causó un bug de producción (notificaciones de finanzas fallando en silencio).

**16. El espejo del schema puede regresar sin avisar.** A mitad de esta sesión el
watcher `sync-schema.ps1` regeneró `schema.gql` de RemoteLink desde una rama del
backend anterior al ingreso con documento + clave, y borró
`LoginAccessCodeInput.identity`, `.label` y `NotificationType.NEW_DEVICE_LINKED`.
No rompe compilación —el tipado simplemente se encoge en silencio—, así que hay
que mirar `git diff -- schema.gql` antes de commitear. Se arregla restaurando el
espejo (`git checkout -- schema.gql`), **no** parcheando `schema.overrides.gql`.

Y ojo con lo que NO avisa: un `extend input` que repita campos **idénticos** a
los del espejo no hace fallar a codegen —la fusión los deduplica y la salida
generada es la misma—, así que un override que ya sobra puede quedarse ahí para
siempre sin que nada lo delate. Solo choca al redefinir un tipo completo
(`type X`), que es el caso de EntryLink.

**15. Reusar antes de exponer.** `resolveTargetUserIds` es privado, pero ya
existía el wrapper público `findUserIdsByRoleInternal` para exactamente ese uso.

**17. `*.keystore` no cubre `.keystore.old`.** Por ese hueco,
`android/app/my-upload-key.keystore.old` —la llave de subida a Google Play— quedó
versionada en RemoteLink y llegó al remoto dentro del PR #42.
→ Purgada el 2026-08-05: `filter-branch` sobre `c90d7ed..HEAD`, force-push,
borrado de `refs/original`, reflog expirado y `gc --prune=now`. El commit `5f22783`
ya no existe en el repositorio ni en el remoto; el archivo sigue en disco,
ignorado. El patrón pasó a `*.keystore*`, más `*.jks` y `*.p12`.
→ **Decidido el 2026-08-06: se rota.** Estuvo publicada varias horas y no hay
forma de saber quién la descargó. Pasos en §6.3. Mientras Google no apruebe el
restablecimiento, la `.old` sigue siendo la clave de carga válida.
→ **Lección: `filter-branch` deja un respaldo en `refs/original` que nadie borra
solo.** Sin limpiarlo, el objeto purgado sigue alcanzable y `git log --all` lo
sigue encontrando — parece limpio y no lo está.

### Descubierto probando el APK de release (2026-08-06)

**18. Un campo OPCIONAL nuevo tumbó todas las notificaciones.**
Síntoma: el APK de release no recibía **nada** —ni visitas, ni paquetes, ni
pánico— mientras en desarrollo todo funcionaba.

Causa: `yarn build:apk` fija `BUILD_ENV=production`, babel carga `.env.production`
y la app habla con **producción**, que aún no tenía el PR #138. `saveMobileToken`
manda `osVersion` y `appVersion` **siempre** (`RootNavigator.tsx`, sin
condicional), el servidor no conocía esos campos y GraphQL **rechazó la mutación
completa**: valida el input antes de mirar si el campo era opcional. Sin fila en
`push_subscriptions` no hay a quién enviarle nada.

Y sin rastro: los bundles de producción no llevan `console.*`
(`transform-remove-console` en `babel.config.js:29`). Se compila a ciegas.

→ **Arreglado en #45**: si el registro con metadata falla, se reintenta con los
tres campos de siempre. La metadata es diagnóstico; el registro del token es el
servicio.
→ **Lección: que un campo sea opcional en el backend no protege de nada.** El
rechazo ocurre en la validación del input. Cualquier campo nuevo en una mutación
que la app mande incondicionalmente es un despliegue ordenado obligatorio, o un
apagón total de push.
→ **Lección de método:** para depurar un release usa `yarn build:staging` — es
release-like pero **conserva los logs**. El lado nativo (Kotlin) sí registra
siempre: `adb logcat -s PanicSound PanicChannels FirebaseMessaging`.

**19. Las tres configuraciones del wizard, por lo que realmente se puede hacer.**
Consultado a fondo. Resumen para no volver a discutirlo:

| Config | ¿Automatizable? | Realidad |
|---|---|---|
| No molestar | **Ya resuelto, el paso sobra** | La sirena es `AudioTrack` con `USAGE_ALARM`; DND permite alarmas por defecto. Suena sin ningún permiso. `bypassDnd` solo afecta al sonido *de la notificación*, redundante |
| Ahorro de batería | **A un toque** | `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` es un diálogo del sistema, no una pantalla de Ajustes. Ya se usa. Cero toques no existe en una app de Play |
| Autostart | **Imposible** | Whitelist propietaria de cada OEM. Sin API, sin permiso. Solo se puede *abrir* su pantalla |

Los programas de whitelist de Xiaomi/Huawei/OPPO/vivo existen pero son de mercado
chino: exigen entidad legal local y **su** SDK de push. Cerrado para una app
colombiana sobre FCM.

Palancas que sí quedan, por orden de impacto:
1. **EntryLink es literalmente una app de teléfono.** El rol de marcador
   predeterminado (`RoleManager.ROLE_DIALER`) exime del ahorro de batería
   automáticamente y los OEM tratan esas apps como protegidas. Un diálogo, una
   pulsación. Sin verificar en hardware — cambia el comportamiento de llamadas
   del equipo, así que no es gratis.
2. **Equipo corporativo → device owner** por QR: `setUserControlDisabledPackages()`
   (API 30+) impide el force-stop, el estado hoy declarado fuera de alcance.
   Aplica a tablets de portería, nunca al teléfono de un residente.
3. **Los GIFs por fabricante** (pendiente §5.16): es lo único que mueve la tasa
   de completado en teléfonos de residentes. En MIUI vale la pena enseñar el
   **candado de la pantalla de recientes**: es un gesto, no una pantalla de
   ajustes, y hace que la app sobreviva al swipe.
4. **Medir antes de invertir**: ya se recolecta `manufacturer`/`deviceModel` con
   cada token y `panic_alert_deliveries` guarda quién confirmó.

→ **Lección: para el teléfono personal de un residente no hay cero configuración.**
Ese caso lo cubre el escalamiento del servidor. Es la razón por la que existe.

**20. El manifiesto de documentos confiables se despliega por archivo, no por script.**
`query-manifest.json` del backend **es la semilla del despliegue**:
`ManifestService.onApplicationBootstrap` fusiona sus entradas en Redis, con
precedencia del archivo (`manifest.service.ts:24-33`). Lo que no esté versionado
ahí no existe para un cliente en modo producción.

`push-manifest.ps1` **no genera ese archivo**: hace POST a un backend en
ejecución (`/api/v1/graphql-manifest/sync`) y escribe en su Redis. Sirve para
desbloquear un entorno ya levantado; no hace que un despliegue nuevo nazca
conociendo la query. Ojo además: resuelve la URL desde `PATH_SERVER` del `.env`,
así que correrlo sin mirar puede empujar el manifiesto a **producción**.

→ De ahí el bug de #141: el hash de `GetResidentByUserId` vivía en la copia de
trabajo local por un sync viejo y nunca se commiteó.
→ **Lección: tras agregar una operación en una app, el hash tiene que quedar
commiteado en `query-manifest.json` del backend.** Falla solo en producción —en
desarrollo el modo persistido no está activo—, así que ninguna prueba local lo
delata.

**21. "En desarrollo funciona" no dice nada sobre producción, y ya van tres.**
El mismo día, tres fallos distintos con la misma forma:

| Qué falló | Por qué desarrollo no lo ve |
|---|---|
| Metadata en `saveMobileToken` (§4.18) | El backend local ya tenía el código nuevo; producción no |
| `GetResidentByUserId` sin manifiesto (§4.20) | El modo de documentos persistidos **solo se aplica en producción** |
| FCM deshabilitado (en curso) | Las credenciales viven en el entorno del servidor, no en git |

El hilo común: **desplegar copia el código, no la configuración**, y desarrollo
es permisivo donde producción es estricta. Todo lo que difiere entre los dos es
justo lo que no está versionado, así que ninguna prueba local puede anticiparlo.

Agravante de diseño: el backend **está hecho para no morirse** sin Firebase —warn
al arrancar y sigue sirviendo GraphQL, login y visitas—, así que la única señal
de que los push están apagados es una línea en el log del arranque. Igual con
`API_PUBLIC_URL`.

→ **Lección operativa: la verificación de un despliegue son sus logs de arranque,
no que el sitio responda.** Tres líneas dicen si el despliegue sirve:
`Firebase Admin SDK inicializado`, ausencia del warn de `API_PUBLIC_URL`, y
`Seeded/merged N trusted queries`.

**22. Sondear producción desde fuera no funcionó — no repetirlo.**
Se intentó determinar la versión desplegada mandando hashes APQ al `/graphql` de
producción: los cuerpos llegan **vacíos** y el código HTTP cambia entre 500, 400
y sin respuesta para la misma petición. Es Cloudflare, no la app —el middleware
devolvería JSON con mensaje—, y con cabeceras de navegador tampoco cambia.
→ El estado de un despliegue se verifica **desde adentro** (logs, `printenv`,
tabla `migrations`) o con un efecto observable de punta a punta (la fila en
`push_subscriptions` con metadata, que es lo que finalmente lo confirmó).

---

## 5. Próximos Pasos (Plan de Acción)

### Fase 1 — Desbloquear (obligatorio antes de cualquier prueba)

1. ~~**Definir `API_PUBLIC_URL`**~~ **✅ hecha.** Ojo con su valor según el
   entorno: tiene que ser una URL que **resuelva el teléfono**, no el servidor.
   En producción `https://api.alternaqj.com`; para probar en local, la IP LAN del
   PC (`http://192.168.0.77:3001`). Con `localhost` el pánico llega pero ningún
   equipo confirma, y si apunta a producción mientras pruebas en local, los
   equipos confirman contra el servidor equivocado (401/404) y ensucian la
   auditoría real.
2. ~~Resincronizar el manifest de RemoteLink.~~ **No hace falta** (ver §2). Lo que
   sí manda es el **orden de despliegue**, y sigue vigente aunque los PRs ya estén
   mergeados: mientras el backend no esté **desplegado**, los cuatro campos de
   metadata de equipo le son desconocidos y GraphQL rechaza la mutación
   **completa** — no la ignora. Publicar la app antes que el backend deja a todos
   los equipos sin token registrado, o sea sin ningún push.
3. ~~**Arrancar el backend**~~ **✅ 2026-08-05.** Bootea limpio, rutas mapeadas,
   sin warning de `API_PUBLIC_URL`. La cola `panic-escalation` **no estaba
   registrada en Bull Board** (solo `otp` y `mail`): se agregó en
   `bull-board.module.ts`, sin eso la Fase 4 no se puede verificar.

### Fase 2 — Verificar el circuito de pánico (EntryLink, dispositivo físico)

4. **Instalar limpio** (`yarn build:staging`, desinstalando antes). El canal
   `panic` viejo es inmutable; sin reinstalar no se ve el cambio de sonido.
5. Dejar `adb logcat -s PanicAlertReceiver PanicSirenService PanicAlarmEngine PanicAckClient` abierto.
6. **Disparar un pánico con la app cerrada por swipe y la pantalla bloqueada.**
   Confirmar en orden:
   - la sirena arranca en **<1s** (no 1-3s) → la ruta nativa funciona
   - el log dice si `startForeground` fue **aceptado** o degradó → valida C2
   - la pantalla se enciende y aparece `PanicAlertActivity`
   - `PanicAckClient` reporta `Entrega confirmada (204)`
   - en BD: `panic_alerts.status = 'DELIVERED'`
7. Resto de criterios §8: volumen de medios en 0, swipe sobre la notificación,
   botón atrás, timeout de 3 min, ATENDER.

### Fase 2-bis — Verificar RemoteLink (equipo de residente)

- ~~Pánico con la app **cerrada por swipe**~~ **✅ 2026-08-05.** Sirena,
  notificación y ACK 204. Falta confirmar en BD que `panic_alert_deliveries`
  guardó marca y modelo (el estado **no** debe moverse a `DELIVERED`: eso solo lo
  hace un responder).
- **No tocar nada 3 min**: la sirena se apaga sola y la notificación desaparece
  de la bandeja. Es el caso que antes dejaba el teléfono sonando indefinidamente.
- Reconocer desde EntryLink **con RemoteLink cerrado**, luego abrir RemoteLink:
  no debe sonar nada y la bandeja debe quedar limpia.
- Toggle de alertas de pánico apagado en Ajustes → ni sirena ni notificación.

### Fase 3 — Verificar wizard y salud

8. Abrir el wizard desde el drawer. Confirmar que **solo aparecen los pasos que
   aplican** al equipo de prueba (en un Redmi con Android 14: los 7).
9. **Anotar si "Alertas de pantalla completa" sale denegado.** Si es así, confirma
   la hipótesis del punto 11 de Lecciones: la toma del lock screen llevaba tiempo
   rota en producción.
10. Completar el paso 7 y verificar `device_push_health.onboarding_completed_at`.
11. Forzar `is_healthy = false` en BD, reabrir la app y confirmar el banner rojo.

### Fase 4 — Verificar escalamiento

12. Disparar un pánico y **no atenderlo**. Verificar en Bull Board que los jobs
    `panic:{id}:L1/L2/L3` se encolan y ejecutan a los 15/45/90s.
13. Confirmar que llega el correo de escalamiento (nivel 2) y que
    `panic_alert_deliveries` registra los canales no disponibles con su motivo.
14. Atender una alerta a mitad de la cadena y confirmar que **los jobs pendientes
    se eliminan**.

### Fase 5 — Producción

15. **Iniciar el trámite de Play Console** (ver `docs/ENTREGA-DE-ALERTAS.md`).
    Es el camino crítico por plazos y va en paralelo. Riesgo alto en
    `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`.
16. Capturar los GIFs por fabricante y registrarlos en
    `src/presentation/assets/onboarding/index.ts`.
17. ~~Abrir PRs.~~ **✅ hecho**, los cuatro. ~~Mergearlos.~~ **✅ 2026-08-06.**

---

## 6. Por dónde seguir

1. ~~Desplegar el backend.~~ **✅ 2026-08-06.** Confirmado por efecto observable:
   `push_subscriptions` guarda marca y modelo, cosa que un servidor previo al
   #138 habría rechazado.
   → **Lo que se retoma mañana: por qué no se entrega ningún push.** El primer
   comando y la hipótesis (`fcmEnabled` en false por falta de credenciales de
   Firebase en el entorno) están en el encabezado. Antes de tocar nada, esa
   línea del log: decide si el problema es configuración del servidor o hay que
   seguir bajando por el despacho.
   → Quedan por verificar del mismo despliegue: las tres migraciones,
   `API_PUBLIC_URL` y que el manifiesto creciera con la entrada del #141.
2. ~~Borrar los overrides de schema.~~ **✅ 2026-08-06**, en las dos apps (ver §2).
3. **Rotar la llave de firma** (lección 17). Decidido el 2026-08-06: se rota, no
   se asume que la `.old` estaba retirada. Trámite en Play Console con ~2 días
   hábiles de espera, así que va en paralelo:
   - generar la nueva keystore con `keytool` (contraseña **fuera del chat**),
   - exportar su certificado con `keytool -export -rfc`,
   - Play Console → *Configuración → Integridad de la app → Firma de apps* →
     *Solicitar restablecimiento de la clave de carga*, adjuntando el PEM,
   - al aprobarse, actualizar `keystore.properties` local y el CI.
   - Hasta entonces **la `.old` sigue siendo la clave de carga válida**: no
     borrarla del disco.
4. Terminar la **Fase 2-bis** de RemoteLink: auto-apagado a los 3 min, barrido de
   huérfana, toggle de opt-out.
5. **Fase 4 completa** (escalamiento). La cola ya aparece en Bull Board.
6. **EntryLink en hardware.** No se ha instalado nunca; sus criterios están en cero.

### Pendientes menores (no bloquean)

- `RemoteLink`: sigue sin ruta nativa ni FGS (decisión C5). Portarlo implicaría
  reabrir C2.
- Quitar el bloque `TODO(debug-panic)` de `triggerPanicAlert` (~12 `logger.warn`
  temporales) si el 500 de producción ya se resolvió.
- Árbol nativo duplicado en EntryLink: `com/alternaqj/entrylink/**` es **código
  muerto** (el paquete vivo es `com.entrylinkapp`).
- **Tres stashes por revisar**: backend `{0}` (split-wip-5features, 06-29) y `{1}`
  (wip-4-features, 06-28), EntryLink `{0}` (config de build, 06-05). Los otros
  cuatro se descartaron. Los tres que quedan son de junio y probablemente ya
  estén superados: hay que comparar contra `main` antes de aplicar nada.
- ~~**Higiene de ramas**~~ **✅ 2026-08-06.** RemoteLink pasó de 43 ramas locales
  a 1; el backend, de 84 a 2. Se borraron con `-d` las mergeadas y con `-D` las
  superadas por squash, verificando **una por una** que su contenido estuviera en
  `main` (diff vacío, o solo el retraso frente a un PR posterior).
  Del rescate salió el PR #140: `feat/finance-payment-method-labels` era la única
  con trabajo real sin mergear —etiquetas legibles de método de pago en la
  auditoría—, y se revivió por cherry-pick sobre `main`.
  → Queda **`feat/supervisor-self-registration`** en el backend: su único commit
  propio extrae las utilidades Haversine a `shared/utils/gps.utils.ts`, archivo
  que **no existe en `main`**. Es de marzo y con 465 archivos de divergencia;
  probablemente el cálculo hoy vive inline en otro lado. Sin decidir.
  → **Lección: una rama borrada que solo existía en local no se recupera** más
  allá del reflog (~90 días). Antes de `-D`, comparar contra `main` no es
  ceremonia: `feat/panic-alert-aggregate` parecía tener 14 commits propios y su
  diff resultó ser **solo** los 17 archivos del PR #139, o sea nada.
- **Dependabot**: 8 PRs abiertos. Los mayores —#132 TypeORM 0.3→1.1 y #134
  TypeScript 5.9→6.0— **fuera de esta ventana**: se despliegan 3 migraciones
  nuevas y mezclarlo haría imposible saber qué rompió si algo rompe. #135
  (bull-board 6→8) ya se puede: #138 está mergeado.
- **`showQuestion` recibe `(description, title)`**. Dos llamadas los pasaban al
  revés y se corrigieron en #44; las otras cinco del proyecto ya estaban bien.
  Si aparece un diálogo con el párrafo largo en negrita, es eso.
- **Migraciones con timestamp repetido**: `AddNewDeviceLinkedNotificationType` y
  `CreatePanicAlerts` comparten `1781003300000`. Aquí no importa —son
  independientes e idempotentes, y ya corrieron en ese orden—, pero renumerar
  tiene coste (la tabla `migrations` registra por nombre, así que se
  re-ejecutarían). Anotado por si la próxima colisión cae entre dos que sí
  dependan una de otra.
