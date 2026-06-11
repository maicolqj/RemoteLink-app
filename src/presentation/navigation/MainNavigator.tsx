import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { MainTabParamList } from './types/NavigationTypes';
import { FONT_SIZE, FONT_WEIGHT } from '../constants/typography';
import { SPACING } from '../constants/spacing';
import { useTheme } from '../providers/context/ThemeContext';
import HomeStack from './stacks/HomeStack';
import FinancesStack from './stacks/FinancesStack';
import VisitsStack from './stacks/VisitsStack';
import MarketplaceStack from './stacks/MarketplaceStack';
import ProfileStack from './stacks/ProfileStack';
import { useNotificationsStore } from '../store/notifications.store';

const { width: wp, height: hp } = Dimensions.get('screen');

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconConfig = { name: string; label: string; icon: string };

const TAB_CONFIG: Record<keyof MainTabParamList, TabIconConfig> = {
  HomeTab:        { name: 'HomeTab',        label: 'Inicio',   icon: 'home' },
  // FinancesTab:    { name: 'FinancesTab',    label: 'Finanzas', icon: 'account-balance-wallet' },
  // VisitsTab:      { name: 'VisitsTab',      label: 'Visitas',  icon: 'people' },
  MarketplaceTab: { name: 'MarketplaceTab', label: 'Tienda',   icon: 'store' },
  ProfileTab:     { name: 'ProfileTab',     label: 'Perfil',   icon: 'person' },
};

function TabBarIcon({ iconName, focused, badgeDot, colors }: { iconName: string; focused: boolean; badgeDot?: boolean; colors: any }) {
  return (
    <View style={styles.iconWrapper}>
      <Icon name={iconName} size={24} color={focused ? colors.tabBarActive : colors.tabBarInactive} />
      {badgeDot && (
        <View style={[styles.badge, { backgroundColor: colors.error }]} />
      )}
    </View>
  );
}

export default function MainNavigator() {
  const unreadCount = useNotificationsStore(s => s.unreadCount);
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.tabBarBg, borderTopColor: colors.border }],
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: TAB_CONFIG.HomeTab.label,
          tabBarIcon: ({ focused }) => (
            <TabBarIcon iconName={TAB_CONFIG.HomeTab.icon} focused={focused} badgeDot={unreadCount > 0} colors={colors} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      {/* <Tab.Screen
        name="FinancesTab"
        component={FinancesStack}
        options={{
          tabBarLabel: TAB_CONFIG.FinancesTab.label,
          tabBarIcon: ({ focused }) => <TabBarIcon iconName={TAB_CONFIG.FinancesTab.icon} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="VisitsTab"
        component={VisitsStack}
        options={{
          tabBarLabel: TAB_CONFIG.VisitsTab.label,
          tabBarIcon: ({ focused }) => <TabBarIcon iconName={TAB_CONFIG.VisitsTab.icon} focused={focused} colors={colors} />,
        }}
      /> */}
      <Tab.Screen
        name="MarketplaceTab"
        component={MarketplaceStack}
        options={{
          tabBarLabel: TAB_CONFIG.MarketplaceTab.label,
          tabBarIcon: ({ focused }) => <TabBarIcon iconName={TAB_CONFIG.MarketplaceTab.icon} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: TAB_CONFIG.ProfileTab.label,
          tabBarIcon: ({ focused }) => <TabBarIcon iconName={TAB_CONFIG.ProfileTab.icon} focused={focused} colors={colors} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : SPACING.sm,
    paddingTop: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: { paddingVertical: 2 },
  tabLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium, marginTop: 2 },
  iconWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -8, width: 8, height: 8, borderRadius: 4 },
});
