// Tocar un aviso de otro conjunto cambia de conjunto antes de abrirlo.

const mockFetchMyResidences = jest.fn();
jest.mock('../src/infraestructure/services/residences.service', () => ({
  fetchMyResidences: () => mockFetchMyResidences(),
}));

const mockSwitch = jest.fn();
let mockCurrent: string | undefined = 'a';
jest.mock('../src/presentation/store/auth.store', () => ({
  useAuthStore: {
    getState: () => ({
      resident: mockCurrent ? { complex: { id: mockCurrent } } : null,
      switchComplex: (...a: unknown[]) => mockSwitch(...a),
    }),
  },
}));

import { prepareComplexForPush } from '../src/infraestructure/services/pushComplex';

const mine = [
  { complexId: 'a', complexName: 'Alameda', isCurrent: true, unreadCount: 0 },
  { complexId: 'b', complexName: 'Mirador', isCurrent: false, unreadCount: 1 },
];

describe('prepareComplexForPush', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrent = 'a';
    mockFetchMyResidences.mockResolvedValue(mine);
    mockSwitch.mockResolvedValue(undefined);
  });

  it('aviso del conjunto abierto: no pregunta nada al servidor', async () => {
    await expect(prepareComplexForPush('a')).resolves.toBe('none');
    expect(mockFetchMyResidences).not.toHaveBeenCalled();
    expect(mockSwitch).not.toHaveBeenCalled();
  });

  it('aviso de otro conjunto donde vive: cambia y espera a que termine', async () => {
    await expect(prepareComplexForPush('b')).resolves.toBe('switch');
    expect(mockSwitch).toHaveBeenCalledWith('b', 'Mirador');
  });

  it('conjunto donde ya no vive: solo la bandeja', async () => {
    await expect(prepareComplexForPush('z')).resolves.toBe('inbox');
    expect(mockSwitch).not.toHaveBeenCalled();
  });

  it('si el cambio falla: solo la bandeja, sin lanzar', async () => {
    mockSwitch.mockRejectedValueOnce(new Error('x'));
    await expect(prepareComplexForPush('b')).resolves.toBe('inbox');
  });

  it('sin sesión cargada todavía: no hace nada', async () => {
    mockCurrent = undefined;
    await expect(prepareComplexForPush('b')).resolves.toBe('none');
    expect(mockFetchMyResidences).not.toHaveBeenCalled();
  });
});
