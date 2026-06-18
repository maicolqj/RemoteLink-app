// Visit domain
export enum VisitStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED         = 'APPROVED',
  DENIED           = 'DENIED',
  INSIDE           = 'INSIDE',
  COMPLETED        = 'COMPLETED',
  CANCELLED        = 'CANCELLED',
  EXPIRED          = 'EXPIRED',
  NO_SHOW          = 'NO_SHOW',
}

export enum VisitType {
  WALK_IN          = 'WALK_IN',
  SCHEDULED        = 'SCHEDULED',
  DELIVERY         = 'DELIVERY',
  SERVICE_PROVIDER = 'SERVICE_PROVIDER',
}

export enum VisitorIdentityType {
  CC         = 'CC',
  CE         = 'CE',
  PASSPORT   = 'PASSPORT',
  TI         = 'TI',
  FOREIGN_ID = 'FOREIGN_ID',
  OTHER      = 'OTHER',
}

// Package domain
export enum PackageStatus {
  RECEIVED  = 'RECEIVED',
  NOTIFIED  = 'NOTIFIED',
  DELIVERED = 'DELIVERED',
  RETURNED  = 'RETURNED',
  PENDING   = 'PENDING',
}

export enum PackageType {
  PACKAGE  = 'PACKAGE',
  DOCUMENT = 'DOCUMENT',
  FOOD     = 'FOOD',
  FLOWERS  = 'FLOWERS',
  OTHER    = 'OTHER',
}

// Vehicle domain
export enum VehicleStatus {
  PENDING  = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum VehicleType {
  CAR        = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  TRUCK      = 'TRUCK',
  BICYCLE    = 'BICYCLE',
  OTHER      = 'OTHER',
}

export enum FuelType {
  GASOLINE = 'GASOLINE',
  DIESEL   = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID   = 'HYBRID',
  GAS      = 'GAS',
}

// Access request domain
export enum AccessRequestStatus {
  PENDING  = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Notification domain
export enum NotificationType {
  VISITOR_WALK_IN          = 'VISITOR_WALK_IN',
  VISIT_APPROVED           = 'VISIT_APPROVED',
  VISIT_DENIED             = 'VISIT_DENIED',
  PACKAGE_RECEIVED         = 'PACKAGE_RECEIVED',
  PACKAGE_READY            = 'PACKAGE_READY',
  PAYMENT_DUE              = 'PAYMENT_DUE',
  PAYMENT_OVERDUE          = 'PAYMENT_OVERDUE',
  PANIC_ALERT              = 'PANIC_ALERT',
  SYSTEM_ANNOUNCEMENT      = 'SYSTEM_ANNOUNCEMENT',
  COMPLEX_ALERT            = 'COMPLEX_ALERT',
  ACCESS_REQUEST_APPROVED  = 'ACCESS_REQUEST_APPROVED',
  ACCESS_REQUEST_REJECTED  = 'ACCESS_REQUEST_REJECTED',
}

export enum NotificationActionType {
  VISIT_APPROVAL    = 'VISIT_APPROVAL',
  RESIDENT_APPROVAL = 'RESIDENT_APPROVAL',
  VEHICLE_APPROVAL  = 'VEHICLE_APPROVAL',
  ACKNOWLEDGE       = 'ACKNOWLEDGE',
}
