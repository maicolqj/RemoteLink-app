import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VisitType } from '../../domain/enums/enums';

// ─── Config ───────────────────────────────────────────────────────────────────

export const VISIT_TYPE_CFG: Record<string, { label: string; icon: string; color: string }> = {
  [VisitType.WALK_IN]:          { label: 'Sin cita',   icon: 'directions-walk', color: '#55C2DA' },
  [VisitType.SCHEDULED]:        { label: 'Programada', icon: 'event',           color: '#8B5CF6' },
  [VisitType.DELIVERY]:         { label: 'Domicilio',  icon: 'local-shipping',  color: '#F97316' },
  [VisitType.SERVICE_PROVIDER]: { label: 'Proveedor',  icon: 'build',           color: '#10B981' },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface VisitTypeBadgeProps {
  type: string;
  customConfig?: Record<string, { label: string; icon: string; color: string }>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const VisitTypeBadge: React.FC<VisitTypeBadgeProps> = ({ type, customConfig }) => {
  const cfg = (customConfig ?? VISIT_TYPE_CFG)[type]
    ?? { label: type, icon: 'person', color: '#64748B' };

  return (
    <View style={[st.badge, { backgroundColor: cfg.color + '22' }]}>
      <Text style={[st.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  text:  { fontSize: 11, fontWeight: '600' },
});

export default VisitTypeBadge;
