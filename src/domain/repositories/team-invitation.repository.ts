export interface TeamInvitationInput {
  businessId: string;
  employeeId: string;
  name: string;
  phone: string | null;
  email: string;
  color: string;
  deviceId: string;
  createdAt: string;
}

export interface TeamInvitationResult {
  userId: string;
}

export interface TeamInvitationRepository {
  invite(input: TeamInvitationInput): Promise<TeamInvitationResult>;
}
