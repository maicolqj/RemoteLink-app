// =============================================================================
// "Tus conjuntos": el residente que vive en varios conjuntos elige cuál ver.
//
// Muestra cada conjunto con su torre/apartamento y los avisos sin leer. Tocar
// otro conjunto cambia la sesión (useAuthStore.switchComplex); el actual lleva
// un check y no hace nada.
// =============================================================================

import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomBottomModalComponent from '../CustomBottomModalComponent';
import CustomTextComponent from '../CustomTextComponent';
import { useTheme } from '../../providers/context/ThemeContext';
import type { MyResidence } from '../../../infraestructure/services/residences.service';

type Props = {
  visible: boolean;
  residences: MyResidence[];
  onClose: () => void;
  onSelect: (residence: MyResidence) => Promise<void>;
};

const ON_ERROR = '#FFFFFF';

function unitLine(r: MyResidence): string {
  return [
    r.buildingName ? `Torre ${r.buildingName}` : null,
    r.unitNumber ? `Apto ${r.unitNumber}` : null,
  ].filter(Boolean).join(' · ');
}

export function ComplexSwitcherSheet({ visible, residences, onClose, onSelect }: Props) {
  const { colors } = useTheme();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handlePress = async (r: MyResidence) => {
    if (r.isCurrent || pendingId) return;
    setPendingId(r.complexId);
    try {
      await onSelect(r);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <CustomBottomModalComponent
      isVisible={visible}
      onClose={onClose}
      autoHeight
      backgroundColor={colors.surface}
      handleColor={colors.border}
      overlayColor={colors.overlay}
      paddingHorizontal={20}
      paddingBottom={28}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primarySurface }]}>
          <Icon name="apartment" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <CustomTextComponent style={[styles.title, { color: colors.textPrimary }]}>
            Tus conjuntos
          </CustomTextComponent>
          <CustomTextComponent style={[styles.subtitle, { color: colors.textSecondary }]}>
            Elige cuál quieres ver.
          </CustomTextComponent>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {residences.map(r => {
          const line = unitLine(r);
          const pending = pendingId === r.complexId;
          return (
            <TouchableOpacity
              key={r.complexId}
              activeOpacity={0.8}
              disabled={!!pendingId}
              style={[
                styles.option,
                {
                  borderColor: r.isCurrent ? colors.primary : colors.border,
                  backgroundColor: r.isCurrent ? colors.primarySurface : colors.background,
                },
              ]}
              onPress={() => { handlePress(r); }}
              accessibilityRole="radio"
              accessibilityState={{ selected: r.isCurrent }}>
              <View style={styles.optionText}>
                <CustomTextComponent
                  style={[styles.optionName, { color: colors.textPrimary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {r.complexName}
                </CustomTextComponent>
                {!!line && (
                  <CustomTextComponent style={[styles.optionNote, { color: colors.textSecondary }]} numberOfLines={1}>
                    {line}
                  </CustomTextComponent>
                )}
              </View>
              {r.unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <CustomTextComponent style={[styles.badgeText, { color: ON_ERROR }]}>
                    {r.unreadCount > 99 ? '99+' : r.unreadCount}
                  </CustomTextComponent>
                </View>
              )}
              {pending
                ? <ActivityIndicator color={colors.primary} />
                : r.isCurrent && <Icon name="check-circle" size={22} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </CustomBottomModalComponent>
  );
}

const { height: SCREEN_H } = Dimensions.get('window');

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { fontSize: 19, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  list: { maxHeight: SCREEN_H * 0.6, flexGrow: 0 },
  listContent: { gap: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
  },
  optionText: { flex: 1 },
  optionName: { fontSize: 16, fontWeight: '600' },
  optionNote: { fontSize: 13, marginTop: 4 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
