import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { VisitStatus } from '../../domain/enums/enums';

// ─── Config type ──────────────────────────────────────────────────────────────

export interface StatusBadgeCfg {
  label: string;
  color: string;
  bg:    string;
  icon?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

export const VISIT_STATUS_CFG: Record<string, StatusBadgeCfg> = {
  [VisitStatus.INSIDE]:           { label: 'Adentro',    color: '#10B981', bg: 'rgba(16,185,129,0.18)'  },
  [VisitStatus.APPROVED]:         { label: 'Aprobada',   color: '#55C2DA', bg: 'rgba(85,194,218,0.18)'  },
  [VisitStatus.PENDING_APPROVAL]: { label: 'Pendiente',  color: '#F59E0B', bg: 'rgba(245,158,11,0.18)'  },
  [VisitStatus.COMPLETED]:        { label: 'Completada', color: '#64748B', bg: 'rgba(100,116,139,0.18)' },
  [VisitStatus.DENIED]:           { label: 'Denegada',   color: '#EF4444', bg: 'rgba(239,68,68,0.18)'   },
  [VisitStatus.CANCELLED]:        { label: 'Cancelada',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  [VisitStatus.EXPIRED]:          { label: 'Vencida',    color: '#F97316', bg: 'rgba(249,115,22,0.18)'  },
  [VisitStatus.NO_SHOW]:          { label: 'No llegó',   color: '#F97316', bg: 'rgba(249,115,22,0.12)'  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface VisitStatusBadgeProps {
  status: string;
  customConfig?: Record<string, StatusBadgeCfg>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const VisitStatusBadge: React.FC<VisitStatusBadgeProps> = ({ status, customConfig }) => {
  const cfg = (customConfig ?? VISIT_STATUS_CFG)[status]
    ?? { label: status, color: '#64748B', bg: 'rgba(100,116,139,0.18)' };

  return (
    <View style={[st.badge, { backgroundColor: cfg.bg }]}>
      {cfg.icon ? (
        <Icon name={cfg.icon} size={9} color={cfg.color} style={st.icon} />
      ) : null}
      <Text style={[st.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  icon:  { marginRight: 3 },
  text:  { fontSize: 11, fontWeight: '600' },
});

export default VisitStatusBadge;
