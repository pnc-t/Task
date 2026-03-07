'use client';

import { useEffect, useState } from 'react';
import { taskService } from '@/services/task.service';
import { useAuthStore } from '@/lib/auth-store';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Plus, Clock, User } from 'lucide-react';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { TaskCard } from '@/components/tasks/task-card';

export default function TasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(true); // デフォルトをtrueに変更

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await taskService.getAll();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    // ステータスフィルター
    const statusMatch = filter === 'all' ? true : task.status === filter;

    // 自分のタスクフィルター
    const myTaskMatch = !showMyTasksOnly ||
      task.assignee?.id === user?.id ||
      task.assignees?.some(a => a.user.id === user?.id);

    return statusMatch && myTaskMatch;
  });

  // 統計情報
  const stats = {
    all: tasks.filter(t => !showMyTasksOnly || t.assignee?.id === user?.id || t.assignees?.some(a => a.user.id === user?.id)).length,
    todo: tasks.filter(t => t.status === 'todo' && (!showMyTasksOnly || t.assignee?.id === user?.id || t.assignees?.some(a => a.user.id === user?.id))).length,
    inProgress: tasks.filter(t => t.status === 'in_progress' && (!showMyTasksOnly || t.assignee?.id === user?.id || t.assignees?.some(a => a.user.id === user?.id))).length,
    done: tasks.filter(t => t.status === 'done' && (!showMyTasksOnly || t.assignee?.id === user?.id || t.assignees?.some(a => a.user.id === user?.id))).length,
  };

  const handleTaskCreated = () => {
    loadTasks();
    setShowCreateDialog(false);
  };

  const handleTaskUpdated = () => {
    loadTasks();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">タスク</h1>
          <p className="text-gray-600 mt-1">
            {showMyTasksOnly ? '自分のタスクを管理' : '全てのタスクを管理'}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新規タスク
        </Button>
      </div>

      {/* フィルターコントロール */}
      <div className="mb-6 space-y-3">
        {/* 自分のタスク切り替え */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMyTasksOnly(!showMyTasksOnly)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              showMyTasksOnly
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" />
            {showMyTasksOnly ? '自分のタスクのみ表示中' : '全てのタスクを表示中'}
          </button>

          {showMyTasksOnly && (
            <span className="text-sm text-gray-600">
              {stats.all} 件の担当タスク
            </span>
          )}
        </div>

        {/* ステータスフィルター */}
        <div className="flex gap-2">
          {(['all', 'todo', 'in_progress', 'done'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              size="sm"
            >
              {status === 'all' && `すべて (${stats.all})`}
              {status === 'todo' && `未着手 (${stats.todo})`}
              {status === 'in_progress' && `進行中 (${stats.inProgress})`}
              {status === 'done' && `完了 (${stats.done})`}
            </Button>
          ))}
        </div>
      </div>

      {/* タスクリスト */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} onUpdate={handleTaskUpdated} />
        ))}
      </div>

      {/* 空の状態 */}
      {filteredTasks.length === 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          {showMyTasksOnly ? (
            <>
              <User className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                担当タスクがありません
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all'
                  ? 'あなたが担当しているタスクはまだありません'
                  : `${filter === 'todo' ? '未着手の' : filter === 'in_progress' ? '進行中の' : '完了した'}担当タスクはありません`
                }
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowMyTasksOnly(false)}
                >
                  全てのタスクを表示
                </Button>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  タスクを作成
                </Button>
              </div>
            </>
          ) : (
            <>
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                タスクがありません
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all'
                  ? '新しいタスクを作成して作業を始めましょう'
                  : `${filter === 'todo' ? '未着手の' : filter === 'in_progress' ? '進行中の' : '完了した'}タスクはありません`
                }
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                タスクを作成
              </Button>
            </>
          )}
        </div>
      )}

      <CreateTaskDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleTaskCreated}
      />
    </div>
  );
}