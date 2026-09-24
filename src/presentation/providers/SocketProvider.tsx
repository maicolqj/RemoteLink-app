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
import { usePqrfStore } from '../store/pqrf.store';
import { useMaintenanceStore } from '../store/maintenance.store';
import {
  useMarketplaceChatStore,
  type ChatReadEvent,
  type IncomingChatMessage,
} from '../store/marketplace-chat.store';
import { usePetsStore } from '../store/pets.store';
import { useVotingStore } from '../store/voting.store';
import { fetchVotingEnabled } from '../../infraestructure/services/voting.service';
import {
  mapSocketNotification,
  type SocketNotificationPayload,
} from '../../infraestructure/services/notifications.service';
import { clearStalePanicAlert } from '../../infraestructure/services/NotifeeService';

interface Props {
  children: React.ReactNode;
}

// Only resurface unacknowledged alerts younger than this on (re)connect —
// older ones are stale (e.g. nobody acked overnight) and shouldn't blare.
const ACTIVE_ALERT_MAX_AGE_MS = 10 * 60 * 1000;

/** Lo que emite el backend cuando cambia el estado de un radicado. */
interface PqrfUpdatedPayload {
  pqrfId: string;
  code: string;
  status: string;
  complexId: string;
  resolvedAt?: string | null;
}

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
      // Mensajes que llegaron mientras no había socket: el número del ícono del
      // chat se vuelve a pedir en cada conexión.
      void useMarketplaceChatStore.getState().refreshUnread(cid);
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
        if (!pending) {
          // El servidor dice que no queda nada activo. Si este equipo trae una
          // alarma encendida es porque el pánico se resolvió mientras estaba
          // cerrado: el reconocimiento viaja por socket y no llegó a nadie. Esta
          // es la primera oportunidad de enterarse, y también la única —
          // `ongoing` impide que el usuario descarte la notificación él mismo.
          if (!usePanicStore.getState().panicData) void clearStalePanicAlert();
          return;
        }
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

    /**
     * Estado de un radicado PQRF.
     *
     * Llega por dos caminos: a la sala del complejo —donde escuchan la
     * administración y el consejo— y al residente por su canal propio, que no
     * está en esa sala. El store se encarga de que la lista y la ficha se
     * repinten sin que nadie recargue.
     */
    socket.on('pqrf:updated', (payload: PqrfUpdatedPayload) => {
      if (__DEV__) console.log('[Socket] pqrf:updated', payload);
      if (payload.complexId !== cid) return;
      usePqrfStore.getState().applyUpdate(payload);
    });

    /**
     * Estado de un reporte de convivencia.
     *
     * Le llega al residente por el canal de su unidad, no por la sala del
     * complejo —donde solo están la administración y la portería—. Importa que
     * llegue rápido: cuando el reporte pasa a UNDER_DEFENSE empieza a correr el
     * plazo de descargos, y enterarse tarde le cuesta la oportunidad de
     * responder.
     */
    socket.on('pet:incident:updated', (payload: { incidentId: string; status: string }) => {
      if (__DEV__) console.log('[Socket] pet:incident:updated', payload);
      usePetsStore.getState().applyIncidentUpdate(payload);
    });

    /**
     * El SUPER_ADMIN prendió o apagó módulos del conjunto.
     *
     * Llega por la sala del complejo, donde está todo el mundo. Los accesos del
     * inicio se arman con esta lista, así que la pantalla se reacomoda sola: si
     * apagan finanzas, la tarjeta de saldo y el acceso desaparecen sin que el
     * residente tenga que cerrar sesión —y sin que toque una pantalla que el
     * servidor ya no le va a responder—.
     */
    socket.on('complex:modules:updated', (payload: { complexId: string; enabledModules: string[] }) => {
      if (__DEV__) console.log('[Socket] complex:modules:updated', payload);
      if (payload.complexId !== cid) return;
      useAuthStore.getState().setEnabledModules(payload.enabledModules ?? []);
    });

    /**
     * Estado de un ticket de mantenimiento.
     *
     * Llega por la sala del complejo y por el canal de la unidad de quien
     * reportó. Importa en caliente sobre todo al pasar a "reparado": ahí
     * empieza la ventana en la que el residente puede decir que el arreglo no
     * sirvió, y a los pocos días el sistema cierra el ticket solo.
     */
    socket.on('maintenance:ticket:updated', (payload: { ticketId: string; status: string }) => {
      if (__DEV__) console.log('[Socket] maintenance:ticket:updated', payload);
      useMaintenanceStore.getState().applyUpdate(payload);
    });

    /**
     * Chat de clasificados: mensaje nuevo en una conversación mía.
     *
     * Llega por el canal propio de cada participante (nunca por la sala del
     * complejo: el chat es privado). El store sube el número del ícono y le
     * pasa el mensaje a la pantalla del chat si está abierta.
     */
    socket.on('marketplace:chat:message', (payload: IncomingChatMessage) => {
      if (__DEV__) console.log('[Socket] marketplace:chat:message', payload.conversationId);
      useMarketplaceChatStore
        .getState()
        .applyIncoming(payload, useAuthStore.getState().resident?.user?.id);
    });

    /** El otro vecino leyó la conversación: el "visto". */
    socket.on('marketplace:chat:read', (payload: ChatReadEvent) => {
      useMarketplaceChatStore.getState().applyRead(payload);
    });

    /**
     * La administración encendió o apagó las asambleas o las reuniones del
     * consejo (o el SUPER_ADMIN el módulo): el menú del Home aparece o se va
     * sin reiniciar la app, y la pantalla de votaciones que esté abierta
     * recarga.
     *
     * Qué ve cada quien depende de si es del consejo, así que no se decide con
     * los interruptores del aviso: se le vuelve a preguntar al servidor. El
     * mismo aviso puede llegar dos veces (sala del complejo y canal propio), y
     * el repetido no dispara otra consulta.
     */
    let lastAvailability = '';
    socket.on('voting:availability', (payload: {
      complexId: string; moduleEnabled?: boolean; residentsEnabled?: boolean; councilEnabled?: boolean;
    }) => {
      if (__DEV__) console.log('[Socket] voting:availability', payload);
      if (payload.complexId !== cid) return;

      const key = `${payload.moduleEnabled}:${payload.residentsEnabled}:${payload.councilEnabled}`;
      if (key === lastAvailability) return;
      lastAvailability = key;

      fetchVotingEnabled(cid)
        .then(enabled => {
          const votingStore = useVotingStore.getState();
          votingStore.setEnabled(enabled);
          votingStore.bump(`availability:${key}`);
        })
        .catch(err => { if (__DEV__) console.warn('[Socket] votingEnabled error:', err?.message); });
    });

    /**
     * Se abrió o se cerró una pregunta. Los votos sueltos (`change: 'vote'`)
     * se ignoran: en plena asamblea serían cientos de recargas por teléfono.
     */
    socket.on('voting:updated', (payload: { complexId: string; questionId: string; status: string; change?: string }) => {
      if (payload.complexId !== cid || payload.change !== 'status') return;
      useVotingStore.getState().bump(`${payload.questionId}:${payload.status}`);
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
      // Sin alerta en pantalla no hay modal que reaccione al reconocimiento, pero
      // la sirena y la notificación sí pueden estar corriendo: las arrancó el
      // handler de FCM sin que el modal llegara a montarse (rol sin permiso de
      // verlo, opt-out activado después, app recién abierta). Apagarlas aquí es
      // lo que evita que sigan sonando por algo que ya se atendió.
      if (!usePanicStore.getState().panicData) {
        void clearStalePanicAlert();
        return;
      }
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
