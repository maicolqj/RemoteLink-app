import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { usePhotoPicker } from '../../hooks/usePhotoPicker';
import { useAuthStore } from '../../store/auth.store';
import { useMarketplaceStore } from '../../store/marketplace.store';
import {
  appendListingImages,
  createListing,
  fetchListing,
  updateListing,
} from '../../../infraestructure/services/marketplace.service';
import type { PhotoUpload } from '../../../domain/interfaces/PhotoUpload';
import type {
  ItemCondition,
  Listing,
  ListingType,
  PriceType,
} from '../../../domain/responses/MarketplaceResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  CONDITIONS,
  CONDITION_LABEL,
  LISTING_TYPES,
  LISTING_TYPE_LABEL,
  PRICE_TYPES,
  PRICE_TYPES_WITH_AMOUNT,
  PRICE_TYPE_LABEL,
  editModerationHint,
  moderationHint,
} from './marketplace.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'ListingForm'>;
type FormRoute = RouteProp<HomeStackParamList, 'ListingForm'>;

/** Miles con punto mientras se escribe: $800.000 se lee, 800000 se descifra. */
const formatThousands = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('es-CO');
};

/**
 * Publicar un aviso.
 *
 * Las fotos son obligatorias salvo en “Busco”: quien necesita algo todavía no
 * lo tiene para fotografiarlo. El servidor aplica la misma regla, así que
 * adelantarla aquí solo evita el viaje perdido.
 *
 * El teléfono NO se publica por defecto: mostrarlo es una decisión aparte, y
 * por eso es un interruptor apagado con su explicación al lado.
 *
 * La misma pantalla corrige un aviso propio cuando llega con `listingId`: el
 * residente que se equivocó en el precio —o al que le rechazaron el aviso—
 * arregla lo que escribió sin tener que publicarlo otra vez desde cero.
 */
export default function ListingFormScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<FormRoute>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showSuccess } = useAlert();
  const { choosePhoto } = usePhotoPicker();

  const resident = useAuthStore(state => state.resident);
  const complexId = resident?.complex?.id;

  const categories = useMarketplaceStore(state => state.categories);
  const settings = useMarketplaceStore(state => state.settings);
  const init = useMarketplaceStore(state => state.init);
  const patchListing = useMarketplaceStore(state => state.patchListing);

  const [type, setType] = useState<ListingType>('PRODUCT');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('FIXED');
  const [priceAmount, setPriceAmount] = useState('');
  const [condition, setCondition] = useState<ItemCondition | null>(null);
  const [showPhone, setShowPhone] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [busy, setBusy] = useState(false);

  const listingId = params?.listingId;
  const isEdit = !!listingId;

  /** Lo que ya está subido. Aquí solo se puede quitar; lo nuevo va en `photos`. */
  const [original, setOriginal] = useState<Listing | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);

  /**
   * Las categorías se cargan aquí también y no solo en la vitrina: a esta
   * pantalla se puede llegar directo desde "Mis publicaciones", y sin
   * categorías no hay nada que elegir — el aviso no se podría publicar y no
   * quedaría claro por qué.
   */
  useEffect(() => {
    if (complexId && categories.length === 0) init(complexId);
  }, [complexId, categories.length, init]);

  /**
   * Trae el aviso que se va a corregir y deja el formulario como quedó.
   *
   * Se pide al servidor y no se recibe por parámetro a propósito: quien entra
   * a editar tiene que ver el estado de ahora —pudo vencerse o haber pasado
   * por moderación mientras la lista estaba en pantalla—.
   */
  useEffect(() => {
    if (!listingId) return;
    let alive = true;

    fetchListing(listingId)
      .then(listing => {
        if (!alive) return;
        setOriginal(listing);
        setType(listing.type);
        setCategoryId(listing.categoryId);
        setTitle(listing.title);
        setDescription(listing.description);
        setPriceType(listing.priceType);
        setPriceAmount(
          listing.priceAmount === null || listing.priceAmount === undefined
            ? ''
            : formatThousands(String(listing.priceAmount)),
        );
        setCondition(listing.condition ?? null);
        setShowPhone(listing.showPhone);
        setExistingImages(listing.imageUrls);
        // Las condiciones se aceptaron al publicar; no se vuelven a pedir.
        setAcceptTerms(true);
      })
      .catch((e: any) => {
        showError(e?.message ?? 'No se pudo abrir el aviso.');
        navigation.goBack();
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [listingId, showError, navigation]);

  const maxPhotos = settings?.maxImagesPerListing ?? 5;
  const needsPhotos = type !== 'WANTED';
  const needsAmount = PRICE_TYPES_WITH_AMOUNT.includes(priceType);
  const totalPhotos = existingImages.length + photos.length;

  const availableTypes = useMemo(
    () =>
      settings?.allowWantedListings === false
        ? LISTING_TYPES.filter(item => item !== 'WANTED')
        : LISTING_TYPES,
    [settings],
  );

  const addPhotos = useCallback(() => {
    const remaining = maxPhotos - totalPhotos;
    if (remaining <= 0) {
      showError(`Puedes subir hasta ${maxPhotos} fotos.`);
      return;
    }

    choosePhoto(picked => {
      setPhotos(prev => [...prev, ...picked].slice(0, remaining + prev.length));
    }, remaining);
  }, [choosePhoto, maxPhotos, totalPhotos, showError]);

  /**
   * Guarda la corrección de un aviso propio.
   *
   * Primero se guarda el texto con la lista de fotos que debe quedar y solo
   * después se suben las nuevas: al revés, el tope de fotos del conjunto
   * contaría también las que el residente acaba de quitar.
   */
  const saveEdit = useCallback(async () => {
    if (!original || !categoryId) return;

    const imagesChanged =
      existingImages.length !== original.imageUrls.length ||
      existingImages.some((url, index) => original.imageUrls[index] !== url);

    const updated = await updateListing({
      listingId: original.id,
      type,
      categoryId,
      title: title.trim(),
      description: description.trim(),
      priceType,
      priceAmount: needsAmount
        ? Number(priceAmount.replace(/\D/g, ''))
        : undefined,
      condition: type === 'PRODUCT' && condition ? condition : undefined,
      contactPreference: showPhone ? 'WHATSAPP' : 'IN_APP',
      showPhone,
      imageUrls: imagesChanged ? existingImages : undefined,
    });

    if (photos.length > 0) {
      const imageUrls = await appendListingImages(original.id, photos);
      patchListing({ ...updated, imageUrls });
    } else {
      patchListing(updated);
    }

    showSuccess(
      updated.status === 'PENDING_REVIEW'
        ? 'Guardamos los cambios. La administración revisa el aviso otra vez antes de publicarlo.'
        : 'Guardamos los cambios en tu aviso.',
      'Listo',
    );
    navigation.goBack();
  }, [
    original, categoryId, existingImages, type, title, description, priceType,
    needsAmount, priceAmount, condition, showPhone, photos, navigation,
    showSuccess, patchListing,
  ]);

  const submit = useCallback(async () => {
    if (!complexId) return;

    if (!categoryId) return showError('Elige una categoría.');
    if (title.trim().length < 5) {
      return showError('El título necesita al menos 5 caracteres.');
    }
    if (description.trim().length < 10) {
      return showError('Describe un poco mejor lo que publicas.');
    }
    if (needsPhotos && totalPhotos === 0) {
      return showError(
        isEdit
          ? 'El aviso necesita al menos una foto. Agrega una antes de quitar las que están.'
          : 'Agrega al menos una foto: sin foto casi nadie abre un aviso.',
      );
    }
    if (needsAmount && !priceAmount.trim()) {
      return showError('Escribe el precio o cámbialo a “a convenir”.');
    }
    if (!acceptTerms) {
      return showError('Acepta las condiciones para publicar.');
    }

    setBusy(true);
    try {
      if (isEdit) {
        await saveEdit();
        return;
      }

      await createListing(
        {
          complexId,
          type,
          categoryId,
          title: title.trim(),
          description: description.trim(),
          priceType,
          priceAmount: needsAmount
            ? Number(priceAmount.replace(/\D/g, ''))
            : undefined,
          condition: type === 'PRODUCT' && condition ? condition : undefined,
          contactPreference: showPhone ? 'WHATSAPP' : 'IN_APP',
          showPhone,
          acceptTerms: true,
        },
        photos,
      );

      showSuccess(
        settings?.moderationMode === 'AUTO'
          ? 'Tu aviso ya está visible para el conjunto.'
          : 'La administración lo revisa y te avisamos cuando quede publicado.',
        'Aviso enviado',
      );
      navigation.goBack();
    } catch (e: any) {
      showError(
        e?.message ??
          (isEdit
            ? 'No se pudo guardar el aviso.'
            : 'No se pudo publicar el aviso.'),
      );
    } finally {
      setBusy(false);
    }
  }, [
    complexId, categoryId, title, description, needsPhotos, totalPhotos, photos,
    needsAmount, priceAmount, acceptTerms, type, priceType, condition,
    showPhone, settings, navigation, showError, showSuccess, isEdit, saveEdit,
  ]);

  const sectionTitle = (text: string, first = false) => (
    <CustomTextComponent
      fontSize={FONT_SIZE.md}
      fontWeight={FONT_WEIGHT.semibold as any}
      color={colors.textPrimary}
      style={first ? undefined : styles.sectionTitle}>
      {text}
    </CustomTextComponent>
  );

  if (isLoading) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader
          title="Editar aviso"
          showBack
          onBack={() => navigation.goBack()}
        />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title={isEdit ? 'Editar aviso' : 'Publicar aviso'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        keyboardShouldPersistTaps="handled">
        {sectionTitle('¿Qué vas a publicar?', true)}
        <View style={styles.chips}>
          {availableTypes.map(item => {
            const isActive = type === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setType(item)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                  },
                ]}>
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  color={isActive ? colors.textInverse : colors.textPrimary}>
                  {LISTING_TYPE_LABEL[item]}
                </CustomTextComponent>
              </TouchableOpacity>
            );
          })}
        </View>

        {sectionTitle('Categoría')}
        {categories.length === 0 ? (
          <CustomTextComponent
            fontSize={FONT_SIZE.sm}
            color={colors.textTertiary}>
            Cargando las categorías del conjunto…
          </CustomTextComponent>
        ) : (
          <View style={styles.chips}>
            {categories.map(category => {
              const isActive = categoryId === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isActive
                        ? colors.primary
                        : colors.surface,
                    },
                  ]}>
                  <CustomTextComponent
                    fontSize={FONT_SIZE.sm}
                    color={isActive ? colors.textInverse : colors.textPrimary}>
                    {category.name}
                  </CustomTextComponent>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {sectionTitle('Título')}
        <CustomInputComponent
          value={title}
          onChangeText={setTitle}
          placeholder="Nevera Haceb de 320 litros"
          maxLength={120}
        />

        {sectionTitle('Descripción')}
        <CustomInputComponent
          value={description}
          onChangeText={setDescription}
          placeholder="Cuéntale a tu vecino en qué estado está y por qué lo vendes"
          multiline
          numberOfLines={5}
          maxLength={4000}
        />

        {sectionTitle('Precio')}
        <View style={styles.chips}>
          {PRICE_TYPES.map(item => {
            const isActive = priceType === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setPriceType(item)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                  },
                ]}>
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  color={isActive ? colors.textInverse : colors.textPrimary}>
                  {PRICE_TYPE_LABEL[item]}
                </CustomTextComponent>
              </TouchableOpacity>
            );
          })}
        </View>

        {needsAmount && (
          <CustomInputComponent
            value={priceAmount}
            onChangeText={raw => setPriceAmount(formatThousands(raw))}
            placeholder="800.000"
            keyboardType="numeric"
            leftIcon={{ name: 'attach-money', color: colors.textTertiary }}
          />
        )}

        {type === 'PRODUCT' && (
          <>
            {sectionTitle('Estado del artículo')}
            <View style={styles.chips}>
              {CONDITIONS.map(item => {
                const isActive = condition === item;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setCondition(isActive ? null : item)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive
                          ? colors.primary
                          : colors.surface,
                      },
                    ]}>
                    <CustomTextComponent
                      fontSize={FONT_SIZE.sm}
                      color={
                        isActive ? colors.textInverse : colors.textPrimary
                      }>
                      {CONDITION_LABEL[item]}
                    </CustomTextComponent>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {sectionTitle(needsPhotos ? 'Fotos' : 'Fotos (opcionales)')}
        <CustomTextComponent
          fontSize={FONT_SIZE.sm}
          color={colors.textSecondary}>
          Hasta {maxPhotos}. La primera es la que se ve en la vitrina.
        </CustomTextComponent>

        <View style={styles.photos}>
          {/* Lo que ya está en R2: aquí solo se quita, no se vuelve a subir. */}
          {existingImages.map((url, index) => (
            <View key={url} style={styles.photoBox}>
              <Image source={{ uri: url }} style={styles.photo} />
              <TouchableOpacity
                onPress={() =>
                  setExistingImages(prev => prev.filter((_, i) => i !== index))
                }
                style={[styles.removePhoto, { backgroundColor: colors.error }]}>
                <Icon name="close" size={13} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          ))}

          {photos.map((photo, index) => (
            <View key={`${photo.uri}-${index}`} style={styles.photoBox}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <TouchableOpacity
                onPress={() =>
                  setPhotos(prev => prev.filter((_, i) => i !== index))
                }
                style={[styles.removePhoto, { backgroundColor: colors.error }]}>
                <Icon name="close" size={13} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          ))}

          {totalPhotos < maxPhotos && (
            <TouchableOpacity
              onPress={addPhotos}
              style={[
                styles.addPhoto,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.primarySurface,
                },
              ]}>
              <Icon name="add-a-photo" size={22} color={colors.primary} />
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                color={colors.primary}>
                Agregar
              </CustomTextComponent>
            </TouchableOpacity>
          )}
        </View>

        {/*
          Mostrar el teléfono es una decisión aparte de publicar: nace apagado
          porque publicar algo no es autorizar que el número quede a la vista de
          todo el conjunto.
        */}
        {settings?.allowPhoneContact !== false && (
          <View
            style={[
              styles.switchRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={gs.flex1}>
              <CustomTextComponent
                fontSize={FONT_SIZE.md}
                fontWeight={FONT_WEIGHT.medium as any}
                color={colors.textPrimary}>
                Mostrar mi teléfono
              </CustomTextComponent>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                color={colors.textSecondary}>
                Si lo dejas apagado, tus vecinos te avisan por la app y tú
                decides si les devuelves el contacto.
              </CustomTextComponent>
            </View>
            <Switch value={showPhone} onValueChange={setShowPhone} />
          </View>
        )}

        {/* Las condiciones se aceptan al publicar; corregir no las vuelve a pedir. */}
        {!isEdit && (
          <TouchableOpacity
            onPress={() => setAcceptTerms(!acceptTerms)}
            activeOpacity={0.8}
            style={[
              styles.terms,
              {
                backgroundColor: colors.surface,
                borderColor: acceptTerms ? colors.primary : colors.border,
              },
            ]}>
            <Icon
              name={acceptTerms ? 'check-box' : 'check-box-outline-blank'}
              size={22}
              color={acceptTerms ? colors.primary : colors.textTertiary}
            />
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              color={colors.textSecondary}
              style={gs.flex1}>
              {settings?.termsText ??
                'La administración solo facilita este espacio: no participa en el negocio ni responde por él. Quien publica responde por su aviso.'}
            </CustomTextComponent>
          </TouchableOpacity>
        )}

        <View style={[styles.notice, { backgroundColor: colors.primarySurface }]}>
          <Icon name="info-outline" size={16} color={colors.primary} />
          <CustomTextComponent
            fontSize={FONT_SIZE.sm}
            color={colors.textSecondary}
            style={gs.flex1}>
            {isEdit
              ? editModerationHint(settings?.moderationMode, original?.status)
              : moderationHint(settings?.moderationMode)}
          </CustomTextComponent>
        </View>

        <CustomButtonComponent
          text={isEdit ? 'Guardar cambios' : 'Publicar'}
          onPress={submit}
          isLoading={busy}
          disabled={busy}
          loaderColor={colors.textInverse}
          iconLeft={{
            name: isEdit ? 'save' : 'send',
            type: 'material',
            color: colors.textInverse,
          }}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          textStyle={{
            color: colors.textInverse,
            fontSize: FONT_SIZE.md,
            fontWeight: FONT_WEIGHT.semibold,
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  sectionTitle: { marginTop: SPACING.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  photoBox: { position: 'relative' },
  photo: { width: 84, height: 84, borderRadius: RADIUS.md },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  terms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  primaryBtn: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
});
