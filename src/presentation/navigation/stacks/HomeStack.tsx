import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types/NavigationTypes';
import HomeScreen from '../../screens/generals/HomeScreen';
import NotificationsScreen from '../../screens/generals/NotificationsScreen';
import VisitsScreen from '../../screens/generals/VisitsScreen';
import ScheduleVisitScreen from '../../screens/generals/ScheduleVisitScreen';
import VisitDetailScreen from '../../screens/generals/VisitDetailScreen';
import VisitQRScreen from '../../screens/generals/VisitQRScreen';
import PackagesScreen from '../../screens/generals/PackagesScreen';
import PackageDetailScreen from '../../screens/generals/PackageDetailScreen';
import AmenitiesScreen from '../../screens/generals/AmenitiesScreen';
import AmenityDetailScreen from '../../screens/generals/AmenityDetailScreen';
import MyAmenityBookingsScreen from '../../screens/generals/MyAmenityBookingsScreen';
import AmenityBookingDetailScreen from '../../screens/generals/AmenityBookingDetailScreen';
import PqrfScreen from '../../screens/generals/PqrfScreen';
import PqrfCreateScreen from '../../screens/generals/PqrfCreateScreen';
import PqrfDetailScreen from '../../screens/generals/PqrfDetailScreen';
import PetsScreen from '../../screens/generals/PetsScreen';
import PetRegisterScreen from '../../screens/generals/PetRegisterScreen';
import PetDetailScreen from '../../screens/generals/PetDetailScreen';
import PetIncidentReportScreen from '../../screens/generals/PetIncidentReportScreen';
import PetIncidentDetailScreen from '../../screens/generals/PetIncidentDetailScreen';
import MaintenanceScreen from '../../screens/generals/MaintenanceScreen';
import MaintenanceReportScreen from '../../screens/generals/MaintenanceReportScreen';
import MaintenanceDetailScreen from '../../screens/generals/MaintenanceDetailScreen';
import VotingScreen from '../../screens/generals/VotingScreen';
import VotingQuestionScreen from '../../screens/generals/VotingQuestionScreen';
import VehicleDetailScreen from '../../screens/generals/VehicleDetailScreen';
import AccessRequestDetailScreen from '../../screens/generals/AccessRequestDetailScreen';
import FinancesScreen from '../../screens/generals/FinancesScreen';
import PaymentDetailScreen from '../../screens/generals/PaymentDetailScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      {/* Visits tab is disabled — full Visits flow lives here so the Home quick
          action and tapped notifications both resolve. */}
      <Stack.Screen name="Visits" component={VisitsScreen} />
      <Stack.Screen name="ScheduleVisit" component={ScheduleVisitScreen} />
      <Stack.Screen name="VisitDetail" component={VisitDetailScreen} />
      <Stack.Screen name="VisitQR" component={VisitQRScreen} />
      <Stack.Screen name="Packages" component={PackagesScreen} />
      <Stack.Screen name="PackageDetail" component={PackageDetailScreen} />
      <Stack.Screen name="Amenities" component={AmenitiesScreen} />
      <Stack.Screen name="AmenityDetail" component={AmenityDetailScreen} />
      <Stack.Screen name="MyAmenityBookings" component={MyAmenityBookingsScreen} />
      <Stack.Screen name="AmenityBookingDetail" component={AmenityBookingDetailScreen} />
      <Stack.Screen name="Pqrf" component={PqrfScreen} />
      <Stack.Screen name="PqrfCreate" component={PqrfCreateScreen} />
      <Stack.Screen name="PqrfDetail" component={PqrfDetailScreen} />
      <Stack.Screen name="Pets" component={PetsScreen} />
      <Stack.Screen name="PetRegister" component={PetRegisterScreen} />
      <Stack.Screen name="PetDetail" component={PetDetailScreen} />
      <Stack.Screen name="PetIncidentReport" component={PetIncidentReportScreen} />
      <Stack.Screen name="PetIncidentDetail" component={PetIncidentDetailScreen} />
      <Stack.Screen name="Maintenance" component={MaintenanceScreen} />
      <Stack.Screen name="MaintenanceReport" component={MaintenanceReportScreen} />
      <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen} />
      <Stack.Screen name="Voting" component={VotingScreen} />
      <Stack.Screen name="VotingQuestion" component={VotingQuestionScreen} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <Stack.Screen name="AccessRequestDetail" component={AccessRequestDetailScreen} />
      <Stack.Screen name="Finances" component={FinancesScreen} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
    </Stack.Navigator>
  );
}
