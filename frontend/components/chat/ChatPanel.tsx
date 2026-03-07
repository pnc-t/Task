'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { useAuthStore } from '@/lib/auth-store';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import {
  X,
  MessageSquarePlus,
  History,
  Trash2,
  Bot,
  ChevronDown,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AiProviderType } from '@/types/chat';

interface ChatPanelProps {
  projectId?: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const {
    conversations,
    currentConversation,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    isPanelOpen,
    selectedProvider,
    setIsPanelOpen,
    setSelectedProvider,
    clearError,
    connect,
    disconnect,
    loadConversations,
    loadConversation,
    sendMessage,
    deleteConversation,
    startNewConversation,
  } = useChatStore();

  const { accessToken } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const showHistory = useRef(false);

  // Connect to WebSocket on mount
  useEffect(() => {
    if (accessToken && isPanelOpen) {
      connect(accessToken);
      loadConversations();
    }

    return () => {
      // Don't disconnect on unmount to maintain connection
    };
  }, [accessToken, isPanelOpen, connect, loadConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, streamingContent]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content, projectId);
  };

  const handleSelectConversation = (conversationId: string) => {
    loadConversation(conversationId);
    showHistory.current = false;
  };

  const handleDeleteConversation = async (
    e: React.MouseEvent,
    conversationId: string,
  ) => {
    e.stopPropagation();
    if (confirm('この会話を削除しますか？')) {
      await deleteConversation(conversationId);
    }
  };

  const providers: { value: AiProviderType; label: string }[] = [
    { value: 'openai', label: 'OpenAI (GPT-4)' },
    { value: 'anthropic', label: 'Anthropic (Claude)' },
    { value: 'gemini', label: 'Google (Gemini)' },
  ];

  if (!isPanelOpen) return null;

  return (
    <div className="fixed bottom-20 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-lg">
        <div className="flex items-center gap-2 text-white">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">AIアシスタント</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startNewConversation}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="新しい会話"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          <button
            onClick={() => (showHistory.current = !showHistory.current)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="履歴"
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsPanelOpen(false)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Provider selector */}
      <div className="px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as AiProviderType)}
            className="flex-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
          >
            {providers.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Conversation history sidebar */}
      {showHistory.current && (
        <div className="absolute top-14 left-0 right-0 bottom-0 bg-white z-10 flex flex-col">
          <div className="px-4 py-3 border-b font-medium flex items-center justify-between">
            <span>会話履歴</span>
            <button
              onClick={() => (showHistory.current = false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                履歴がありません
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className="px-4 py-3 border-b hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {conv.title || '新しい会話'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(conv.updatedAt), 'MM/dd HH:mm', {
                        locale: ja,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentConversation?.messages.length === 0 && !streamingContent && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Bot className="w-12 h-12 mb-4" />
            <p className="text-center">
              タスク管理についてお手伝いします。
              <br />
              何でもお聞きください。
            </p>
            <div className="mt-4 text-sm space-y-1">
              <p>例:</p>
              <p className="text-gray-500">「新しいタスクを作成して」</p>
              <p className="text-gray-500">「今日期限のタスクを教えて」</p>
              <p className="text-gray-500">「高優先度のタスク一覧」</p>
            </div>
          </div>
        )}

        {currentConversation?.messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Streaming content */}
        {isStreaming && streamingContent && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
              <p className="whitespace-pre-wrap">{streamingContent}</p>
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isStreaming && !streamingContent && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        isLoading={isStreaming}
        placeholder="タスクについて質問..."
      />
    </div>
  );
}
