declare module '@env' {
    export const NAMEAPP: string;
    export const STAGE: string;
    export const DISTRIBUTION: 'dev' | 'apk' | 'aab';
    export const PATH_SERVER: string;
    export const PATH_SERVER_LOCAL_ANDROID: string;
    export const PATH_SERVER_LOCAL_IOS: string;
    /** Vacía o ausente: el modal de pánico muestra coordenadas en vez de mapa. */
    export const GOOGLE_MAPS_API_KEY: string | undefined;
    /** Vacía o ausente: no se envían errores a Sentry. */
    export const SENTRY_DSN: string | undefined;
    /** Project API key de PostHog (phc_…). Vacía o ausente: sin analítica. */
    export const POSTHOG_KEY: string | undefined;
}