import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import VisitStatusBadge, { type StatusBadgeCfg } from '../../components/VisitStatusBadge';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { usePackagesStore, type Package } from '../../store/packages.store';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type PackagesNavProp = NativeStackNavigationProp<HomeStackParamList, 'Packages'>;
type FilterTab = 'all' | 'pending' | 'delivered' | 'returned';

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all',       label: 'Todos' },
  { key: 'pending',   label: 'Por recoger' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'returned',  label: 'Devueltos' },
];

// Pending = received by portería but not yet handed to the resident.
const PENDING_STATUSES = ['RECEIVED', 'NOTIFIED', 'READY_FOR_PICKUP'];
const RETURNED_STATUSES = ['RETURNED', 'LOST'];

function filterPackages(packages: Package[], tab: FilterTab): Package[] {
  switch (tab) {
    case 'pending':   return packages.filter(p => PENDING_STATUSES.includes(String(p.status)));
    case 'delivered': return packages.filter(p => p.status === 'DELIVERED');
    case 'returned':  return packages.filter(p => RETURNED_STATUSES.includes(String(p.status)));
    default:          return packages;
  }
}

// Same palette as PackageDetailScreen so the badge reads consistently. The
// resident list only returns pending states (RECEIVED | NOTIFIED |
// READY_FOR_PICKUP) but the full map keeps the detail screen in sync.
const PACKAGE_STATUS_CFG: Record<string, StatusBadgeCfg> = {
  RECEIVED:         { label: 'Recibido',   color: '#55C2DA', bg: 'rgba(85,194,218,0.18)'  },
  NOTIFIED:         { label: 'Notificado', color: '#F59E0B', bg: 'rgba(245,158,11,0.18)'  },
  READY_FOR_PICKUP: { label: 'Por recoger', color: '#3B82F6', bg: 'rgba(59,130,246,0.18)' },
  DELIVERED:        { label: 'Entregado',  color: '#10B981', bg: 'rgba(16,185,129,0.18)'  },
  RETURNED:         { label: 'Devuelto',   color: '#EF4444', bg: 'rgba(239,68,68,0.18)'   },
  LOST:             { label: 'Extraviado', color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
};

const TYPE_LABEL: Record<string, string> = {
  PARCEL: 'Paquete', ENVELOPE: 'Sobre', FOOD: 'Comida', FRAGILE: 'Frágil', DOCUMENT: 'Documento', OTHER: 'Otro',
};

function formatPackageDate(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function PackageCard({ pkg, onPress }: { pkg: Package; onPress: () => void }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const title = pkg.description || pkg.trackingCode || 'Paquete';
  const typeLabel = pkg.type ? (TYPE_LABEL[String(pkg.type)] ?? String(pkg.type)) : null;
  const dateStr = formatPackageDate(pkg.receivedAt);

  return (
    <TouchableOpacity style={[styles.packageCard, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.cardIcon, { backgroundColor: colors.primarySurface }]}>
        <Icon name="inventory-2" size={22} color={colors.primary} />
      </View>
      <View style={gs.flex1}>
        <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary} numberOfLines={1} style={{ marginBottom: 2 }}>
          {title}
        </CustomTextComponent>
        {pkg.senderName ? (
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} numberOfLines={1}>
            {typeLabel ? `${typeLabel} · ` : ''}{pkg.senderName}
          </CustomTextComponent>
        ) : typeLabel ? (
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
            {typeLabel}
          </CustomTextComponent>
        ) : null}
        {dateStr ? (
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 2 }}>
            {dateStr}
          </CustomTextComponent>
        ) : null}
      </View>
      <View style={styles.cardRight}>
        <VisitStatusBadge status={String(pkg.status)} customConfig={PACKAGE_STATUS_CFG} />
      </View>
    </TouchableOpacity>
  );
}

export default function PackagesScreen() {
  const navigation = useNavigation<PackagesNavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { packages, isLoading, fetchPackages } = usePackagesStore();
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => { fetchPackages(); }, [fetchPackages]);
  const onRefresh = useCallback(() => { fetchPackages(); }, [fetchPackages]);

  const filtered = filterPackages(packages, filter);
  const pendingCount = packages.filter(p => PENDING_STATUSES.includes(String(p.status))).length;

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Paquetes" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.filterBarContent}>
        {FILTERS.map(f => {
          const isActive = filter === f.key;
          const badge = f.key === 'pending' && pendingCount > 0 ? pendingCount : null;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, { backgroundColor: isActive ? colors.primary : colors.background }]}
              onPress={() => setFilter(f.key)}>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                fontWeight={FONT_WEIGHT.medium as any}
                color={isActive ? colors.textInverse : colors.textSecondary}>
                {f.label}
              </CustomTextComponent>
              {badge !== null && (
                <View style={[styles.badge, { backgroundColor: isActive ? colors.textInverse : colors.error }]}>
                  <CustomTextComponent fontSize={11} fontWeight={FONT_WEIGHT.bold as any} color={isActive ? colors.primary : colors.textInverse}>
                    {String(badge)}
                  </CustomTextComponent>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading && packages.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <PackageCard pkg={item} onPress={() => navigation.navigate('PackageDetail', { packageId: item.id })} />}
          contentContainerStyle={filtered.length === 0 ? gs.flex1 : styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="inventory-2"
              title="Sin paquetes"
              description={filter === 'all' ? 'Aquí verás los paquetes que portería reciba a tu nombre.' : 'No hay paquetes en esta categoría.'}
            />
          }
          ItemSeparatorComponent={() => <View style={[gs.divider, { marginVertical: 0 }]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    borderBottomWidth: 1,
    maxHeight: 48,
    minHeight: 48,
  },
  filterBarContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  badge: {
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  list: {
    paddingBottom: SPACING.xxl,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
});
