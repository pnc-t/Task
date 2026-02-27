import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AiProviderInterface,
  ChatMessage,
  ToolDefinition,
  ChatResponse,
  StreamChunk,
  ToolCall,
} from './ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AiProviderInterface {
  private client: OpenAI;
  private model: string;
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o';
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ChatResponse> {
    try {
      const openAiMessages = messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      const openAiTools = tools?.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: openAiMessages,
        tools: openAiTools,
        tool_choice: tools ? 'auto' : undefined,
      });

      const choice = response.choices[0];
      const toolCalls: ToolCall[] = [];

      if (choice.message.tool_calls) {
        for (const tc of choice.message.tool_calls) {
          if (tc.type === 'function' && tc.function) {
            toolCalls.push({
              id: tc.id,
              name: tc.function.name,
              arguments: JSON.parse(tc.function.arguments),
            });
          }
        }
      }

      return {
        content: choice.message.content || '',
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: choice.finish_reason === 'tool_calls' ? 'tool_calls' : 'stop',
      };
    } catch (error) {
      this.logger.error('OpenAI chat error:', error);
      throw error;
    }
  }

  async chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<ChatResponse> {
    try {
      const openAiMessages = messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      const openAiTools = tools?.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: openAiMessages,
        tools: openAiTools,
        tool_choice: tools ? 'auto' : undefined,
        stream: true,
      });

      let fullContent = '';
      const toolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();
      let finishReason: 'stop' | 'tool_calls' | 'length' | 'error' = 'stop';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const choiceFinishReason = chunk.choices[0]?.finish_reason;

        if (delta?.content) {
          fullContent += delta.content;
          onChunk?.({ type: 'content', content: delta.content });
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const index = tc.index;
            if (!toolCalls.has(index)) {
              toolCalls.set(index, { id: tc.id || '', name: tc.function?.name || '', arguments: '' });
            }
            const existing = toolCalls.get(index)!;
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments) existing.arguments += tc.function.arguments;
          }
        }

        if (choiceFinishReason === 'tool_calls') {
          finishReason = 'tool_calls';
        } else if (choiceFinishReason === 'length') {
          finishReason = 'length';
        }
      }

      const parsedToolCalls: ToolCall[] = [];
      for (const tc of toolCalls.values()) {
        try {
          parsedToolCalls.push({
            id: tc.id,
            name: tc.name,
            arguments: JSON.parse(tc.arguments),
          });
          onChunk?.({
            type: 'tool_call',
            toolCall: {
              id: tc.id,
              name: tc.name,
              arguments: JSON.parse(tc.arguments),
            },
          });
        } catch (e) {
          this.logger.warn('Failed to parse tool call arguments:', tc.arguments);
        }
      }

      onChunk?.({ type: 'done' });

      return {
        content: fullContent,
        toolCalls: parsedToolCalls.length > 0 ? parsedToolCalls : undefined,
        finishReason,
      };
    } catch (error) {
      this.logger.error('OpenAI stream error:', error);
      onChunk?.({ type: 'error', error: error.message });
      throw error;
    }
  }
}
