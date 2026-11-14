// =============================================================================
// Cola única para todo lo que rota los tokens de la sesión.
//
// El refresh automático (authLink/errorLink) y el cambio de conjunto usan el
// mismo refresh token: si corren a la vez, el segundo manda un refresh que el
// primero ya rotó. En serie, el segundo lee el par que guardó el primero.
// =============================================================================

let tail: Promise<unknown> = Promise.resolve();

export function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn, fn);
  // La cola sigue aunque una tarea falle.
  tail = run.catch(() => undefined);
  return run;
}
