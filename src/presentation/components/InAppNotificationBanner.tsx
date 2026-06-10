import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NotificationActionType, NotificationType } from '../../domain/enums/enums';

// ── Icon / color mapping per notification type ────────────────────────────────

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  [NotificationType.PANIC_ALERT]:         { icon: 'warning',         color: '#EF4444' },
  [NotificationType.VISITOR_WALK_IN]:     { icon: 'directions-walk', color: '#55C2DA' },
  [NotificationType.PACKAGE_RECEIVED]:    { icon: 'inventory-2',     color: '#F59E0B' },
  [NotificationType.PACKAGE_READY]:       { icon: 'inventory-2',     color: '#10B981' },
  [NotificationType.VISIT_APPROVED]:      { icon: 'check-circle',    color: '#10B981' },
  [NotificationType.VISIT_DENIED]:        { icon: 'cancel',          color: '#EF4444' },
  [NotificationType.PAYMENT_DUE]:         { icon: 'payment',         color: '#F59E0B' },
  [NotificationType.PAYMENT_OVERDUE]:     { icon: 'payment',         color: '#EF4444' },
  [NotificationType.SYSTEM_ANNOUNCEMENT]: { icon: 'campaign',        color: '#8B5CF6' },
  [NotificationType.COMPLEX_ALERT]:       { icon: 'apartment',       color: '#3B82F6' },
};

// ── Action button labels per actionType ───────────────────────────────────────

const ACTION_LABELS: Record<string, { confirm: string; cancel?: string }> = {
  [NotificationActionType.VISIT_APPROVAL]:    { confirm: 'Autorizar', cancel: 'Denegar'  },
  [NotificationActionType.RESIDENT_APPROVAL]: { confirm: 'Aprobar',   cancel: 'Rechazar' },
  [NotificationActionType.VEHICLE_APPROVAL]:  { confirm: 'Aprobar',   cancel: 'Rechazar' },
  [NotificationActionType.ACKNOWLEDGE]:       { confirm: 'Reconocer' },
};

const AUTO_DISMISS_MS = 4000;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BannerNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isActionable?: boolean;
  actionType?: string | null;
  entityId?: string | null;
}

interface Props {
  notification: BannerNotification | null;
  onDismiss: () => void;
  onPress?: (n: BannerNotification) => void;
  onAction?: (notificationId: string, action: 'confirm' | 'cancel') => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InAppNotificationBanner({ notification, onDismiss, onPress, onAction }: Props) {
  const translateY = useRef(new Animated.Value(-140)).current;
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(translateY, {
      toValue: -140,
      duration: 250,
      useNativeDriver: true,
    }).start(onDismiss);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -30) {
          dismiss();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!notification) return;

    Animated.spring(translateY, {
      toValue: 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();

    if (!notification.isActionable) {
      timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification?.id]);

  if (!notification) return null;

  const iconCfg   = TYPE_ICON[notification.type] ?? { icon: 'notifications', color: '#55C2DA' };
  const actionCfg = notification.isActionable && notification.actionType
    ? ACTION_LABELS[notification.actionType]
    : null;

  return (
    <Animated.View
      style={[st.container, { transform: [{ translateY }] }]}
      {...panResponder.panHandlers}
    >
      {/* Main row */}
      <TouchableOpacity
        style={st.row}
        activeOpacity={0.88}
        onPress={() => { onPress?.(notification); dismiss(); }}
      >
        <View style={[st.iconWrap, { borderColor: iconCfg.color }]}>
          <Icon name={iconCfg.icon} size={20} color={iconCfg.color} />
        </View>

        <View style={st.textWrap}>
          <Text style={st.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={st.body}  numberOfLines={2}>{notification.body}</Text>
        </View>

        <TouchableOpacity
          style={st.closeBtn}
          onPress={dismiss}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Icon name="close" size={16} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Action buttons (only for actionable notifications) */}
      {actionCfg && (
        <View style={st.actions}>
          {actionCfg.cancel && (
            <TouchableOpacity
              style={[st.actionBtn, st.cancelBtn]}
              onPress={() => { onAction?.(notification.id, 'cancel'); dismiss(); }}
            >
              <Text style={st.cancelText}>{actionCfg.cancel}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[st.actionBtn, st.confirmBtn]}
            onPress={() => { onAction?.(notification.id, 'confirm'); dismiss(); }}
          >
            <Text style={st.confirmText}>{actionCfg.confirm}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Swipe indicator */}
      <View style={st.swipeBar} />
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 12, right: 12,
    zIndex: 9999,
    marginTop: 50,
    backgroundColor: '#0D2347',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  body:  { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 17 },
  closeBtn: { padding: 4, flexShrink: 0 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 2,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn:   { backgroundColor: 'rgba(239,68,68,0.12)',  borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)'  },
  confirmBtn:  { backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  cancelText:  { fontSize: 13, fontWeight: '600', color: '#EF4444' },
  confirmText: { fontSize: 13, fontWeight: '600', color: '#10B981' },
  swipeBar: {
    alignSelf: 'center',
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 6,
  },
});
