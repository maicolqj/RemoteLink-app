import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

// ─── Palettes ─────────────────────────────────────────────────────────────────

export const lightColors = {
  primary:       '#1E40AF',
  primaryLight:  '#3B82F6',
  primaryDark:   '#1E3A8A',
  primarySurface:'#EFF6FF',

  accent:        '#F59E0B',
  accentLight:   '#FEF3C7',

  success:       '#10B981',
  successLight:  '#D1FAE5',
  error:         '#EF4444',
  errorLight:    '#FEE2E2',
  warning:       '#F59E0B',
  warningLight:  '#FEF3C7',
  info:          '#3B82F6',
  infoLight:     '#DBEAFE',

  background:    '#F1F5F9',
  surface:       '#FFFFFF',
  border:        '#E2E8F0',
  divider:       '#F8FAFC',

  textPrimary:   '#0F172A',
  textSecondary: '#64748B',
  textTertiary:  '#94A3B8',
  textInverse:   '#FFFFFF',
  textDisabled:  '#CBD5E1',

  overlay:       'rgba(0,0,0,0.5)',
  overlayLight:  'rgba(0,0,0,0.15)',

  tabBarActive:  '#1E40AF',
  tabBarInactive:'#94A3B8',
  tabBarBg:      '#FFFFFF',
};

export const darkColors: typeof lightColors = {
  primary:       '#3B82F6',
  primaryLight:  '#60A5FA',
  primaryDark:   '#1E40AF',
  primarySurface:'#1E3A5F',

  accent:        '#FBBF24',
  accentLight:   '#78350F',

  success:       '#34D399',
  successLight:  '#064E3B',
  error:         '#F87171',
  errorLight:    '#7F1D1D',
  warning:       '#FBBF24',
  warningLight:  '#78350F',
  info:          '#60A5FA',
  infoLight:     '#1E3A5F',

  background:    '#0F172A',
  surface:       '#1E293B',
  border:        '#334155',
  divider:       '#1E293B',

  textPrimary:   '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary:  '#64748B',
  textInverse:   '#0F172A',
  textDisabled:  '#475569',

  overlay:       'rgba(0,0,0,0.7)',
  overlayLight:  'rgba(0,0,0,0.3)',

  tabBarActive:  '#60A5FA',
  tabBarInactive:'#64748B',
  tabBarBg:      '#1E293B',
};

export type AppColors = typeof lightColors;
export type ThemeMode = 'light' | 'dark' | 'system';

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextType {
  mode:        ThemeMode;
  isDark:      boolean;
  colors:      AppColors;
  setMode:     (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const isDark = useMemo(
    () => (mode === 'system' ? systemScheme === 'dark' : mode === 'dark'),
    [mode, systemScheme],
  );

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const toggleTheme = useCallback(() => {
    setMode(prev => {
      if (prev === 'system') return isDark ? 'light' : 'dark';
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, [isDark]);

  const value = useMemo<ThemeContextType>(
    () => ({ mode, isDark, colors, setMode, toggleTheme }),
    [mode, isDark, colors, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
