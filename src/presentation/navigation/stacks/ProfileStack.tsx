import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../types/NavigationTypes';
import ProfileScreen from '../../screens/generals/ProfileScreen';
import ResidentDirectoryScreen from '../../screens/generals/ResidentDirectoryScreen';
import ResidentDetailScreen from '../../screens/generals/ResidentDetailScreen';
import SettingsScreen from '../../screens/generals/SettingsScreen';
import SetAccessCodeScreen from '../../screens/auth/SetAccessCodeScreen';
import MyDevicesScreen from '../../screens/generals/MyDevicesScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ResidentDirectory" component={ResidentDirectoryScreen} />
      <Stack.Screen name="ResidentDetail" component={ResidentDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="SetAccessCode" component={SetAccessCodeScreen} />
      <Stack.Screen name="MyDevices" component={MyDevicesScreen} />
    </Stack.Navigator>
  );
}
