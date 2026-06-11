import React, { useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import StatusChip from '../../components/StatusChip';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import { useNotificationsStore } from '../../store/notifications.store';
import { useVisitsStore } from '../../store/visits.store';
import { useFinancesStore } from '../../store/finances.store';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type HomeNavProp = NativeStackNavigationProp<any>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNavProp>();
  const { colors } = useTheme();
  const gs = useGlobalStyles();

  const resident = useAuthStore(s => s.resident);
  const { notifications, unreadCount } = useNotificationsStore();
  const { visits } = useVisitsStore();
  const balanceData = useFinancesStore(s => s.balance);

  const recentNotifications = notifications.slice(0, 3);
  const pendingVisits = visits.filter(v => v.status === 'PENDING_APPROVAL').slice(0, 3);

  const QUICK_ACTIONS = useMemo(() => [
    { id: 'pay',     icon: 'payment',   label: 'Pagar',   tab: 'FinancesTab',    color: colors.primary },
    { id: 'visits',  icon: 'people',    label: 'Visitas', tab: 'VisitsTab',      color: colors.success },
    { id: 'store',   icon: 'store',     label: 'Tienda',  tab: 'MarketplaceTab', color: colors.accent },
    { id: 'profile', icon: 'person',    label: 'Perfil',  tab: 'ProfileTab',     color: colors.info },
  ], [colors]);

  const handleQuickAction = useCallback((tab: string) => {
    navigation.navigate('Main', { screen: tab });
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
            <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="notifications" size={ICON_SIZE.md} color={colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={gs.badgeContainer}>
                  <CustomTextComponent style={gs.badgeText as any}>
                    {unreadCount > 9 ? '9+' : String(unreadCount)}
                  </CustomTextComponent>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Main', { screen: 'ProfileTab' })}>
              <Avatar name={fullName} size="sm" />
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.payBtn} onPress={() => navigation.navigate('Main', { screen: 'FinancesTab' })}>
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
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickAction, { backgroundColor: colors.surface }]}
                onPress={() => handleQuickAction(action.tab)}
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
            <SectionHeader title="Alertas de visitas" actionLabel="Ver todas" onAction={() => navigation.navigate('Main', { screen: 'VisitsTab' })} />
            <View style={styles.sectionContent}>
              {pendingVisits.map(visit => (
                <Card key={visit.id} style={styles.visitCard} onPress={() => navigation.navigate('Main', { screen: 'VisitsTab', params: { screen: 'VisitDetail', params: { visitId: visit.id } } })}>
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

        {recentNotifications.length === 0 && pendingVisits.length === 0 && (
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
