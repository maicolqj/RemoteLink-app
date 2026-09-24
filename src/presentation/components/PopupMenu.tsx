import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from './CustomTextComponent';
import { useTheme } from '../providers/context/ThemeContext';
import { SPACING, RADIUS } from '../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

export interface PopupMenuItem {
  key: string;
  label: string;
  icon?: string;
  /** Acción que no se deshace o que expone algo (bloquear, reportar): en rojo. */
  danger?: boolean;
  onPress: () => void;
}

interface PopupMenuProps {
  visible: boolean;
  onDismiss: () => void;
  items: PopupMenuItem[];
  /** Encabezado opcional, para cuando el menú hace una pregunta. */
  title?: string;
  /** Una línea de explicación bajo el título. */
  description?: string;
}

/** Alto del AppHeader: el menú se abre justo debajo de sus acciones. */
const HEADER_HEIGHT = 56;

/**
 * Menú desplegable anclado arriba a la derecha, bajo los tres puntos del
 * encabezado —como el `Menu` de Material/Paper, sin sumar la librería—.
 *
 * Reemplaza al alert para listas de opciones: el alert pinta los botones en
 * fila y con textos largos los recorta ("…aviso"), mientras que aquí cada
 * opción ocupa su renglón completo con su ícono. Se cierra tocando afuera o
 * con el botón atrás de Android.
 */
export default function PopupMenu({
  visible,
  onDismiss,
  items,
  title,
  description,
}: PopupMenuProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View
          // El toque dentro del menú no debe cerrarlo por el backdrop.
          onStartShouldSetResponder={() => true}
          style={[
            styles.menu,
            {
              top: insets.top + HEADER_HEIGHT - SPACING.xs,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          {!!title && (
            <View
              style={[styles.header, { borderBottomColor: colors.divider }]}>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                fontWeight={FONT_WEIGHT.semibold as any}
                color={colors.textPrimary}>
                {title}
              </CustomTextComponent>
              {!!description && (
                <CustomTextComponent
                  fontSize={FONT_SIZE.xs}
                  color={colors.textSecondary}
                  style={styles.description}>
                  {description}
                </CustomTextComponent>
              )}
            </View>
          )}

          {items.map(item => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.6}
              onPress={() => {
                onDismiss();
                item.onPress();
              }}
              style={styles.item}>
              {!!item.icon && (
                <Icon
                  name={item.icon}
                  size={20}
                  color={item.danger ? colors.error : colors.textSecondary}
                />
              )}
              <CustomTextComponent
                fontSize={FONT_SIZE.md}
                color={item.danger ? colors.error : colors.textPrimary}
                style={styles.itemLabel}>
                {item.label}
              </CustomTextComponent>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  menu: {
    position: 'absolute',
    right: SPACING.sm,
    minWidth: 230,
    maxWidth: 300,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  description: { marginTop: 2 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: 48,
    paddingHorizontal: SPACING.md,
  },
  itemLabel: { flexShrink: 1 },
});
