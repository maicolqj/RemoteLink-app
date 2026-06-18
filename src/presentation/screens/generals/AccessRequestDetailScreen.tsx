import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import VisitStatusBadge, { type StatusBadgeCfg } from '../../components/VisitStatusBadge';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAlert } from '../../providers/context/AlertContext';
import {
  fetchAccessRequestById,
  approveAccessRequest,
  rejectAccessRequest,
} from '../../../infraestructure/services/access.service';
import type { AccessRequest } from '../../../domain/responses/AccessRequestResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type RouteType = RouteProp<HomeStackParamList, 'AccessRequestDetail'>;
type NavProp = NativeStackNavigationProp<HomeStackParamList, 'AccessRequestDetail'>;

const STATUS_CFG: Record<string, StatusBadgeCfg> = {
  PENDING:  { label: 'Pendiente', color: '#F59E0B', bg: 'rgba(245,158,11,0.18)' },
  APPROVED: { label: 'Aprobada',  color: '#10B981', bg: 'rgba(16,185,129,0.18)' },
  REJECTED: { label: 'Rechazada', color: '#EF4444', bg: 'rgba(239,68,68,0.18)'  },
};

const ID_TYPE_LABEL: Record<string, string> = {
  CC: 'C.C.', CE: 'C.E.', PASSPORT: 'Pasaporte', TI: 'T.I.', FOREIGN_ID: 'ID Extranjero', OTHER: 'Otro',
};

function formatDT(iso?: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('');
}

function DetailRow({ label, value, colors }: { label: string; value?: string | null; colors: any }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.detailLabel}>
        {label}
      </CustomTextComponent>
      <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary} numberOfLines={3} style={styles.detailValue}>
        {value}
      </CustomTextComponent>
    </View>
  );
}

function RejectModal({ visible, onConfirm, onClose }: { visible: boolean; onConfirm: (reason: string) => void; onClose: () => void }) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const valid = text.trim().length >= 10;

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
            Motivo de rechazo
          </CustomTextComponent>
          <CustomInputComponent
            value={text}
            onChangeText={setText}
            placeholder="Ej: No reconozco a esta persona"
            multiline
            numberOfLines={3}
            maxLength={300}
            autoFocus
          />
          {text.length > 0 && !valid && (
            <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
              Mínimo 10 caracteres
            </CustomTextComponent>
          )}
          <View style={modalStyles.actions}>
            <Button label="Cancelar" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button label="Rechazar" variant="danger" disabled={!valid} onPress={handleConfirm} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AccessRequestDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showSuccess } = useAlert();

  const [request, setRequest] = useState<AccessRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetchAccessRequestById(route.params.accessRequestId)
      .then(r => { if (active) setRequest(r); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [route.params.accessRequestId]);

  if (!request) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Solicitud de acceso" showBack onBack={() => navigation.goBack()} />
        <View style={[gs.flex1, gs.center]}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textSecondary}>
              {error ? 'No se pudo cargar la solicitud' : 'Solicitud no encontrada'}
            </CustomTextComponent>
          )}
        </View>
      </View>
    );
  }

  const isPending = String(request.status) === 'PENDING';
  const name = request.requesterName || 'Solicitante';

  const handleApprove = async () => {
    setIsActionLoading(true);
    try {
      const res = await approveAccessRequest(request.id);
      setRequest(prev => (prev ? { ...prev, ...res } : prev));
      showSuccess('Solicitud aprobada.', 'Acceso');
    } catch {
      showError('No se pudo aprobar la solicitud.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    setIsActionLoading(true);
    try {
      const res = await rejectAccessRequest(request.id, reason);
      setRequest(prev => (prev ? { ...prev, ...res } : prev));
      showSuccess('Solicitud rechazada.', 'Acceso');
    } catch {
      showError('No se pudo rechazar la solicitud.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Solicitud de acceso" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xxl }]}>
        {/* Requester header */}
        <Card elevated style={styles.headerCard}>
          <View style={gs.center}>
            <View style={[styles.avatar, { backgroundColor: colors.primarySurface }]}>
              <CustomTextComponent fontSize={FONT_SIZE.xxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.primary}>
                {getInitials(name)}
              </CustomTextComponent>
            </View>
            <CustomTextComponent fontSize={FONT_SIZE.xl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary} textAlign="center" style={{ marginBottom: SPACING.sm }}>
              {name}
            </CustomTextComponent>
            <View style={styles.chipRow}>
              <VisitStatusBadge status={String(request.status)} customConfig={STATUS_CFG} />
            </View>
          </View>
        </Card>

        {/* Requester info */}
        <Card>
          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textTertiary} style={styles.sectionLabel}>
            SOLICITANTE
          </CustomTextComponent>
          {request.requesterIdentity && (
            <DetailRow label="Documento" value={`${ID_TYPE_LABEL[request.requesterIdentityType ?? 'CC'] ?? ''} ${request.requesterIdentity}`} colors={colors} />
          )}
          {request.requesterPhone && (<><View style={gs.divider} /><DetailRow label="Teléfono" value={request.requesterPhone} colors={colors} /></>)}
        </Card>

        {/* Request info */}
        <Card>
          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textTertiary} style={styles.sectionLabel}>
            SOLICITUD
          </CustomTextComponent>
          <DetailRow label="Solicitada" value={formatDT(request.requestedAt)} colors={colors} />
          {request.reason && (<><View style={gs.divider} /><DetailRow label="Motivo" value={request.reason} colors={colors} /></>)}
          {request.resolvedAt && (<><View style={gs.divider} /><DetailRow label="Resuelta" value={formatDT(request.resolvedAt)} colors={colors} /></>)}
          {request.rejectionReason && (<><View style={gs.divider} /><DetailRow label="Motivo rechazo" value={request.rejectionReason} colors={colors} /></>)}
        </Card>

        {/* Actions */}
        {isActionLoading && <View style={styles.loadingRow}><ActivityIndicator color={colors.primary} /></View>}

        {isPending && !isActionLoading && (
          <View style={styles.actionRow}>
            <Button label="Rechazar" variant="outline" icon="close" onPress={() => setShowReject(true)} style={{ flex: 1 }} />
            <Button label="Aprobar" icon="check" onPress={handleApprove} style={{ flex: 1 }} />
          </View>
        )}
      </ScrollView>

      <RejectModal visible={showReject} onConfirm={handleReject} onClose={() => setShowReject(false)} />
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
  detailLabel: { flexShrink: 0 },
  detailValue: { flex: 1, textAlign: 'right' },
  loadingRow: { alignItems: 'center', paddingVertical: SPACING.sm },
  actionRow: { flexDirection: 'row', gap: SPACING.sm },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  container: { borderRadius: RADIUS.lg, padding: SPACING.lg, width: '100%', maxWidth: 380, gap: SPACING.md },
  actions: { flexDirection: 'row', gap: SPACING.sm },
});
