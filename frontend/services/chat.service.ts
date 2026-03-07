import apiClient from '@/lib/api-client';
import {
  ChatConversation,
  SendMessageResponse,
  AiProviderType,
} from '@/types/chat';

export const chatService = {
  createConversation: async (data: {
    title?: string;
    projectId?: string;
  }): Promise<ChatConversation> => {
    const response = await apiClient.post('/ai-chat/conversations', data);
    return response.data;
  },

  getConversations: async (): Promise<ChatConversation[]> => {
    const response = await apiClient.get('/ai-chat/conversations');
    return response.data;
  },

  getConversation: async (conversationId: string): Promise<ChatConversation> => {
    const response = await apiClient.get(`/ai-chat/conversations/${conversationId}`);
    return response.data;
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await apiClient.delete(`/ai-chat/conversations/${conversationId}`);
  },

  sendMessage: async (
    content: string,
    conversationId?: string,
    projectId?: string,
    provider?: AiProviderType,
  ): Promise<SendMessageResponse> => {
    const params = provider ? { provider } : {};
    const response = await apiClient.post(
      '/ai-chat/messages',
      {
        content,
        conversationId,
        projectId,
      },
      { params },
    );
    return response.data;
  },
};
