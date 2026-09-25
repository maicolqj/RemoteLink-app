import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import { useMaintenanceStore } from '../../store/maintenance.store';
import { usePhotoPicker } from '../../hooks/usePhotoPicker';
import {
  createMaintenanceTicket,
  fetchDuplicateCandidates,
  fetchMaintenanceReportOptions,
  fetchMaintenanceTagByCode,
  endorseMaintenanceTicket,
} from '../../../infraestructure/services/maintenance.service';
import type { PhotoUpload } from '../../../infraestructure/services/pets.service';
import type {
  MaintenanceCategory,
  MaintenanceLocationType,
  MaintenanceReportOptions,
} from '../../../domain/responses/MaintenanceResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { MAINTENANCE_CATEGORIES } from './maintenance.shared';
import { QrScannerModal } from '../../components/QrScannerModal';
import { NfcPromptModal } from '../../components/NfcPromptModal';
import { cancelNfc, isNfcCancel, isNfcSupported, readSiteCode } from '../../utils/nfc';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'MaintenanceReport'>;

const MAX_PHOTOS = 5;

/**
 * Las maneras de señalar el sitio que la app puede resolver hoy.
 *
 * "Torre / piso" no existe en una urbanización de casas: ahí las unidades no
 * cuelgan de un edificio (`buildingId` es nulo), así que el conjunto no tiene
 * torres que ofrecer y pedir un piso no significa nada. En vez de mirar el
 * tipo de complejo se mira si HAY torres: un conjunto mixto las tiene y las
 * necesita, y uno de apartamentos que todavía no las cargó tampoco tiene nada
 * que mostrar en esa lista.
 */
const LOCATION_MODES: {
  value: Exclude<MaintenanceLocationType, 'GPS'>;
  label: string;
  icon: string;
}[] = [
  { value: 'TREE', label: 'Torre / piso', icon: 'apartment' },
  { value: 'AMENITY', label: 'Zona común', icon: 'deck' },
  { value: 'TAG', label: 'Código del sitio', icon: 'qr-code-2' },
];

/**
 * Reportar un daño en zonas comunes.
 *
 * Antes de crear el ticket se pregunta si el daño ya está reportado. Cuando el
 * ascensor se para, treinta vecinos abren treinta tickets y el tablero de la
 * administración deja de servir: aquí se les ofrece sumarse al que ya existe,
 * que además prioriza el caso sin que nadie tenga que discutirlo.
 *
 * La ubicación no usa GPS: la app no tiene módulo de geolocalización, y en un
 * sótano —donde más se daña todo— la coordenada del celular llega con cien
 * metros de error o no llega. Señalar la torre, la zona común o el código
 * pegado en la pared es más exacto que eso.
 */
export default function MaintenanceReportScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showSuccess, showAlert } = useAlert();
  const { choosePhoto } = usePhotoPicker();

  const resident = useAuthStore(state => state.resident);
  const complexId = resident?.complex?.id;
  const myBuildingId = resident?.unit?.building?.id;

  const loadTickets = useMaintenanceStore(state => state.load);

  const [options, setOptions] = useState<MaintenanceReportOptions | null>(null);
  const [category, setCategory] = useState<MaintenanceCategory>('ILUMINACION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [locationType, setLocationType] =
    useState<Exclude<MaintenanceLocationType, 'GPS'>>('TREE');
  const [buildingId, setBuildingId] = useState<string | undefined>(myBuildingId);
  const [floor, setFloor] = useState('');
  const [amenityId, setAmenityId] = useState<string | undefined>();
  const [tagCode, setTagCode] = useState('');
  const [tagName, setTagName] = useState<string | null>(null);
  const [locationText, setLocationText] = useState('');

  const [scannerOpen, setScannerOpen] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcReading, setNfcReading] = useState(false);

  useEffect(() => { void isNfcSupported().then(setNfcSupported); }, []);

  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!complexId) return;
    let alive = true;

    fetchMaintenanceReportOptions(complexId)
      .then(result => {
        if (!alive) return;
        setOptions(result);
        if (!buildingId && result.buildings.length === 1) {
          setBuildingId(result.buildings[0].id);
        }
      })
      .catch(() => {
        // Sin opciones el formulario sigue sirviendo: la referencia escrita
        // alcanza para que la administración sepa dónde ir.
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complexId]);

  /** Sin torres cargadas, "Torre / piso" no se ofrece. */
  const hasBuildings = (options?.buildings?.length ?? 0) > 0;
  // QR por defecto mientras cargan las opciones (es lo que siempre hubo); NFC
  // solo si el conjunto lo activó y el celular lo tiene.
  const qrEnabled = options?.qrEnabled ?? true;
  const nfcEnabled = nfcSupported && options?.nfcEnabled === true;
  const locationModes = useMemo(
    () => LOCATION_MODES.filter(mode => mode.value !== 'TREE' || hasBuildings),
    [hasBuildings],
  );

  /**
   * Si el modo elegido dejó de existir, se pasa al primero disponible.
   *
   * El formulario arranca en "Torre / piso" porque es lo normal en un conjunto
   * de apartamentos y las opciones llegan del servidor un instante después. En
   * una urbanización de casas ese modo desaparece cuando llega la respuesta, y
   * sin esto el residente se quedaría con un modo seleccionado que ya no tiene
   * ningún chip pintado: un formulario que no deja avanzar y no dice por qué.
   */
  useEffect(() => {
    if (locationModes.some(mode => mode.value === locationType)) return;
    setLocationType(locationModes[0].value);
  }, [locationModes, locationType]);

  const addPhotos = (picked: PhotoUpload[]) => {
    setPhotos(current => [...current, ...picked].slice(0, MAX_PHOTOS));
  };

  /**
   * Resuelve un código de sitio contra el conjunto.
   *
   * Recibe el código por parámetro en vez de leerlo del estado porque el
   * escáner lo entrega y lo resuelve en el mismo paso: `setTagCode` no ha
   * pintado todavía cuando toca consultar, y leer el estado ahí resolvería el
   * código anterior.
   */
  const resolveTagCode = useCallback(
    async (code: string) => {
      const clean = code.trim();
      if (!complexId || clean.length < 2) return;

      try {
        const tag = await fetchMaintenanceTagByCode(complexId, clean);
        setTagName(tag.name);
        if (tag.defaultCategory) setCategory(tag.defaultCategory);
      } catch (e: any) {
        setTagName(null);
        showError(e?.message ?? 'Ese código no corresponde a ningún punto del conjunto.');
      }
    },
    [complexId, showError],
  );

  const resolveTag = useCallback(() => resolveTagCode(tagCode), [resolveTagCode, tagCode]);

  /**
   * Lo que llega del QR pegado en la pared.
   *
   * El sticker codifica el código pelado, así que se toma tal cual. Se fuerza
   * el modo a "Código del sitio": si el residente venía en "Torre / piso" y
   * escaneó, lo que manda es lo que escaneó.
   */
  const handleScannedCode = useCallback(
    (code: string) => {
      const clean = code.trim().toUpperCase();
      setLocationType('TAG');
      setTagCode(clean);
      void resolveTagCode(clean);
    },
    [resolveTagCode],
  );

  /** El chip NFC del sitio: mismo código que el QR, mismo camino. */
  const readNfc = useCallback(async () => {
    setNfcReading(true);
    try {
      const code = await readSiteCode();
      setNfcReading(false);
      handleScannedCode(code);
    } catch (e: any) {
      setNfcReading(false);
      if (!isNfcCancel(e)) showError(e?.message ?? 'No se pudo leer el chip.');
    }
  }, [handleScannedCode, showError]);

  const buildLocation = () => ({
    locationType,
    buildingId: locationType === 'TREE' ? buildingId : undefined,
    floor:
      locationType === 'TREE' && floor.trim() !== ''
        ? Number(floor)
        : undefined,
    amenityId: locationType === 'AMENITY' ? amenityId : undefined,
    locationTagCode: locationType === 'TAG' ? tagCode.trim() : undefined,
    locationText: locationText.trim() || undefined,
  });

  const submit = async () => {
    if (!complexId) return;

    setIsSubmitting(true);
    try {
      const created = await createMaintenanceTicket(
        {
          complexId,
          title: title.trim(),
          description: description.trim(),
          category,
          ...buildLocation(),
        },
        photos,
      );

      await loadTickets(complexId).catch(() => undefined);
      showSuccess(
        `Reporte ${created.code} radicado. Te avisamos cuando haya técnico asignado.`,
      );
      navigation.goBack();
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo radicar el reporte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const joinExisting = async (ticketId: string, code: string) => {
    setIsSubmitting(true);
    try {
      await endorseMaintenanceTicket(ticketId, description.trim() || undefined);
      if (complexId) await loadTickets(complexId).catch(() => undefined);
      showSuccess(`Te sumaste al reporte ${code}. Recibirás las novedades.`);
      navigation.goBack();
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo sumar tu reporte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!complexId) return;

    if (title.trim().length < 5) {
      showError('Ponle un título corto: "Lámpara fundida en el sótano 1".');
      return;
    }
    if (description.trim().length < 10) {
      showError('Cuenta lo que viste con un poco más de detalle.');
      return;
    }
    if (photos.length === 0) {
      showError('Adjunta al menos una foto: sin ella el técnico no sabe qué lleva.');
      return;
    }
    if (locationType === 'AMENITY' && !amenityId) {
      showError('Elige la zona común donde está el daño.');
      return;
    }
    if (locationType === 'TAG' && !tagCode.trim()) {
      showError('Escribe el código que aparece en el sticker del sitio.');
      return;
    }
    if (locationType === 'TREE' && !buildingId && !locationText.trim()) {
      showError('Indica la torre o describe dónde queda el daño.');
      return;
    }

    // Un fallo de esta consulta no bloquea el reporte: en el peor caso queda un
    // duplicado, que la administración cierra con un clic.
    const duplicates = await fetchDuplicateCandidates({
      complexId,
      category,
      ...buildLocation(),
    });

    const candidate = duplicates[0];

    if (candidate) {
      showAlert({
        type: 'question',
        title: 'Esto ya está reportado',
        description: `${candidate.code}: ${candidate.title}. Si es el mismo daño, súmate en vez de abrir otro reporte: así la administración ve cuántos estamos afectados.`,
        buttons: [
          {
            text: 'Es el mismo, súmame',
            icon: 'group-add',
            iconLibrary: 'MaterialIcons',
            onPress: () => {
              void joinExisting(candidate.id, candidate.code);
            },
          },
          {
            text: 'Es otro daño',
            style: 'secondary',
            onPress: () => {
              void submit();
            },
          },
          { text: 'Cancelar', style: 'text', onPress: () => undefined },
        ],
      });
      return;
    }

    await submit();
  };

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Reportar daño"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}>
          ¿Qué se dañó?
        </CustomTextComponent>

        <View style={styles.categories}>
          {MAINTENANCE_CATEGORIES.map(option => {
            const isActive = category === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setCategory(option.value)}
                style={[
                  styles.category,
                  {
                    backgroundColor: isActive
                      ? colors.primary
                      : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}>
                <Icon
                  name={option.icon}
                  size={18}
                  color={isActive ? colors.textInverse : colors.textSecondary}
                />
                <CustomTextComponent
                  fontSize={FONT_SIZE.xs}
                  color={isActive ? colors.textInverse : colors.textSecondary}>
                  {option.label}
                </CustomTextComponent>
              </TouchableOpacity>
            );
          })}
        </View>

        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary}>
          {MAINTENANCE_CATEGORIES.find(item => item.value === category)?.hint}
        </CustomTextComponent>

        <CustomInputComponent
          value={title}
          onChangeText={setTitle}
          placeholder="Título corto: lámpara fundida en el sótano 1"
          maxLength={160}
        />
        <CustomInputComponent
          value={description}
          onChangeText={setDescription}
          placeholder="¿Qué pasa, desde cuándo, qué tan grave se ve?"
          multiline
          numberOfLines={4}
          maxLength={2000}
        />

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          style={styles.sectionTitle}>
          ¿Dónde queda?
        </CustomTextComponent>

        {/* Arriba de todo y no dentro de "Código del sitio": escanear el
            sticker es el camino más rápido y el más exacto, y si queda
            escondido detrás de un chip nadie lo encuentra.
            Cada botón aparece solo si el conjunto usa ese medio (lo decide la
            administración): un botón de NFC donde solo hay stickers QR invita
            a acercar el celular a una pared que no responde. */}
        {qrEnabled && (
          <TouchableOpacity
            onPress={() => setScannerOpen(true)}
            style={[styles.scanBtn, { borderColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Escanear el código QR del sitio">
            <Icon name="qr-code-scanner" size={20} color={colors.primary} />
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              fontWeight={FONT_WEIGHT.medium as any}
              color={colors.primary}>
              Escanear el código del sitio
            </CustomTextComponent>
          </TouchableOpacity>
        )}
        {nfcEnabled && (
          <TouchableOpacity
            onPress={() => void readNfc()}
            style={[styles.scanBtn, { borderColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Leer el chip NFC del sitio">
            <Icon name="nfc" size={20} color={colors.primary} />
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              fontWeight={FONT_WEIGHT.medium as any}
              color={colors.primary}>
              Leer chip NFC
            </CustomTextComponent>
          </TouchableOpacity>
        )}

        <View style={styles.chips}>
          {locationModes.map(mode => {
            const isActive = locationType === mode.value;
            return (
              <TouchableOpacity
                key={mode.value}
                onPress={() => setLocationType(mode.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                  },
                ]}>
                <Icon
                  name={mode.icon}
                  size={14}
                  color={isActive ? colors.textInverse : colors.textSecondary}
                />
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  color={isActive ? colors.textInverse : colors.textPrimary}>
                  {mode.label}
                </CustomTextComponent>
              </TouchableOpacity>
            );
          })}
        </View>

        {locationType === 'TREE' && (
          <>
            <View style={styles.chips}>
              {(options?.buildings ?? []).map(building => {
                const isActive = buildingId === building.id;
                return (
                  <TouchableOpacity
                    key={building.id}
                    onPress={() =>
                      setBuildingId(isActive ? undefined : building.id)
                    }
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
                      {building.name}
                    </CustomTextComponent>
                  </TouchableOpacity>
                );
              })}
            </View>
            <CustomInputComponent
              value={floor}
              onChangeText={setFloor}
              placeholder="Piso (usa -1 para el primer sótano)"
              keyboardType="default"
              maxLength={4}
            />
          </>
        )}

        {locationType === 'AMENITY' && (
          <View style={styles.chips}>
            {(options?.amenities ?? []).map(amenity => {
              const isActive = amenityId === amenity.id;
              return (
                <TouchableOpacity
                  key={amenity.id}
                  onPress={() =>
                    setAmenityId(isActive ? undefined : amenity.id)
                  }
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
                    {amenity.name}
                  </CustomTextComponent>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {locationType === 'TAG' && (
          <>
            <CustomInputComponent
              value={tagCode}
              onChangeText={setTagCode}
              onBlur={resolveTag}
              placeholder="Código del sticker, ej. T2-SOT1-BOMBAS"
              autoCapitalize="characters"
              maxLength={40}
            />
            {/* El campo a mano no se va: un adhesivo rayado o una cámara que
                no enfoca dejarían al vecino sin manera de reportar. */}
            {!!tagName && (
              <View style={styles.metaItem}>
                <Icon name="check-circle" size={14} color={colors.success} />
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  color={colors.textSecondary}>
                  {tagName}
                </CustomTextComponent>
              </View>
            )}
          </>
        )}

        <CustomInputComponent
          value={locationText}
          onChangeText={setLocationText}
          placeholder="Referencia: junto al parqueadero 45, frente al ascensor…"
          maxLength={200}
        />

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          style={styles.sectionTitle}>
          Foto del daño ({photos.length}/{MAX_PHOTOS})
        </CustomTextComponent>

        <View style={styles.photos}>
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={`${photo.uri}-${index}`}
              onPress={() =>
                setPhotos(current => current.filter((_, i) => i !== index))
              }>
              <Image source={{ uri: photo.uri }} style={styles.thumb} />
              <View
                style={[styles.removeBadge, { backgroundColor: colors.error }]}>
                <Icon name="close" size={12} color={colors.textInverse} />
              </View>
            </TouchableOpacity>
          ))}

          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity
              style={[
                styles.addPhoto,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => choosePhoto(addPhotos, MAX_PHOTOS - photos.length)}>
              <Icon name="add-a-photo" size={22} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        <Card style={{ backgroundColor: colors.primarySurface }}>
          <View style={styles.metaItem}>
            <Icon name="schedule" size={16} color={colors.primary} />
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              color={colors.textSecondary}
              style={gs.flex1}>
              El plazo de atención empieza a correr cuando envías el reporte, no
              cuando la administración lo revisa. La hora la pone el servidor.
            </CustomTextComponent>
          </View>
        </Card>

        <Button
          label="Enviar reporte"
          icon="send"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          fullWidth
          style={styles.primaryBtn}
        />
      </ScrollView>

      <QrScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onRead={handleScannedCode}
        title="Escanear el sitio"
        hint="Apunta al QR del sticker pegado en el sitio del daño"
      />

      <NfcPromptModal
        visible={nfcReading}
        title="Leer chip del sitio"
        message="Acerca la parte de atrás del celular al chip pegado en el sitio."
        onCancel={() => void cancelNfc()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  sectionTitle: {
    marginTop: SPACING.md,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  category: {
    width: '31%',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
  },
  removeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    marginTop: SPACING.md,
  },
});
