import { Platform } from 'react-native';
import NfcManager, { Ndef, NfcTech, type TagEvent } from 'react-native-nfc-manager';

/**
 * Lectura de los chips NFC de los sitios del conjunto.
 *
 * El chip guarda UN registro de texto NDEF con el mismo código impreso en el
 * sticker QR (p. ej. `T2-SOT1-BOMBAS`), así que QR y NFC se resuelven igual en
 * el backend (`maintenanceLocationTagByCode`). Los graba la administración
 * desde EntryLinkApp; el residente solo lee.
 */

export class NfcError extends Error {}

let started = false;

async function ensureStarted(): Promise<void> {
  if (started) return;
  await NfcManager.start();
  started = true;
}

/** El equipo tiene NFC (aunque esté apagado). Solo Android por ahora. */
export async function isNfcSupported(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    return await NfcManager.isSupported();
  } catch {
    return false;
  }
}

const normalize = (value: string) => value.trim().toUpperCase();

/** El código escrito en el chip, o null si no tiene un texto legible. */
function codeFromTag(tag: TagEvent | null): string | null {
  for (const record of tag?.ndefMessage ?? []) {
    const payload = Uint8Array.from(record.payload as number[]);
    if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT)) {
      const text = Ndef.text.decodePayload(payload);
      if (text?.trim()) return normalize(text);
    }
    // Un chip grabado con una URL (…/sitio/T2-SOT1-BOMBAS): el código es el
    // último tramo.
    if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) {
      const uri = Ndef.uri.decodePayload(payload);
      const last = uri?.split(/[/?#=]/).filter(Boolean).pop();
      if (last) return normalize(decodeURIComponent(last));
    }
  }
  return null;
}

/**
 * Espera a que acerquen un chip y devuelve su código. Se queda esperando hasta
 * que llegue uno o se llame `cancelNfc()`.
 */
export async function readSiteCode(): Promise<string> {
  await ensureStarted();
  if (!(await NfcManager.isEnabled())) {
    throw new NfcError('El NFC del celular está apagado. Actívalo en Ajustes y vuelve a intentarlo.');
  }
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const code = codeFromTag(await NfcManager.getTag());
    if (!code) {
      throw new NfcError('Este chip no tiene grabado el código de un sitio. Escanea el QR o escribe el código.');
    }
    return code;
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => undefined);
  }
}

/** Deja de esperar un chip (botón Cancelar). */
export async function cancelNfc(): Promise<void> {
  await NfcManager.cancelTechnologyRequest().catch(() => undefined);
}

/** Error de "el usuario canceló": no se muestra como falla. */
export function isNfcCancel(e: unknown): boolean {
  const message = e instanceof Error ? e.message : String(e ?? '');
  return !(e instanceof NfcError) && /cancel/i.test(message);
}
