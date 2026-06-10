import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// ─── Props ────────────────────────────────────────────────────────────────────

interface EmptyStateViewProps {
  icon: string;
  text: string;
  hint?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  icon,
  text,
  hint,
  onRetry,
  retryLabel = 'Reintentar',
}) => (
  <View style={st.container}>
    <Icon name={icon} size={52} color="rgba(255,255,255,0.1)" />
    <Text style={st.text}>{text}</Text>
    {hint ? <Text style={st.hint}>{hint}</Text> : null}
    {onRetry ? (
      <TouchableOpacity style={st.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Text style={st.retryText}>{retryLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { alignItems: 'center', marginTop: 80, gap: 10 },
  text:      { fontSize: 15, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
  hint:      { fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:  { marginTop: 10, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, backgroundColor: 'rgba(85,194,218,0.12)', borderWidth: 1, borderColor: 'rgba(85,194,218,0.3)' },
  retryText: { color: '#55C2DA', fontSize: 13, fontWeight: '600' },
});

export default EmptyStateView;
