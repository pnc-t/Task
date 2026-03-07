export interface Invitation {
  id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  role: string;
  expiresAt: string;
  createdAt: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    description?: string;
  };
  inviterId: string;
  inviter?: {
    id: string;
    name: string;
    email: string;
  };
  inviteeId?: string;
  invitee?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface InviteMemberData {
  email: string;
  role?: string;
}
