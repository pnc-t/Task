import apiClient from '@/lib/api-client';
import { Invitation, InviteMemberData } from '@/types/invitation';

export const invitationService = {
  // プロジェクト管理者用
  inviteMember: async (projectId: string, data: InviteMemberData): Promise<Invitation> => {
    const response = await apiClient.post(`/projects/${projectId}/invitations`, data);
    return response.data;
  },

  getProjectInvitations: async (projectId: string): Promise<Invitation[]> => {
    const response = await apiClient.get(`/projects/${projectId}/invitations`);
    return response.data;
  },

  cancelInvitation: async (projectId: string, invitationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/projects/${projectId}/invitations/${invitationId}`);
    return response.data;
  },

  resendInvitation: async (projectId: string, invitationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/projects/${projectId}/invitations/${invitationId}/resend`);
    return response.data;
  },

  // ユーザー用
  getMyInvitations: async (): Promise<Invitation[]> => {
    const response = await apiClient.get('/users/me/invitations');
    return response.data;
  },

  respondToInvitation: async (
    invitationId: string,
    action: 'accept' | 'decline'
  ): Promise<{ success: boolean; message: string; projectId?: string }> => {
    const response = await apiClient.post(`/users/me/invitations/${invitationId}/respond`, {
      action,
    });
    return response.data;
  },
};
