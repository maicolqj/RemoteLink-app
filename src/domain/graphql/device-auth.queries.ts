import { gql } from '@apollo/client';

/**
 * Operaciones de autenticación sin costo por mensaje (contrato backend 0.0.15).
 *
 * Todas dependen del header `x-device-id` que inyecta el authLink de Apollo:
 * el servidor deriva de él el fingerprint del dispositivo. Sin el header, el
 * login con clave responde DEVICE_ID_REQUIRED y los canjes de los flujos de
 * aprobación no encuentran el challenge (llegan como *_NOT_FOUND).
 *
 * Los nombres de operación son los del contrato: el manifest de trusted
 * documents se genera a partir de estos documentos, así que renombrarlos
 * obliga a re-sincronizar el manifest del backend.
 */

// ─── 01 · Clave de acceso del residente ──────────────────────────────────────

/** Requiere sesión activa (RESIDENT_ROL): fija la clave de la CUENTA y vincula ESTE equipo. */
export const SET_ACCESS_CODE = gql`
  mutation SetAccessCode($input: SetAccessCodeInput!) {
    setResidentAccessCode(input: $input) {
      id
      deviceId
      label
      platform
      createdAt
    }
  }
`;

/**
 * Pública. El dispositivo no viaja en el input: sale del header x-device-id.
 * El `identity` del input solo hace falta cuando ese dispositivo aún no está
 * vinculado; en ese caso el ingreso lo vincula y avisa a los demás equipos.
 */
export const LOGIN_WITH_ACCESS_CODE = gql`
  mutation LoginWithAccessCode($input: LoginAccessCodeInput!) {
    loginWithAccessCode(input: $input) {
      accessToken
      refreshToken
      expiresIn
      sessionId
    }
  }
`;

/**
 * ¿La cuenta ya tiene clave? La app la exige tras iniciar sesión.
 * La pregunta es por CUENTA: con la clave compartida entre equipos, saber si
 * este dispositivo está vinculado ya no dice nada sobre si falta crearla.
 */
export const HAS_ACCESS_CODE = gql`
  query ResidentHasAccessCode {
    residentHasAccessCode
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

/** Celular perdido: deja vivo solo el equipo actual. Devuelve cuántos revocó. */
export const REVOKE_OTHER_DEVICES = gql`
  mutation RevokeMyOtherDevices {
    revokeMyOtherDevices
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
  mutation RedeemWaLogin($challengeId: ID!, $accessCode: String) {
    redeemWhatsAppLoginChallenge(challengeId: $challengeId, accessCode: $accessCode) {
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
  mutation RedeemApproval($challengeId: ID!, $accessCode: String) {
    redeemDeviceApproval(challengeId: $challengeId, accessCode: $accessCode) {
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
