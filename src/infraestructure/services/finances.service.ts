import apolloClient from '../../data/lib/apollo/client';
import {
  GET_UNIT_BALANCE,
  GET_UNIT_ACCOUNT_STATEMENT,
  GET_PAYMENTS_BY_CHARGE,
  GET_UNIT_WALLET,
} from '../../domain/graphql/finances.queries';
import { getApiErrorMessage } from '../utils/apiError';
import type {
  UnitBalanceResponse,
  UnitAccountStatementResponse,
  Payment,
  UnitWalletResponse,
} from '../../domain/responses/FinanceResponseModel';

export async function fetchUnitBalance(unitId: string, complexId: string): Promise<UnitBalanceResponse> {
  const { data, error } = await apolloClient.query<{ unitBalance: UnitBalanceResponse }>({
    query: GET_UNIT_BALANCE,
    variables: { unitId, complexId },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo cargar el saldo de la unidad'));
  if (!data?.unitBalance) throw new Error('No se encontró el saldo de la unidad');
  return data.unitBalance;
}

export async function fetchUnitAccountStatement(
  unitId: string,
  complexId: string,
  period?: string,
): Promise<UnitAccountStatementResponse> {
  const { data, error } = await apolloClient.query<{ unitAccountStatement: UnitAccountStatementResponse }>({
    query: GET_UNIT_ACCOUNT_STATEMENT,
    variables: {
      unitId,
      complexId,
      ...(period ? { period } : {}),
    },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo cargar el estado de cuenta'));
  if (!data?.unitAccountStatement) throw new Error('No se encontró el estado de cuenta');
  return data.unitAccountStatement;
}

export async function fetchPaymentsByCharge(chargeId: string): Promise<Payment[]> {
  const { data, error } = await apolloClient.query<{ paymentsByCharge: Payment[] }>({
    query: GET_PAYMENTS_BY_CHARGE,
    variables: { chargeId },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudieron cargar los pagos'));
  return data?.paymentsByCharge ?? [];
}

export async function fetchUnitWallet(unitId: string, complexId: string): Promise<UnitWalletResponse> {
  const { data, error } = await apolloClient.query<{ unitWallet: UnitWalletResponse }>({
    query: GET_UNIT_WALLET,
    variables: { unitId, complexId },
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se pudo cargar la billetera de la unidad'));
  if (!data?.unitWallet) throw new Error('No se encontró la billetera de la unidad');
  return data.unitWallet;
}
