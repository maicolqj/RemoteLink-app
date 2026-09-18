import { gql } from '@apollo/client';

/**
 * Clasificados y comercio interno, desde la app del residente.
 *
 * El recorte lo hace el servidor y no se puede replicar aquí: el teléfono del
 * vecino solo viaja si él lo destapó y el conjunto permite ese canal, y el
 * borrador ajeno no se puede abrir aunque se conozca el id.
 */

export const LISTING_FIELDS = gql`
  fragment ListingFields on MarketplaceListing {
    id
    type
    title
    description
    condition
    imageUrls
    priceAmount
    priceType
    currency
    contactPreference
    showPhone
    status
    rejectionReason
    publishedAt
    expiresAt
    viewsCount
    contactsCount
    favoritesCount
    createdAt
    categoryId
    category {
      id
      name
      icon
    }
    unit {
      id
      number
      building {
        id
        name
      }
    }
    contact {
      displayName
      unitLabel
      preference
      phone
      inAppOnly
    }
    viewerHasFavorited
    viewerHasContacted
    viewerIsOwner
  }
`;

export const GET_LISTINGS = gql`
  ${LISTING_FIELDS}
  query MarketplaceListings(
    $complexId: String!
    $pagination: PaginationInput
    $filters: FilterListingsInput
  ) {
    marketplaceListings(
      complexId: $complexId
      pagination: $pagination
      filters: $filters
    ) {
      items {
        ...ListingFields
      }
      pagination {
        currentPage
        totalPages
        hasNextPage
      }
    }
  }
`;

export const GET_LISTING = gql`
  ${LISTING_FIELDS}
  query MarketplaceListing($listingId: String!) {
    marketplaceListing(listingId: $listingId) {
      ...ListingFields
    }
  }
`;

export const GET_MARKETPLACE_CATEGORIES = gql`
  query MarketplaceCategoriesApp($complexId: String!) {
    marketplaceCategories(complexId: $complexId) {
      id
      name
      icon
    }
  }
`;

/**
 * Los ajustes también los lee el residente: la app necesita saber si hay
 * moderación previa —para avisarle que su aviso va a revisión antes de
 * publicarse— y si el conjunto admite avisos de "busco".
 *
 * Es además la consulta que dice si el módulo está encendido: con el módulo
 * apagado el servidor responde con error y la app esconde la entrada.
 */
export const GET_MARKETPLACE_SETTINGS = gql`
  query MarketplaceSettingsApp($complexId: String!) {
    marketplaceSettings(complexId: $complexId) {
      complexId
      moderationMode
      listingDurationDays
      maxActiveListingsPerUnit
      maxImagesPerListing
      allowPhoneContact
      allowWantedListings
      termsText
    }
  }
`;

// ─── Mutaciones ──────────────────────────────────────────────────────────────

export const REGISTER_LISTING_INTEREST = gql`
  ${LISTING_FIELDS}
  mutation RegisterListingInterest($input: RegisterListingInterestInput!) {
    registerListingInterest(input: $input) {
      ...ListingFields
    }
  }
`;

export const TOGGLE_LISTING_FAVORITE = gql`
  mutation ToggleListingFavorite($listingId: String!) {
    toggleListingFavorite(listingId: $listingId)
  }
`;

export const REPORT_LISTING = gql`
  mutation ReportListing($input: ReportListingInput!) {
    reportListing(input: $input) {
      id
      status
    }
  }
`;

export const PAUSE_LISTING = gql`
  ${LISTING_FIELDS}
  mutation PauseListingApp($listingId: String!) {
    pauseListing(listingId: $listingId) {
      ...ListingFields
    }
  }
`;

export const RESUME_LISTING = gql`
  ${LISTING_FIELDS}
  mutation ResumeListingApp($listingId: String!) {
    resumeListing(listingId: $listingId) {
      ...ListingFields
    }
  }
`;

export const MARK_LISTING_AS_SOLD = gql`
  ${LISTING_FIELDS}
  mutation MarkListingAsSold($listingId: String!) {
    markListingAsSold(listingId: $listingId) {
      ...ListingFields
    }
  }
`;

export const RENEW_LISTING = gql`
  ${LISTING_FIELDS}
  mutation RenewListing($listingId: String!) {
    renewListing(listingId: $listingId) {
      ...ListingFields
    }
  }
`;

export const REMOVE_LISTING = gql`
  mutation RemoveListingApp($listingId: String!, $reason: String) {
    removeListing(listingId: $listingId, reason: $reason)
  }
`;

/**
 * Corregir un aviso propio.
 *
 * Las fotos nuevas no viajan por aquí —van por REST, como al publicar—: en
 * `imageUrls` solo se manda la lista que debe quedar de lo que ya está subido,
 * y el servidor rechaza cualquier enlace que no venga de él.
 */
export const UPDATE_LISTING = gql`
  ${LISTING_FIELDS}
  mutation UpdateListingApp($input: UpdateListingInput!) {
    updateListing(input: $input) {
      ...ListingFields
    }
  }
`;
