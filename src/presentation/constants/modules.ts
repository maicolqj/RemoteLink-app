/**
 * Los módulos que el conjunto puede prender y apagar, y a qué pantalla de la
 * app corresponde cada uno.
 *
 * `ResidentialComplex.enabledModules` es la única fuente: la misma lista arma
 * el menú lateral de la web y los accesos del inicio de la app. Aquí vive el
 * puente entre esa lista y la navegación, para que el gateo no quede repartido
 * en veinte pantallas: agregar un módulo nuevo es agregar sus rutas a
 * `SCREEN_MODULE` y la llave `module` al acceso del inicio.
 */

/** Espejo del enum `ComplexModule` del servidor. */
export const ComplexModule = {
  EDIFICIOS: 'EDIFICIOS',
  UNIDADES: 'UNIDADES',
  RESIDENTES: 'RESIDENTES',
  VISITAS: 'VISITAS',
  VEHICULOS: 'VEHICULOS',
  PAQUETES: 'PAQUETES',
  FINANZAS: 'FINANZAS',
  NOTAS: 'NOTAS',
  PERSONAL: 'PERSONAL',
  MENSAJES: 'MENSAJES',
  MOVIMIENTOS: 'MOVIMIENTOS',
  NOTIFICACIONES: 'NOTIFICACIONES',
  PARKING_ROTATION: 'PARKING_ROTATION',
  PARKING_BILLING: 'PARKING_BILLING',
  ZONAS_COMUNES: 'ZONAS_COMUNES',
  PQRF: 'PQRF',
  VOTACIONES: 'VOTACIONES',
  MASCOTAS: 'MASCOTAS',
  MANTENIMIENTO: 'MANTENIMIENTO',
} as const;

export type ComplexModuleKey = (typeof ComplexModule)[keyof typeof ComplexModule];

/**
 * Qué módulo exige cada pantalla del stack del inicio.
 *
 * Incluye las pantallas de detalle y no solo las de entrada: a un detalle se
 * llega también desde la bandeja de notificaciones y desde un push, sin pasar
 * por el acceso del inicio.
 *
 * Quedan deliberadamente fuera: `Home`, `Notifications` (la bandeja no es un
 * módulo contratable —dejar a alguien sin sus propios avisos no es una opción—)
 * y `AccessRequestDetail`, que es parte del ingreso a la cuenta.
 */
export const SCREEN_MODULE: Record<string, ComplexModuleKey> = {
  Visits: ComplexModule.VISITAS,
  ScheduleVisit: ComplexModule.VISITAS,
  VisitDetail: ComplexModule.VISITAS,
  VisitQR: ComplexModule.VISITAS,

  Packages: ComplexModule.PAQUETES,
  PackageDetail: ComplexModule.PAQUETES,

  Amenities: ComplexModule.ZONAS_COMUNES,
  AmenityDetail: ComplexModule.ZONAS_COMUNES,
  MyAmenityBookings: ComplexModule.ZONAS_COMUNES,
  AmenityBookingDetail: ComplexModule.ZONAS_COMUNES,

  Pqrf: ComplexModule.PQRF,
  PqrfCreate: ComplexModule.PQRF,
  PqrfDetail: ComplexModule.PQRF,

  Pets: ComplexModule.MASCOTAS,
  PetRegister: ComplexModule.MASCOTAS,
  PetDetail: ComplexModule.MASCOTAS,
  PetIncidentReport: ComplexModule.MASCOTAS,
  PetIncidentDetail: ComplexModule.MASCOTAS,

  Maintenance: ComplexModule.MANTENIMIENTO,
  MaintenanceReport: ComplexModule.MANTENIMIENTO,
  MaintenanceDetail: ComplexModule.MANTENIMIENTO,

  Voting: ComplexModule.VOTACIONES,
  VotingQuestion: ComplexModule.VOTACIONES,

  VehicleDetail: ComplexModule.VEHICULOS,

  Finances: ComplexModule.FINANZAS,
  PaymentDetail: ComplexModule.FINANZAS,
};

/** Cómo se le nombra el módulo al residente cuando se le avisa que se apagó. */
export const MODULE_LABELS: Partial<Record<ComplexModuleKey, string>> = {
  VISITAS: 'Visitas',
  VEHICULOS: 'Vehículos',
  PAQUETES: 'Paquetes',
  FINANZAS: 'Finanzas',
  ZONAS_COMUNES: 'Zonas comunes',
  PQRF: 'PQRF',
  VOTACIONES: 'Votaciones',
  MASCOTAS: 'Mascotas',
  MANTENIMIENTO: 'Daños y mantenimiento',
};

export const moduleLabel = (module: string): string =>
  MODULE_LABELS[module as ComplexModuleKey] ?? module;
