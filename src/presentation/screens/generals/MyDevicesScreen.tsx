import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import {
  fetchMyDevices,
  revokeDevice,
  setDevicePinLinked,
  type ResidentDevice,
  type DeviceAuthError,
} from '../../../infraestructure/services/deviceAuth.service';
import { getDeviceId } from '../../../infraestructure/services/DeviceIdService';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

const formatDate = (iso?: string | null): string => {
  if (!iso) return 'Nunca';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isLocked = (lockedUntil?: string | null): boolean =>
  !!lockedUntil && new Date(lockedUntil).getTime() > Date.now();

export default function MyDevicesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { showQuestion, showError, showSuccess } = useAlert();

  const [devices, setDevices] = useState<ResidentDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [list, deviceId] = await Promise.all([fetchMyDevices(), getDeviceId()]);
      setDevices(list);
      setCurrentDeviceId(deviceId);
      setError('');
    } catch (e) {
      setError((e as DeviceAuthError).message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmRevoke = useCallback((device: ResidentDevice) => {
    const isCurrent = device.deviceId === currentDeviceId;
    showQuestion(
      isCurrent
        ? 'Vas a desvincular ESTE dispositivo: se cerrará tu sesión aquí y tendrás que ingresar con documento y código.'
        : `Se cerrará la sesión de "${device.label ?? 'ese dispositivo'}". Tus otros dispositivos siguen funcionando.`,
      'Desvincular dispositivo',
      {
        buttons: [
          { text: 'Cancelar', style: 'secondary', onPress: () => {} },
          {
            text: 'Desvincular',
            style: 'danger',
            onPress: async () => {
              setRevokingId(device.id);
              try {
                // El backend recibe el `id` del registro, no el `deviceId`.
                await revokeDevice(device.id);
                if (isCurrent) await setDevicePinLinked(false);
                setDevices(prev => prev.filter(d => d.id !== device.id));
                showSuccess('Dispositivo desvinculado.', 'Listo');
              } catch (e) {
                showError((e as DeviceAuthError).message);
              } finally {
                setRevokingId(null);
              }
            },
          },
        ],
      },
    );
  }, [currentDeviceId, showQuestion, showError, showSuccess]);

  const renderItem = useCallback(({ item }: { item: ResidentDevice }) => {
    const isCurrent = item.deviceId === currentDeviceId;
    const locked = isLocked(item.lockedUntil);

    return (
      <Card style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
            <Icon
              name={item.platform?.toUpperCase() === 'IOS' ? 'phone-iphone' : 'phone-android'}
              size={20}
              color={colors.primary}
            />
          </View>

          <View style={styles.info}>
            <View style={styles.titleRow}>
              <CustomTextComponent
                fontSize={FONT_SIZE.md}
                fontWeight={FONT_WEIGHT.medium}
                color={colors.textPrimary}>
                {item.label ?? 'Dispositivo sin nombre'}
              </CustomTextComponent>
              {isCurrent ? (
                <View style={[styles.badge, { backgroundColor: colors.successLight }]}>
                  <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.success}>
                    Este equipo
                  </CustomTextComponent>
                </View>
              ) : null}
            </View>

            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
              Último uso: {formatDate(item.lastUsedAt)} · Vinculado: {formatDate(item.createdAt)}
            </CustomTextComponent>

            {locked ? (
              <View style={styles.lockRow}>
                <Icon name="lock-clock" size={14} color={colors.error} />
                <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.error}>
                  Bloqueado por intentos fallidos
                </CustomTextComponent>
              </View>
            ) : null}
          </View>

          {revokingId === item.id ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <TouchableOpacity
              onPress={() => confirmRevoke(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Desvincular ${item.label ?? 'dispositivo'}`}>
              <Icon name="link-off" size={ICON_SIZE.md} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  }, [colors, currentDeviceId, revokingId, confirmRevoke]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Dispositivos vinculados" showBack onBack={() => navigation.goBack()} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={d => d.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.xl }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { setIsRefreshing(true); load(); }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            error ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.error + '14', borderColor: colors.error + '40' }]}>
                <Icon name="error-outline" size={ICON_SIZE.sm} color={colors.error} />
                <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.error} style={styles.flexText}>
                  {error}
                </CustomTextComponent>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="devices"
              title="Sin dispositivos vinculados"
              description="Cuando crees un PIN en un dispositivo, aparecerá aquí y podrás desvincularlo cuando quieras."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: {
    padding: SPACING.md,
    gap: SPACING.sm,
    flexGrow: 1,
  },
  card: { padding: SPACING.md },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  flexText: { flex: 1 },
});
