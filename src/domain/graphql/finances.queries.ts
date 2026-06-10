import { gql } from '@apollo/client';

export const GET_UNIT_BALANCE = gql`
  query GetUnitBalance($unitId: String!, $complexId: String!) {
    unitBalance(unitId: $unitId, complexId: $complexId) {
      unitId
      unitNumber
      totalDebt
      overdueCount
      pendingCount
      totalPaid
    }
  }
`;

export const GET_UNIT_ACCOUNT_STATEMENT = gql`
  query GetUnitAccountStatement($unitId: String!, $complexId: String!, $period: String) {
    unitAccountStatement(unitId: $unitId, complexId: $complexId, period: $period) {
      unitId
      unitNumber
      building
      totalDebits
      totalCredits
      currentBalance
      walletBalance
      movements {
        id
        date
        type
        description
        debit
        credit
        balance
        reference
      }
    }
  }
`;

export const GET_PAYMENTS_BY_CHARGE = gql`
  query GetPaymentsByCharge($chargeId: String!) {
    paymentsByCharge(chargeId: $chargeId) {
      id
      amount
      method
      reference
      receiptUrl
      paidAt
      notes
      isReversed
      reversalReason
      reversedAt
      createdAt
    }
  }
`;

export const GET_UNIT_WALLET = gql`
  query GetUnitWallet($unitId: String!, $complexId: String!) {
    unitWallet(unitId: $unitId, complexId: $complexId) {
      unitId
      unitNumber
      building
      currentBalance
      totalCredits
      totalDebits
      entries {
        id
        type
        amount
        description
        chargeId
        createdAt
      }
    }
  }
`;
