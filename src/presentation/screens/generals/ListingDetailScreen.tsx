import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusChip from '../../components/StatusChip';
import ImageViewerModal from '../../components/ImageViewerModal';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useMarketplaceStore } from '../../store/marketplace.store';
import { openListingConversation } from '../../../infraestructure/services/marketplace-chat.service';
import {
  fetchListing,
  registerInterest,
  reportListing,
  toggleFavorite,
} from '../../../infraestructure/services/marketplace.service';
import type {
  Listing,
  ReportReason,
} from '../../../domain/responses/MarketplaceResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  CONDITION_LABEL,
  canEditStatus,
  LISTING_STATUS_LABEL,
  LISTING_STATUS_TONE,
  LISTING_TYPE_LABEL,
  REPORT_REASONS,
  listingPrice,
  listingUnitLabel,
  listingWhen,
} from './marketplace.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'ListingDetail'>;
type DetailRoute = RouteProp<HomeStackParamList, 'ListingDetail'>;

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
 * La ficha de un aviso.
 *
 * "Me interesa" es el camino normal: el aviso le llega al vecino con el nombre
 * y la unidad de quien pregunta, y es él quien decide devolver el contacto. El
 * teléfono solo aparece si su dueño lo destapó y el conjunto permite ese canal
 * —eso lo decide el servidor, aquí solo se pinta lo que llegó—.
 */
export default function ListingDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<DetailRoute>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showAlert, showError, showSuccess } = useAlert();

  const patchListing = useMarketplaceStore(state => state.patchListing);

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [zoomed, setZoomed] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchListing(params.listingId);
      setListing(data);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo abrir la publicación.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [params.listingId, showError, navigation]);

  /**
   * Al volver de editar hay que releer el aviso, pero sin la rueda de carga:
   * la ficha ya está pintada y volver a vaciarla se ve como un parpadeo.
   */
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        load();
        return;
      }
      fetchListing(params.listingId)
        .then(setListing)
        .catch(() => undefined);
    }, [load, params.listingId]),
  );

  /**
   * "Me interesa" abre el chat con quien publicó: el interés queda registrado,
   * a él le llega el aviso con tu nombre y tu unidad, y se pueden escribir sin
   * que ninguno vea el teléfono del otro. Si ya habían hablado, reabre la
   * misma conversación.
   */
  const onInterested = useCallback(async () => {
    if (!listing) return;
    setBusy(true);
    try {
      const conversation = await openListingConversation(listing.id);
      if (!listing.viewerHasContacted) {
        const updated = {
          ...listing,
          viewerHasContacted: true,
          contactsCount: listing.contactsCount + 1,
        };
        setListing(updated);
        patchListing(updated);
      }
      navigation.navigate('ChatConversation', {
        conversationId: conversation.id,
      });
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo abrir el chat.');
    } finally {
      setBusy(false);
    }
  }, [listing, patchListing, showError, navigation]);

  const onToggleFavorite = useCallback(async () => {
    if (!listing) return;
    try {
      const saved = await toggleFavorite(listing.id);
      const updated = {
        ...listing,
        viewerHasFavorited: saved,
        favoritesCount: Math.max(0, listing.favoritesCount + (saved ? 1 : -1)),
      };
      setListing(updated);
      patchListing(updated);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo guardar.');
    }
  }, [listing, patchListing, showError]);

  /**
   * Reportar. Quien reporta nunca se le muestra al autor del aviso: eso lo
   * garantiza el servidor, pero conviene decírselo a quien va a reportar —es lo
   * que le quita el miedo a hacerlo con un vecino de por medio—.
   */
  const onReport = useCallback(() => {
    if (!listing) return;

    showAlert({
      type: 'question',
      title: '¿Por qué lo reportas?',
      description: 'La administración lo revisa. Tu nombre no se le muestra a quien publicó.',
      buttons: [
        ...REPORT_REASONS.slice(0, 4).map(reason => ({
          text: reason.label,
          style: 'secondary' as const,
          onPress: () => {
            reportListing(listing.id, reason.value as ReportReason)
              .then(() =>
                showSuccess(
                  'La administración ya lo tiene para revisar.',
                  'Reporte enviado',
                ),
              )
              .catch((e: any) =>
                showError(e?.message ?? 'No se pudo enviar el reporte.'),
              );
          },
        })),
        { text: 'Cancelar', style: 'text' as const, onPress: () => undefined },
      ],
    });
  }, [listing, showAlert, showError, showSuccess]);

  /**
   * Deja constancia de que alguien buscó al vecino por fuera de la app.
   *
   * Sin esto el contador de interesados solo cuenta a los que tocaron “Me
   * interesa”, y quien publicó no se entera de las llamadas —que son la mayoría
   * cuando el teléfono está a la vista—. Si falla no se interrumpe la llamada:
   * el contacto es lo importante, el conteo es lo accesorio.
   */
  const trackContact = useCallback(() => {
    if (!listing || listing.viewerIsOwner) return;
    registerInterest(listing.id)
      .then(updated => {
        setListing(updated);
        patchListing(updated);
      })
      .catch(() => undefined);
  }, [listing, patchListing]);

  const openPhone = useCallback(
    (phone: string, viaWhatsApp: boolean) => {
      const clean = phone.replace(/[^\d+]/g, '');
      const url = viaWhatsApp
        ? `https://wa.me/${clean.replace('+', '')}`
        : `tel:${clean}`;
      Linking.openURL(url).catch(() =>
        showError('No se pudo abrir la aplicación.'),
      );
    },
    [showError],
  );

  /**
   * Llamar se confirma antes de salir de la app.
   *
   * El marcador del teléfono muestra el número —eso no lo decide la app—, así
   * que al menos se dice a quién se va a llamar antes de que aparezca: tocar
   * “Llamar” sin querer y quedar marcando a un vecino es lo que incomoda.
   */
  const onCall = useCallback(() => {
    const phone = listing?.contact?.phone;
    if (!phone) return;

    const who = listing?.contact?.displayName ?? 'tu vecino';
    const where = listing?.contact?.unitLabel ?? listingUnitLabel(listing!);

    showAlert({
      type: 'question',
      title: `¿Llamar a ${who}?`,
      description: [
        where,
        'Publicó su teléfono para que lo contacten por este aviso. Se abrirá la aplicación de llamadas.',
      ]
        .filter(Boolean)
        .join(' · '),
      buttons: [
        {
          text: 'Llamar',
          style: 'primary',
          onPress: () => {
            trackContact();
            openPhone(phone, false);
          },
        },
        { text: 'Cancelar', style: 'text', onPress: () => undefined },
      ],
    });
  }, [listing, showAlert, trackContact, openPhone]);

  const onWhatsApp = useCallback(() => {
    const phone = listing?.contact?.phone;
    if (!phone) return;
    trackContact();
    openPhone(phone, true);
  }, [listing, trackContact, openPhone]);

  if (isLoading || !listing) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader
          title="Publicación"
          showBack
          onBack={() => navigation.goBack()}
        />
        <LoadingSpinner />
      </View>
    );
  }

  const contact = listing.contact;
  const statusTone = LISTING_STATUS_TONE[listing.status] ?? 'muted';

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title={listing.type === 'SERVICE' ? 'Servicio' : 'Publicación'}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: listing.viewerHasFavorited ? 'favorite' : 'favorite-border',
          onPress: () => onToggleFavorite(),
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}>
        {listing.imageUrls.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.gallery}>
            {listing.imageUrls.map(url => (
              <TouchableOpacity
                key={url}
                activeOpacity={0.9}
                onPress={() => setZoomed(url)}>
                <Image source={{ uri: url }} style={styles.photo} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.body}>
          <View style={styles.chips}>
            <StatusChip
              label={LISTING_STATUS_LABEL[listing.status]}
              variant={TONE_TO_CHIP[statusTone]}
            />
            <StatusChip
              label={LISTING_TYPE_LABEL[listing.type]}
              variant="neutral"
            />
            {listing.category && (
              <StatusChip label={listing.category.name} variant="info" />
            )}
          </View>

          <CustomTextComponent
            fontSize={FONT_SIZE.xl}
            fontWeight={FONT_WEIGHT.bold as any}
            color={colors.textPrimary}>
            {listing.title}
          </CustomTextComponent>

          <CustomTextComponent
            fontSize={FONT_SIZE.xl}
            fontWeight={FONT_WEIGHT.bold as any}
            color={colors.primary}
            style={styles.price}>
            {listingPrice(listing)}
          </CustomTextComponent>

          {listing.condition && (
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              color={colors.textSecondary}>
              Estado: {CONDITION_LABEL[listing.condition]}
            </CustomTextComponent>
          )}

          <CustomTextComponent
            fontSize={FONT_SIZE.md}
            color={colors.textPrimary}
            style={styles.description}>
            {listing.description}
          </CustomTextComponent>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <CustomTextComponent
              fontSize={FONT_SIZE.xs}
              color={colors.textTertiary}>
              PUBLICA
            </CustomTextComponent>
            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}>
              {contact?.displayName ?? 'Un residente'}
            </CustomTextComponent>
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              color={colors.textSecondary}>
              {contact?.unitLabel ?? listingUnitLabel(listing) ?? ''}
            </CustomTextComponent>

            {/* El teléfono lo decide el servidor. Si no vino, no existe. */}
            {contact?.phone ? (
              <View style={styles.contactRow}>
                <CustomButtonComponent
                  text="Llamar"
                  iconLeft={{
                    name: 'call',
                    type: 'material',
                    color: colors.textInverse,
                  }}
                  onPress={onCall}
                  style={[
                    styles.actionBtn,
                    gs.flex1,
                    { backgroundColor: colors.primary },
                  ]}
                  textStyle={{
                    color: colors.textInverse,
                    fontWeight: FONT_WEIGHT.semibold,
                  }}
                />
                {contact.preference === 'WHATSAPP' && (
                  <CustomButtonComponent
                    text="WhatsApp"
                    iconLeft={{
                      name: 'chat',
                      type: 'material',
                      color: colors.textInverse,
                    }}
                    onPress={onWhatsApp}
                    style={[
                      styles.actionBtn,
                      gs.flex1,
                      { backgroundColor: colors.success },
                    ]}
                    textStyle={{
                      color: colors.textInverse,
                      fontWeight: FONT_WEIGHT.semibold,
                    }}
                  />
                )}
              </View>
            ) : (
              <View style={styles.hintRow}>
                <Icon name="lock" size={14} color={colors.textTertiary} />
                <CustomTextComponent
                  fontSize={FONT_SIZE.xs}
                  color={colors.textTertiary}>
                  Tu vecino no publicó su teléfono. Toca “Me interesa” y
                  escríbele por el chat: ninguno ve el número del otro.
                </CustomTextComponent>
              </View>
            )}
          </View>

          <View style={gs.rowBetween}>
            <CustomTextComponent
              fontSize={FONT_SIZE.xs}
              color={colors.textTertiary}>
              {listing.viewsCount} vistas · {listing.favoritesCount} guardados
            </CustomTextComponent>
            <CustomTextComponent
              fontSize={FONT_SIZE.xs}
              color={colors.textTertiary}>
              {listingWhen(listing.publishedAt ?? listing.createdAt)}
            </CustomTextComponent>
          </View>

          {!listing.viewerIsOwner && (
            <>
              <CustomButtonComponent
                text={
                  listing.viewerHasContacted
                    ? 'Ver la conversación'
                    : 'Me interesa · escribirle'
                }
                iconLeft={{
                  name: listing.viewerHasContacted ? 'chat' : 'waving-hand',
                  type: 'material',
                  color: colors.textInverse,
                }}
                onPress={onInterested}
                isLoading={busy}
                // Con una conversación abierta se puede volver a ella aunque el
                // aviso ya no esté publicado: queda para consulta.
                disabled={
                  listing.status !== 'PUBLISHED' && !listing.viewerHasContacted
                }
                loaderColor={colors.textInverse}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                textStyle={{
                  color: colors.textInverse,
                  fontSize: FONT_SIZE.md,
                  fontWeight: FONT_WEIGHT.semibold,
                }}
              />

              <TouchableOpacity onPress={onReport} style={styles.reportBtn}>
                <Icon name="flag" size={15} color={colors.error} />
                <CustomTextComponent
                  fontSize={FONT_SIZE.xs}
                  color={colors.error}>
                  Reportar esta publicación
                </CustomTextComponent>
              </TouchableOpacity>
            </>
          )}

          {listing.viewerIsOwner && (
            <CustomButtonComponent
              text={
                listing.contactsCount > 0
                  ? `Mensajes de este aviso (${listing.contactsCount})`
                  : 'Mensajes de este aviso'
              }
              iconLeft={{
                name: 'chat',
                type: 'material',
                color: colors.textInverse,
              }}
              onPress={() =>
                navigation.navigate('ChatInbox', {
                  listingId: listing.id,
                  title: 'Mensajes del aviso',
                })
              }
              style={[styles.primaryBtn, { backgroundColor: colors.success }]}
              textStyle={{
                color: colors.textInverse,
                fontSize: FONT_SIZE.md,
                fontWeight: FONT_WEIGHT.semibold,
              }}
            />
          )}

          {listing.viewerIsOwner && canEditStatus(listing.status) && (
            <CustomButtonComponent
              text="Editar el aviso"
              iconLeft={{
                name: 'edit',
                type: 'material',
                color: colors.textInverse,
              }}
              onPress={() =>
                navigation.navigate('ListingForm', { listingId: listing.id })
              }
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              textStyle={{
                color: colors.textInverse,
                fontSize: FONT_SIZE.md,
                fontWeight: FONT_WEIGHT.semibold,
              }}
            />
          )}

          {listing.viewerIsOwner && (
            <CustomButtonComponent
              text={
                listing.type === 'SERVICE'
                  ? 'Administrar mis servicios'
                  : 'Administrar mis avisos'
              }
              iconLeft={{
                name: 'sell',
                type: 'material',
                color: colors.textInverse,
              }}
              onPress={() =>
                navigation.navigate('MyListings', {
                  service: listing.type === 'SERVICE',
                })
              }
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              textStyle={{
                color: colors.textInverse,
                fontSize: FONT_SIZE.md,
                fontWeight: FONT_WEIGHT.semibold,
              }}
            />
          )}
        </View>
      </ScrollView>

      <ImageViewerModal uri={zoomed} onClose={() => setZoomed(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxl },
  gallery: { maxHeight: 260 },
  photo: { width: 320, height: 260 },
  body: { padding: SPACING.lg, gap: SPACING.sm },
  chips: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap' },
  price: { marginTop: SPACING.xs },
  description: { marginVertical: SPACING.sm, lineHeight: 21 },
  card: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs,
    marginVertical: SPACING.sm,
  },
  contactRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  primaryBtn: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
  actionBtn: { borderRadius: RADIUS.lg, paddingVertical: SPACING.xs },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
  },
});
