import type { MovementType, WalletEntryType, PaymentMethod } from '../../domain/responses/FinanceResponseModel';
import { COLORS } from '../constants/colors';

// ─── Movement type display ────────────────────────────────────────────────────

export const MOVEMENT_CONFIG: Record<
  MovementType,
  { label: string; icon: string; color: string; isDebit: boolean }
> = {
  CHARGE: {
    label: 'Cargo',
    icon: 'receipt-long',
    color: COLORS.error,
    isDebit: true,
  },
  PAYMENT: {
    label: 'Pago',
    icon: 'check-circle',
    color: COLORS.success,
    isDebit: false,
  },
  CREDIT: {
    label: 'Crédito',
    icon: 'add-circle',
    color: COLORS.success,
    isDebit: false,
  },
  DEBIT: {
    label: 'Débito',
    icon: 'remove-circle',
    color: COLORS.warning,
    isDebit: true,
  },
  MORA: {
    label: 'Interés de mora',
    icon: 'warning',
    color: COLORS.error,
    isDebit: true,
  },
};

export const WALLET_ENTRY_CONFIG: Record<
  WalletEntryType,
  { label: string; icon: string; color: string }
> = {
  CREDIT: { label: 'Entrada', icon: 'add-circle', color: COLORS.success },
  DEBIT: { label: 'Aplicación', icon: 'remove-circle', color: COLORS.warning },
  ADJUSTMENT: { label: 'Ajuste', icon: 'tune', color: COLORS.info },
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia bancaria',
  PSE: 'PSE',
  CREDIT_CARD: 'Tarjeta crédito',
  DEBIT_CARD: 'Tarjeta débito',
  NEQUI: 'Nequi',
  DAVIPLATA: 'Daviplata',
  OTHER: 'Otro',
};

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatPeriod(period: string): string {
  // period is YYYY-MM
  const [year, month] = period.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

// Generate last N months as YYYY-MM strings for period selector
export function getLastMonths(n: number = 6): { value: string; label: string }[] {
  const result = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({ value, label: formatPeriod(value) });
  }
  return result;
}
