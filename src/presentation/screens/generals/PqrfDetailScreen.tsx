import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import { usePqrfStore } from '../../store/pqrf.store';
import { fetchPqrf } from '../../../infraestructure/services/pqrf.service';
import type { Pqrf } from '../../../domain/responses/PqrfResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  PQRF_ADDRESSEE_LABEL, PQRF_RESOLVED_NOTE, PQRF_SILENCE_NOTE, PQRF_STATUS_LABEL,
  PQRF_STATUS_TONE, PQRF_TYPE_LABEL, pqrfDueLabel, pqrfUnitLabel, pqrfWhen,
} from './pqrf.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'PqrfDetail'>;
type ScreenRoute = RouteProp<HomeStackParamList, 'PqrfDetail'>;

/**
 * Ficha del radicado.
 *
 * Al abrirse deja constancia de que quien atiende lo leyó —el backend ignora la
 * llamada si quien mira es el propio residente— y desde aquí cada destinatario
 * marca su parte. El radicado solo queda resuelto cuando todos marcan, así que
 * la ficha muestra quién falta en vez de un botón que mienta.
 */
export default function PqrfDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showSuccess } = useAlert();

  const resident = useAuthStore(state => state.resident);
  const myUserId = resident?.user?.id;

  const openPqrf = usePqrfStore(state => state.open);
  const resolvePqrf = usePqrfStore(state => state.resolve);
  const storeVersion = usePqrfStore(state => [...state.mine, ...state.inbox]
    .find(item => item.id === route.params.pqrfId));

  const [pqrf, setPqrf] = useState<Pqrf | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Se abre en dos pasos: primero se pinta lo que hay, y en paralelo se deja la
   * constancia. Si `openPqrf` falla —quien mira no atiende este radicado— la
   * ficha ya está en pantalla y no pasa nada.
   */
  const load = useCallback(async () => {
    try {
      const detail = await fetchPqrf(route.params.pqrfId);
      setPqrf(detail);
      try {
        const marked = await openPqrf(route.params.pqrfId);
        setPqrf(marked);
      } catch { /* leerlo no siempre es atenderlo */ }
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo cargar el radicado.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.pqrfId, openPqrf, showError]);

  useEffect(() => { load(); }, [load]);

  // Lo que llegó por socket manda sobre lo que trajo la consulta.
  useEffect(() => {
    if (!storeVersion || !pqrf) return;
    if (storeVersion.status === pqrf.status) return;
    setPqrf(current => (current ? { ...current, ...storeVersion } : current));
  }, [storeVersion, pqrf]);

  const handleResolve = async () => {
    setIsSubmitting(true);
    try {
      const updated = await resolvePqrf(route.params.pqrfId);
      setPqrf(updated);
      showSuccess(
        updated.status === 'RESUELTO'
          ? 'El radicado quedó resuelto y el residente fue notificado.'
          : 'Marcaste tu parte. El radicado se cierra cuando todos los destinatarios lo marquen.',
      );
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo marcar como resuelto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !pqrf) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Radicado" showBack onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  const acks = pqrf.acknowledgements ?? [];
  const myAck = acks.find(ack => ack.userId === myUserId);
  const resolvedBy = acks.filter(ack => ack.resolvedAt);
  const isResolved = String(pqrf.status) === 'RESUELTO';

  // Solo quien atiende ve el botón. Lo decide el servidor: un consejero pudo
  // abrirlo antes de que la administración designara a otros, y su constancia
  // de apertura ya no dice que le toque.
  const canResolve = !isResolved
    && (pqrf.viewerCanResolve ?? (!!myAck && !myAck.resolvedAt));
  const unitLabel = pqrfUnitLabel(pqrf.unit);

  const tone = PQRF_STATUS_TONE[String(pqrf.status)] ?? 'muted';
  const toneColor = tone === 'success' ? colors.success
    : tone === 'warning' ? colors.warning
      : tone === 'info' ? colors.primary
        : colors.textTertiary;

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title={pqrf.code} showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} colors={[colors.primary]} />}>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.head}>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              {PQRF_TYPE_LABEL[String(pqrf.type)] ?? 'Radicado'}
            </CustomTextComponent>
            <View style={[styles.badge, { backgroundColor: toneColor }]}>
              <CustomTextComponent fontSize={11} color={colors.textInverse}>
                {PQRF_STATUS_LABEL[String(pqrf.status)] ?? pqrf.status}
              </CustomTextComponent>
            </View>
          </View>

          <CustomTextComponent
            fontSize={FONT_SIZE.lg}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textPrimary}>
            {pqrf.subject}
          </CustomTextComponent>

          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
            Dirigido a {PQRF_ADDRESSEE_LABEL[String(pqrf.addressee)] ?? pqrf.addressee}
            {' · '}{pqrfWhen(pqrf.createdAt)}
          </CustomTextComponent>

          {/* El plazo es lo que evita que un radicado quede abierto para
              siempre, así que el residente tiene derecho a verlo. */}
          {!isResolved && (
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.warning}>
              {pqrfDueLabel(pqrf.dueAt)}
            </CustomTextComponent>
          )}

          {!!pqrf.requestedByName && (
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary}>
              Radicado por {pqrf.requestedByName}
              {unitLabel ? ` · ${unitLabel}` : ''}
            </CustomTextComponent>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <CustomTextComponent
            fontSize={FONT_SIZE.md}
            fontWeight={FONT_WEIGHT.semibold as any}
            color={colors.textPrimary}>
            Descripción
          </CustomTextComponent>
          <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textSecondary}>
            {pqrf.description}
          </CustomTextComponent>
        </View>

        {/* La respuesta formal no vive en la app: sin esta nota el residente se
            queda esperando algo que nunca va a aparecer en pantalla. */}
        {isResolved && (
          <View
            style={[
              styles.notice,
              { backgroundColor: pqrf.resolvedBySilence ? colors.warningLight : colors.successLight },
            ]}>
            <Icon
              name={pqrf.resolvedBySilence ? 'gavel' : 'mark-email-read'}
              size={18}
              color={pqrf.resolvedBySilence ? colors.warning : colors.success}
            />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={gs.flex1}>
              {pqrf.resolvedBySilence ? PQRF_SILENCE_NOTE : PQRF_RESOLVED_NOTE}
            </CustomTextComponent>
          </View>
        )}

        {acks.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}>
              Seguimiento
            </CustomTextComponent>

            {acks.map(ack => (
              <View key={ack.id} style={styles.ackRow}>
                <Icon
                  name={ack.resolvedAt ? 'check-circle' : 'visibility'}
                  size={16}
                  color={ack.resolvedAt ? colors.success : colors.textTertiary}
                />
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={gs.flex1}>
                  {ack.userName ?? 'Quien atiende'}
                  {ack.resolvedAt
                    ? ` lo dio por resuelto · ${pqrfWhen(ack.resolvedAt)}`
                    : ` lo abrió · ${pqrfWhen(ack.openedAt)}`}
                </CustomTextComponent>
              </View>
            ))}

            {!isResolved && resolvedBy.length > 0 && (
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary}>
                Falta que los demás destinatarios lo marquen para darlo por resuelto.
              </CustomTextComponent>
            )}
          </View>
        )}

        {canResolve && (
          <CustomButtonComponent
            text="Marcar como resuelto"
            onPress={handleResolve}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            loaderColor={colors.textInverse}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
          />
        )}

        {/* Sin esto el consejero ve el radicado sin botón y no sabe por qué. */}
        {!!pqrf.viewerIsCouncilObserver && !isResolved && (
          <View style={[styles.notice, { backgroundColor: colors.primarySurface }]}>
            <Icon name="info-outline" size={18} color={colors.primary} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={gs.flex1}>
              La administración designó a otros consejeros para responder los radicados. Puedes
              leerlo, pero no marcarlo como resuelto.
            </CustomTextComponent>
          </View>
        )}

        {!!myAck?.resolvedAt && !isResolved && (
          <View style={[styles.notice, { backgroundColor: colors.primarySurface }]}>
            <Icon name="hourglass-empty" size={18} color={colors.primary} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={gs.flex1}>
              Ya marcaste tu parte. El radicado se cierra cuando todos los destinatarios lo marquen.
            </CustomTextComponent>
          </View>
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
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  ackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  primaryBtn: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
});
