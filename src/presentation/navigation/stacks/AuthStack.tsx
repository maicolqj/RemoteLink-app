import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types/NavigationTypes';
import LoginScreen from '../../screens/auth/LoginScreen';
import AccessCodeLoginScreen from '../../screens/auth/AccessCodeLoginScreen';
import WhatsAppLoginScreen from '../../screens/auth/WhatsAppLoginScreen';
import DeviceApprovalLoginScreen from '../../screens/auth/DeviceApprovalLoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * `deviceLinked` decide solo cuál pantalla se muestra primero. Es una pista
 * local (AsyncStorage), no una credencial: si el backend responde
 * DEVICE_NOT_LINKED, la pantalla de la clave redirige al login con documento y
 * limpia la pista.
 */
export default function AuthStack({ deviceLinked }: { deviceLinked: boolean }) {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      initialRouteName={deviceLinked ? 'LoginAccessCode' : 'LoginIdentity'}>
      <Stack.Screen name="LoginAccessCode" component={AccessCodeLoginScreen} />
      <Stack.Screen name="LoginIdentity" component={LoginScreen} />
      <Stack.Screen name="LoginWhatsApp" component={WhatsAppLoginScreen} />
      <Stack.Screen name="LoginApproval" component={DeviceApprovalLoginScreen} />
    </Stack.Navigator>
  );
}
