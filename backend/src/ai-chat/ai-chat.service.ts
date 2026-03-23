import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AiProviderFactory, AiProviderType } from './providers/ai-provider.factory';
import { TaskToolsService, ToolExecutionResult } from './tools/task-tools';
import { ChatMessage, ToolCall, StreamChunk } from './providers/ai-provider.interface';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

const BASE_SYSTEM_PROMPT = `あなたはタスク管理アプリのAIアシスタントです。ユーザーのタスク管理を支援します。

あなたには以下の能力があります：
- タスクの作成、検索、更新
- タスク詳細の取得
- コメントの追加
- プロジェクト一覧の取得
- プロジェクトメンバーの確認

ユーザーのリクエストに応じて、適切なツールを使用してタスク操作を行ってください。
操作の結果は分かりやすく日本語で伝えてください。

注意事項：
- タスクを作成する際、プロジェクトが指定されていない場合は、自動的に新しいプロジェクトが作成されるため、プロジェクトIDを聞く必要はありません。タスクのタイトルをもとに自動作成されます。
- 既存のプロジェクトにタスクを追加する場合は、ユーザーが既存プロジェクトを指定していることを確認してください。
- 検索や更新の前に、必要に応じてタスクの詳細を確認してください。
- エラーが発生した場合は、ユーザーにわかりやすく説明してください。`;

function buildSystemPrompt(context?: { page?: string; projectId?: string; projectName?: string; taskId?: string; taskTitle?: string }): string {
  let prompt = BASE_SYSTEM_PROMPT;

  if (context) {
    prompt += '\n\n## 現在のコンテキスト';
    if (context.page) prompt += `\nユーザーが閲覧中のページ: ${context.page}`;
    if (context.projectName) prompt += `\n現在のプロジェクト: ${context.projectName} (ID: ${context.projectId})`;
    if (context.taskTitle) prompt += `\n現在のタスク: ${context.taskTitle} (ID: ${context.taskId})`;
    prompt += '\n\nこのコンテキストを考慮して、より的確な提案をしてください。例えば、プロジェクトページにいる場合はそのプロジェクトに関連する操作を優先してください。';
  }

  return prompt;
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private prisma: PrismaService,
    private aiProviderFactory: AiProviderFactory,
    private taskTools: TaskToolsService,
  ) {}

  async createConversation(userId: string, dto: CreateConversationDto) {
    // projectIdが指定されている場合、アクセス権をチェック
    if (dto.projectId) {
      await this.checkProjectAccess(dto.projectId, userId);
    }

    return this.prisma.chatConversation.create({
      data: {
        title: dto.title,
        userId,
        projectId: dto.projectId,
      },
      include: {
        messages: true,
      },
    });
  }

  async getConversations(userId: string) {
    return this.prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        project: { select: { id: true, name: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('会話が見つかりません');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('この会話へのアクセス権限がありません');
    }

    return conversation;
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('会話が見つかりません');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('この会話を削除する権限がありません');
    }

    await this.prisma.chatConversation.delete({
      where: { id: conversationId },
    });

    return { message: '会話を削除しました' };
  }

  async sendMessage(
    userId: string,
    dto: SendMessageDto,
    onChunk?: (chunk: StreamChunk) => void,
    providerType?: AiProviderType,
  ) {
    // 会話を取得または作成
    let conversation;
    if (dto.conversationId) {
      conversation = await this.getConversation(dto.conversationId, userId);
    } else {
      conversation = await this.createConversation(userId, {
        projectId: dto.projectId,
      });
    }

    // ユーザーメッセージを保存
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: dto.content,
      },
    });

    // 会話履歴を構築
    const messages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(dto.context) },
      ...conversation.messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      { role: 'user', content: dto.content },
    ];

    // AIプロバイダーを取得
    const provider = this.aiProviderFactory.getProvider(providerType);
    const tools = this.taskTools.getToolDefinitions();

    // ストリーミングでAIレスポンスを取得
    let response = await provider.chatStream(messages, tools, onChunk);
    let fullContent = response.content;
    const toolResults: ToolExecutionResult[] = [];

    // ツール呼び出しがある場合は実行
    let iterations = 0;
    const maxIterations = 5; // 無限ループ防止

    while (response.toolCalls && response.toolCalls.length > 0 && iterations < maxIterations) {
      iterations++;

      for (const toolCall of response.toolCalls) {
        const result = await this.taskTools.executeTool(
          toolCall,
          userId,
          conversation.projectId || undefined,
        );
        toolResults.push(result);

        // ツール実行結果をメッセージに追加
        messages.push({
          role: 'assistant',
          content: fullContent || `ツール ${toolCall.name} を実行中...`,
        });
        messages.push({
          role: 'user',
          content: `ツール実行結果 (${toolCall.name}):\n${JSON.stringify(result, null, 2)}`,
        });
      }

      // 次のAIレスポンスを取得
      response = await provider.chatStream(messages, tools, onChunk);
      fullContent = response.content;
    }

    // アシスタントメッセージを保存
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: fullContent,
        metadata: toolResults.length > 0 ? { toolResults: JSON.parse(JSON.stringify(toolResults)) } : Prisma.JsonNull,
      },
    });

    // 会話タイトルを自動設定（最初のメッセージの場合）
    if (!conversation.title && conversation.messages.length === 0) {
      const title = dto.content.substring(0, 50) + (dto.content.length > 50 ? '...' : '');
      await this.prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { title },
      });
    }

    // 会話のupdatedAtを更新
    await this.prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: conversation.id,
      userMessage,
      assistantMessage,
      toolResults,
    };
  }

  async sendMessageSync(
    userId: string,
    dto: SendMessageDto,
    providerType?: AiProviderType,
  ) {
    // 会話を取得または作成
    let conversation;
    if (dto.conversationId) {
      conversation = await this.getConversation(dto.conversationId, userId);
    } else {
      conversation = await this.createConversation(userId, {
        projectId: dto.projectId,
      });
    }

    // ユーザーメッセージを保存
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: dto.content,
      },
    });

    // 会話履歴を構築
    const messages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(dto.context) },
      ...conversation.messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      { role: 'user', content: dto.content },
    ];

    // AIプロバイダーを取得
    const provider = this.aiProviderFactory.getProvider(providerType);
    const tools = this.taskTools.getToolDefinitions();

    // 同期でAIレスポンスを取得
    let response = await provider.chat(messages, tools);
    let fullContent = response.content;
    const toolResults: ToolExecutionResult[] = [];

    // ツール呼び出しがある場合は実行
    let iterations = 0;
    const maxIterations = 5;

    while (response.toolCalls && response.toolCalls.length > 0 && iterations < maxIterations) {
      iterations++;

      for (const toolCall of response.toolCalls) {
        const result = await this.taskTools.executeTool(
          toolCall,
          userId,
          conversation.projectId || undefined,
        );
        toolResults.push(result);

        messages.push({
          role: 'assistant',
          content: fullContent || `ツール ${toolCall.name} を実行中...`,
        });
        messages.push({
          role: 'user',
          content: `ツール実行結果 (${toolCall.name}):\n${JSON.stringify(result, null, 2)}`,
        });
      }

      response = await provider.chat(messages, tools);
      fullContent = response.content;
    }

    // アシスタントメッセージを保存
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: fullContent,
        metadata: toolResults.length > 0 ? { toolResults: JSON.parse(JSON.stringify(toolResults)) } : Prisma.JsonNull,
      },
    });

    // 会話タイトルを自動設定
    if (!conversation.title && conversation.messages.length === 0) {
      const title = dto.content.substring(0, 50) + (dto.content.length > 50 ? '...' : '');
      await this.prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { title },
      });
    }

    await this.prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: conversation.id,
      userMessage,
      assistantMessage,
      toolResults,
    };
  }

  private async checkProjectAccess(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });

    if (!member) {
      throw new ForbiddenException('このプロジェクトへのアクセス権限がありません');
    }
  }
}
