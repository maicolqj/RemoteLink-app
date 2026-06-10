import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FinancesStackParamList } from '../types/NavigationTypes';
import FinancesScreen from '../../screens/generals/FinancesScreen';
import PaymentDetailScreen from '../../screens/generals/PaymentDetailScreen';

const Stack = createNativeStackNavigator<FinancesStackParamList>();

export default function FinancesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Finances" component={FinancesScreen} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
    </Stack.Navigator>
  );
}
