import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import AppHeader from '../../components/AppHeader';
import Button from '../../components/Button';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAlert } from '../../providers/context/AlertContext';
import { useVisitsStore } from '../../store/visits.store';
import type { VisitorIdentityType } from '../../store/visits.store';
import type { VisitsStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type NavProp = NativeStackNavigationProp<VisitsStackParamList, 'ScheduleVisit'>;

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
type DateField = 'day' | 'month' | 'year' | 'hour' | 'minute';

function pad(n: number) { return String(n).padStart(2, '0'); }
function snapMinute(d: Date): number { return Math.round(d.getMinutes() / 15) * 15 % 60; }

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={spStyles.container}>
      <TouchableOpacity onPress={onPlus} hitSlop={{ top: 8, bottom: 4, left: 8, right: 8 }}>
        <Icon name="keyboard-arrow-up" size={30} color={colors.primary} />
      </TouchableOpacity>
      <CustomTextComponent fontSize={FONT_SIZE.xl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary} style={spStyles.value}>
        {value}
      </CustomTextComponent>
      <TouchableOpacity onPress={onMinus} hitSlop={{ top: 4, bottom: 8, left: 8, right: 8 }}>
        <Icon name="keyboard-arrow-down" size={30} color={colors.primary} />
      </TouchableOpacity>
      <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textSecondary} style={spStyles.label}>
        {label}
      </CustomTextComponent>
    </View>
  );
}

// ─── DatePickerModal ──────────────────────────────────────────────────────────

interface DatePickerModalProps {
  visible: boolean;
  value: Date;
  title: string;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

function DatePickerModal({ visible, value, title, onConfirm, onClose }: DatePickerModalProps) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState<Date>(new Date(value));

  useEffect(() => { if (visible) setDraft(new Date(value)); }, [visible, value]);

  const adjust = useCallback((field: DateField, delta: number) => {
    setDraft(prev => {
      const d = new Date(prev);
      if (field === 'day') d.setDate(d.getDate() + delta);
      else if (field === 'month') d.setMonth(d.getMonth() + delta);
      else if (field === 'year') d.setFullYear(d.getFullYear() + delta);
      else if (field === 'hour') d.setHours((d.getHours() + delta + 24) % 24);
      else if (field === 'minute') {
        const cur = Math.round(d.getMinutes() / 15) * 15;
        d.setMinutes((cur + delta * 15 + 60) % 60);
      }
      return d;
    });
  }, []);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[dpStyles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[dpStyles.container, { backgroundColor: colors.surface }]}>
          <CustomTextComponent fontSize={FONT_SIZE.lg} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary} textAlign="center">
            {title}
          </CustomTextComponent>
          <View style={dpStyles.dateRow}>
            <Stepper label="Día"  value={pad(draft.getDate())}          onMinus={() => adjust('day',   -1)} onPlus={() => adjust('day',   1)} />
            <Stepper label="Mes"  value={MONTHS_SHORT[draft.getMonth()]} onMinus={() => adjust('month', -1)} onPlus={() => adjust('month', 1)} />
            <Stepper label="Año"  value={String(draft.getFullYear())}    onMinus={() => adjust('year',  -1)} onPlus={() => adjust('year',  1)} />
          </View>
          <View style={dpStyles.timeRow}>
            <Stepper label="Hora" value={pad(draft.getHours())}          onMinus={() => adjust('hour',   -1)} onPlus={() => adjust('hour',   1)} />
            <CustomTextComponent fontSize={28} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary} style={{ marginBottom: SPACING.lg }}>
              :
            </CustomTextComponent>
            <Stepper label="Min"  value={pad(snapMinute(draft))}         onMinus={() => adjust('minute', -1)} onPlus={() => adjust('minute', 1)} />
          </View>
          <View style={dpStyles.actions}>
            <Button label="Cancelar" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button label="Confirmar" onPress={() => { onConfirm(draft); onClose(); }} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── IdentityPickerModal ──────────────────────────────────────────────────────

const IDENTITY_OPTIONS: { value: VisitorIdentityType; label: string }[] = [
  { value: 'CC',         label: 'C.C. — Cédula de Ciudadanía' },
  { value: 'CE',         label: 'C.E. — Cédula de Extranjería' },
  { value: 'PASSPORT',   label: 'Pasaporte' },
  { value: 'TI',         label: 'T.I. — Tarjeta de Identidad' },
  { value: 'FOREIGN_ID', label: 'ID Extranjero' },
  { value: 'OTHER',      label: 'Otro' },
];

function IdentityPickerModal({ visible, value, onSelect, onClose }: { visible: boolean; value: VisitorIdentityType; onSelect: (v: VisitorIdentityType) => void; onClose: () => void }) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={[dpStyles.overlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={onClose}>
        <View style={[dpStyles.container, { backgroundColor: colors.surface }]}>
          <CustomTextComponent fontSize={FONT_SIZE.lg} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary} textAlign="center">
            Tipo de documento
          </CustomTextComponent>
          {IDENTITY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[ipStyles.option, { borderBottomColor: colors.border }]}
              onPress={() => { onSelect(opt.value); onClose(); }}>
              <CustomTextComponent
                fontSize={FONT_SIZE.md}
                fontWeight={(opt.value === value ? FONT_WEIGHT.semibold : FONT_WEIGHT.regular) as any}
                color={opt.value === value ? colors.primary : colors.textPrimary}>
                {opt.label}
              </CustomTextComponent>
              {opt.value === value && <Icon name="check" size={18} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={fieldStyles.container}>
      <View style={fieldStyles.labelRow}>
        <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.textSecondary}>
          {label}
        </CustomTextComponent>
        {required && <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.error}> *</CustomTextComponent>}
      </View>
      {children}
      {error ? <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.error}>{error}</CustomTextComponent> : null}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

function defaultArrival(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(14, 0, 0, 0);
  return d;
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ScheduleVisitScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError } = useAlert();
  const { scheduleVisit, isActionLoading } = useVisitsStore();

  const [visitorName, setVisitorName] = useState('');
  const [visitorLastName, setVisitorLastName] = useState('');
  const [identityType, setIdentityType] = useState<VisitorIdentityType>('CC');
  const [visitorIdentity, setVisitorIdentity] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [expectedArrivalAt, setExpectedArrivalAt] = useState<Date>(defaultArrival);
  const [expectedArrivalUntil, setExpectedArrivalUntil] = useState<Date | null>(null);
  const [purpose, setPurpose] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [notes, setNotes] = useState('');

  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const [showUntilPicker, setShowUntilPicker] = useState(false);
  const [showIdentityPicker, setShowIdentityPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const identityLabel = useMemo(() => IDENTITY_OPTIONS.find(o => o.value === identityType)?.label ?? identityType, [identityType]);

  const clearError = (key: string) => setErrors(e => ({ ...e, [key]: '' }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!visitorName.trim()) e.visitorName = 'Requerido';
    if (!visitorLastName.trim()) e.visitorLastName = 'Requerido';
    if (!visitorIdentity.trim() || visitorIdentity.trim().length < 4) e.visitorIdentity = 'Mínimo 4 caracteres';
    if (expectedArrivalAt <= new Date()) e.expectedArrivalAt = 'Debe ser en el futuro';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const visit = await scheduleVisit({
        visitorName: visitorName.trim(),
        visitorLastName: visitorLastName.trim(),
        visitorIdentityType: identityType,
        visitorIdentity: visitorIdentity.trim(),
        visitorPhone: visitorPhone.trim() || undefined,
        expectedArrivalAt: expectedArrivalAt.toISOString(),
        expectedArrivalUntil: expectedArrivalUntil?.toISOString(),
        purpose: purpose.trim() || undefined,
        vehiclePlate: vehiclePlate.trim().toUpperCase() || undefined,
        notes: notes.trim() || undefined,
      });

      if (visit.qrToken) {
        navigation.replace('VisitQR', {
          visitId: visit.id,
          qrToken: visit.qrToken,
          visitorName: `${visitorName.trim()} ${visitorLastName.trim()}`,
          visitorIdentity: visitorIdentity.trim(),
          visitorIdentityType: identityType,
          expectedArrivalAt: visit.expectedArrivalAt,
        });
      } else {
        navigation.goBack();
      }
    } catch (e: any) {
      showError(e.message ?? 'No se pudo agendar la visita.');
    }
  };

  return (
    <KeyboardAvoidingView style={gs.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Agendar visita" showBack onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xxl }]} keyboardShouldPersistTaps="handled">

          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textTertiary} style={styles.sectionHeader}>
            DATOS DEL VISITANTE
          </CustomTextComponent>

          <Field label="Nombre" required error={errors.visitorName}>
            <CustomInputComponent
              value={visitorName}
              onChangeText={v => { setVisitorName(v); clearError('visitorName'); }}
              placeholder="Nombre"
              autoCapitalize="words"
              borderConfig={{ color: errors.visitorName ? colors.error : colors.border }}
            />
          </Field>

          <Field label="Apellido" required error={errors.visitorLastName}>
            <CustomInputComponent
              value={visitorLastName}
              onChangeText={v => { setVisitorLastName(v); clearError('visitorLastName'); }}
              placeholder="Apellido"
              autoCapitalize="words"
              borderConfig={{ color: errors.visitorLastName ? colors.error : colors.border }}
            />
          </Field>

          <Field label="Tipo de documento">
            <TouchableOpacity
              style={[styles.selectInput, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setShowIdentityPicker(true)}>
              <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textPrimary} style={gs.flex1}>
                {identityLabel}
              </CustomTextComponent>
              <Icon name="expand-more" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </Field>

          <Field label="Número de documento" required error={errors.visitorIdentity}>
            <CustomInputComponent
              value={visitorIdentity}
              onChangeText={v => { setVisitorIdentity(v); clearError('visitorIdentity'); }}
              placeholder="Ej: 10234567890"
              keyboardType="numeric"
              borderConfig={{ color: errors.visitorIdentity ? colors.error : colors.border }}
            />
          </Field>

          <Field label="Teléfono">
            <CustomInputComponent
              value={visitorPhone}
              onChangeText={setVisitorPhone}
              placeholder="Ej: 3001234567"
              keyboardType="phone-pad"
            />
          </Field>

          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textTertiary} style={[styles.sectionHeader, { marginTop: SPACING.md }]}>
            DETALLES DE LA VISITA
          </CustomTextComponent>

          <Field label="Fecha y hora de llegada" required error={errors.expectedArrivalAt}>
            <TouchableOpacity
              style={[styles.selectInput, { borderColor: errors.expectedArrivalAt ? colors.error : colors.border, backgroundColor: colors.surface }]}
              onPress={() => setShowArrivalPicker(true)}>
              <Icon name="event" size={18} color={colors.primary} />
              <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textPrimary} style={gs.flex1}>
                {formatDateLabel(expectedArrivalAt)}
              </CustomTextComponent>
            </TouchableOpacity>
          </Field>

          <Field label="Fecha límite (opcional)">
            <TouchableOpacity
              style={[styles.selectInput, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setShowUntilPicker(true)}>
              <Icon name="event" size={18} color={colors.textSecondary} />
              <CustomTextComponent fontSize={FONT_SIZE.md} color={expectedArrivalUntil ? colors.textPrimary : colors.textTertiary} style={gs.flex1}>
                {expectedArrivalUntil ? formatDateLabel(expectedArrivalUntil) : 'Sin fecha límite (48h por defecto)'}
              </CustomTextComponent>
              {expectedArrivalUntil && (
                <TouchableOpacity onPress={() => setExpectedArrivalUntil(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </Field>

          <Field label="Motivo de la visita">
            <CustomInputComponent
              value={purpose}
              onChangeText={setPurpose}
              placeholder="Ej: Reunión de trabajo"
              autoCapitalize="sentences"
            />
          </Field>

          <Field label="Placa del vehículo">
            <CustomInputComponent
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
              placeholder="Ej: ABC123"
              autoCapitalize="characters"
              maxLength={8}
            />
          </Field>

          <Field label="Notas adicionales">
            <CustomInputComponent
              value={notes}
              onChangeText={setNotes}
              placeholder="Información extra para el guardia"
              multiline
              numberOfLines={3}
            />
          </Field>

          <Button
            label="Agendar visita"
            icon="event-available"
            onPress={handleSubmit}
            loading={isActionLoading}
            fullWidth
            size="lg"
            style={{ marginTop: SPACING.md }}
          />
        </ScrollView>

        <DatePickerModal
          visible={showArrivalPicker}
          value={expectedArrivalAt}
          title="Fecha y hora de llegada"
          onConfirm={d => { setExpectedArrivalAt(d); clearError('expectedArrivalAt'); }}
          onClose={() => setShowArrivalPicker(false)}
        />
        <DatePickerModal
          visible={showUntilPicker}
          value={expectedArrivalUntil ?? expectedArrivalAt}
          title="Fecha límite"
          onConfirm={setExpectedArrivalUntil}
          onClose={() => setShowUntilPicker(false)}
        />
        <IdentityPickerModal
          visible={showIdentityPicker}
          value={identityType}
          onSelect={setIdentityType}
          onClose={() => setShowIdentityPicker(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  sectionHeader: {
    letterSpacing: 0.8,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    minHeight: 44,
  },
});

const fieldStyles = StyleSheet.create({
  container: { gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
});

const dpStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  container: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 360,
    gap: SPACING.md,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
});

const spStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 2 },
  value: { minWidth: 52, textAlign: 'center' },
  label: { marginTop: 2 },
});

const ipStyles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
});
