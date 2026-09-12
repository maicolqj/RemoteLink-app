import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Switch } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { useAmenitiesStore, type AmenityBusyRange, type AmenitySlot } from '../../store/amenities.store';
import { fetchMyCouncilQuota } from '../../../infraestructure/services/amenities.service';
import type { AmenityCouncilQuota } from '../../../domain/responses/AmenityResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  AMENITY_TYPE_LABEL, bookingWhenLabel, cancellationPolicyLabel, freeSegments,
  localDateKey, mergeWindows, minutesBetween, momentLabel, priceLabel, stepLabel,
  summarizeClosedReason, timeOf, windowSteps,
} from './amenities.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'AmenityDetail'>;
type ScreenRoute = RouteProp<HomeStackParamList, 'AmenityDetail'>;

/** Cuántos días adelante se consulta de una vez. El backend tope es 62. */
const WINDOW_DAYS = 62;

const WEEKDAY_SHORT = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

/**
 * Cómo se ve un día en el calendario: libre, con algo ya reservado por otra
 * unidad, o sin cupo. Un día que no aparece en el mapa es un día cerrado.
 */
type DayState = 'free' | 'partial' | 'full';

export default function AmenityDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ScreenRoute>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError } = useAlert();

  const {
    amenities, availability, isLoadingAvailability, isSubmitting,
    fetchAmenities, fetchAvailability, clearAvailability, createBooking,
  } = useAmenitiesStore();

  const amenity = amenities.find(a => a.id === route.params.amenityId);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AmenitySlot | null>(null);
  // Modo RANGE: el residente elige inicio y fin dentro de una ventana abierta.
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd]     = useState<string | null>(null);
  const [attendees, setAttendees] = useState('1');
  // Cupo del consejo: se pregunta aparte porque contar las reservas del año es
  // una consulta por zona y por persona.
  const [councilQuota, setCouncilQuota] = useState<AmenityCouncilQuota | null>(null);
  const [useCouncilQuota, setUseCouncilQuota] = useState(true);
  const [purpose, setPurpose] = useState('');

  const isByDays = String(amenity?.durationUnit) === 'DAYS';

  const loadAvailability = useCallback(() => {
    if (!amenity) return;
    const today = new Date();
    const until = new Date(today);
    // No pedir más allá de la anticipación de la zona: días que el backend ya
    // reporta fuera de ventana solo ensucian el selector.
    until.setDate(until.getDate() + Math.min(WINDOW_DAYS, amenity.advanceBookingDays));
    fetchAvailability(amenity.id, localDateKey(today), localDateKey(until));
  }, [amenity, fetchAvailability]);

  useEffect(() => {
    if (amenities.length === 0) fetchAmenities();
  }, [amenities.length, fetchAmenities]);

  // Solo tiene sentido preguntarlo cuando la zona concede el beneficio.
  const councilBookingsPerYear = amenity?.councilFreeBookingsPerYear ?? 0;
  const amenityId = amenity?.id;

  useEffect(() => {
    if (!amenityId || councilBookingsPerYear <= 0) {
      setCouncilQuota(null);
      return;
    }
    fetchMyCouncilQuota(amenityId).then(setCouncilQuota).catch(() => setCouncilQuota(null));
  }, [amenityId, councilBookingsPerYear]);

  useEffect(() => {
    loadAvailability();
    return () => clearAvailability();
  }, [loadAvailability, clearAvailability]);

  const isRange = String(amenity?.bookingMode) === 'RANGE';

  // Qué cuenta como día reservable depende del modo. En SLOT y en jornadas el
  // backend entrega franjas ya resueltas; en RANGE no hay franjas y el día vale
  // si tiene alguna ventana abierta, porque el rango lo arma el residente.
  /**
   * En qué estado quedó cada día abierto: libre, con algo ya reservado, o sin
   * un hueco que sirva.
   *
   * El calendario tiene que mostrar los días que otro residente ya tomó —si no,
   * el residente los toca, entra y descubre que no hay nada— y para eso no
   * basta con saber que la zona abre: hay que restarle lo ocupado. En SLOT y en
   * jornadas el backend ya marca cada franja; en RANGE hay que ver si en lo que
   * queda libre todavía cabe la duración mínima.
   */
  const dayStates = useMemo(() => {
    const out: Record<string, DayState> = {};
    if (!amenity) return out;

    for (const day of availability?.days ?? []) {
      if (!day.isOpen) continue;

      const taken = day.busy.filter(b => b.bookingsCount >= amenity.maxSimultaneousBookings);

      if (!isRange) {
        const free = day.slots.filter(slot => slot.isAvailable).length;
        out[day.date] = free === 0 ? 'full' : free < day.slots.length ? 'partial' : 'free';
        continue;
      }

      const fits = freeSegments(day.openWindows, taken).some(
        w => minutesBetween(w.startAt, w.endAt) >= amenity.minDurationMinutes,
      );
      out[day.date] = !fits ? 'full' : taken.length > 0 ? 'partial' : 'free';
    }

    return out;
  }, [availability, amenity, isRange]);

  const bookableDays = useMemo(
    () => (availability?.days ?? []).filter(d => dayStates[d.date] && dayStates[d.date] !== 'full'),
    [availability, dayStates],
  );

  const currentDay = useMemo(
    () => bookableDays.find(d => d.date === selectedDate) ?? null,
    [bookableDays, selectedDate],
  );

  /**
   * Periodo continuo que arranca en el día elegido, con las reservas ajenas
   * que caen dentro.
   *
   * El backend entrega una ventana por día, así que una zona abierta las 24
   * horas parece cerrar cada medianoche. Uniendo las que se tocan, el salón
   * que se toma el sábado a las 2 p. m. se puede entregar el domingo a esa
   * misma hora —o antes, si el domingo ya hay una reserva—. Con dos días de
   * margen basta: una reserva por horas dura como mucho 24 h.
   */
  const rangeSpan = useMemo(() => {
    const empty = { windows: [] as { startAt: string; endAt: string }[], busy: [] as AmenityBusyRange[] };
    if (!isRange || !currentDay) return empty;

    const all = availability?.days ?? [];
    const index = all.findIndex(d => d.date === currentDay.date);
    const scope = index < 0 ? [currentDay] : all.slice(index, index + 3);

    // Una reserva que toca dos días aparece en el `busy` de ambos.
    const busy = new Map<string, AmenityBusyRange>();
    for (const b of scope.flatMap(d => d.busy)) {
      const key = `${b.startAt}-${b.endAt}`;
      const seen = busy.get(key);
      if (!seen || b.bookingsCount > seen.bookingsCount) busy.set(key, b);
    }

    return {
      windows: mergeWindows(scope.flatMap(d => d.openWindows)),
      busy: [...busy.values()],
    };
  }, [availability, currentDay, isRange]);

  // El primer día disponible queda elegido solo: es lo que el residente quiere
  // ver al entrar.
  useEffect(() => {
    if (!selectedDate && bookableDays.length > 0) setSelectedDate(bookableDays[0].date);
  }, [bookableDays, selectedDate]);

  const cancellationNote = amenity ? cancellationPolicyLabel(amenity) : null;

  const closedNote = useMemo(() => {
    if (bookableDays.length > 0 || !availability) return null;
    return summarizeClosedReason(availability.days);
  }, [availability, bookableDays]);

  // Una selección válida es una franja (SLOT/jornadas) o un rango completo.
  const hasSelection = isRange ? !!(rangeStart && rangeEnd) : !!selectedSlot;

  /**
   * Solo se ofrece el cupo cuando hay algo que ahorrar: si la zona es gratis no
   * hay tarifa que evitar y encender el interruptor solo gastaría el beneficio.
   */
  const canUseCouncilQuota = !!councilQuota
    && councilQuota.isCouncilMember
    && councilQuota.remaining > 0
    && String(amenity?.feeType) !== 'FREE';

  const selection = isRange
    ? { startAt: rangeStart, endAt: rangeEnd }
    : { startAt: selectedSlot?.startAt ?? null, endAt: selectedSlot?.endAt ?? null };

  const handleBook = async () => {
    if (!amenity) return;

    const startAt = isRange ? rangeStart : selectedSlot?.startAt;
    const endAt   = isRange ? rangeEnd   : selectedSlot?.endAt;
    if (!startAt || !endAt) return;

    const people = Number(attendees) || 1;
    if (amenity.capacity > 0 && people > amenity.capacity) {
      showError(`El aforo de ${amenity.name} es de ${amenity.capacity} persona(s).`);
      return;
    }

    try {
      const booking = await createBooking({
        amenityId: amenity.id,
        startAt,
        endAt,
        attendees: people,
        purpose: purpose.trim() || undefined,
        useCouncilFreeQuota: canUseCouncilQuota && useCouncilQuota,
      });
      navigation.replace('AmenityBookingDetail', { bookingId: booking.id });
    } catch (e: any) {
      showError(e?.message ?? 'No se pudo crear la reserva.');
    }
  };

  if (!amenity) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Zona común" showBack onBack={() => navigation.goBack()} />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title={amenity.name} showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoadingAvailability} onRefresh={loadAvailability} colors={[colors.primary]} />
        }>

        {/* ── Ficha de la zona ─────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
            {AMENITY_TYPE_LABEL[String(amenity.type)] ?? 'Zona común'}
            {amenity.location ? ` · ${amenity.location}` : ''}
          </CustomTextComponent>

          {!!amenity.description && (
            <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textPrimary} style={{ marginTop: SPACING.sm }}>
              {amenity.description}
            </CustomTextComponent>
          )}

          <View style={styles.facts}>
            <Fact icon="payments" text={priceLabel(amenity)} />
            {amenity.capacity > 0 && <Fact icon="groups" text={`Aforo ${amenity.capacity}`} />}
            {amenity.requiresApproval && <Fact icon="how-to-reg" text="Requiere aprobación" />}
            {amenity.minAdvanceDays > 0 && (
              <Fact icon="schedule" text={`Reserva con ${amenity.minAdvanceDays} día(s) de anticipación`} />
            )}
            {!!cancellationNote && <Fact icon="event-busy" text={cancellationNote} />}
            {amenity.councilFreeBookingsPerYear > 0 && (
              <Fact
                icon="volunteer-activism"
                text={
                  `El consejo de administración tiene ${amenity.councilFreeBookingsPerYear} ` +
                  `reserva${amenity.councilFreeBookingsPerYear === 1 ? '' : 's'} gratis al año en esta zona`
                }
              />
            )}
          </View>
        </View>

        {!!amenity.rules && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary}>
              Reglamento de uso
            </CustomTextComponent>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: SPACING.xs }}>
              {amenity.rules}
            </CustomTextComponent>
          </View>
        )}

        {/* ── Selector de día ──────────────────────────────────── */}
        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textPrimary}
          style={styles.sectionTitle}>
          {isByDays ? 'Elige el día' : 'Elige la fecha'}
        </CustomTextComponent>

        {isLoadingAvailability && bookableDays.length === 0 ? (
          <LoadingSpinner />
        ) : bookableDays.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              {closedNote}
            </CustomTextComponent>
          </View>
        ) : (
          <>
            <MonthCalendar
              dayStates={dayStates}
              selected={selectedDate}
              onSelect={date => {
                setSelectedDate(date);
                setSelectedSlot(null);
                setRangeStart(null);
                setRangeEnd(null);
              }}
            />

            {/* ── Selector de franja ─────────────────────────────── */}
            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.semibold as any}
              color={colors.textPrimary}
              style={styles.sectionTitle}>
              {isByDays ? 'Confirma la jornada' : 'Elige el horario'}
            </CustomTextComponent>

            {isRange ? (
              <RangePicker
                startWindows={currentDay?.openWindows ?? []}
                spanWindows={rangeSpan.windows}
                busy={rangeSpan.busy}
                capacity={amenity.maxSimultaneousBookings}
                unitMinutes={isByDays ? 24 * 60 : 60}
                minMinutes={amenity.minDurationMinutes}
                maxMinutes={amenity.maxDurationMinutes}
                startAt={rangeStart}
                endAt={rangeEnd}
                onChange={(from, to) => { setRangeStart(from); setRangeEnd(to); }}
              />
            ) : (
            <View style={styles.slotGrid}>
              {(currentDay?.slots ?? []).map(slot => {
                const isActive = selectedSlot?.startAt === slot.startAt;
                const label = isByDays ? 'Día completo' : `${timeOf(slot.startAt)} – ${timeOf(slot.endAt)}`;
                const left = slot.capacityTotal - slot.capacityUsed;

                return (
                  <TouchableOpacity
                    key={slot.startAt}
                    disabled={!slot.isAvailable}
                    style={[
                      styles.slot,
                      {
                        backgroundColor: isActive ? colors.primary : colors.surface,
                        opacity: slot.isAvailable ? 1 : 0.4,
                      },
                    ]}
                    onPress={() => setSelectedSlot(slot)}>
                    <CustomTextComponent
                      fontSize={FONT_SIZE.sm}
                      fontWeight={FONT_WEIGHT.medium as any}
                      color={isActive ? colors.textInverse : colors.textPrimary}>
                      {label}
                    </CustomTextComponent>
                    {slot.capacityTotal > 1 && (
                      <CustomTextComponent
                        fontSize={11}
                        color={isActive ? colors.textInverse : colors.textSecondary}>
                        {slot.isAvailable ? `${left} disponible(s)` : 'Sin cupo'}
                      </CustomTextComponent>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            )}

            {/* ── Datos de la reserva ────────────────────────────── */}
            {hasSelection && (
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                {/* Con rangos que cruzan la medianoche, ver la fecha de entrega
                    antes de confirmar evita la reserva de un día entero por
                    error. */}
                {!isRange && !!selection.startAt && !!selection.endAt && (
                  <View style={[styles.notice, { backgroundColor: colors.primarySurface }]}>
                    <Icon name="event-available" size={16} color={colors.primary} />
                    <CustomTextComponent
                      fontSize={FONT_SIZE.sm}
                      fontWeight={FONT_WEIGHT.medium as any}
                      color={colors.textPrimary}
                      style={gs.flex1}>
                      {bookingWhenLabel(selection.startAt, selection.endAt, String(amenity.durationUnit))}
                    </CustomTextComponent>
                  </View>
                )}

                {/* El consejero decide si gasta aquí su cupo del año o lo
                    guarda: descontárselo sin preguntar es tomarle una decisión
                    que no es nuestra. */}
                {canUseCouncilQuota && (
                  <View style={[styles.notice, { backgroundColor: colors.primarySurface }]}>
                    <Icon name="volunteer-activism" size={16} color={colors.primary} />
                    <View style={gs.flex1}>
                      <CustomTextComponent
                        fontSize={FONT_SIZE.sm}
                        fontWeight={FONT_WEIGHT.medium as any}
                        color={colors.textPrimary}>
                        Usar mi reserva gratuita del consejo
                      </CustomTextComponent>
                      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                        {`Te queda${councilQuota!.remaining === 1 ? '' : 'n'} ${councilQuota!.remaining} de ${councilQuota!.bookingsPerYear} en ${councilQuota!.year}. `}
                        {useCouncilQuota ? 'Esta reserva no te costará nada.' : 'Esta reserva se cobrará normal.'}
                      </CustomTextComponent>
                    </View>
                    <Switch
                      value={useCouncilQuota}
                      onValueChange={setUseCouncilQuota}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>
                )}

                {amenity.capacity > 0 && (

                  <Field label="¿Cuántas personas?">
                    <CustomInputComponent
                      value={attendees}
                      onChangeText={setAttendees}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </Field>
                )}
                <Field label="Motivo (opcional)">
                  <CustomInputComponent
                    value={purpose}
                    onChangeText={setPurpose}
                    placeholder="Cumpleaños, reunión familiar…"
                  />
                </Field>

                {amenity.requiresApproval && (
                  <View style={[styles.notice, { backgroundColor: colors.primarySurface }]}>
                    <Icon name="info-outline" size={16} color={colors.primary} />
                    <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={gs.flex1}>
                      La administración debe aprobar esta reserva. Te avisamos cuando responda.
                    </CustomTextComponent>
                  </View>
                )}

                <CustomButtonComponent
                  text="Reservar"
                  onPress={handleBook}
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  loaderColor={colors.textInverse}
                  style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                  textStyle={{ color: colors.textInverse, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Calendario mensual con el estado de cada día.
 *
 * Reemplaza a una tira horizontal de días: para reservar el salón "el sábado de
 * la otra semana" hay que ver el mes, no desplazarse por una lista. Un día que
 * otra unidad ya ocupó se pinta aparte y no responde: el residente tiene que
 * ver que está tomado antes de tocarlo, no descubrirlo después.
 */
function MonthCalendar({
  dayStates, selected, onSelect,
}: {
  dayStates: Record<string, DayState>;
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  const { colors } = useTheme();
  const [offset, setOffset] = useState(0);

  const base = new Date();
  const cursor = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < cursor.getDay(); i++) cells.push(null);
  for (let d = 1; d <= monthEnd.getDate(); d++) {
    cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  }

  const monthLabel = cursor.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  return (
    <View style={{ gap: SPACING.sm }}>
      <View style={styles.calHeader}>
        <TouchableOpacity onPress={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0}>
          <Icon name="chevron-left" size={24} color={offset === 0 ? colors.border : colors.textPrimary} />
        </TouchableOpacity>
        <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary}>
          {monthLabel}
        </CustomTextComponent>
        <TouchableOpacity onPress={() => setOffset(o => o + 1)}>
          <Icon name="chevron-right" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.calGrid}>
        {WEEKDAY_SHORT.map(d => (
          <View key={d} style={styles.calCell}>
            <CustomTextComponent fontSize={11} color={colors.textSecondary}>{d}</CustomTextComponent>
          </View>
        ))}

        {cells.map((date, i) => {
          if (!date) return <View key={`e-${i}`} style={styles.calCell} />;

          const key = localDateKey(date);
          const state = dayStates[key];
          const isFull = state === 'full';
          const isBookable = !!state && !isFull;
          const isSelected = key === selected;

          return (
            <TouchableOpacity
              key={key}
              disabled={!isBookable}
              onPress={() => onSelect(key)}
              style={[
                styles.calCell,
                styles.calDay,
                isSelected && { backgroundColor: colors.primary },
                !isSelected && isBookable && { backgroundColor: colors.primarySurface },
                !isSelected && isFull && { backgroundColor: colors.errorLight },
              ]}>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                fontWeight={(isBookable ? FONT_WEIGHT.semibold : FONT_WEIGHT.regular) as any}
                color={
                  isSelected ? colors.textInverse
                    : isBookable ? colors.primary
                      : isFull ? colors.error
                        : colors.textTertiary
                }>
                {date.getDate()}
              </CustomTextComponent>

              {/* Un punto basta para distinguir "queda algo" de "está libre";
                  poner texto en una casilla de 40 px no se lee. */}
              {!isSelected && state === 'partial' && (
                <View style={[styles.calDot, { backgroundColor: colors.warning }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sin leyenda, el color rojo se lee como error y no como "ya reservado". */}
      <View style={styles.calLegend}>
        <Legend color={colors.primarySurface} label="Disponible" />
        <Legend color={colors.warning} label="Queda poco" dot />
        <Legend color={colors.errorLight} label="Ya reservado" />
      </View>
    </View>
  );
}

/** Una casilla de muestra con su significado, debajo del calendario. */
function Legend({
  color, label, dot = false,
}: { color: string; label: string; dot?: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={styles.legendItem}>
      <View style={[dot ? styles.legendDot : styles.legendBox, { backgroundColor: color }]} />
      <CustomTextComponent fontSize={11} color={colors.textSecondary}>{label}</CustomTextComponent>
    </View>
  );
}

/** "3 h", "2 h 30 min", "2 días" — cómo se nombra una duración en las pastillas. */
function durationLabel(minutes: number, unitMinutes: number): string {
  if (unitMinutes >= 24 * 60) {
    const days = minutes / (24 * 60);
    return `${Number.isInteger(days) ? days : days.toFixed(1)} ${days === 1 ? 'día' : 'días'}`;
  }

  const hours = Math.floor(minutes / 60);
  const rest  = Math.round(minutes % 60);
  if (rest === 0) return `${hours} h`;
  return hours === 0 ? `${rest} min` : `${hours} h ${rest} min`;
}

/**
 * Selector de rango para zonas en modo RANGE: dos rejillas de horas, la de fin
 * acotada a lo que permite la zona. Se construye sobre las ventanas abiertas
 * que ya devolvió el backend, así que no replica ninguna regla de negocio: solo
 * impide elegir combinaciones que el servidor rechazaría.
 *
 * El inicio sale de las ventanas del día elegido; el fin, del periodo continuo
 * al que pertenece ese inicio, que puede seguir al día siguiente cuando la zona
 * no cierra en la medianoche.
 */
function RangePicker({
  startWindows, spanWindows, busy, capacity, unitMinutes,
  minMinutes, maxMinutes, startAt, endAt, onChange,
}: {
  startWindows: { startAt: string; endAt: string }[];
  spanWindows: { startAt: string; endAt: string }[];
  busy: AmenityBusyRange[];
  capacity: number;
  /** Escalón de las duraciones: 60 en las zonas por horas, un día en las de jornada. */
  unitMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  startAt: string | null;
  endAt: string | null;
  onChange: (from: string | null, to: string | null) => void;
}) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();

  // Solo estorban los tramos que ya agotaron el cupo: con cuatro asadores, la
  // reserva de otro residente no tapa el de uno.
  const taken = busy.filter(b => b.bookingsCount >= capacity);

  // Todo se compara en milisegundos: las horas de la rejilla se arman en el
  // teléfono y las ocupadas vienen del servidor, y comparar esos dos textos
  // depende de que ambos escriban el ISO igual.
  const ms = (iso: string) => new Date(iso).getTime();

  const isFree = (iso: string) => !taken.some(b => ms(iso) >= ms(b.startAt) && ms(iso) < ms(b.endAt));

  const startOptions = startWindows
    // El último instante de la ventana no sirve como inicio: no cabría nada.
    .flatMap(w => windowSteps(w.startAt, w.endAt).slice(0, -1))
    .filter(isFree);

  // El fin se mide sobre el periodo continuo, no sobre el día: ahí es donde la
  // reserva puede seguir hasta la tarde del domingo.
  const span = startAt
    ? spanWindows.find(w => ms(startAt) >= ms(w.startAt) && ms(startAt) < ms(w.endAt))
    : null;

  // Tres techos, y manda el más cercano: el cierre de la zona, la duración
  // máxima que permite, y la primera reserva ajena que ya ocupa el espacio
  // —de ahí que un salón tomado el sábado se entregue el domingo al mediodía
  // si a esa hora entra otro—.
  const nextTaken = startAt
    ? taken
        .map(b => b.startAt)
        .filter(t => ms(t) > ms(startAt))
        .sort((a, b) => ms(a) - ms(b))[0] ?? null
    : null;

  const ceiling = startAt && span
    ? new Date(Math.min(
        ms(span.endAt),
        ms(startAt) + maxMinutes * 60000,
        ...(nextTaken ? [ms(nextTaken)] : []),
      )).toISOString()
    : null;

  // El residente piensa en "cuánto tiempo lo necesito", no en la hora exacta a
  // la que entrega: con un tope de 24 h la rejilla de horas de fin era un muro
  // de pastillas donde el día se distinguía por un "(+1)" diminuto. Se ofrecen
  // duraciones completas —horas, o jornadas en las zonas que se alquilan por
  // días— y la app calcula la entrega.
  const availableMinutes = startAt && ceiling ? (ms(ceiling) - ms(startAt)) / 60000 : 0;

  const durationOptions: number[] = [];
  for (
    let minutes = Math.ceil(minMinutes / unitMinutes) * unitMinutes;
    minutes <= availableMinutes;
    minutes += unitMinutes
  ) {
    durationOptions.push(minutes);
  }

  // El techo rara vez cae en una hora completa —una zona que cierra a las 23:59,
  // o una reserva ajena que empieza a las 12:15—, así que la última opción es el
  // tiempo exacto que queda: sin ella la zona se devolvería antes de tiempo.
  if (
    availableMinutes >= minMinutes &&
    durationOptions[durationOptions.length - 1] !== availableMinutes
  ) {
    durationOptions.push(availableMinutes);
  }

  const endOf = (minutes: number): string =>
    new Date(ms(startAt as string) + minutes * 60000).toISOString();

  const chosenMinutes = startAt && endAt ? (ms(endAt) - ms(startAt)) / 60000 : null;

  return (
    <View style={{ gap: SPACING.sm }}>
      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
        Desde
      </CustomTextComponent>
      <View style={styles.slotGrid}>
        {startOptions.map(t => {
          const isActive = t === startAt;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.step, { backgroundColor: isActive ? colors.primary : colors.surface }]}
              onPress={() => onChange(t, null)}>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                color={isActive ? colors.textInverse : colors.textPrimary}>
                {stepLabel(t, startWindows[0]?.startAt ?? t)}
              </CustomTextComponent>
            </TouchableOpacity>
          );
        })}
      </View>

      {!!startAt && (
        <>
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
            ¿Por cuánto tiempo?
          </CustomTextComponent>
          {durationOptions.length === 0 ? (
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.error}>
              No cabe una reserva desde esa hora. Elige un inicio más temprano.
            </CustomTextComponent>
          ) : (
            <View style={styles.slotGrid}>
              {durationOptions.map(minutes => {
                const isActive = chosenMinutes === minutes;
                return (
                  <TouchableOpacity
                    key={minutes}
                    style={[styles.step, { backgroundColor: isActive ? colors.primary : colors.surface }]}
                    onPress={() => onChange(startAt, endOf(minutes))}>
                    <CustomTextComponent
                      fontSize={FONT_SIZE.sm}
                      color={isActive ? colors.textInverse : colors.textPrimary}>
                      {durationLabel(minutes, unitMinutes)}
                    </CustomTextComponent>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* La hora de entrega es el dato que hay que ver antes de confirmar:
              una reserva larga cae al día siguiente y "14:00" a secas no lo dice. */}
          <View style={[styles.notice, { backgroundColor: colors.primarySurface }]}>
            <Icon name="event-available" size={16} color={colors.primary} />
            <View style={gs.flex1}>
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary}>
                {`Tomas: ${momentLabel(startAt)}`}
              </CustomTextComponent>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                fontWeight={(endAt ? FONT_WEIGHT.semibold : FONT_WEIGHT.regular) as any}
                color={endAt ? colors.textPrimary : colors.textSecondary}>
                {endAt ? `Entregas: ${momentLabel(endAt)}` : 'Elige por cuánto tiempo la necesitas'}
              </CustomTextComponent>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

/** Etiqueta encima del campo: CustomInputComponent no trae label propio. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.textSecondary}>
        {label}
      </CustomTextComponent>
      {children}
    </View>
  );
}

function Fact({ icon, text }: { icon: string; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.fact}>
      <Icon name={icon} size={16} color={colors.textSecondary} />
      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
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
  facts: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sectionTitle: {
    marginTop: SPACING.xs,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDay: {
    borderRadius: RADIUS.md,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  step: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    minWidth: 68,
    alignItems: 'center',
  },
  slot: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    minWidth: 110,
  },
  field: {
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  primaryBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  calDot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  calLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
});
