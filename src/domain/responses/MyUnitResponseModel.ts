export type UnitAssetType = 'PARKING' | 'STORAGE';
export type HouseholdType = 'OWNER' | 'TENANT' | 'FAMILY_MEMBER' | 'CARETAKER';

export interface MyUnitAsset {
  id: string;
  type: UnitAssetType;
  code: string;
  location?: string | null;
}

export interface MyUnitVehicle {
  id: string;
  plate: string;
  type: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  photoUrl?: string | null;
  /** El que la rotación le asigna; null = sin cupo este periodo. */
  parkingSpot?: string | null;
  status: string;
  /** Quedó fuera del parqueadero en el último sorteo de la rotación. */
  suspendedByRotation?: boolean | null;
  /** Parqueadero propio de la unidad: con él no entra en la rotación. */
  fixedParkingAsset?: { id: string; code: string; location?: string | null } | null;
}

export interface MyUnitMember {
  residentId: string;
  name: string;
  lastName?: string | null;
  phoneNumber?: string | null;
  type: HouseholdType;
  isMainResident: boolean;
  startDate?: string | null;
  isMe: boolean;
}

export interface MyUnit {
  unit: {
    id: string;
    number: string;
    floor: number;
    type: string;
    area?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    parkingSpots: number;
    storageRooms: number;
    hasElevator?: boolean | null;
    houseFloors?: number | null;
    coefficient?: number | null;
    building?: { id: string; name: string } | null;
  };
  assets: MyUnitAsset[];
  vehicles: MyUnitVehicle[];
  /** Próxima rotación de parqueaderos del conjunto (null si no rota). */
  nextRotationAt?: string | null;
  members: MyUnitMember[];
}
