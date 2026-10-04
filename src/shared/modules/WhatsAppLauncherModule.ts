import { NativeModules, Platform } from 'react-native';

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
 * Apps de WhatsApp instaladas. En iOS (o sin el módulo nativo) devuelve vacío y
 * quien llama cae al link `wa.me` de siempre.
 */
export async function getInstalledWhatsApps(): Promise<WhatsAppPackage[]> {
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
