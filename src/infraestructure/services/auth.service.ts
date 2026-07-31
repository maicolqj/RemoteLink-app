import apolloClient from '../../data/lib/apollo/client';
import { LOGIN_RESIDENT, GET_MY_RESIDENT_PROFILE, REFRESH_TOKEN, RESEND_SYSTEM_CODE } from '../../domain/graphql/auth.queries';
import SecureStorageService from './SecureStorageService';
import { getApiErrorMessage, parseApiError, type ParsedApiError } from '../utils/apiError';
import type { Resident } from '../../presentation/store/auth.store';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
}

interface LoginResidentResponse {
  loginResident: LoginResult;
}

interface MyResidentProfileResponse {
  myResidentProfile: Resident;
}

interface RefreshTokenResponse {
  refreshToken: LoginResult;
}

interface ResendSystemCodeResponse {
  resendResidentSystemCode: { success: boolean; message: string };
}

export interface RequestSystemCodeResult {
  success: boolean;
  /** Mensaje genérico del backend, apto para mostrarse tal cual al usuario. */
  message: string;
}

/** Error del reenvío de código; `rateLimited` indica que hay que seguir bloqueando el botón. */
export class RequestSystemCodeError extends Error {
  readonly rateLimited: boolean;
  constructor(message: string, rateLimited: boolean) {
    super(message);
    this.name = 'RequestSystemCodeError';
    this.rateLimited = rateLimited;
  }
}

const RATE_LIMIT_CODES = ['TOO_MANY_REQUESTS', 'RATE_LIMITED', 'THROTTLED', 'RATE_LIMIT_EXCEEDED'];

/** El backend limita a 3 reenvíos por identidad cada 10 min (+ límite por IP). */
const isRateLimitError = (parsed: ParsedApiError): boolean =>
  parsed.statusCode === 429 ||
  (!!parsed.code && RATE_LIMIT_CODES.includes(parsed.code)) ||
  /demasiad|too many|espera|intenta (de nuevo )?m[áa]s tarde/i.test(parsed.message);

/**
 * Canjea el refreshToken almacenado por un nuevo par de tokens.
 * Se registra como callback de `tokenRefreshService`, por lo que el authLink y
 * el errorLink la invocan automáticamente (proactiva o reactivamente).
 * Retorna el nuevo accessToken, o `null` si el refresh falla (sesión muerta).
 */
export async function refreshSession(): Promise<string | null> {
  const tokens = await SecureStorageService.getTokens();
  if (!tokens?.refreshToken) return null;

  try {
    const { data, error } = await apolloClient.mutate<RefreshTokenResponse>({
      mutation: REFRESH_TOKEN,
      variables: { refreshToken: tokens.refreshToken },
      context: { skipAuth: true },   // no adjuntar Authorization ni reintentar refresh sobre sí mismo
      fetchPolicy: 'no-cache',
    });

    if (error || !data?.refreshToken) return null;

    const r = data.refreshToken;
    await SecureStorageService.saveTokens({
      accessToken: r.accessToken,
      refreshToken: r.refreshToken,
      sessionId: r.sessionId ?? tokens.sessionId,
      accessTokenExpiresAt: r.expiresIn ? Date.now() + r.expiresIn * 1000 : undefined,
    });

    const { useAuthStore } = await import('../../presentation/store/auth.store');
    useAuthStore.getState().setSession(r.accessToken, r.sessionId ?? tokens.sessionId ?? '');

    return r.accessToken;
  } catch (e: unknown) {
    if (__DEV__) console.warn('[auth] refreshSession error:', e instanceof Error ? e.message : e);
    return null;
  }
}

export async function loginResident(
  identity: string,
  systemCode: string,
): Promise<LoginResult> {
  let mutationResult: Awaited<ReturnType<typeof apolloClient.mutate<LoginResidentResponse>>>;
  try {
    mutationResult = await apolloClient.mutate<LoginResidentResponse>({
      mutation: LOGIN_RESIDENT,
      variables: { input: { identity, systemCode } },
    });
  } catch (e: unknown) {
    throw new Error(getApiErrorMessage(e, 'No se pudo conectar al servidor'));
  }
  const { data, error } = mutationResult;
  if (error) throw new Error(getApiErrorMessage(error, 'Identidad o código incorrecto'));
  if (!data?.loginResident) throw new Error('Respuesta inválida del servidor');
  return data.loginResident;
}

/**
 * Solicita el reenvío del código de sistema (RES-xxxxx) por WhatsApp.
 * Mutation pública: no adjunta Authorization (`skipAuth`).
 *
 * El backend responde siempre con un mensaje genérico (anti-enumeración: no
 * revela si la identidad existe), por lo que `message` debe mostrarse tal cual
 * al usuario sin sustituirlo por lógica propia. `debugCode` solo existe en dev
 * y a propósito no se pide en la operación.
 */
export async function requestSystemCode(identity: string): Promise<RequestSystemCodeResult> {
  let mutationResult: Awaited<ReturnType<typeof apolloClient.mutate<ResendSystemCodeResponse>>>;
  try {
    mutationResult = await apolloClient.mutate<ResendSystemCodeResponse>({
      mutation: RESEND_SYSTEM_CODE,
      variables: { identity: identity.trim() },
      context: { skipAuth: true },
    });
  } catch (e: unknown) {
    const parsed = parseApiError(e, 'No se pudo conectar al servidor');
    throw new RequestSystemCodeError(parsed.message, isRateLimitError(parsed));
  }
  const { data, error } = mutationResult;
  if (error) {
    const parsed = parseApiError(error, 'No se pudo enviar el código. Intenta de nuevo');
    throw new RequestSystemCodeError(parsed.message, isRateLimitError(parsed));
  }
  if (!data?.resendResidentSystemCode) {
    throw new RequestSystemCodeError('Respuesta inválida del servidor', false);
  }
  const { success, message } = data.resendResidentSystemCode;
  return { success, message };
}

export async function fetchMyResidentProfile(): Promise<Resident> {
  const { data, error } = await apolloClient.query<MyResidentProfileResponse>({
    query: GET_MY_RESIDENT_PROFILE,
    fetchPolicy: 'network-only',
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo cargar tu perfil'));
  if (!data?.myResidentProfile) throw new Error('Perfil no encontrado');
  return data.myResidentProfile;
}
