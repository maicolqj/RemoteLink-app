import apolloClient from '../../data/lib/apollo/client';
import { GET_PACKAGE, GET_MY_UNIT_PACKAGES } from '../../domain/graphql/packages.queries';
import { getApiErrorMessage } from '../utils/apiError';
import type { Package } from '../../domain/responses/PackageResponseModel';

type RawMyUnitPackages = { items: Package[] };

// Resident-facing list: all packages of the resident's unit (backend forces the
// scope to their own unit). network-only so a freshly registered package shows
// on refresh instead of a stale cache. Fetches a large page; chip filtering is
// done client-side like the visits list.
export async function fetchMyUnitPackages(complexId: string): Promise<Package[]> {
  const { data } = await apolloClient.query<{ myUnitPackages: RawMyUnitPackages }>({
    query: GET_MY_UNIT_PACKAGES,
    variables: { complexId, pagination: { page: 1, limit: 100 } },
    fetchPolicy: 'network-only',
  });
  return data?.myUnitPackages?.items ?? [];
}

export async function fetchPackageById(packageId: string): Promise<Package> {
  const { data, error } = await apolloClient.query<{ package: Package }>({
    query: GET_PACKAGE,
    variables: { packageId },
    fetchPolicy: 'network-only',
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se encontró el paquete'));
  if (!data?.package) throw new Error('No se encontró el paquete');
  return data.package;
}
