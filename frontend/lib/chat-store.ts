import { create } from 'zustand';
import { ChatConversation, ChatMessage, StreamChunk, AiProviderType } from '@/types/chat';
import { aiChatClient } from './ai-chat-client';

interface ChatState {
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  isPanelOpen: boolean;
  selectedProvider: AiProviderType;

  // Actions
  setIsPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setSelectedProvider: (provider: AiProviderType) => void;
  clearError: () => void;

  // Chat operations
  connect: (token: string) => void;
  disconnect: () => void;
  loadConversations: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, projectId?: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  startNewConversation: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: [],
  currentConversation: null,
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  error: null,
  isPanelOpen: false,
  selectedProvider: 'openai',

  setIsPanelOpen: (open) => set({ isPanelOpen: open }),

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  setSelectedProvider: (provider) => set({ selectedProvider: provider }),

  clearError: () => set({ error: null }),

  connect: (token: string) => {
    aiChatClient.connect(token);
  },

  disconnect: () => {
    aiChatClient.disconnect();
  },

  loadConversations: async () => {
    try {
      set({ isLoading: true, error: null });
      const { conversations } = await aiChatClient.getConversationsAsync();
      set({ conversations, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadConversation: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { conversation } = await aiChatClient.getConversationAsync(conversationId);
      set({ currentConversation: conversation, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  sendMessage: async (content: string, projectId?: string) => {
    const { currentConversation, selectedProvider } = get();

    try {
      set({ isStreaming: true, streamingContent: '', error: null });

      // 楽観的更新: ユーザーメッセージを即座に追加
      const tempUserMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      if (currentConversation) {
        set({
          currentConversation: {
            ...currentConversation,
            messages: [...currentConversation.messages, tempUserMessage],
          },
        });
      }

      const onChunk = (chunk: StreamChunk) => {
        if (chunk.type === 'content' && chunk.content) {
          set((state) => ({
            streamingContent: state.streamingContent + chunk.content,
          }));
        }
      };

      const result = await aiChatClient.sendMessageAsync(
        content,
        currentConversation?.id,
        projectId || currentConversation?.projectId,
        selectedProvider,
        onChunk,
      );

      // レスポンスで会話を更新
      const updatedConversation: ChatConversation = {
        id: result.conversationId,
        title: currentConversation?.title,
        createdAt: currentConversation?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: projectId || currentConversation?.projectId,
        messages: currentConversation
          ? [...currentConversation.messages.filter((m) => m.id !== tempUserMessage.id), result.userMessage, result.assistantMessage]
          : [result.userMessage, result.assistantMessage],
      };

      set({
        currentConversation: updatedConversation,
        isStreaming: false,
        streamingContent: '',
      });

      // 会話リストも更新
      set((state) => {
        const existingIndex = state.conversations.findIndex(
          (c) => c.id === result.conversationId
        );
        if (existingIndex >= 0) {
          const updated = [...state.conversations];
          updated[existingIndex] = updatedConversation;
          return { conversations: updated };
        } else {
          return { conversations: [updatedConversation, ...state.conversations] };
        }
      });
    } catch (error: any) {
      set({
        error: error.message,
        isStreaming: false,
        streamingContent: '',
      });
    }
  },

  deleteConversation: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null });

      await new Promise<void>((resolve, reject) => {
        const handleDeleted = (data: { conversationId: string }) => {
          if (data.conversationId === conversationId) {
            aiChatClient.off('chat:conversation_deleted', handleDeleted);
            aiChatClient.off('chat:error', handleError);
            resolve();
          }
        };
        const handleError = (error: { error: string }) => {
          aiChatClient.off('chat:conversation_deleted', handleDeleted);
          aiChatClient.off('chat:error', handleError);
          reject(new Error(error.error));
        };
        aiChatClient.on('chat:conversation_deleted', handleDeleted);
        aiChatClient.on('chat:error', handleError);
        aiChatClient.deleteConversation(conversationId);
      });

      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== conversationId),
        currentConversation:
          state.currentConversation?.id === conversationId
            ? null
            : state.currentConversation,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  startNewConversation: () => {
    set({ currentConversation: null, streamingContent: '' });
  },
}));
