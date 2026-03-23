'use client';

import { Task } from '@/types/task';
import { TaskCard } from './task-card';
import { useState, useRef, useEffect } from 'react';
import { Search, Filter, Bookmark, X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFilterPresetsStore } from '@/lib/filter-presets-store';
import { BulkActionToolbar } from './bulk-action-toolbar';

interface TaskListProps {
  tasks: Task[];
  onUpdate: () => void;
}

export function TaskList({ tasks, onUpdate }: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created'>('created');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const { presets, save: savePreset, remove: removePreset } = useFilterPresetsStore();
  const presetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
        setPresetMenuOpen(false);
        setSavingPreset(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const applyPreset = (preset: typeof presets[0]) => {
    setFilterStatus(preset.filterStatus as any);
    setFilterPriority(preset.filterPriority as any);
    setSortBy(preset.sortBy as any);
    setPresetMenuOpen(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    savePreset(presetName.trim(), { filterStatus, filterPriority, sortBy });
    setPresetName('');
    setSavingPreset(false);
  };

  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <div>
      {/* フィルター・検索バー */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="タスクを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">フィルター:</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">すべてのステータス</option>
            <option value="todo">未着手</option>
            <option value="in_progress">進行中</option>
            <option value="done">完了</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">すべての優先度</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="created">作成日順</option>
            <option value="dueDate">期限順</option>
            <option value="priority">優先度順</option>
          </select>

          {/* プリセット */}
          <div className="relative ml-auto" ref={presetRef}>
            <button
              onClick={() => { setPresetMenuOpen(!presetMenuOpen); setSavingPreset(false); }}
              className="flex items-center gap-1.5 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              プリセット
            </button>
            {presetMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2 border-b border-gray-100">
                  {savingPreset ? (
                    <div className="flex gap-1">
                      <input
                        autoFocus
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                        placeholder="プリセット名..."
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                      <button onClick={handleSavePreset} className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
                      <button onClick={() => setSavingPreset(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSavingPreset(true)}
                      className="w-full text-left px-2 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      現在のフィルターを保存...
                    </button>
                  )}
                </div>
                {presets.length > 0 ? (
                  <div className="p-1 max-h-48 overflow-y-auto">
                    {presets.map((preset) => (
                      <div key={preset.id} className="flex items-center group">
                        <button
                          onClick={() => applyPreset(preset)}
                          className="flex-1 text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded truncate"
                        >
                          {preset.name}
                        </button>
                        <button
                          onClick={() => removePreset(preset.id)}
                          className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-xs text-gray-400 text-center">保存済みプリセットはありません</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 全選択 */}
      {filteredTasks.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredTasks.length && filteredTasks.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-500">すべて選択</span>
        </div>
      )}

      {/* タスクリスト */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div key={task.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selectedIds.has(task.id)}
                onChange={() => toggleSelect(task.id)}
                className="w-4 h-4 mt-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <TaskCard task={task} onUpdate={onUpdate} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">該当するタスクがありません</p>
          </div>
        )}
      </div>

      <BulkActionToolbar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds(new Set())}
        onUpdate={onUpdate}
      />
    </div>
  );
}