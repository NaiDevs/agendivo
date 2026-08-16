import { createClient } from "npm:@supabase/supabase-js@2.111.0";

import { corsHeaders, jsonResponse } from "../_shared/http.ts";

interface InvitationRequest {
  businessId: string;
  employeeId: string;
  name: string;
  phone: string | null;
  email: string;
  color: string;
  deviceId: string;
  createdAt: string;
}

function readString(value: object, key: string): string | null {
  if (!(key in value)) return null;
  const candidate: unknown = value[key as keyof typeof value];
  return typeof candidate === "string" && candidate.trim() !== ""
    ? candidate.trim()
    : null;
}

function readInvitation(value: unknown): InvitationRequest | null {
  if (typeof value !== "object" || value === null) return null;
  const businessId = readString(value, "businessId");
  const employeeId = readString(value, "employeeId");
  const name = readString(value, "name");
  const email = readString(value, "email")?.toLowerCase() ?? null;
  const color = readString(value, "color");
  const deviceId = readString(value, "deviceId");
  const createdAt = readString(value, "createdAt");
  const phoneValue: unknown = "phone" in value ? value.phone : null;
  const phone =
    typeof phoneValue === "string" ? phoneValue.trim() || null : null;
  if (
    businessId === null ||
    employeeId === null ||
    name === null ||
    email === null ||
    !email.includes("@") ||
    color === null ||
    deviceId === null ||
    createdAt === null
  )
    return null;
  return {
    businessId,
    employeeId,
    name,
    phone,
    email,
    color,
    deviceId,
    createdAt,
  };
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "METHOD_NOT_ALLOWED" });
  }
  const authorization = request.headers.get("authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (
    authorization === null ||
    supabaseUrl === undefined ||
    publishableKey === undefined ||
    serviceRoleKey === undefined
  ) {
    return jsonResponse(request, 401, { error: "AUTH_REQUIRED" });
  }
  const input = readInvitation(await request.json().catch((): null => null));
  if (input === null) {
    return jsonResponse(request, 400, { error: "INVALID_INVITATION" });
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: callerData, error: callerError } =
    await userClient.auth.getUser();
  if (callerError !== null || callerData.user === null) {
    return jsonResponse(request, 401, { error: "INVALID_SESSION" });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: membership, error: membershipError } = await adminClient
    .from("business_members")
    .select("role")
    .eq("business_id", input.businessId)
    .eq("user_id", callerData.user.id)
    .maybeSingle();
  if (
    membershipError !== null ||
    membership === null ||
    !["owner", "admin"].includes(membership.role)
  ) {
    return jsonResponse(request, 403, { error: "INVITATION_FORBIDDEN" });
  }

  const { data: invitation, error: invitationError } =
    await adminClient.auth.admin.inviteUserByEmail(input.email, {
      data: { full_name: input.name },
      redirectTo: "agendivo://auth/callback",
    });
  if (invitationError !== null || invitation.user === null) {
    const duplicate =
      invitationError?.message.toLowerCase().includes("already") ?? false;
    return jsonResponse(request, duplicate ? 409 : 502, {
      error: duplicate ? "EMAIL_ALREADY_REGISTERED" : "INVITATION_EMAIL_FAILED",
    });
  }

  const userId = invitation.user.id;
  const { error: memberError } = await adminClient
    .from("business_members")
    .insert({
      business_id: input.businessId,
      user_id: userId,
      role: "employee",
    });
  const { error: employeeError } =
    memberError === null
      ? await adminClient.from("employees").insert({
          id: input.employeeId,
          business_id: input.businessId,
          user_id: userId,
          account_role: "employee",
          name: input.name,
          phone: input.phone,
          email: input.email,
          color: input.color,
          created_at: input.createdAt,
          updated_at: input.createdAt,
          deleted_at: null,
          version: 1,
          device_id: input.deviceId,
        })
      : { error: memberError };
  if (memberError !== null || employeeError !== null) {
    if (memberError === null) {
      await adminClient
        .from("business_members")
        .delete()
        .eq("business_id", input.businessId)
        .eq("user_id", userId);
    }
    await adminClient.auth.admin.deleteUser(userId);
    return jsonResponse(request, 500, { error: "TEAM_MEMBER_CREATE_FAILED" });
  }

  return jsonResponse(request, 200, { userId });
});
