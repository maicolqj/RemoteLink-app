import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apolloClient from '../../data/lib/apollo/client';
import {
  SET_DEVICE_PIN,
  LOGIN_WITH_DEVICE_PIN,
  MY_DEVICES,
  REVOKE_DEVICE,
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
 * tipado del backend (DEVICE_PIN_INVALID, APPROVAL_DENIED, …). La UI debe
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
  lockedUntil?: string | null;
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

const PIN_LINKED_KEY = 'auth.devicePinLinked';
const LAST_IDENTITY_KEY = 'auth.lastIdentity';
const PIN_PROMPT_KEY = 'auth.devicePinPromptShown';

/**
 * Pista local de "este dispositivo ya tiene PIN". No es una credencial ni una
 * fuente de verdad: solo decide qué pantalla de login se muestra primero. La
 * autoridad es el backend, que responde DEVICE_NOT_LINKED si no coincide.
 * Debe sobrevivir al logout, igual que el x-device-id.
 */
export const setDevicePinLinked = async (linked: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(PIN_LINKED_KEY, linked ? '1' : '0');
  } catch {}
};

export const isDevicePinLinked = async (): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(PIN_LINKED_KEY)) === '1';
  } catch {
    return false;
  }
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

export const wasPinPromptShown = async (): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(PIN_PROMPT_KEY)) === '1';
  } catch {
    return true; // ante la duda no molestar
  }
};

export const markPinPromptShown = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(PIN_PROMPT_KEY, '1');
  } catch {}
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

// ─── 01 · PIN de dispositivo ─────────────────────────────────────────────────

export const PIN_LENGTH = 6;

/**
 * Réplica de la validación del servidor para dar retroalimentación inmediata.
 * El servidor sigue siendo la autoridad: puede rechazar patrones que esto deje
 * pasar, y ese rechazo llega como DEVICE_PIN_TOO_WEAK.
 */
export function validatePinStrength(pin: string): string | null {
  if (!/^\d{6}$/.test(pin)) return 'El PIN debe tener exactamente 6 dígitos';

  if (/^(\d)\1{5}$/.test(pin)) return 'Un PIN de dígitos repetidos es demasiado fácil de adivinar';

  const digits = pin.split('').map(Number);
  const ascending = digits.every((d, i) => i === 0 || d === (digits[i - 1] + 1) % 10);
  const descending = digits.every((d, i) => i === 0 || d === (digits[i - 1] + 9) % 10);
  if (ascending || descending) return 'Las secuencias como 123456 son demasiado fáciles de adivinar';

  // Patrones repetidos: 121212 (par de 2) y 123123 (par de 3).
  if (pin.slice(0, 2) === pin.slice(2, 4) && pin.slice(2, 4) === pin.slice(4, 6)) {
    return 'Ese patrón es demasiado fácil de adivinar';
  }
  if (pin.slice(0, 3) === pin.slice(3, 6)) {
    return 'Ese patrón es demasiado fácil de adivinar';
  }

  return null;
}

/** Etiqueta por defecto del dispositivo; el usuario puede sobrescribirla. */
export const defaultDeviceLabel = (): string =>
  Platform.OS === 'ios' ? 'Mi iPhone' : 'Mi Android';

export async function setResidentDevicePin(
  pin: string,
  label?: string,
): Promise<ResidentDevice> {
  try {
    const { data, error } = await apolloClient.mutate<{ setResidentDevicePin: ResidentDevice }>({
      mutation: SET_DEVICE_PIN,
      variables: { input: { pin, ...(label ? { label: label.slice(0, 120) } : {}) } },
      fetchPolicy: 'no-cache',
    });
    if (error) throw error;
    if (!data?.setResidentDevicePin) throw new DeviceAuthError('Respuesta inválida del servidor');
    await setDevicePinLinked(true);
    return data.setResidentDevicePin;
  } catch (e) {
    if (e instanceof DeviceAuthError) throw e;
    throw toDeviceAuthError(e, 'No se pudo guardar el PIN. Intenta de nuevo');
  }
}

export async function loginWithDevicePin(pin: string): Promise<LoginResult> {
  try {
    const { data, error } = await apolloClient.mutate<{ loginWithDevicePin: LoginResult }>({
      mutation: LOGIN_WITH_DEVICE_PIN,
      variables: { input: { pin } },
      context: { skipAuth: true },
      fetchPolicy: 'no-cache',
    });
    if (error) throw error;
    if (!data?.loginWithDevicePin) throw new DeviceAuthError('Respuesta inválida del servidor');
    return data.loginWithDevicePin;
  } catch (e) {
    if (e instanceof DeviceAuthError) throw e;
    const err = toDeviceAuthError(e, 'No se pudo iniciar sesión con el PIN');
    // El dispositivo dejó de estar vinculado: no volver a ofrecer el PIN primero.
    if (err.code === 'DEVICE_NOT_LINKED' || err.code === 'DEVICE_REVOKED') {
      await setDevicePinLinked(false);
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

export async function redeemWhatsAppLogin(challengeId: string): Promise<LoginResult> {
  try {
    const { data, error } = await apolloClient.mutate<{
      redeemWhatsAppLoginChallenge: LoginResult;
    }>({
      mutation: REDEEM_WA_LOGIN,
      variables: { challengeId },
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

export async function redeemDeviceApproval(challengeId: string): Promise<LoginResult> {
  try {
    const { data, error } = await apolloClient.mutate<{ redeemDeviceApproval: LoginResult }>({
      mutation: REDEEM_APPROVAL,
      variables: { challengeId },
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
