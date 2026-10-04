import type { SyncableEntity } from "@/domain/entities/syncable-entity";
import type { ServiceLineItem } from "@/domain/entities/service-line-item";

export const PAYMENT_METHOD = {
  CASH: "cash",
  CARD: "card",
  TRANSFER: "transfer",
  OTHER: "other",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_DOCUMENT_TYPE = {
  FISCAL_INVOICE: "fiscal_invoice",
  RECEIPT: "receipt",
} as const;

export type PaymentDocumentType =
  (typeof PAYMENT_DOCUMENT_TYPE)[keyof typeof PAYMENT_DOCUMENT_TYPE];

export interface FiscalInvoiceSnapshot {
  authorizationId: string;
  cai: string;
  correlative: number;
  emissionPointCode: string;
  establishmentCode: string;
  issuedDate: string;
  legalName: string;
  number: string;
  rangeEnd: number;
  rangeStart: number;
  taxId: string;
  validUntil: string;
}

export interface Payment extends SyncableEntity {
  businessId: string;
  appointmentId: string | null;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  notes: string | null;
  documentType: PaymentDocumentType;
  fiscalInvoice: FiscalInvoiceSnapshot | null;
  serviceItems: ServiceLineItem[];
}
