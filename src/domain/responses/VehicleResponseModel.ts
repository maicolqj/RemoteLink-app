import type { VehicleStatus, VehicleType, FuelType } from '../enums/enums';

export interface Vehicle {
  id: string;
  plate: string;
  type?: VehicleType | string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  fuelType?: FuelType | string | null;
  photoUrl?: string | null;
  parkingSpot?: string | null;
  status: VehicleStatus | string;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
  residentId?: string | null;
  unitId?: string | null;
  complexId?: string | null;
  createdAt?: string | null;
}
