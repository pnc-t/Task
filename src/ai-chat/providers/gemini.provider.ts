import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import {
  AiProviderInterface,
  ChatMessage,
  ToolDefinition,
  ChatResponse,
  StreamChunk,
  ToolCall,
} from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AiProviderInterface {
  private client: GoogleGenerativeAI;
  private model: string;
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private configService: ConfigService) {
    this.client = new GoogleGenerativeAI(
      this.configService.get<string>('GOOGLE_API_KEY') || '',
    );
    this.model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-pro';
  }

  private convertSchemaType(type: string): SchemaType {
    switch (type) {
      case 'string':
        return SchemaType.STRING;
      case 'number':
        return SchemaType.NUMBER;
      case 'integer':
        return SchemaType.INTEGER;
      case 'boolean':
        return SchemaType.BOOLEAN;
      case 'array':
        return SchemaType.ARRAY;
      case 'object':
        return SchemaType.OBJECT;
      default:
        return SchemaType.STRING;
    }
  }

  private convertProperties(properties: Record<string, any>): Record<string, any> {
    const converted: Record<string, any> = {};
    for (const [key, value] of Object.entries(properties)) {
      converted[key] = {
        type: this.convertSchemaType(value.type),
        description: value.description,
      };
      if (value.enum) {
        converted[key].enum = value.enum;
      }
      if (value.items) {
        converted[key].items = {
          type: this.convertSchemaType(value.items.type),
        };
      }
    }
    return converted;
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ChatResponse> {
    try {
      const geminiTools = tools?.length
        ? [
            {
              functionDeclarations: tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                parameters: {
                  type: SchemaType.OBJECT,
                  properties: this.convertProperties(tool.parameters.properties),
                  required: tool.parameters.required || [],
                },
              })),
            },
          ]
        : undefined;

      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
        tools: geminiTools,
      });

      const systemMessage = messages.find((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      const history = nonSystemMessages.slice(0, -1).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const chat = generativeModel.startChat({
        history,
        systemInstruction: systemMessage?.content
          ? ({ parts: [{ text: systemMessage.content }] } as any)
          : undefined,
      });

      const lastMessage = nonSystemMessages[nonSystemMessages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;

      let content = '';
      const toolCalls: ToolCall[] = [];

      for (const candidate of response.candidates || []) {
        for (const part of candidate.content.parts) {
          if ('text' in part) {
            content += part.text;
          } else if ('functionCall' in part && part.functionCall) {
            toolCalls.push({
              id: `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: part.functionCall.name,
              arguments: (part.functionCall.args || {}) as Record<string, any>,
            });
          }
        }
      }

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
      };
    } catch (error) {
      this.logger.error('Gemini chat error:', error);
      throw error;
    }
  }

  async chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    onChunk?: (chunk: StreamChunk) => void,
  ): Promise<ChatResponse> {
    try {
      const geminiTools = tools?.length
        ? [
            {
              functionDeclarations: tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                parameters: {
                  type: SchemaType.OBJECT,
                  properties: this.convertProperties(tool.parameters.properties),
                  required: tool.parameters.required || [],
                },
              })),
            },
          ]
        : undefined;

      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
        tools: geminiTools,
      });

      const systemMessage = messages.find((m) => m.role === 'system');
      const nonSystemMessages = messages.filter((m) => m.role !== 'system');

      const history = nonSystemMessages.slice(0, -1).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const chat = generativeModel.startChat({
        history,
        systemInstruction: systemMessage?.content
          ? ({ parts: [{ text: systemMessage.content }] } as any)
          : undefined,
      });

      const lastMessage = nonSystemMessages[nonSystemMessages.length - 1];
      const result = await chat.sendMessageStream(lastMessage.content);

      let fullContent = '';
      const toolCalls: ToolCall[] = [];

      for await (const chunk of result.stream) {
        for (const part of chunk.candidates?.[0]?.content?.parts || []) {
          if ('text' in part) {
            fullContent += part.text;
            onChunk?.({ type: 'content', content: part.text });
          } else if ('functionCall' in part && part.functionCall) {
            const toolCall: ToolCall = {
              id: `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: part.functionCall.name,
              arguments: (part.functionCall.args || {}) as Record<string, any>,
            };
            toolCalls.push(toolCall);
            onChunk?.({ type: 'tool_call', toolCall });
          }
        }
      }

      onChunk?.({ type: 'done' });

      return {
        content: fullContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
      };
    } catch (error) {
      this.logger.error('Gemini stream error:', error);
      onChunk?.({ type: 'error', error: error.message });
      throw error;
    }
  }
}
