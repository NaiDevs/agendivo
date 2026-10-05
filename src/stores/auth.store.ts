import { create } from "zustand";

import type { AuthUser } from "@/domain/entities/auth-user";
import type {
  ConfirmSignUpInput,
  RegisterAccountInput,
  SignInInput,
} from "@/domain/repositories/auth.repository";
import { SupabaseAuthRepository } from "@/infrastructure/auth/supabase-auth.repository";
import { isSupabaseConfigured } from "@/infrastructure/supabase/client";
import { toastService } from "@/stores/feedback.store";

export const AUTH_PHASE = {
  AUTHENTICATED: "authenticated",
  ERROR: "error",
  IDLE: "idle",
  LOADING: "loading",
  UNAUTHENTICATED: "unauthenticated",
  UNCONFIGURED: "unconfigured",
} as const;

type AuthPhase = (typeof AUTH_PHASE)[keyof typeof AUTH_PHASE];

interface AuthStore {
  cancelEmailConfirmation: () => void;
  completeEmailConfirmation: (code: string) => Promise<boolean>;
  completeInvitation: (
    accessToken: string,
    refreshToken: string,
  ) => Promise<boolean>;
  completeInvitationCode: (code: string) => Promise<boolean>;
  configureInvitationPassword: (password: string) => Promise<boolean>;
  confirmSignUp: (input: ConfirmSignUpInput) => Promise<boolean>;
  confirmationEmail: string | null;
  error: string | null;
  initialize: () => Promise<void>;
  isWorking: boolean;
  notice: string | null;
  mustConfigurePassword: boolean;
  phase: AuthPhase;
  register: (input: RegisterAccountInput) => Promise<boolean>;
  resendSignUpConfirmation: (email: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  signIn: (input: SignInInput) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  updateProfile: (fullName: string) => Promise<boolean>;
  user: AuthUser | null;
  clearFeedback: () => void;
}

const repository = new SupabaseAuthRepository();
const INVITATION_PASSWORD_KEY = "agendivo:configure-invitation-password";
let unsubscribeFromAuth: (() => void) | null = null;

export function authErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Error de autenticación.";
  if (message.toLowerCase().includes("email rate limit exceeded")) {
    return "Alcanzamos temporalmente el límite de correos. Revisa si ya recibiste el primero o espera hasta una hora antes de intentarlo nuevamente.";
  }
  if (message.includes("Invalid login credentials")) {
    return "El correo o la contraseña son incorrectos.";
  }
  if (message.includes("Email not confirmed")) {
    return "Confirma tu correo antes de iniciar sesión.";
  }
  if (
    message.toLowerCase().includes("token has expired") ||
    message.toLowerCase().includes("otp_expired") ||
    message.toLowerCase().includes("invalid otp")
  ) {
    return "El código es inválido o venció. Solicita uno nuevo e inténtalo otra vez.";
  }
  if (message.includes("User already registered")) {
    return "Ya existe una cuenta con este correo.";
  }
  return message;
}

export function isEmailConfirmationRequired(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("email not confirmed")
  );
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  confirmationEmail: null,
  error: null,
  isWorking: false,
  notice: null,
  mustConfigurePassword: false,
  phase: AUTH_PHASE.IDLE,
  user: null,

  cancelEmailConfirmation: (): void => {
    set({ confirmationEmail: null, error: null, notice: null });
  },

  confirmSignUp: async (input: ConfirmSignUpInput): Promise<boolean> => {
    set({ error: null, isWorking: true });
    try {
      const session = await repository.confirmSignUp(input);
      set({
        confirmationEmail: null,
        isWorking: false,
        notice: null,
        phase: AUTH_PHASE.AUTHENTICATED,
        user: session.user,
      });
      toastService.success(
        "Correo confirmado",
        "Tu sesión se abrió correctamente en Agendivo.",
      );
      return true;
    } catch (error: unknown) {
      const message = authErrorMessage(error);
      set({ error: message, isWorking: false });
      return false;
    }
  },

  completeEmailConfirmation: async (code: string): Promise<boolean> => {
    set({ error: null, isWorking: true, notice: null });
    try {
      const session = await repository.exchangeCodeForSession(code);
      set({
        isWorking: false,
        phase: AUTH_PHASE.AUTHENTICATED,
        user: session.user,
      });
      toastService.success(
        "Correo confirmado",
        "Tu sesión se abrió correctamente en Agendivo.",
      );
      return true;
    } catch (error: unknown) {
      const message = authErrorMessage(error);
      set({ error: message, isWorking: false });
      toastService.error("No pudimos confirmar tu correo", message);
      return false;
    }
  },

  completeInvitation: async (
    accessToken: string,
    refreshToken: string,
  ): Promise<boolean> => {
    set({ error: null, isWorking: true, notice: null });
    try {
      const session = await repository.setSession(accessToken, refreshToken);
      set({
        isWorking: false,
        mustConfigurePassword: true,
        phase: AUTH_PHASE.AUTHENTICATED,
        user: session.user,
      });
      localStorage.setItem(INVITATION_PASSWORD_KEY, "true");
      return true;
    } catch (error: unknown) {
      const message = authErrorMessage(error);
      set({ error: message, isWorking: false });
      toastService.error("No pudimos abrir la invitación", message);
      return false;
    }
  },

  completeInvitationCode: async (code: string): Promise<boolean> => {
    set({ error: null, isWorking: true, notice: null });
    try {
      const session = await repository.exchangeCodeForSession(code);
      set({
        isWorking: false,
        mustConfigurePassword: true,
        phase: AUTH_PHASE.AUTHENTICATED,
        user: session.user,
      });
      localStorage.setItem(INVITATION_PASSWORD_KEY, "true");
      return true;
    } catch (error: unknown) {
      const message = authErrorMessage(error);
      set({ error: message, isWorking: false });
      toastService.error("No pudimos abrir la invitación", message);
      return false;
    }
  },

  configureInvitationPassword: async (password: string): Promise<boolean> => {
    set({ error: null, isWorking: true });
    try {
      await repository.updatePassword(password);
      localStorage.removeItem(INVITATION_PASSWORD_KEY);
      set({ isWorking: false, mustConfigurePassword: false });
      toastService.success(
        "Contraseña configurada",
        "Tu cuenta de equipo está lista.",
      );
      return true;
    } catch (error: unknown) {
      const message = authErrorMessage(error);
      set({ error: message, isWorking: false });
      return false;
    }
  },

  initialize: async (): Promise<void> => {
    if (!isSupabaseConfigured()) {
      set({ phase: AUTH_PHASE.UNCONFIGURED, user: null });
      return;
    }
    if (get().phase === AUTH_PHASE.LOADING) {
      return;
    }

    set({ error: null, phase: AUTH_PHASE.LOADING });
    try {
      const session = await repository.getCurrentSession();
      unsubscribeFromAuth ??= repository.onSessionChange(
        (nextSession): void => {
          set({
            phase:
              nextSession === null
                ? AUTH_PHASE.UNAUTHENTICATED
                : AUTH_PHASE.AUTHENTICATED,
            user: nextSession?.user ?? null,
          });
        },
      );
      set({
        phase:
          session === null
            ? AUTH_PHASE.UNAUTHENTICATED
            : AUTH_PHASE.AUTHENTICATED,
        user: session?.user ?? null,
        mustConfigurePassword:
          session !== null &&
          localStorage.getItem(INVITATION_PASSWORD_KEY) === "true",
      });
    } catch (error: unknown) {
      set({
        error: authErrorMessage(error),
        phase: AUTH_PHASE.ERROR,
        user: null,
      });
    }
  },

  register: async (input: RegisterAccountInput): Promise<boolean> => {
    set({ error: null, isWorking: true, notice: null });
    try {
      const session = await repository.register(input);
      if (session === null) {
        set({
          confirmationEmail: input.email,
          isWorking: false,
          notice: "Revisa tu correo y confirma la cuenta para continuar.",
          phase: AUTH_PHASE.UNAUTHENTICATED,
          user: null,
        });
      } else {
        set({
          isWorking: false,
          phase: AUTH_PHASE.AUTHENTICATED,
          user: session.user,
        });
      }
      return true;
    } catch (error: unknown) {
      set({ error: authErrorMessage(error), isWorking: false });
      return false;
    }
  },

  resendSignUpConfirmation: async (email: string): Promise<boolean> => {
    set({ error: null, isWorking: true });
    try {
      await repository.resendSignUpConfirmation(email);
      set({
        isWorking: false,
        notice: "Enviamos un código nuevo. Revisa también la carpeta de spam.",
      });
      return true;
    } catch (error: unknown) {
      set({ error: authErrorMessage(error), isWorking: false });
      return false;
    }
  },

  resetPassword: async (email: string): Promise<boolean> => {
    set({ error: null, isWorking: true });
    try {
      await repository.resetPassword(email);
      set({
        isWorking: false,
        notice:
          "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.",
      });
      return true;
    } catch (error: unknown) {
      set({ error: authErrorMessage(error), isWorking: false });
      return false;
    }
  },

  signIn: async (input: SignInInput): Promise<boolean> => {
    set({ error: null, isWorking: true, notice: null });
    try {
      const session = await repository.signIn(input);
      set({
        isWorking: false,
        phase: AUTH_PHASE.AUTHENTICATED,
        user: session.user,
      });
      return true;
    } catch (error: unknown) {
      if (isEmailConfirmationRequired(error)) {
        set({
          confirmationEmail: input.email,
          error: null,
          isWorking: false,
          notice: "Ingresa el código enviado a tu correo para continuar.",
        });
        return false;
      }
      set({ error: authErrorMessage(error), isWorking: false });
      return false;
    }
  },

  signOut: async (): Promise<boolean> => {
    set({ error: null, isWorking: true, notice: null });
    try {
      await repository.signOut();
      localStorage.removeItem(INVITATION_PASSWORD_KEY);
      set({
        isWorking: false,
        mustConfigurePassword: false,
        phase: AUTH_PHASE.UNAUTHENTICATED,
        user: null,
      });
      return true;
    } catch (error: unknown) {
      set({ error: authErrorMessage(error), isWorking: false });
      return false;
    }
  },

  updateProfile: async (fullName: string): Promise<boolean> => {
    set({ error: null, isWorking: true });
    try {
      const user = await repository.updateProfile(fullName);
      set({ isWorking: false, user });
      toastService.success("Perfil actualizado correctamente");
      return true;
    } catch (error: unknown) {
      const message = authErrorMessage(error);
      set({ error: message, isWorking: false });
      toastService.error("No pudimos actualizar el perfil", message);
      return false;
    }
  },

  clearFeedback: (): void => set({ error: null, notice: null }),
}));
