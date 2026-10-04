import { z } from "zod";
import { APPOINTMENT_STATUS } from "@/domain/entities/appointment";
import { CUSTOMER_CUSTOM_FIELD_TYPE } from "@/domain/entities/customer-custom-field";
import type {
  SyncPullResult,
  SyncSnapshot,
} from "@/domain/entities/sync-snapshot";
import type { CloudSyncRepository } from "@/domain/repositories/cloud-sync.repository";
import { getSupabaseClient } from "@/infrastructure/supabase/client";

interface SyncPushResponse {
  business_id: string;
  synced_at: string;
}

function isSyncPushResponse(value: unknown): value is SyncPushResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "business_id" in value &&
    typeof value.business_id === "string" &&
    "synced_at" in value &&
    typeof value.synced_at === "string"
  );
}

const syncFields = {
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  version: z.number().int().positive(),
  device_id: z.string().uuid(),
};

const pullCustomerSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  notes: z.string().nullable(),
  custom_field_values: z.record(
    z.string().uuid(),
    z.union([
      z.boolean(),
      z.number().finite(),
      z.string(),
      z.array(z.string()),
      z.null(),
    ]),
  ),
  ...syncFields,
});

const pullCustomerCustomFieldSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  type: z.enum([
    CUSTOMER_CUSTOM_FIELD_TYPE.TEXT,
    CUSTOMER_CUSTOM_FIELD_TYPE.TELEPHONE,
    CUSTOMER_CUSTOM_FIELD_TYPE.NUMBER,
    CUSTOMER_CUSTOM_FIELD_TYPE.BOOLEAN,
    CUSTOMER_CUSTOM_FIELD_TYPE.DATETIME,
    CUSTOMER_CUSTOM_FIELD_TYPE.EMAIL,
    CUSTOMER_CUSTOM_FIELD_TYPE.SELECT,
  ]),
  is_required: z.boolean(),
  is_multiple: z.boolean(),
  options: z.array(z.string()),
  sort_order: z.number().int().nonnegative(),
  ...syncFields,
});

const pullEmployeeSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  color: z.string(),
  ...syncFields,
});

const pullServiceSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  duration_minutes: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  ...syncFields,
});

const pullAppointmentSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  employee_id: z.string().uuid().nullable(),
  service_id: z.string().uuid().nullable(),
  service_items: z.array(
    z.object({
      serviceId: z.string().uuid(),
      name: z.string(),
      durationMinutes: z.number().int().positive(),
      price: z.number().int().nonnegative(),
    }),
  ),
  starts_at: z.string(),
  ends_at: z.string(),
  status: z.enum([
    APPOINTMENT_STATUS.PENDING,
    APPOINTMENT_STATUS.CONFIRMED,
    APPOINTMENT_STATUS.COMPLETED,
    APPOINTMENT_STATUS.CANCELLED,
    APPOINTMENT_STATUS.NO_SHOW,
  ]),
  price: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  ...syncFields,
});

const syncPullResponseSchema = z.object({
  customers: z.array(pullCustomerSchema),
  customerCustomFields: z.array(pullCustomerCustomFieldSchema),
  employees: z.array(pullEmployeeSchema),
  services: z.array(pullServiceSchema),
  appointments: z.array(pullAppointmentSchema),
});

export class SupabaseCloudSyncRepository implements CloudSyncRepository {
  async ensureBusiness(
    businessId: string,
    businessName: string,
  ): Promise<void> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .maybeSingle();

    if (error !== null) throw error;
    if (data !== null) return;

    const { error: createError } = await supabase.rpc("create_business", {
      business_id: businessId,
      business_name: businessName,
    });
    if (createError !== null) throw createError;
  }

  async push(
    businessId: string,
    deviceId: string,
    deviceName: string,
    snapshot: SyncSnapshot,
  ): Promise<string> {
    const { data, error } = await getSupabaseClient().rpc("sync_push", {
      target_business_id: businessId,
      source_device_id: deviceId,
      business_payload: { ...snapshot.business, device_name: deviceName },
      customers_payload: snapshot.customers,
      employees_payload: snapshot.employees,
      services_payload: snapshot.services,
      appointments_payload: snapshot.appointments,
    });

    if (error !== null) throw error;
    if (!isSyncPushResponse(data)) {
      throw new Error(
        "Supabase devolvio una respuesta de sincronizacion invalida.",
      );
    }

    const { error: fiscalError } = await getSupabaseClient().rpc(
      "sync_fiscal_configuration",
      {
        target_business_id: businessId,
        fiscal_profiles_payload: snapshot.fiscalProfiles,
        emission_points_payload: snapshot.emissionPoints,
        fiscal_authorizations_payload: snapshot.fiscalAuthorizations,
      },
    );
    if (fiscalError !== null) throw fiscalError;

    const { error: customFieldsError } = await getSupabaseClient().rpc(
      "sync_customer_custom_fields",
      {
        target_business_id: businessId,
        customer_custom_fields_payload: snapshot.customerCustomFields,
        customer_values_payload: snapshot.customers.map((customer) => ({
          id: customer.id,
          business_id: customer.business_id,
          custom_field_values: customer.custom_field_values,
          updated_at: customer.updated_at,
          version: customer.version,
        })),
      },
    );
    if (customFieldsError !== null) throw customFieldsError;

    const { error: appointmentServicesError } = await getSupabaseClient().rpc(
      "sync_appointment_service_items",
      {
        target_business_id: businessId,
        appointments_payload: snapshot.appointments.map((appointment) => ({
          id: appointment.id,
          business_id: appointment.business_id,
          service_items: appointment.service_items,
          updated_at: appointment.updated_at,
          version: appointment.version,
        })),
      },
    );
    if (appointmentServicesError !== null) throw appointmentServicesError;

    return data.synced_at;
  }

  async pull(
    businessId: string,
    deviceId: string,
    sinceAt: string | null,
  ): Promise<SyncPullResult> {
    const { data, error } = await getSupabaseClient().rpc("sync_pull", {
      target_business_id: businessId,
      requesting_device_id: deviceId,
      since_at: sinceAt,
    });

    if (error !== null) throw error;

    return syncPullResponseSchema.parse(data);
  }
}
