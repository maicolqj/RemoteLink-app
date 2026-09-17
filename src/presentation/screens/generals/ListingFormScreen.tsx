import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import AppHeader from '../../components/AppHeader';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { usePhotoPicker } from '../../hooks/usePhotoPicker';
import { useAuthStore } from '../../store/auth.store';
import { useMarketplaceStore } from '../../store/marketplace.store';
import { createListing } from '../../../infraestructure/services/marketplace.service';
import type { PhotoUpload } from '../../../domain/interfaces/PhotoUpload';
import type {
  ItemCondition,
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
  moderationHint,
} from './marketplace.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'ListingForm'>;

/**
 * Publicar un aviso.
 *
 * Las fotos son obligatorias salvo en “Busco”: quien necesita algo todavía no
 * lo tiene para fotografiarlo. El servidor aplica la misma regla, así que
 * adelantarla aquí solo evita el viaje perdido.
 *
 * El teléfono NO se publica por defecto: mostrarlo es una decisión aparte, y
 * por eso es un interruptor apagado con su explicación al lado.
 */
export default function ListingFormScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showSuccess } = useAlert();
  const { choosePhoto } = usePhotoPicker();

  const resident = useAuthStore(state => state.resident);
  const complexId = resident?.complex?.id;

  const categories = useMarketplaceStore(state => state.categories);
  const settings = useMarketplaceStore(state => state.settings);

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

  const maxPhotos = settings?.maxImagesPerListing ?? 5;
  const needsPhotos = type !== 'WANTED';
  const needsAmount = PRICE_TYPES_WITH_AMOUNT.includes(priceType);

  const availableTypes = useMemo(
    () =>
      settings?.allowWantedListings === false
        ? LISTING_TYPES.filter(item => item !== 'WANTED')
        : LISTING_TYPES,
    [settings],
  );

  const addPhotos = useCallback(() => {
    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      showError(`Puedes subir hasta ${maxPhotos} fotos.`);
      return;
    }

    choosePhoto(picked => {
      setPhotos(prev => [...prev, ...picked].slice(0, maxPhotos));
    }, remaining);
  }, [choosePhoto, maxPhotos, photos.length, showError]);

  const submit = useCallback(async () => {
    if (!complexId) return;

    if (!categoryId) return showError('Elige una categoría.');
    if (title.trim().length < 5) {
      return showError('El título necesita al menos 5 caracteres.');
    }
    if (description.trim().length < 10) {
      return showError('Describe un poco mejor lo que publicas.');
    }
    if (needsPhotos && photos.length === 0) {
      return showError('Agrega al menos una foto: sin foto casi nadie abre un aviso.');
    }
    if (needsAmount && !priceAmount.trim()) {
      return showError('Escribe el precio o cámbialo a “a convenir”.');
    }
    if (!acceptTerms) {
      return showError('Acepta las condiciones para publicar.');
    }

    setBusy(true);
    try {
      await createListing(
        {
          complexId,
          type,
          categoryId,
          title: title.trim(),
          description: description.trim(),
          priceType,
          priceAmount: needsAmount
            ? Number(priceAmount.replace(/[^\d]/g, ''))
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
      showError(e?.message ?? 'No se pudo publicar el aviso.');
    } finally {
      setBusy(false);
    }
  }, [
    complexId, categoryId, title, description, needsPhotos, photos, needsAmount,
    priceAmount, acceptTerms, type, priceType, condition, showPhone, settings,
    navigation, showError, showSuccess,
  ]);

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Publicar aviso"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        keyboardShouldPersistTaps="handled">
        <Field label="¿Qué vas a publicar?">
          <View style={styles.chips}>
            {availableTypes.map(item => (
              <Chip
                key={item}
                label={LISTING_TYPE_LABEL[item]}
                selected={type === item}
                onPress={() => setType(item)}
              />
            ))}
          </View>
        </Field>

        <Field label="Categoría">
          <View style={styles.chips}>
            {categories.map(category => (
              <Chip
                key={category.id}
                label={category.name}
                selected={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </View>
        </Field>

        <CustomInputComponent
          nameInput="Título"
          value={title}
          onChangeText={setTitle}
          placeholder="Nevera Haceb de 320 litros"
          maxLength={120}
        />

        <CustomInputComponent
          nameInput="Descripción"
          value={description}
          onChangeText={setDescription}
          placeholder="Cuéntale a tu vecino en qué estado está y por qué lo vendes"
          multiline
          numberOfLines={4}
        />

        <Field label="Precio">
          <View style={styles.chips}>
            {PRICE_TYPES.map(item => (
              <Chip
                key={item}
                label={PRICE_TYPE_LABEL[item]}
                selected={priceType === item}
                onPress={() => setPriceType(item)}
              />
            ))}
          </View>
        </Field>

        {needsAmount && (
          <CustomInputComponent
            nameInput="Valor"
            value={priceAmount}
            onChangeText={setPriceAmount}
            placeholder="800000"
            keyboardType="numeric"
          />
        )}

        {type === 'PRODUCT' && (
          <Field label="Estado del artículo">
            <View style={styles.chips}>
              {CONDITIONS.map(item => (
                <Chip
                  key={item}
                  label={CONDITION_LABEL[item]}
                  selected={condition === item}
                  onPress={() =>
                    setCondition(condition === item ? null : item)
                  }
                />
              ))}
            </View>
          </Field>
        )}

        <Field
          label={`Fotos${needsPhotos ? '' : ' (opcionales)'}`}
          hint={`Hasta ${maxPhotos}. La primera es la que se ve en la vitrina.`}>
          <View style={styles.photos}>
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

            {photos.length < maxPhotos && (
              <TouchableOpacity
                onPress={addPhotos}
                style={[
                  styles.addPhoto,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}>
                <Icon name="add-a-photo" size={22} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </Field>

        {/*
          Mostrar el teléfono es una decisión aparte de publicar: nace apagado
          porque publicar algo no es autorizar que el número quede a la vista de
          todo el conjunto.
        */}
        {settings?.allowPhoneContact !== false && (
          <View style={[styles.switchRow, { backgroundColor: colors.surface }]}>
            <View style={gs.flex1}>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                fontWeight={FONT_WEIGHT.medium as any}
                color={colors.textPrimary}>
                Mostrar mi teléfono
              </CustomTextComponent>
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                color={colors.textTertiary}>
                Si lo dejas apagado, tus vecinos te avisan por la app y tú
                decides si les devuelves el contacto.
              </CustomTextComponent>
            </View>
            <Switch value={showPhone} onValueChange={setShowPhone} />
          </View>
        )}

        <TouchableOpacity
          onPress={() => setAcceptTerms(!acceptTerms)}
          style={[styles.terms, { backgroundColor: colors.surface }]}>
          <Icon
            name={acceptTerms ? 'check-box' : 'check-box-outline-blank'}
            size={20}
            color={acceptTerms ? colors.primary : colors.textTertiary}
          />
          <CustomTextComponent
            fontSize={FONT_SIZE.xs}
            color={colors.textSecondary}
            style={gs.flex1}>
            {settings?.termsText ??
              'La administración solo facilita este espacio: no participa en el negocio ni responde por él. Quien publica responde por su aviso.'}
          </CustomTextComponent>
        </TouchableOpacity>

        <CustomTextComponent
          fontSize={FONT_SIZE.xs}
          color={colors.textTertiary}
          style={styles.hint}>
          {moderationHint(settings?.moderationMode)}
        </CustomTextComponent>

        <CustomButtonComponent
          text="Publicar"
          iconLeft={{ name: 'send', type: 'material' }}
          onPress={() => submit()}
          isLoading={busy}
        />
      </ScrollView>
    </View>
  );
}

// ─── Piezas ──────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <CustomTextComponent
        fontSize={FONT_SIZE.sm}
        fontWeight={FONT_WEIGHT.medium as any}
        color={colors.textPrimary}>
        {label}
      </CustomTextComponent>
      {hint && (
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
          {hint}
        </CustomTextComponent>
      )}
      {children}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primarySurface : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}>
      <CustomTextComponent
        fontSize={FONT_SIZE.xs}
        color={selected ? colors.primary : colors.textSecondary}>
        {label}
      </CustomTextComponent>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, gap: SPACING.md },
  field: { gap: SPACING.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  photoBox: { position: 'relative' },
  photo: { width: 76, height: 76, borderRadius: RADIUS.md },
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
    width: 76,
    height: 76,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  terms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  hint: { textAlign: 'center' },
});
