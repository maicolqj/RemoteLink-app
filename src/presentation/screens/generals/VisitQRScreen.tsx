import React from 'react';
import { View, StyleSheet, TouchableOpacity, Share, ScrollView } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Button from '../../components/Button';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useAlert } from '../../providers/context/AlertContext';
import type { VisitsStackParamList } from '../../navigation/types/NavigationTypes';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type RouteType = RouteProp<VisitsStackParamList, 'VisitQR'>;

const ID_TYPE_LABEL: Record<string, string> = {
  CC: 'C.C.', CE: 'C.E.', PASSPORT: 'Pasaporte', TI: 'T.I.', FOREIGN_ID: 'ID Extranjero', OTHER: 'Otro',
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
}

export default function VisitQRScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const { showError } = useAlert();

  const { qrToken, visitorName, visitorIdentity, visitorIdentityType, expectedArrivalAt } = route.params;

  const idLabel = visitorIdentityType
    ? `${ID_TYPE_LABEL[visitorIdentityType] ?? visitorIdentityType} ${visitorIdentity ?? ''}`
    : visitorIdentity;

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `Tu código de visita RemoteLink: ${qrToken}\n\n` +
          `Al llegar deberás presentar tu documento de identidad al guardia.\n` +
          `Este código es de un solo uso y expira en 48 horas.`,
        title: 'Código de visita',
      });
    } catch {
      showError('No se pudo compartir el código.');
    }
  };

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Código QR de visita" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}>
        {visitorName && (
          <CustomTextComponent fontSize={FONT_SIZE.xxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary} textAlign="center">
            {visitorName}
          </CustomTextComponent>
        )}
        {expectedArrivalAt && (
          <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textSecondary} textAlign="center">
            {formatDate(expectedArrivalAt)}
          </CustomTextComponent>
        )}

        <View style={[styles.qrContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <QRCode value={qrToken} size={200} color={colors.primary} backgroundColor={colors.surface} />
        </View>

        {/* Identity verification */}
        <View style={[styles.securityBox, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
          <Icon name="verified-user" size={18} color={colors.success} style={{ marginTop: 1 }} />
          <View style={gs.flex1}>
            <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.semibold as any} color={colors.success} style={{ marginBottom: 2 }}>
              Verificación de identidad requerida
            </CustomTextComponent>
            <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={styles.securityText}>
              El guardia solicitará el documento de identidad al ingresar. Solo{' '}
              <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary}>
                {visitorName ?? 'el visitante registrado'}
              </CustomTextComponent>
              {idLabel ? ` (${idLabel})` : ''} podrá usar este código.
            </CustomTextComponent>
          </View>
        </View>

        <View style={[styles.tokenContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <CustomTextComponent fontSize={FONT_SIZE.xs} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textTertiary} style={styles.tokenLabel}>
            CÓDIGO DE ACCESO · UN SOLO USO
          </CustomTextComponent>
          <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={colors.textPrimary} textAlign="center" selectable style={styles.token}>
            {qrToken}
          </CustomTextComponent>
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.primarySurface }]}>
          <Icon name="info-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={[gs.flex1, { lineHeight: 20 }]}>
            Comparte este código con tu visitante. Expira en 48 horas o en la fecha límite configurada.
          </CustomTextComponent>
        </View>

        <Button label="Compartir código" icon="share" onPress={handleShare} fullWidth size="lg" />

        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Visits' as never)}>
          <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ textDecorationLine: 'underline' }}>
            Volver a visitas
          </CustomTextComponent>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
  },
  qrContainer: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    marginVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenContainer: {
    width: '100%',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  tokenLabel: {
    letterSpacing: 0.8,
  },
  token: {
    letterSpacing: 0.5,
  },
  securityBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: '100%',
    borderWidth: 1,
  },
  securityText: {
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: '100%',
  },
  doneBtn: {
    paddingVertical: SPACING.sm,
  },
});
