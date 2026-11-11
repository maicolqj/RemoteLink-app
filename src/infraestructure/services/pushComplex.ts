// =============================================================================
// Antes de abrir un aviso tocado desde la notificación: si es de otro conjunto
// donde vive el residente, se cambia a ese conjunto (todo lo de la app se
// pide con el conjunto de la sesión, y el detalle de otro conjunto falla).
// =============================================================================

// Hermes trae atob; los tipos de RN no lo declaran (igual que en apollo/client).
declare function atob(data: string): string;

import { useAuthStore } from '../../presentation/store/auth.store';
import { complexSwitchTarget } from '../../presentation/utils/complexSwitchTarget';
import { fetchMyResidences } from './residences.service';
import SecureStorageService from './SecureStorageService';

/** El conjunto de la sesión según el access token guardado (sin verificar firma: solo para comparar). */
async function complexIdFromStoredToken(): Promise<string | undefined> {
  try {
    const token = (await SecureStorageService.getTokens())?.accessToken;
    const part = token?.split('.')[1];
    if (!part) return undefined;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const complexId = (JSON.parse(json) as { complexId?: unknown }).complexId;
    return typeof complexId === 'string' ? complexId : undefined;
  } catch {
    return undefined;
  }
}

/**
 * - `none`: es del conjunto abierto (o no se sabe): abrir normal.
 * - `switch`: ya se cambió de conjunto: abrir normal.
 * - `inbox`: no se puede abrir en su conjunto: llevar a la bandeja.
 */
export async function prepareComplexForPush(
  pushComplexId: string | undefined,
): Promise<'none' | 'switch' | 'inbox'> {
  const { resident, switchComplex } = useAuthStore.getState();
  if (!pushComplexId) return 'none';
  // App recién abierta desde la notificación: la ficha todavía no llegó, pero
  // el token guardado ya dice en qué conjunto está la sesión.
  const currentId = resident?.complex?.id ?? (await complexIdFromStoredToken());
  if (!currentId || pushComplexId === currentId) return 'none';

  try {
    const residences = await fetchMyResidences();
    const target = complexSwitchTarget(pushComplexId, currentId, residences);
    if (target !== 'switch') return target;
    const name = residences.find(r => r.complexId === pushComplexId)?.complexName ?? '';
    await switchComplex(pushComplexId, name);
    return 'switch';
  } catch {
    return 'inbox';
  }
}
