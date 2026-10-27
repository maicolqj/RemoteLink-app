import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';
import { POSTHOG_KEY, SENTRY_DSN, STAGE } from '@env';

/**
 * Sentry (errores y cierres inesperados) y PostHog (uso: pantallas, sesiones,
 * eventos). Sin la llave correspondiente en el .env, o en desarrollo, no se
 * envía nada.
 *
 * Habeas Data: solo se identifica a la persona por su id, roles y conjunto;
 * nunca nombre, correo, teléfono ni documento. PostHog en móvil no graba
 * sesiones: no puede ocultar todos los textos de la pantalla, solo los inputs.
 */

const enabled = !__DEV__;

export function initObservability(): void {
  if (!SENTRY_DSN || !enabled) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: STAGE || 'production',
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    // Sin capturas de pantalla ni jerarquía de vistas: mostrarían datos.
    attachScreenshot: false,
    attachViewHierarchy: false,
    beforeBreadcrumb(breadcrumb) {
      // Los console.* y las peticiones pueden llevar datos personales.
      if (breadcrumb.category === 'console') return null;
      if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
        if (breadcrumb.data) {
          delete breadcrumb.data.request_body_size;
          delete breadcrumb.data.response_body_size;
        }
      }
      return breadcrumb;
    },
  });
}

export const posthog: PostHog | null =
  POSTHOG_KEY && enabled
    ? new PostHog(POSTHOG_KEY, {
        host: 'https://us.i.posthog.com',
        personProfiles: 'identified_only',
        captureAppLifecycleEvents: true,
      })
    : null;

export interface ObservabilityIdentity {
  id: string;
  roles: string[];
  complexId?: string | null;
}

/** Asocia eventos y errores a quien inició sesión. Solo identificadores. */
export function identifyUser({ id, roles, complexId }: ObservabilityIdentity): void {
  if (SENTRY_DSN && enabled) {
    Sentry.setUser({ id });
    Sentry.setTag('roles', roles.join(','));
    if (complexId) Sentry.setTag('complexId', complexId);
  }
  if (!posthog) return;
  posthog.identify(id, { roles, primary_role: roles[0] ?? null });
  if (complexId) posthog.group('complex', complexId);
}

/** Al cerrar sesión: lo que siga en el equipo ya es anónimo. */
export function resetObservability(): void {
  if (SENTRY_DSN && enabled) Sentry.setUser(null);
  posthog?.reset();
}

/** Pantalla vista (se llama al cambiar de ruta en la navegación). */
export function trackScreen(name: string): void {
  posthog?.screen(name);
}
