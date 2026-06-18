import type { PackageStatus, PackageType } from '../enums/enums';

export interface Package {
  id: string;
  trackingCode?: string | null;
  senderName?: string | null;
  description?: string | null;
  type?: PackageType | string | null;
  status: PackageStatus | string;
  photoUrl?: string | null;
  receivedAt?: string | null;
  notifiedAt?: string | null;
  deliveredAt?: string | null;
  returnedAt?: string | null;
  recipientName?: string | null;
  receivedByName?: string | null;
  notes?: string | null;
  returnReason?: string | null;
  unitId?: string | null;
  complexId?: string | null;
}
