import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusChip from '../../components/StatusChip';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import {
  fetchListings,
  markListingAsSold,
  pauseListing,
  removeListing,
  renewListing,
  resumeListing,
} from '../../../infraestructure/services/marketplace.service';
import type { Listing } from '../../../domain/responses/MarketplaceResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  LISTING_STATUS_LABEL,
  LISTING_STATUS_TONE,
  canEditStatus,
  expiryLabel,
  listingPrice,
  listingWhen,
} from './marketplace.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'MyListings'>;

const TONE_TO_CHIP: Record<
  string,
  'success' | 'warning' | 'error' | 'info' | 'neutral'
> = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
  muted: 'neutral',
};

/**
 * Mis publicaciones, en cualquier estado.
 *
 * Es la única pantalla donde el residente ve sus borradores, lo que está
 * esperando aprobación y lo que le rechazaron —con el motivo—. Desde la vitrina
 * eso no se ve, porque ahí solo está lo publicado.
 */
export default function MyListingsScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showAlert, showError, showSuccess } = useAlert();

  const resident = useAuthStore(state => state.resident);
  const complexId = resident?.complex?.id;

  const [items, setItems] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!complexId) return;
    try {
      const page = await fetchListings(complexId, 1, { onlyMine: true });
      setItems(page.items);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudieron cargar tus publicaciones.');
    } finally {
      setIsLoading(false);
    }
  }, [complexId, showError]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const apply = useCallback((updated: Listing) => {
    setItems(prev =>
      prev.map(item => (item.id === updated.id ? updated : item)),
    );
  }, []);

  const run = useCallback(
    async (action: () => Promise<Listing>) => {
      try {
        apply(await action());
      } catch (e: any) {
        showError(e?.message ?? 'No se pudo completar.');
      }
    },
    [apply, showError],
  );

  /**
   * Retirar es definitivo y por eso se confirma. Lo demás —ocultar, cerrar,
   * renovar— se deshace con otro toque, así que preguntar solo estorbaría.
   */
  const confirmRemove = useCallback(
    (listing: Listing) => {
      showAlert({
        type: 'question',
        title: '¿Retirar la publicación?',
        description:
          'Sale de la vitrina y no se puede volver a publicar. Si solo quieres esconderla un rato, usa “Ocultar”.',
        buttons: [
          {
            text: 'Retirar',
            style: 'danger',
            onPress: () => {
              removeListing(listing.id)
                .then(() => {
                  setItems(prev => prev.filter(item => item.id !== listing.id));
                  showSuccess('La publicación salió de la vitrina.', 'Listo');
                })
                .catch((e: any) =>
                  showError(e?.message ?? 'No se pudo retirar.'),
                );
            },
          },
          { text: 'Cancelar', style: 'text', onPress: () => undefined },
        ],
      });
    },
    [showAlert, showError, showSuccess],
  );

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => {
      const tone = LISTING_STATUS_TONE[item.status] ?? 'muted';
      const expiry = expiryLabel(item);

      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.cardHead}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('ListingDetail', { listingId: item.id })
            }>
            {item.imageUrls[0] ? (
              <Image source={{ uri: item.imageUrls[0] }} style={styles.thumb} />
            ) : (
              <View
                style={[
                  styles.thumb,
                  styles.thumbEmpty,
                  { backgroundColor: colors.primarySurface },
                ]}>
                <Icon name="image-not-supported" size={20} color={colors.primary} />
              </View>
            )}

            <View style={gs.flex1}>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                fontWeight={FONT_WEIGHT.semibold as any}
                color={colors.textPrimary}
                numberOfLines={1}>
                {item.title}
              </CustomTextComponent>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                color={colors.primary}>
                {listingPrice(item)}
              </CustomTextComponent>
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                color={colors.textTertiary}>
                {item.viewsCount} vistas · {item.contactsCount} interesados
              </CustomTextComponent>
            </View>

            <View style={styles.cardChips}>
              <StatusChip
                label={LISTING_STATUS_LABEL[item.status]}
                variant={TONE_TO_CHIP[tone]}
              />
              {expiry && <StatusChip label={expiry} variant="warning" />}
            </View>
          </TouchableOpacity>

          {/* El motivo del rechazo es lo único que le permite corregir. */}
          {item.status === 'REJECTED' && item.rejectionReason && (
            <View
              style={[styles.reason, { backgroundColor: colors.warningLight }]}>
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                color={colors.textPrimary}>
                {item.rejectionReason}
              </CustomTextComponent>
            </View>
          )}

          <View style={styles.actions}>
            {/*
              Corregir se ofrece mientras el aviso siga siendo suyo: el que
              espera aprobación y el rechazado son justo los que hay que poder
              arreglar, y volver a publicarlo desde cero gasta el cupo de la
              unidad.
            */}
            {canEditStatus(item.status) && (
              <Action
                icon="edit"
                label="Editar"
                onPress={() =>
                  navigation.navigate('ListingForm', { listingId: item.id })
                }
              />
            )}

            {item.status === 'PUBLISHED' && (
              <>
                <Action
                  icon="visibility-off"
                  label="Ocultar"
                  onPress={() => run(() => pauseListing(item.id))}
                />
                <Action
                  icon="check-circle"
                  label="Ya se vendió"
                  onPress={() => run(() => markListingAsSold(item.id))}
                />
                <Action
                  icon="autorenew"
                  label="Renovar"
                  onPress={() => run(() => renewListing(item.id))}
                />
              </>
            )}

            {item.status === 'PAUSED' && (
              <Action
                icon="visibility"
                label="Publicar de nuevo"
                onPress={() => run(() => resumeListing(item.id))}
              />
            )}

            {item.status === 'EXPIRED' && (
              <Action
                icon="autorenew"
                label="Renovar"
                onPress={() => run(() => renewListing(item.id))}
              />
            )}

            {item.status !== 'REMOVED' && (
              <Action
                icon="delete-outline"
                label="Retirar"
                danger
                onPress={() => confirmRemove(item)}
              />
            )}
          </View>

          <CustomTextComponent
            fontSize={FONT_SIZE.xs}
            color={colors.textTertiary}
            style={styles.date}>
            {listingWhen(item.publishedAt ?? item.createdAt)}
          </CustomTextComponent>
        </View>
      );
    },
    [colors, gs, navigation, run, confirmRemove],
  );

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Mis publicaciones"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'add',
          onPress: () => navigation.navigate('ListingForm'),
        }}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + SPACING.xxl },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="sell"
              title="No has publicado nada"
              description="Vende, arrienda o regala lo que ya no usas a tus vecinos."
              actionLabel="Publicar un aviso"
              onAction={() => navigation.navigate('ListingForm')}
            />
          }
        />
      )}
    </View>
  );
}

function Action({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  const tint = danger ? colors.error : colors.primary;

  return (
    <TouchableOpacity onPress={onPress} style={styles.action}>
      <Icon name={icon} size={16} color={tint} />
      <CustomTextComponent fontSize={FONT_SIZE.xs} color={tint}>
        {label}
      </CustomTextComponent>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  list: { padding: SPACING.lg, gap: SPACING.md },
  card: { borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.sm },
  cardHead: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: RADIUS.md },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  cardChips: { gap: SPACING.xs, alignItems: 'flex-end' },
  reason: { padding: SPACING.sm, borderRadius: RADIUS.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  date: { textAlign: 'right' },
});
