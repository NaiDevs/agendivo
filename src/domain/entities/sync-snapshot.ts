export interface BusinessSyncPayload {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string;
  currency: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
  device_id: string;
}

export interface CustomerSyncPayload {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  custom_field_values: Record<
    string,
    boolean | number | string | string[] | null
  >;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
  device_id: string;
}

export interface CustomerCustomFieldSyncPayload {
  id: string;
  business_id: string;
  name: string;
  type: string;
  is_required: boolean;
  is_multiple: boolean;
  options: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
  device_id: string;
}

export interface EmployeeSyncPayload {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
  device_id: string;
}

export interface ServiceSyncPayload {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
  device_id: string;
}

export interface AppointmentSyncPayload {
  id: string;
  business_id: string;
  customer_id: string;
  employee_id: string | null;
  service_id: string | null;
  service_items: Array<{
    serviceId: string;
    name: string;
    durationMinutes: number;
    price: number;
  }>;
  starts_at: string;
  ends_at: string;
  status: string;
  price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
  device_id: string;
}

export interface FiscalProfileSyncPayload {
  id: string;
  business_id: string;
  country_code: string;
  legal_name: string;
  tax_id: string | null;
  invoices_enabled: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
  device_id: string;
}

export interface EmissionPointSyncPayload {
  id: string;
  business_id: string;
  name: string;
  establishment_code: string;
  emission_point_code: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
  device_id: string;
}

export interface FiscalAuthorizationSyncPayload {
  id: string;
  business_id: string;
  emission_point_id: string;
  cai: string;
  document_type: string;
  range_start: number;
  range_end: number;
  next_number: number;
  valid_until: string;
  active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
  device_id: string;
}

export interface SyncSnapshot {
  appointments: AppointmentSyncPayload[];
  business: BusinessSyncPayload;
  customers: CustomerSyncPayload[];
  customerCustomFields: CustomerCustomFieldSyncPayload[];
  emissionPoints: EmissionPointSyncPayload[];
  employees: EmployeeSyncPayload[];
  fiscalAuthorizations: FiscalAuthorizationSyncPayload[];
  fiscalProfiles: FiscalProfileSyncPayload[];
  services: ServiceSyncPayload[];
}

export interface SyncPullResult {
  customers: CustomerSyncPayload[];
  customerCustomFields: CustomerCustomFieldSyncPayload[];
  employees: EmployeeSyncPayload[];
  services: ServiceSyncPayload[];
  appointments: AppointmentSyncPayload[];
}
