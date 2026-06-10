import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ColorsApp } from '../constants/CustomColors';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ToggleWithInputProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sublabel?: string;
  icon: string;
  accentColor?: string;
  // Revealed input
  inputValue: string;
  onInputChange: (t: string) => void;
  inputPlaceholder?: string;
  maxLength?: number;
  plateMode?: boolean; // uppercase + letter-spacing + bold
}

// ─── Component ────────────────────────────────────────────────────────────────

const CARD_BG = '#0D2347';
const BORDER  = 'rgba(255,255,255,0.08)';

const ToggleWithInput: React.FC<ToggleWithInputProps> = ({
  value,
  onChange,
  label,
  sublabel,
  icon,
  accentColor,
  inputValue,
  onInputChange,
  inputPlaceholder,
  maxLength,
  plateMode = false,
}) => {
  const accent = accentColor ?? ColorsApp.accent();

  return (
    <View style={st.group}>
      <TouchableOpacity
        style={st.row}
        onPress={() => onChange(!value)}
        activeOpacity={0.75}
      >
        <View style={[st.iconWrap, value && { backgroundColor: accent }]}>
          <Icon name={icon} size={18} color={value ? '#fff' : 'rgba(255,255,255,0.4)'} />
        </View>
        <View style={st.textWrap}>
          <Text style={[st.label, value && { color: '#fff' }]}>{label}</Text>
          {sublabel ? <Text style={st.sublabel}>{sublabel}</Text> : null}
        </View>
        <View style={[st.pill, value && { backgroundColor: accent }]}>
          <View style={[st.dot, value && st.dotActive]} />
        </View>
      </TouchableOpacity>

      {value && (
        <TextInput
          style={[
            st.input,
            plateMode && { letterSpacing: 2, fontWeight: '700', textTransform: 'uppercase' },
          ]}
          value={inputValue}
          onChangeText={plateMode ? t => onInputChange(t.toUpperCase()) : onInputChange}
          placeholder={inputPlaceholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoCapitalize={plateMode ? 'characters' : 'none'}
          autoCorrect={false}
          maxLength={maxLength}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  group:    { marginBottom: 16 },
  row:      { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1, marginLeft: 12 },
  label:    { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  sublabel: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 },
  pill:     { width: 42, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', paddingHorizontal: 3 },
  dot:      { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive:{ backgroundColor: '#fff', alignSelf: 'flex-end' },
  input:    { marginTop: 10, backgroundColor: CARD_BG, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#fff' },
});

export default ToggleWithInput;
