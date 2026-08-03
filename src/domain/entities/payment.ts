import type { SyncableEntity } from "@/domain/entities/syncable-entity";

export const PAYMENT_METHOD = {
  CASH: "cash",
  CARD: "card",
  TRANSFER: "transfer",
  OTHER: "other",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export interface Payment extends SyncableEntity {
  businessId: string;
  appointmentId: string | null;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  notes: string | null;
}
