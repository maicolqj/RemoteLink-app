// =============================================================================
// Actualizaciones de la app.
//
//   - Obligatoria: el backend fija una versión mínima (appVersionCheck) para
//     los cambios que rompen compatibilidad, p. ej. un cambio disruptivo en la
//     base de datos. Por debajo de ese piso la app queda bloqueada.
//   - Normal: Google Play ofrece la actualización dentro de la app (FLEXIBLE):
//     se descarga en segundo plano y el usuario elige cuándo reiniciar.
//
// Se revisa al abrir la app y cada vez que vuelve a primer plano. Si la
// consulta falla (sin red, backend caído) no se bloquea a nadie.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';
import { useApolloClient } from '@apollo/client/react';
import DeviceInfo from 'react-native-device-info';
import SpInAppUpdates, {
  IAUInstallStatus,
  IAUUpdateKind,
  type StatusUpdateEvent,
} from 'sp-react-native-in-app-updates';
import { DISTRIBUTION } from '@env';

import { APP_VERSION_CHECK } from '../../domain/graphql/app-version.queries';

type ClientApp = 'REMOTELINK' | 'ENTRYLINK';

type AppVersionCheckData = {
  appVersionCheck: { updateRequired: boolean; minVersionCode: number; message: string | null };
};

const inAppUpdates = new SpInAppUpdates(false);

/** versionCode (Android) o build number (iOS) instalado. */
const VERSION_CODE = Number(DeviceInfo.getBuildNumber()) || 0;
const PLATFORM = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

/**
 * Play solo ofrece la actualización a instalaciones que vienen de Play. Un APK
 * instalado a mano o el build de desarrollo no tienen a quién preguntarle.
 */
const PLAY_UPDATES = Platform.OS === 'android' && DISTRIBUTION === 'aab';

/**
 * Play informa el versionCode disponible. La librería compara por defecto
 * contra el versionName con semver ("21" vs "1.11.0"), lo que da resultados
 * absurdos: se compara versionCode contra versionCode.
 */
const byVersionCode = (a: string, b: string): -1 | 0 | 1 =>
  Math.sign(Number(a) - Number(b)) as -1 | 0 | 1;

const checkPlay = () =>
  inAppUpdates.checkNeedsUpdate({
    curVersion: String(VERSION_CODE),
    customVersionComparator: byVersionCode,
  });

async function openStore(): Promise<void> {
  const id = DeviceInfo.getBundleId();
  if (Platform.OS === 'android') {
    try {
      await Linking.openURL(`market://details?id=${id}`);
    } catch {
      await Linking.openURL(`https://play.google.com/store/apps/details?id=${id}`).catch(() => {});
    }
    return;
  }
  // iOS: la librería busca la app en la App Store y ofrece abrirla.
  await inAppUpdates.startUpdate({} as never).catch(() => {});
}

export type AppUpdateState = {
  /** Distinto de null = la versión instalada ya no es compatible. */
  required: { message: string | null } | null;
  /** Abre la actualización: IMMEDIATE de Play si se puede, si no la tienda. */
  startRequiredUpdate: () => Promise<void>;
  versionName: string;
};

export function useAppUpdate(app: ClientApp): AppUpdateState {
  const client = useApolloClient();
  const [required, setRequired] = useState<AppUpdateState['required']>(null);
  // La actualización normal se ofrece una vez por sesión: volver a primer
  // plano tras cerrar el diálogo de Play no debe insistir.
  const offered = useRef(false);

  const checkRequired = useCallback(async (): Promise<boolean> => {
    try {
      const { data } = await client.query<AppVersionCheckData>({
        query: APP_VERSION_CHECK,
        variables: { app, platform: PLATFORM, versionCode: VERSION_CODE },
        fetchPolicy: 'network-only',
      });
      const check = data?.appVersionCheck;
      const blocked = !!check?.updateRequired;
      setRequired(blocked ? { message: check?.message ?? null } : null);
      return blocked;
    } catch {
      return false;
    }
  }, [client, app]);

  const offerFlexibleUpdate = useCallback(async () => {
    if (!PLAY_UPDATES || offered.current) return;
    offered.current = true;
    try {
      const result = await checkPlay();
      if (result.shouldUpdate) {
        await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE });
      }
    } catch {
      // Play no disponible (sin cuenta, sin red…): se intenta en la próxima sesión.
    }
  }, []);

  const run = useCallback(async () => {
    const blocked = await checkRequired();
    if (!blocked) await offerFlexibleUpdate();
  }, [checkRequired, offerFlexibleUpdate]);

  useEffect(() => {
    run();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [run]);

  // La FLEXIBLE se descarga en segundo plano; al terminar se pide reiniciar.
  useEffect(() => {
    if (!PLAY_UPDATES) return;
    const onStatus = ({ status }: StatusUpdateEvent) => {
      if (status !== IAUInstallStatus.DOWNLOADED) return;
      Alert.alert(
        'Actualización lista',
        'Ya descargamos la nueva versión. Reinicia la app para usarla.',
        [
          { text: 'Más tarde', style: 'cancel' },
          { text: 'Reiniciar', onPress: () => inAppUpdates.installUpdate() },
        ],
      );
    };
    inAppUpdates.addStatusUpdateListener(onStatus);
    return () => inAppUpdates.removeStatusUpdateListener(onStatus);
  }, []);

  const startRequiredUpdate = useCallback(async () => {
    if (PLAY_UPDATES) {
      try {
        const result = await checkPlay();
        if (result.shouldUpdate && (result as { other?: { isImmediateUpdateAllowed?: boolean } }).other?.isImmediateUpdateAllowed) {
          await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.IMMEDIATE });
          return;
        }
      } catch {
        // Si Play no puede, se abre la ficha de la tienda.
      }
    }
    await openStore();
  }, []);

  return { required, startRequiredUpdate, versionName: DeviceInfo.getVersion() };
}
