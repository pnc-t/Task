import apiClient from '@/lib/api-client';
import { Tag } from '@/types/task';

export interface CreateTagData {
  name: string;
  color?: string;
  projectId: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
}

export const tagService = {
  getAll: async (projectId: string): Promise<Tag[]> => {
    const response = await apiClient.get('/tags', {
      params: { projectId },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Tag> => {
    const response = await apiClient.get(`/tags/${id}`);
    return response.data;
  },

  create: async (data: CreateTagData): Promise<Tag> => {
    const response = await apiClient.post('/tags', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTagData): Promise<Tag> => {
    const response = await apiClient.patch(`/tags/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tags/${id}`);
  },

  // タスクへのタグ付け
  addTagToTask: async (taskId: string, tagId: string) => {
    const response = await apiClient.post(`/tags/task/${taskId}/tag/${tagId}`);
    return response.data;
  },

  removeTagFromTask: async (taskId: string, tagId: string) => {
    await apiClient.delete(`/tags/task/${taskId}/tag/${tagId}`);
  },
};