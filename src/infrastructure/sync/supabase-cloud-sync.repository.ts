import type { SyncSnapshot } from "@/domain/entities/sync-snapshot";
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

    if (error !== null) {
      throw error;
    }
    if (data !== null) {
      return;
    }

    const { error: createError } = await supabase.rpc("create_business", {
      business_id: businessId,
      business_name: businessName,
    });
    if (createError !== null) {
      throw createError;
    }
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

    if (error !== null) {
      throw error;
    }
    if (!isSyncPushResponse(data)) {
      throw new Error(
        "Supabase devolvió una respuesta de sincronización inválida.",
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
    if (fiscalError !== null) {
      throw fiscalError;
    }
    return data.synced_at;
  }
}
