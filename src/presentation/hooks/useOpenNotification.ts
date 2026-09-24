import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAlert } from '../providers/context/AlertContext';
import { useNotificationsStore, type Notification } from '../store/notifications.store';
import { useAuthStore } from '../store/auth.store';
import { fetchNotificationDetail } from '../../infraestructure/services/notifications.service';
import type { NotificationEntityType } from '../../domain/responses/NotificationResponseModel';
import type { HomeStackParamList } from '../navigation/types/NavigationTypes';
import { SCREEN_MODULE, moduleLabel } from '../constants/modules';

// The store id can fall back to the FCM messageId (e.g. "0:1781…%b2b9…") when the
// payload omits the real notificationId. The backend expects a UUID, so guard the
// `notificationDetail` call to avoid a Postgres "invalid input syntax for uuid".
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// Finance notifications carry no entityType — they're identified by their type
// (PAYMENT_*, CHARGE_*, WALLET_*, MORA_*) and route to the account statement.
const FINANCE_TYPE_RE = /(PAYMENT|CHARGE|WALLET|MORA)/i;

/**
 * Abre la pantalla del evento al que apunta una notificación.
 *
 * Lo usan la bandeja de Notificaciones y las "Últimas notificaciones" del
 * inicio: si cada una decidiera por su cuenta a dónde lleva un aviso, tarde o
 * temprano la misma notificación abriría cosas distintas según desde dónde se
 * toque.
 *
 * `resolvingId` es el aviso que se está resolviendo contra el backend (para
 * mostrar un indicador en su fila).
 */
export function useOpenNotification() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { showError, showInfo } = useAlert();
  const markAsRead = useNotificationsStore(state => state.markAsRead);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  /**
   * Navega solo si el conjunto tiene encendido el módulo de esa pantalla.
   *
   * Un aviso viejo sobrevive al apagado del módulo: queda en la bandeja y en la
   * bandeja del sistema. Tocarlo llevaría a una pantalla que el servidor va a
   * rechazar, así que acá se corta el paso y se dice por qué —desaparecer el
   * aviso sería peor: el residente recuerda haberlo recibido—.
   */
  const go = useCallback((screen: keyof HomeStackParamList, params?: object) => {
    const module = SCREEN_MODULE[screen as string];
    if (module && !useAuthStore.getState().isModuleEnabled(module)) {
      showInfo(
        `La administración desactivó ${moduleLabel(module)} en tu conjunto, así que este aviso ya no tiene a dónde llevarte.`,
        'Módulo no disponible',
      );
      return;
    }
    (navigation.navigate as (s: string, p?: object) => void)(screen as string, params);
  }, [navigation, showInfo]);

  // Route to the entity screen the notification points at. Anything without a
  // screen just surfaces its content.
  const openEntity = useCallback((args: {
    entityType?: NotificationEntityType;
    entityId?: string;
    type?: string;
    item: Notification;
  }) => {
    const { entityType, entityId, type, item } = args;

    if (entityType === 'visit' && entityId) {
      go('VisitDetail', { visitId: entityId });
      return;
    }
    // El backend etiqueta las notificaciones de zonas comunes con este
    // entityType; sin esta rama, tocar el aviso de una reserva no lleva a nada.
    if (entityType === 'amenityBooking' && entityId) {
      go('AmenityBookingDetail', { bookingId: entityId });
      return;
    }
    // El aviso de votación abierta lleva directo a la pregunta.
    if (entityType === 'voting') {
      if (entityId) go('VotingQuestion', { questionId: entityId });
      else go('Voting');
      return;
    }
    if (entityType === 'pqrf') {
      if (entityId) go('PqrfDetail', { pqrfId: entityId });
      else go('Pqrf');
      return;
    }
    if (
      (entityType === 'maintenance_ticket' || entityType === 'maintenanceTicket') &&
      entityId
    ) {
      go('MaintenanceDetail', { ticketId: entityId });
      return;
    }
    // Reporte de convivencia: el aviso abre el caso, con su evidencia y el
    // plazo de descargos. Sin esta rama caía en el cajón de finanzas, porque
    // el reporte lleva `unitId` en metadata como casi todos los módulos.
    if ((entityType === 'pet_incident' || entityType === 'petIncident') && entityId) {
      go('PetIncidentDetail', { incidentId: entityId });
      return;
    }
    if (entityType === 'pet') {
      if (entityId) go('PetDetail', { petId: entityId });
      else go('Pets');
      return;
    }
    // Clasificados: el "me interesa" abre el chat con quien preguntó; los demás
    // avisos del módulo (aprobado, rechazado, por vencer) abren la ficha.
    // `metadata` viaja como JSON en texto (FCM solo admite strings). Si el aviso
    // vino del servidor sin él, "me interesa" abre la ficha, que tiene el botón
    // de los mensajes del aviso.
    let conversationId: string | undefined;
    try {
      const meta = item.data?.metadata ? JSON.parse(item.data.metadata) : null;
      if (typeof meta?.conversationId === 'string') conversationId = meta.conversationId;
    } catch {
      conversationId = undefined;
    }
    if (
      (entityType as string) === 'marketplace_conversation' ||
      ((entityType as string) === 'marketplace_listing' && conversationId)
    ) {
      go('ChatConversation', {
        conversationId:
          (entityType as string) === 'marketplace_conversation'
            ? entityId
            : conversationId,
      });
      return;
    }
    if ((entityType as string) === 'marketplace_listing' && entityId) {
      go('ListingDetail', { listingId: entityId });
      return;
    }
    if (entityType === 'package' && entityId) {
      go('PackageDetail', { packageId: entityId });
      return;
    }
    if (entityType === 'vehicle' && entityId) {
      go('VehicleDetail', { vehicleId: entityId });
      return;
    }
    if (entityType === 'ACCESS_REQUEST' && entityId) {
      go('AccessRequestDetail', { accessRequestId: entityId });
      return;
    }
    // Finance has no entityType — detect by its type token. The Finances screen
    // self-loads the resident's account statement.
    //
    // Antes bastaba con que `metadata` trajera un `unitId` para mandar el aviso
    // a finanzas, y eso es justo lo que ponen en metadata mascotas, visitas,
    // vehículos y paquetes: un reporte de convivencia terminaba abriendo el
    // estado de cuenta. Un aviso que YA dice a qué entidad apunta nunca es de
    // finanzas, así que este cajón solo recoge lo que no la trae.
    const isFinance = !entityType && !!type && FINANCE_TYPE_RE.test(type);
    if (isFinance) {
      go('Finances');
      return;
    }
    showInfo(item.body || 'Sin contenido adicional.', item.title);
  }, [go, showInfo]);

  const openNotification = useCallback(async (item: Notification) => {
    if (resolvingId) return;
    markAsRead(item.id);

    // The FCM payload sometimes already carries the entity reference; use it to
    // skip the round-trip, otherwise resolve the full detail from the backend.
    let entityType = item.data?.entityType as NotificationEntityType | undefined;
    let entityId = item.data?.entityId;
    let type = item.data?.type;
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
      } catch {
        setResolvingId(null);
        showError('No se pudo abrir la notificación.');
        return;
      }
      setResolvingId(null);
    }

    openEntity({ entityType, entityId, type, item });
  }, [resolvingId, markAsRead, openEntity, showError]);

  return { openNotification, resolvingId };
}
