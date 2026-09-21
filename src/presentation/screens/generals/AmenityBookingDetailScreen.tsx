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
import VisitStatusBadge from '../../components/VisitStatusBadge';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAmenitiesStore, type AmenityBooking } from '../../store/amenities.store';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  AMENITY_TYPE_LABEL, BOOKING_STATUS_CFG, bookingWhenLabel, formatMoney,
  minutesLabel, timeOf,
} from './amenities.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'AmenityBookingDetail'>;
type ScreenRoute = RouteProp<HomeStackParamList, 'AmenityBookingDetail'>;

const MS_PER_HOUR = 60 * 60 * 1000;

export default function AmenityBookingDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showQuestion } = useAlert();

  const { bookings, isSubmitting, fetchBookingById, cancelBooking } = useAmenitiesStore();
  const [booking, setBooking] = useState<AmenityBooking | null>(
    bookings.find(b => b.id === route.params.bookingId) ?? null,
  );
  const [isLoading, setIsLoading] = useState(!booking);

  const load = useCallback(async () => {
    try {
      setBooking(await fetchBookingById(route.params.bookingId));
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo cargar la reserva.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchBookingById, route.params.bookingId, showError]);

  useEffect(() => { load(); }, [load]);

  if (isLoading || !booking) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Reserva" showBack onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  const status = String(booking.status);

  /**
   * Lo que falta por pagar: tarifa más el aseo que asumió el conjunto, menos lo
   * que ya entró. Misma cuenta que hace el backend para decidir si emite el
   * código, porque mostrar un valor distinto al del aviso sería peor que nada.
   */
  const pendingAmount = booking.directIncomeId
    ? 0
    : booking.feeAmount + (booking.cleaningByComplex ? booking.cleaningFeeAmount : 0);
  const canCancel = ['PENDING', 'APPROVED'].includes(status);
  // El plazo suma los días y las horas que configuró la administración, y fuera
  // de él solo se retiene el porcentaje de la tarifa que fije la zona. El
  // residente merece ver el valor exacto ANTES de confirmar, no después en su
  // estado de cuenta.
  const deadlineHours = (booking.amenity?.cancellationDeadlineDays ?? 0) * 24
    + (booking.amenity?.cancellationDeadlineHours ?? 0);
  const hoursToStart = (new Date(booking.startAt).getTime() - Date.now()) / MS_PER_HOUR;
  const isLate = hoursToStart < deadlineHours;
  const retained = isLate
    ? Math.round(booking.feeAmount * (booking.amenity?.lateCancellationFeePercent ?? 100)) / 100
    : 0;

  const deadlineLabel = deadlineHours % 24 === 0
    ? `${deadlineHours / 24} día(s)`
    : `${deadlineHours} horas`;

  const handleCancel = () => {
    showQuestion(
      retained > 0
        ? `Ya pasó el plazo de cancelación (${deadlineLabel} antes), así que se retienen ${formatMoney(retained)} de la tarifa. ¿Cancelar de todas formas?`
        : '¿Seguro que quieres cancelar esta reserva? La franja quedará libre para otra unidad.',
      'Cancelar reserva',
      {
        buttons: [
          { text: 'Volver', style: 'secondary', onPress: () => {} },
          {
            text: 'Cancelar reserva',
            style: 'primary',
            onPress: async () => {
              try {
                await cancelBooking(booking.id);
                await load();
              } catch (e: any) {
                showError(e?.message ?? 'No se pudo cancelar la reserva.');
              }
            },
          },
        ],
      },
    );
  };

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Reserva" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} colors={[colors.primary]} />}>

        {/* ── Encabezado ───────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.headerRow}>
            <View style={gs.flex1}>
              <CustomTextComponent fontSize={FONT_SIZE.lg} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary}>
                {booking.amenity?.name ?? 'Zona común'}
              </CustomTextComponent>
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 2 }}>
                {AMENITY_TYPE_LABEL[String(booking.amenity?.type)] ?? 'Zona común'}
              </CustomTextComponent>
            </View>
            <VisitStatusBadge status={status} customConfig={BOOKING_STATUS_CFG} />
          </View>

          <View style={[gs.divider, { marginVertical: SPACING.md }]} />

          <Row icon="event" label="Cuándo" value={bookingWhenLabel(booking.startAt, booking.endAt, booking.amenity?.durationUnit)} />
          <Row icon="groups" label="Asistentes" value={String(booking.attendees)} />
          {!!booking.purpose && <Row icon="notes" label="Motivo" value={booking.purpose} />}
          <Row
            icon="payments"
            label="Tarifa"
            value={
              booking.isCouncilFreeBooking
                ? 'Sin costo · cupo del consejo'
                : booking.feeAmount > 0
                  // Pagado en la ventanilla: ya no le cuelga a la unidad, y
                  // decirlo evita que lo busque en su estado de cuenta.
                  ? `${formatMoney(booking.feeAmount)}${booking.directIncomeId ? ' · pagado en la administración' : ''}`
                  : 'Sin costo'
            }
          />
          {/* El aseo cambia dos cosas que el residente necesita ver: hasta
              cuándo queda tomada la zona y si le llega un cargo más. La
              administración puede ajustarlo después de reservar. */}
          {(booking.cleaningMinutes > 0 || booking.cleaningByComplex) && (
            <Row
              icon="cleaning-services"
              label="Aseo"
              value={cleaningValue(booking)}
            />
          )}
          {/* Plata a favor del residente: es lo primero que va a querer saber
              al abrir una reserva que canceló. */}
          {booking.refundAmount > 0 && (
            <Row
              icon="assignment-return"
              label="Devolución"
              value={
                booking.refundedAt
                  ? `${formatMoney(booking.refundAmount)} · ya te fueron entregados`
                  : `${formatMoney(booking.refundAmount)} · reclámalos en la administración`
              }
            />
          )}
          {booking.lateCancellationAmount > 0 && (
            <Row
              icon="money-off"
              label="Penalización"
              value={`${formatMoney(booking.lateCancellationAmount)} por cancelar fuera de plazo`}
            />
          )}
        </View>

        {/* ── Código de ingreso ────────────────────────────────── */}
        {status === 'APPROVED' && !!booking.accessCode && (
          <View style={[styles.card, styles.codeCard, { backgroundColor: colors.primarySurface }]}>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              Muestra este código en portería
            </CustomTextComponent>
            <CustomTextComponent
              fontSize={32}
              fontWeight={FONT_WEIGHT.bold as any}
              color={colors.primary}
              style={styles.code}>
              {booking.accessCode}
            </CustomTextComponent>
          </View>
        )}

        {/* El código es la llave de la zona y no sale hasta que la reserva esté
            pagada. Quien no lo sepa llega a portería y se devuelve, así que se
            dice acá, con el valor y dónde pagarlo. */}
        {status === 'APPROVED' && !booking.accessCode && pendingAmount > 0 && (
          <Notice
            icon="lock"
            text={
              `Tu código de ingreso sale cuando pagues ${formatMoney(pendingAmount)}. ` +
              'Acércate a la administración o cancela el cargo de tu unidad.'
            }
          />
        )}

        {/* ── Avisos según estado ──────────────────────────────── */}
        {status === 'PENDING' && (
          <Notice
            icon="hourglass-empty"
            text="La administración todavía no aprueba esta reserva. Te avisamos cuando responda."
          />
        )}
        {status === 'REJECTED' && !!booking.rejectionReason && (
          <Notice icon="cancel" text={`Rechazada: ${booking.rejectionReason}`} tone="error" />
        )}
        {status === 'CANCELLED' && !!booking.cancellationReason && (
          <Notice icon="info-outline" text={booking.cancellationReason} />
        )}
        {status === 'NO_SHOW' && (
          <Notice
            icon="report-problem"
            text="La reserva venció sin que nadie registrara el ingreso a la zona."
            tone="error"
          />
        )}

        {/* ── Cobro por daños ──────────────────────────────────── */}
        {booking.damageAmount > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderLeftWidth: 3, borderLeftColor: colors.error }]}>
            <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={colors.error}>
              Cobro por daños · {formatMoney(booking.damageAmount)}
            </CustomTextComponent>
            {!!booking.damageDescription && (
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: SPACING.xs }}>
                {booking.damageDescription}
              </CustomTextComponent>
            )}
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: SPACING.xs }}>
              Este valor quedó cargado a tu unidad en el estado de cuenta.
            </CustomTextComponent>
          </View>
        )}

        {canCancel && (
          <CustomButtonComponent
            text="Cancelar reserva"
            onPress={handleCancel}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            loaderColor={colors.textInverse}
            style={[styles.dangerBtn, { backgroundColor: colors.error }]}
            textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
          />
        )}
      </ScrollView>
    </View>
  );
}

/**
 * El aseo en una frase: quién lo hace, qué cuesta y hasta cuándo deja tomada la
 * zona. Se nombra la hora de liberación y no los minutos sueltos: "hasta las
 * 21:00" es lo que el vecino de al lado va a ver ocupado.
 */
function cleaningValue(booking: {
  cleaningMinutes: number;
  cleaningByComplex: boolean;
  cleaningFeeAmount: number;
  blockedUntilAt: string;
}): string {
  const who = booking.cleaningByComplex
    ? booking.cleaningFeeAmount > 0
      ? `Lo hace la administración · ${formatMoney(booking.cleaningFeeAmount)}`
      : 'Lo hace la administración · sin costo'
    : 'Lo hace tu unidad';

  if (booking.cleaningMinutes <= 0) return who;

  return `${who} · la zona queda apartada ${minutesLabel(booking.cleaningMinutes)} más, hasta las ${timeOf(booking.blockedUntilAt)}`;
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  return (
    <View style={styles.row}>
      <Icon name={icon} size={18} color={colors.textSecondary} />
      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.rowLabel}>
        {label}
      </CustomTextComponent>
      <CustomTextComponent
        fontSize={FONT_SIZE.sm}
        fontWeight={FONT_WEIGHT.medium as any}
        color={colors.textPrimary}
        style={[gs.flex1, styles.rowValue]}>
        {value}
      </CustomTextComponent>
    </View>
  );
}

function Notice({ icon, text, tone }: { icon: string; text: string; tone?: 'error' }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const color = tone === 'error' ? colors.error : colors.textSecondary;
  return (
    <View style={[styles.notice, { backgroundColor: colors.surface }]}>
      <Icon name={icon} size={18} color={color} />
      <CustomTextComponent fontSize={FONT_SIZE.sm} color={color} style={gs.flex1}>
        {text}
      </CustomTextComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 6,
  },
  rowLabel: {
    minWidth: 84,
  },
  rowValue: {
    textAlign: 'right',
  },
  codeCard: {
    alignItems: 'center',
  },
  code: {
    letterSpacing: 3,
    marginTop: SPACING.xs,
  },
  dangerBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
});
