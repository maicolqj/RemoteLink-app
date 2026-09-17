// Resolved detail returned by the `notificationDetail` query. `entityType` +
// `entityId` drive which entity screen the app opens next.
export type NotificationEntityType =
  | 'visit'
  | 'visitor'
  | 'package'
  | 'vehicle'
  | 'visitor_vehicle'
  | 'resident'
  | 'amenityBooking'
  | 'pqrf'
  // Votación abierta: el aviso lleva directo a la pregunta.
  | 'voting'
  // Censo de mascotas y reportes de convivencia. `petIncident` es el valor que
  // quedó guardado en los avisos emitidos antes de unificar el nombre: los que
  // ya están en la bandeja del residente siguen llegando con ese.
  | 'pet'
  | 'pet_incident'
  | 'petIncident'
  // Daños en zonas comunes. `maintenanceTicket` es el alias que el backend
  // acepta; los avisos viajan con el primero.
  | 'maintenance_ticket'
  | 'maintenanceTicket'
  | 'ACCESS_REQUEST';

export interface NotificationCreatedBy {
  id: string;
  fullName: string;
  roles?: string[];
  profilePicture?: string | null;
}

export interface NotificationDetail {
  id: string;
  type: string;
  priority?: string;
  title: string;
  body: string;
  isRead: boolean;
  isActionable: boolean;
  actionType?: string | null;
  actionLabel?: string | null;
  actionResult?: string | null;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
  // Free-form JSON payload — finance notifications carry unitId / chargeId here.
  metadata?: Record<string, any> | null;
  createdByUser?: NotificationCreatedBy | null;
}
