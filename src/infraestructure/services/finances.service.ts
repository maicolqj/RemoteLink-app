import apolloClient from '../../data/lib/apollo/client';
import {
  GET_UNIT_BALANCE,
  GET_UNIT_ACCOUNT_STATEMENT,
  GET_PAYMENTS_BY_CHARGE,
  GET_UNIT_WALLET,
} from '../../domain/graphql/finances.queries';
import type {
  UnitBalanceResponse,
  UnitAccountStatementResponse,
  Payment,
  UnitWalletResponse,
} from '../../domain/responses/FinanceResponseModel';

export async function fetchUnitBalance(unitId: string, complexId: string): Promise<UnitBalanceResponse> {
  const { data } = await apolloClient.query<{ unitBalance: UnitBalanceResponse }>({
    query: GET_UNIT_BALANCE,
    variables: { unitId, complexId },
  });
  return data.unitBalance;
}

export async function fetchUnitAccountStatement(
  unitId: string,
  complexId: string,
  period?: string,
): Promise<UnitAccountStatementResponse> {
  const { data } = await apolloClient.query<{ unitAccountStatement: UnitAccountStatementResponse }>({
    query: GET_UNIT_ACCOUNT_STATEMENT,
    variables: { unitId, complexId, ...(period ? { period } : {}) },
  });
  return data.unitAccountStatement;
}

export async function fetchPaymentsByCharge(chargeId: string): Promise<Payment[]> {
  const { data } = await apolloClient.query<{ paymentsByCharge: Payment[] }>({
    query: GET_PAYMENTS_BY_CHARGE,
    variables: { chargeId },
  });
  return data.paymentsByCharge;
}

export async function fetchUnitWallet(unitId: string, complexId: string): Promise<UnitWalletResponse> {
  const { data } = await apolloClient.query<{ unitWallet: UnitWalletResponse }>({
    query: GET_UNIT_WALLET,
    variables: { unitId, complexId },
  });
  return data.unitWallet;
}
