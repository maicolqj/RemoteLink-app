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
  photoUrl?: string;
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
  unit?: { id: string; building?: { id: string; name: string } };
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

export interface MyScheduledVisitsResponseModel {
  myVisits: MyVisits;
}

export interface MyVisits {
  items:      Item[];
  pagination: Pagination;
}

export interface Item {
  id:                   string;
  type:                 string;
  status:               string;
  purpose:              null;
  expectedArrivalAt:    Date;
  expectedArrivalUntil: Date;
  qrToken:              string;
  qrUsed:               boolean;
  qrExpiresAt:          Date;
  vehiclePlate:         null;
  entryTime:            null;
  exitTime:             null;
  createdAt:            Date;
  visitor:              Visitor;
  unit:                 Unit;
}

export interface Unit {
  id:       string;
  building: Building;
}

export interface Building {
  id:   string;
  name: string;
}


export interface Pagination {
  currentPage:     number;
  itemsPerPage:    number;
  totalItems:      number;
  totalPages:      number;
  hasNextPage:     boolean;
  hasPreviousPage: boolean;
}

