import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusChip from '../../components/StatusChip';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import { useMarketplaceStore } from '../../store/marketplace.store';
import type {
  Listing,
  ListingFilters,
  ListingType,
} from '../../../domain/responses/MarketplaceResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  LISTING_TYPES,
  LISTING_TYPE_LABEL,
  expiryLabel,
  listingPrice,
  listingUnitLabel,
} from './marketplace.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Marketplace'>;

/** Pestañas de la vitrina. "Guardados" es la lista de favoritos del residente. */
type Tab = 'all' | 'favorites';

/**
 * Clasificados: lo que venden, regalan o arriendan los vecinos.
 *
 * Reemplaza la tienda de demostración que traía la app —productos inventados,
 * carrito y total a pagar—. Aquí no hay pagos: la copropiedad presta el tablero
 * y el trato se cierra entre vecinos.
 */
export default function MarketplaceScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError } = useAlert();

  const resident = useAuthStore(state => state.resident);
  const complexId = resident?.complex?.id;

  const listings = useMarketplaceStore(state => state.listings);
  const categories = useMarketplaceStore(state => state.categories);
  const isLoading = useMarketplaceStore(state => state.isLoading);
  const hasNextPage = useMarketplaceStore(state => state.hasNextPage);
  const init = useMarketplaceStore(state => state.init);
  const loadListings = useMarketplaceStore(state => state.load);
  const loadMore = useMarketplaceStore(state => state.loadMore);
  const toggleFavorite = useMarketplaceStore(state => state.toggleFavorite);

  const [tab, setTab] = useState<Tab>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<ListingType | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /** La búsqueda la hace el servidor: se espera a que deje de escribir. */
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo<ListingFilters>(
    () => ({
      search: search || undefined,
      type: type ?? undefined,
      categoryId: categoryId ?? undefined,
      onlyFavorites: tab === 'favorites' ? true : undefined,
    }),
    [search, type, categoryId, tab],
  );

  const load = useCallback(async () => {
    if (!complexId) return;
    try {
      await loadListings(complexId, filters);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo cargar la vitrina.');
    }
  }, [complexId, filters, loadListings, showError]);

  useEffect(() => {
    if (complexId) init(complexId);
  }, [complexId, init]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const onToggleFavorite = useCallback(
    async (listing: Listing) => {
      try {
        await toggleFavorite(listing.id);
      } catch (e: any) {
        showError(e?.message ?? 'No se pudo guardar.');
      }
    },
    [toggleFavorite, showError],
  );

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => (
      <ListingCard
        listing={item}
        onPress={() =>
          navigation.navigate('ListingDetail', { listingId: item.id })
        }
        onToggleFavorite={() => onToggleFavorite(item)}
      />
    ),
    [navigation, onToggleFavorite],
  );

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Clasificados"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'sell',
          onPress: () => navigation.navigate('MyListings'),
        }}
      />

      <View style={styles.search}>
        <CustomInputComponent
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="¿Qué estás buscando?"
          leftIcon={{ name: 'search', color: colors.textTertiary }}
          rightIcon={
            searchInput.length > 0
              ? {
                  name: 'close',
                  color: colors.textTertiary,
                  onPress: () => setSearchInput(''),
                }
              : undefined
          }
          variant="outlined"
          marginBottom={0}
        />
      </View>

      <View style={styles.tabs}>
        {(
          [
            ['all', 'Todo'],
            ['favorites', 'Guardados'],
          ] as const
        ).map(([value, label]) => (
          <TouchableOpacity
            key={value}
            onPress={() => setTab(value)}
            style={[
              styles.tab,
              {
                backgroundColor:
                  tab === value ? colors.primary : colors.surface,
              },
            ]}>
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              fontWeight={FONT_WEIGHT.medium as any}
              color={tab === value ? colors.textInverse : colors.textSecondary}>
              {label}
            </CustomTextComponent>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filtros rápidos: el tipo primero, que es lo que más se usa. */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={LISTING_TYPES}
        keyExtractor={item => item}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setType(type === item ? null : item)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  type === item ? colors.primarySurface : colors.surface,
                borderColor: type === item ? colors.primary : colors.border,
              },
            ]}>
            <CustomTextComponent
              fontSize={FONT_SIZE.xs}
              color={type === item ? colors.primary : colors.textSecondary}>
              {LISTING_TYPE_LABEL[item]}
            </CustomTextComponent>
          </TouchableOpacity>
        )}
      />

      {categories.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item.id}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                setCategoryId(categoryId === item.id ? null : item.id)
              }
              style={[
                styles.chip,
                {
                  backgroundColor:
                    categoryId === item.id
                      ? colors.primarySurface
                      : colors.surface,
                  borderColor:
                    categoryId === item.id ? colors.primary : colors.border,
                },
              ]}>
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                color={
                  categoryId === item.id ? colors.primary : colors.textSecondary
                }>
                {item.name}
              </CustomTextComponent>
            </TouchableOpacity>
          )}
        />
      )}

      {isLoading && listings.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + SPACING.xxl * 2 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (complexId && hasNextPage) loadMore(complexId, filters);
          }}
          ListEmptyComponent={
            <EmptyState
              icon={tab === 'favorites' ? 'favorite-border' : 'storefront'}
              title={
                tab === 'favorites'
                  ? 'No has guardado nada'
                  : 'La vitrina está vacía'
              }
              description={
                tab === 'favorites'
                  ? 'Toca el corazón de un aviso para tenerlo a mano.'
                  : 'Todavía nadie ha publicado con estos filtros. Puedes ser el primero.'
              }
              actionLabel="Publicar un aviso"
              onAction={() => navigation.navigate('ListingForm')}
            />
          }
        />
      )}

      {/* Publicar es la acción principal de la pantalla, no una opción del menú. */}
      <TouchableOpacity
        onPress={() => navigation.navigate('ListingForm')}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + SPACING.lg,
          },
        ]}
        activeOpacity={0.85}>
        <Icon name="add" size={26} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Tarjeta ─────────────────────────────────────────────────────────────────

function ListingCard({
  listing,
  onPress,
  onToggleFavorite,
}: {
  listing: Listing;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const expiry = expiryLabel(listing);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.85}>
      <View
        style={[styles.cardImage, { backgroundColor: colors.primarySurface }]}>
        {listing.imageUrls[0] ? (
          <Image
            source={{ uri: listing.imageUrls[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Icon name="image-not-supported" size={30} color={colors.primary} />
        )}

        <TouchableOpacity
          onPress={onToggleFavorite}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.favBtn, { backgroundColor: colors.surface }]}>
          <Icon
            name={listing.viewerHasFavorited ? 'favorite' : 'favorite-border'}
            size={17}
            color={
              listing.viewerHasFavorited ? colors.error : colors.textTertiary
            }
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <CustomTextComponent
          fontSize={FONT_SIZE.sm}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          numberOfLines={2}
          style={styles.cardTitle}>
          {listing.title}
        </CustomTextComponent>

        <CustomTextComponent
          fontSize={FONT_SIZE.xs}
          color={colors.textTertiary}
          numberOfLines={1}>
          {listing.category?.name ?? LISTING_TYPE_LABEL[listing.type]}
        </CustomTextComponent>

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.bold as any}
          color={colors.primary}
          style={styles.cardPrice}>
          {listingPrice(listing)}
        </CustomTextComponent>

        <View style={gs.rowBetween}>
          <CustomTextComponent
            fontSize={FONT_SIZE.xs}
            color={colors.textTertiary}
            numberOfLines={1}>
            {listingUnitLabel(listing) ?? ''}
          </CustomTextComponent>
          {/* Solo se avisa lo que está por vencer: el resto no aporta nada. */}
          {expiry && <StatusChip label={expiry} variant="warning" />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  search: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  chipsRow: { flexGrow: 0 },
  chipsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  list: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  column: { gap: SPACING.md },
  card: { flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden' },
  cardImage: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  favBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    padding: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  cardBody: { padding: SPACING.md, gap: 2 },
  cardTitle: { marginBottom: 2 },
  cardPrice: { marginVertical: SPACING.xs },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
