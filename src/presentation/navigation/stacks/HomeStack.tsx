import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types/NavigationTypes';
import HomeScreen from '../../screens/generals/HomeScreen';
import NotificationsScreen from '../../screens/generals/NotificationsScreen';
import VisitsScreen from '../../screens/generals/VisitsScreen';
import ScheduleVisitScreen from '../../screens/generals/ScheduleVisitScreen';
import VisitDetailScreen from '../../screens/generals/VisitDetailScreen';
import VisitQRScreen from '../../screens/generals/VisitQRScreen';
import PackageDetailScreen from '../../screens/generals/PackageDetailScreen';
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
      <Stack.Screen name="PackageDetail" component={PackageDetailScreen} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <Stack.Screen name="AccessRequestDetail" component={AccessRequestDetailScreen} />
      <Stack.Screen name="Finances" component={FinancesScreen} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
    </Stack.Navigator>
  );
}
