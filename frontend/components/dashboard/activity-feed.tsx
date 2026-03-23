'use client';

import { useMemo } from 'react';
import { Task } from '@/types/task';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CheckCircle, PlayCircle, PlusCircle } from 'lucide-react';

interface ActivityFeedProps {
  tasks: Task[];
}

interface ActivityItem {
  id: string;
  type: 'created' | 'started' | 'completed';
  title: string;
  projectName?: string;
  time: string;
}

export function ActivityFeed({ tasks }: ActivityFeedProps) {
  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    for (const task of tasks) {
      if (task.status === 'done') {
        items.push({
          id: `${task.id}-done`,
          type: 'completed',
          title: task.title,
          projectName: task.project?.name,
          time: task.updatedAt,
        });
      } else if (task.status === 'in_progress') {
        items.push({
          id: `${task.id}-progress`,
          type: 'started',
          title: task.title,
          projectName: task.project?.name,
          time: task.updatedAt,
        });
      }

      items.push({
        id: `${task.id}-created`,
        type: 'created',
        title: task.title,
        projectName: task.project?.name,
        time: task.createdAt,
      });
    }

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return items.slice(0, 10);
  }, [tasks]);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'started':
        return <PlayCircle className="w-4 h-4 text-blue-500" />;
      case 'created':
        return <PlusCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'completed': return 'を完了';
      case 'started': return 'を開始';
      case 'created': return 'を作成';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">最近のアクティビティ</h2>
      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <div className="mt-0.5 flex-shrink-0">{getIcon(item.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">
                  <span className="font-medium truncate">{item.title}</span>
                  <span className="text-gray-500">{getLabel(item.type)}</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  {item.projectName && <span>{item.projectName}</span>}
                  <span>
                    {formatDistanceToNow(parseISO(item.time), { addSuffix: true, locale: ja })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">アクティビティはありません</p>
      )}
    </div>
  );
}
