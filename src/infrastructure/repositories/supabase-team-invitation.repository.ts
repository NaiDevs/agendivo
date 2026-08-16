import { FunctionsHttpError } from "@supabase/supabase-js";

import type {
  TeamInvitationInput,
  TeamInvitationRepository,
  TeamInvitationResult,
} from "@/domain/repositories/team-invitation.repository";
import { getSupabaseClient } from "@/infrastructure/supabase/client";

function isInvitationResult(value: unknown): value is TeamInvitationResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "userId" in value &&
    typeof value.userId === "string"
  );
}

interface FunctionErrorPayload {
  error: string;
}

function isFunctionErrorPayload(value: unknown): value is FunctionErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  );
}

function invitationErrorMessage(code: string): string {
  switch (code) {
    case "EMAIL_ALREADY_REGISTERED":
      return "Ya existe una cuenta con este correo.";
    case "INVITATION_FORBIDDEN":
      return "Solo el propietario o un administrador puede invitar miembros.";
    case "INVITATION_EMAIL_FAILED":
      return "No pudimos enviar el correo de invitación. Revisa la configuración SMTP de Supabase.";
    case "TEAM_MEMBER_CREATE_FAILED":
      return "No pudimos vincular la cuenta con este negocio.";
    default:
      return "No pudimos crear la cuenta del nuevo miembro.";
  }
}

export class SupabaseTeamInvitationRepository implements TeamInvitationRepository {
  async invite(input: TeamInvitationInput): Promise<TeamInvitationResult> {
    const { data, error } = await getSupabaseClient().functions.invoke(
      "invite-team-member",
      { body: input },
    );
    if (error !== null) {
      if (error instanceof FunctionsHttpError) {
        const payload: unknown = await error.context
          .clone()
          .json()
          .catch((): null => null);
        if (isFunctionErrorPayload(payload)) {
          throw new Error(invitationErrorMessage(payload.error));
        }
      }
      throw error;
    }
    if (!isInvitationResult(data)) {
      throw new Error("Supabase devolvió una invitación inválida.");
    }
    return data;
  }
}
