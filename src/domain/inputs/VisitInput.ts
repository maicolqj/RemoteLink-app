export type VisitorIdentityType = 'CC' | 'CE' | 'PASSPORT' | 'TI' | 'FOREIGN_ID' | 'OTHER';

export interface ScheduleVisitInput {
  visitorName: string;
  visitorLastName: string;
  visitorIdentity: string;
  visitorIdentityType?: VisitorIdentityType;
  visitorPhone?: string;
  hostResidentId: string;
  unitId: string;
  complexId: string;
  expectedArrivalAt: string;
  expectedArrivalUntil?: string;
  purpose?: string;
  vehiclePlate?: string;
  notes?: string;
}

export interface BlacklistInput {
  visitorId: string;
  reason: string;
}

export interface FilterVisitsInput {
  status?: import('./VisitResponseModel').VisitStatus;
  type?: import('./VisitResponseModel').VisitType;
  dateFrom?: string;
  dateTo?: string;
  unitId?: string;
}

export interface PaginationInput {
  page: number;
  limit: number;
}
