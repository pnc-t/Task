import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AiChatService } from './ai-chat.service';
import { AiProviderType } from './providers/ai-provider.factory';
import { StreamChunk } from './providers/ai-provider.interface';

interface ChatSendPayload {
  content: string;
  conversationId?: string;
  projectId?: string;
  provider?: AiProviderType;
}

@WebSocketGateway({
  namespace: '/ai-chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class AiChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AiChatGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly aiChatService: AiChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;

      if (!token) {
        this.logger.warn('Connection without token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.data.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`AI Chat client connected: ${client.id} (user: ${userId})`);
    } catch (error) {
      this.logger.error('AI Chat connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      const socketSet = this.userSockets.get(userId);

      if (socketSet) {
        socketSet.delete(client.id);

        if (socketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }

    this.logger.log(`AI Chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('chat:send')
  async handleChatSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatSendPayload,
  ) {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('chat:error', { error: '認証が必要です' });
      return;
    }

    if (!payload.content || payload.content.trim() === '') {
      client.emit('chat:error', { error: 'メッセージを入力してください' });
      return;
    }

    try {
      // ストリーミングチャンクを送信するコールバック
      const onChunk = (chunk: StreamChunk) => {
        if (chunk.type === 'content' && chunk.content) {
          client.emit('chat:stream_chunk', {
            type: 'content',
            content: chunk.content,
          });
        } else if (chunk.type === 'tool_call' && chunk.toolCall) {
          client.emit('chat:stream_chunk', {
            type: 'tool_call',
            toolCall: chunk.toolCall,
          });
        } else if (chunk.type === 'done') {
          // ストリーミング完了はresult送信後に送る
        } else if (chunk.type === 'error') {
          client.emit('chat:error', { error: chunk.error });
        }
      };

      // メッセージを送信
      const result = await this.aiChatService.sendMessage(
        userId,
        {
          content: payload.content,
          conversationId: payload.conversationId,
          projectId: payload.projectId,
        },
        onChunk,
        payload.provider,
      );

      // 完了通知
      client.emit('chat:stream_end', {
        conversationId: result.conversationId,
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
        toolResults: result.toolResults,
      });
    } catch (error) {
      this.logger.error('Chat send error:', error);
      client.emit('chat:error', {
        error: error.message || 'メッセージの送信中にエラーが発生しました',
      });
    }
  }

  @SubscribeMessage('chat:get_conversations')
  async handleGetConversations(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('chat:error', { error: '認証が必要です' });
      return;
    }

    try {
      const conversations = await this.aiChatService.getConversations(userId);
      client.emit('chat:conversations', { conversations });
    } catch (error) {
      this.logger.error('Get conversations error:', error);
      client.emit('chat:error', { error: '会話一覧の取得に失敗しました' });
    }
  }

  @SubscribeMessage('chat:get_conversation')
  async handleGetConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('chat:error', { error: '認証が必要です' });
      return;
    }

    try {
      const conversation = await this.aiChatService.getConversation(
        payload.conversationId,
        userId,
      );
      client.emit('chat:conversation', { conversation });
    } catch (error) {
      this.logger.error('Get conversation error:', error);
      client.emit('chat:error', { error: '会話の取得に失敗しました' });
    }
  }

  @SubscribeMessage('chat:delete_conversation')
  async handleDeleteConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('chat:error', { error: '認証が必要です' });
      return;
    }

    try {
      await this.aiChatService.deleteConversation(payload.conversationId, userId);
      client.emit('chat:conversation_deleted', {
        conversationId: payload.conversationId,
      });
    } catch (error) {
      this.logger.error('Delete conversation error:', error);
      client.emit('chat:error', { error: '会話の削除に失敗しました' });
    }
  }
}
