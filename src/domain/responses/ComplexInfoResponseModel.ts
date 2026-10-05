export type ComplexDocumentCategory =
  | 'COEXISTENCE_MANUAL'
  | 'BYLAWS'
  | 'COMMON_AREA_RULES'
  | 'CIRCULARS'
  | 'ASSEMBLY_MINUTES'
  | 'FINANCIAL_REPORTS'
  | 'INSURANCE'
  | 'FORMS'
  | 'OTHER';

export type ComplexDocumentAudience = 'ALL_RESIDENTS' | 'OWNERS_ONLY';

export type ComplexContactCategory =
  | 'ADMINISTRATION'
  | 'SECURITY'
  | 'COUNCIL'
  | 'MAINTENANCE'
  | 'EMERGENCY'
  | 'SERVICE'
  | 'OTHER';

export type ComplexScheduleCategory =
  | 'ADMINISTRATION'
  | 'SECURITY'
  | 'WASTE'
  | 'RECYCLING'
  | 'COMMON_AREA'
  | 'SERVICE'
  | 'OTHER';

/** Franja de un día. 0 = domingo. Cierre menor que apertura = cruza la medianoche. */
export interface ComplexScheduleSlot {
  dayOfWeek: number;
  /** HH:mm */
  openTime: string;
  /** HH:mm */
  closeTime: string;
}

export interface ComplexSchedule {
  id: string;
  category: ComplexScheduleCategory;
  name: string;
  slots: ComplexScheduleSlot[];
  note?: string | null;
}

export interface ComplexPublicInfo {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  website?: string | null;
  nit?: string | null;
  logoUrl?: string | null;
}

export interface ComplexContact {
  id: string;
  category: ComplexContactCategory;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  schedule?: string | null;
  notes?: string | null;
}

export interface ComplexDocument {
  id: string;
  category: ComplexDocumentCategory;
  title: string;
  description?: string | null;
  /** Solo llega al abrir el documento. */
  contentHtml?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  audience: ComplexDocumentAudience;
  publishedAt?: string | null;
  isPinned?: boolean;
  requiresAcknowledgement: boolean;
  /** YYYY-MM-DD */
  effectiveDate?: string | null;
  version: number;
  contentUpdatedAt: string;
}

export interface MyComplexDocument {
  document: ComplexDocument;
  /** Confirmación de la versión vigente; null = pendiente. */
  acknowledgedAt?: string | null;
  hasContent: boolean;
  hasFile: boolean;
}

/** Botones de acción rápida que eligió la administración. */
export interface ComplexInfoSettings {
  showCall: boolean;
  showEmail: boolean;
  showDirections: boolean;
  showWebsite: boolean;
}

export interface MyComplexInfo {
  complex: ComplexPublicInfo;
  settings: ComplexInfoSettings;
  contacts: ComplexContact[];
  schedules: ComplexSchedule[];
  documents: MyComplexDocument[];
  pendingAcknowledgements: number;
}
