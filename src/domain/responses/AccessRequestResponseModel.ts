import type { AccessRequestStatus } from '../enums/enums';

// TODO(backend): confirm the real field names/types of SupervisorAccessRequest.
export interface AccessRequest {
  id: string;
  status: AccessRequestStatus | string;
  reason?: string | null;
  requestedAt?: string | null;
  resolvedAt?: string | null;
  rejectionReason?: string | null;
  // Requester info
  requesterName?: string | null;
  requesterIdentity?: string | null;
  requesterIdentityType?: string | null;
  requesterPhone?: string | null;
  photoUrl?: string | null;
  unitId?: string | null;
  complexId?: string | null;
}
