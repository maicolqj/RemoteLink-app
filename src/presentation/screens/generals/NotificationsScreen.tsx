import React, { useCallback, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAlert } from '../../providers/context/AlertContext';
import { useNotificationsStore, type Notification } from '../../store/notifications.store';
import { useAuthStore } from '../../store/auth.store';
import { fetchNotificationDetail } from '../../../infraestructure/services/notifications.service';
import type { NotificationEntityType } from '../../../domain/responses/NotificationResponseModel';
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Notifications'>;

// The store id can fall back to the FCM messageId (e.g. "0:1781…%b2b9…") when the
// payload omits the real notificationId. The backend expects a UUID, so guard the
// `notificationDetail` call to avoid a Postgres "invalid input syntax for uuid".
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// Finance notifications carry no entityType — they're identified by their type
// (PAYMENT_*, CHARGE_*, WALLET_*, MORA_*) and route to the account statement.
const FINANCE_TYPE_RE = /(PAYMENT|CHARGE|WALLET|MORA)/i;

// `metadata` arrives as a JSON string over FCM, or as an object from the backend.
function parseMetadata(raw: unknown): Record<string, any> | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'object') return raw as Record<string, any>;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return undefined; }
  }
  return undefined;
}

function NotificationItem({ item, onPress, onLongPress, busy }: { item: Notification; onPress: (item: Notification) => void; onLongPress: (item: Notification) => void; busy: boolean }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();

  const NOTIF_ICON: Record<string, { icon: string; color: string; bg: string }> = {
    visit:   { icon: 'people',        color: colors.info,    bg: colors.infoLight },
    payment: { icon: 'payment',       color: colors.success, bg: colors.successLight },
    alert:   { icon: 'warning',       color: colors.warning, bg: colors.warningLight },
    general: { icon: 'notifications', color: colors.primary, bg: colors.primarySurface },
  };

  const cfg = NOTIF_ICON[item.type] ?? NOTIF_ICON.general;

  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: item.isRead ? colors.surface : colors.primarySurface }]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      delayLongPress={300}
      disabled={busy}
      activeOpacity={0.75}>
      <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
        <Icon name={cfg.icon} size={22} color={cfg.color} />
      </View>
      <View style={gs.flex1}>
        <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary} style={{ marginBottom: 2 }}>
          {item.title}
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} numberOfLines={2} style={styles.body}>
          {item.body}
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
          {new Date(item.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </CustomTextComponent>
      </View>
      {busy
        ? <ActivityIndicator size="small" color={colors.primary} style={styles.trailing} />
        : !item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showInfo, showAlert, hideAlert } = useAlert();
  const {
    notifications, markAsRead, markAllAsRead, unreadCount, removeNotification,
    fetchMoreNotifications, isLoadingMore, hasMore,
  } = useNotificationsStore();

  // id of the notification currently being resolved (shows a spinner on its row)
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Long-press a row to confirm + soft-delete it from the list.
  const handleLongPress = useCallback((item: Notification) => {
    showAlert({
      type: 'question',
      title: 'Eliminar notificación',
      description: '¿Quieres eliminar esta notificación? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', style: 'secondary', onPress: hideAlert },
        { text: 'Eliminar', style: 'danger', onPress: () => { removeNotification(item.id); hideAlert(); } },
      ],
    });
  }, [showAlert, hideAlert, removeNotification]);

  // Route to the entity screen the notification points at. Visits, packages and
  // finances have screens today; anything else just surfaces its content.
  const openEntity = useCallback((args: {
    entityType?: NotificationEntityType;
    entityId?: string;
    type?: string;
    metadata?: Record<string, any>;
    item: Notification;
  }) => {
    const { entityType, entityId, type, metadata, item } = args;

    if (entityType === 'visit' && entityId) {
      navigation.navigate('VisitDetail', { visitId: entityId });
      return;
    }
    if (entityType === 'package' && entityId) {
      navigation.navigate('PackageDetail', { packageId: entityId });
      return;
    }
    if (entityType === 'vehicle' && entityId) {
      navigation.navigate('VehicleDetail', { vehicleId: entityId });
      return;
    }
    if (entityType === 'ACCESS_REQUEST' && entityId) {
      navigation.navigate('AccessRequestDetail', { accessRequestId: entityId });
      return;
    }
    // Finance has no entityType — detect by type token or a unit reference in
    // metadata. The Finances screen self-loads the resident's account statement.
    const isFinance = (type && FINANCE_TYPE_RE.test(type)) || !!metadata?.unitId;
    if (isFinance) {
      navigation.navigate('Finances');
      return;
    }
    showInfo(item.body || 'Sin contenido adicional.', item.title);
  }, [navigation, showInfo]);

  const handlePress = useCallback(async (item: Notification) => {
    if (resolvingId) return;
    markAsRead(item.id);

    // The FCM payload sometimes already carries the entity reference; use it to
    // skip the round-trip, otherwise resolve the full detail from the backend.
    let entityType = item.data?.entityType as NotificationEntityType | undefined;
    let entityId = item.data?.entityId;
    let type = item.data?.type;
    let metadata = parseMetadata(item.data?.metadata);
    const complexId = useAuthStore.getState().resident?.complex?.id;

    // Prefer the explicit notificationId from the payload; only fall back to the
    // store id when it's a real UUID (not an FCM messageId).
    const notificationId = item.data?.notificationId ?? (UUID_RE.test(item.id) ? item.id : undefined);

    if ((!entityType || !entityId) && complexId && notificationId && UUID_RE.test(notificationId)) {
      setResolvingId(item.id);
      try {
        const detail = await fetchNotificationDetail(notificationId, complexId);
        entityType = (detail?.entityType ?? entityType) as NotificationEntityType | undefined;
        entityId = detail?.entityId ?? entityId ?? undefined;
        type = detail?.type ?? type;
        metadata = parseMetadata(detail?.metadata) ?? metadata;
      } catch {
        setResolvingId(null);
        showError('No se pudo abrir la notificación.');
        return;
      }
      setResolvingId(null);
    }

    openEntity({ entityType, entityId, type, metadata, item });
  }, [resolvingId, markAsRead, openEntity, showError]);

  return (
    <View style={gs.screen}>
      <AppHeader
        title="Notificaciones"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={unreadCount > 0 ? { icon: 'done-all', onPress: markAllAsRead } : undefined}
      />
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <NotificationItem item={item} onPress={handlePress} onLongPress={handleLongPress} busy={resolvingId === item.id} />}
        contentContainerStyle={notifications.length === 0 ? gs.flex1 : styles.list}
        ListEmptyComponent={<EmptyState icon="notifications-none" title="Sin notificaciones" description="Aquí verás tus alertas y mensajes del conjunto." />}
        ItemSeparatorComponent={() => <View style={gs.divider} />}
        onEndReached={() => { if (hasMore) fetchMoreNotifications(); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={isLoadingMore ? <ActivityIndicator size="small" color={colors.primary} style={styles.footer} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: SPACING.xxl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    lineHeight: FONT_SIZE.sm * 1.4,
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  trailing: {
    marginTop: 4,
  },
  footer: {
    paddingVertical: SPACING.md,
  },
});
