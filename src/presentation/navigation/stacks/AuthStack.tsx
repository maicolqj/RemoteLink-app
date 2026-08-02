import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types/NavigationTypes';
import LoginScreen from '../../screens/auth/LoginScreen';
import WhatsAppLoginScreen from '../../screens/auth/WhatsAppLoginScreen';
import DeviceApprovalLoginScreen from '../../screens/auth/DeviceApprovalLoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Una sola puerta de entrada: `LoginIdentity` trae el documento y la clave en la
 * misma pantalla. Antes había una pantalla aparte para la clave y este stack
 * elegía cuál mostrar primero según una pista local; con las dos juntas esa
 * bifurcación dejó de tener sentido.
 */
export default function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      initialRouteName="LoginIdentity">
      <Stack.Screen name="LoginIdentity" component={LoginScreen} />
      <Stack.Screen name="LoginWhatsApp" component={WhatsAppLoginScreen} />
      <Stack.Screen name="LoginApproval" component={DeviceApprovalLoginScreen} />
    </Stack.Navigator>
  );
}
