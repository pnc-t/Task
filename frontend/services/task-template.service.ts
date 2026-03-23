import apiClient from '@/lib/api-client';

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  priority: string;
  estimatedHours?: number;
  subtasks?: { title: string }[];
  tags?: { name: string; color: string }[];
  projectId: string;
  createdAt: string;
  createdBy?: { id: string; name: string };
}

export interface CreateTaskTemplateData {
  name: string;
  description?: string;
  priority?: string;
  estimatedHours?: number;
  subtasks?: { title: string }[];
  tags?: { name: string; color: string }[];
  projectId: string;
}

export const taskTemplateService = {
  getAll: async (projectId: string): Promise<TaskTemplate[]> => {
    const response = await apiClient.get('/task-templates', { params: { projectId } });
    return response.data;
  },

  create: async (data: CreateTaskTemplateData): Promise<TaskTemplate> => {
    const response = await apiClient.post('/task-templates', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/task-templates/${id}`);
  },
};
