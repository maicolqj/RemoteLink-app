import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import CustomButtonComponent from '../../components/CustomButtonComponent';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import { useTheme } from '../../providers/context/ThemeContext';
import { useAlert } from '../../providers/context/AlertContext';
import type { RootStackParamList } from '../../navigation/types/NavigationTypes';
import {
  fetchPendingDeviceApprovals,
  approveDeviceApproval,
  denyDeviceApproval,
  type PendingDeviceApproval,
  type DeviceAuthError,
} from '../../../infraestructure/services/deviceAuth.service';
import { SPACING, RADIUS, ICON_SIZE } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type Route = RouteProp<RootStackParamList, 'ApproveDevice'>;

const secondsUntil = (iso?: string): number => {
  if (!iso) return 0;
  const diff = Math.floor((new Date(iso).getTime() - Date.now()) / 1000);
  return diff > 0 ? diff : 0;
};

const formatMMSS = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

/**
 * Pantalla del dispositivo confiable. La comparación de códigos es la ÚNICA
 * defensa contra un atacante que dispare la solicitud con un documento ajeno:
 * puede provocar la notificación, pero no puede hacer que el código de SU
 * pantalla aparezca aquí. Por eso el botón de aprobar permanece deshabilitado
 * hasta que el residente confirma explícitamente que los códigos coinciden —
 * nunca degradar esto a un «¿Permitir? Sí / No».
 */
export default function ApproveDeviceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { showSuccess, showError } = useAlert();

  const fromPush: PendingDeviceApproval | null = route.params?.approvalId && route.params?.approvalCode
    ? {
        approvalId: route.params.approvalId,
        approvalCode: route.params.approvalCode,
        requestedFromLabel: route.params.requestedFromLabel,
        requestedFromIp: route.params.requestedFromIp,
        expiresAt: route.params.expiresAt ?? '',
        createdAt: new Date().toISOString(),
      }
    : null;

  const [approval, setApproval] = useState<PendingDeviceApproval | null>(fromPush);
  const [isLoading, setIsLoading] = useState(!fromPush);
  const [codesMatch, setCodesMatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(secondsUntil(fromPush?.expiresAt));
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { countdownRef.current && clearInterval(countdownRef.current); }, []);

  // Respaldo para cuando el push no llega (o llega sin metadata usable).
  useEffect(() => {
    if (fromPush) return;
    let cancelled = false;
    fetchPendingDeviceApprovals()
      .then(list => {
        if (cancelled) return;
        setApproval(list[0] ?? null);
        setRemaining(secondsUntil(list[0]?.expiresAt));
      })
      .catch(() => { if (!cancelled) setApproval(null); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!approval?.expiresAt) return;
    countdownRef.current && clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { countdownRef.current && clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { countdownRef.current && clearInterval(countdownRef.current); };
  }, [approval?.expiresAt]);

  const resolve = useCallback(async (action: 'approve' | 'deny') => {
    if (!approval) return;
    setIsSubmitting(true);
    try {
      if (action === 'approve') {
        await approveDeviceApproval(approval.approvalId);
        showSuccess('El otro dispositivo ya puede entrar a tu cuenta.', 'Ingreso aprobado');
      } else {
        await denyDeviceApproval(approval.approvalId);
        showSuccess('El intento de ingreso fue rechazado.', 'Ingreso rechazado');
      }
      navigation.goBack();
    } catch (e) {
      const err = e as DeviceAuthError;
      setIsSubmitting(false);
      showError(err.message, err.code === 'APPROVAL_ALREADY_RESOLVED' ? 'Ya resuelta' : 'No se pudo completar');
      if (err.code === 'APPROVAL_ALREADY_RESOLVED' || err.code === 'APPROVAL_EXPIRED' || err.code === 'APPROVAL_NOT_FOUND') {
        navigation.goBack();
      }
    }
  }, [approval, navigation, showSuccess, showError]);

  const expired = !!approval && remaining === 0 && !!approval.expiresAt;
  const canApprove = codesMatch && !isSubmitting && !expired;

  if (isLoading) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Solicitud de ingreso" showBack onBack={() => navigation.goBack()} />

      {!approval ? (
        <EmptyState
          icon="verified-user"
          title="Sin solicitudes pendientes"
          description="No hay ningún dispositivo esperando tu aprobación."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
          showsVerticalScrollIndicator={false}>

          <View style={[styles.alert, { backgroundColor: colors.errorLight, borderColor: colors.error }]}>
            <Icon name="warning-amber" size={ICON_SIZE.sm} color={colors.error} />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={styles.flexText}>
              Alguien está intentando entrar a tu cuenta. Aprueba solo si eres tú y el código de
              abajo es idéntico al que ves en el otro dispositivo.
            </CustomTextComponent>
          </View>

          <View style={[styles.codeCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary} textAlign="center">
              CÓDIGO DE LA SOLICITUD
            </CustomTextComponent>
            <CustomTextComponent
              fontSize={44}
              fontWeight={FONT_WEIGHT.bold}
              color={colors.primary}
              textAlign="center"
              style={styles.code}>
              {approval.approvalCode}
            </CustomTextComponent>
            {approval.expiresAt ? (
              <CustomTextComponent
                fontSize={FONT_SIZE.xs}
                color={expired ? colors.error : colors.textSecondary}
                textAlign="center">
                {expired ? 'La solicitud venció' : `Vence en ${formatMMSS(remaining)}`}
              </CustomTextComponent>
            ) : null}
          </View>

          {/* Origen: equipo e IP. Sin esto el residente no puede juzgar el intento. */}
          <View style={[styles.originCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.originRow}>
              <Icon name="devices" size={ICON_SIZE.sm} color={colors.textSecondary} />
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                Equipo
              </CustomTextComponent>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                fontWeight={FONT_WEIGHT.medium}
                color={colors.textPrimary}
                style={styles.originValue}>
                {approval.requestedFromLabel ?? 'Desconocido'}
              </CustomTextComponent>
            </View>
            <View style={styles.originRow}>
              <Icon name="public" size={ICON_SIZE.sm} color={colors.textSecondary} />
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
                Dirección IP
              </CustomTextComponent>
              <CustomTextComponent
                fontSize={FONT_SIZE.sm}
                fontWeight={FONT_WEIGHT.medium}
                color={colors.textPrimary}
                style={styles.originValue}>
                {approval.requestedFromIp ?? 'Desconocida'}
              </CustomTextComponent>
            </View>
          </View>

          {/* Confirmación explícita: sin esto, aprobar queda deshabilitado. */}
          <TouchableOpacity
            style={[
              styles.checkRow,
              {
                backgroundColor: codesMatch ? colors.primarySurface : colors.surface,
                borderColor: codesMatch ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setCodesMatch(v => !v)}
            disabled={isSubmitting || expired}
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: codesMatch }}>
            <Icon
              name={codesMatch ? 'check-box' : 'check-box-outline-blank'}
              size={22}
              color={codesMatch ? colors.primary : colors.textTertiary}
            />
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textPrimary} style={styles.flexText}>
              Confirmo que el código {approval.approvalCode} es el mismo que veo en el otro dispositivo
            </CustomTextComponent>
          </TouchableOpacity>

          <CustomButtonComponent
            text="Aprobar ingreso"
            onPress={() => resolve('approve')}
            isLoading={isSubmitting}
            disabled={!canApprove}
            loaderColor="#FFFFFF"
            style={[styles.primaryBtn, { backgroundColor: canApprove ? colors.primary : colors.border }]}
            textStyle={{
              color: canApprove ? colors.textInverse : colors.textTertiary,
              fontSize: FONT_SIZE.md,
              fontWeight: FONT_WEIGHT.semibold,
            }}
            iconLeft={canApprove ? { name: 'check-circle', type: 'material', size: 18, color: colors.textInverse } : undefined}
          />

          <CustomButtonComponent
            text="No fui yo · Rechazar"
            onPress={() => resolve('deny')}
            disabled={isSubmitting}
            style={[styles.secondaryBtn, { borderColor: colors.error }]}
            textStyle={{ color: colors.error, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold }}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  flexText: {
    flex: 1,
    lineHeight: FONT_SIZE.sm * 1.45,
  },
  codeCard: {
    gap: SPACING.xs,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
  },
  code: {
    letterSpacing: 10,
  },
  originCard: {
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  originValue: {
    flex: 1,
    textAlign: 'right',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  primaryBtn: {
    borderRadius: RADIUS.md,
    minHeight: 52,
  },
  secondaryBtn: {
    borderRadius: RADIUS.md,
    minHeight: 52,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
});
