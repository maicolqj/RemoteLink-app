import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChipOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

interface ChipsSelectorProps {
  options: ChipOption[];
  selected: string;
  onSelect: (value: string) => void;
  label?: string;
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

const BORDER = 'rgba(255,255,255,0.08)';

const ChipsSelector: React.FC<ChipsSelectorProps> = ({ options, selected, onSelect, label, style }) => (
  <View style={[st.group, style]}>
    {label ? <Text style={st.label}>{label}</Text> : null}
    <View style={st.row}>
      {options.map(opt => {
        const active = selected === opt.value;
        const color = opt.color ?? '#55C2DA';
        return (
          <TouchableOpacity
            key={opt.value}
            style={[st.chip, { borderColor: active ? color : BORDER, backgroundColor: active ? color + '22' : 'transparent' }]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.75}
          >
            {opt.icon ? (
              <Icon
                name={opt.icon}
                size={14}
                color={active ? color : 'rgba(255,255,255,0.4)'}
                style={{ marginRight: 5 }}
              />
            ) : null}
            <Text style={[st.chipText, { color: active ? color : 'rgba(255,255,255,0.4)' }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  group:    { marginBottom: 16 },
  label:    { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, marginBottom: 6 },
  row:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
});

export default ChipsSelector;
