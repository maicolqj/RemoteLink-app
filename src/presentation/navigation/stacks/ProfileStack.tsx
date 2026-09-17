import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../types/NavigationTypes';
import ProfileScreen from '../../screens/generals/ProfileScreen';
import ResidentDirectoryScreen from '../../screens/generals/ResidentDirectoryScreen';
import ResidentDetailScreen from '../../screens/generals/ResidentDetailScreen';
import SettingsScreen from '../../screens/generals/SettingsScreen';
import SetAccessCodeScreen from '../../screens/auth/SetAccessCodeScreen';
import MyDevicesScreen from '../../screens/generals/MyDevicesScreen';
import SystemPermissionsScreen from '../../screens/generals/SystemPermissionsScreen';
import { ForcedLightTheme } from '../../providers/context/ThemeContext';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ResidentDirectory" component={ResidentDirectoryScreen} />
      <Stack.Screen name="ResidentDetail" component={ResidentDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      {/* Comparte el diseño de las pantallas de ingreso, así que también va
          fija en claro. El resto del stack sigue el tema del sistema. */}
      <Stack.Screen name="SetAccessCode">
        {() => (
          <ForcedLightTheme>
            <SetAccessCodeScreen />
          </ForcedLightTheme>
        )}
      </Stack.Screen>
      <Stack.Screen name="MyDevices" component={MyDevicesScreen} />
      <Stack.Screen name="SystemPermissions" component={SystemPermissionsScreen} />
    </Stack.Navigator>
  );
}
