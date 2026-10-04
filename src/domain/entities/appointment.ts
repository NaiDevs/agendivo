import type { SyncableEntity } from "@/domain/entities/syncable-entity";
import type { ServiceLineItem } from "@/domain/entities/service-line-item";

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
} as const;

export type AppointmentStatus =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

export interface Appointment extends SyncableEntity {
  businessId: string;
  customerId: string;
  employeeId: string | null;
  serviceId: string | null;
  serviceItems: ServiceLineItem[];
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  price: number;
  notes: string | null;
}
