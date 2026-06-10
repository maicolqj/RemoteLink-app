import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from './CustomTextComponent';
import Button from './Button';
import { useTheme } from '../providers/context/ThemeContext';
import { SPACING } from '../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.border }]}>
        <Icon name={icon} size={48} color={colors.textTertiary} />
      </View>
      <CustomTextComponent
        fontSize={FONT_SIZE.lg}
        fontWeight={FONT_WEIGHT.semibold as any}
        color={colors.textPrimary}
        textAlign="center"
        style={styles.title}>
        {title}
      </CustomTextComponent>
      {description ? (
        <CustomTextComponent
          fontSize={FONT_SIZE.sm}
          color={colors.textSecondary}
          textAlign="center"
          style={styles.description}>
          {description}
        </CustomTextComponent>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  description: {
    lineHeight: FONT_SIZE.sm * 1.5,
  },
  action: {
    marginTop: SPACING.md,
  },
});
