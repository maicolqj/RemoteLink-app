import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { identifyUser, resetObservability } from '../../infraestructure/services/observability';

/** Identifica en Sentry y PostHog a quien tiene la sesión abierta. */
export function ObservabilityIdentity() {
  const userId = useAuthStore(s => s.resident?.user.id);
  const complexId = useAuthStore(s => s.resident?.complex.id);

  useEffect(() => {
    if (!userId) {
      resetObservability();
      return;
    }
    identifyUser({ id: userId, roles: ['RESIDENT_ROL'], complexId });
  }, [userId, complexId]);

  return null;
}
