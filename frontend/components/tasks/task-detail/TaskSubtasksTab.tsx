import { useState } from 'react';
import { Check, Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Subtask } from '@/types/task';

interface TaskSubtasksTabProps {
  subtasks: Subtask[];
  onAddSubtask: (title: string) => Promise<void>;
  onToggleSubtask: (subtaskId: string, completed: boolean) => Promise<void>;
  onDeleteSubtask: (subtaskId: string) => Promise<void>;
}

export function TaskSubtasksTab({
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TaskSubtasksTabProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    await onAddSubtask(newSubtaskTitle);
    setNewSubtaskTitle('');
  };

  const getSubtaskProgress = () => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(st => st.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  const completedCount = subtasks.filter(st => st.completed).length;
  const progress = getSubtaskProgress();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <div className="w-1 h-6 bg-green-600 rounded-full"></div>
          サブタスク
        </h3>
        {subtasks.length > 0 && (
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">
              {completedCount}/{subtasks.length}
            </span>
          </div>
        )}
      </div>

      {subtasks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">進捗状況</span>
            <span className="text-xs font-bold text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2 mb-6">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="group flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:shadow-md hover:border-gray-200 transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
          >
            <button
              onClick={() => onToggleSubtask(subtask.id, subtask.completed)}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                subtask.completed
                  ? 'bg-green-600 border-green-600 shadow-md'
                  : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
              }`}
            >
              {subtask.completed && <Check className="w-4 h-4 text-white font-bold" />}
            </button>
            <span
              className={`flex-1 text-sm transition-all duration-200 ${
                subtask.completed 
                  ? 'line-through text-gray-400' 
                  : 'text-gray-900 font-medium'
              }`}
            >
              {subtask.title}
            </span>
            <button
              onClick={() => onDeleteSubtask(subtask.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {subtasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Circle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">サブタスクがありません</p>
            <p className="text-sm text-gray-400 mt-1">タスクを細分化して管理しましょう</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex gap-2">
            <Input
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="サブタスクを追加..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                  handleAddSubtask();
                }
              }}
              className="flex-1 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
            />
            <Button
              onClick={handleAddSubtask}
              disabled={!newSubtaskTitle.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}