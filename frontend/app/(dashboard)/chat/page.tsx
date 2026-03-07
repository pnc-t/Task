'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { useAuthStore } from '@/lib/auth-store';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import {
  MessageSquarePlus,
  History,
  Trash2,
  Bot,
  Settings,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AiProviderType } from '@/types/chat';

export default function ChatPage() {
  const {
    conversations,
    currentConversation,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    selectedProvider,
    setSelectedProvider,
    clearError,
    connect,
    loadConversations,
    loadConversation,
    sendMessage,
    deleteConversation,
    startNewConversation,
  } = useChatStore();

  const { accessToken } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (accessToken) {
      connect(accessToken);
      loadConversations();
    }
  }, [accessToken, connect, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, streamingContent]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleSelectConversation = (conversationId: string) => {
    loadConversation(conversationId);
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

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-72' : 'w-0'
        } transition-all duration-300 border-r bg-gray-50 flex flex-col overflow-hidden`}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">会話履歴</h2>
          <button
            onClick={startNewConversation}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="新しい会話"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>

        {/* Provider selector */}
        <div className="p-4 border-b">
          <label className="block text-xs text-gray-500 mb-1">AIプロバイダー</label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as AiProviderType)}
            className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {providers.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              会話履歴がありません
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`px-4 py-3 border-b cursor-pointer flex items-center justify-between group transition-colors ${
                  currentConversation?.id === conv.id
                    ? 'bg-blue-50 border-l-2 border-l-blue-500'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">
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

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">AIアシスタント</h1>
              <p className="text-xs text-gray-400">
                タスク管理をサポートします
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(!currentConversation || currentConversation.messages.length === 0) &&
            !streamingContent && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Bot className="w-16 h-16 mb-4 text-gray-300" />
                <h2 className="text-xl font-medium text-gray-500 mb-2">
                  AIアシスタントへようこそ
                </h2>
                <p className="text-center max-w-md mb-6">
                  タスク管理についてお手伝いします。
                  <br />
                  タスクの作成、検索、更新などを自然な言葉でリクエストできます。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-100 rounded-lg p-3 text-center">
                    「新しいタスクを作成して」
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 text-center">
                    「高優先度のタスク一覧」
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 text-center">
                    「期限が今週のタスクは？」
                  </div>
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
          placeholder="タスクについて質問... (例: 新しいタスクを作成して)"
        />
      </div>
    </div>
  );
}
