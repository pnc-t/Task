'use client';

import { memo } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { User, Bot, CheckCircle, XCircle, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { sanitizeText } from '@/lib/sanitize';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-500' : 'bg-purple-500'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message content */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{sanitizeText(message.content)}</p>
        </div>

        {/* Tool results */}
        {message.metadata?.toolResults && message.metadata.toolResults.length > 0 && (
          <div className="mt-2 space-y-2 w-full">
            {message.metadata.toolResults.map((result, index) => (
              <div
                key={index}
                className={`rounded-lg p-3 text-sm ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Wrench className="w-4 h-4 text-gray-500" />
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium">
                    {result.success ? 'ツール実行成功' : 'ツール実行失敗'}
                  </span>
                </div>
                {result.data?.message && (
                  <p className="text-gray-700">{sanitizeText(result.data.message)}</p>
                )}
                {result.error && (
                  <p className="text-red-600">{sanitizeText(result.error)}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-400 mt-1">
          {format(new Date(message.createdAt), 'HH:mm', { locale: ja })}
        </span>
      </div>
    </div>
  );
});
