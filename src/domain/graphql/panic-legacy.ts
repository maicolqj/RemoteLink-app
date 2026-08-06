import { gql } from '@apollo/client';

// El backend YA implementa `residentByUserId` (rama `feat/panic-alert-aggregate`),
// acotado al complejo de quien pregunta y devolviendo null cuando el usuario no
// es residente — el caso de un guarda o la administración disparando el pánico.
//
// Sigue en *-legacy.ts, y por tanto fuera del codegen, solo porque el espejo
// `schema.gql` todavía no la trae: se actualiza con la rama que el backend tenga
// activa, y esa rama aún no está mergeada. Funciona en ejecución igual.
//
// TODO(al mergear el backend): mover esta operación a `panic.queries.ts` para
// que codegen la tipe y entre al manifiesto de documentos persistidos. Sin eso,
// en producción responderá PERSISTED_QUERY_NOT_ALLOWED.
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
