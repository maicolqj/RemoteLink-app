import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import VisitStatusBadge, { type StatusBadgeCfg } from '../../components/VisitStatusBadge';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { fetchPackageById } from '../../../infraestructure/services/packages.service';
import type { Package } from '../../../domain/responses/PackageResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type RouteType = RouteProp<HomeStackParamList, 'PackageDetail'>;
type NavProp = NativeStackNavigationProp<HomeStackParamList, 'PackageDetail'>;

// Package status uses the shared badge with a package-specific palette; unknown
// values fall back to the raw label (handled inside VisitStatusBadge).
const PACKAGE_STATUS_CFG: Record<string, StatusBadgeCfg> = {
  RECEIVED:  { label: 'Recibido',   color: '#55C2DA', bg: 'rgba(85,194,218,0.18)'  },
  NOTIFIED:  { label: 'Notificado', color: '#F59E0B', bg: 'rgba(245,158,11,0.18)'  },
  DELIVERED: { label: 'Entregado',  color: '#10B981', bg: 'rgba(16,185,129,0.18)'  },
  RETURNED:  { label: 'Devuelto',   color: '#EF4444', bg: 'rgba(239,68,68,0.18)'   },
  PENDING:   { label: 'Pendiente',  color: '#64748B', bg: 'rgba(100,116,139,0.18)' },
};

const TYPE_LABEL: Record<string, string> = {
  PACKAGE: 'Paquete', DOCUMENT: 'Documento', FOOD: 'Comida', FLOWERS: 'Flores', OTHER: 'Otro',
};

function formatDT(iso?: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
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

export default function PackageDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();

  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetchPackageById(route.params.packageId)
      .then(p => { if (active) setPkg(p); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [route.params.packageId]);

  if (!pkg) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Detalle de paquete" showBack onBack={() => navigation.goBack()} />
        <View style={[gs.flex1, gs.center]}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textSecondary}>
              {error ? 'No se pudo cargar el paquete' : 'Paquete no encontrado'}
            </CustomTextComponent>
          )}
        </View>
      </View>
    );
  }

  const title = pkg.description || pkg.trackingCode || 'Paquete';
  const typeLabel = pkg.type ? (TYPE_LABEL[pkg.type] ?? pkg.type) : null;

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Detalle de paquete" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xxl }]}>
        {/* Header card */}
        <Card elevated style={styles.headerCard}>
          <View style={gs.center}>
            <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
              <Icon name="inventory-2" size={40} color={colors.primary} />
            </View>
            <CustomTextComponent fontSize={FONT_SIZE.xl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary} textAlign="center" style={{ marginBottom: SPACING.sm }}>
              {title}
            </CustomTextComponent>
            <View style={styles.chipRow}>
              <VisitStatusBadge status={String(pkg.status)} customConfig={PACKAGE_STATUS_CFG} />
            </View>
          </View>
        </Card>

        {/* Photo */}
        {pkg.photoUrl && (
          <Card padding={0} style={styles.photoCard}>
            <Image source={{ uri: pkg.photoUrl }} style={styles.photo} resizeMode="cover" />
          </Card>
        )}

        {/* Package info */}
        <Card>
          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textTertiary} style={styles.sectionLabel}>
            PAQUETE
          </CustomTextComponent>
          <DetailRow label="Tipo" value={typeLabel} colors={colors} />
          {pkg.trackingCode && (<><View style={gs.divider} /><DetailRow label="Guía" value={pkg.trackingCode} colors={colors} /></>)}
          {pkg.senderName && (<><View style={gs.divider} /><DetailRow label="Remitente" value={pkg.senderName} colors={colors} /></>)}
          {pkg.recipientName && (<><View style={gs.divider} /><DetailRow label="Destinatario" value={pkg.recipientName} colors={colors} /></>)}
          {pkg.notes && (<><View style={gs.divider} /><DetailRow label="Notas" value={pkg.notes} colors={colors} /></>)}
        </Card>

        {/* Tracking timeline */}
        <Card>
          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textTertiary} style={styles.sectionLabel}>
            SEGUIMIENTO
          </CustomTextComponent>
          <DetailRow label="Recibido" value={formatDT(pkg.receivedAt)} colors={colors} />
          {pkg.notifiedAt && (<><View style={gs.divider} /><DetailRow label="Notificado" value={formatDT(pkg.notifiedAt)} colors={colors} /></>)}
          {pkg.deliveredAt && (<><View style={gs.divider} /><DetailRow label="Entregado" value={formatDT(pkg.deliveredAt)} colors={colors} /></>)}
          {pkg.receivedByName && (<><View style={gs.divider} /><DetailRow label="Entregado a" value={pkg.receivedByName} colors={colors} /></>)}
          {pkg.returnedAt && (<><View style={gs.divider} /><DetailRow label="Devuelto" value={formatDT(pkg.returnedAt)} colors={colors} /></>)}
          {pkg.returnReason && (<><View style={gs.divider} /><DetailRow label="Motivo devolución" value={pkg.returnReason} colors={colors} /></>)}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.md, gap: SPACING.md },
  headerCard: { paddingVertical: SPACING.xl },
  iconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  chipRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap', justifyContent: 'center' },
  photoCard: { overflow: 'hidden' },
  photo: { width: '100%', height: 200, borderRadius: RADIUS.md },
  sectionLabel: { letterSpacing: 0.8, marginBottom: SPACING.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: SPACING.xs, gap: SPACING.md },
  detailLabel: { flexShrink: 0 },
  detailValue: { flex: 1, textAlign: 'right' },
});
