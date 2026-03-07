export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    toolResults?: ToolExecutionResult[];
  };
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
  };
  messages: ChatMessage[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface StreamChunk {
  type: 'content' | 'tool_call' | 'done' | 'error';
  content?: string;
  toolCall?: ToolCall;
  error?: string;
}

export interface SendMessageResponse {
  conversationId: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  toolResults: ToolExecutionResult[];
}

export type AiProviderType = 'openai' | 'anthropic' | 'gemini';
