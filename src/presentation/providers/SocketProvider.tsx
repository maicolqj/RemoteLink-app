import React, { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { REST_API_URL } from '../../data/lib/constants';
import apolloClientInstance from '../../data/lib/apollo/client';
import { ACTIVE_PANIC_ALERTS } from '../../domain/graphql/panic.queries';
import {
  PanicAlertModal,
  type PanicAlertNewPayload,
  type PanicAlertAcknowledgedPayload,
} from '../components/PanicAlertModal';
import { useAuthStore } from '../store/auth.store';
import { usePanicStore } from '../store/panic.store';
import { useSettingsStore } from '../store/settings.store';
import { useNotificationsStore } from '../store/notifications.store';
import {
  mapSocketNotification,
  type SocketNotificationPayload,
} from '../../infraestructure/services/notifications.service';

interface Props {
  children: React.ReactNode;
}

// Only resurface unacknowledged alerts younger than this on (re)connect —
// older ones are stale (e.g. nobody acked overnight) and shouldn't blare.
const ACTIVE_ALERT_MAX_AGE_MS = 10 * 60 * 1000;

interface ActivePanicAlert {
  id: string;
  complexId: string;
  createdByUserId?: string | null;
  metadata?: { triggeredByLabel?: string } | null;
  createdAt: string;
}

export function SocketProvider({ children }: Props) {
  const resident        = useAuthStore(s => s.resident);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const token           = useAuthStore(s => s.token);

  const panicData        = usePanicStore(s => s.panicData);
  const acknowledgedData = usePanicStore(s => s.acknowledgedData);
  const setPanicData     = usePanicStore(s => s.setPanicData);
  const setAcknowledged  = usePanicStore(s => s.setAcknowledgedData);
  const clearPanic       = usePanicStore(s => s.clearPanic);

  const socketRef       = useRef<Socket | null>(null);
  const panicReceivedAt = useRef(0);

  const handleAcknowledged = useCallback(() => {
    clearPanic();
  }, [clearPanic]);

  const complexId = resident?.complex?.id;
  const userId    = resident?.user?.id;

  useEffect(() => {
    if (!isAuthenticated || !token || !complexId || !userId) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // Narrowed copies — TS narrowing doesn't flow into nested callbacks
    const cid = complexId;
    const uid = userId;

    const socket = io(REST_API_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (__DEV__) console.log('[Socket] connected:', socket.id);
      // The panic socket event is lost if it fired while the app was closed
      // (FCM full-screen launch / cold start). Sync pending alerts on connect.
      syncActivePanicAlerts();
    });

    async function syncActivePanicAlerts() {
      try {
        const { data } = await apolloClientInstance.query<{ activePanicAlerts: ActivePanicAlert[] }>({
          query: ACTIVE_PANIC_ALERTS,
          variables: { complexId: cid },
          fetchPolicy: 'network-only',
        });
        if (!useSettingsStore.getState().panicAlertsEnabled) return;
        const pending = (data?.activePanicAlerts ?? []).find(a =>
          a.createdByUserId !== uid &&
          Date.now() - new Date(a.createdAt).getTime() < ACTIVE_ALERT_MAX_AGE_MS,
        );
        if (!pending) return;
        if (__DEV__) console.log('[Socket] alerta de pánico pendiente al conectar:', pending.id);
        panicReceivedAt.current = Date.now();
        setPanicData({
          complexId:        cid,
          triggeredBy:      pending.createdByUserId ?? '',
          triggeredByLabel: pending.metadata?.triggeredByLabel,
        });
      } catch (err) {
        if (__DEV__) console.warn('[Socket] activePanicAlerts error:', (err as Error)?.message);
      }
    }

    socket.on('connect_error', (err) => {
      if (__DEV__) console.warn('[Socket] connect_error:', err.message);
    });

    socket.on('panic:alert:new', (payload: PanicAlertNewPayload) => {
      if (__DEV__) console.log('[Socket] panic:alert:new', payload);
      if (!useSettingsStore.getState().panicAlertsEnabled) return;
      if (payload.triggeredBy === userId) return;
      if (payload.complexId !== complexId) return;
      panicReceivedAt.current = Date.now();
      setPanicData(payload);
    });

    socket.on('panic:alert:acknowledged', (payload: PanicAlertAcknowledgedPayload) => {
      if (__DEV__) console.log('[Socket] panic:alert:acknowledged', payload);
      if (payload.complexId !== complexId) return;
      // Ignore acknowledgments arriving within 1s of a new panic — backend
      // sometimes broadcasts acknowledged to clear old state before the new alert.
      if (Date.now() - panicReceivedAt.current < 1000) return;
      setAcknowledged(payload);
    });

    // Real-time notifications (charges, payments, WALLET_APPLIED, etc.). Emitted
    // to this user's room, so every payload is already addressed to us; guard the
    // complex anyway. The store dedups against the FCM-foreground copy by UUID.
    socket.on('notification:new', (payload: SocketNotificationPayload) => {
      if (__DEV__) console.log('[Socket] notification:new', payload?.type);
      if (payload.complexId && payload.complexId !== cid) return;
      useNotificationsStore.getState().addNotification(mapSocketNotification(payload));
    });

    return () => {
      socket.off('panic:alert:new');
      socket.off('panic:alert:acknowledged');
      socket.off('notification:new');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, complexId, userId, setPanicData, setAcknowledged]);

  return (
    <>
      {children}
      <PanicAlertModal
        panicData={panicData}
        acknowledgedData={acknowledgedData}
        onAcknowledged={handleAcknowledged}
      />
    </>
  );
}
