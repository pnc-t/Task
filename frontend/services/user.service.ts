import apiClient from '@/lib/api-client';
import { UserProfile, UpdateProfileData, ChangePasswordData } from '@/types/user';

export const userService = {
  getMe: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  searchUsers: async (query: string) => {
    const response = await apiClient.get('/users/search', { params: { q: query } });
    return response.data;
  },

  getMyProjects: async () => {
    const response = await apiClient.get('/users/me/projects');
    return response.data;
  },

  getMyTasks: async (status?: string) => {
    const response = await apiClient.get('/users/me/tasks', {
      params: status ? { status } : {},
    });
    return response.data;
  },

  getActivityLog: async () => {
    const response = await apiClient.get('/users/me/activity');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await apiClient.patch('/users/me/profile', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData) => {
    const response = await apiClient.post('/users/me/change-password', data);
    return response.data;
  },

  deleteAccount: async (password: string) => {
    const response = await apiClient.delete('/users/me', { data: { password } });
    return response.data;
  },
};