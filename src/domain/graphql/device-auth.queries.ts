import { gql } from '@apollo/client';

/**
 * Operaciones de autenticación sin costo por mensaje (contrato backend 0.0.15).
 *
 * Todas dependen del header `x-device-id` que inyecta el authLink de Apollo:
 * el servidor deriva de él el fingerprint del dispositivo. Sin el header, el
 * login por PIN responde DEVICE_ID_REQUIRED y los canjes de los flujos de
 * aprobación no encuentran el challenge (llegan como *_NOT_FOUND).
 *
 * Los nombres de operación son los del contrato: el manifest de trusted
 * documents se genera a partir de estos documentos, así que renombrarlos
 * obliga a re-sincronizar el manifest del backend.
 */

// ─── 01 · Login por PIN de dispositivo ───────────────────────────────────────

/** Requiere sesión activa (RESIDENT_ROL): vincula ESTE dispositivo y fija su PIN. */
export const SET_DEVICE_PIN = gql`
  mutation SetDevicePin($input: SetDevicePinInput!) {
    setResidentDevicePin(input: $input) {
      id
      deviceId
      label
      platform
      createdAt
    }
  }
`;

/** Pública. El dispositivo no viaja en el input: sale del header x-device-id. */
export const LOGIN_WITH_DEVICE_PIN = gql`
  mutation LoginWithDevicePin($input: LoginDevicePinInput!) {
    loginWithDevicePin(input: $input) {
      accessToken
      refreshToken
      expiresIn
      sessionId
    }
  }
`;

export const MY_DEVICES = gql`
  query MyDevices {
    myResidentDevices {
      id
      deviceId
      label
      platform
      lastUsedAt
      lockedUntil
      createdAt
    }
  }
`;

/** OJO: recibe el `id` del registro, no el `deviceId`. */
export const REVOKE_DEVICE = gql`
  mutation RevokeDevice($deviceId: ID!) {
    revokeResidentDevice(deviceId: $deviceId)
  }
`;

// ─── 02 · Login por WhatsApp entrante ────────────────────────────────────────

/** Pública: decide si se ofrece el canal antes de intentarlo. */
export const WA_LOGIN_AVAILABLE = gql`
  query WaLoginAvailable {
    whatsAppLoginAvailable
  }
`;

export const REQUEST_WA_LOGIN = gql`
  mutation RequestWaLogin($identity: String!) {
    requestWhatsAppLoginChallenge(identity: $identity) {
      challengeId
      nonce
      whatsappUrl
      messageText
      expiresAt
      warning
    }
  }
`;

export const WA_LOGIN_STATUS = gql`
  query WaLoginStatus($challengeId: ID!) {
    whatsAppLoginChallengeStatus(challengeId: $challengeId) {
      status
      expiresAt
    }
  }
`;

export const REDEEM_WA_LOGIN = gql`
  mutation RedeemWaLogin($challengeId: ID!) {
    redeemWhatsAppLoginChallenge(challengeId: $challengeId) {
      accessToken
      refreshToken
      expiresIn
      sessionId
    }
  }
`;

// ─── 03 · Aprobación de ingreso por push ─────────────────────────────────────

export const REQUEST_APPROVAL = gql`
  mutation RequestApproval($identity: String!) {
    requestDeviceApproval(identity: $identity) {
      challengeId
      approvalCode
      expiresAt
      instructions
    }
  }
`;

export const APPROVAL_STATUS = gql`
  query ApprovalStatus($challengeId: ID!) {
    deviceApprovalStatus(challengeId: $challengeId) {
      status
      expiresAt
    }
  }
`;

export const REDEEM_APPROVAL = gql`
  mutation RedeemApproval($challengeId: ID!) {
    redeemDeviceApproval(challengeId: $challengeId) {
      accessToken
      refreshToken
      expiresIn
      sessionId
    }
  }
`;

/** Respaldo para cuando el push no llega; se consulta al abrir la app. */
export const PENDING_APPROVALS = gql`
  query PendingApprovals {
    pendingDeviceApprovals {
      approvalId
      approvalCode
      requestedFromLabel
      requestedFromIp
      expiresAt
      createdAt
    }
  }
`;

export const APPROVE_DEVICE_APPROVAL = gql`
  mutation Approve($approvalId: ID!) {
    approveDeviceApproval(approvalId: $approvalId)
  }
`;

export const DENY_DEVICE_APPROVAL = gql`
  mutation Deny($approvalId: ID!) {
    denyDeviceApproval(approvalId: $approvalId)
  }
`;
