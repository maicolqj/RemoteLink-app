import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MarketplaceStackParamList } from '../types/NavigationTypes';
import MarketplaceScreen from '../../screens/generals/MarketplaceScreen';
import ProductDetailScreen from '../../screens/generals/ProductDetailScreen';
import CartScreen from '../../screens/generals/CartScreen';

const Stack = createNativeStackNavigator<MarketplaceStackParamList>();

export default function MarketplaceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
    </Stack.Navigator>
  );
}
