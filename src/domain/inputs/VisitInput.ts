import { VisitStatus, VisitType } from "../responses/VisitResponseModel";

export type VisitorIdentityType = 'CC' | 'CE' | 'PASSPORT' | 'TI' | 'FOREIGN_ID' | 'OTHER';

export interface ScheduleVisitInput {
  visitorName: string;
  visitorLastName: string;
  visitorIdentity: string;
  identityType?: VisitorIdentityType;
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
  status?: VisitStatus;
  type?: VisitType;
  dateFrom?: string;
  dateTo?: string;
  unitId?: string;
}

export interface PaginationInput {
  page: number;
  limit: number;
}
