'use client';

import { Task } from '@/types/task';
import { Flag } from 'lucide-react';

interface TaskDragOverlayProps {
  task: Task;
}

const statusLabels: Record<string, string> = {
  todo: '未着手',
  in_progress: '進行中',
  done: '完了',
};

const statusColors: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
};

const priorityColors: Record<string, string> = {
  high: 'text-red-600',
  medium: 'text-yellow-600',
  low: 'text-green-600',
};

export function TaskDragOverlay({ task }: TaskDragOverlayProps) {
  return (
    <div className="bg-white rounded-lg shadow-xl border-2 border-blue-400 p-3 w-64 opacity-90 rotate-2 pointer-events-none">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-semibold text-gray-900 text-sm truncate flex-1">
          {task.title}
        </h4>
        <span
          className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}
        >
          {statusLabels[task.status]}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Flag className={`w-3 h-3 ${priorityColors[task.priority]}`} />
        <span>
          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
        </span>
      </div>
    </div>
  );
}
