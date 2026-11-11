/**
 * "Torre 2 · Apto 301", o "Unidad 12" cuando la unidad no tiene torre (casas).
 * Un conjunto de casas no tiene torres: leer `unit.building.name` sin más
 * tumba la pantalla al cambiar a ese conjunto.
 */
export function residentUnitLabel(
  unit?: { number?: string | null; building?: { name?: string | null } | null } | null,
): string {
  if (!unit?.number) return '';

  const building = unit.building?.name?.trim();
  if (!building) return `Unidad ${unit.number}`;

  return `${building} · Apto ${unit.number}`;
}
