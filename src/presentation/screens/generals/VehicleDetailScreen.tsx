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
import { fetchVehicleById } from '../../../infraestructure/services/vehicles.service';
import type { Vehicle } from '../../../domain/responses/VehicleResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type RouteType = RouteProp<HomeStackParamList, 'VehicleDetail'>;
type NavProp = NativeStackNavigationProp<HomeStackParamList, 'VehicleDetail'>;

const VEHICLE_STATUS_CFG: Record<string, StatusBadgeCfg> = {
  PENDING:  { label: 'Pendiente', color: '#F59E0B', bg: 'rgba(245,158,11,0.18)'  },
  APPROVED: { label: 'Aprobado',  color: '#10B981', bg: 'rgba(16,185,129,0.18)'  },
  REJECTED: { label: 'Rechazado', color: '#EF4444', bg: 'rgba(239,68,68,0.18)'   },
};

const TYPE_LABEL: Record<string, string> = {
  CAR: 'Automóvil', MOTORCYCLE: 'Motocicleta', TRUCK: 'Camioneta', BICYCLE: 'Bicicleta', OTHER: 'Otro',
};

const TYPE_ICON: Record<string, string> = {
  CAR: 'directions-car', MOTORCYCLE: 'two-wheeler', TRUCK: 'local-shipping', BICYCLE: 'pedal-bike', OTHER: 'directions-car',
};

const FUEL_LABEL: Record<string, string> = {
  GASOLINE: 'Gasolina', DIESEL: 'Diésel', ELECTRIC: 'Eléctrico', HYBRID: 'Híbrido', GAS: 'Gas',
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

export default function VehicleDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetchVehicleById(route.params.vehicleId)
      .then(v => { if (active) setVehicle(v); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [route.params.vehicleId]);

  if (!vehicle) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Detalle de vehículo" showBack onBack={() => navigation.goBack()} />
        <View style={[gs.flex1, gs.center]}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textSecondary}>
              {error ? 'No se pudo cargar el vehículo' : 'Vehículo no encontrado'}
            </CustomTextComponent>
          )}
        </View>
      </View>
    );
  }

  const typeKey = vehicle.type ? String(vehicle.type) : '';
  const typeLabel = typeKey ? (TYPE_LABEL[typeKey] ?? typeKey) : null;
  const icon = TYPE_ICON[typeKey] ?? 'directions-car';
  const brandModel = [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' ');
  const fuelLabel = vehicle.fuelType ? (FUEL_LABEL[String(vehicle.fuelType)] ?? String(vehicle.fuelType)) : null;

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Detalle de vehículo" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xxl }]}>
        {/* Header card */}
        <Card elevated style={styles.headerCard}>
          <View style={gs.center}>
            <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
              <Icon name={icon} size={40} color={colors.primary} />
            </View>
            <CustomTextComponent fontSize={FONT_SIZE.xxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary} textAlign="center" style={styles.plate}>
              {vehicle.plate}
            </CustomTextComponent>
            {!!brandModel && (
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} textAlign="center" style={{ marginBottom: SPACING.sm }}>
                {brandModel}
              </CustomTextComponent>
            )}
            <View style={styles.chipRow}>
              <VisitStatusBadge status={String(vehicle.status)} customConfig={VEHICLE_STATUS_CFG} />
            </View>
          </View>
        </Card>

        {/* Photo */}
        {vehicle.photoUrl && (
          <Card padding={0} style={styles.photoCard}>
            <Image source={{ uri: vehicle.photoUrl }} style={styles.photo} resizeMode="cover" />
          </Card>
        )}

        {/* Vehicle info */}
        <Card>
          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textTertiary} style={styles.sectionLabel}>
            VEHÍCULO
          </CustomTextComponent>
          <DetailRow label="Tipo" value={typeLabel} colors={colors} />
          {vehicle.color && (<><View style={gs.divider} /><DetailRow label="Color" value={vehicle.color} colors={colors} /></>)}
          {fuelLabel && (<><View style={gs.divider} /><DetailRow label="Combustible" value={fuelLabel} colors={colors} /></>)}
          {vehicle.parkingSpot && (<><View style={gs.divider} /><DetailRow label="Parqueadero" value={vehicle.parkingSpot} colors={colors} /></>)}
          {vehicle.notes && (<><View style={gs.divider} /><DetailRow label="Notas" value={vehicle.notes} colors={colors} /></>)}
        </Card>

        {/* Status / approval */}
        <Card>
          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textTertiary} style={styles.sectionLabel}>
            ESTADO
          </CustomTextComponent>
          {vehicle.createdAt && (<DetailRow label="Registrado" value={formatDT(vehicle.createdAt)} colors={colors} />)}
          {vehicle.approvedAt && (<><View style={gs.divider} /><DetailRow label="Aprobado" value={formatDT(vehicle.approvedAt)} colors={colors} /></>)}
          {vehicle.rejectionReason && (<><View style={gs.divider} /><DetailRow label="Motivo rechazo" value={vehicle.rejectionReason} colors={colors} /></>)}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.md, gap: SPACING.md },
  headerCard: { paddingVertical: SPACING.xl },
  iconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  plate: { letterSpacing: 1, marginBottom: SPACING.xs },
  chipRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap', justifyContent: 'center' },
  photoCard: { overflow: 'hidden' },
  photo: { width: '100%', height: 200, borderRadius: RADIUS.md },
  sectionLabel: { letterSpacing: 0.8, marginBottom: SPACING.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: SPACING.xs, gap: SPACING.md },
  detailLabel: { flexShrink: 0 },
  detailValue: { flex: 1, textAlign: 'right' },
});
