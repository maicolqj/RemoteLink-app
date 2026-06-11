import apolloClient from '../../data/lib/apollo/client';
import { LOGIN_RESIDENT, GET_MY_RESIDENT_PROFILE } from '../../domain/graphql/auth.queries';
import type { Resident } from '../../presentation/store/auth.store';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
}

interface LoginResidentResponse {
  loginResident: LoginResult;
}

interface MyResidentProfileResponse {
  myResidentProfile: Resident;
}

export async function loginResident(
  identity: string,
  systemCode: string,
): Promise<LoginResult> {
  const { data } = await apolloClient.mutate<LoginResidentResponse>({
    mutation: LOGIN_RESIDENT,
    variables: { input: { identity, systemCode } },
  });
  if (!data?.loginResident) throw new Error('Respuesta inválida del servidor');
  return data.loginResident;
}

export async function fetchMyResidentProfile(): Promise<Resident> {
  const { data } = await apolloClient.query<MyResidentProfileResponse>({
    query: GET_MY_RESIDENT_PROFILE,
    fetchPolicy: 'network-only',
  });
  if (!data?.myResidentProfile) throw new Error('Perfil no encontrado');
  return data.myResidentProfile;
}
