import type { SyncableEntity } from "@/domain/entities/syncable-entity";

export const FISCAL_DOCUMENT_TYPE = {
  INVOICE: "invoice",
} as const;

export interface FiscalProfile extends SyncableEntity {
  businessId: string;
  countryCode: string;
  legalName: string;
  taxId: string | null;
  invoicesEnabled: boolean;
}

export interface EmissionPoint extends SyncableEntity {
  businessId: string;
  name: string;
  establishmentCode: string;
  emissionPointCode: string;
}

export interface FiscalAuthorization extends SyncableEntity {
  businessId: string;
  emissionPointId: string;
  cai: string;
  documentType: typeof FISCAL_DOCUMENT_TYPE.INVOICE;
  rangeStart: number;
  rangeEnd: number;
  nextNumber: number;
  validUntil: string;
  active: boolean;
}

export interface FiscalConfiguration {
  profile: FiscalProfile;
  emissionPoint: EmissionPoint | null;
  authorization: FiscalAuthorization | null;
}
