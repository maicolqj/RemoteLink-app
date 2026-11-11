// =============================================================================
// Antes de abrir un aviso tocado desde la notificación: si es de otro conjunto
// donde vive el residente, se cambia a ese conjunto (todo lo de la app se
// pide con el conjunto de la sesión, y el detalle de otro conjunto falla).
// =============================================================================

import { useAuthStore } from '../../presentation/store/auth.store';
import { complexSwitchTarget } from '../../presentation/utils/complexSwitchTarget';
import { fetchMyResidences } from './residences.service';

/**
 * - `none`: es del conjunto abierto (o no se sabe): abrir normal.
 * - `switch`: ya se cambió de conjunto: abrir normal.
 * - `inbox`: no se puede abrir en su conjunto: llevar a la bandeja.
 */
export async function prepareComplexForPush(
  pushComplexId: string | undefined,
): Promise<'none' | 'switch' | 'inbox'> {
  const { resident, switchComplex } = useAuthStore.getState();
  const currentId = resident?.complex?.id;
  // Sin ficha todavía (arranque en frío) no hay contra qué comparar.
  if (!currentId || !pushComplexId || pushComplexId === currentId) return 'none';

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
