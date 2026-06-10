import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import type { ProfileStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type RouteType = RouteProp<ProfileStackParamList, 'ResidentDetail'>;

const MOCK_RESIDENTS: Record<string, { id: string; name: string; lastName: string; unit: string; tower: string; phone?: string }> = {
  '1': { id: '1', name: 'Carlos', lastName: 'Mendoza', unit: '502', tower: 'A', phone: '+57 300 123 4567' },
  '2': { id: '2', name: 'Ana', lastName: 'García', unit: '301', tower: 'A' },
  '3': { id: '3', name: 'Luis', lastName: 'Torres', unit: '204', tower: 'B' },
  '4': { id: '4', name: 'María', lastName: 'López', unit: '601', tower: 'A' },
  '5': { id: '5', name: 'Pedro', lastName: 'Ramírez', unit: '103', tower: 'B' },
};

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={20} color={colors.primary} style={styles.infoIcon} />
      <View>
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
          {label}
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary} style={{ marginTop: 1 }}>
          {value}
        </CustomTextComponent>
      </View>
    </View>
  );
}

export default function ResidentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const resident = MOCK_RESIDENTS[route.params.residentId];

  if (!resident) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Residente" showBack onBack={() => navigation.goBack()} />
        <View style={[gs.flex1, gs.center]}>
          <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textSecondary}>
            Residente no encontrado
          </CustomTextComponent>
        </View>
      </View>
    );
  }

  const fullName = `${resident.name} ${resident.lastName}`;

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Residente" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Avatar name={fullName} size="xl" />
          <CustomTextComponent fontSize={FONT_SIZE.xxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary} style={{ marginTop: SPACING.md, marginBottom: SPACING.xs }}>
            {fullName}
          </CustomTextComponent>
          <View style={styles.unitRow}>
            <Icon name="home" size={14} color={colors.primary} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.primary}>
              Torre {resident.tower} · Apto {resident.unit}
            </CustomTextComponent>
          </View>
        </View>

        <Card>
          <InfoRow icon="home" label="Torre" value={`Torre ${resident.tower}`} colors={colors} />
          <View style={[gs.divider, { marginVertical: 0, marginLeft: 48 }]} />
          <InfoRow icon="meeting-room" label="Apartamento" value={resident.unit} colors={colors} />
          {resident.phone && (
            <>
              <View style={[gs.divider, { marginVertical: 0, marginLeft: 48 }]} />
              <InfoRow icon="phone" label="Teléfono" value={resident.phone} colors={colors} />
            </>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },
  hero: { alignItems: 'center', paddingVertical: SPACING.xl },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.sm },
  infoIcon: { width: 28, textAlign: 'center' },
});
