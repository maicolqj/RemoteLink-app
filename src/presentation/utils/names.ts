/**
 * Los nombres llegan del registro del conjunto tal como los escribió la
 * administración: casi siempre en MAYÚSCULAS y con nombres compuestos
 * ("LILIBETH DE LOS ANGELES"). Estas funciones los preparan para mostrarlos sin
 * tocar el dato original.
 */

/**
 * Partículas que en español van en minúscula dentro de un nombre, salvo cuando
 * abren la línea. Sin esto "de los angeles" quedaría como "De Los Angeles".
 */
const PARTICLES = new Set([
  'de', 'del', 'la', 'las', 'lo', 'los', 'y', 'e', 'da', 'das', 'do', 'dos',
  'van', 'von', 'di', 'san', 'santa',
]);

/**
 * Primer nombre a secas: "LILIBETH DE LOS ANGELES" → "Lilibeth".
 *
 * Para saludar. El nombre completo no cabe en una línea del encabezado y, sobre
 * todo, nadie saluda a nadie por sus cuatro nombres.
 */
export function firstName(value?: string | null): string {
  const first = (value ?? '').trim().split(/\s+/)[0] ?? '';
  return capitalize(first);
}

/**
 * Nombre completo legible: "LILIBETH DE LOS ANGELES" → "Lilibeth de los Angeles".
 *
 * No inventa tildes —"ANGELES" no dice si es "Ángeles"—, solo corrige el uso de
 * mayúsculas, que es lo que hace ilegible un nombre largo en pantalla.
 */
export function formatName(value?: string | null): string {
  const words = (value ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);

  return words
    .map((word, i) => (i > 0 && PARTICLES.has(word) ? word : capitalize(word)))
    .join(' ');
}

/** Respeta guiones y apóstrofes: "d'angelo" → "D'Angelo", "ana-maria" → "Ana-Maria". */
function capitalize(word: string): string {
  if (!word) return '';
  return word
    .toLowerCase()
    .replace(/(^|[-'’])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase());
}
