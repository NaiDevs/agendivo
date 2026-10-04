import type { SyncableEntity } from "@/domain/entities/syncable-entity";

export const CUSTOMER_CUSTOM_FIELD_TYPE = {
  BOOLEAN: "boolean",
  DATETIME: "datetime",
  EMAIL: "email",
  NUMBER: "number",
  SELECT: "select",
  TELEPHONE: "telephone",
  TEXT: "text",
} as const;

export type CustomerCustomFieldType =
  (typeof CUSTOMER_CUSTOM_FIELD_TYPE)[keyof typeof CUSTOMER_CUSTOM_FIELD_TYPE];

export type CustomerCustomFieldValue =
  boolean | number | string | string[] | null;

export type CustomerCustomFieldValues = Record<
  string,
  CustomerCustomFieldValue
>;

export interface CustomerCustomField extends SyncableEntity {
  businessId: string;
  name: string;
  type: CustomerCustomFieldType;
  isRequired: boolean;
  isMultiple: boolean;
  options: string[];
  sortOrder: number;
}
