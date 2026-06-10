import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../types/NavigationTypes';
import ProfileScreen from '../../screens/generals/ProfileScreen';
import ResidentDirectoryScreen from '../../screens/generals/ResidentDirectoryScreen';
import ResidentDetailScreen from '../../screens/generals/ResidentDetailScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ResidentDirectory" component={ResidentDirectoryScreen} />
      <Stack.Screen name="ResidentDetail" component={ResidentDetailScreen} />
    </Stack.Navigator>
  );
}
