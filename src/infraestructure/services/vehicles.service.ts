import apolloClient from '../../data/lib/apollo/client';
import { REST_API_URL } from '../../data/lib/constants';
import SecureStorageService from './SecureStorageService';
import type { PhotoUpload } from '../../domain/interfaces/PhotoUpload';
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

/**
 * Sube o reemplaza la foto de un vehículo de la unidad. El backend solo lo
 * permite en los vehículos de la unidad de quien la sube.
 */
export async function uploadVehiclePhoto(
  vehicleId: string,
  photo: PhotoUpload,
): Promise<string> {
  const form = new FormData();
  form.append('photo', photo as unknown as Blob);
  const tokens = await SecureStorageService.getTokens();

  const res = await fetch(`${REST_API_URL}/api/v1/vehicles/${vehicleId}/photo`, {
    method: 'POST',
    headers: tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {},
    body: form,
  });

  const payload = (await res.json().catch(() => ({}))) as {
    photoUrl?: string;
    message?: string | string[];
  };
  if (!res.ok) {
    const message = Array.isArray(payload.message) ? payload.message.join('\n') : payload.message;
    throw new Error(message ?? 'No se pudo subir la foto');
  }
  return payload.photoUrl ?? '';
}
