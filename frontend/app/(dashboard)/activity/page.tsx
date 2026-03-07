'use client';

import { useEffect, useState } from 'react';
import { userService } from '@/services/user.service';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CheckSquare, FolderPlus, UserPlus, Clock } from 'lucide-react';

interface Activity {
  type: 'task_created' | 'task_assigned' | 'project_joined';
  title: string;
  project?: string;
  timestamp: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const data = await userService.getActivityLog();

      // データを統合してソート
      const combined: Activity[] = [
        ...data.createdTasks.map((task: any) => ({
          type: 'task_created' as const,
          title: task.title,
          project: task.project.name,
          timestamp: task.createdAt,
        })),
        ...data.assignedTasks.map((task: any) => ({
          type: 'task_assigned' as const,
          title: task.title,
          project: task.project.name,
          timestamp: task.updatedAt,
        })),
        ...data.projects.map((p: any) => ({
          type: 'project_joined' as const,
          title: p.project.name,
          timestamp: p.createdAt,
        })),
      ].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(combined);
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'task_created':
        return <CheckSquare className="w-5 h-5 text-green-600" />;
      case 'task_assigned':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'project_joined':
        return <FolderPlus className="w-5 h-5 text-purple-600" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'task_created':
        return `タスク「${activity.title}」を作成しました`;
      case 'task_assigned':
        return `タスク「${activity.title}」にアサインされました`;
      case 'project_joined':
        return `プロジェクト「${activity.title}」に参加しました`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">アクティビティ</h1>
        <p className="text-gray-600 mt-1">最近の活動履歴</p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        {activities.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {activities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {getActivityText(activity)}
                    </p>
                    {activity.project && (
                      <p className="text-xs text-gray-500 mt-1">
                        プロジェクト: {activity.project}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        {format(new Date(activity.timestamp), 'yyyy年M月d日 HH:mm', { locale: ja })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">アクティビティはまだありません</p>
          </div>
        )}
      </div>
    </div>
  );
}