import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAuthStore } from '../../store/auth.store';
import type { ProfileStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
// Versión enlazada a package.json (se actualiza con `yarn version`).
import { version as APP_VERSION } from '../../../../package.json';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { resident, logout } = useAuthStore();

  const fullName = resident ? `${resident.user.name} ${resident.user.lastName}` : '';

  const menuItems = [
    { id: 'phone',    icon: 'phone',    label: 'Teléfono',           value: resident?.user.phoneNumber, onPress: () => {} },
    { id: 'email',    icon: 'email',    label: 'Correo electrónico', value: resident?.user.email,       onPress: () => {} },
    { id: 'settings', icon: 'settings', label: 'Ajustes',                                               onPress: () => navigation.navigate('Settings') },
  ];

  const dangerItems = [
    { id: 'logout', icon: 'logout', label: 'Cerrar sesión', onPress: logout },
  ];

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Perfil" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <Avatar name={fullName} size="xl" />
          <CustomTextComponent fontSize={FONT_SIZE.xxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary} style={{ marginTop: SPACING.md, marginBottom: 2 }}>
            {fullName}
          </CustomTextComponent>
          {resident?.complex?.name && (
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginBottom: SPACING.xs }}>
              {resident.complex.name}
            </CustomTextComponent>
          )}
          <View style={[styles.unitBadge, { backgroundColor: colors.primarySurface }]}>
            <Icon name="home" size={14} color={colors.primary} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.primary}>
              {resident?.unit.building.name} · Apto {resident?.unit.number}
            </CustomTextComponent>
          </View>
        </View>

        {/* Info */}
        <Card style={styles.section}>
          {menuItems.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: colors.primarySurface }]}>
                  <Icon name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={gs.flex1}>
                  <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary}>
                    {item.label}
                  </CustomTextComponent>
                  {item.value && (
                    <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginTop: 1 }}>
                      {item.value}
                    </CustomTextComponent>
                  )}
                </View>
                <Icon name="chevron-right" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
              {index < menuItems.length - 1 && (
                <View style={[gs.divider, { marginVertical: 0, marginLeft: 52 }]} />
              )}
            </View>
          ))}
        </Card>

        {/* Danger zone */}
        <Card>
          {dangerItems.map(item => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: colors.errorLight }]}>
                <Icon name={item.icon} size={20} color={colors.error} />
              </View>
              <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.error}>
                {item.label}
              </CustomTextComponent>
              <Icon name="chevron-right" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </Card>

        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary} textAlign="center">
          RemoteLink v{APP_VERSION}
        </CustomTextComponent>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  unitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  section: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 52,
    gap: SPACING.sm,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
