import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import EmptyState from '../../components/EmptyState';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import { usePetsStore } from '../../store/pets.store';
import type { Pet, PetIncident } from '../../../domain/responses/PetResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  PET_INCIDENT_STATUS_LABEL, PET_INCIDENT_STATUS_VARIANT, PET_INCIDENT_TYPE_LABEL,
  PET_SPECIES_LABEL, PET_STATUS_LABEL, PET_STATUS_VARIANT,
  hasExpiredInsurance, petDefenseLabel, petUnitLabel, petWhen,
} from './pets.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Pets'>;

/**
 * Mascotas de la unidad y reportes de convivencia.
 *
 * Son dos cosas distintas y por eso son dos pestañas: el censo es la ficha que
 * la administración valida, y los reportes son el expediente que puede terminar
 * en multa. Mezclarlos haría imposible ver lo que corre plazo.
 */
export default function PetsScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError } = useAlert();

  const resident = useAuthStore(state => state.resident);
  const complexId = resident?.complex?.id;

  const [tab, setTab] = useState<'pets' | 'incidents'>('pets');

  const pets = usePetsStore(state => state.pets);
  const incidents = usePetsStore(state => state.incidents);
  const isLoading = usePetsStore(state => state.isLoading);
  const loadPets = usePetsStore(state => state.load);

  const load = useCallback(async () => {
    if (!complexId) return;
    try {
      await loadPets(complexId);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudieron cargar las mascotas.');
    }
  }, [complexId, loadPets, showError]);

  useEffect(() => { load(); }, [load]);

  // Lo que corre plazo va primero: si hay un reporte esperando descargos, es lo
  // único de esta pantalla que tiene fecha límite.
  const pending = incidents.filter(item => String(item.status) === 'UNDER_DEFENSE');

  // Con la pestaña vacía el contenido crece hasta llenar la pantalla: así el
  // estado vacío queda centrado y no pegado al borde de arriba.
  const isEmptyTab = !isLoading && (tab === 'pets' ? pets.length === 0 : incidents.length === 0);

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Mascotas" showBack onBack={() => navigation.goBack()} />

      <View style={styles.tabs}>
        {([['pets', 'Mis mascotas'], ['incidents', 'Reportes']] as const).map(([value, label]) => (
          <TouchableOpacity
            key={value}
            onPress={() => setTab(value)}
            style={[
              styles.tab,
              { backgroundColor: tab === value ? colors.primary : colors.surface },
            ]}>
            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              color={tab === value ? colors.textInverse : colors.textSecondary}>
              {label}
            </CustomTextComponent>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, isEmptyTab && styles.contentEmpty]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} colors={[colors.primary]} />
        }>

        {/* El aviso va arriba y en las dos pestañas: el plazo de descargos es lo
            único aquí que se vence solo. */}
        {pending.length > 0 && (
          <Card onPress={() => setTab('incidents')} style={{ backgroundColor: colors.warningLight }}>
            <View style={styles.noticeRow}>
              <Icon name="schedule" size={18} color={colors.warning} />
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={gs.flex1}>
                Tienes {pending.length} reporte(s) esperando tu respuesta. Si el plazo vence sin que
                respondas, la administración decide con lo que tiene.
              </CustomTextComponent>
            </View>
          </Card>
        )}

        {isLoading && pets.length === 0 && incidents.length === 0 ? (
          <LoadingSpinner />
        ) : tab === 'pets' ? (
          pets.length === 0 ? (
            <EmptyState
              icon="pets"
              title="Sin mascotas registradas"
              description="Necesitas una foto clara: es lo que permite identificar a tu mascota si alguien la reporta."
              actionLabel="Registrar mascota"
              onAction={() => navigation.navigate('PetRegister')}
            />
          ) : (
            <>
              {pets.map(pet => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onPress={() => navigation.navigate('PetDetail', { petId: pet.id })}
                />
              ))}

              {/* Al final de la lista y no encima: el residente entra a mirar
                  sus fichas, no a agregar otra. */}
              <Button
                label="Registrar mascota"
                icon="add"
                variant="outline"
                fullWidth
                onPress={() => navigation.navigate('PetRegister')}
                style={styles.listAction}
              />
            </>
          )
        ) : incidents.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="Sin reportes"
            description="Aquí aparecen los que tú radicas y los que se abran relacionados con una mascota de tu unidad."
            actionLabel="Reportar un caso"
            onAction={() => navigation.navigate('PetIncidentReport')}
          />
        ) : (
          incidents.map(incident => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onPress={() => navigation.navigate('PetIncidentDetail', { incidentId: incident.id })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

/** Una tarjeta por mascota: foto, nombre, estado y lo que haya que corregir. */
function PetCard({ pet, onPress }: { pet: Pet; onPress: () => void }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();

  const expiredInsurance = hasExpiredInsurance(pet);

  return (
    <Card onPress={onPress}>
      <View style={styles.petRow}>
        {pet.photoUrl ? (
          <Image source={{ uri: pet.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: colors.border }]}>
            <Icon name="pets" size={22} color={colors.textTertiary} />
          </View>
        )}

        <View style={gs.flex1}>
          <View style={styles.cardHead}>
            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}>
              {pet.name}
            </CustomTextComponent>
            <StatusChip
              label={PET_STATUS_LABEL[String(pet.status)] ?? String(pet.status)}
              variant={PET_STATUS_VARIANT[String(pet.status)] ?? 'neutral'}
            />
          </View>

          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
            {PET_SPECIES_LABEL[String(pet.species)] ?? pet.species}
            {pet.breed ? ` · ${pet.breed}` : ''}
          </CustomTextComponent>

          {String(pet.status) === 'REJECTED' && !!pet.rejectionReason && (
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.error}>
              {pet.rejectionReason}
            </CustomTextComponent>
          )}

          {expiredInsurance && (
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.error}>
              La póliza de responsabilidad civil está vencida.
            </CustomTextComponent>
          )}
        </View>

        <Icon name="chevron-right" size={18} color={colors.textTertiary} />
      </View>
    </Card>
  );
}

/** Una tarjeta por reporte: número, motivo, estado y el plazo si corre. */
function IncidentCard({ incident, onPress }: { incident: PetIncident; onPress: () => void }) {
  const { colors } = useTheme();

  const defense = petDefenseLabel(incident.statementDueAt);

  return (
    <Card onPress={onPress}>
      <View style={styles.cardHead}>
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
          {incident.code}
        </CustomTextComponent>
        <StatusChip
          label={PET_INCIDENT_STATUS_LABEL[String(incident.status)] ?? String(incident.status)}
          variant={PET_INCIDENT_STATUS_VARIANT[String(incident.status)] ?? 'neutral'}
        />
      </View>

      <CustomTextComponent
        fontSize={FONT_SIZE.md}
        fontWeight={FONT_WEIGHT.semibold as any}
        color={colors.textPrimary}>
        {PET_INCIDENT_TYPE_LABEL[String(incident.type)] ?? incident.type}
      </CustomTextComponent>

      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} numberOfLines={2}>
        {incident.description}
      </CustomTextComponent>

      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary}>
        {incident.pet?.name ? `${incident.pet.name} · ` : ''}
        {petUnitLabel(incident.unit) ?? 'Sin unidad identificada'} · {petWhen(incident.occurredAt)}
      </CustomTextComponent>

      {String(incident.status) === 'UNDER_DEFENSE' && !!defense && (
        <CustomTextComponent fontSize={11} color={colors.warning}>
          {defense}
        </CustomTextComponent>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  contentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  listAction: {
    marginTop: SPACING.sm,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
});
