import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, RefreshControl, ScrollView, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomTextComponent from '../../components/CustomTextComponent';
import AppHeader from '../../components/AppHeader';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTheme } from '../../providers/context/ThemeContext';
import { useGlobalStyles } from '../../styles/useGlobalStyles';
import { useFinancesStore } from '../../store/finances.store';
import { useAuthStore } from '../../store/auth.store';
import type { FinancesStackParamList } from '../../navigation/types/NavigationTypes';
import type { AccountMovement, WalletEntry } from '../../store/finances.store';
import { formatCOP, formatDate, getLastMonths, MOVEMENT_CONFIG, WALLET_ENTRY_CONFIG } from '../../utils/finances.utils';
import { SPACING, RADIUS } from '../../constants/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';

type FinancesNavProp = NativeStackNavigationProp<FinancesStackParamList, 'Finances'>;
type TabKey = 'statement' | 'wallet';

const PERIODS = getLastMonths(6);

function StatBox({ value, label, color = 'rgba(255,255,255,0.9)' }: { value: string | number; label: string; color?: string }) {
  return (
    <View style={styles.statBox}>
      <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.bold as any} color={color}>
        {String(value)}
      </CustomTextComponent>
      <CustomTextComponent fontSize={FONT_SIZE.xs} color="rgba(255,255,255,0.65)" textAlign="center" style={{ marginTop: 2 }}>
        {label}
      </CustomTextComponent>
    </View>
  );
}

function SummaryCard() {
  const { colors } = useTheme();
  const balance = useFinancesStore(s => s.balance);
  const statement = useFinancesStore(s => s.statement);
  const isLoading = useFinancesStore(s => s.isLoadingBalance);

  if (isLoading || !balance) {
    return (
      <View style={[styles.summaryCard, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
        <LoadingSpinner color="rgba(255,255,255,0.8)" />
      </View>
    );
  }

  const hasDebt = balance.totalDebt > 0;
  const cardBg = hasDebt ? colors.primary : colors.success;

  return (
    <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
      <CustomTextComponent fontSize={FONT_SIZE.sm} color="rgba(255,255,255,0.8)" style={{ marginBottom: SPACING.xs }}>
        {hasDebt ? 'Deuda total' : 'Al día'}
      </CustomTextComponent>
      <CustomTextComponent fontSize={FONT_SIZE.xxxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textInverse} style={{ marginBottom: SPACING.md }}>
        {formatCOP(balance.totalDebt)}
      </CustomTextComponent>
      <View style={styles.statsRow}>
        <StatBox value={balance.overdueCount} label="Vencidos" color={balance.overdueCount > 0 ? colors.accent : 'rgba(255,255,255,0.8)'} />
        <View style={styles.statDivider} />
        <StatBox value={balance.pendingCount} label="Pendientes" />
        <View style={styles.statDivider} />
        <StatBox value={formatCOP(statement?.walletBalance ?? 0)} label="Saldo a favor" color={(statement?.walletBalance ?? 0) > 0 ? colors.accentLight : 'rgba(255,255,255,0.8)'} />
      </View>
    </View>
  );
}

function MovementRow({ item, onPress }: { item: AccountMovement; onPress: () => void }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const cfg = MOVEMENT_CONFIG[item.type];
  const amount = cfg.isDebit ? item.debit : item.credit;
  const amountColor = cfg.isDebit ? colors.error : colors.success;
  const sign = cfg.isDebit ? '+' : '-';

  return (
    <TouchableOpacity style={[styles.movRow, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.movIcon, { backgroundColor: cfg.color + '18' }]}>
        <Icon name={cfg.icon} size={20} color={cfg.color} />
      </View>
      <View style={gs.flex1}>
        <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary} numberOfLines={1} style={{ marginBottom: 2 }}>
          {item.description}
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
          {formatDate(item.date)}
        </CustomTextComponent>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {amount > 0 && (
          <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={amountColor} style={{ marginBottom: 2 }}>
            {sign} {formatCOP(amount)}
          </CustomTextComponent>
        )}
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
          Saldo: {formatCOP(item.balance)}
        </CustomTextComponent>
      </View>
    </TouchableOpacity>
  );
}

function WalletEntryRow({ item }: { item: WalletEntry }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const cfg = WALLET_ENTRY_CONFIG[item.type];

  return (
    <View style={[styles.movRow, { backgroundColor: colors.surface }]}>
      <View style={[styles.movIcon, { backgroundColor: cfg.color + '18' }]}>
        <Icon name={cfg.icon} size={20} color={cfg.color} />
      </View>
      <View style={gs.flex1}>
        <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.textPrimary} numberOfLines={1} style={{ marginBottom: 2 }}>
          {item.description}
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary}>
          {formatDate(item.createdAt)}
        </CustomTextComponent>
      </View>
      <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.semibold as any} color={item.type === 'CREDIT' ? colors.success : colors.warning}>
        {item.type === 'CREDIT' ? '+' : '-'} {formatCOP(item.amount)}
      </CustomTextComponent>
    </View>
  );
}

function TotalRow({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <CustomTextComponent fontSize={FONT_SIZE.md} fontWeight={FONT_WEIGHT.bold as any} color={colors.textPrimary}>
        {formatCOP(value)}
      </CustomTextComponent>
      <CustomTextComponent fontSize={FONT_SIZE.xs} color={color} style={{ marginTop: 2 }}>
        {label}
      </CustomTextComponent>
    </View>
  );
}

function TabBtn({ label, active, onPress, badge }: { label: string; active: boolean; onPress: () => void; badge?: string }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.tabBtn, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}>
      <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={active ? colors.textInverse : colors.textSecondary}>
        {label}
      </CustomTextComponent>
      {badge && (
        <View style={[styles.tabBadge, { backgroundColor: colors.accentLight }]}>
          <CustomTextComponent fontSize={10} fontWeight={FONT_WEIGHT.bold as any} color={colors.accent}>
            {badge}
          </CustomTextComponent>
        </View>
      )}
    </TouchableOpacity>
  );
}

function StatementList({ statement, navigation, onLoadMore, visibleCount }: {
  statement: ReturnType<typeof useFinancesStore.getState>['statement'];
  navigation: FinancesNavProp;
  onLoadMore: () => void;
  visibleCount: number;
}) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();

  // The backend returns every movement of the period already sorted newest→oldest;
  // pagination is client-side, so we just reveal a growing slice. Each row carries
  // its own running-balance snapshot, so order is presentation-only.
  const allMovements = statement?.movements ?? [];
  const movements = allMovements.slice(0, visibleCount);
  const totalMovements = allMovements.length;
  const hasMore = visibleCount < totalMovements;

  if (!statement) return <EmptyState icon="receipt-long" title="Sin movimientos" description="Tu estado de cuenta aparecerá aquí." />;

  return (
    <View>
      <Card style={styles.totalsCard}>
        <View style={gs.rowBetween}>
          <TotalRow label="Total cargos" value={statement.totalDebits} color={colors.error} />
          <TotalRow label="Total pagos" value={statement.totalCredits} color={colors.success} />
          <TotalRow label="Saldo actual" value={statement.currentBalance} color={statement.currentBalance > 0 ? colors.error : colors.success} />
        </View>
      </Card>
      {movements.length === 0 ? (
        <EmptyState icon="receipt" title="Sin movimientos" description="No hay movimientos en este período." />
      ) : (
        <View>
          {movements.map(mov => (
            <React.Fragment key={mov.id}>
              <MovementRow item={mov} onPress={() => navigation.navigate('PaymentDetail', { movementId: mov.id })} />
              <View style={[gs.divider, { marginVertical: 0, marginLeft: 64 }]} />
            </React.Fragment>
          ))}

          {hasMore ? (
            <TouchableOpacity
              onPress={onLoadMore}
              activeOpacity={0.8}
              style={[styles.loadMoreBtn, { borderColor: colors.border }]}>
              <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={colors.primary}>
                Cargar más
              </CustomTextComponent>
            </TouchableOpacity>
          ) : (
            <CustomTextComponent fontSize={FONT_SIZE.xs} color={colors.textTertiary} style={styles.endOfList}>
              {`${totalMovements} ${totalMovements === 1 ? 'movimiento' : 'movimientos'}`}
            </CustomTextComponent>
          )}

          <View style={gs.spacerLg} />
        </View>
      )}
    </View>
  );
}

function WalletList({ wallet }: { wallet: ReturnType<typeof useFinancesStore.getState>['wallet'] }) {
  const { colors } = useTheme();
  const gs = useGlobalStyles();

  if (!wallet) return <EmptyState icon="account-balance-wallet" title="Sin saldo a favor" description="Tu saldo disponible aparecerá aquí." />;

  return (
    <View>
      <View style={[styles.walletCard, { backgroundColor: colors.success }]}>
        <CustomTextComponent fontSize={FONT_SIZE.sm} color="rgba(255,255,255,0.8)" style={{ marginBottom: SPACING.xs }}>
          Saldo disponible
        </CustomTextComponent>
        <CustomTextComponent fontSize={FONT_SIZE.xxxl} fontWeight={FONT_WEIGHT.bold as any} color={colors.textInverse} style={{ marginBottom: SPACING.md }}>
          {formatCOP(wallet.currentBalance)}
        </CustomTextComponent>
        <View style={styles.statsRow}>
          <StatBox value={formatCOP(wallet.totalCredits)} label="Total entradas" />
          <View style={styles.statDivider} />
          <StatBox value={formatCOP(wallet.totalDebits)} label="Total aplicados" />
        </View>
      </View>
      {wallet.entries.length === 0 ? (
        <EmptyState icon="history" title="Sin movimientos" description="No hay movimientos en tu saldo a favor." />
      ) : (
        <View>
          {wallet.entries.map(entry => (
            <React.Fragment key={entry.id}>
              <WalletEntryRow item={entry} />
              <View style={[gs.divider, { marginVertical: 0, marginLeft: 64 }]} />
            </React.Fragment>
          ))}
          <View style={gs.spacerLg} />
        </View>
      )}
    </View>
  );
}

export default function FinancesScreen() {
  const navigation = useNavigation<FinancesNavProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gs = useGlobalStyles();
  const resident = useAuthStore(s => s.resident);
  const {
    statement, statementVisibleCount, wallet, isLoadingStatement, isLoadingWallet,
    fetchBalance, fetchStatement, fetchMoreStatement, fetchWallet,
  } = useFinancesStore();

  const [activeTab, setActiveTab] = useState<TabKey>('statement');
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!resident) return;
    const unitId = resident.unit.id;
    const complexId = resident.complex.id;
    // Statement honors the selected period chip; balance/wallet are period-agnostic.
    await Promise.all([
      fetchBalance(unitId, complexId),
      fetchStatement(unitId, complexId, selectedPeriod),
      fetchWallet(unitId, complexId),
    ]);
  }, [resident, selectedPeriod, fetchBalance, fetchStatement, fetchWallet]);

  // Re-runs on mount and whenever selectedPeriod changes (load identity depends on it).
  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const isLoading = activeTab === 'statement' ? isLoadingStatement : isLoadingWallet;

  const loadMore = useCallback(() => {
    if (!resident) return;
    fetchMoreStatement(resident.unit.id, resident.complex.id, selectedPeriod);
  }, [resident, selectedPeriod, fetchMoreStatement]);

  // Auto-load the next page when the user scrolls near the bottom (statement tab).
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (activeTab !== 'statement') return;
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 320;
    if (nearBottom) loadMore();
  }, [activeTab, loadMore]);

  return (
    <View style={[gs.screen, { paddingTop: insets.top }]}>
      <AppHeader title="Finanzas" showBack onBack={() => navigation.goBack()} subtitle={resident ? `${resident.unit.building.name} · Apto ${resident.unit.number}` : undefined} />

      <ScrollView
        style={gs.flex1}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>

        <SummaryCard />

        <View style={styles.tabBar}>
          <TabBtn label="Estado de cuenta" active={activeTab === 'statement'} onPress={() => setActiveTab('statement')} />
          <TabBtn label="Saldo a favor" active={activeTab === 'wallet'} onPress={() => setActiveTab('wallet')} badge={(wallet?.currentBalance ?? 0) > 0 ? formatCOP(wallet?.currentBalance ?? 0) : undefined} />
        </View>

        {activeTab === 'statement' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodBar}>
            <TouchableOpacity
              style={[styles.periodChip, { backgroundColor: !selectedPeriod ? colors.primarySurface : colors.surface, borderColor: !selectedPeriod ? colors.primary : colors.border }]}
              onPress={() => setSelectedPeriod(undefined)}>
              <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={!selectedPeriod ? colors.primary : colors.textSecondary}>
                Todos
              </CustomTextComponent>
            </TouchableOpacity>
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p.value}
                style={[styles.periodChip, { backgroundColor: selectedPeriod === p.value ? colors.primarySurface : colors.surface, borderColor: selectedPeriod === p.value ? colors.primary : colors.border }]}
                onPress={() => setSelectedPeriod(p.value)}>
                <CustomTextComponent fontSize={FONT_SIZE.sm} fontWeight={FONT_WEIGHT.medium as any} color={selectedPeriod === p.value ? colors.primary : colors.textSecondary}>
                  {p.label}
                </CustomTextComponent>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {isLoading ? <LoadingSpinner fullScreen /> : activeTab === 'statement' ? <StatementList statement={statement} navigation={navigation} onLoadMore={loadMore} visibleCount={statementVisibleCount} /> : <WalletList wallet={wallet} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  tabBadge: {
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  periodBar: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  periodChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  movRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    minHeight: 60,
  },
  movIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalsCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  walletCard: {
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderRadius: RADIUS.full,
  },
  endOfList: {
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
});
