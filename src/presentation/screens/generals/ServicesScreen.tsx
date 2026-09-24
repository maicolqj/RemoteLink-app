import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  FlatList,
  Platform,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import { useMarketplaceStore } from '../../store/marketplace.store';
import { useMarketplaceChatStore } from '../../store/marketplace-chat.store';
import {
  fetchListings,
  toggleFavorite as toggleFavoriteRequest,
} from '../../../infraestructure/services/marketplace.service';
import type {
  Listing,
  ListingFilters,
} from '../../../domain/responses/MarketplaceResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { listingPrice, listingUnitLabel } from './marketplace.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Services'>;

const FAB_SIZE = 56;

/** Ver `MarketplaceScreen`: el botón de publicar va encima del de pánico. */
const PANIC_FAB_BOTTOM = Platform.OS === 'ios' ? 100 : 90;
const PANIC_HALO_OFFSET = 10;
const PANIC_FAB_TOP = PANIC_FAB_BOTTOM + PANIC_HALO_OFFSET + FAB_SIZE;

type Tab = 'all' | 'favorites';

/**
 * Directorio de servicios: los vecinos que ofrecen un oficio.
 *
 * Comparte datos con clasificados —mismo aviso, misma ficha, misma
 * moderación— pero no la vitrina: aquí no se busca por foto sino por oficio y
 * por quién es, así que va en lista tipo ficha y no en cuadrícula.
 *
 * La lista vive en el estado de la pantalla y no en el store de clasificados:
 * compartirlo haría que abrir una vitrina borrara la otra al volver atrás.
 */
export default function ServicesScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError } = useAlert();

  const resident = useAuthStore(state => state.resident);
  const complexId = resident?.complex?.id;

  const categories = useMarketplaceStore(state => state.serviceCategories);
  const init = useMarketplaceStore(state => state.init);
  const unreadMessages = useMarketplaceChatStore(state => state.unreadTotal);

  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const publishFabBottom = Math.max(
    SPACING.lg,
    PANIC_FAB_TOP - tabBarHeight + SPACING.md,
  );

  const [items, setItems] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadingMore = useRef(false);

  const [tab, setTab] = useState<Tab>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo<ListingFilters>(
    () => ({
      type: 'SERVICE',
      search: search || undefined,
      categoryId: categoryId ?? undefined,
      onlyFavorites: tab === 'favorites' ? true : undefined,
    }),
    [search, categoryId, tab],
  );

  useEffect(() => {
    if (complexId) init(complexId);
  }, [complexId, init]);

  const load = useCallback(async () => {
    if (!complexId) return;
    try {
      const result = await fetchListings(complexId, 1, filters);
      setItems(result.items);
      setPage(result.pagination.currentPage);
      setHasNextPage(result.pagination.hasNextPage);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo cargar el directorio.');
    } finally {
      setIsLoading(false);
    }
  }, [complexId, filters, showError]);

  /**
   * Se recarga al volver a la pantalla: la ficha y el formulario cambian avisos
   * que esta lista no ve pasar, y un servicio recién publicado tiene que salir.
   */
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const loadMore = useCallback(async () => {
    if (!complexId || !hasNextPage || loadingMore.current) return;
    loadingMore.current = true;
    try {
      const next = await fetchListings(complexId, page + 1, filters);
      setItems(prev => [
        ...prev,
        ...next.items.filter(item => !prev.some(p => p.id === item.id)),
      ]);
      setPage(next.pagination.currentPage);
      setHasNextPage(next.pagination.hasNextPage);
    } catch {
      // La siguiente página se vuelve a pedir al seguir bajando.
    } finally {
      loadingMore.current = false;
    }
  }, [complexId, hasNextPage, page, filters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const onToggleFavorite = useCallback(
    async (listing: Listing) => {
      try {
        const saved = await toggleFavoriteRequest(listing.id);
        setItems(prev =>
          prev.map(item =>
            item.id === listing.id
              ? { ...item, viewerHasFavorited: saved }
              : item,
          ),
        );
      } catch (e: any) {
        showError(e?.message ?? 'No se pudo guardar.');
      }
    },
    [showError],
  );

  const openForm = useCallback(
    () => navigation.navigate('ListingForm', { service: true }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => (
      <ServiceRow
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
        title="Servicios"
        showBack
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: 'chat-bubble-outline',
            onPress: () => navigation.navigate('ChatInbox'),
            badge: unreadMessages,
          },
          {
            icon: 'handyman',
            onPress: () => navigation.navigate('MyListings', { service: true }),
          },
        ]}
      />

      <View style={styles.search}>
        <CustomInputComponent
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="¿Qué servicio necesitas?"
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
            ['all', 'Todos'],
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
            ]}
          >
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              fontWeight={FONT_WEIGHT.medium as any}
              color={tab === value ? colors.textInverse : colors.textSecondary}
            >
              {label}
            </CustomTextComponent>
          </TouchableOpacity>
        ))}
      </View>

      {categories.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item.id}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}
          renderItem={({ item }) => {
            const isActive = categoryId === item.id;
            return (
              <TouchableOpacity
                onPress={() => setCategoryId(isActive ? null : item.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive
                      ? colors.primarySurface
                      : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Icon
                  name={item.icon || 'handyman'}
                  size={14}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
                <CustomTextComponent
                  fontSize={FONT_SIZE.xs}
                  color={isActive ? colors.primary : colors.textSecondary}
                >
                  {item.name}
                </CustomTextComponent>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {isLoading && items.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: publishFabBottom + FAB_SIZE + SPACING.lg },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListEmptyComponent={
            <EmptyState
              icon={tab === 'favorites' ? 'favorite-border' : 'handyman'}
              title={
                tab === 'favorites'
                  ? 'No has guardado ningún servicio'
                  : 'Nadie ofrece servicios todavía'
              }
              description={
                tab === 'favorites'
                  ? 'Toca el corazón de un servicio para tenerlo a mano.'
                  : '¿Sabes hacer algo que tus vecinos necesiten? Inscríbete en un minuto: no necesitas fotos.'
              }
              actionLabel="Ofrecer un servicio"
              onAction={openForm}
            />
          }
        />
      )}

      <TouchableOpacity
        onPress={openForm}
        style={[
          styles.fab,
          { backgroundColor: colors.primary, bottom: publishFabBottom },
        ]}
        activeOpacity={0.85}
      >
        <Icon name="add" size={26} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Ficha ──────────────────────────────────────────────────────────────────

function ServiceRow({
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
  const unit = listingUnitLabel(listing);
  const who = [listing.contact?.displayName, unit].filter(Boolean).join(' · ');
  const hasPhone = !!listing.contact?.phone;

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primarySurface }]}>
        <Icon
          name={listing.category?.icon || 'handyman'}
          size={24}
          color={colors.primary}
        />
      </View>

      <View style={gs.flex1}>
        <CustomTextComponent
          fontSize={FONT_SIZE.xs}
          color={colors.primary}
          fontWeight={FONT_WEIGHT.medium as any}
          numberOfLines={1}
        >
          {listing.category?.name ?? 'Servicio'}
        </CustomTextComponent>
        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          numberOfLines={1}
        >
          {listing.title}
        </CustomTextComponent>
        {!!listing.description && (
          <CustomTextComponent
            fontSize={FONT_SIZE.xs}
            color={colors.textSecondary}
            numberOfLines={2}
            style={styles.rowDescription}
          >
            {listing.description}
          </CustomTextComponent>
        )}

        <View style={styles.rowFooter}>
          {!!who && (
            <CustomTextComponent
              fontSize={FONT_SIZE.xs}
              color={colors.textTertiary}
              numberOfLines={1}
              style={gs.flex1}
            >
              {who}
            </CustomTextComponent>
          )}
          {hasPhone && <Icon name="phone" size={14} color={colors.success} />}
          <CustomTextComponent
            fontSize={FONT_SIZE.xs}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textPrimary}
          >
            {listingPrice(listing)}
          </CustomTextComponent>
        </View>
      </View>

      <TouchableOpacity
        onPress={onToggleFavorite}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon
          name={listing.viewerHasFavorited ? 'favorite' : 'favorite-border'}
          size={20}
          color={
            listing.viewerHasFavorited ? colors.error : colors.textTertiary
          }
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  search: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    marginBottom: SPACING.md,
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  list: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDescription: { lineHeight: 15, marginTop: 2 },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: FAB_SIZE,
    height: FAB_SIZE,
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
