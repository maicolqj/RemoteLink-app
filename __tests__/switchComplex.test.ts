// Cambio de conjunto: la app queda limpia y con el token del conjunto nuevo.

jest.mock('@react-native-async-storage/async-storage', () => {
  const mem = new Map<string, string>();
  const api = {
    getItem: jest.fn(async (k: string) => mem.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => { mem.set(k, v); }),
    removeItem: jest.fn(async (k: string) => { mem.delete(k); }),
    multiRemove: jest.fn(async (ks: string[]) => { ks.forEach(k => mem.delete(k)); }),
    clear: jest.fn(async () => { mem.clear(); }),
  };
  return { __esModule: true, default: api, ...api };
});

jest.mock('../src/data/lib/constants', () => ({
  API_URL: 'http://api.test/graphql',
  REST_API_URL: 'http://api.test',
  DEVICE_ID_KEY: 'remotelink_device_id',
}));

// Llavero en memoria: lo que guarda uno lo lee el siguiente.
let mockVault: any = null;
jest.mock('../src/infraestructure/services/SecureStorageService', () => ({
  __esModule: true,
  default: {
    getTokens: jest.fn(async () => mockVault),
    saveTokens: jest.fn(async (t: unknown) => { mockVault = t; return true; }),
    clearTokens: jest.fn(async () => true),
    clearUserProfile: jest.fn(async () => undefined),
  },
}));

const mockMutate = jest.fn();
const mockClearStore = jest.fn(async () => []);
jest.mock('../src/data/lib/apollo/client', () => ({
  __esModule: true,
  default: {
    mutate: (...a: unknown[]) => mockMutate(...a),
    query: jest.fn(),
    clearStore: () => mockClearStore(),
  },
  isTerminalAuthCode: () => false,
}));

import { useAuthStore } from '../src/presentation/store/auth.store';
import { COMPLEX_SCOPED_STORES } from '../src/presentation/store/resetComplexScope';
import { refreshSession } from '../src/infraestructure/services/auth.service';
import { requestComplexSwitch } from '../src/infraestructure/services/residences.service';

const switchOk = (n: string) => ({
  data: { switchResidentComplex: { accessToken: `a-${n}`, refreshToken: `r-${n}`, expiresIn: 900, sessionId: 's-1' } },
});

function dirtyAllStores() {
  for (const store of COMPLEX_SCOPED_STORES) {
    store.setState({ __conjuntoAnterior: true } as any);
  }
}

describe('useAuthStore.switchComplex', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVault = { accessToken: 'a-0', refreshToken: 'r-0', sessionId: 's-1' };
    useAuthStore.setState({
      token: 'a-0',
      sessionId: 's-1',
      isAuthenticated: true,
      resident: { id: 'res-1', complex: { id: 'complex-1' } } as any,
      switchingTo: null,
    });
  });

  it('cubre los stores de datos del conjunto', () => {
    expect(COMPLEX_SCOPED_STORES.length).toBeGreaterThanOrEqual(11);
  });

  it('deja todos los stores del conjunto en su estado inicial y limpia Apollo', async () => {
    mockMutate.mockResolvedValueOnce(switchOk('1'));
    dirtyAllStores();

    await useAuthStore.getState().switchComplex('complex-2', 'Mirador');

    for (const store of COMPLEX_SCOPED_STORES) {
      expect(store.getState()).toEqual(store.getInitialState());
    }
    expect(mockClearStore).toHaveBeenCalled();
  });

  it('queda con el token nuevo y sin ficha, para que la app recargue el conjunto', async () => {
    mockMutate.mockResolvedValueOnce(switchOk('1'));

    await useAuthStore.getState().switchComplex('complex-2', 'Mirador');

    const s = useAuthStore.getState();
    expect(s.token).toBe('a-1');
    expect(s.resident).toBeNull();
    expect(s.isAuthenticated).toBe(true);
    expect(s.switchingTo).toBeNull();
  });

  it('si el servidor rechaza, nada cambia y el error sube', async () => {
    mockMutate.mockResolvedValueOnce({ data: null, error: { graphQLErrors: [{ message: 'Ya no tienes una residencia activa en ese conjunto', extensions: { code: 'RESIDENCE_NOT_AVAILABLE' } }] } });
    dirtyAllStores();

    await expect(useAuthStore.getState().switchComplex('complex-2', 'Mirador')).rejects.toThrow('residencia activa');

    const s = useAuthStore.getState();
    expect(s.token).toBe('a-0');
    expect(s.resident).not.toBeNull();
    expect(s.switchingTo).toBeNull();
    expect((COMPLEX_SCOPED_STORES[0].getState() as any).__conjuntoAnterior).toBe(true);
    expect(mockClearStore).not.toHaveBeenCalled();
  });
});

describe('refresh y cambio de conjunto en paralelo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVault = { accessToken: 'a-0', refreshToken: 'r-0', sessionId: 's-1' };
  });

  it('corren en serie: el cambio usa el refresh que acaba de guardar la renovación', async () => {
    let releaseRefresh!: () => void;
    mockMutate
      .mockImplementationOnce(() => new Promise(resolve => {
        releaseRefresh = () => resolve({ data: { refreshToken: { accessToken: 'a-r', refreshToken: 'r-r', expiresIn: 900, sessionId: 's-1' } } });
      }))
      .mockImplementationOnce(async () => switchOk('2'));

    const refreshing = refreshSession();
    const switching = requestComplexSwitch('complex-2');
    await new Promise<void>(r => setTimeout(() => r(), 0));
    expect(mockMutate).toHaveBeenCalledTimes(1);

    releaseRefresh();
    await Promise.all([refreshing, switching]);

    expect(mockMutate.mock.calls[1][0].variables).toEqual({ complexId: 'complex-2', refreshToken: 'r-r' });
    expect(mockVault.refreshToken).toBe('r-2');
  });
});
