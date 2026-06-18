import type { NavigatorScreenParams } from '@react-navigation/native';

// Stack Params
export type HomeStackParamList = {
  Home: undefined;
  Notifications: undefined;
  // Visits tab is disabled — the whole Visits flow lives inside HomeStack so it
  // stays reachable from the Home quick action and from tapped notifications.
  Visits: undefined;
  ScheduleVisit: undefined;
  VisitDetail: { visitId: string };
  VisitQR: {
    visitId: string;
    qrToken: string;
    visitorName?: string;
    visitorIdentity?: string;
    visitorIdentityType?: string;
    expectedArrivalAt?: string;
  };
  PackageDetail: { packageId: string };
  VehicleDetail: { vehicleId: string };
  AccessRequestDetail: { accessRequestId: string };
  // Finance notifications route here; the screen self-loads the resident's unit.
  Finances: undefined;
  PaymentDetail: { movementId: string };
};

export type FinancesStackParamList = {
  Finances: undefined;
  PaymentDetail: { movementId: string };
};

export type VisitsStackParamList = {
  Visits: undefined;
  VisitDetail: { visitId: string };
  ScheduleVisit: undefined;
  VisitQR: {
    visitId: string;
    qrToken: string;
    visitorName?: string;
    visitorIdentity?: string;
    visitorIdentityType?: string;
    expectedArrivalAt?: string;
  };
};

export type MarketplaceStackParamList = {
  Marketplace: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  ResidentDirectory: undefined;
  ResidentDetail: { residentId: string };
  Settings: undefined;
};

// Tab Params (each tab is a nested stack)
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  // FinancesTab: NavigatorScreenParams<FinancesStackParamList>;
  // VisitsTab: NavigatorScreenParams<VisitsStackParamList>;
  MarketplaceTab: NavigatorScreenParams<MarketplaceStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// Root
export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Cross-stack navigation helper types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
