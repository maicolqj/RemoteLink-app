// Selector de conjunto: cambiar de conjunto rota los tokens de la sesión.

const mockMutate = jest.fn();
const mockQuery = jest.fn();
jest.mock('../src/data/lib/apollo/client', () => ({
  __esModule: true,
  default: { mutate: (...a: unknown[]) => mockMutate(...a), query: (...a: unknown[]) => mockQuery(...a) },
}));

const mockGetTokens = jest.fn();
const mockSaveTokens = jest.fn();
jest.mock('../src/infraestructure/services/SecureStorageService', () => ({
  __esModule: true,
  default: {
    getTokens: (...a: unknown[]) => mockGetTokens(...a),
    saveTokens: (...a: unknown[]) => mockSaveTokens(...a),
  },
}));

const mockRefreshNow = jest.fn();
jest.mock('../src/infraestructure/services/auth.service', () => ({
  refreshSessionNow: (...a: unknown[]) => mockRefreshNow(...a),
}));

import { fetchMyResidences, requestComplexSwitch } from '../src/infraestructure/services/residences.service';

describe('residences.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTokens.mockResolvedValue({
      accessToken: 'a-viejo',
      refreshToken: 'r-viejo',
      sessionId: 's-1',
      accessTokenExpiresAt: Date.now() + 10 * 60_000,
    });
    mockSaveTokens.mockResolvedValue(true);
  });

  it('requestComplexSwitch manda el refresh actual y guarda el par nuevo', async () => {
    const now = Date.now();
    mockMutate.mockResolvedValueOnce({
      data: { switchResidentComplex: { accessToken: 'a-nuevo', refreshToken: 'r-nuevo', expiresIn: 900, sessionId: 's-1' } },
    });

    const result = await requestComplexSwitch('complex-2');

    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
      variables: { complexId: 'complex-2', refreshToken: 'r-viejo' },
    }));
    const saved = mockSaveTokens.mock.calls[0][0];
    expect(saved).toMatchObject({ accessToken: 'a-nuevo', refreshToken: 'r-nuevo', sessionId: 's-1' });
    expect(saved.accessTokenExpiresAt).toBeGreaterThanOrEqual(now + 900_000);
    expect(result).toEqual({ accessToken: 'a-nuevo', sessionId: 's-1' });
  });

  it('si la mutación falla no toca los tokens y lanza con el mensaje del servidor', async () => {
    mockMutate.mockResolvedValueOnce({
      data: null,
      error: { graphQLErrors: [{ message: 'Ya no tienes una residencia activa en ese conjunto', extensions: { code: 'RESIDENCE_NOT_AVAILABLE' } }] },
    });

    await expect(requestComplexSwitch('complex-2')).rejects.toThrow('Ya no tienes una residencia activa en ese conjunto');
    expect(mockSaveTokens).not.toHaveBeenCalled();
  });

  it('sin refresh guardado no llama al servidor', async () => {
    mockGetTokens.mockResolvedValueOnce(null);

    await expect(requestComplexSwitch('complex-2')).rejects.toThrow();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('fetchMyResidences devuelve la lista del servidor sin caché', async () => {
    const list = [{ complexId: 'c1', complexName: 'Alameda', isCurrent: true, unreadCount: 0 }];
    mockQuery.mockResolvedValueOnce({ data: { myResidences: list } });

    await expect(fetchMyResidences()).resolves.toEqual(list);
    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({ fetchPolicy: 'no-cache' }));
  });
  it('manda el cambio con el token puesto a mano y skipAuth: no pasa por el authLink (que esperaría la cola)', async () => {
    mockMutate.mockResolvedValueOnce({
      data: { switchResidentComplex: { accessToken: 'a-nuevo', refreshToken: 'r-nuevo', expiresIn: 900, sessionId: 's-1' } },
    });

    await requestComplexSwitch('complex-2');

    expect(mockMutate.mock.calls[0][0].context).toEqual({
      skipAuth: true,
      headers: { authorization: 'Bearer a-viejo' },
    });
    expect(mockRefreshNow).not.toHaveBeenCalled();
  });

  it('con el access token por vencer, renueva primero dentro de la cola y usa el par nuevo', async () => {
    mockGetTokens
      .mockResolvedValueOnce({ accessToken: 'a-viejo', refreshToken: 'r-viejo', sessionId: 's-1', accessTokenExpiresAt: Date.now() + 5_000 })
      .mockResolvedValueOnce({ accessToken: 'a-renovado', refreshToken: 'r-renovado', sessionId: 's-1', accessTokenExpiresAt: Date.now() + 900_000 });
    mockRefreshNow.mockResolvedValueOnce('a-renovado');
    mockMutate.mockResolvedValueOnce({
      data: { switchResidentComplex: { accessToken: 'a-nuevo', refreshToken: 'r-nuevo', expiresIn: 900, sessionId: 's-1' } },
    });

    await requestComplexSwitch('complex-2');

    expect(mockRefreshNow).toHaveBeenCalledTimes(1);
    const call = mockMutate.mock.calls[0][0];
    expect(call.variables).toEqual({ complexId: 'complex-2', refreshToken: 'r-renovado' });
    expect(call.context.headers).toEqual({ authorization: 'Bearer a-renovado' });
  });

  it('si la renovación previa falla, no intenta el cambio', async () => {
    mockGetTokens.mockResolvedValueOnce({ accessToken: 'a-viejo', refreshToken: 'r-viejo', sessionId: 's-1', accessTokenExpiresAt: Date.now() + 5_000 });
    mockRefreshNow.mockResolvedValueOnce(null);

    await expect(requestComplexSwitch('complex-2')).rejects.toThrow();
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
