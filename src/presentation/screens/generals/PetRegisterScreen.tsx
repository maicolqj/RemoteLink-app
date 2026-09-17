import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Image, Switch } from 'react-native';
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
import {
  registerPet, uploadPetPhoto, type PhotoUpload,
} from '../../../infraestructure/services/pets.service';
import type { PetSpecies } from '../../../domain/responses/PetResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { PET_SPECIES, PET_SPECIES_LABEL } from './pets.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'PetRegister'>;
type ScreenRoute = RouteProp<HomeStackParamList, 'PetRegister'>;

/**
 * Ficha de la mascota: la crea y la corrige.
 *
 * La foto es obligatoria al crear porque la ficha sirve para dos cosas —censar
 * y, sobre todo, identificar—: sin foto, un reporte no se le puede atribuir a
 * nadie. Al editar es opcional, porque ya hay una guardada.
 *
 * La póliza de las razas de manejo especial no bloquea el registro —dejar al
 * animal fuera del censo sería peor—, pero sin ella la administración no puede
 * aprobar la ficha, y eso se advierte aquí y no después.
 */
export default function PetRegisterScreen() {
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
  const editPet = usePetsStore(state => state.edit);

  const petId = route.params?.petId;
  const existing = usePetsStore(state => state.pets.find(item => item.id === petId));
  const isEditing = !!petId;

  const [photo, setPhoto] = useState<PhotoUpload | null>(null);
  const [name, setName] = useState(existing?.name ?? '');
  const [species, setSpecies] = useState<PetSpecies>(
    (existing?.species as PetSpecies) ?? 'DOG',
  );
  const [breed, setBreed] = useState(existing?.breed ?? '');
  const [color, setColor] = useState(existing?.color ?? '');
  const [marks, setMarks] = useState(existing?.distinguishingMarks ?? '');
  const [hasMicrochip, setHasMicrochip] = useState(existing?.hasMicrochip ?? false);
  const [microchipCode, setMicrochipCode] = useState(existing?.microchipCode ?? '');
  const [isSpecialBreed, setIsSpecialBreed] = useState(existing?.isSpecialBreed ?? false);
  const [insuranceCompany, setInsuranceCompany] = useState(existing?.insuranceCompany ?? '');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(
    existing?.insurancePolicyNumber ?? '',
  );
  const [insuranceExpiresAt, setInsuranceExpiresAt] = useState(
    existing?.insuranceExpiresAt?.slice(0, 10) ?? '',
  );
  const [rabiesVaccineAt, setRabiesVaccineAt] = useState(
    existing?.rabiesVaccineAt?.slice(0, 10) ?? '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewUri = photo?.uri ?? existing?.photoUrl ?? null;

  const handleSubmit = async () => {
    if (!complexId) return;

    if (!isEditing && !photo) {
      showError('La foto es obligatoria: es lo que permite identificar a tu mascota.');
      return;
    }
    if (name.trim().length < 2) {
      showError('Escribe el nombre de tu mascota.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && petId) {
        await editPet({
          petId,
          name: name.trim(),
          species,
          breed: breed.trim() || undefined,
          color: color.trim() || undefined,
          distinguishingMarks: marks.trim() || undefined,
          hasMicrochip,
          microchipCode: hasMicrochip ? microchipCode.trim() || undefined : undefined,
          isSpecialBreed,
          insuranceCompany: isSpecialBreed ? insuranceCompany.trim() || undefined : undefined,
          insurancePolicyNumber: isSpecialBreed
            ? insurancePolicyNumber.trim() || undefined
            : undefined,
          insuranceExpiresAt: isSpecialBreed ? insuranceExpiresAt.trim() || undefined : undefined,
          rabiesVaccineAt: rabiesVaccineAt.trim() || undefined,
        });

        // La foto se reemplaza aparte: viaja como archivo, no como campo.
        if (photo) await uploadPetPhoto(petId, photo);

        await loadPets(complexId).catch(() => { /* la lista recarga al enfocarse */ });
        showSuccess('Ficha actualizada.');
      } else {
        const created = await registerPet({
          complexId,
          name: name.trim(),
          species,
          breed: breed.trim() || undefined,
          color: color.trim() || undefined,
          distinguishingMarks: marks.trim() || undefined,
          hasMicrochip,
          microchipCode: hasMicrochip ? microchipCode.trim() || undefined : undefined,
          isSpecialBreed,
          insuranceCompany: isSpecialBreed ? insuranceCompany.trim() || undefined : undefined,
          insurancePolicyNumber: isSpecialBreed
            ? insurancePolicyNumber.trim() || undefined
            : undefined,
          insuranceExpiresAt: isSpecialBreed ? insuranceExpiresAt.trim() || undefined : undefined,
          rabiesVaccineAt: rabiesVaccineAt.trim() || undefined,
        }, photo as PhotoUpload);

        await loadPets(complexId).catch(() => { /* la lista recarga al enfocarse */ });
        showSuccess(`${created.name} quedó registrada. La administración va a validar la ficha.`);
      }

      navigation.goBack();
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo guardar la ficha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title={isEditing ? 'Editar mascota' : 'Registrar mascota'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>

        <TouchableOpacity
          style={[styles.photoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => choosePhoto(photos => setPhoto(photos[0] ?? null))}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.photo} />
          ) : (
            <>
              <Icon name="add-a-photo" size={28} color={colors.textTertiary} />
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                Foto clara de tu mascota (obligatoria)
              </CustomTextComponent>
            </>
          )}
        </TouchableOpacity>

        {isEditing && (
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary}>
            Toca la foto si quieres reemplazarla.
          </CustomTextComponent>
        )}

        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          style={styles.sectionTitle}>
          ¿Qué mascota es?
        </CustomTextComponent>

        <View style={styles.chips}>
          {PET_SPECIES.map(value => {
            const isActive = species === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => setSpecies(value)}
                style={[styles.chip, { backgroundColor: isActive ? colors.primary : colors.surface }]}>
                <CustomTextComponent
                  fontSize={FONT_SIZE.sm}
                  color={isActive ? colors.textInverse : colors.textPrimary}>
                  {PET_SPECIES_LABEL[value]}
                </CustomTextComponent>
              </TouchableOpacity>
            );
          })}
        </View>

        <CustomInputComponent value={name} onChangeText={setName} placeholder="Nombre" maxLength={80} />
        <CustomInputComponent value={breed} onChangeText={setBreed} placeholder="Raza" maxLength={80} />
        <CustomInputComponent value={color} onChangeText={setColor} placeholder="Color" maxLength={60} />
        <CustomInputComponent
          value={marks}
          onChangeText={setMarks}
          placeholder="Señas particulares: una mancha, el collar, una oreja caída"
          multiline
          numberOfLines={3}
          maxLength={500}
        />

        <Card>
          <View style={styles.switchRow}>
            <View style={gs.flex1}>
              <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textPrimary}>
                Tiene microchip
              </CustomTextComponent>
            </View>
            <Switch value={hasMicrochip} onValueChange={setHasMicrochip} />
          </View>
        </Card>

        {hasMicrochip && (
          <CustomInputComponent
            value={microchipCode}
            onChangeText={setMicrochipCode}
            placeholder="Número del microchip"
            maxLength={50}
          />
        )}

        <Card>
          <View style={styles.switchRow}>
            <View style={gs.flex1}>
              <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textPrimary}>
                Raza de manejo especial
              </CustomTextComponent>
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                Las que la ley clasifica como potencialmente peligrosas.
              </CustomTextComponent>
            </View>
            <Switch value={isSpecialBreed} onValueChange={setIsSpecialBreed} />
          </View>
        </Card>

        {isSpecialBreed && (
          <>
            <Card style={{ backgroundColor: colors.warningLight }}>
              <View style={styles.noticeRow}>
                <Icon name="gavel" size={16} color={colors.warning} />
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={gs.flex1}>
                  Estas razas necesitan póliza de responsabilidad civil vigente. Puedes registrar la
                  ficha sin ella, pero la administración no podrá aprobarla hasta que la cargues.
                </CustomTextComponent>
              </View>
            </Card>
            <CustomInputComponent
              value={insuranceCompany}
              onChangeText={setInsuranceCompany}
              placeholder="Aseguradora"
              maxLength={120}
            />
            <CustomInputComponent
              value={insurancePolicyNumber}
              onChangeText={setInsurancePolicyNumber}
              placeholder="Número de póliza"
              maxLength={60}
            />
            <CustomInputComponent
              value={insuranceExpiresAt}
              onChangeText={setInsuranceExpiresAt}
              placeholder="Vence (AAAA-MM-DD)"
              maxLength={10}
            />
          </>
        )}

        <CustomInputComponent
          value={rabiesVaccineAt}
          onChangeText={setRabiesVaccineAt}
          placeholder="Última vacuna antirrábica (AAAA-MM-DD)"
          maxLength={10}
        />

        <Button
          label={isEditing ? 'Guardar cambios' : 'Registrar'}
          icon="check"
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
    marginTop: SPACING.sm,
  },
  photoBox: {
    height: 160,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  primaryBtn: {
    marginTop: SPACING.md,
  },
});
