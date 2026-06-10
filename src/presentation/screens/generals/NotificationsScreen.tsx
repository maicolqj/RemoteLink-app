import React, { useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useNotificationsStore, type Notification } from '../../store/notifications.store';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

function NotificationItem({ item, onPress }: { item: Notification; onPress: (id: string) => void }) {
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
      onPress={() => onPress(item.id)}
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
      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotificationsStore();

  const handlePress = useCallback((id: string) => { markAsRead(id); }, [markAsRead]);

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
        renderItem={({ item }) => <NotificationItem item={item} onPress={handlePress} />}
        contentContainerStyle={notifications.length === 0 ? gs.flex1 : styles.list}
        ListEmptyComponent={<EmptyState icon="notifications-none" title="Sin notificaciones" description="Aquí verás tus alertas y mensajes del conjunto." />}
        ItemSeparatorComponent={() => <View style={gs.divider} />}
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
});
