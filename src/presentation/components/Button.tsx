import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, View, type ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from './CustomTextComponent';
import { useTheme } from '../providers/context/ThemeContext';
import { SPACING, RADIUS, TOUCH_TARGET } from '../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZE_STYLES = {
  sm: { height: 36, fontSize: FONT_SIZE.sm, px: SPACING.md, iconSize: 16 },
  md: { height: TOUCH_TARGET, fontSize: FONT_SIZE.md, px: SPACING.lg, iconSize: 20 },
  lg: { height: 52, fontSize: FONT_SIZE.lg, px: SPACING.xl, iconSize: 22 },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const s = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary:   { bg: colors.primary,       text: colors.textInverse, border: colors.primary },
    secondary: { bg: colors.primarySurface, text: colors.primary,    border: colors.primarySurface },
    outline:   { bg: 'transparent',         text: colors.primary,    border: colors.primary },
    ghost:     { bg: 'transparent',         text: colors.textSecondary, border: 'transparent' },
    danger:    { bg: colors.error,          text: colors.textInverse, border: colors.error },
  };

  const v = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border, height: s.height, paddingHorizontal: s.px },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Icon name={icon} size={s.iconSize} color={v.text} style={styles.iconLeft} />
          )}
          <CustomTextComponent
            color={v.text}
            fontSize={s.fontSize}
            fontWeight={FONT_WEIGHT.semibold as any}>
            {label}
          </CustomTextComponent>
          {icon && iconPosition === 'right' && (
            <Icon name={icon} size={s.iconSize} color={v.text} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: SPACING.xs,
  },
  iconRight: {
    marginLeft: SPACING.xs,
  },
});
