// =============================================================================
// Conjuntos del residente y cambio de conjunto sin cerrar sesión.
//
// El conjunto viaja en el token: cambiarlo es pedirle al backend un par nuevo
// con el otro conjunto (misma sesión). Aquí solo se piden y guardan los
// tokens; limpiar la app y recargar lo hace `useAuthStore.switchComplex`.
// =============================================================================

import apolloClient from '../../data/lib/apollo/client';
import { GET_MY_RESIDENCES, SWITCH_RESIDENT_COMPLEX } from '../../domain/graphql/residences';
import SecureStorageService from './SecureStorageService';
import { parseApiError } from '../utils/apiError';
import { runExclusive } from './sessionLock';
import { refreshSessionNow } from './auth.service';

/** Mismo margen que el authLink: con menos de 60 s se renueva antes. */
const EXPIRY_MARGIN_MS = 60_000;

export type MyResidence = {
  complexId: string;
  complexName: string;
  buildingName?: string | null;
  unitNumber?: string | null;
  isCurrent: boolean;
  unreadCount: number;
};

type SwitchResponse = {
  switchResidentComplex: { accessToken: string; refreshToken: string; expiresIn?: number | null; sessionId?: string | null };
};

export async function fetchMyResidences(): Promise<MyResidence[]> {
  const { data } = await apolloClient.query<{ myResidences: MyResidence[] }>({
    query: GET_MY_RESIDENCES,
    fetchPolicy: 'no-cache',
  });
  return data?.myResidences ?? [];
}

/**
 * Cambia el conjunto de la sesión. Guarda el par nuevo y devuelve el access
 * token y la sesión para el store. Si falla, los tokens guardados no cambian.
 */
export function requestComplexSwitch(complexId: string): Promise<{ accessToken: string; sessionId?: string }> {
  return runExclusive(async () => {
    const expired = new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    let tokens = await SecureStorageService.getTokens();
    if (!tokens?.refreshToken) throw expired;

    // Dentro de la cola el authLink no puede renovar (esperaría a esta misma
    // tarea): si el access token está por vencer se renueva aquí, y el cambio
    // sale con el token puesto a mano y skipAuth.
    const expiresAt = tokens.accessTokenExpiresAt;
    if (!expiresAt || expiresAt - Date.now() < EXPIRY_MARGIN_MS) {
      if (!(await refreshSessionNow())) throw expired;
      tokens = await SecureStorageService.getTokens();
      if (!tokens?.refreshToken) throw expired;
    }

    const { data, error } = await apolloClient.mutate<SwitchResponse>({
      mutation: SWITCH_RESIDENT_COMPLEX,
      variables: { complexId, refreshToken: tokens.refreshToken },
      fetchPolicy: 'no-cache',
      context: { skipAuth: true, headers: { authorization: `Bearer ${tokens.accessToken}` } },
    });
    const r = data?.switchResidentComplex;
    if (error || !r) {
      throw new Error(parseApiError(error, 'No se pudo cambiar de conjunto. Intenta de nuevo.').message);
    }

    const sessionId = r.sessionId ?? tokens.sessionId;
    await SecureStorageService.saveTokens({
      accessToken: r.accessToken,
      refreshToken: r.refreshToken,
      sessionId,
      accessTokenExpiresAt: r.expiresIn ? Date.now() + r.expiresIn * 1000 : undefined,
    });
    return { accessToken: r.accessToken, sessionId };
  });
}
