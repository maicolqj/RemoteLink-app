import React, { useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAmenitiesStore, type Amenity } from '../../store/amenities.store';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  AMENITY_ICON, AMENITY_TYPE_LABEL, formatMoney, openDaysLabel, priceLabel,
} from './amenities.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Amenities'>;

function AmenityCard({ amenity, onPress }: { amenity: Amenity; onPress: () => void }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();

  const typeLabel = AMENITY_TYPE_LABEL[String(amenity.type)] ?? 'Zona común';
  const days = openDaysLabel(amenity.schedules);
  const price = priceLabel(amenity);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.75}>
      <View style={[styles.cardIcon, { backgroundColor: colors.primarySurface }]}>
        <Icon name={AMENITY_ICON[String(amenity.type)] ?? 'deck'} size={22} color={colors.primary} />
      </View>

      <View style={gs.flex1}>
        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          numberOfLines={1}
          style={{ marginBottom: 2 }}>
          {amenity.name}
        </CustomTextComponent>

        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} numberOfLines={1}>
          {amenity.location ? `${typeLabel} · ${amenity.location}` : typeLabel}
        </CustomTextComponent>

        <CustomTextComponent
          fontSize={FONT_SIZE.sm}
          color={days ? colors.textSecondary : colors.error}
          numberOfLines={1}
          style={{ marginTop: 2 }}>
          {days || 'Sin horario disponible'}
        </CustomTextComponent>
      </View>

      <View style={styles.cardRight}>
        <CustomTextComponent
          fontSize={FONT_SIZE.sm}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={price === 'Gratis' ? colors.success : colors.textPrimary}>
          {price}
        </CustomTextComponent>
        <Icon name="chevron-right" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

export default function AmenitiesScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { amenities, bookings, isLoading, fetchAmenities, fetchBookings } = useAmenitiesStore();

  useEffect(() => {
    fetchAmenities();
    fetchBookings();
  }, [fetchAmenities, fetchBookings]);

  const onRefresh = useCallback(() => {
    fetchAmenities();
    fetchBookings();
  }, [fetchAmenities, fetchBookings]);

  // Solo lo que sigue vivo: al residente le importa lo que aún puede usar o
  // cancelar, no el historial.
  const activeBookings = bookings.filter(b =>
    ['PENDING', 'APPROVED', 'CHECKED_IN'].includes(String(b.status)),
  ).length;

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Zonas comunes" showBack onBack={() => navigation.goBack()} />

      <TouchableOpacity
        style={[styles.myBookings, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        onPress={() => navigation.navigate('MyAmenityBookings')}
        activeOpacity={0.75}>
        <Icon name="event-note" size={20} color={colors.primary} />
        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.medium as any}
          color={colors.textPrimary}
          style={gs.flex1}>
          Mis reservas
        </CustomTextComponent>
        {activeBookings > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <CustomTextComponent fontSize={11} fontWeight={FONT_WEIGHT.bold as any} color={colors.textInverse}>
              {String(activeBookings)}
            </CustomTextComponent>
          </View>
        )}
        <Icon name="chevron-right" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {isLoading && amenities.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={amenities}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <AmenityCard
              amenity={item}
              onPress={() => navigation.navigate('AmenityDetail', { amenityId: item.id })}
            />
          )}
          contentContainerStyle={amenities.length === 0 ? gs.flex1 : styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="deck"
              title="Sin zonas comunes"
              description="Tu conjunto aún no tiene zonas habilitadas para reservar."
            />
          }
          ItemSeparatorComponent={() => <View style={[gs.divider, { marginVertical: 0 }]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  myBookings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  badge: {
    borderRadius: RADIUS.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
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
    gap: 2,
  },
});

export { formatMoney };
