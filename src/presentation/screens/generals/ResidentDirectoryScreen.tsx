import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomInputComponent from '../../components/CustomInputComponent';
import AppHeader from '../../components/AppHeader';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import type { ProfileStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList, 'ResidentDirectory'>;

const MOCK_RESIDENTS = [
  { id: '1', name: 'Carlos', lastName: 'Mendoza', unit: '502', tower: 'A' },
  { id: '2', name: 'Ana', lastName: 'García', unit: '301', tower: 'A' },
  { id: '3', name: 'Luis', lastName: 'Torres', unit: '204', tower: 'B' },
  { id: '4', name: 'María', lastName: 'López', unit: '601', tower: 'A' },
  { id: '5', name: 'Pedro', lastName: 'Ramírez', unit: '103', tower: 'B' },
];

type Resident = typeof MOCK_RESIDENTS[0];

function ResidentRow({ resident, onPress }: { resident: Resident; onPress: () => void }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  return (
    <TouchableOpacity style={[styles.row, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.75}>
      <Avatar name={`${resident.name} ${resident.lastName}`} size="md" />
      <View style={gs.flex1}>
        <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary} style={{ marginBottom: 2 }}>
          {resident.name} {resident.lastName}
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
          Torre {resident.tower} · Apto {resident.unit}
        </CustomTextComponent>
      </View>
      <Icon name="chevron-right" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function ResidentDirectoryScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const [search, setSearch] = useState('');

  const filtered = MOCK_RESIDENTS.filter(r =>
    `${r.name} ${r.lastName} ${r.unit}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Directorio" showBack onBack={() => navigation.goBack()} />

      <View style={styles.searchContainer}>
        <CustomInputComponent
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar residente..."
          leftIcon={{ name: 'search', color: colors.textTertiary }}
          rightIcon={search.length > 0 ? { name: 'close', color: colors.textTertiary, onPress: () => setSearch('') } : undefined}
          variant="outlined"
          marginBottom={0}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ResidentRow
            resident={item}
            onPress={() => navigation.navigate('ResidentDetail', { residentId: item.id })}
          />
        )}
        contentContainerStyle={filtered.length === 0 ? gs.flex1 : styles.list}
        ListEmptyComponent={
          <EmptyState icon="people" title="Sin resultados" description="No se encontraron residentes con ese nombre." />
        }
        ItemSeparatorComponent={() => (
          <View style={[gs.divider, { marginVertical: 0, marginLeft: SPACING.md + 40 + SPACING.sm }]} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  list: { paddingBottom: SPACING.xxl },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm, minHeight: 64 },
});
