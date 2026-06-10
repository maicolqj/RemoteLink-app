import React from 'react';
import { TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../providers/context/ThemeContext';
import { SPACING, RADIUS } from '../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  padding?: number;
}

export default function Card({ children, onPress, style, elevated = false, padding }: CardProps) {
  const { colors } = useTheme();

  const cardStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: colors.surface,
      borderRadius: elevated ? RADIUS.lg : RADIUS.md,
      padding: padding !== undefined ? padding : SPACING.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevated ? 4 : 1 },
      shadowOpacity: elevated ? 0.1 : 0.06,
      shadowRadius: elevated ? 12 : 4,
      elevation: elevated ? 4 : 2,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}
