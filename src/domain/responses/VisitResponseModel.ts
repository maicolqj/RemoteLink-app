export type VisitStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'DENIED'
  | 'INSIDE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW';

export type VisitType = 'WALK_IN' | 'SCHEDULED' | 'DELIVERY' | 'SERVICE_PROVIDER';

export type VisitorIdentityType = 'CC' | 'CE' | 'PASSPORT' | 'TI' | 'FOREIGN_ID' | 'OTHER';

export interface Visitor {
  id: string;
  fullName: string;
  identity: string;
  identityType?: VisitorIdentityType;
  phone?: string;
  isBlacklisted?: boolean;
  blacklistReason?: string;
  blacklistedAt?: string;
}

export interface Visit {
  id: string;
  status: VisitStatus;
  type: VisitType;
  qrToken?: string;
  qrExpiresAt?: string;
  qrUsed?: boolean;
  expectedArrivalAt?: string;
  expectedArrivalUntil?: string;
  entryTime?: string;
  exitTime?: string;
  purpose?: string;
  vehiclePlate?: string;
  notes?: string;
  denialReason?: string;
  approvedByResidentAt?: string;
  deniedByResidentAt?: string;
  createdAt: string;
  visitor: Visitor;
}

export interface VisitsPagination {
  total: number;
  page: number;
  limit: number;
}

export interface VisitsResponse {
  items: Visit[];
  pagination: VisitsPagination;
}
