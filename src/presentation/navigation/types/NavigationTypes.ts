import type { NavigatorScreenParams } from '@react-navigation/native';

// Stack Params
export type HomeStackParamList = {
  Home: undefined;
  Notifications: undefined;
  // Visits tab is disabled — the whole Visits flow lives inside HomeStack so it
  // stays reachable from the Home quick action and from tapped notifications.
  Visits: undefined;
  ScheduleVisit: undefined;
  VisitDetail: { visitId: string };
  VisitQR: {
    visitId: string;
    qrToken: string;
    visitorName?: string;
    visitorIdentity?: string;
    visitorIdentityType?: string;
    expectedArrivalAt?: string;
  };
  Packages: undefined;
  PackageDetail: { packageId: string };
  // Zonas comunes: catálogo, ficha con disponibilidad y las reservas propias.
  Amenities: undefined;
  AmenityDetail: { amenityId: string };
  MyAmenityBookings: undefined;
  AmenityBookingDetail: { bookingId: string };
  // PQRF: los radicados propios y, para el consejo, los que le dirigieron.
  Pqrf: undefined;
  PqrfCreate: undefined;
  PqrfDetail: { pqrfId: string };
  // Mascotas: el censo de la unidad y los reportes de convivencia. Reportar
  // admite llegar con la mascota ya señalada (desde su ficha) o sin señalar.
  Pets: undefined;
  /** Con `petId` la pantalla edita esa ficha en vez de crear una nueva. */
  PetRegister: { petId?: string } | undefined;
  PetDetail: { petId: string };
  PetIncidentReport: { petId?: string } | undefined;
  PetIncidentDetail: { incidentId: string };
  // Mantenimiento: daños en zonas comunes. La lista arranca en los del
  // conjunto —ver que el ascensor ya está reportado evita el reporte 31— y el
  // detalle es el seguimiento de lo propio.
  Maintenance: undefined;
  MaintenanceReport: undefined;
  MaintenanceDetail: { ticketId: string };
  // Votaciones: solo aparecen si la administración las habilitó.
  Voting: undefined;
  VotingQuestion: { questionId: string };
  VehicleDetail: { vehicleId: string };
  AccessRequestDetail: { accessRequestId: string };
  // Finance notifications route here; the screen self-loads the resident's unit.
  Finances: undefined;
  PaymentDetail: { movementId: string };
  // Clasificados: la vitrina, la ficha de un aviso, los propios y el alta.
  Marketplace: undefined;
  ListingDetail: { listingId: string };
  MyListings: undefined;
  ListingForm: undefined;
};

export type FinancesStackParamList = {
  Finances: undefined;
  PaymentDetail: { movementId: string };
};

export type VisitsStackParamList = {
  Visits: undefined;
  VisitDetail: { visitId: string };
  ScheduleVisit: undefined;
  VisitQR: {
    visitId: string;
    qrToken: string;
    visitorName?: string;
    visitorIdentity?: string;
    visitorIdentityType?: string;
    expectedArrivalAt?: string;
  };
};

export type ProfileStackParamList = {
  Profile: undefined;
  ResidentDirectory: undefined;
  ResidentDetail: { residentId: string };
  Settings: undefined;
  // Seguridad de la cuenta: clave de acceso y equipos vinculados.
  // `mandatory` bloquea la salida de la pantalla: se usa en el primer ingreso y
  // cuando el residente volvió a entrar por haber olvidado la clave. La única
  // salida es cerrar sesión, para no dejar vinculado un dispositivo prestado.
  SetAccessCode: { firstTime?: boolean; mandatory?: boolean } | undefined;
  MyDevices: undefined;
  // Permisos que concede Android (notificaciones, No molestar, inicio
  // automático). Separados de Ajustes: no son preferencias de la app.
  SystemPermissions: undefined;
};

// Stack de autenticación: tres formas de entrar, todas sin costo por mensaje.
// `LoginIdentity` reúne el documento y la clave; las otras dos pantallas son
// para vincular un equipo nuevo o recuperar el acceso.
export type AuthStackParamList = {
  LoginIdentity: { notice?: string } | undefined;
  LoginWhatsApp: { identity?: string } | undefined;
  LoginApproval: { identity?: string } | undefined;
};

// Tab Params (each tab is a nested stack)
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  // FinancesTab removed: the Finances flow now lives inside HomeStack (reachable
  // from the Home balance card), so it no longer needs its own bottom tab.
  // VisitsTab: NavigatorScreenParams<VisitsStackParamList>;
  // Tienda comentada temporalmente — pendiente para actualizaciones futuras.
  // MarketplaceTab: NavigatorScreenParams<MarketplaceStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// Root
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  // Aprobación de ingreso desde el dispositivo confiable. Vive en el root (no
  // dentro de un tab) porque llega por push y debe abrirse desde cualquier
  // pantalla: la solicitud vence en 5 minutos.
  ApproveDevice: {
    approvalId?: string;
    approvalCode?: string;
    requestedFromLabel?: string;
    requestedFromIp?: string;
    expiresAt?: string;
  } | undefined;
  // Documentos legales en WebView. Vive en el root (fuera del condicional de
  // sesión) para ser alcanzable tanto desde el login como desde Ajustes.
  Legal: { url: string; title: string };
};

// Cross-stack navigation helper types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
