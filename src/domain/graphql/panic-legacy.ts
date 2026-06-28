import { gql } from '@apollo/client';

// ⚠️ SIN ENDPOINT en el schema actual — excluido del codegen (*-legacy.ts).
// El backend no expone `residentByUserId`. El modal de pánico ya degrada en
// silencio (onError no-op) y usa el payload + GET_UNIT como fallback.
// Alternativas reales si se quiere enriquecer: `user(id: String!)` (da nombre y
// teléfono, NO unidad) o `resident(id: String!)` (requiere id de residente, no de usuario).
// TODO(backend): implementar `residentByUserId(userId: String!): Resident`.
export const GET_RESIDENT_BY_USER_ID = gql`
  query GetResidentByUserId($userId: String!) {
    residentByUserId(userId: $userId) {
      id
      user {
        id
        name
        lastName
        phoneNumber
      }
      unit {
        id
        number
        floor
        building {
          id
          name
        }
      }
    }
  }
`;
