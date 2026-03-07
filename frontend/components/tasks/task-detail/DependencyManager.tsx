'use client';

import { useState } from 'react';
import { Task, TaskDependency } from '@/types/task';
import { Link2, Plus, X, ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DependencyManagerProps {
  task: Task;
  projectTasks: Task[];
  onAddDependency: (dependsOnId: string) => Promise<void>;
  onRemoveDependency: (dependsOnId: string) => Promise<void>;
}

export function DependencyManager({
  task,
  projectTasks,
  onAddDependency,
  onRemoveDependency,
}: DependencyManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 現在の依存タスクIDリスト
  const currentDependencyIds = task.dependencies?.map(d => d.dependsOn.id) || [];

  // 依存先として選択可能なタスク（自分自身と既存の依存タスクを除外）
  const availableTasks = projectTasks.filter(
    t => t.id !== task.id && !currentDependencyIds.includes(t.id)
  );

  const handleAdd = async () => {
    if (!selectedTaskId) return;

    setIsLoading(true);
    setError(null);
    try {
      await onAddDependency(selectedTaskId);
      setSelectedTaskId('');
      setIsAdding(false);
    } catch (error: any) {
      const message = error?.message || error?.response?.data?.message || '依存関係の追加に失敗しました';
      setError(message);
      console.error('Failed to add dependency:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (dependsOnId: string) => {
    if (!confirm('この依存関係を削除しますか?')) return;

    setIsLoading(true);
    setError(null);
    try {
      await onRemoveDependency(dependsOnId);
    } catch (error: any) {
      const message = error?.message || error?.response?.data?.message || '依存関係の削除に失敗しました';
      setError(message);
      console.error('Failed to remove dependency:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      done: 'bg-green-100 text-green-700',
      in_progress: 'bg-blue-100 text-blue-700',
      todo: 'bg-gray-100 text-gray-700',
    };
    const labels = {
      done: '完了',
      in_progress: '進行中',
      todo: '未着手',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.todo}`}>
        {labels[status as keyof typeof labels] || '未着手'}
      </span>
    );
  };

  // すべての依存タスクが完了しているか
  const allDependenciesCompleted = task.dependencies?.every(d => d.dependsOn.status === 'done') ?? true;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-sm text-gray-900">依存タスク</span>
            {task.dependencies && task.dependencies.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {task.dependencies.length}
              </span>
            )}
          </div>
          {!isAdding && availableTasks.length > 0 && (
            <button
              onClick={() => {
                setIsAdding(true);
                setError(null);
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              追加
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* エラーメッセージ */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ステータスサマリー */}
        {task.dependencies && task.dependencies.length > 0 && (
          <div className={`mb-4 p-3 rounded-lg ${allDependenciesCompleted ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center gap-2">
              {allDependenciesCompleted ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">すべての依存タスクが完了しています</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 font-medium">未完了の依存タスクがあります</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* 追加フォーム */}
        {isAdding && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              依存するタスクを選択
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">タスクを選択...</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.status === 'done' ? '完了' : t.status === 'in_progress' ? '進行中' : '未着手'}] {t.title}
                </option>
              ))}
            </select>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!selectedTaskId || isLoading}
              >
                {isLoading ? '追加中...' : '追加'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setSelectedTaskId('');
                }}
              >
                キャンセル
              </Button>
            </div>
          </div>
        )}

        {/* 依存タスクリスト */}
        {task.dependencies && task.dependencies.length > 0 ? (
          <div className="space-y-2">
            {task.dependencies.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getStatusIcon(dep.dependsOn.status)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {dep.dependsOn.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(dep.dependsOn.status)}
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">このタスク</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(dep.dependsOn.id)}
                  disabled={isLoading}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="依存関係を削除"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Link2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">依存タスクはありません</p>
            {availableTasks.length > 0 && !isAdding && (
              <button
                onClick={() => {
                  setIsAdding(true);
                  setError(null);
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                依存タスクを追加
              </button>
            )}
          </div>
        )}

        {/* このタスクに依存しているタスク */}
        {task.dependents && task.dependents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              このタスクに依存しているタスク
            </h4>
            <div className="space-y-2">
              {task.dependents.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-200"
                >
                  {getStatusIcon(dep.task.status)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {dep.task.title}
                    </p>
                  </div>
                  {getStatusBadge(dep.task.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}