import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomTextComponent from './CustomTextComponent';
import { useTheme } from '../providers/context/ThemeContext';
import { SPACING, RADIUS } from '../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

type ChipVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

interface StatusChipProps {
  label: string;
  variant?: ChipVariant;
}

export default function StatusChip({ label, variant = 'neutral' }: StatusChipProps) {
  const { colors } = useTheme();

  const chipColors: Record<ChipVariant, { bg: string; text: string }> = {
    success: { bg: colors.successLight, text: colors.success },
    error:   { bg: colors.errorLight,   text: colors.error },
    warning: { bg: colors.warningLight, text: colors.warning },
    info:    { bg: colors.infoLight,    text: colors.info },
    neutral: { bg: colors.border,       text: colors.textSecondary },
  };

  const c = chipColors[variant];

  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.medium as any} color={c.text}>
        {label}
      </CustomTextComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
});
