import apolloClient from '../../data/lib/apollo/client';
import { GET_PACKAGE } from '../../domain/graphql/packages.queries';
import type { Package } from '../../domain/responses/PackageResponseModel';

export async function fetchPackageById(packageId: string): Promise<Package> {
  const { data } = await apolloClient.query<{ package: Package }>({
    query: GET_PACKAGE,
    variables: { packageId },
    fetchPolicy: 'network-only',
  });
  if (!data?.package) throw new Error('No se encontró el paquete');
  return data.package;
}
