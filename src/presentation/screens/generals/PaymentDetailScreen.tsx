import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useFinancesStore } from '../../store/finances.store';
import type { FinancesStackParamList } from '../../navigation/types/NavigationTypes';
import { formatCOP, formatDate, MOVEMENT_CONFIG } from '../../utils/finances.utils';
import { SPACING } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type RouteType = RouteProp<FinancesStackParamList, 'PaymentDetail'>;

function DetailRow({ label, value, mono = false, colors }: { label: string; value: string; mono?: boolean; colors: any }) {
  return (
    <View style={styles.detailRow}>
      <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary}>
        {label}
      </CustomTextComponent>
      <CustomTextComponent
        fontSize={mono ? FONT_SIZE.xs : FONT_SIZE.sm}
        fontWeight={mono ? undefined : (FONT_WEIGHT.medium as any)}
        color={mono ? colors.textSecondary : colors.textPrimary}
        numberOfLines={2}
        style={styles.detailValue}>
        {value}
      </CustomTextComponent>
    </View>
  );
}

export default function PaymentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const statement = useFinancesStore(s => s.statement);

  const movement = statement?.movements.find(m => m.id === route.params.movementId);
  const cfg = movement ? MOVEMENT_CONFIG[movement.type] : null;

  if (!movement || !cfg) {
    return (
      <View style={[gs.screen, { paddingTop: insets.top }]}>
        <AppHeader title="Detalle" showBack onBack={() => navigation.goBack()} />
        <View style={[gs.flex1, gs.center]}>
          <Icon name="error-outline" size={48} color={colors.textTertiary} />
          <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textSecondary} style={{ marginTop: SPACING.sm }}>
            Movimiento no encontrado
          </CustomTextComponent>
        </View>
      </View>
    );
  }

  const mainAmount = cfg.isDebit ? movement.debit : movement.credit;
  const amountColor = cfg.isDebit ? colors.error : colors.success;

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Detalle de movimiento" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card elevated style={styles.heroCard}>
          <View style={[styles.typeIcon, { backgroundColor: cfg.color + '20' }]}>
            <Icon name={cfg.icon} size={32} color={cfg.color} />
          </View>
          <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.textSecondary} style={{ marginBottom: SPACING.xs }}>
            {cfg.label}
          </CustomTextComponent>
          {mainAmount > 0 && (
            <CustomTextComponent fontSize={FONT_SIZE.xxxl} fontWeight={FONT_WEIGHT.bold as any} color={amountColor} style={{ marginBottom: SPACING.xs }}>
              {cfg.isDebit ? '+' : '-'} {formatCOP(mainAmount)}
            </CustomTextComponent>
          )}
          <CustomTextComponent fontSize={FONT_SIZE.md} color={colors.textPrimary} textAlign="center">
            {movement.description}
          </CustomTextComponent>
        </Card>

        <Card>
          <DetailRow label="Fecha" value={formatDate(movement.date)} colors={colors} />
          <View style={[gs.divider, { marginVertical: SPACING.xs }]} />
          <DetailRow label="Tipo" value={cfg.label} colors={colors} />
          {movement.debit > 0 && (
            <>
              <View style={[gs.divider, { marginVertical: SPACING.xs }]} />
              <DetailRow label="Cargo" value={formatCOP(movement.debit)} colors={colors} />
            </>
          )}
          {movement.credit > 0 && (
            <>
              <View style={[gs.divider, { marginVertical: SPACING.xs }]} />
              <DetailRow label="Abono" value={formatCOP(movement.credit)} colors={colors} />
            </>
          )}
          <View style={[gs.divider, { marginVertical: SPACING.xs }]} />
          <DetailRow label="Saldo acumulado" value={formatCOP(movement.balance)} colors={colors} />
          {movement.reference && (
            <>
              <View style={[gs.divider, { marginVertical: SPACING.xs }]} />
              <DetailRow label="Referencia" value={movement.reference} mono colors={colors} />
            </>
          )}
          <View style={[gs.divider, { marginVertical: SPACING.xs }]} />
          <DetailRow label="ID" value={movement.id.slice(0, 8).toUpperCase()} mono colors={colors} />
        </Card>

        <Card style={styles.balanceCard}>
          <View style={gs.rowBetween}>
            <View>
              <CustomTextComponent fontSize={FONT_SIZE.sm} color={colors.textSecondary} style={{ marginBottom: 4 }}>
                Saldo después de este movimiento
              </CustomTextComponent>
              <CustomTextComponent fontSize={FONT_SIZE.xxl} fontWeight={FONT_WEIGHT.bold as any} color={movement.balance > 0 ? colors.error : colors.success}>
                {formatCOP(movement.balance)}
              </CustomTextComponent>
            </View>
            <Icon
              name={movement.balance > 0 ? 'trending-up' : 'trending-down'}
              size={32}
              color={movement.balance > 0 ? colors.error : colors.success}
            />
          </View>
          <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary} style={{ marginTop: SPACING.xs }}>
            {movement.balance > 0
              ? 'Saldo deudor — tienes deuda pendiente'
              : movement.balance < 0
              ? 'Saldo a favor — el conjunto te debe'
              : 'Sin saldo pendiente'}
          </CustomTextComponent>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },
  heroCard: { alignItems: 'center', paddingVertical: SPACING.xl },
  typeIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: SPACING.xs, gap: SPACING.md },
  detailValue: { flex: 1, textAlign: 'right' },
  balanceCard: { gap: SPACING.xs },
});
