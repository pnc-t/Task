import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, Calendar, User, Info } from 'lucide-react';
import { Task } from '@/types/task';
import { UserAvatar } from '@/components/ui/user-avatar';

interface TaskSidebarProps {
  task: Task;
}

export function TaskSidebar({ task }: TaskSidebarProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-600" />
          <span className="font-semibold text-sm text-gray-900">タスク情報</span>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* 期限 */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-medium">期限</span>
          </div>
          {task.dueDate ? (
            <>
              <div className="text-sm font-semibold text-gray-900">
                {format(parseISO(task.dueDate), 'yyyy/MM/dd (E)', { locale: ja })}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{format(parseISO(task.dueDate), 'HH:mm')}</span>
              </div>
            </>
          ) : (
            <span className="text-sm text-gray-400">未設定</span>
          )}
        </div>

        {/* 開始日 */}
        {task.startDate && (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">開始日</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {format(parseISO(task.startDate), 'yyyy/MM/dd (E)', { locale: ja })}
            </div>
          </div>
        )}

        {/* 作成者 */}
        {task.createdBy && (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <User className="w-3.5 h-3.5" />
              <span className="font-medium">作成者</span>
            </div>
            <div className="flex items-center gap-2">
              <UserAvatar name={task.createdBy.name} avatar={task.createdBy.avatar} size="sm" className="w-6 h-6" />
              <span className="text-sm font-medium text-gray-900">
                {task.createdBy.name}
              </span>
            </div>
          </div>
        )}

        {/* タイムスタンプ */}
        <div className="pt-3 border-t border-gray-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">作成日時</span>
            <span className="text-gray-700 font-medium">
              {format(parseISO(task.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">最終更新</span>
            <span className="text-gray-700 font-medium">
              {format(parseISO(task.updatedAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}