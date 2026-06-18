import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import VisitStatusBadge from '../../components/VisitStatusBadge';
import VisitTypeBadge from '../../components/VisitTypeBadge';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useVisitsStore, type Visit, type VisitStatus } from '../../store/visits.store';
import type { VisitsStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

// The global PanicFAB sits bottom-right (bottom 80 android / 100 ios, height 56).
// Stack the "add visit" FAB above it so they don't overlap.
const PANIC_FAB_BOTTOM = Platform.OS === 'ios' ? 100 : 80;
const ADD_FAB_BOTTOM = PANIC_FAB_BOTTOM + 56 + SPACING.md;

type VisitsNavProp = NativeStackNavigationProp<VisitsStackParamList, 'Visits'>;
type FilterTab = 'all' | 'pending' | 'active' | 'scheduled' | 'history';

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all',       label: 'Todas' },
  { key: 'active',    label: 'Activas' },
  { key: 'pending',   label: 'Por aprobar' },
  { key: 'scheduled', label: 'Agendadas' },
  // { key: 'history',   label: 'Historial' },
];

const HISTORY_STATUSES: VisitStatus[] = ['COMPLETED', 'DENIED', 'CANCELLED', 'EXPIRED', 'NO_SHOW'];

function filterVisits(visits: Visit[], tab: FilterTab): Visit[] {
  switch (tab) {
    case 'pending':   return visits.filter(v => v.status === 'PENDING_APPROVAL');
    case 'active':    return visits.filter(v => v.status === 'INSIDE' || v.status === 'APPROVED');
    case 'scheduled': return visits.filter(v => v.type === 'SCHEDULED' && !HISTORY_STATUSES.includes(v.status));
    case 'history':   return visits.filter(v => HISTORY_STATUSES.includes(v.status));
    default:          return visits;
  }
}

function formatVisitDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function VisitCard({ visit, onPress }: { visit: Visit; onPress: () => void }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const dateStr = visit.expectedArrivalAt ? formatVisitDate(visit.expectedArrivalAt) : formatVisitDate(visit.createdAt);

  return (
    <TouchableOpacity style={[styles.visitCard, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.cardIcon, { backgroundColor: colors.primarySurface }]}>
        <Icon name="person-pin" size={22} color={colors.primary} />
      </View>
      <View style={gs.flex1}>
        <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary} numberOfLines={1} style={{ marginBottom: 2 }}>
          {visit.visitor.fullName}
        </CustomTextComponent>
        <View style={{ marginTop: 3 }}>
          <VisitTypeBadge type={visit.type} />
        </View>
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 2 }}>
          {dateStr}
        </CustomTextComponent>
      </View>
      <View style={styles.cardRight}>
        <VisitStatusBadge status={visit.status} />
        {visit.visitor.isBlacklisted && <Icon name="block" size={14} color={colors.error} style={{ marginTop: 4 }} />}
      </View>
    </TouchableOpacity>
  );
}

export default function VisitsScreen() {
  const navigation = useNavigation<VisitsNavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { visits, isLoading, fetchVisits } = useVisitsStore();
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => { fetchVisits(); }, [fetchVisits]);
  const onRefresh = useCallback(() => { fetchVisits(); }, [fetchVisits]);

  const filtered = filterVisits(visits, filter);
  const pendingCount = visits.filter(v => v.status === 'PENDING_APPROVAL').length;

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Visitas" />

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

      {isLoading && visits.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <VisitCard visit={item} onPress={() => navigation.navigate('VisitDetail', { visitId: item.id })} />}
          contentContainerStyle={filtered.length === 0 ? gs.flex1 : styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="people"
              title="Sin visitas"
              description={filter === 'all' ? 'Registra o espera alertas de visitas.' : 'No hay visitas en esta categoría.'}
            />
          }
          ItemSeparatorComponent={() => <View style={[gs.divider, { marginVertical: 0 }]} />}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: ADD_FAB_BOTTOM, backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('ScheduleVisit')}
        activeOpacity={0.85}>
        <Icon name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>
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
    paddingBottom: ADD_FAB_BOTTOM + 56 + SPACING.md,
  },
  visitCard: {
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
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
