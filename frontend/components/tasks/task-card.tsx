'use client';

import { useRouter } from 'next/navigation';
import { Task } from '@/types/task';
import { taskService } from '@/services/task.service';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Calendar, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const router = useRouter();

  const handleStatusChange = async (e: React.MouseEvent, newStatus: Task['status']) => {
    e.stopPropagation(); // カードクリックイベントを防ぐ
    try {
      await taskService.update(task.id, { status: newStatus });
      onUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleCardClick = () => {
    router.push(`/tasks/${task.id}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
          )}
        </div>

        <select
          value={task.status}
          onChange={(e) => handleStatusChange(e as any, e.target.value as Task['status'])}
          onClick={(e) => e.stopPropagation()}
          className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
        >
          <option value="todo">未着手</option>
          <option value="in_progress">進行中</option>
          <option value="done">完了</option>
        </select>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
        {task.project && (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {task.project.name}
          </span>
        )}

        <div className={`flex items-center gap-1 px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
          <Flag className="w-3 h-3" />
          <span className="text-xs font-medium">
            {task.priority === 'high' && '高'}
            {task.priority === 'medium' && '中'}
            {task.priority === 'low' && '低'}
          </span>
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(task.dueDate), 'MM/dd', { locale: ja })}</span>
          </div>
        )}

        {task.assignees && task.assignees.length > 0 ? (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {task.assignees.slice(0, 3).map((assignee) => (
                <UserAvatar
                  key={assignee.id}
                  name={assignee.user.name}
                  avatar={assignee.user.avatar}
                  size="xs"
                  className="ring-2 ring-white"
                />
              ))}
            </div>
            {task.assignees.length > 3 && (
              <span className="text-xs text-gray-500">+{task.assignees.length - 3}</span>
            )}
          </div>
        ) : task.assignee ? (
          <div className="flex items-center gap-1">
            <UserAvatar
              name={task.assignee.name}
              avatar={task.assignee.avatar}
              size="xs"
            />
            <span>{task.assignee.name}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}