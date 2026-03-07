import apiClient from '@/lib/api-client';
import { Milestone } from '@/types/task';

export interface CreateMilestoneData {
  name: string;
  description?: string;
  dueDate: string;
  projectId: string;
}

export interface UpdateMilestoneData {
  name?: string;
  description?: string;
  dueDate?: string;
  status?: 'pending' | 'completed';
}

export const milestoneService = {
  getAll: async (projectId: string): Promise<Milestone[]> => {
    const response = await apiClient.get('/milestones', {
      params: { projectId },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Milestone> => {
    const response = await apiClient.get(`/milestones/${id}`);
    return response.data;
  },

  create: async (data: CreateMilestoneData): Promise<Milestone> => {
    const response = await apiClient.post('/milestones', data);
    return response.data;
  },

  update: async (id: string, data: UpdateMilestoneData): Promise<Milestone> => {
    const response = await apiClient.patch(`/milestones/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/milestones/${id}`);
  },
};