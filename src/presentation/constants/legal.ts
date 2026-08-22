// Documentos legales servidos por el frontend Next.js (entrylink-web).
const LEGAL_BASE_URL = 'https://app.alternaqj.com/legal';

export const LEGAL_LINKS = {
  terms: {
    title: 'Términos y condiciones de uso',
    url: `${LEGAL_BASE_URL}/terminos-y-condiciones-de-uso-de-las-apps`,
  },
  privacy: {
    title: 'Política de privacidad',
    url: `${LEGAL_BASE_URL}/politica-de-privacidad`,
  },
  /**
   * Formulario de solicitud de eliminación de cuenta. Google Play lo exige
   * accesible desde la app misma para toda app que permita crear cuentas.
   */
  deleteAccount: {
    title: 'Eliminar cuenta',
    url: `${LEGAL_BASE_URL}/eliminar-cuenta`,
  },
} as const;

export type LegalDocument = (typeof LEGAL_LINKS)[keyof typeof LEGAL_LINKS];

/** Alternativa cuando el documento no carga en el WebView. */
export const SUPPORT_EMAIL = 'soporte@alternaqj.com';

/**
 * `?embed=1` le dice al sitio que se está renderizando dentro del WebView de la
 * app: oculta su header (logo + "Iniciar sesión") y su footer, dejando solo el
 * documento. Ver LegalChrome.tsx en entrylink-web.
 *
 * Solo para el WebView — al abrir en el navegador del sistema queremos el sitio
 * completo, con su navegación.
 */
export const toEmbedUrl = (url: string) =>
  url.includes('?') ? `${url}&embed=1` : `${url}?embed=1`;
