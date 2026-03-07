'use client';

import { useChatStore } from '@/lib/chat-store';
import { MessageCircle, X } from 'lucide-react';

export function ChatFloatingButton() {
  const { isPanelOpen, togglePanel } = useChatStore();

  return (
    <button
      onClick={togglePanel}
      className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 ${
        isPanelOpen
          ? 'bg-gray-600 hover:bg-gray-700'
          : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
      }`}
      title={isPanelOpen ? 'チャットを閉じる' : 'AIアシスタントを開く'}
    >
      {isPanelOpen ? (
        <X className="w-6 h-6 text-white" />
      ) : (
        <MessageCircle className="w-6 h-6 text-white" />
      )}
    </button>
  );
}
