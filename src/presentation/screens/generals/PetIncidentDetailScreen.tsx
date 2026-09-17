import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Image, RefreshControl } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { usePetsStore } from '../../store/pets.store';
import { fetchPetIncident } from '../../../infraestructure/services/pets.service';
import type { PetIncident } from '../../../domain/responses/PetResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  PET_DEFENSE_NOTE, PET_INCIDENT_STATUS_LABEL, PET_INCIDENT_STATUS_VARIANT,
  PET_INCIDENT_TYPE_LABEL, PET_REPORTER_PRIVACY_NOTE, PET_SEVERITY_LABEL, PET_SEVERITY_VARIANT,
  canStillRespond, petDefenseLabel, petMoney, petUnitLabel, petWhen,
} from './pets.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'PetIncidentDetail'>;
type ScreenRoute = RouteProp<HomeStackParamList, 'PetIncidentDetail'>;

/**
 * Expediente del reporte, visto por el residente.
 *
 * Si el caso está en descargos, lo único que importa en esta pantalla es el
 * plazo y el campo para responder: es la oportunidad que la ley le da de ser
 * oído antes de que lo sancionen, y se vence solo.
 */
export default function PetIncidentDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showSuccess } = useAlert();

  const sendStatement = usePetsStore(state => state.sendStatement);
  const storeVersion = usePetsStore(
    state => state.incidents.find(item => item.id === route.params.incidentId),
  );

  const [incident, setIncident] = useState<PetIncident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statement, setStatement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setIncident(await fetchPetIncident(route.params.incidentId));
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo cargar el reporte.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.incidentId, showError]);

  useEffect(() => { load(); }, [load]);

  // Lo que llegó por socket manda sobre lo que trajo la consulta: el estado
  // pudo cambiar mientras la ficha estaba abierta.
  useEffect(() => {
    if (!storeVersion || !incident) return;
    if (storeVersion.status === incident.status) return;
    setIncident(current => (current ? { ...current, status: storeVersion.status } : current));
  }, [storeVersion, incident]);

  const handleSend = async () => {
    if (statement.trim().length < 10) {
      showError('Cuenta tu versión con un poco más de detalle.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await sendStatement(route.params.incidentId, statement.trim());
      setIncident(updated);
      setStatement('');
      showSuccess('Tus descargos quedaron registrados. La administración ya puede verlos.');
    } catch (e: any) {
      showError(e?.message ?? 'No se pudieron enviar los descargos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !incident) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Reporte" showBack onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  const statements = incident.statements ?? [];
  const canRespond = canStillRespond(incident);
  const defense = petDefenseLabel(incident.statementDueAt);
  const isMine = !!incident.reportedByName;

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title={incident.code} showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} colors={[colors.primary]} />}>

        <Card>
          <View style={styles.head}>
            <StatusChip
              label={PET_SEVERITY_LABEL[String(incident.severity)] ?? String(incident.severity)}
              variant={PET_SEVERITY_VARIANT[String(incident.severity)] ?? 'neutral'}
            />
            <StatusChip
              label={PET_INCIDENT_STATUS_LABEL[String(incident.status)] ?? String(incident.status)}
              variant={PET_INCIDENT_STATUS_VARIANT[String(incident.status)] ?? 'neutral'}
            />
          </View>

          <CustomTextComponent
            fontSize={FONT_SIZE.lg}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textPrimary}>
            {PET_INCIDENT_TYPE_LABEL[String(incident.type)] ?? incident.type}
          </CustomTextComponent>

          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
            Ocurrió el {petWhen(incident.occurredAt)}
            {incident.location ? ` · ${incident.location}` : ''}
          </CustomTextComponent>

          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary}>
            {incident.pet?.name ? `${incident.pet.name} · ` : ''}
            {petUnitLabel(incident.unit) ?? 'Sin unidad identificada'}
          </CustomTextComponent>
        </Card>

        <Card>
          <CustomTextComponent
            fontSize={FONT_SIZE.md}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textPrimary}>
            Relato
          </CustomTextComponent>
          <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textSecondary}>
            {incident.description}
          </CustomTextComponent>
        </Card>

        {incident.photoUrls.length > 0 && (
          <Card>
            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}>
              Evidencia
            </CustomTextComponent>
            <View style={styles.photos}>
              {incident.photoUrls.map((url, index) => (
                <Image key={`${url}-${index}`} source={{ uri: url }} style={styles.thumb} />
              ))}
            </View>
          </Card>
        )}

        {/* Quien no radicó el reporte no ve quién lo hizo, y merece saber por
            qué en vez de suponer que es un error. */}
        {!isMine && (
          <Card style={{ backgroundColor: colors.primarySurface }}>
            <View style={styles.noticeRow}>
              <Icon name="privacy-tip" size={18} color={colors.primary} />
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={gs.flex1}>
                {PET_REPORTER_PRIVACY_NOTE}
              </CustomTextComponent>
            </View>
          </Card>
        )}

        {String(incident.status) === 'UNDER_DEFENSE' && (
          <Card style={{ backgroundColor: colors.warningLight }}>
            <View style={styles.noticeRow}>
              <Icon name="gavel" size={18} color={colors.warning} />
              <View style={gs.flex1}>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary}>
                  {PET_DEFENSE_NOTE}
                </CustomTextComponent>
                {!!defense && (
                  <CustomTextComponent
                    fontSize={FONT_SIZE.sm}
                    fontWeight={FONT_WEIGHT.semibold as any}
                    color={colors.warning}>
                    {defense}
                  </CustomTextComponent>
                )}
              </View>
            </View>
          </Card>
        )}

        {statements.length > 0 && (
          <Card>
            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}>
              Expediente
            </CustomTextComponent>

            {statements.map(item => (
              <View key={item.id} style={styles.statement}>
                <CustomTextComponent fontSize={11} color={colors.textTertiary}>
                  {item.authorName ?? 'Administración'} · {petWhen(item.createdAt)}
                </CustomTextComponent>
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                  {item.text}
                </CustomTextComponent>
              </View>
            ))}
          </Card>
        )}

        {/* La decisión, cuando ya la hay. La multa se dice con su valor: aparece
            en el estado de cuenta y el residente tiene que poder cuadrarla. */}
        {!!incident.resolutionNotes && String(incident.status) !== 'UNDER_DEFENSE' && (
          <Card>
            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}>
              Decisión de la administración
            </CustomTextComponent>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              {incident.resolutionNotes}
            </CustomTextComponent>
            {String(incident.status) === 'FINED' && incident.fineAmount != null && (
              <CustomTextComponent
                fontSize={FONT_SIZE.md}
                fontWeight={FONT_WEIGHT.semibold as any}
                color={colors.error}>
                Multa cargada a la unidad: {petMoney(incident.fineAmount)}
              </CustomTextComponent>
            )}
          </Card>
        )}

        {canRespond && (
          <Card>
            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}>
              Tu versión
            </CustomTextComponent>
            <CustomInputComponent
              value={statement}
              onChangeText={setStatement}
              placeholder="Explica lo que pasó desde tu lado"
              multiline
              numberOfLines={5}
              maxLength={2000}
            />
            <Button
              label="Enviar descargos"
              icon="send"
              onPress={handleSend}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
              style={styles.primaryBtn}
            />
          </Card>
        )}
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.md,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  statement: {
    gap: 2,
    marginTop: SPACING.xs,
  },
  primaryBtn: {
    marginTop: SPACING.sm,
  },
});
