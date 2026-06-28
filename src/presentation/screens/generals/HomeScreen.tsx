import React, { useCallback, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@apollo/client/react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import StatusChip from '../../components/StatusChip';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import { useCoachmark, useCoachmarkTarget, type CoachStep } from '../../providers/context/CoachmarkContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { REQUEST_SECURITY_CALL } from '../../../domain/graphql/security.mutations';
import { useAuthStore } from '../../store/auth.store';
import { useNotificationsStore } from '../../store/notifications.store';
import { useVisitsStore } from '../../store/visits.store';
import { usePackagesStore } from '../../store/packages.store';
import { useFinancesStore } from '../../store/finances.store';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

const { width: wp, height: hp } = Dimensions.get('screen');
type HomeNavProp = NativeStackNavigationProp<any>;

// First-run walkthrough. Bump the persistKey suffix to re-show it to everyone.
const HOME_TOUR_STEPS: CoachStep[] = [
  {
    targetId: 'home.securityCall',
    title: 'Llamar a portería',
    text: 'Toca aquí para pedirle a seguridad que se comunique con tu unidad.',
    radius: RADIUS.full,
  },
  {
    targetId: 'home.notifications',
    title: 'Notificaciones',
    text: 'Avisos de visitas, paquetes y pagos. El número rojo indica cuántos sin leer.',
    radius: RADIUS.full,
  },
  {
    targetId: 'home.balance',
    title: 'Tu saldo',
    text: 'Consulta cuánto debes y entra a Finanzas para ver el detalle y pagar.',
  },
  {
    targetId: 'home.quickActions',
    title: 'Acciones rápidas',
    text: 'Accede a tus paquetes y visitas sin buscar en los menús.',
  },
  {
    targetId: 'home.panic',
    title: 'Botón de pánico',
    text: 'En una emergencia, mantén presionado este botón unos segundos para enviar una alerta inmediata a portería y seguridad de tu conjunto.',
    radius: RADIUS.full,
    placement: 'top',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNavProp>();
  const { colors } = useTheme();
  const { showAlert, showSuccess, showError } = useAlert();
  const gs = useGlobalStyles();

  const resident = useAuthStore(s => s.resident);
  const { notifications, unreadCount, fetchNotifications } = useNotificationsStore();
  const { visits, fetchVisits } = useVisitsStore();
  const { packages, fetchPackages } = usePackagesStore();
  const balanceData = useFinancesStore(s => s.balance);
  const fetchBalance = useFinancesStore(s => s.fetchBalance);

  const [requestSecurityCall, { loading: requestingCall }] = useMutation(REQUEST_SECURITY_CALL);

  // First-run walkthrough targets + trigger.
  const { startTour } = useCoachmark();
  const securityCallRef = useCoachmarkTarget('home.securityCall');
  const notificationsRef = useCoachmarkTarget('home.notifications');
  const balanceRef = useCoachmarkTarget('home.balance');
  const quickActionsRef = useCoachmarkTarget('home.quickActions');

  // Ask the gatehouse to call this unit. Backend resolves the unit from the
  // authenticated user and fans out push + socket to the SECURITY role.
  const handleRequestSecurityCall = useCallback(() => {
    const complexId = resident?.complex?.id;
    if (!complexId || requestingCall) return;
    showAlert({
      type: 'question',
      title: 'Solicitar llamada de portería',
      description: '¿Pedir a seguridad que se comunique con tu unidad?',
      buttons: [
        { text: 'Cancelar', style: 'text', onPress: () => {} },
        {
          text: 'Solicitar',
          style: 'primary',
          onPress: async () => {
            try {
              const { data } = await requestSecurityCall({ variables: { complexId } });
              const res = (data as any)?.requestSecurityCall;
              if (res?.success === false) {
                showError(res.message ?? 'No hay personal de seguridad disponible en este momento.');
                return;
              }
              showSuccess('Portería recibió tu solicitud y te llamará en breve.', 'Solicitud enviada');
            } catch (err) {
              if (__DEV__) console.warn('[Home] requestSecurityCall error:', err);
              showError('No se pudo enviar la solicitud. Intenta de nuevo.');
            }
          },
        },
      ],
    });
  }, [resident, requestingCall, requestSecurityCall, showAlert, showSuccess, showError]);

  // Resident hydrates asynchronously after the screen mounts, and every fetch
  // below needs it (balance needs unit/complex ids; notifications self-guard on
  // resident). Key the effect on the resident ids so it re-runs once the session
  // is ready — otherwise the first cold open fires while resident is still null,
  // leaving the balance empty and the notification list unrefreshed after restart.
  const unitId = resident?.unit?.id;
  const complexId = resident?.complex?.id;

  useEffect(() => {
    fetchPackages();
    fetchVisits();
    fetchNotifications();
    if (unitId && complexId) fetchBalance(unitId, complexId);
  }, [unitId, complexId, fetchPackages, fetchVisits, fetchNotifications, fetchBalance]);

  // Kick off the walkthrough when Home gains focus. startTour self-guards on the
  // persistKey, so it shows only on the first open — unless "Ver tutorial" in
  // Ajustes clears the flag, in which case it replays on the next focus.
  useFocusEffect(
    useCallback(() => {
      if (!resident) return;
      const t = setTimeout(() => startTour(HOME_TOUR_STEPS, { persistKey: 'home_v2' }), 700);
      return () => clearTimeout(t);
    }, [resident, startTour]),
  );

  const recentNotifications = notifications.slice(0, 3);
  const pendingVisits = visits.filter(v => v.status === 'PENDING_APPROVAL').slice(0, 3);
  // The store already holds only pending packages (resident endpoint), but keep
  // the status guard so a future "all packages" source still surfaces pending.
  const pendingPackages = packages.filter(p => p.status === 'RECEIVED' || p.status === 'NOTIFIED' || p.status === 'READY_FOR_PICKUP').slice(0, 3);

  const QUICK_ACTIONS = useMemo(() => [
    // Packages tab/flow lives in HomeStack; navigate to the local 'Packages' screen.
    { id: 'packages', icon: 'inventory-2', label: 'Paquetes', screen: 'Packages',     color: colors.primary },
    // Visits tab is disabled; the flow lives in HomeStack, so navigate to the
    // local 'Visits' screen instead of a tab.
    { id: 'visits',  icon: 'people',    label: 'Visitas', screen: 'Visits',      color: colors.success },
    // Comentado temporalmente — pendiente para actualizaciones futuras.
    // { id: 'store',   icon: 'store',     label: 'Tienda',  tab: 'MarketplaceTab', color: colors.accent },
    // { id: 'profile', icon: 'person',    label: 'Perfil',  tab: 'ProfileTab',     color: colors.info },
  ], [colors]);

  const handleQuickAction = useCallback((action: { tab?: string; screen?: string }) => {
    if (action.screen) {
      navigation.navigate(action.screen);
      return;
    }
    navigation.navigate('Main', { screen: action.tab });
  }, [navigation]);

  const fullName = resident ? `${resident.user.name} ${resident.user.lastName}` : '';

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={gs.rowBetween}>
          <View style={gs.flex1}>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              {greeting()},
            </CustomTextComponent>
            <CustomTextComponent fontSize={FONT_SIZE.xxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary}>
              {resident?.user.name ?? ''}
            </CustomTextComponent>
          </View>
          <View style={gs.row}>
            <TouchableOpacity
              ref={securityCallRef}
              style={[styles.callBtn, { backgroundColor: colors.primarySurface }]}
              onPress={handleRequestSecurityCall}
              disabled={requestingCall}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Solicitar que portería llame a tu unidad">
              <Icon name="support-agent" size={ICON_SIZE.md} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity ref={notificationsRef} style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="notifications" size={ICON_SIZE.md} color={colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={gs.badgeContainer}>
                  <CustomTextComponent style={gs.badgeText as any}>
                    {unreadCount > 9 ? '9+' : String(unreadCount)}
                  </CustomTextComponent>
                </View>
              )}
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Main', { screen: 'ProfileTab' })}>
              <Avatar name={fullName} size="sm" />
            </TouchableOpacity> */}
          </View>
        </View>
        <View style={styles.unitBadge}>
          <Icon name="home" size={14} color={colors.primary} />
          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.medium as any} color={colors.primary}>
            {resident?.unit.building.name} · Apto {resident?.unit.number}
          </CustomTextComponent>
        </View>
      </View>

      <ScrollView style={gs.flex1} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Balance Card */}
        <Card elevated style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <View style={gs.rowBetween}>
            <View>
              <CustomTextComponent fontSize={FONT_SIZE.sm} color="rgba(255,255,255,0.75)" style={{ marginBottom: SPACING.xs }}>
                Saldo pendiente
              </CustomTextComponent>
              <CustomTextComponent fontSize={FONT_SIZE.xxxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textInverse}>
                ${(balanceData?.totalDebt ?? 0).toLocaleString('es-CO')}
              </CustomTextComponent>
            </View>
            <TouchableOpacity ref={balanceRef} style={styles.payBtn} onPress={() => navigation.navigate('Finances')}>
              <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.textInverse}>
                Ver finanzas
              </CustomTextComponent>
              <Icon name="arrow-forward" size={16} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <SectionHeader title="Acciones rápidas" />
          <View ref={quickActionsRef} collapsable={false} style={styles.quickActions}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickAction, { backgroundColor: colors.surface }]}
                onPress={() => handleQuickAction(action)}
                activeOpacity={0.75}>
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '18' }]}>
                  <Icon name={action.icon} size={26} color={action.color} />
                </View>
                <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                  {action.label}
                </CustomTextComponent>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pending Visits */}
        {pendingVisits.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Alertas de visitas" actionLabel="Ver todas" onAction={() => navigation.navigate('Visits')} />
            <View style={styles.sectionContent}>
              {pendingVisits.map(visit => (
                <Card key={visit.id} style={styles.visitCard} onPress={() => navigation.navigate('VisitDetail', { visitId: visit.id })}>
                  <View style={gs.row}>
                    <View style={[styles.visitIcon, { backgroundColor: colors.warningLight }]}>
                      <Icon name="person-pin" size={22} color={colors.warning} />
                    </View>
                    <View style={gs.flex1}>
                      <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary} style={{ marginBottom: 2 }}>
                        {visit.visitor.fullName}
                      </CustomTextComponent>
                      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                        {new Date(visit.expectedArrivalAt ?? visit.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </CustomTextComponent>
                    </View>
                    <StatusChip label="Pendiente" variant="warning" />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Pending Packages */}
        {pendingPackages.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Paquetes por recoger" actionLabel="Ver todos" onAction={() => navigation.navigate('Packages')} />
            <View style={styles.sectionContent}>
              {pendingPackages.map(pkg => (
                <Card key={pkg.id} style={styles.visitCard} onPress={() => navigation.navigate('PackageDetail', { packageId: pkg.id })}>
                  <View style={gs.row}>
                    <View style={[styles.visitIcon, { backgroundColor: colors.primarySurface }]}>
                      <Icon name="inventory-2" size={22} color={colors.primary} />
                    </View>
                    <View style={gs.flex1}>
                      <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary} numberOfLines={1} style={{ marginBottom: 2 }}>
                        {pkg.description || pkg.trackingCode || 'Paquete'}
                      </CustomTextComponent>
                      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} numberOfLines={1}>
                        {pkg.senderName ?? 'Listo en portería'}
                      </CustomTextComponent>
                    </View>
                    <StatusChip label={pkg.status === 'DELIVERED' ? 'Entregado' : 'Por recoger'} variant="info" />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Recent Notifications */}
        {recentNotifications.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Últimas notificaciones" actionLabel="Ver todas" onAction={() => navigation.navigate('Notifications')} />
            <View style={styles.sectionContent}>
              {recentNotifications.map(notif => (
                <Card key={notif.id} style={styles.notifCard}>
                  <View style={gs.row}>
                    <View style={[styles.notifDot, { backgroundColor: notif.isRead ? colors.border : colors.primary }]} />
                    <View style={gs.flex1}>
                      <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary} style={{ marginBottom: 2 }}>
                        {notif.title}
                      </CustomTextComponent>
                      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} numberOfLines={1}>
                        {notif.body}
                      </CustomTextComponent>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {recentNotifications.length === 0 && pendingVisits.length === 0 && pendingPackages.length === 0 && (
          <Card style={styles.emptyCard}>
            <View style={gs.center}>
              <Icon name="check-circle" size={40} color={colors.success} />
              <CustomTextComponent fontSize={FONT_SIZE.lg} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary} style={{ marginTop: SPACING.sm }}>
                Todo al día
              </CustomTextComponent>
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} textAlign="center" style={{ marginTop: SPACING.xs }}>
                No tienes pendientes por ahora.
              </CustomTextComponent>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  unitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: 4,
  },
  callBtn: {
    marginRight: SPACING.sm,
    // padding: SPACING.xs,
    height: 36,
    width: wp * 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
  },
  notifBtn: {
    position: 'relative',
    marginRight: SPACING.sm,
    padding: SPACING.xs,
  },
  avatarBtn: {
    padding: 2,
  },
  scroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  balanceCard: {
    marginBottom: SPACING.lg,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  section: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionContent: {
    gap: SPACING.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  visitCard: {
    padding: SPACING.sm,
  },
  visitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  notifCard: {
    padding: SPACING.sm,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  emptyCard: {
    paddingVertical: SPACING.xl,
  },
});
