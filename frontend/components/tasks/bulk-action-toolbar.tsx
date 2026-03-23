'use client';

import { useState } from 'react';
import { X, Trash2, ArrowRight } from 'lucide-react';
import { taskService } from '@/services/task.service';

interface BulkActionToolbarProps {
  selectedIds: Set<string>;
  onClear: () => void;
  onUpdate: () => void;
}

export function BulkActionToolbar({ selectedIds, onClear, onUpdate }: BulkActionToolbarProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const count = selectedIds.size;
  if (count === 0) return null;

  const handleBulkAction = async (action: { status?: string; priority?: string; delete?: boolean }) => {
    setIsProcessing(true);
    try {
      await taskService.bulkUpdate({
        taskIds: Array.from(selectedIds),
        ...action,
      });
      onClear();
      onUpdate();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <span className="text-sm font-medium">{count}件選択中</span>

      <div className="h-5 w-px bg-gray-600" />

      <div className="flex items-center gap-1">
        <button
          onClick={() => handleBulkAction({ status: 'todo' })}
          disabled={isProcessing}
          className="px-2.5 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
        >
          未着手
        </button>
        <button
          onClick={() => handleBulkAction({ status: 'in_progress' })}
          disabled={isProcessing}
          className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded transition-colors disabled:opacity-50"
        >
          進行中
        </button>
        <button
          onClick={() => handleBulkAction({ status: 'done' })}
          disabled={isProcessing}
          className="px-2.5 py-1 text-xs bg-green-600 hover:bg-green-500 rounded transition-colors disabled:opacity-50"
        >
          完了
        </button>
      </div>

      <div className="h-5 w-px bg-gray-600" />

      <div className="flex items-center gap-1">
        <button
          onClick={() => handleBulkAction({ priority: 'high' })}
          disabled={isProcessing}
          className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-500 rounded transition-colors disabled:opacity-50"
        >
          高
        </button>
        <button
          onClick={() => handleBulkAction({ priority: 'medium' })}
          disabled={isProcessing}
          className="px-2.5 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 rounded transition-colors disabled:opacity-50"
        >
          中
        </button>
        <button
          onClick={() => handleBulkAction({ priority: 'low' })}
          disabled={isProcessing}
          className="px-2.5 py-1 text-xs bg-green-700 hover:bg-green-600 rounded transition-colors disabled:opacity-50"
        >
          低
        </button>
      </div>

      <div className="h-5 w-px bg-gray-600" />

      <button
        onClick={() => {
          if (confirm(`${count}件のタスクを削除しますか？`)) {
            handleBulkAction({ delete: true });
          }
        }}
        disabled={isProcessing}
        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <button
        onClick={onClear}
        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
