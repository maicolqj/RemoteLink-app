# Publicar RemoteLink en Google Play

Guía del proceso completo, desde la firma hasta la ficha de la tienda. Escrita
para repetirla en cada release, no solo la primera vez.

Datos fijos de la app:

| | |
| --- | --- |
| Nombre visible | RemoteLink |
| `applicationId` | `com.alternaqj.remotelink` |
| `targetSdkVersion` | 36 |
| `minSdkVersion` | 24 |
| Política de privacidad | https://app.alternaqj.com/legal/politica-de-privacidad |
| Términos | https://app.alternaqj.com/legal/terminos-y-condiciones |

---

## 1. Llave de firma (solo la primera vez)

**Esto es lo único de toda la guía que no se puede deshacer.** Google identifica
la app por su llave. Si la pierdes y no estás en Play App Signing, no puedes
volver a publicar una actualización nunca: hay que sacar una app nueva, con otro
`applicationId`, y los usuarios instalados no migran solos.

Genera la llave (contesta las preguntas de nombre/organización; el CN puede ser
"RemoteLink"):

```powershell
cd C:\Users\maico\Apps\FRONTEND\react-native\remotelink\android\app
keytool -genkeypair -v -storetype PKCS12 `
  -keystore release.keystore `
  -alias remotelink `
  -keyalg RSA -keysize 2048 -validity 10000
```

`-validity 10000` (≈27 años) no es capricho: Play rechaza llaves que caduquen
antes del 22 de octubre de 2033.

Luego crea `android/keystore.properties` copiando el ejemplo del repo:

```
RELEASE_STORE_FILE=release.keystore
RELEASE_STORE_PASSWORD=<la que pusiste>
RELEASE_KEY_ALIAS=remotelink
RELEASE_KEY_PASSWORD=<la que pusiste>
```

Ni `release.keystore` ni `keystore.properties` se commitean — `.gitignore` ya
los cubre. Guarda una copia de los dos **fuera del equipo** (gestor de
contraseñas o caja fuerte del equipo). Un disco que se muere no debería costar
la app.

> `build.gradle` cae al keystore de debug cuando `keystore.properties` no
> existe, para que un clon fresco pueda compilar. Eso significa que un AAB
> firmado con debug se genera **sin error**: Play lo rechaza al subirlo. Verifica
> la firma con el paso 4 antes de perder el viaje.

### Activa Play App Signing

En Play Console, al crear la app, deja activo **Play App Signing** (viene por
defecto). Tu `release.keystore` pasa a ser la *llave de subida*: si la pierdes,
Google te deja registrar una nueva y la app sigue viva. Es la única red de
seguridad que existe para el escenario del párrafo de arriba.

---

## 2. Versión

`versionName` sale de `package.json`; `versionCode` está a mano en
`android/app/build.gradle`.

```bash
yarn version --new-version 1.0.1   # o --patch / --minor
```

Y sube `versionCode` en 1 **en cada subida a Play**, aunque el `versionName` no
cambie (un reintento tras un rechazo también gasta un número). Play rechaza un
AAB cuyo `versionCode` ya se usó.

Estado actual: `versionName 1.0.0`, `versionCode 3`.

---

## 3. Antes de compilar

- [ ] `.env.production` apunta a `https://api.alternaqj.com` y trae las llaves
      de producción.
- [ ] **Manifest de trusted documents empujado al backend de producción.** En
      `STAGE=production` Apollo manda solo el hash de cada operación; si el
      backend no lo tiene, responde `403 PERSISTED_QUERY_NOT_ALLOWED` y la app
      no hace *nada*. Se rompe entera, no una pantalla:
      ```powershell
      powershell -ExecutionPolicy Bypass -File 'C:\Users\maico\Apps\push-manifest.ps1' -Frontend remotelink
      ```
      Correrlo **después** de `yarn codegen` y contra el backend que va a servir
      esta versión.
- [ ] Migraciones del backend corridas en producción.
- [ ] `android/app/google-services.json` es el del proyecto Firebase de
      producción (está gitignoreado; no viaja en el clon).

---

## 4. Compilar y verificar la firma

```bash
yarn codegen
yarn build:aab
```

Sale en `android/app/build/outputs/bundle/release/app-release.aab`.

Verifica que **no** quedó firmado con debug:

```powershell
cd C:\Users\maico\Apps\FRONTEND\react-native\remotelink\android
jarsigner -verify -verbose:summary app\build\outputs\bundle\release\app-release.aab
```

Si el certificado dice `CN=Android Debug`, falta `keystore.properties`. Vuelve
al paso 1.

Prueba también el APK en un dispositivo real antes de subir — el AAB no se
instala directo:

```bash
yarn build:apk   # android/app/build/outputs/apk/release/app-release.apk
```

---

## 5. Ficha en Play Console

Material que hay que tener listo:

| Recurso | Requisito |
| --- | --- |
| Ícono | 512×512 PNG, 32 bits, con alfa |
| Gráfico destacado | 1024×500 PNG o JPG |
| Capturas de teléfono | mínimo 2, entre 320 px y 3840 px de lado |
| Descripción corta | ≤ 80 caracteres |
| Descripción larga | ≤ 4000 caracteres |
| Política de privacidad | la URL de la tabla de arriba |

### Declaraciones de permisos — lo que más rechazos causa

RemoteLink pide dos permisos que Play considera sensibles. Ninguno pasa solo:
cada uno tiene un formulario aparte, y omitirlo es rechazo automático.

**`USE_FULL_SCREEN_INTENT`** — desde Android 14 solo se concede por defecto a
apps de llamadas y alarmas. Justificación: la alerta de pánico tiene que tomar
la pantalla con el equipo bloqueado; si el residente tiene que desbloquear y
abrir la app, el aviso llega tarde.

**`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`** — Play solo lo permite si es esencial
para la función principal. Justificación: la alerta de pánico llega por FCM con
la app cerrada; con la optimización de batería activa el sistema retrasa o
descarta el push, que en una alerta de seguridad equivale a no enviarlo.
Menciona que la app **pide** la exención al usuario, no la asume.

### Data safety

Declara lo que la app realmente manda al backend — la lista sale de lo que
recogen las pantallas de ingreso y perfil: nombre, documento de identidad,
teléfono, correo, foto de perfil, e identificadores de dispositivo (el
`x-device-id` y el token FCM). Revisa si las alertas de pánico y las solicitudes
de acceso envían ubicación; si es así, va declarada también.

Todo viaja cifrado en tránsito (HTTPS; `usesCleartextTraffic=false` en release).

### Contenido

- Clasificación de contenido: cuestionario, categoría utilidades.
- Público objetivo: mayores de 18 — es una app de administración de conjuntos
  residenciales, no está dirigida a menores.
- Anuncios: no.

---

## 6. Subida

1. Play Console → **Prueba interna** primero, nunca directo a producción. Sube
   el AAB y agrega tu correo como probador.
2. Instala desde el enlace de prueba interna y verifica el camino completo
   contra producción: ingreso con documento + clave, alerta de pánico con la app
   cerrada, notificaciones push.
3. Recién ahí promueve a producción.

La primera revisión de una cuenta nueva puede tardar varios días. Las
actualizaciones posteriores, horas.

---

## 7. Riesgos conocidos de esta versión

- **Edge-to-edge.** `gradle.properties` tiene `edgeToEdgeEnabled=false`, pero
  con `targetSdk 36` Android ya no respeta la exclusión. En Android 15+ el
  contenido puede quedar por debajo de la barra de estado o la de navegación.
  Pruébalo en un dispositivo con Android 15 o 16 antes de promover a producción;
  si se ve mal, se corrige con los insets, no volviendo a bajar el `targetSdk`
  (Play ya no acepta menos de 36 desde el 31 de agosto de 2026).
- **Sin minificación.** `enableProguardInReleaseBuilds = false`: el AAB pesa más
  de lo necesario. Activarlo exige probar el release firmado en un dispositivo,
  porque un fallo de R8 por reflexión solo aparece ahí.
- **`yarn schema:pull` y `yarn sync-manifest` están rotos.** Apuntan a
  `scripts/pull-schema.js` y `scripts/sync-manifest.js`, y el directorio
  `scripts/` no existe en este repo. Usa los `.ps1` de `C:\Users\maico\Apps\`.
