// Documentos legales servidos por el frontend Next.js (entrylink-web).
const LEGAL_BASE_URL = 'https://app.alternaqj.com/legal';

export const LEGAL_LINKS = {
  terms: {
    title: 'Términos y condiciones',
    url: `${LEGAL_BASE_URL}/terminos-y-condiciones`,
  },
  privacy: {
    title: 'Política de privacidad',
    url: `${LEGAL_BASE_URL}/politica-de-privacidad`,
  },
} as const;

export type LegalDocument = (typeof LEGAL_LINKS)[keyof typeof LEGAL_LINKS];

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
