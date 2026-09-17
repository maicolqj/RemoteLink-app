import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
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
import { useMaintenanceStore } from '../../store/maintenance.store';
import type { MaintenanceTicket } from '../../../domain/responses/MaintenanceResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import {
  MAINTENANCE_CATEGORY_ICON,
  MAINTENANCE_CATEGORY_LABEL,
  MAINTENANCE_STATUS_LABEL,
  MAINTENANCE_STATUS_VARIANT,
  isOpenTicket,
  isOverdue,
  locationLabel,
  timeAgo,
} from './maintenance.shared';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Maintenance'>;

/**
 * Daños en zonas comunes.
 *
 * Se abre en "Del conjunto" y no en "Mis reportes" a propósito: lo primero que
 * tiene que ver quien llega es que la lámpara del sótano YA está reportada y en
 * qué va. Esa pestaña es lo que evita el reporte número treinta del mismo
 * ascensor, y de paso le muestra al residente que la administración sí hace
 * algo con lo que le llega.
 */
export default function MaintenanceScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError } = useAlert();

  const resident = useAuthStore(state => state.resident);
  const complexId = resident?.complex?.id;
  const userId = resident?.user?.id;

  const [tab, setTab] = useState<'complex' | 'mine'>('complex');

  const tickets = useMaintenanceStore(state => state.tickets);
  const isLoading = useMaintenanceStore(state => state.isLoading);
  const loadTickets = useMaintenanceStore(state => state.load);

  const load = useCallback(async () => {
    if (!complexId) return;
    try {
      await loadTickets(complexId);
    } catch (e: any) {
      showError(e?.message ?? 'No se pudieron cargar los reportes.');
    }
  }, [complexId, loadTickets, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const mine = useMemo(
    () => tickets.filter(ticket => ticket.reportedByUserId === userId),
    [tickets, userId],
  );

  /**
   * Lo reparado que espera confirmación va primero: es lo único de esta
   * pantalla donde el residente tiene algo que hacer, y si no lo hace el
   * sistema cierra el ticket solo a los pocos días.
   */
  const pendingRating = useMemo(
    () => mine.filter(ticket => ticket.status === 'RESOLVED'),
    [mine],
  );

  const list = tab === 'mine' ? mine : tickets.filter(isOpenTicket);
  const isEmpty = !isLoading && list.length === 0;

  const renderTicket = (ticket: MaintenanceTicket) => {
    const overdue = isOverdue(ticket);

    return (
      <Card
        key={ticket.id}
        onPress={() =>
          navigation.navigate('MaintenanceDetail', { ticketId: ticket.id })
        }>
        <View style={styles.ticketRow}>
          <View
            style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
            <Icon
              name={MAINTENANCE_CATEGORY_ICON[ticket.category] ?? 'build'}
              size={20}
              color={colors.primary}
            />
          </View>

          <View style={gs.flex1}>
            <View style={gs.rowBetween}>
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                color={colors.textTertiary}>
                {ticket.code}
              </CustomTextComponent>
              <StatusChip
                label={MAINTENANCE_STATUS_LABEL[ticket.status] ?? ticket.status}
                variant={MAINTENANCE_STATUS_VARIANT[ticket.status] ?? 'neutral'}
              />
            </View>

            <CustomTextComponent
              fontSize={FONT_SIZE.md}
              fontWeight={FONT_WEIGHT.medium as any}
              color={colors.textPrimary}>
              {ticket.title}
            </CustomTextComponent>

            <CustomTextComponent
              fontSize={FONT_SIZE.sm}
              color={colors.textSecondary}>
              {MAINTENANCE_CATEGORY_LABEL[ticket.category] ?? ticket.category} ·{' '}
              {locationLabel(ticket)}
            </CustomTextComponent>

            <View style={styles.metaRow}>
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                color={colors.textTertiary}>
                {timeAgo(ticket.createdAt)}
              </CustomTextComponent>

              {ticket.endorsementCount > 0 && (
                <View style={styles.metaItem}>
                  <Icon name="group" size={12} color={colors.textTertiary} />
                  <CustomTextComponent
                    fontSize={FONT_SIZE.xs}
                    color={colors.textTertiary}>
                    {ticket.endorsementCount + 1} vecinos
                  </CustomTextComponent>
                </View>
              )}

              {/* Vencido solo mientras siga abierto: en rojo para siempre deja
                  de significar algo. */}
              {overdue && (
                <View style={styles.metaItem}>
                  <Icon name="schedule" size={12} color={colors.error} />
                  <CustomTextComponent
                    fontSize={FONT_SIZE.xs}
                    color={colors.error}>
                    Fuera de plazo
                  </CustomTextComponent>
                </View>
              )}
            </View>
          </View>

          {!!ticket.photoUrls?.length && (
            <Image
              source={{ uri: ticket.photoUrls[0] }}
              style={styles.thumb}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader
        title="Mantenimiento"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.tabs}>
        {(
          [
            ['complex', 'Del conjunto'],
            ['mine', 'Mis reportes'],
          ] as const
        ).map(([value, label]) => (
          <TouchableOpacity
            key={value}
            onPress={() => setTab(value)}
            style={[
              styles.tab,
              {
                backgroundColor:
                  tab === value ? colors.primary : colors.surface,
              },
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
        contentContainerStyle={[
          styles.content,
          isEmpty && styles.contentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={load}
            colors={[colors.primary]}
          />
        }>
        {pendingRating.length > 0 && (
          <Card
            onPress={() =>
              navigation.navigate('MaintenanceDetail', {
                ticketId: pendingRating[0].id,
              })
            }
            style={{ backgroundColor: colors.successLight }}>
            <View style={styles.noticeRow}>
              <Icon name="task-alt" size={18} color={colors.success} />
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                color={colors.textPrimary}
                style={gs.flex1}>
                {pendingRating.length === 1
                  ? `${pendingRating[0].code} quedó reparado. Revisa el trabajo y confirma si quedó bien.`
                  : `Tienes ${pendingRating.length} reparaciones por confirmar.`}
              </CustomTextComponent>
            </View>
          </Card>
        )}

        {isLoading && tickets.length === 0 ? (
          <LoadingSpinner />
        ) : isEmpty ? (
          <EmptyState
            icon="build"
            title={
              tab === 'mine'
                ? 'No has reportado nada'
                : 'Sin daños reportados'
            }
            description={
              tab === 'mine'
                ? 'Cuando reportes una lámpara fundida o una filtración, el seguimiento queda aquí.'
                : 'Nadie ha reportado daños en zonas comunes. Si ves uno, repórtalo.'
            }
            actionLabel="Reportar un daño"
            onAction={() => navigation.navigate('MaintenanceReport')}
          />
        ) : (
          list.map(renderTicket)
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + SPACING.md,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}>
        <Button
          label="Reportar un daño"
          icon="add-a-photo"
          onPress={() => navigation.navigate('MaintenanceReport')}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  contentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
});
