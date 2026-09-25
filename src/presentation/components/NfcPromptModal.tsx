import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from './CustomTextComponent';
import { useTheme } from '../providers/context/ThemeContext';
import { SPACING, RADIUS } from '../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

/**
 * "Acerca el celular al chip". Android no muestra nada propio mientras espera
 * un tag, así que sin esto la pantalla parece congelada.
 */
export function NfcPromptModal({
  visible, title, message, onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Icon name="nfc" size={48} color={colors.primary} />
          <CustomTextComponent
            fontSize={FONT_SIZE.lg}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textPrimary}>
            {title}
          </CustomTextComponent>
          <CustomTextComponent
            fontSize={FONT_SIZE.sm}
            color={colors.textSecondary}
            style={styles.message}>
            {message}
          </CustomTextComponent>
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.cancel, { borderColor: colors.border }]}
            accessibilityRole="button">
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              fontWeight={FONT_WEIGHT.medium as any}
              color={colors.textPrimary}>
              Cancelar
            </CustomTextComponent>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: {
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  message: { textAlign: 'center' },
  spinner: { marginTop: SPACING.sm },
  cancel: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
});
