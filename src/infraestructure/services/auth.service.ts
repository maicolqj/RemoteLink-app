import apolloClient from '../../data/lib/apollo/client';
import { LOGIN_RESIDENT, GET_MY_RESIDENT_PROFILE, REFRESH_TOKEN } from '../../domain/graphql/auth.queries';
import SecureStorageService from './SecureStorageService';
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
    const { data, errors } = await apolloClient.mutate<RefreshTokenResponse>({
      mutation: REFRESH_TOKEN,
      variables: { refreshToken: tokens.refreshToken },
      context: { skipAuth: true },   // no adjuntar Authorization ni reintentar refresh sobre sí mismo
      fetchPolicy: 'no-cache',
    });

    if (errors?.length || !data?.refreshToken) return null;

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
  } catch (e: any) {
    throw new Error(e?.networkError?.message ?? e?.message ?? 'No se pudo conectar al servidor');
  }
  const { data, errors } = mutationResult;
  if (errors?.length) throw new Error(errors[0].message);
  if (!data?.loginResident) throw new Error('Respuesta inválida del servidor');
  return data.loginResident;
}

export async function fetchMyResidentProfile(): Promise<Resident> {
  const { data, errors } = await apolloClient.query<MyResidentProfileResponse>({
    query: GET_MY_RESIDENT_PROFILE,
    fetchPolicy: 'network-only',
  });
  if (errors?.length) throw new Error(errors[0].message);
  if (!data?.myResidentProfile) throw new Error('Perfil no encontrado');
  return data.myResidentProfile;
}
