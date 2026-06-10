import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcStorageDays(receivedAt: string): number {
  return Math.floor((Date.now() - new Date(receivedAt).getTime()) / 86_400_000);
}

function storageColor(ratio: number): string {
  if (ratio >= 0.9)  return '#EF4444';
  if (ratio >= 0.75) return '#F97316';
  if (ratio >= 0.5)  return '#F59E0B';
  return '#10B981';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface StorageBarProps {
  receivedAt:     string;
  maxStorageDays: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const StorageBar: React.FC<StorageBarProps> = ({ receivedAt, maxStorageDays }) => {
  const days     = calcStorageDays(receivedAt);
  const ratio    = maxStorageDays > 0 ? Math.min(days / maxStorageDays, 1) : 0;
  const exceeded = days > maxStorageDays;
  const color    = exceeded ? '#EF4444' : storageColor(ratio);

  return (
    <View style={st.wrap}>
      <View style={st.track}>
        <View style={[st.fill, { width: `${Math.min(ratio * 100, 100)}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[st.label, { color }]}>
        {exceeded
          ? `⚠ ${days} días (límite: ${maxStorageDays})`
          : `${days} / ${maxStorageDays} días`}
      </Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  wrap:  { marginTop: 5 },
  track: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  fill:  { height: '100%', borderRadius: 2 },
  label: { fontSize: 10, fontWeight: '600' },
});

export default StorageBar;
