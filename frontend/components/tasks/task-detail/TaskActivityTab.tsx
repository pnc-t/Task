import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus, CheckCircle, User, Edit2, History, Clock } from 'lucide-react';
import { ActivityLog } from '@/types/task';
import { UserAvatar } from '@/components/ui/user-avatar';

interface TaskActivityTabProps {
  activityLogs: ActivityLog[];
}

export function TaskActivityTab({ activityLogs }: TaskActivityTabProps) {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created': return <Plus className="w-4 h-4" />;
      case 'status_changed': return <CheckCircle className="w-4 h-4" />;
      case 'assigned': return <User className="w-4 h-4" />;
      case 'updated': return <Edit2 className="w-4 h-4" />;
      default: return <History className="w-4 h-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-green-600 bg-gradient-to-br from-green-400 to-green-600';
      case 'status_changed': return 'text-blue-600 bg-gradient-to-br from-blue-400 to-blue-600';
      case 'assigned': return 'text-purple-600 bg-gradient-to-br from-purple-400 to-purple-600';
      case 'updated': return 'text-orange-600 bg-gradient-to-br from-orange-400 to-orange-600';
      default: return 'text-gray-600 bg-gradient-to-br from-gray-400 to-gray-600';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created': return '作成しました';
      case 'status_changed': return 'ステータスを変更しました';
      case 'assigned': return '担当者を追加しました';
      case 'updated': return '更新しました';
      default: return action;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
        活動履歴
      </h3>

      <div className="relative">
        {/* タイムラインライン */}
        {activityLogs.length > 0 && (
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent"></div>
        )}

        <div className="space-y-4">
          {activityLogs.map((log, index) => (
            <div key={log.id} className="relative flex gap-4 group">
              {/* アイコン */}
              <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md text-white ${getActivityColor(log.action)}`}>
                {getActivityIcon(log.action)}
              </div>

              {/* コンテンツカード */}
              <div className="flex-1 pb-4">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={log.user.name} avatar={log.user.avatar} size="sm" className="w-7 h-7 shadow-sm" />
                        <span className="font-semibold text-gray-900">{log.user.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {log.description || getActionLabel(log.action)}
                      </span>
                    </div>
                  </div>

                  {/* 変更内容 */}
                  {log.fieldName && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                        <span className="font-medium">フィールド:</span>
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                          {log.fieldName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded font-medium line-through">
                          {log.oldValue || '(なし)'}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-medium">
                          {log.newValue || '(なし)'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* タイムスタンプ */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{format(parseISO(log.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {activityLogs.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">活動履歴がありません</p>
              <p className="text-sm text-gray-400 mt-1">タスクの変更履歴がここに表示されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}