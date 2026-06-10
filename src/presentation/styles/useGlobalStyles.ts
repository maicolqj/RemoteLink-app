import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../providers/context/ThemeContext';
import { SPACING, RADIUS } from '../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

export function useGlobalStyles() {
  const { colors } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.background,
        },
        screenPadded: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: SPACING.md,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        },
        cardElevated: {
          backgroundColor: colors.surface,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        rowBetween: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        rowCenter: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        textPrimary: {
          fontSize: FONT_SIZE.md,
          fontWeight: FONT_WEIGHT.regular,
          color: colors.textPrimary,
        },
        textSecondary: {
          fontSize: FONT_SIZE.sm,
          fontWeight: FONT_WEIGHT.regular,
          color: colors.textSecondary,
        },
        textLabel: {
          fontSize: FONT_SIZE.sm,
          fontWeight: FONT_WEIGHT.medium,
          color: colors.textPrimary,
        },
        textCaption: {
          fontSize: FONT_SIZE.xs,
          color: colors.textTertiary,
        },
        divider: {
          height: 1,
          backgroundColor: colors.border,
          marginVertical: SPACING.sm,
        },
        spacerSm: { height: SPACING.sm },
        spacerMd: { height: SPACING.md },
        spacerLg: { height: SPACING.lg },
        flex1: { flex: 1 },
        center: { alignItems: 'center', justifyContent: 'center' },
        section: {
          marginBottom: SPACING.lg,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACING.sm,
          paddingHorizontal: SPACING.md,
        },
        listContent: {
          padding: SPACING.md,
          paddingBottom: SPACING.xxl,
        },
        badgeContainer: {
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: colors.error,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
        },
        badgeText: {
          fontSize: 10,
          fontWeight: FONT_WEIGHT.bold,
          color: colors.textInverse,
        },
      }),
    [colors],
  );
}
