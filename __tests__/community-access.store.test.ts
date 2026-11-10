import { formatCutDate, useCommunityAccessStore } from '../src/presentation/store/community-access.store';

const store = () => useCommunityAccessStore.getState();

describe('community-access store', () => {
  beforeEach(() => store().reset());

  it('sin datos no marca corte', () => {
    expect(store().access).toBeNull();
  });

  it('un error de corte de acceso conserva el pánico', () => {
    store().markAccessCut();

    expect(store().access).toEqual({ accessCut: true, panicAvailable: true, cutAt: null });
  });

  it('un error de corte de pánico apaga el botón', () => {
    store().markPanicCut();

    expect(store().access?.panicAvailable).toBe(false);
  });

  it('el corte de pánico conserva un corte de acceso ya conocido', () => {
    store().markAccessCut();
    store().markPanicCut();

    expect(store().access).toMatchObject({ accessCut: true, panicAvailable: false });
  });

  it('renovar vuelve a abrir', () => {
    store().markAccessCut();
    store().setAccess({ accessCut: false, panicAvailable: true, cutAt: null });

    expect(store().access?.accessCut).toBe(false);
  });

  it('formatea la fecha en hora de Colombia', () => {
    // 11:30 p. m. del 20 en Bogotá: en UTC ya es 21.
    expect(formatCutDate('2026-09-21T04:30:00.000Z')).toBe('20/09/2026');
  });
});
