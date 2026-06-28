import apolloClient from '../../data/lib/apollo/client';
import { GET_VEHICLE } from '../../domain/graphql/vehicles.queries';
import { getApiErrorMessage } from '../utils/apiError';
import type { Vehicle } from '../../domain/responses/VehicleResponseModel';

export async function fetchVehicleById(vehicleId: string): Promise<Vehicle> {
  const { data, error } = await apolloClient.query<{ vehicle: Vehicle }>({
    query: GET_VEHICLE,
    variables: { id: vehicleId },
    fetchPolicy: 'network-only',
  });
  if (error) throw new Error(getApiErrorMessage(error, 'No se encontró el vehículo'));
  if (!data?.vehicle) throw new Error('No se encontró el vehículo');
  return data.vehicle;
}
