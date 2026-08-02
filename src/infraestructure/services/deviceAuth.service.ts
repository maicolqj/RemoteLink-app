import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apolloClient from '../../data/lib/apollo/client';
import {
  SET_ACCESS_CODE,
  LOGIN_WITH_ACCESS_CODE,
  HAS_ACCESS_CODE,
  MY_DEVICES,
  REVOKE_DEVICE,
  REVOKE_OTHER_DEVICES,
  WA_LOGIN_AVAILABLE,
  REQUEST_WA_LOGIN,
  WA_LOGIN_STATUS,
  REDEEM_WA_LOGIN,
  REQUEST_APPROVAL,
  APPROVAL_STATUS,
  REDEEM_APPROVAL,
  PENDING_APPROVALS,
  APPROVE_DEVICE_APPROVAL,
  DENY_DEVICE_APPROVAL,
} from '../../domain/graphql/device-auth.queries';
import SecureStorageService from './SecureStorageService';
import { parseApiError } from '../utils/apiError';
import type { LoginResult } from './auth.service';

// ─── Errores ─────────────────────────────────────────────────────────────────

/**
 * Error de cualquier flujo de este servicio. `code` es el `extensions.code`
 * tipado del backend (ACCESS_CODE_INVALID, APPROVAL_DENIED, …). La UI debe
 * ramificar SIEMPRE por `code`, nunca por el texto de `message` — que ya viene
 * redactado en español y es apto para mostrarse tal cual.
 */
export class DeviceAuthError extends Error {
  readonly code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'DeviceAuthError';
    this.code = code;
  }
}

const toDeviceAuthError = (e: unknown, fallback: string): DeviceAuthError => {
  const parsed = parseApiError(e, fallback);
  return new DeviceAuthError(parsed.message, parsed.code);
};

// ─── Tipos del contrato ──────────────────────────────────────────────────────

export interface ResidentDevice {
  id: string;
  deviceId: string;
  label?: string | null;
  platform?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface WhatsAppLoginChallenge {
  challengeId: string;
  nonce: string;
  whatsappUrl: string;
  messageText: string;
  expiresAt: string;
  warning: string;
}

export type WhatsAppChallengeStatus = 'PENDING' | 'CONFIRMED' | 'CONSUMED' | 'EXPIRED';

export interface DeviceApprovalChallenge {
  challengeId: string;
  approvalCode: string;
  expiresAt: string;
  instructions?: string | null;
}

export type DeviceApprovalStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'CONSUMED' | 'EXPIRED';

export interface PendingDeviceApproval {
  approvalId: string;
  approvalCode: string;
  requestedFromLabel?: string | null;
  requestedFromIp?: string | null;
  expiresAt: string;
  createdAt: string;
}

/** Payload del push LOGIN_APPROVAL_REQUEST, ya parseado desde `metadata`. */
export interface LoginApprovalPushPayload {
  approvalId: string;
  approvalCode: string;
  requestedFromLabel?: string;
  requestedFromIp?: string;
  expiresAt?: string;
}

// ─── Preferencias locales ────────────────────────────────────────────────────

const DEVICE_LINKED_KEY = 'auth.deviceLinked';
const LAST_IDENTITY_KEY = 'auth.lastIdentity';
const CODE_FORGOTTEN_KEY = 'auth.accessCodeForgotten';

/**
 * Pista local de "este dispositivo está vinculado". No es una credencial ni una
 * fuente de verdad: solo decide qué pantalla de login se muestra primero. La
 * autoridad es el backend, que responde DEVICE_NOT_LINKED si no coincide.
 * Debe sobrevivir al logout, igual que el x-device-id.
 */
export const setDeviceLinked = async (linked: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(DEVICE_LINKED_KEY, linked ? '1' : '0');
  } catch {}
};

export const isDeviceLinked = async (): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(DEVICE_LINKED_KEY)) === '1';
  } catch {
    return false;
  }
};

/**
 * El residente declaró haber olvidado su clave.
 *
 * La cuenta sigue teniendo clave en el servidor, así que preguntarle a él no
 * alcanza para saber que hay que pedir una nueva: sin esta marca entraría por
 * WhatsApp y volvería a encontrarse con la misma clave que no recuerda.
 */
export const markAccessCodeForgotten = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(CODE_FORGOTTEN_KEY, '1');
  } catch {}
};

export const wasAccessCodeForgotten = async (): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(CODE_FORGOTTEN_KEY)) === '1';
  } catch {
    return false;
  }
};

const clearAccessCodeForgotten = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CODE_FORGOTTEN_KEY);
  } catch {}
};

/** Prefill de los flujos de recuperación; el documento no es un secreto. */
export const saveLastIdentity = async (identity: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_IDENTITY_KEY, identity.trim());
  } catch {}
};

export const getLastIdentity = async (): Promise<string> => {
  try {
    return (await AsyncStorage.getItem(LAST_IDENTITY_KEY)) ?? '';
  } catch {
    return '';
  }
};

/** Clave de la marca en disco que usaban versiones anteriores. Solo se borra. */
const LEGACY_WA_UNAVAILABLE_KEY = 'auth.waLoginUnavailableUntil';

/**
 * El contrato pide ocultar el ingreso por WhatsApp cuando el canal está apagado
 * en el servidor (le falta WHATSAPP_BUSINESS_NUMBER). La disponibilidad se
 * pregunta con `whatsAppLoginAvailable`, no se deduce de un rechazo pasado.
 *
 * Antes el rechazo se recordaba en disco por 24 h: cuando el backend habilitaba
 * el canal, la opción seguía enterrada un día entero y el residente no tenía
 * forma de recuperarla salvo borrando los datos de la app — justo el usuario que
 * ya perdió el acceso y necesita ese camino.
 *
 * El resultado se memoriza solo mientras vive el proceso, para no repetir la
 * consulta en cada foco de la pantalla de login. `requestWhatsAppLoginChallenge`
 * lo corrige si el servidor contradice el valor memorizado.
 */
let waAvailability: boolean | null = null;

/** Borra la marca persistida por versiones anteriores. Idempotente. */
const purgeLegacyWaUnavailableFlag = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LEGACY_WA_UNAVAILABLE_KEY);
  } catch {}
};

export const isWhatsAppLoginAvailable = async (): Promise<boolean> => {
  // Una instalación que venía de la versión anterior puede tener la marca vieja
  // guardada; se elimina aquí para que no sobreviva a la actualización.
  await purgeLegacyWaUnavailableFlag();

  if (waAvailability !== null) return waAvailability;

  try {
    const { data } = await apolloClient.query<{ whatsAppLoginAvailable: boolean }>({
      query: WA_LOGIN_AVAILABLE,
      context: { skipAuth: true },
      fetchPolicy: 'network-only',
    });
    waAvailability = data?.whatsAppLoginAvailable ?? true;
    return waAvailability;
  } catch {
    // Sin red o servidor caído: mostrar la opción sin memorizar nada. Esconder
    // un método de recuperación por un fallo de red sería peor que ofrecerlo y
    // que falle con un mensaje claro.
    return true;
  }
};

// ─── Sesión ──────────────────────────────────────────────────────────────────

/**
 * Persiste el par de tokens de cualquiera de los cuatro flujos de login y
 * marca la sesión en el store. Centralizado para que ninguna pantalla olvide
 * calcular `accessTokenExpiresAt` (sin él, el refresh proactivo no dispara).
 */
export async function persistSession(result: LoginResult): Promise<void> {
  await SecureStorageService.saveTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    sessionId: result.sessionId,
    accessTokenExpiresAt: result.expiresIn ? Date.now() + result.expiresIn * 1000 : undefined,
  });
  const { useAuthStore } = await import('../../presentation/store/auth.store');
  useAuthStore.getState().setSession(result.accessToken, result.sessionId);
}

// ─── 01 · Clave de acceso ────────────────────────────────────────────────────

export const ACCESS_CODE_LENGTH = 6;

/**
 * Réplica de la validación del servidor para dar retroalimentación inmediata.
 * El servidor sigue siendo la autoridad: puede rechazar patrones que esto deje
 * pasar, y ese rechazo llega como ACCESS_CODE_TOO_WEAK.
 */
export function validateAccessCode(code: string): string | null {
  const value = code.trim().toUpperCase();

  if (!/^[A-Z0-9]{6}$/.test(value)) {
    return 'La clave debe tener 6 caracteres, solo letras y números';
  }

  // Exigir ambos tipos evita que el espacio alfanumérico se degrade al de un
  // PIN numérico, que es lo que pasa cuando todos eligen solo cifras.
  if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Combina al menos una letra y un número';
  }

  if (/^(.)\1{5}$/.test(value)) return 'Una clave de caracteres repetidos es muy fácil de adivinar';

  if ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(value)) return 'Las secuencias son muy fáciles de adivinar';
  if ('0123456789'.includes(value) || '9876543210'.includes(value)) {
    return 'Las secuencias como 123456 son muy fáciles de adivinar';
  }

  return null;
}

/** Etiqueta por defecto del dispositivo; el usuario puede sobrescribirla. */
export const defaultDeviceLabel = (): string =>
  Platform.OS === 'ios' ? 'Mi iPhone' : 'Mi Android';

/**
 * Fija o cambia la clave de la CUENTA y vincula este equipo.
 *
 * La clave es una sola para todos los dispositivos del residente: vincular uno
 * nuevo no obliga a inventar otra.
 *
 * `currentCode` es obligatorio para CAMBIARLA, salvo que el ingreso reciente
 * haya sido por WhatsApp entrante o aprobación —el camino del olvido—. El
 * servidor decide cuál caso aplica; si falta, responde
 * CURRENT_ACCESS_CODE_REQUIRED.
 */
export async function setAccessCode(
  code: string,
  label?: string,
  currentCode?: string,
): Promise<ResidentDevice> {
  try {
    const { data, error } = await apolloClient.mutate<{ setResidentAccessCode: ResidentDevice }>({
      mutation: SET_ACCESS_CODE,
      variables: {
        input: {
          code: code.trim().toUpperCase(),
          ...(label ? { label: label.slice(0, 120) } : {}),
          // Solo se envía al cambiar una clave existente; al crearla no aplica.
          ...(currentCode ? { currentCode: currentCode.trim().toUpperCase() } : {}),
        },
      },
      fetchPolicy: 'no-cache',
    });
    if (error) throw error;
    if (!data?.setResidentAccessCode) throw new DeviceAuthError('Respuesta inválida del servidor');
    await setDeviceLinked(true);
    // Hay una clave que el residente acaba de elegir: la marca de "la olvidé"
    // dejó de aplicar. El servidor, del lado suyo, también limpia el bloqueo y
    // los intentos fallidos.
    await clearAccessCodeForgotten();
    return data.setResidentAccessCode;
  } catch (e) {
    if (e instanceof DeviceAuthError) throw e;
    throw toDeviceAuthError(e, 'No se pudo guardar la clave. Intenta de nuevo');
  }
}

/**
 * ¿La cuenta ya tiene clave? Se pregunta al servidor, no al almacenamiento
 * local: la clave vive en la cuenta y puede haberse creado desde otro equipo.
 */
export async function hasAccessCode(): Promise<boolean> {
  const { data, error } = await apolloClient.query<{ residentHasAccessCode: boolean }>({
    query: HAS_ACCESS_CODE,
    fetchPolicy: 'network-only',
  });
  if (error) throw toDeviceAuthError(error, 'No se pudo consultar tu clave de acceso');
  return data?.residentHasAccessCode ?? false;
}

export async function loginWithAccessCode(code: string): Promise<LoginResult> {
  try {
    const { data, error } = await apolloClient.mutate<{ loginWithAccessCode: LoginResult }>({
      mutation: LOGIN_WITH_ACCESS_CODE,
      variables: { input: { code: code.trim().toUpperCase() } },
      context: { skipAuth: true },
      fetchPolicy: 'no-cache',
    });
    if (error) throw error;
    if (!data?.loginWithAccessCode) throw new DeviceAuthError('Respuesta inválida del servidor');
    return data.loginWithAccessCode;
  } catch (e) {
    if (e instanceof DeviceAuthError) throw e;
    const err = toDeviceAuthError(e, 'No se pudo iniciar sesión con tu clave');
    // El dispositivo dejó de estar vinculado: no volver a ofrecer la clave primero.
    if (err.code === 'DEVICE_NOT_LINKED' || err.code === 'DEVICE_REVOKED') {
      await setDeviceLinked(false);
    }
    throw err;
  }
}

export async function fetchMyDevices(): Promise<ResidentDevice[]> {
  try {
    const { data, error } = await apolloClient.query<{ myResidentDevices: ResidentDevice[] }>({
      query: MY_DEVICES,
      fetchPolicy: 'network-only',
    });
    if (error) throw error;
    return data?.myResidentDevices ?? [];
  } catch (e) {
    throw toDeviceAuthError(e, 'No se pudieron cargar tus dispositivos');
  }
}

/**
 * Celular perdido: deja vinculado solo el equipo actual y cierra las demás
 * sesiones. Devuelve cuántos se desvincularon.
 */
export async function revokeOtherDevices(): Promise<number> {
  try {
    const { data, error } = await apolloClient.mutate<{ revokeMyOtherDevices: number }>({
      mutation: REVOKE_OTHER_DEVICES,
      fetchPolicy: 'no-cache',
    });
    if (error) throw error;
    return data?.revokeMyOtherDevices ?? 0;
  } catch (e) {
    throw toDeviceAuthError(e, 'No se pudieron desvincular los otros dispositivos');
  }
}

/** `deviceId` aquí es el `id` del registro devuelto por myResidentDevices. */
export async function revokeDevice(deviceId: string): Promise<void> {
  try {
    const { error } = await apolloClient.mutate<{ revokeResidentDevice: boolean }>({
      mutation: REVOKE_DEVICE,
      variables: { deviceId },
      fetchPolicy: 'no-cache',
    });
    if (error) throw error;
  } catch (e) {
    throw toDeviceAuthError(e, 'No se pudo desvincular el dispositivo');
  }
}

// ─── 02 · WhatsApp entrante ──────────────────────────────────────────────────

export async function requestWhatsAppLoginChallenge(
  identity: string,
): Promise<WhatsAppLoginChallenge> {
  try {
    const { data, error } = await apolloClient.mutate<{
      requestWhatsAppLoginChallenge: WhatsAppLoginChallenge;
    }>({
      mutation: REQUEST_WA_LOGIN,
      variables: { identity: identity.trim() },
      context: { skipAuth: true },
      fetchPolicy: 'no-cache',
    });
    if (error) throw error;
    if (!data?.requestWhatsAppLoginChallenge) {
      throw new DeviceAuthError('Respuesta inválida del servidor');
    }
    // El canal respondió: si estaba memorizado como no disponible, ya no lo está.
    waAvailability = true;
    return data.requestWhatsAppLoginChallenge;
  } catch (e) {
    if (e instanceof DeviceAuthError) throw e;
    const err = toDeviceAuthError(e, 'No se pudo iniciar el ingreso por WhatsApp');
    // Solo este código significa "canal apagado". Un fallo de red no debe
    // esconder la opción: el canal puede estar perfectamente disponible.
    if (err.code === 'WA_LOGIN_NOT_CONFIGURED') waAvailability = false;
    throw err;
  }
}

export async function fetchWhatsAppLoginStatus(
  challengeId: string,
): Promise<WhatsAppChallengeStatus> {
  try {
    const { data, error } = await apolloClient.query<{
      whatsAppLoginChallengeStatus: { status: WhatsAppChallengeStatus; expiresAt: string };
    }>({
      query: WA_LOGIN_STATUS,
      variables: { challengeId },
      context: { skipAuth: true },
      fetchPolicy: 'network-only',
    });
    if (error) throw error;
    if (!data?.whatsAppLoginChallengeStatus) throw new DeviceAuthError('Respuesta inválida del servidor');
    return data.whatsAppLoginChallengeStatus.status;
  } catch (e) {
    if (e instanceof DeviceAuthError) throw e;
    throw toDeviceAuthError(e, 'No se pudo consultar el estado del ingreso');
  }
}

/**
 * `accessCode` es obligatorio cuando la cuenta ya tiene clave: enviarse el
 * WhatsApp prueba posesión del teléfono, y quien lo roba se lleva también la
 * línea. La clave aporta el factor que el ladrón no tiene. Si falta, el
 * servidor responde ACCESS_CODE_REQUIRED y la UI la pide sin reiniciar el flujo.
 */
export async function redeemWhatsAppLogin(
  challengeId: string,
  accessCode?: string,
): Promise<LoginResult> {
  try {
    const { data, error } = await apolloClient.mutate<{
      redeemWhatsAppLoginChallenge: LoginResult;
    }>({
      mutation: REDEEM_WA_LOGIN,
      variables: { challengeId, accessCode: accessCode?.trim().toUpperCase() || null },
      context: { skipAuth: true },
      fetchPolicy: 'no-cache',
    });
    if (error) throw error;
    if (!data?.redeemWhatsAppLoginChallenge) throw new DeviceAuthError('Respuesta inválida del servidor');
    return data.redeemWhatsAppLoginChallenge;
  } catch (e) {
    if (e instanceof DeviceAuthError) throw e;
    throw toDeviceAuthError(e, 'No se pudo completar el ingreso por WhatsApp');
  }
}

// ─── 03 · Aprobación por push ────────────────────────────────────────────────

export async function requestDeviceApproval(identity: string): Promise<DeviceApprovalChallenge> {
  try {
    const { data, error } = await apolloClient.mutate<{
      requestDeviceApproval: DeviceApprovalChallenge;
    }>({
      mutation: REQUEST_APPROVAL,
      variables: { identity: identity.trim() },
      context: { skipAuth: true },
      fetchPolicy: 'no-cache',
    });
    if (error) throw error;
    if (!data?.requestDeviceApproval) throw new DeviceAuthError('Respuesta inválida del servidor');
    return data.requestDeviceApproval;
  } catch (e) {
    if (e instanceof DeviceAuthError) throw e;
    throw toDeviceAuthError(e, 'No se pudo solicitar la aprobación');
  }
}

export async function fetchDeviceApprovalStatus(
  challengeId: string,
): Promise<DeviceApprovalStatus> {
  try {
    const { data, error } = await apolloClient.query<{
      deviceApprovalStatus: { status: DeviceApprovalStatus; expiresAt: string };
    }>({
      query: APPROVAL_STATUS,
      variables: { challengeId },
      context: { skipAuth: true },
      fetchPolicy: 'network-only',
    });
    if (error) throw error;
    if (!data?.deviceApprovalStatus) throw new DeviceAuthError('Respuesta inválida del servidor');
    return data.deviceApprovalStatus.status;
  } catch (e) {
    if (e instanceof DeviceAuthError) throw e;
    throw toDeviceAuthError(e, 'No se pudo consultar el estado de la solicitud');
  }
}

/** Mismo criterio que el canje por WhatsApp: ver redeemWhatsAppLogin. */
export async function redeemDeviceApproval(
  challengeId: string,
  accessCode?: string,
): Promise<LoginResult> {
  try {
    const { data, error } = await apolloClient.mutate<{ redeemDeviceApproval: LoginResult }>({
      mutation: REDEEM_APPROVAL,
      variables: { challengeId, accessCode: accessCode?.trim().toUpperCase() || null },
      context: { skipAuth: true },
      fetchPolicy: 'no-cache',
    });
    if (error) throw error;
    if (!data?.redeemDeviceApproval) throw new DeviceAuthError('Respuesta inválida del servidor');
    return data.redeemDeviceApproval;
  } catch (e) {
    if (e instanceof DeviceAuthError) throw e;
    throw toDeviceAuthError(e, 'No se pudo completar el ingreso');
  }
}

export async function fetchPendingDeviceApprovals(): Promise<PendingDeviceApproval[]> {
  try {
    const { data, error } = await apolloClient.query<{
      pendingDeviceApprovals: PendingDeviceApproval[];
    }>({
      query: PENDING_APPROVALS,
      fetchPolicy: 'network-only',
    });
    if (error) throw error;
    return data?.pendingDeviceApprovals ?? [];
  } catch (e) {
    throw toDeviceAuthError(e, 'No se pudieron cargar las solicitudes pendientes');
  }
}

export async function approveDeviceApproval(approvalId: string): Promise<void> {
  try {
    const { error } = await apolloClient.mutate<{ approveDeviceApproval: boolean }>({
      mutation: APPROVE_DEVICE_APPROVAL,
      variables: { approvalId },
      fetchPolicy: 'no-cache',
    });
    if (error) throw error;
  } catch (e) {
    throw toDeviceAuthError(e, 'No se pudo aprobar el ingreso');
  }
}

export async function denyDeviceApproval(approvalId: string): Promise<void> {
  try {
    const { error } = await apolloClient.mutate<{ denyDeviceApproval: boolean }>({
      mutation: DENY_DEVICE_APPROVAL,
      variables: { approvalId },
      fetchPolicy: 'no-cache',
    });
    if (error) throw error;
  } catch (e) {
    throw toDeviceAuthError(e, 'No se pudo rechazar el ingreso');
  }
}

/**
 * FCM obliga a que `metadata` viaje serializado como string: hay que parsearlo
 * antes de usarlo. Devuelve null si el payload no trae un approvalId usable.
 */
export function parseLoginApprovalMetadata(raw?: string): LoginApprovalPushPayload | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed?.approvalId || !parsed?.approvalCode) return null;
    return {
      approvalId: String(parsed.approvalId),
      approvalCode: String(parsed.approvalCode),
      requestedFromLabel: parsed.requestedFromLabel ? String(parsed.requestedFromLabel) : undefined,
      requestedFromIp: parsed.requestedFromIp ? String(parsed.requestedFromIp) : undefined,
      expiresAt: parsed.expiresAt ? String(parsed.expiresAt) : undefined,
    };
  } catch {
    return null;
  }
}
