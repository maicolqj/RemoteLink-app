import { gql } from '@apollo/client';

// Porterías y citofonía por internet, del lado del residente.
//
// - Con varias porterías el residente elige a cuál se dirige (pedir que le
//   devuelvan la llamada o llamar por la app) y solo esa se entera.
// - Las llamadas por la app van por WebRTC entre los equipos; la API solo
//   inicia, contesta, cuelga y pasa la señalización.

/** Porterías del conjunto. Vacío = una sola portería, no hay que elegir. */
export const GET_SECURITY_POSTS = gql`
  query ResidentSecurityPosts($complexId: String!) {
    securityPosts(complexId: $complexId) {
      id
      name
      phoneNumber
      guardsOnDuty
      guardsWithApp
    }
  }
`;

/** Si el conjunto deja llamar a portería por la app. */
export const GET_COMPLEX_INTERCOM_SETTINGS = gql`
  query ResidentIntercomSettings($id: String!) {
    complex(id: $id) {
      id
      intercomMode
      residentIntercomCallsEnabled
    }
  }
`;

export const START_SECURITY_INTERCOM_CALL = gql`
  mutation StartSecurityIntercomCall($input: StartSecurityIntercomCallInput!) {
    startSecurityIntercomCall(input: $input) {
      call {
        id
        direction
        voiceState
        agentName
        securityPostName
        unitNumber
        buildingName
      }
      iceServers {
        urls
        username
        credential
      }
    }
  }
`;

export const ANSWER_INTERCOM_CALL = gql`
  mutation ResidentAnswerIntercomCall($input: AnswerIntercomCallInput!) {
    answerIntercomCall(input: $input) {
      call {
        id
        direction
        voiceState
        agentName
        securityPostName
      }
      iceServers {
        urls
        username
        credential
      }
    }
  }
`;

export const REJECT_INTERCOM_CALL = gql`
  mutation ResidentRejectIntercomCall($callId: String!) {
    rejectIntercomCall(callId: $callId) {
      id
      voiceState
    }
  }
`;

export const END_INTERCOM_CALL = gql`
  mutation ResidentEndIntercomCall($callId: String!) {
    endIntercomCall(callId: $callId) {
      id
      voiceState
    }
  }
`;

export const SEND_INTERCOM_SIGNAL = gql`
  mutation ResidentSendIntercomSignal($input: IntercomSignalInput!) {
    sendIntercomSignal(input: $input)
  }
`;

/** La llamada sonando o en curso: la app la pide al abrirse desde el aviso. */
export const GET_CURRENT_INTERCOM_CALL = gql`
  query ResidentCurrentIntercomCall {
    currentIntercomCall {
      call {
        id
        direction
        voiceState
        agentName
        securityPostName
        startedAt
      }
      iceServers {
        urls
        username
        credential
      }
    }
  }
`;
