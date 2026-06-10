// ─── Enums ────────────────────────────────────────────────────────────────────

export type ChargeStatus =
  | 'PENDING'
  | 'OVERDUE'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'CANCELLED'
  | 'WAIVED';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'PSE'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'NEQUI'
  | 'DAVIPLATA'
  | 'OTHER';

export type MovementType = 'CHARGE' | 'PAYMENT' | 'CREDIT' | 'DEBIT' | 'MORA';

export type WalletEntryType = 'CREDIT' | 'DEBIT' | 'ADJUSTMENT';

// ─── Unit Balance ─────────────────────────────────────────────────────────────

export interface UnitBalanceResponse {
  unitId: string;
  unitNumber: string;
  totalDebt: number;
  overdueCount: number;
  pendingCount: number;
  totalPaid: number;
}

// ─── Account Statement ────────────────────────────────────────────────────────

export interface AccountMovement {
  id: string;
  date: string;
  type: MovementType;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string | null;
}

export interface UnitAccountStatementResponse {
  unitId: string;
  unitNumber: string;
  building: string | null;
  totalDebits: number;
  totalCredits: number;
  currentBalance: number;
  walletBalance: number;
  movements: AccountMovement[];
}

// ─── Payments by Charge ───────────────────────────────────────────────────────

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  receiptUrl: string | null;
  paidAt: string;
  notes: string | null;
  isReversed: boolean;
  reversalReason: string | null;
  reversedAt: string | null;
  createdAt: string;
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface WalletEntry {
  id: string;
  type: WalletEntryType;
  amount: number;
  description: string;
  chargeId: string | null;
  createdAt: string;
}

export interface UnitWalletResponse {
  unitId: string;
  unitNumber: string;
  building: string | null;
  currentBalance: number;
  totalCredits: number;
  totalDebits: number;
  entries: WalletEntry[];
}
