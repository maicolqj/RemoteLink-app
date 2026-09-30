import type {
  ComplexContactCategory,
  ComplexDocumentCategory,
} from '../../../domain/responses/ComplexInfoResponseModel';

/** Secciones de documentos, en el orden en que se muestran. */
export const DOCUMENT_CATEGORY: Record<ComplexDocumentCategory, { label: string; icon: string }> = {
  COEXISTENCE_MANUAL: { label: 'Manual de convivencia', icon: 'menu-book' },
  BYLAWS: { label: 'Reglamento de propiedad horizontal', icon: 'gavel' },
  COMMON_AREA_RULES: { label: 'Normas de zonas comunes', icon: 'pool' },
  CIRCULARS: { label: 'Circulares y comunicados', icon: 'campaign' },
  ASSEMBLY_MINUTES: { label: 'Actas de asamblea y consejo', icon: 'groups' },
  FINANCIAL_REPORTS: { label: 'Estados financieros y presupuesto', icon: 'account-balance' },
  INSURANCE: { label: 'Pólizas y certificados', icon: 'verified-user' },
  FORMS: { label: 'Formatos y solicitudes', icon: 'assignment' },
  OTHER: { label: 'Otros documentos', icon: 'description' },
};

export const CONTACT_CATEGORY: Record<ComplexContactCategory, { label: string; icon: string }> = {
  ADMINISTRATION: { label: 'Administración', icon: 'business-center' },
  SECURITY: { label: 'Portería y seguridad', icon: 'security' },
  COUNCIL: { label: 'Consejo de administración', icon: 'groups' },
  MAINTENANCE: { label: 'Mantenimiento', icon: 'build' },
  EMERGENCY: { label: 'Emergencias', icon: 'local-hospital' },
  SERVICE: { label: 'Servicios', icon: 'handyman' },
  OTHER: { label: 'Otros', icon: 'contact-phone' },
};

/** "15 mar 2026". Una fecha sola (YYYY-MM-DD) se lee en local para no correr un día. */
export function formatDocDate(value?: string | null): string {
  if (!value) return '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

const RECENT_DAYS = 14;

/** Publicado o actualizado hace poco: se marca como "Nuevo". */
export function isRecent(value?: string | null): boolean {
  if (!value) return false;
  return Date.now() - new Date(value).getTime() < RECENT_DAYS * 24 * 60 * 60 * 1000;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '';
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}
