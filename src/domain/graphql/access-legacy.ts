import { gql } from '@apollo/client';

// ⚠️ SIN ENDPOINT en el schema actual — excluido del codegen (*-legacy.ts).
// El backend no expone una consulta de solicitud de acceso por id.
// Consultas disponibles hoy: `myAccessRequests`, `pendingAccessRequests(complexId)`.
// TODO(backend): implementar `accessRequest(id: String!): SupervisorAccessRequest`
// o migrar el consumidor a las consultas de lista.
export const GET_ACCESS_REQUEST = gql`
  query AccessRequest($id: String!) {
    accessRequest(id: $id) {
      id
      status
      reason
      requestedAt
      resolvedAt
      rejectionReason
      requesterName
      requesterIdentity
      requesterIdentityType
      requesterPhone
      photoUrl
      unitId
      complexId
    }
  }
`;
