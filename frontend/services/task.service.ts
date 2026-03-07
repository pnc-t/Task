import apiClient from '@/lib/api-client';
import {Task, CreateTaskData, UpdateTaskData, TaskAttachment, Subtask, TaskComment, ActivityLog, TimeEntry, CreateTimeEntryData} from '@/types/task';

export const taskService = {
  getAll: async (projectId?: string): Promise<Task[]> => {
    const params = projectId ? { projectId } : {};
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  },

  getByStatus: async (projectId: string) => {
    const response = await apiClient.get('/tasks/by-status', {
      params: { projectId },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Task> => {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: CreateTaskData): Promise<Task> => {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    const response = await apiClient.post('/tasks', cleanData);
    return response.data;
  },

  update: async (id: string, data: Partial<UpdateTaskData>): Promise<Task> => {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    const response = await apiClient.patch(`/tasks/${id}`, cleanData);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  addAssignee: async (taskId: string, userId: string) => {
    const response = await apiClient.post(`/tasks/${taskId}/assignees/${userId}`);
    return response.data;
  },

  removeAssignee: async (taskId: string, userId: string) => {
    await apiClient.delete(`/tasks/${taskId}/assignees/${userId}`);
  },


  // コメント関連
  getComments: async (taskId: string): Promise<TaskComment[]> => {
    const response = await apiClient.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  addComment: async (taskId: string, content: string): Promise<TaskComment> => {
    const response = await apiClient.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  },

  updateComment: async (taskId: string, commentId: string, content: string): Promise<TaskComment> => {
    const response = await apiClient.patch(`/tasks/${taskId}/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (taskId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
  },

  // サブタスク関連
  getSubtasks: async (taskId: string): Promise<Subtask[]> => {
    const response = await apiClient.get(`/tasks/${taskId}/subtasks`);
    return response.data;
  },

  addSubtask: async (taskId: string, title: string): Promise<Subtask> => {
    const response = await apiClient.post(`/tasks/${taskId}/subtasks`, { title });
    return response.data;
  },

  updateSubtask: async (taskId: string, subtaskId: string, data: Partial<Subtask>): Promise<Subtask> => {
    const response = await apiClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, data);
    return response.data;
  },

  deleteSubtask: async (taskId: string, subtaskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  },

  reorderSubtasks: async (taskId: string, subtaskIds: string[]): Promise<void> => {
    await apiClient.post(`/tasks/${taskId}/subtasks/reorder`, { subtaskIds });
  },

  // 添付ファイル関連
  getAttachments: async (taskId: string): Promise<TaskAttachment[]> => {
    const response = await apiClient.get(`/tasks/${taskId}/attachments`);
    return response.data;
  },

  uploadAttachment: async (taskId: string, file: File): Promise<TaskAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAttachment: async (taskId: string, attachmentId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
  },

  // 活動履歴関連
  getActivityLogs: async (taskId: string): Promise<ActivityLog[]> => {
    const response = await apiClient.get(`/tasks/${taskId}/activity`);
    return response.data;
  },

  // 依存関係関連
  addDependency: async (taskId: string, dependsOnId: string) => {
    try {
      console.log(`[API] Adding dependency: taskId=${taskId}, dependsOnId=${dependsOnId}`);
      const response = await apiClient.post(`/tasks/${taskId}/dependencies/${dependsOnId}`);
      console.log('[API] Dependency added successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[API Error] Failed to add dependency:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      const message = error?.response?.data?.message || error?.message || '依存関係の追加に失敗しました';
      const errorObj = new Error(message);
      (errorObj as any).response = error?.response;
      throw errorObj;
    }
  },

  removeDependency: async (taskId: string, dependsOnId: string) => {
    try {
      await apiClient.delete(`/tasks/${taskId}/dependencies/${dependsOnId}`);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || '依存関係の削除に失敗しました';
      const errorObj = new Error(message);
      (errorObj as any).response = error?.response;
      throw errorObj;
    }
  },

  // 工数記録関連
  getTimeEntries: async (taskId: string): Promise<TimeEntry[]> => {
    const response = await apiClient.get(`/tasks/${taskId}/time-entries`);
    return response.data;
  },

  createTimeEntry: async (taskId: string, data: CreateTimeEntryData): Promise<TimeEntry> => {
    const response = await apiClient.post(`/tasks/${taskId}/time-entries`, data);
    return response.data;
  },

  updateTimeEntry: async (taskId: string, entryId: string, data: Partial<CreateTimeEntryData>): Promise<TimeEntry> => {
    const response = await apiClient.patch(`/tasks/${taskId}/time-entries/${entryId}`, data);
    return response.data;
  },

  deleteTimeEntry: async (taskId: string, entryId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}/time-entries/${entryId}`);
  },
};