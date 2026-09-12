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
import VisitStatusBadge from '../../components/VisitStatusBadge';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAmenitiesStore, type AmenityBooking } from '../../store/amenities.store';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { AMENITY_ICON, BOOKING_STATUS_CFG, bookingWhenLabel } from './amenities.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'MyAmenityBookings'>;
type FilterTab = 'active' | 'past' | 'all';

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'active', label: 'Vigentes' },
  { key: 'past',   label: 'Pasadas' },
  { key: 'all',    label: 'Todas' },
];

/** Vigente = todavía puede usarse o cancelarse. */
const ACTIVE_STATUSES = ['PENDING', 'APPROVED', 'CHECKED_IN'];

function filterBookings(bookings: AmenityBooking[], tab: FilterTab): AmenityBooking[] {
  switch (tab) {
    case 'active': return bookings.filter(b => ACTIVE_STATUSES.includes(String(b.status)));
    case 'past':   return bookings.filter(b => !ACTIVE_STATUSES.includes(String(b.status)));
    default:       return bookings;
  }
}

function BookingCard({ booking, onPress }: { booking: AmenityBooking; onPress: () => void }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();

  const when = bookingWhenLabel(booking.startAt, booking.endAt, booking.amenity?.durationUnit);
  const icon = AMENITY_ICON[String(booking.amenity?.type)] ?? 'deck';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.75}>
      <View style={[styles.cardIcon, { backgroundColor: colors.primarySurface }]}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>

      <View style={gs.flex1}>
        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          numberOfLines={1}
          style={{ marginBottom: 2 }}>
          {booking.amenity?.name ?? 'Zona común'}
        </CustomTextComponent>

        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} numberOfLines={1}>
          {when}
        </CustomTextComponent>

        {/* El cobro por daños es la única sorpresa posible en una reserva ya
            cerrada; se muestra sin tener que abrir el detalle. */}
        {booking.damageAmount > 0 && (
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.error} numberOfLines={1} style={{ marginTop: 2 }}>
            Cobro por daños registrado
          </CustomTextComponent>
        )}
      </View>

      <View style={styles.cardRight}>
        <VisitStatusBadge status={String(booking.status)} customConfig={BOOKING_STATUS_CFG} />
        {!!booking.accessCode && String(booking.status) === 'APPROVED' && (
          <CustomTextComponent fontSize={11} color={colors.textSecondary} style={{ marginTop: 4 }}>
            {booking.accessCode}
          </CustomTextComponent>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function MyAmenityBookingsScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { bookings, isLoading, fetchBookings } = useAmenitiesStore();
  const [filter, setFilter] = useState<FilterTab>('active');

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  const onRefresh = useCallback(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = filterBookings(bookings, filter);
  const activeCount = bookings.filter(b => ACTIVE_STATUSES.includes(String(b.status))).length;

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Mis reservas" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.filterBarContent}>
        {FILTERS.map(f => {
          const isActive = filter === f.key;
          const badge = f.key === 'active' && activeCount > 0 ? activeCount : null;
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

      {isLoading && bookings.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => navigation.navigate('AmenityBookingDetail', { bookingId: item.id })}
            />
          )}
          contentContainerStyle={filtered.length === 0 ? gs.flex1 : styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="event-note"
              title="Sin reservas"
              description={
                filter === 'active'
                  ? 'No tienes reservas vigentes. Reserva una zona común desde el listado.'
                  : 'Aquí verás tus reservas anteriores.'
              }
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
  card: {
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
  },
});
