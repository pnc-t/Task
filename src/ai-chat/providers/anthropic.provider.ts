import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  AiProviderInterface,
  ChatMessage,
  ToolDefinition,
  ChatResponse,
  StreamChunk,
  ToolCall,
} from './ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AiProviderInterface {
  private client: Anthropic;
  private model: string;
  private readonly logger = new Logger(AnthropicProvider.name);

  constructor(private configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
    this.model = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-sonnet-4-20250514';
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ChatResponse> {
    try {
      const systemMessage = messages.find((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      const anthropicMessages = nonSystemMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      const anthropicTools = tools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
      }));

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemMessage?.content,
        messages: anthropicMessages,
        tools: anthropicTools,
      });

      let content = '';
      const toolCalls: ToolCall[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.input as Record<string, any>,
          });
        }
      }

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: response.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
      };
    } catch (error) {
      this.logger.error('Anthropic chat error:', error);
      throw error;
    }
  }

  async chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<ChatResponse> {
    try {
      const systemMessage = messages.find((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      const anthropicMessages = nonSystemMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      const anthropicTools = tools?.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
      }));

      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: 4096,
        system: systemMessage?.content,
        messages: anthropicMessages,
        tools: anthropicTools,
      });

      let fullContent = '';
      const toolCalls: ToolCall[] = [];
      let currentToolCall: { id: string; name: string; arguments: string } | null = null;
      let finishReason: 'stop' | 'tool_calls' = 'stop';

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            currentToolCall = {
              id: event.content_block.id,
              name: event.content_block.name,
              arguments: '',
            };
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            fullContent += event.delta.text;
            onChunk?.({ type: 'content', content: event.delta.text });
          } else if (event.delta.type === 'input_json_delta' && currentToolCall) {
            currentToolCall.arguments += event.delta.partial_json;
          }
        } else if (event.type === 'content_block_stop') {
          if (currentToolCall) {
            try {
              const parsedArgs = JSON.parse(currentToolCall.arguments);
              toolCalls.push({
                id: currentToolCall.id,
                name: currentToolCall.name,
                arguments: parsedArgs,
              });
              onChunk?.({
                type: 'tool_call',
                toolCall: {
                  id: currentToolCall.id,
                  name: currentToolCall.name,
                  arguments: parsedArgs,
                },
              });
            } catch (e) {
              this.logger.warn('Failed to parse tool call arguments');
            }
            currentToolCall = null;
          }
        } else if (event.type === 'message_stop') {
          // メッセージ完了
        } else if (event.type === 'message_delta') {
          if (event.delta.stop_reason === 'tool_use') {
            finishReason = 'tool_calls';
          }
        }
      }

      onChunk?.({ type: 'done' });

      return {
        content: fullContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason,
      };
    } catch (error) {
      this.logger.error('Anthropic stream error:', error);
      onChunk?.({ type: 'error', error: error.message });
      throw error;
    }
  }
}
