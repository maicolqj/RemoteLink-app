# HandOff — Sistema de alertas de pánico (EntryLink / RemoteLink)

> Traspaso de sesión. Cubre **tres repositorios**. Todo está subido y con PR
> abierto; **nada mergeado todavía**. Última actualización: 2026-08-05.

| Repo | Rama | PR |
|---|---|---|
| Backend `…\BACKEND\phone-dialer-nestjs` | `feat/panic-alert-aggregate` (desde `main`) | [EntryLink-nestjs#138](https://github.com/maicolqj/EntryLink-nestjs/pull/138) → `main` |
| RemoteLink `…\react-native\remotelink` | `chore/release-1.0.0-android` | [RemoteLink-app#41](https://github.com/maicolqj/RemoteLink-app/pull/41) → `main` |
| RemoteLink | `feat/panic-alerts` (desde la de release) | [RemoteLink-app#42](https://github.com/maicolqj/RemoteLink-app/pull/42) → **#41**, apilado |
| EntryLink `…\react-native\PhoneDialerApp` | `feat/panic-native-alert` | [EntryLinkApp#18](https://github.com/maicolqj/EntryLinkApp/pull/18) → `main` |

## ORDEN DE MERGE — no improvisar

1. **#138 (backend) y desplegar.** Todo lo demás depende de él: `ackUrl`,
   health-check, metadata de equipo en `SaveMobileTokenInput`, `residentByUserId`.
   Publicar cualquier app antes deja los equipos **sin token registrado y por
   tanto sin ningún push**: GraphQL rechaza la mutación completa ante un campo
   desconocido.
2. Borrar los overrides de schema en las dos apps (ver §5).
3. #41 → `gh pr edit 42 --base main` → #42.
4. #18.

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
- `SaveMobileTokenInput` con la metadata de equipo en `schema.overrides.gql`
  (el espejo del backend aún no la trae) → tipos generados y mutación tipada.

### ⚠️ A mitad de camino

- **Los GIFs del wizard.** El registro `presentation/assets/onboarding/index.ts`
  existe y está **vacío**. Sin assets el wizard muestra solo texto.
- **`ackUrl` depende de `API_PUBLIC_URL`**, que no está definida. Hoy los push de
  pánico salen sin ella → **ningún equipo confirma entrega** → el escalamiento
  trata toda alerta como no entregada.
- ~~**Manifest de documentos persistidos de RemoteLink desincronizado.**~~
  **Falsa alarma, verificado.** Lo que cambió fue el *input type*, no el texto de
  la operación: `SaveMobileToken` sigue siendo `mutation SaveMobileToken($input:
  SaveMobileTokenInput!) { saveMobileToken(input: $input) { success } }`. El hash
  se calcula sobre el documento, así que no se movió — `yarn codegen` deja
  `persisted-documents.json` byte a byte igual. No hay que resincronizar nada.

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
→ **Pendiente de decisión: rotar la llave.** Estuvo publicada varias horas.
→ **Lección: `filter-branch` deja un respaldo en `refs/original` que nadie borra
solo.** Sin limpiarlo, el objeto purgado sigue alcanzable y `git log --all` lo
sigue encontrando — parece limpio y no lo está.

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
   sí manda es el **orden de despliegue**: los cuatro campos de metadata de equipo
   son desconocidos para el backend sin mergear, y GraphQL rechaza la mutación
   **completa** por un campo desconocido — no lo ignora. Publicar la app antes que
   el backend deja a todos los equipos sin token registrado, o sea sin ningún push.
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
17. ~~Abrir PRs.~~ **✅ hecho**, los cuatro. Ver el orden de merge al inicio.

---

## 6. Por dónde seguir mañana

1. **Mergear #138 y desplegar.** Es el cuello de botella de todo lo demás. Al
   desplegar, revisar que `API_PUBLIC_URL` de producción sea
   `https://api.alternaqj.com` — hoy quedó apuntando a la IP LAN para las
   pruebas locales, y si sale así a producción ningún equipo confirma entrega.
2. **Borrar los overrides de schema.** En EntryLink codegen fallará y te avisará;
   en RemoteLink **no avisa** (lección 16), hay que acordarse:
   - RemoteLink: bloque `extend input SaveMobileTokenInput` de `schema.overrides.gql`
   - EntryLink: `schema.overrides.gql` completo, y quitarlo de `codegen.ts`
3. **Decidir sobre la llave de firma** (lección 17): rotarla en Play Console o
   confirmar que la `.old` ya estaba retirada.
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
- **Higiene de ramas en el backend**: ~60 ramas locales ya mergeadas
  (`git branch --merged origin/main | grep -vE '^\*|main$' | xargs git branch -d`)
  y una rama fantasma `heads/origin`. Las 15 con PR mergeado por squash ya se
  borraron.
- **Dependabot**: 8 PRs abiertos. Los mayores —#132 TypeORM 0.3→1.1 y #134
  TypeScript 5.9→6.0— **fuera de esta ventana**: se despliegan 3 migraciones
  nuevas y mezclarlo haría imposible saber qué rompió si algo rompe. #135
  (bull-board 6→8) después de mergear #138.
- **Migraciones con timestamp repetido**: `AddNewDeviceLinkedNotificationType` y
  `CreatePanicAlerts` comparten `1781003300000`. Aquí no importa —son
  independientes e idempotentes, y ya corrieron en ese orden—, pero renumerar
  tiene coste (la tabla `migrations` registra por nombre, así que se
  re-ejecutarían). Anotado por si la próxima colisión cae entre dos que sí
  dependan una de otra.
