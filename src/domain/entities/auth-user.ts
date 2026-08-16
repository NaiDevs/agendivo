export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}
