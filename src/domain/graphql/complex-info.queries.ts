import { gql } from '@apollo/client';

/**
 * "Mi Conjunto": datos del conjunto, directorio de contactos y documentos
 * publicados para el residente. El texto de cada documento NO viaja aquí
 * (pesa): se pide al abrirlo con MY_COMPLEX_DOCUMENT.
 */
export const GET_MY_COMPLEX_INFO = gql`
  query MyComplexInfo($complexId: String!) {
    myComplexInfo(complexId: $complexId) {
      complex {
        id
        name
        description
        address
        city
        state
        phoneNumber
        email
        website
        nit
        logoUrl
      }
      settings {
        showCall
        showEmail
        showDirections
        showWebsite
      }
      contacts {
        id
        category
        name
        role
        phone
        email
        schedule
        notes
      }
      documents {
        acknowledgedAt
        hasContent
        hasFile
        document {
          id
          category
          title
          description
          fileName
          fileSize
          audience
          publishedAt
          isPinned
          requiresAcknowledgement
          effectiveDate
          version
          contentUpdatedAt
        }
      }
      pendingAcknowledgements
    }
  }
`;

export const GET_MY_COMPLEX_DOCUMENT = gql`
  query MyComplexDocument($id: ID!) {
    myComplexDocument(id: $id) {
      acknowledgedAt
      hasContent
      hasFile
      document {
        id
        category
        title
        description
        contentHtml
        fileName
        fileSize
        audience
        publishedAt
        requiresAcknowledgement
        effectiveDate
        version
        contentUpdatedAt
      }
    }
  }
`;

export const ACKNOWLEDGE_COMPLEX_DOCUMENT = gql`
  mutation AcknowledgeComplexDocument($id: ID!) {
    acknowledgeComplexDocument(id: $id) {
      acknowledgedAt
      document {
        id
        version
      }
    }
  }
`;
