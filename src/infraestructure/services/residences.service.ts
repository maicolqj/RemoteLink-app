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
    const tokens = await SecureStorageService.getTokens();
    if (!tokens?.refreshToken) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');

    const { data, error } = await apolloClient.mutate<SwitchResponse>({
      mutation: SWITCH_RESIDENT_COMPLEX,
      variables: { complexId, refreshToken: tokens.refreshToken },
      fetchPolicy: 'no-cache',
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
