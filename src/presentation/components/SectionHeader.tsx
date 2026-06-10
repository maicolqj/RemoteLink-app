import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import CustomTextComponent from './CustomTextComponent';
import { useTheme } from '../providers/context/ThemeContext';
import { useGlobalStyles } from '../styles/useGlobalStyles';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();

  return (
    <View style={gs.rowBetween}>
      <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary}>
        {title}
      </CustomTextComponent>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.primary}>
            {actionLabel}
          </CustomTextComponent>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
