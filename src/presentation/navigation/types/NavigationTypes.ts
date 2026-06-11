import type { NavigatorScreenParams } from '@react-navigation/native';

// Stack Params
export type HomeStackParamList = {
  Home: undefined;
  Notifications: undefined;
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
