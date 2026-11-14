import { runExclusive } from '../src/infraestructure/services/sessionLock';

describe('runExclusive', () => {
  it('ejecuta en serie: el segundo empieza cuando termina el primero', async () => {
    const order: string[] = [];
    let release!: () => void;
    const first = runExclusive(async () => {
      order.push('a:start');
      await new Promise<void>(r => { release = r; });
      order.push('a:end');
    });
    const second = runExclusive(async () => { order.push('b'); });

    await Promise.resolve();
    await Promise.resolve();
    expect(order).toEqual(['a:start']);
    release();
    await Promise.all([first, second]);
    expect(order).toEqual(['a:start', 'a:end', 'b']);
  });

  it('un fallo no bloquea la cola', async () => {
    await expect(runExclusive(async () => { throw new Error('x'); })).rejects.toThrow('x');
    await expect(runExclusive(async () => 'ok')).resolves.toBe('ok');
  });
});
