import { io, Socket } from 'socket.io-client';
import {
  ChatConversation,
  ChatMessage,
  StreamChunk,
  SendMessageResponse,
  AiProviderType,
} from '@/types/chat';

type EventCallback = (...args: any[]) => void;

class AiChatClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

    this.socket = io(`${wsUrl}/ai-chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('AI Chat WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('AI Chat WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('AI Chat WebSocket connection error:', error);
    });

    // 登録されたリスナーを復元
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket?.connected) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  sendMessage(
    content: string,
    conversationId?: string,
    projectId?: string,
    provider?: AiProviderType,
  ) {
    this.emit('chat:send', {
      content,
      conversationId,
      projectId,
      provider,
    });
  }

  getConversations() {
    this.emit('chat:get_conversations', {});
  }

  getConversation(conversationId: string) {
    this.emit('chat:get_conversation', { conversationId });
  }

  deleteConversation(conversationId: string) {
    this.emit('chat:delete_conversation', { conversationId });
  }

  // Promise-based API
  sendMessageAsync(
    content: string,
    conversationId?: string,
    projectId?: string,
    provider?: AiProviderType,
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<SendMessageResponse> {
    return new Promise((resolve, reject) => {
      const handleChunk = (chunk: StreamChunk) => {
        onChunk?.(chunk);
      };

      const handleEnd = (result: SendMessageResponse) => {
        this.off('chat:stream_chunk', handleChunk);
        this.off('chat:stream_end', handleEnd);
        this.off('chat:error', handleError);
        resolve(result);
      };

      const handleError = (error: { error: string }) => {
        this.off('chat:stream_chunk', handleChunk);
        this.off('chat:stream_end', handleEnd);
        this.off('chat:error', handleError);
        reject(new Error(error.error));
      };

      this.on('chat:stream_chunk', handleChunk);
      this.on('chat:stream_end', handleEnd);
      this.on('chat:error', handleError);

      this.sendMessage(content, conversationId, projectId, provider);
    });
  }

  getConversationsAsync(): Promise<{ conversations: ChatConversation[] }> {
    return new Promise((resolve, reject) => {
      const handleConversations = (data: { conversations: ChatConversation[] }) => {
        this.off('chat:conversations', handleConversations);
        this.off('chat:error', handleError);
        resolve(data);
      };

      const handleError = (error: { error: string }) => {
        this.off('chat:conversations', handleConversations);
        this.off('chat:error', handleError);
        reject(new Error(error.error));
      };

      this.on('chat:conversations', handleConversations);
      this.on('chat:error', handleError);

      this.getConversations();
    });
  }

  getConversationAsync(conversationId: string): Promise<{ conversation: ChatConversation }> {
    return new Promise((resolve, reject) => {
      const handleConversation = (data: { conversation: ChatConversation }) => {
        this.off('chat:conversation', handleConversation);
        this.off('chat:error', handleError);
        resolve(data);
      };

      const handleError = (error: { error: string }) => {
        this.off('chat:conversation', handleConversation);
        this.off('chat:error', handleError);
        reject(new Error(error.error));
      };

      this.on('chat:conversation', handleConversation);
      this.on('chat:error', handleError);

      this.getConversation(conversationId);
    });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const aiChatClient = new AiChatClient();
