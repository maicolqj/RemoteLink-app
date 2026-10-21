import { Linking, NativeModules, Platform } from 'react-native';

export type WhatsAppPackage = 'com.whatsapp' | 'com.whatsapp.w4b';

interface WhatsAppLauncherNative {
  getInstalledApps: () => Promise<string[]>;
  openChat: (packageName: string, phone: string, text: string) => Promise<boolean>;
}

const native = Platform.OS === 'android'
  ? (NativeModules.WhatsAppLauncher as WhatsAppLauncherNative | undefined)
  : undefined;

export const WHATSAPP_APP_LABEL: Record<WhatsAppPackage, string> = {
  'com.whatsapp': 'WhatsApp',
  'com.whatsapp.w4b': 'WhatsApp Business',
};

/**
 * En iOS no hay paquetes: cada app registra su esquema de URL. Los dos van en
 * LSApplicationQueriesSchemes del Info.plist; sin eso canOpenURL dice que no.
 */
const IOS_SCHEME: Record<WhatsAppPackage, string> = {
  'com.whatsapp': 'whatsapp',
  'com.whatsapp.w4b': 'whatsapp-smb',
};

const IOS_PACKAGES = Object.keys(IOS_SCHEME) as WhatsAppPackage[];

const iosChatUrl = (pkg: WhatsAppPackage, phone: string, text: string) =>
  `${IOS_SCHEME[pkg]}://send?phone=${phone}&text=${encodeURIComponent(text)}`;

/**
 * Apps de WhatsApp instaladas. Sin el módulo nativo en Android devuelve vacío y
 * quien llama cae al link `wa.me` de siempre.
 */
export async function getInstalledWhatsApps(): Promise<WhatsAppPackage[]> {
  if (Platform.OS === 'ios') {
    const installed = await Promise.all(
      IOS_PACKAGES.map(pkg => Linking.canOpenURL(`${IOS_SCHEME[pkg]}://`).catch(() => false)),
    );
    return IOS_PACKAGES.filter((_, i) => installed[i]);
  }
  if (!native) return [];
  try {
    const apps = await native.getInstalledApps();
    return apps.filter((p): p is WhatsAppPackage => p in WHATSAPP_APP_LABEL);
  } catch {
    return [];
  }
}

/** Abre el chat en la app indicada. `false` si no se pudo. */
export async function openWhatsAppChat(pkg: WhatsAppPackage, phone: string, text: string): Promise<boolean> {
  if (Platform.OS === 'ios') {
    try {
      await Linking.openURL(iosChatUrl(pkg, phone, text));
      return true;
    } catch {
      return false;
    }
  }
  if (!native) return false;
  try {
    return await native.openChat(pkg, phone, text);
  } catch {
    return false;
  }
}

/** Número de destino de un link `https://wa.me/<número>?text=…`. */
export function phoneFromWaLink(url: string): string | null {
  const match = /wa\.me\/(\d+)/.exec(url);
  return match ? match[1] : null;
}
