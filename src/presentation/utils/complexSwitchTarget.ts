import type { MyResidence } from '../../infraestructure/services/residences.service';

/**
 * Qué hacer al tocar un aviso según su conjunto:
 * - `none`: es del conjunto abierto (o no dice de cuál) → abrirlo normal.
 * - `switch`: es de otro conjunto donde vive → cambiar y luego abrirlo.
 * - `inbox`: es de un conjunto donde ya no vive → solo la bandeja.
 */
export function complexSwitchTarget(
  pushComplexId: string | undefined,
  currentComplexId: string | undefined,
  residences: ReadonlyArray<Pick<MyResidence, 'complexId'>>,
): 'none' | 'switch' | 'inbox' {
  if (!pushComplexId || pushComplexId === currentComplexId) return 'none';
  return residences.some(r => r.complexId === pushComplexId) ? 'switch' : 'inbox';
}
