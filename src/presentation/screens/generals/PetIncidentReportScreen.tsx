import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
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
import { usePetsStore } from '../../store/pets.store';
import { usePhotoPicker } from '../../hooks/usePhotoPicker';
import { reportPetIncident, type PhotoUpload } from '../../../infraestructure/services/pets.service';
import type { PetIncidentSeverity, PetIncidentType } from '../../../domain/responses/PetResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { PET_INCIDENT_TYPES, PET_SEVERITIES, PET_SEVERITY_LABEL } from './pets.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'PetIncidentReport'>;
type ScreenRoute = RouteProp<HomeStackParamList, 'PetIncidentReport'>;

const MAX_PHOTOS = 5;

/**
 * Radicar un reporte de convivencia.
 *
 * La evidencia es obligatoria porque es lo que convierte una queja en algo con
 * lo que se puede sancionar: el servidor sella la hora de recepción y guarda la
 * huella de cada imagen. La del celular no sirve, se edita.
 *
 * La unidad reportada no se entera hasta que la administración revisa el caso.
 * Eso se dice aquí, antes de enviar: quien reporta tiene derecho a saber que no
 * va a quedar expuesto ante su vecino.
 */
export default function PetIncidentReportScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showSuccess } = useAlert();
  const { choosePhoto } = usePhotoPicker();

  const resident = useAuthStore(state => state.resident);
  const complexId = resident?.complex?.id;
  const loadPets = usePetsStore(state => state.load);

  const [type, setType] = useState<PetIncidentType>('WASTE_NOT_PICKED_UP');
  const [severity, setSeverity] = useState<PetIncidentSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addPhotos = (picked: PhotoUpload[]) => {
    setPhotos(current => [...current, ...picked].slice(0, MAX_PHOTOS));
  };

  const handleSubmit = async () => {
    if (!complexId) return;

    if (photos.length === 0) {
      showError('Adjunta al menos una foto: sin evidencia el reporte no se puede sustentar.');
      return;
    }
    if (description.trim().length < 10) {
      showError('Cuenta lo que pasó con un poco más de detalle.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await reportPetIncident({
        complexId,
        type,
        severity,
        description: description.trim(),
        location: location.trim() || undefined,
        petId: route.params?.petId,
      }, photos);

      await loadPets(complexId).catch(() => { /* la lista recarga al enfocarse */ });
      showSuccess(`Reporte ${created.code} radicado. La administración lo revisa antes de actuar.`);
      navigation.goBack();
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo radicar el reporte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Reportar" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}>
          ¿Qué pasó?
        </CustomTextComponent>

        {PET_INCIDENT_TYPES.map(option => {
          const isActive = type === option.value;
          return (
            <Card
              key={option.value}
              onPress={() => setType(option.value)}
              style={isActive ? [styles.optionSelected, { borderColor: colors.primary }] : undefined}>
              <View style={styles.optionRow}>
                <Icon
                  name={isActive ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={18}
                  color={isActive ? colors.primary : colors.textTertiary}
                />
                <View style={gs.flex1}>
                  <CustomTextComponent
                    fontSize={FONT_SIZE.md}
                    fontWeight={FONT_WEIGHT.medium as any}
                    color={colors.textPrimary}>
                    {option.label}
                  </CustomTextComponent>
                  <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                    {option.hint}
                  </CustomTextComponent>
                </View>
              </View>
            </Card>
          );
        })}

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          style={styles.sectionTitle}>
          ¿Qué tan grave fue?
        </CustomTextComponent>

        <View style={styles.chips}>
          {PET_SEVERITIES.map(value => {
            const isActive = severity === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => setSeverity(value)}
                style={[styles.chip, { backgroundColor: isActive ? colors.primary : colors.surface }]}>
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  color={isActive ? colors.textInverse : colors.textPrimary}>
                  {PET_SEVERITY_LABEL[value]}
                </CustomTextComponent>
              </TouchableOpacity>
            );
          })}
        </View>

        <CustomInputComponent
          value={description}
          onChangeText={setDescription}
          placeholder="Cuenta lo que viste, con el mayor detalle posible"
          multiline
          numberOfLines={5}
          maxLength={2000}
        />
        <CustomInputComponent
          value={location}
          onChangeText={setLocation}
          placeholder="¿Dónde fue? Pasillo, zona verde, ascensor…"
          maxLength={160}
        />

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          style={styles.sectionTitle}>
          Evidencia ({photos.length}/{MAX_PHOTOS})
        </CustomTextComponent>

        <View style={styles.photos}>
          {photos.map((photo, index) => (
            <TouchableOpacity
              key={`${photo.uri}-${index}`}
              onPress={() => setPhotos(current => current.filter((_, i) => i !== index))}>
              <Image source={{ uri: photo.uri }} style={styles.thumb} />
              <View style={[styles.removeBadge, { backgroundColor: colors.error }]}>
                <Icon name="close" size={12} color={colors.textInverse} />
              </View>
            </TouchableOpacity>
          ))}

          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity
              style={[styles.addPhoto, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => choosePhoto(addPhotos, MAX_PHOTOS - photos.length)}>
              <Icon name="add-a-photo" size={22} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        <Card style={{ backgroundColor: colors.primarySurface }}>
          <View style={styles.optionRow}>
            <Icon name="verified-user" size={16} color={colors.primary} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={gs.flex1}>
              Tu nombre no se le muestra a la unidad reportada. La administración sí lo sabe, y revisa
              el caso antes de avisarle a nadie. La hora del reporte la pone el servidor.
            </CustomTextComponent>
          </View>
        </Card>

        <Button
          label="Radicar reporte"
          icon="send"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          fullWidth
          style={styles.primaryBtn}
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
  sectionTitle: {
    marginTop: SPACING.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  /** El color lo pone el tema; solo el grosor es fijo. */
  optionSelected: {
    borderWidth: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
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
