import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import { usePqrfStore } from '../../store/pqrf.store';
import type { Pqrf } from '../../../domain/responses/PqrfResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  PQRF_ADDRESSEE_LABEL, PQRF_STATUS_LABEL, PQRF_STATUS_TONE, PQRF_TYPE_LABEL,
  pqrfDueLabel, pqrfUnitLabel, pqrfWhen,
} from './pqrf.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Pqrf'>;

/**
 * Radicados del residente y, para quien es del consejo, los que le dirigieron.
 *
 * Son dos bandejas y no una lista sola porque son dos papeles distintos: como
 * residente uno hace seguimiento a lo suyo, y como consejero lee lo que la
 * copropiedad le mandó. Mezclarlas haría imposible saber cuál es cuál.
 */
export default function PqrfScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError } = useAlert();

  const resident = useAuthStore(state => state.resident);
  const complexId = resident?.complex?.id;
  const isCouncil = !!resident?.isCouncilMember;

  const [tab, setTab] = useState<'mine' | 'inbox'>('mine');

  // Las listas viven en el store porque el estado de un radicado cambia por
  // fuera: cuando otro destinatario lo abre o lo resuelve, el aviso llega por
  // socket y esta pantalla tiene que reflejarlo sin recargar.
  const mine = usePqrfStore(state => state.mine);
  const inbox = usePqrfStore(state => state.inbox);
  const isLoading = usePqrfStore(state => state.isLoading);
  const loadPqrf = usePqrfStore(state => state.load);

  const load = useCallback(async () => {
    if (!complexId) return;
    try {
      await loadPqrf(complexId, isCouncil);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudieron cargar los radicados.');
    }
  }, [complexId, isCouncil, loadPqrf, showError]);

  useEffect(() => { load(); }, [load]);

  const items = tab === 'mine' ? mine : inbox;

  const emptyNote = useMemo(() => (
    tab === 'mine'
      ? 'Todavía no has radicado nada. Con el botón de abajo envías una petición, queja, reclamo o felicitación.'
      : 'El consejo no tiene radicados dirigidos a él por ahora.'
  ), [tab]);

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="PQRF" showBack onBack={() => navigation.goBack()} />

      {/* Solo el consejero ve dos bandejas: para el resto no hay nada que elegir. */}
      {isCouncil && (
        <View style={styles.tabs}>
          {([
            ['mine',  'Mis radicados'],
            ['inbox', 'Dirigidos al consejo'],
          ] as const).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => setTab(value)}
              style={[
                styles.tab,
                { backgroundColor: tab === value ? colors.primary : colors.surface },
              ]}>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                fontWeight={FONT_WEIGHT.medium as any}
                color={tab === value ? colors.textInverse : colors.textSecondary}>
                {label}
              </CustomTextComponent>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* El botón vive en el flujo y no flotando abajo a la derecha: ahí está
          el botón de pánico, que es fijo en todas las pantallas y no se puede
          tapar ni disputarle el pulgar. */}
      <TouchableOpacity
        style={[styles.newButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('PqrfCreate')}>
        <Icon name="add" size={20} color={colors.textInverse} />
        <CustomTextComponent
          fontSize={FONT_SIZE.md}
          fontWeight={FONT_WEIGHT.semibold as any}
          color={colors.textInverse}>
          Nuevo radicado
        </CustomTextComponent>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} colors={[colors.primary]} />
        }>

        {isLoading && items.length === 0 ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              {emptyNote}
            </CustomTextComponent>
          </View>
        ) : (
          items.map(item => (
            <PqrfCard
              key={item.id}
              pqrf={item}
              showAuthor={tab === 'inbox'}
              onPress={() => navigation.navigate('PqrfDetail', { pqrfId: item.id })}
            />
          ))
        )}
      </ScrollView>

    </View>
  );
}

/** Una tarjeta por radicado: número, estado, a quién fue y de qué se trata. */
function PqrfCard({
  pqrf, showAuthor, onPress,
}: { pqrf: Pqrf; showAuthor: boolean; onPress: () => void }) {
  const { colors } = useTheme();

  const tone = PQRF_STATUS_TONE[String(pqrf.status)] ?? 'muted';
  const toneColor = tone === 'success' ? colors.success
    : tone === 'warning' ? colors.warning
      : tone === 'info' ? colors.primary
        : colors.textTertiary;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHead}>
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
          {pqrf.code} · {PQRF_TYPE_LABEL[String(pqrf.type)] ?? 'Radicado'}
        </CustomTextComponent>
        <View style={[styles.badge, { backgroundColor: toneColor }]}>
          <CustomTextComponent fontSize={11} color={colors.textInverse}>
            {PQRF_STATUS_LABEL[String(pqrf.status)] ?? pqrf.status}
          </CustomTextComponent>
        </View>
      </View>

      <CustomTextComponent
        fontSize={FONT_SIZE.md}
        fontWeight={FONT_WEIGHT.semibold as any}
        color={colors.textPrimary}>
        {pqrf.subject}
      </CustomTextComponent>

      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} numberOfLines={3}>
        {pqrf.description}
      </CustomTextComponent>

      <View style={styles.cardFoot}>
        <Icon name="send" size={13} color={colors.textTertiary} />
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textTertiary}>
          {PQRF_ADDRESSEE_LABEL[String(pqrf.addressee)] ?? pqrf.addressee} · {pqrfWhen(pqrf.createdAt)}
          {showAuthor && pqrf.requestedByName ? ` · ${pqrf.requestedByName}` : ''}
          {showAuthor && pqrf.unit?.number ? ` (${pqrfUnitLabel(pqrf.unit)})` : ''}
        </CustomTextComponent>
        <Icon name="chevron-right" size={16} color={colors.textTertiary} />
      </View>

      {String(pqrf.status) !== 'RESUELTO' && (
        <CustomTextComponent fontSize={11} color={colors.warning}>
          {pqrfDueLabel(pqrf.dueAt)}
        </CustomTextComponent>
      )}

      {pqrf.resolvedBySilence && (
        <CustomTextComponent fontSize={11} color={colors.warning}>
          Resuelto por silencio administrativo positivo
        </CustomTextComponent>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  content: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl * 2,
    gap: SPACING.sm,
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
});
