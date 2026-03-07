'use client';

import { useState, useMemo } from 'react';
import { Task, Milestone } from '@/types/task';
import { TaskCalendar } from './task-calendar';
import { TaskCalendarWeek } from './task-calendar-week';
import { TaskCalendarDay } from './task-calendar-day';
import { Filter, X } from 'lucide-react';

interface TaskCalendarViewProps {
  tasks: Task[];
  onUpdate: () => void;
  milestones?: Milestone[];
  projectId?: string;
}

type CalendarMode = 'month' | 'week' | 'day';

const STATUS_OPTIONS = [
  { value: 'todo', label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'done', label: '完了' },
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export function TaskCalendarView({ tasks, onUpdate, milestones = [], projectId }: TaskCalendarViewProps) {
  const [mode, setMode] = useState<CalendarMode>('month');
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (statusFilter.length > 0 && !statusFilter.includes(task.status)) return false;
      if (priorityFilter.length > 0 && !priorityFilter.includes(task.priority)) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter]);

  const activeFilterCount = statusFilter.length + priorityFilter.length;

  const toggleStatus = (v: string) =>
    setStatusFilter(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const togglePriority = (v: string) =>
    setPriorityFilter(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const clearFilters = () => {
    setStatusFilter([]);
    setPriorityFilter([]);
  };

  return (
    <div>
      {/* ツールバー */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        {/* モード切替 */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['month', 'week', 'day'] as CalendarMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {m === 'month' ? '月表示' : m === 'week' ? '週表示' : '日表示'}
            </button>
          ))}
        </div>

        {/* フィルター */}
        <div className="relative">
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              activeFilterCount > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            フィルター
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {activeFilterCount}
              </span>
            )}
          </button>

          {showFilter && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-4 w-64">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">フィルター</span>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <X className="w-3 h-3" />クリア
                  </button>
                )}
              </div>

              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-2">ステータス</p>
                <div className="space-y-1">
                  {STATUS_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(opt.value)}
                        onChange={() => toggleStatus(opt.value)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">優先度</p>
                <div className="space-y-1">
                  {PRIORITY_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={priorityFilter.includes(opt.value)}
                        onChange={() => togglePriority(opt.value)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* フィルターアクティブバッジ */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {statusFilter.map(v => (
            <span key={v} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
              {STATUS_OPTIONS.find(o => o.value === v)?.label}
              <button onClick={() => toggleStatus(v)}><X className="w-3 h-3" /></button>
            </span>
          ))}
          {priorityFilter.map(v => (
            <span key={v} className="flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
              {PRIORITY_OPTIONS.find(o => o.value === v)?.label}
              <button onClick={() => togglePriority(v)}><X className="w-3 h-3" /></button>
            </span>
          ))}
          <span className="text-xs text-gray-500">{filteredTasks.length} / {tasks.length} 件</span>
        </div>
      )}

      {mode === 'month' && (
        <TaskCalendar tasks={filteredTasks} onUpdate={onUpdate} milestones={milestones} projectId={projectId} />
      )}
      {mode === 'week' && (
        <TaskCalendarWeek tasks={filteredTasks} onUpdate={onUpdate} milestones={milestones} projectId={projectId} />
      )}
      {mode === 'day' && (
        <TaskCalendarDay tasks={filteredTasks} onUpdate={onUpdate} milestones={milestones} projectId={projectId} />
      )}
    </div>
  );
}
