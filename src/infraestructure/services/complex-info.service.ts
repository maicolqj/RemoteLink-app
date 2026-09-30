import Share from 'react-native-share';
import { API_BASE_URL } from '../../data/lib/apollo/client';
import SecureStorageService from './SecureStorageService';

/**
 * El PDF de un documento de "Mi Conjunto".
 *
 * No tiene URL pública (actas y estados financieros no pueden quedar al
 * alcance de cualquiera con el enlace): el backend lo sirve tras validar el
 * token. Por eso se pide con el encabezado de autorización y nunca se arma
 * un enlace que se pueda reenviar.
 */
export const complexDocumentFileUrl = (documentId: string): string =>
  `${API_BASE_URL}/api/v1/complex-documents/${documentId}/file`;

export async function getAccessToken(): Promise<string | null> {
  const tokens = await SecureStorageService.getTokens();
  return tokens?.accessToken ?? null;
}

async function fetchPdfBase64(documentId: string): Promise<string> {
  const token = await getAccessToken();
  const response = await fetch(complexDocumentFileUrl(documentId), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Tu sesión venció. Vuelve a abrir el documento.'
        : 'No se pudo descargar el PDF.',
    );
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('No se pudo leer el PDF.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Comparte o guarda el PDF con la hoja nativa (Drive, WhatsApp, "Guardar en
 * el dispositivo"…). Se materializa como archivo en el caché interno.
 */
export async function shareComplexDocumentPdf(
  documentId: string,
  fileName: string,
  title: string,
): Promise<void> {
  const base64 = await fetchPdfBase64(documentId);
  const safeName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  await Share.open({
    title,
    subject: title,
    filename: safeName.replace(/\.pdf$/i, ''),
    url: `data:application/pdf;base64,${base64}`,
    type: 'application/pdf',
    // El FileProvider de la librería solo mapea cache-path (ver VisitQRScreen).
    useInternalStorage: true,
    failOnCancel: false,
  });
}
