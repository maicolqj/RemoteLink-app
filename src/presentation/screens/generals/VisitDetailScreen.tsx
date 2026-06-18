import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import VisitStatusBadge from '../../components/VisitStatusBadge';
import VisitTypeBadge from '../../components/VisitTypeBadge';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAlert } from '../../providers/context/AlertContext';
import { useVisitsStore } from '../../store/visits.store';
import type { VisitsStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type RouteType = RouteProp<VisitsStackParamList, 'VisitDetail'>;
type NavProp = NativeStackNavigationProp<VisitsStackParamList, 'VisitDetail'>;

const ID_TYPE_LABEL: Record<string, string> = {
  CC: 'C.C.', CE: 'C.E.', PASSPORT: 'Pasaporte', TI: 'T.I.', FOREIGN_ID: 'ID Extranjero', OTHER: 'Otro',
};

function formatDT(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
}

function getInitials(fullName: string): string {
  return fullName.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('');
}

function DetailRow({ label, value, colors }: { label: string; value?: string | null; colors: any }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ flexShrink: 0 }}>
        {label}
      </CustomTextComponent>
      <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary} numberOfLines={3} style={styles.detailValue}>
        {value}
      </CustomTextComponent>
    </View>
  );
}

// ─── Reason Modal ─────────────────────────────────────────────────────────────

interface ReasonModalProps {
  visible: boolean;
  title: string;
  placeholder: string;
  minLength?: number;
  confirmLabel: string;
  confirmVariant?: any;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

function ReasonModal({ visible, title, placeholder, minLength = 10, confirmLabel, confirmVariant = 'primary', onConfirm, onClose }: ReasonModalProps) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const valid = text.trim().length >= minLength;

  const handleConfirm = () => {
    if (!valid) return;
    onConfirm(text.trim());
    setText('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[modalStyles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[modalStyles.container, { backgroundColor: colors.surface }]}>
          <CustomTextComponent fontSize={FONT_SIZE.lg} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary}>
            {title}
          </CustomTextComponent>
          <CustomInputComponent
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            multiline
            numberOfLines={3}
            maxLength={300}
            autoFocus
          />
          {text.length > 0 && !valid && (
            <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
              Mínimo {minLength} caracteres
            </CustomTextComponent>
          )}
          <View style={modalStyles.actions}>
            <Button label="Cancelar" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button label={confirmLabel} variant={confirmVariant} disabled={!valid} onPress={handleConfirm} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VisitDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showQuestion, showError, showSuccess } = useAlert();
  const { visits, isActionLoading, fetchVisitById, approveVisit, denyVisit, cancelVisit, blacklistVisitor, removeFromBlacklist } = useVisitsStore();

  const visit = visits.find(v => v.id === route.params.visitId);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  // When opened from a notification the visit may not be in the list store yet.
  const [loading, setLoading] = useState(!visit);

  useEffect(() => {
    if (visit) return;
    let active = true;
    setLoading(true);
    fetchVisitById(route.params.visitId)
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params.visitId]);

  if (!visit) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Detalle de visita" showBack onBack={() => navigation.goBack()} />
        <View style={[gs.flex1, gs.center]}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textSecondary}>
              Visita no encontrada
            </CustomTextComponent>
          )}
        </View>
      </View>
    );
  }

  const isPending = visit.status === 'PENDING_APPROVAL';
  const isScheduledActive = visit.type === 'SCHEDULED' && !['CANCELLED', 'EXPIRED', 'NO_SHOW', 'COMPLETED', 'DENIED'].includes(visit.status);
  const canCancel = ['PENDING_APPROVAL', 'APPROVED'].includes(visit.status);
  const isBlacklisted = !!visit.visitor.isBlacklisted;

  const handleApprove = async () => {
    try { await approveVisit(visit.id); navigation.goBack(); }
    catch { showError('No se pudo aprobar la visita.'); }
  };

  const handleDeny = async (reason: string) => {
    try { await denyVisit(visit.id, reason); navigation.goBack(); }
    catch { showError('No se pudo rechazar la visita.'); }
  };

  const handleCancel = () => {
    showQuestion('¿Seguro que quieres cancelar esta visita?', 'Cancelar visita', {
      buttons: [
        { text: 'No', style: 'secondary', onPress: () => {} },
        { text: 'Sí, cancelar', style: 'danger', onPress: async () => {
          try { await cancelVisit(visit.id); navigation.goBack(); }
          catch { showError('No se pudo cancelar la visita.'); }
        }},
      ],
    });
  };

  const handleBlacklist = async (reason: string) => {
    try { await blacklistVisitor(visit.visitor.id, reason); showSuccess(`${visit.visitor.fullName} fue agregado a la lista negra.`, 'Lista negra'); }
    catch { showError('No se pudo agregar a la lista negra.'); }
  };

  const handleRemoveBlacklist = () => {
    showQuestion(`¿Quitar a ${visit.visitor.fullName} de la lista negra?`, 'Quitar de lista negra', {
      buttons: [
        { text: 'No', style: 'secondary', onPress: () => {} },
        { text: 'Sí', style: 'primary', onPress: async () => {
          try { await removeFromBlacklist(visit.visitor.id); }
          catch { showError('No se pudo actualizar.'); }
        }},
      ],
    });
  };

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Detalle de visita" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xxl }]}>
        {/* Visitor header card */}
        <Card elevated style={styles.headerCard}>
          <View style={gs.center}>
            {visit.visitor.photoUrl ? (
              <TouchableOpacity activeOpacity={0.85} onPress={() => setShowPhoto(true)}>
                <Image source={{ uri: visit.visitor.photoUrl }} style={[styles.avatar, { backgroundColor: colors.border }]} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primarySurface }]}>
                <CustomTextComponent fontSize={FONT_SIZE.xxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.primary}>
                  {getInitials(visit.visitor.fullName)}
                </CustomTextComponent>
              </View>
            )}
            <CustomTextComponent fontSize={FONT_SIZE.xl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary} textAlign="center" style={{ marginBottom: SPACING.sm }}>
              {visit.visitor.fullName}
            </CustomTextComponent>
            <View style={styles.chipRow}>
              <VisitStatusBadge status={visit.status} />
              <VisitTypeBadge type={visit.type} />
              {isBlacklisted && <Icon name="block" size={14} color={colors.error} style={{ marginLeft: 2 }} />}
            </View>
          </View>
        </Card>

        {/* Visitor contact */}
        <Card>
          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textTertiary} style={styles.sectionLabel}>
            VISITANTE
          </CustomTextComponent>
          <DetailRow label="Documento" value={`${ID_TYPE_LABEL[visit.visitor.identityType ?? 'CC']} ${visit.visitor.identity}`} colors={colors} />
          {visit.visitor.phone && (<><View style={gs.divider} /><DetailRow label="Teléfono" value={visit.visitor.phone} colors={colors} /></>)}
        </Card>

        {/* Visit info */}
        <Card>
          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textTertiary} style={styles.sectionLabel}>
            VISITA
          </CustomTextComponent>
          <DetailRow label="Creada" value={formatDT(visit.createdAt)} colors={colors} />
          {visit.expectedArrivalAt && (<><View style={gs.divider} /><DetailRow label="Llegada esperada" value={formatDT(visit.expectedArrivalAt)} colors={colors} /></>)}
          {visit.expectedArrivalUntil && (<><View style={gs.divider} /><DetailRow label="Hasta" value={formatDT(visit.expectedArrivalUntil)} colors={colors} /></>)}
          {visit.entryTime && (<><View style={gs.divider} /><DetailRow label="Entrada" value={formatDT(visit.entryTime)} colors={colors} /></>)}
          {visit.exitTime && (<><View style={gs.divider} /><DetailRow label="Salida" value={formatDT(visit.exitTime)} colors={colors} /></>)}
          {visit.purpose && (<><View style={gs.divider} /><DetailRow label="Motivo" value={visit.purpose} colors={colors} /></>)}
          {visit.vehiclePlate && (<><View style={gs.divider} /><DetailRow label="Placa" value={visit.vehiclePlate} colors={colors} /></>)}
          {visit.notes && (<><View style={gs.divider} /><DetailRow label="Notas" value={visit.notes} colors={colors} /></>)}
          {visit.denialReason && (<><View style={gs.divider} /><DetailRow label="Motivo rechazo" value={visit.denialReason} colors={colors} /></>)}
          {visit.visitor.blacklistReason && (<><View style={gs.divider} /><DetailRow label="Motivo lista negra" value={visit.visitor.blacklistReason} colors={colors} /></>)}
        </Card>

        {/* Actions */}
        {isActionLoading && <View style={styles.loadingRow}><ActivityIndicator color={colors.primary} /></View>}

        {isPending && !isActionLoading && (
          <View style={styles.actionRow}>
            <Button label="Denegar" variant="outline" icon="close" onPress={() => setShowDenyModal(true)} style={{ flex: 1 }} />
            <Button label="Aprobar" icon="check" onPress={handleApprove} style={{ flex: 1 }} />
          </View>
        )}

        {isScheduledActive && !isActionLoading && (
          <View style={styles.actionRow}>
            {canCancel && <Button label="Cancelar visita" variant="outline" icon="event-busy" onPress={handleCancel} style={{ flex: 1 }} />}
            {visit.qrToken && (
              <Button label="Ver QR" icon="qr-code-2" onPress={() => navigation.navigate('VisitQR', { visitId: visit.id, qrToken: visit.qrToken!, visitorName: visit.visitor.fullName, visitorIdentity: visit.visitor.identity, visitorIdentityType: visit.visitor.identityType, expectedArrivalAt: visit.expectedArrivalAt })} style={{ flex: 1 }} />
            )}
          </View>
        )}

        {canCancel && !isScheduledActive && !isPending && !isActionLoading && (
          <Button label="Cancelar visita" variant="outline" icon="event-busy" onPress={handleCancel} fullWidth />
        )}

        {/* Blacklist toggle */}
        {!isActionLoading && (
          <TouchableOpacity
            style={styles.blacklistBtn}
            onPress={isBlacklisted ? handleRemoveBlacklist : () => setShowBlacklistModal(true)}
            activeOpacity={0.7}>
            <Icon name={isBlacklisted ? 'remove-circle-outline' : 'block'} size={18} color={isBlacklisted ? colors.textSecondary : colors.error} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={isBlacklisted ? colors.textSecondary : colors.error}>
              {isBlacklisted ? 'Quitar de lista negra' : 'Agregar a lista negra'}
            </CustomTextComponent>
          </TouchableOpacity>
        )}
      </ScrollView>

      {visit.visitor.photoUrl && (
        <Modal visible={showPhoto} transparent animationType="fade" onRequestClose={() => setShowPhoto(false)}>
          <TouchableOpacity style={photoStyles.backdrop} activeOpacity={1} onPress={() => setShowPhoto(false)}>
            <Image source={{ uri: visit.visitor.photoUrl }} style={photoStyles.image} resizeMode="contain" />
            <TouchableOpacity style={[photoStyles.close, { top: insets.top + SPACING.sm }]} onPress={() => setShowPhoto(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      <ReasonModal
        visible={showDenyModal}
        title="Motivo de rechazo"
        placeholder="Ej: No conozco a esta persona"
        confirmLabel="Denegar"
        confirmVariant="danger"
        onConfirm={handleDeny}
        onClose={() => setShowDenyModal(false)}
      />
      <ReasonModal
        visible={showBlacklistModal}
        title="Motivo para lista negra"
        placeholder="Ej: Intento de robo en visita anterior"
        minLength={10}
        confirmLabel="Agregar"
        confirmVariant="danger"
        onConfirm={handleBlacklist}
        onClose={() => setShowBlacklistModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.md, gap: SPACING.md },
  headerCard: { paddingVertical: SPACING.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  chipRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap', justifyContent: 'center' },
  sectionLabel: { letterSpacing: 0.8, marginBottom: SPACING.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: SPACING.xs, gap: SPACING.md },
  detailValue: { flex: 1, textAlign: 'right' },
  loadingRow: { alignItems: 'center', paddingVertical: SPACING.sm },
  actionRow: { flexDirection: 'row', gap: SPACING.sm },
  blacklistBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, marginTop: SPACING.xs },
});

const photoStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  close: { position: 'absolute', right: SPACING.md, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  container: { borderRadius: RADIUS.lg, padding: SPACING.lg, width: '100%', maxWidth: 380, gap: SPACING.md },
  actions: { flexDirection: 'row', gap: SPACING.sm },
});
