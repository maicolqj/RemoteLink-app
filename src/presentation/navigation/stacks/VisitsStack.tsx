import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { VisitsStackParamList } from '../types/NavigationTypes';
import VisitsScreen from '../../screens/generals/VisitsScreen';
import VisitDetailScreen from '../../screens/generals/VisitDetailScreen';
import ScheduleVisitScreen from '../../screens/generals/ScheduleVisitScreen';
import VisitQRScreen from '../../screens/generals/VisitQRScreen';

const Stack = createNativeStackNavigator<VisitsStackParamList>();

export default function VisitsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Visits" component={VisitsScreen} />
      <Stack.Screen name="VisitDetail" component={VisitDetailScreen} />
      <Stack.Screen name="ScheduleVisit" component={ScheduleVisitScreen} />
      <Stack.Screen name="VisitQR" component={VisitQRScreen} />
    </Stack.Navigator>
  );
}
