import type { SyncableEntity } from "@/domain/entities/syncable-entity";

export const EMPLOYEE_ACCOUNT_ROLE = {
  EMPLOYEE: "employee",
  OWNER: "owner",
} as const;

export type EmployeeAccountRole =
  (typeof EMPLOYEE_ACCOUNT_ROLE)[keyof typeof EMPLOYEE_ACCOUNT_ROLE];

export interface Employee extends SyncableEntity {
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  color: string;
  userId: string | null;
  accountRole: EmployeeAccountRole;
}
