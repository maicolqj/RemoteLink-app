import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types/NavigationTypes';
import LoginScreen from '../../screens/auth/LoginScreen';
import DevicePinLoginScreen from '../../screens/auth/DevicePinLoginScreen';
import WhatsAppLoginScreen from '../../screens/auth/WhatsAppLoginScreen';
import DeviceApprovalLoginScreen from '../../screens/auth/DeviceApprovalLoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * `pinLinked` decide solo cuál pantalla se muestra primero. Es una pista local
 * (AsyncStorage), no una credencial: si el backend responde DEVICE_NOT_LINKED,
 * la pantalla del PIN redirige al login con documento y limpia la pista.
 */
export default function AuthStack({ pinLinked }: { pinLinked: boolean }) {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      initialRouteName={pinLinked ? 'LoginPin' : 'LoginIdentity'}>
      <Stack.Screen name="LoginPin" component={DevicePinLoginScreen} />
      <Stack.Screen name="LoginIdentity" component={LoginScreen} />
      <Stack.Screen name="LoginWhatsApp" component={WhatsAppLoginScreen} />
      <Stack.Screen name="LoginApproval" component={DeviceApprovalLoginScreen} />
    </Stack.Navigator>
  );
}
