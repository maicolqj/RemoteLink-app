// Color palette for RemoteLink — used by AlertContext and Custom components.
// ColorsApp[key](opacity?) returns a hex string or rgba string.

export type GlobalColors = {
  primary:       string;
  primaryLight:  string;
  secondary:     string;
  success:       string;
  danger:        string;
  warning:       string;
  info:          string;
  accent:        string;
  white:         string;
  black:         string;
  text:          string;
  textSecondary: string;
  background:    string;
  surface:       string;
  border:        string;
};

const BASE: GlobalColors = {
  primary:       '#1E40AF',
  primaryLight:  '#3B82F6',
  secondary:     '#64748B',
  success:       '#10B981',
  danger:        '#EF4444',
  warning:       '#F59E0B',
  info:          '#3B82F6',
  accent:        '#F59E0B',
  white:         '#FFFFFF',
  black:         '#000000',
  text:          '#0F172A',
  textSecondary: '#64748B',
  background:    '#F1F5F9',
  surface:       '#FFFFFF',
  border:        '#E2E8F0',
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

type ColorFn = (opacity?: number) => string;
export type ColorsAppType = { [K in keyof GlobalColors]: ColorFn };

export const ColorsApp: ColorsAppType = Object.fromEntries(
  Object.entries(BASE).map(([key, value]) => [
    key,
    (opacity?: number) => (opacity !== undefined && opacity < 1 ? hexToRgba(value, opacity) : value),
  ]),
) as ColorsAppType;
