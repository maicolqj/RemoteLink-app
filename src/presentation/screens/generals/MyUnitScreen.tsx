import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusChip from '../../components/StatusChip';
import ImageViewerModal from '../../components/ImageViewerModal';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import { formatName } from '../../utils/names';
import apolloClientInstance from '../../../data/lib/apollo/client';
import { GET_MY_UNIT } from '../../../domain/graphql/my-unit.queries';
import type {
  HouseholdType,
  MyUnit,
  MyUnitMember,
  MyUnitVehicle,
} from '../../../domain/responses/MyUnitResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'MyUnit'>;

const HOUSEHOLD_LABEL: Record<HouseholdType, string> = {
  OWNER: 'Propietario',
  TENANT: 'Arrendatario',
  FAMILY_MEMBER: 'Familiar',
  CARETAKER: 'Cuidador',
};

const UNIT_TYPE_LABEL: Record<string, string> = {
  APARTMENT: 'Apartamento',
  HOUSE: 'Casa',
  OFFICE: 'Oficina',
  STUDIO: 'Apartaestudio',
  PENTHOUSE: 'Penthouse',
  COMMERCIAL: 'Local comercial',
  WAREHOUSE: 'Bodega',
};

const VEHICLE_TYPE_ICON: Record<string, string> = {
  CAR: 'directions-car',
  MOTORCYCLE: 'two-wheeler',
  TRUCK: 'local-shipping',
  BICYCLE: 'pedal-bike',
};

type ChipVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface ParkingState {
  chip: { label: string; variant: ChipVariant };
  /** La línea de debajo: número, ubicación o qué va a pasar. */
  detail: string;
  icon: string;
}

/**
 * Dónde está el vehículo en el parqueadero del conjunto.
 *
 * Parqueadero fijo, en rotación con cupo o fuera en este periodo son tres
 * situaciones distintas para el residente —la última además no paga—, así que
 * cada una lleva su etiqueta y una línea que la explica.
 */
function parkingState(v: MyUnitVehicle, nextRotationAt?: string | null): ParkingState {
  if (v.status === 'PENDING_APPROVAL') {
    return {
      chip: { label: 'Por aprobar', variant: 'warning' },
      detail: 'La administración está revisando el registro.',
      icon: 'hourglass-empty',
    };
  }

  if (v.fixedParkingAsset) {
    const { code, location } = v.fixedParkingAsset;
    return {
      chip: { label: 'Parqueadero fijo', variant: 'success' },
      detail: [`Parqueadero ${code}`, location].filter(Boolean).join(' · '),
      icon: 'local-parking',
    };
  }

  if (v.status === 'SUSPENDED' && v.suspendedByRotation) {
    const back = nextRotationAt
      ? new Date(nextRotationAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
      : null;
    return {
      chip: { label: 'Fuera por rotación', variant: 'warning' },
      detail: back
        ? `Este periodo no tiene cupo y no se cobra. Vuelve a entrar en la próxima rotación, el ${back}.`
        : 'Este periodo no tiene cupo y no se cobra. Vuelve a entrar en la próxima rotación.',
      icon: 'sync',
    };
  }

  if (v.status === 'SUSPENDED') {
    return {
      chip: { label: 'Suspendido', variant: 'error' },
      detail: 'La administración suspendió su acceso. Comunícate con ella.',
      icon: 'block',
    };
  }

  if (v.parkingSpot) {
    return {
      chip: { label: 'En parqueadero', variant: 'success' },
      detail: nextRotationAt ? `Cupo ${v.parkingSpot} · por rotación` : `Parqueadero ${v.parkingSpot}`,
      icon: 'local-parking',
    };
  }

  return {
    chip: { label: 'Sin parqueadero', variant: 'neutral' },
    detail: 'No tiene un parqueadero asignado.',
    icon: 'local-parking',
  };
}

/**
 * Mi unidad: lo que el residente tiene en el conjunto y con quién vive.
 *
 * Datos de la unidad, sus parqueaderos y bodegas propios, los vehículos
 * registrados (con el parqueadero que les asignó la rotación) y los
 * integrantes, con su teléfono para llamarse.
 */
export default function MyUnitScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError } = useAlert();
  const complexId = useAuthStore(s => s.resident?.complex?.id);

  const [data, setData] = useState<MyUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [zoomed, setZoomed] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!complexId) return;
    try {
      const { data: res, error } = await apolloClientInstance.query<{ myUnit: MyUnit }>({
        query: GET_MY_UNIT,
        variables: { complexId },
        fetchPolicy: 'network-only',
      });
      if (error) throw error;
      setData(res?.myUnit ?? null);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo cargar tu unidad.');
    } finally {
      setLoading(false);
    }
  }, [complexId, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const call = useCallback(
    (phone: string) => {
      Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() =>
        showError('No se pudo abrir la aplicación de llamadas.'),
      );
    },
    [showError],
  );

  if (loading) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Mi unidad" showBack onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Mi unidad" showBack onBack={() => navigation.goBack()} />
        <EmptyState
          icon="home"
          title="No encontramos tu unidad"
          description="Si acabas de mudarte, la administración debe activar tu ficha."
        />
      </View>
    );
  }

  const { unit, assets, vehicles, members, nextRotationAt } = data;
  const title = [unit.building?.name, `${UNIT_TYPE_LABEL[unit.type] ?? 'Unidad'} ${unit.number}`]
    .filter(Boolean)
    .join(' · ');

  const facts = [
    unit.type !== 'HOUSE' && unit.floor != null ? { icon: 'layers', text: `Piso ${unit.floor}` } : null,
    unit.houseFloors ? { icon: 'layers', text: `${unit.houseFloors} pisos` } : null,
    unit.area ? { icon: 'square-foot', text: `${unit.area} m²` } : null,
    unit.bedrooms ? { icon: 'bed', text: `${unit.bedrooms} ${unit.bedrooms === 1 ? 'habitación' : 'habitaciones'}` } : null,
    unit.bathrooms ? { icon: 'bathtub', text: `${unit.bathrooms} ${unit.bathrooms === 1 ? 'baño' : 'baños'}` } : null,
    unit.hasElevator ? { icon: 'elevator', text: 'Con ascensor' } : null,
    unit.coefficient ? { icon: 'pie-chart', text: `Coeficiente ${(unit.coefficient * 100).toFixed(3)} %` } : null,
  ].filter(Boolean) as { icon: string; text: string }[];

  const parkingAssets = assets.filter(a => a.type === 'PARKING');
  const storageAssets = assets.filter(a => a.type === 'STORAGE');

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Mi unidad" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xxl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        {/* ── La unidad ─────────────────────────────────────────── */}
        <Card elevated>
          <View style={styles.unitHeader}>
            <View style={[styles.unitIcon, { backgroundColor: colors.primarySurface }]}>
              <Icon name={unit.type === 'HOUSE' ? 'house' : 'apartment'} size={28} color={colors.primary} />
            </View>
            <CustomTextComponent
              fontSize={FONT_SIZE.lg}
              fontWeight={FONT_WEIGHT.bold as any}
              color={colors.textPrimary}
              style={gs.flex1}>
              {title}
            </CustomTextComponent>
          </View>
          {facts.length > 0 && (
            <View style={styles.facts}>
              {facts.map(f => (
                <View key={f.text} style={[styles.fact, { backgroundColor: colors.background }]}>
                  <Icon name={f.icon} size={14} color={colors.textSecondary} />
                  <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textSecondary}>
                    {f.text}
                  </CustomTextComponent>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* ── Parqueaderos y bodegas ────────────────────────────── */}
        <SectionTitle text="Parqueaderos y bodegas" />
        <Card>
          <AssetGroup
            icon="local-parking"
            label="Parqueaderos"
            items={parkingAssets}
            declaredCount={unit.parkingSpots}
          />
          <View style={gs.divider} />
          <AssetGroup
            icon="inventory"
            label="Bodegas"
            items={storageAssets}
            declaredCount={unit.storageRooms}
          />
        </Card>

        {/* ── Vehículos ─────────────────────────────────────────── */}
        <SectionTitle text="Vehículos" count={vehicles.length} />
        {vehicles.length === 0 ? (
          <Card>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              No hay vehículos registrados en tu unidad. Para registrar uno, acércate a la administración.
            </CustomTextComponent>
          </Card>
        ) : (
          vehicles.map(v => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              parking={parkingState(v, nextRotationAt)}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: v.id })}
              onPhoto={() => v.photoUrl && setZoomed(v.photoUrl)}
            />
          ))
        )}

        {/* ── Integrantes ───────────────────────────────────────── */}
        <SectionTitle text="Integrantes" count={members.length} />
        <Card padding={0}>
          {members.map((m, i) => (
            <View key={m.residentId}>
              {i > 0 && <View style={[gs.divider, styles.memberDivider]} />}
              <MemberRow member={m} onCall={call} />
            </View>
          ))}
        </Card>
      </ScrollView>

      <ImageViewerModal uri={zoomed} onClose={() => setZoomed(null)} />
    </View>
  );
}

// ─── Piezas ───────────────────────────────────────────────────────────────────

function SectionTitle({ text, count }: { text: string; count?: number }) {
  const { colors } = useTheme();
  return (
    <CustomTextComponent
      fontSize={FONT_SIZE.xs}
      fontWeight={FONT_WEIGHT.semibold as any}
      color={colors.textTertiary}
      style={styles.sectionTitle}>
      {text.toUpperCase()}
      {count ? ` · ${count}` : ''}
    </CustomTextComponent>
  );
}

function AssetGroup({
  icon,
  label,
  items,
  declaredCount,
}: {
  icon: string;
  label: string;
  items: { id: string; code: string; location?: string | null }[];
  declaredCount: number;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.assetGroup}>
      <View style={styles.assetHead}>
        <Icon name={icon} size={18} color={colors.primary} />
        <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary}>
          {label}
        </CustomTextComponent>
      </View>

      {items.length > 0 ? (
        items.map(a => (
          <View key={a.id} style={styles.assetRow}>
            <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary}>
              {a.code}
            </CustomTextComponent>
            {!!a.location && (
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ flexShrink: 1 }}>
                {a.location}
              </CustomTextComponent>
            )}
          </View>
        ))
      ) : (
        // La unidad dice cuántos tiene aunque la administración no haya
        // registrado cuáles: se muestra lo que se sabe y se dice lo que falta.
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
          {declaredCount > 0
            ? `Tu unidad tiene ${declaredCount}. La administración aún no registró ${declaredCount === 1 ? 'cuál es' : 'cuáles son'}.`
            : 'Tu unidad no tiene.'}
        </CustomTextComponent>
      )}
    </View>
  );
}

function VehicleCard({
  vehicle,
  parking,
  onPress,
  onPhoto,
}: {
  vehicle: MyUnitVehicle;
  parking: ParkingState;
  onPress: () => void;
  onPhoto: () => void;
}) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const muted = parking.chip.variant === 'warning' || parking.chip.variant === 'neutral';
  const description = [vehicle.brand, vehicle.model, vehicle.year, vehicle.color]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity
      style={[styles.vehicleCard, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.85}>
      <TouchableOpacity
        onPress={onPhoto}
        disabled={!vehicle.photoUrl}
        activeOpacity={0.9}
        style={[styles.vehiclePhoto, { backgroundColor: colors.primarySurface }]}>
        {vehicle.photoUrl ? (
          <Image source={{ uri: vehicle.photoUrl }} style={styles.vehicleImage} resizeMode="cover" />
        ) : (
          <Icon name={VEHICLE_TYPE_ICON[vehicle.type] ?? 'directions-car'} size={36} color={colors.primary} />
        )}
      </TouchableOpacity>

      <View style={[gs.flex1, styles.vehicleBody]}>
        <View style={styles.vehicleTop}>
          <View style={[styles.plate, { borderColor: colors.textPrimary }]}>
            <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary}>
              {vehicle.plate}
            </CustomTextComponent>
          </View>
          <StatusChip label={parking.chip.label} variant={parking.chip.variant} />
        </View>
        {!!description && (
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} numberOfLines={1}>
            {description}
          </CustomTextComponent>
        )}
        <View style={styles.vehicleSpot}>
          <Icon name={parking.icon} size={14} color={muted ? colors.textTertiary : colors.primary} />
          <CustomTextComponent
            fontSize={FONT_SIZE.xs}
            color={muted ? colors.textSecondary : colors.textPrimary}
            style={{ flexShrink: 1 }}>
            {parking.detail}
          </CustomTextComponent>
        </View>
      </View>

      <Icon name="chevron-right" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

function MemberRow({ member, onCall }: { member: MyUnitMember; onCall: (phone: string) => void }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const fullName = [formatName(member.name), formatName(member.lastName)].filter(Boolean).join(' ');
  const since = member.startDate
    ? new Date(member.startDate).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
    : null;

  return (
    <View style={styles.memberRow}>
      <Avatar name={fullName} size="md" />
      <View style={gs.flex1}>
        <View style={styles.memberName}>
          <CustomTextComponent
            fontSize={FONT_SIZE.md}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textPrimary}
            numberOfLines={1}
            style={{ flexShrink: 1 }}>
            {fullName}
          </CustomTextComponent>
          {member.isMe && <StatusChip label="Tú" variant="info" />}
        </View>
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textSecondary}>
          {[HOUSEHOLD_LABEL[member.type], member.isMainResident ? 'Principal' : null, since ? `desde ${since}` : null]
            .filter(Boolean)
            .join(' · ')}
        </CustomTextComponent>
      </View>
      {!member.isMe && !!member.phoneNumber && (
        <TouchableOpacity
          onPress={() => onCall(member.phoneNumber!)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.callBtn, { backgroundColor: colors.primarySurface }]}
          accessibilityLabel={`Llamar a ${fullName}`}>
          <Icon name="call" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.md, gap: SPACING.sm },
  unitHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  unitIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.md },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  sectionTitle: { letterSpacing: 0.8, marginTop: SPACING.md },
  assetGroup: { gap: SPACING.xs, paddingVertical: SPACING.xs },
  assetHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 2 },
  assetRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm, paddingLeft: 26 },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  vehiclePhoto: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  vehicleImage: { width: '100%', height: '100%' },
  vehicleBody: { gap: 4 },
  vehicleTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  plate: { borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  vehicleSpot: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  memberDivider: { marginVertical: 0 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
  memberName: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
