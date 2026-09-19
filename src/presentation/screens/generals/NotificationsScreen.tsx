import React, { useCallback } from 'react';
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
import type { HomeStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { useOpenNotification } from '../../hooks/useOpenNotification';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Notifications'>;

function NotificationItem({ item, onPress, onDelete, busy }: { item: Notification; onPress: (item: Notification) => void; onDelete: (item: Notification) => void; busy: boolean }) {
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
      onLongPress={() => onDelete(item)}
      delayLongPress={300}
      disabled={busy}
      activeOpacity={0.75}>
      <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
        <Icon name={cfg.icon} size={22} color={cfg.color} />
      </View>
      <View style={gs.flex1}>
        <View style={styles.titleRow}>
          {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
          <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary} style={gs.flex1}>
            {item.title}
          </CustomTextComponent>
        </View>
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} numberOfLines={2} style={styles.body}>
          {item.body}
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
          {new Date(item.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </CustomTextComponent>
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.trailingBtn} />
      ) : (
        <TouchableOpacity
          onPress={() => onDelete(item)}
          disabled={busy}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.trailingBtn}
          accessibilityLabel="Eliminar notificación"
          accessibilityRole="button">
          <Icon name="delete-outline" size={22} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError, showAlert, hideAlert } = useAlert();
  const {
    notifications, markAllAsRead, unreadCount, removeNotification,
    removeAllNotifications, isDeletingAll, fetchMoreNotifications, isLoadingMore, hasMore,
  } = useNotificationsStore();

  // A dónde lleva cada aviso lo decide el hook compartido con el inicio.
  const { openNotification: handlePress, resolvingId } = useOpenNotification();

  // Tap the trash icon (or long-press the row) to confirm + soft-delete it.
  const handleDelete = useCallback((item: Notification) => {
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

  // Header trash icon: confirm + wipe the whole history (pages through the rest
  // of the backend list first — see removeAllNotifications in the store).
  const handleDeleteAll = useCallback(() => {
    if (isDeletingAll) return;
    showAlert({
      type: 'question',
      title: 'Eliminar todas las notificaciones',
      description: '¿Quieres eliminar todas tus notificaciones? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', style: 'secondary', onPress: hideAlert },
        {
          text: 'Eliminar todas',
          style: 'danger',
          onPress: () => {
            hideAlert();
            removeAllNotifications().catch(() => showError('No se pudieron eliminar todas las notificaciones.'));
          },
        },
      ],
    });
  }, [showAlert, hideAlert, removeAllNotifications, isDeletingAll, showError]);

  const headerActions = [
    ...(unreadCount > 0
      ? [{ icon: 'done-all', onPress: markAllAsRead, accessibilityLabel: 'Marcar todas como leídas' }]
      : []),
    ...(notifications.length > 0
      ? [{ icon: 'delete-sweep', onPress: handleDeleteAll, accessibilityLabel: 'Eliminar todas las notificaciones' }]
      : []),
  ];

  return (
    <View style={gs.screen}>
      <AppHeader
        title="Notificaciones"
        showBack
        onBack={() => navigation.goBack()}
        rightActions={headerActions}
      />
      {isDeletingAll && (
        <View style={[styles.deletingOverlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: SPACING.xs }}>
            Eliminando notificaciones…
          </CustomTextComponent>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <NotificationItem item={item} onPress={handlePress} onDelete={handleDelete} busy={resolvingId === item.id} />}
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
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  body: {
    lineHeight: FONT_SIZE.sm * 1.4,
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trailingBtn: {
    padding: SPACING.xs,
    alignSelf: 'center',
  },
  footer: {
    paddingVertical: SPACING.md,
  },
});
