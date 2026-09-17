import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import ImageViewerModal from '../../components/ImageViewerModal';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { usePetsStore } from '../../store/pets.store';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE } from '../../constants/typography';
import {
  PET_SEX_LABEL, PET_SIZE_LABEL, PET_SPECIES_LABEL, PET_STATUS_LABEL, PET_STATUS_VARIANT,
  hasExpiredInsurance, nextRabiesDose, petDay, petUnitLabel,
} from './pets.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'PetDetail'>;
type ScreenRoute = RouteProp<HomeStackParamList, 'PetDetail'>;

/**
 * Mientras la administración no haya validado la ficha, el residente la puede
 * corregir o retirarla. Después no: una ficha aprobada es la que la portería
 * usa para identificar al animal, y cambiarla por detrás dejaría al censo
 * diciendo una cosa y a la realidad otra. Para eso está el rechazo con motivo.
 */
const EDITABLE_STATES = ['PENDING_APPROVAL', 'REJECTED'];

/**
 * Ficha de la mascota tal como la ve su dueño.
 *
 * Lo que más importa aquí no son los datos: es lo que hay que corregir. Una
 * ficha rechazada sin decir por qué, o una póliza vencida que nadie avisa, son
 * las dos formas de que el residente se entere tarde.
 */
export default function PetDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showAlert, showError, showSuccess } = useAlert();

  const pet = usePetsStore(state => state.pets.find(item => item.id === route.params.petId));
  const removePet = usePetsStore(state => state.remove);

  const [isRemoving, setIsRemoving] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  const nextDose = useMemo(() => (pet ? nextRabiesDose(pet) : null), [pet]);

  if (!pet) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Mascota" showBack onBack={() => navigation.goBack()} />
        <EmptyState
          icon="pets"
          title="No encontramos la ficha"
          description="Vuelve a la lista y desliza para recargar."
          actionLabel="Volver"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const expiredInsurance = hasExpiredInsurance(pet);
  const missingInsurance = pet.isSpecialBreed && !pet.insurancePolicyNumber;
  // El servidor aplica la misma regla (PET_LOCKED_AFTER_APPROVAL): esto solo
  // evita mostrar un botón que iba a fallar.
  const canEdit = EDITABLE_STATES.includes(String(pet.status));
  const isPending = String(pet.status) !== 'ACTIVE' && String(pet.status) !== 'SUSPENDED';

  const confirmRemove = () => {
    showAlert({
      type: 'question',
      title: isPending ? `Eliminar el registro de ${pet.name}` : `Retirar a ${pet.name}`,
      description: isPending
        ? 'La ficha nunca entró al censo, así que se elimina sin más. Puedes volver a '
          + 'registrarla cuando quieras.'
        : 'La ficha sale de tu unidad y tendrás que registrarla de nuevo si vuelve. '
          + 'Los reportes que ya existan se conservan.',
      buttons: [
        {
          text: isPending ? 'Eliminar' : 'Retirar',
          style: 'danger',
          icon: 'delete-outline',
          iconLibrary: 'MaterialIcons',
          onPress: () => { void handleRemove(); },
        },
        { text: 'Cancelar', style: 'text', onPress: () => undefined },
      ],
    });
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await removePet(pet.id);
      showSuccess(isPending
        ? `Se eliminó el registro de ${pet.name}.`
        : `${pet.name} salió del censo.`);
      navigation.goBack();
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo retirar la mascota.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title={pet.name} showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Tocar la foto la abre completa: en la tarjeta va recortada y ahí no
            se distingue una mascota de otra. */}
        {!!pet.photoUrl && (
          <TouchableOpacity activeOpacity={0.9} onPress={() => setZoomedPhoto(pet.photoUrl!)}>
            <Image source={{ uri: pet.photoUrl }} style={styles.photo} />
            <View style={styles.zoomBadge}>
              <Icon name="zoom-out-map" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        <Card>
          <View style={styles.head}>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              {PET_SPECIES_LABEL[String(pet.species)] ?? pet.species}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </CustomTextComponent>
            <StatusChip
              label={PET_STATUS_LABEL[String(pet.status)] ?? String(pet.status)}
              variant={PET_STATUS_VARIANT[String(pet.status)] ?? 'neutral'}
            />
          </View>

          {!!pet.color && (
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              Color: {pet.color}
            </CustomTextComponent>
          )}
          {!!pet.sex && (
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              Sexo: {PET_SEX_LABEL[String(pet.sex)] ?? pet.sex}
            </CustomTextComponent>
          )}
          {!!pet.size && (
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              Porte: {PET_SIZE_LABEL[String(pet.size)] ?? pet.size}
            </CustomTextComponent>
          )}
          {/* Se dice siempre, también cuando es "No": es lo que define si la
              ficha necesita póliza para aprobarse. */}
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
            Raza de manejo especial: {pet.isSpecialBreed ? 'Sí' : 'No'}
          </CustomTextComponent>
          {!!pet.distinguishingMarks && (
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              Señas: {pet.distinguishingMarks}
            </CustomTextComponent>
          )}
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary}>
            {petUnitLabel(pet.unit) ?? 'Tu unidad'}
            {pet.microchipCode ? ` · Microchip ${pet.microchipCode}` : ''}
          </CustomTextComponent>
        </Card>

        {/* Lo que hay que corregir va primero y en color: es la razón por la que
            la ficha no está activa. */}
        {String(pet.status) === 'REJECTED' && !!pet.rejectionReason && (
          <Card style={{ backgroundColor: colors.warningLight }}>
            <View style={styles.noticeRow}>
              <Icon name="error-outline" size={18} color={colors.error} />
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={gs.flex1}>
                La administración rechazó la ficha: {pet.rejectionReason}
              </CustomTextComponent>
            </View>
          </Card>
        )}

        {String(pet.status) === 'PENDING_APPROVAL' && (
          <Card style={{ backgroundColor: colors.primarySurface }}>
            <View style={styles.noticeRow}>
              <Icon name="hourglass-empty" size={18} color={colors.primary} />
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={gs.flex1}>
                La administración está validando la ficha. Mientras tanto puedes corregirla o
                retirarla.
              </CustomTextComponent>
            </View>
          </Card>
        )}

        {(missingInsurance || expiredInsurance) && (
          <Card style={{ backgroundColor: colors.warningLight }}>
            <View style={styles.noticeRow}>
              <Icon name="gavel" size={18} color={colors.warning} />
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={gs.flex1}>
                {missingInsurance
                  ? 'Es una raza de manejo especial y no tiene póliza de responsabilidad civil registrada. Sin ella la ficha no se puede aprobar.'
                  : `La póliza venció el ${petDay(String(pet.insuranceExpiresAt))}. Renuévala y avísale a la administración.`}
              </CustomTextComponent>
            </View>
          </Card>
        )}

        {!!nextDose && (
          <Card>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              Próximo refuerzo antirrábico: {petDay(nextDose.toISOString())}
            </CustomTextComponent>
          </Card>
        )}

        <View style={styles.actions}>
          {canEdit && (
            <View style={gs.flex1}>
              <Button
                label="Editar"
                icon="edit"
                variant="outline"
                fullWidth
                onPress={() => navigation.navigate('PetRegister', { petId: pet.id })}
              />
            </View>
          )}
          <View style={gs.flex1}>
            <Button
              label={isPending ? 'Eliminar' : 'Retirar del censo'}
              icon="delete-outline"
              variant="danger"
              fullWidth
              loading={isRemoving}
              disabled={isRemoving}
              onPress={confirmRemove}
            />
          </View>
        </View>
      </ScrollView>

      <ImageViewerModal
        uri={zoomedPhoto}
        caption={pet.name}
        onClose={() => setZoomedPhoto(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.lg,
  },
  zoomBadge: {
    position: 'absolute',
    right: SPACING.sm,
    bottom: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
});
