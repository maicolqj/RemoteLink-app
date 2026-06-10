import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DISTRIBUTION } from '@env';

const DIST_CONFIG: Record<string, { color: string; label: string }> = {
  dev: { color: '#F97316', label: 'D' },
  apk: { color: '#3B82F6', label: 'A' },
  aab: { color: '#8B5CF6', label: 'B' },
};

export function BuildBadge(): React.JSX.Element | null {
  const conf = DIST_CONFIG[DISTRIBUTION];
  if (!conf) return null;

  return (
    <View style={st.row}>
      <View style={[st.dot, { backgroundColor: conf.color }]} />
      <Text style={[st.label, { color: conf.color }]}>{conf.label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    opacity: 0.30,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
