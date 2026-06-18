export interface GetUnitResponseModel {
  unit: {
    id: string;
    number: string;
    floor?: number;
    building?: {
      id: string;
      name: string;
    };
  };
}

export interface ResidentProfile {
  id: string;
  user: {
    id: string;
    name: string;
    lastName: string;
    phoneNumber?: string;
  };
  unit: {
    id: string;
    number: string;
    floor?: number;
    building?: {
      id: string;
      name: string;
    };
  };
}

export interface GetResidentByUserIdResponseModel {
  residentByUserId: ResidentProfile | null;
}
