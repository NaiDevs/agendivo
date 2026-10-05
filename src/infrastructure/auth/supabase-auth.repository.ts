import type { Session, User } from "@supabase/supabase-js";

import type { AuthSession, AuthUser } from "@/domain/entities/auth-user";
import type {
  AuthRepository,
  ConfirmSignUpInput,
  RegisterAccountInput,
  SignInInput,
} from "@/domain/repositories/auth.repository";
import { getSupabaseClient } from "@/infrastructure/supabase/client";

const EMAIL_CONFIRMATION_REDIRECT = "agendivo://auth/callback";

function readFullName(user: User): string {
  const fullName: unknown = user.user_metadata.full_name;
  return typeof fullName === "string" && fullName.trim() !== ""
    ? fullName.trim()
    : "Usuario Agendivo";
}

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: readFullName(user),
  };
}

function mapSession(session: Session): AuthSession {
  return {
    accessToken: session.access_token,
    user: mapUser(session.user),
  };
}

export class SupabaseAuthRepository implements AuthRepository {
  async confirmSignUp(input: ConfirmSignUpInput): Promise<AuthSession> {
    const { data, error } = await getSupabaseClient().auth.verifyOtp({
      email: input.email,
      token: input.token,
      type: "signup",
    });
    if (error !== null) {
      throw error;
    }
    if (data.session === null) {
      throw new Error(
        "Supabase no devolvió una sesión al confirmar el correo.",
      );
    }
    return mapSession(data.session);
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error !== null) {
      throw error;
    }
    return data.session === null ? null : mapSession(data.session);
  }

  onSessionChange(listener: (session: AuthSession | null) => void): () => void {
    const { data } = getSupabaseClient().auth.onAuthStateChange(
      (_event, session): void =>
        listener(session === null ? null : mapSession(session)),
    );
    return (): void => data.subscription.unsubscribe();
  }

  async register(input: RegisterAccountInput): Promise<AuthSession | null> {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.fullName },
        emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT,
      },
    });
    if (error !== null) {
      throw error;
    }
    return data.session === null ? null : mapSession(data.session);
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(
      email,
      { redirectTo: EMAIL_CONFIRMATION_REDIRECT },
    );
    if (error !== null) {
      throw error;
    }
  }

  async resendSignUpConfirmation(email: string): Promise<void> {
    const { error } = await getSupabaseClient().auth.resend({
      email,
      options: { emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT },
      type: "signup",
    });
    if (error !== null) {
      throw error;
    }
  }

  async exchangeCodeForSession(code: string): Promise<AuthSession> {
    const { data, error } =
      await getSupabaseClient().auth.exchangeCodeForSession(code);
    if (error !== null) {
      throw error;
    }
    return mapSession(data.session);
  }

  async signIn(input: SignInInput): Promise<AuthSession> {
    const { data, error } =
      await getSupabaseClient().auth.signInWithPassword(input);
    if (error !== null) {
      throw error;
    }
    return mapSession(data.session);
  }

  async setSession(
    accessToken: string,
    refreshToken: string,
  ): Promise<AuthSession> {
    const { data, error } = await getSupabaseClient().auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error !== null) throw error;
    if (data.session === null) {
      throw new Error("Supabase no devolvió una sesión para la invitación.");
    }
    return mapSession(data.session);
  }

  async signOut(): Promise<void> {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error !== null) {
      throw error;
    }
  }

  async updateProfile(fullName: string): Promise<AuthUser> {
    const normalizedName = fullName.trim();
    if (normalizedName.length < 2) {
      throw new Error("Ingresa un nombre válido.");
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: normalizedName },
    });
    if (error !== null) throw error;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: normalizedName })
      .eq("id", data.user.id);
    if (profileError !== null) throw profileError;
    return mapUser(data.user);
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await getSupabaseClient().auth.updateUser({ password });
    if (error !== null) throw error;
  }
}
