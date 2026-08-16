import type { AuthSession, AuthUser } from "@/domain/entities/auth-user";

export interface RegisterAccountInput {
  email: string;
  fullName: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface ConfirmSignUpInput {
  email: string;
  token: string;
}

export interface AuthRepository {
  confirmSignUp: (input: ConfirmSignUpInput) => Promise<AuthSession>;
  exchangeCodeForSession: (code: string) => Promise<AuthSession>;
  setSession: (
    accessToken: string,
    refreshToken: string,
  ) => Promise<AuthSession>;
  getCurrentSession: () => Promise<AuthSession | null>;
  onSessionChange: (
    listener: (session: AuthSession | null) => void,
  ) => () => void;
  register: (input: RegisterAccountInput) => Promise<AuthSession | null>;
  resendSignUpConfirmation: (email: string) => Promise<void>;
  signIn: (input: SignInInput) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  updateProfile: (fullName: string) => Promise<AuthUser>;
  updatePassword: (password: string) => Promise<void>;
}
