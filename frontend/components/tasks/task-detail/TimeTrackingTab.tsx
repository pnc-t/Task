'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format, parseISO, isToday, isThisWeek, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { TimeEntry, CreateTimeEntryData } from '@/types/task';
import { taskService } from '@/services/task.service';
import { Play, Square, Plus, Trash2, Edit2, Check, X, Clock, Calendar, TrendingUp } from 'lucide-react';

interface TimeTrackingTabProps {
  taskId: string;
  estimatedHours?: number;
  currentUserId?: string;
  onUpdate?: () => void;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const TIMER_STORAGE_KEY = (taskId: string) => `timer_start_${taskId}`;

export function TimeTrackingTab({ taskId, estimatedHours, currentUserId, onUpdate }: TimeTrackingTabProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // タイマー状態（開始時刻をlocalStorageで永続化）
  const [isRunning, setIsRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // マウント時にlocalStorageから実行中タイマーを復元
  useEffect(() => {
    const stored = localStorage.getItem(TIMER_STORAGE_KEY(taskId));
    if (stored) {
      const startTime = new Date(stored);
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      if (elapsed > 0) {
        setTimerStart(startTime);
        setTimerSeconds(elapsed);
        setIsRunning(true);
      } else {
        localStorage.removeItem(TIMER_STORAGE_KEY(taskId));
      }
    }
  }, [taskId]);

  // 手動入力
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualDesc, setManualDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 編集状態
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState('');
  const [editMinutes, setEditMinutes] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const loadEntries = useCallback(async () => {
    try {
      const data = await taskService.getTimeEntries(taskId);
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // タイマー（開始時刻から差分を計算するのでタブ切替後も正確）
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        const start = localStorage.getItem(TIMER_STORAGE_KEY(taskId));
        if (start) {
          const elapsed = Math.floor((Date.now() - new Date(start).getTime()) / 1000);
          setTimerSeconds(elapsed);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, taskId]);

  const handleStartTimer = () => {
    const now = new Date();
    localStorage.setItem(TIMER_STORAGE_KEY(taskId), now.toISOString());
    setTimerStart(now);
    setTimerSeconds(0);
    setIsRunning(true);
  };

  const handleStopTimer = async () => {
    setIsRunning(false);
    localStorage.removeItem(TIMER_STORAGE_KEY(taskId));
    const endTime = new Date();
    const hours = timerSeconds / 3600;
    if (hours < 0.01) {
      setTimerSeconds(0);
      setTimerStart(null);
      return;
    }

    setIsSaving(true);
    try {
      await taskService.createTimeEntry(taskId, {
        hours: Math.round(hours * 100) / 100,
        date: format(endTime, 'yyyy-MM-dd'),
        startTime: timerStart?.toISOString(),
        endTime: endTime.toISOString(),
        description: 'タイマー記録',
      });
      setTimerSeconds(0);
      setTimerStart(null);
      await loadEntries();
      onUpdate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelTimer = () => {
    setIsRunning(false);
    localStorage.removeItem(TIMER_STORAGE_KEY(taskId));
    setTimerSeconds(0);
    setTimerStart(null);
  };

  const handleManualSubmit = async () => {
    const h = parseFloat(manualHours || '0');
    const m = parseFloat(manualMinutes || '0');
    const totalHours = h + m / 60;
    if (totalHours <= 0) return;

    setIsSaving(true);
    try {
      await taskService.createTimeEntry(taskId, {
        hours: Math.round(totalHours * 100) / 100,
        date: manualDate || format(new Date(), 'yyyy-MM-dd'),
        description: manualDesc || undefined,
      });
      setManualHours('');
      setManualMinutes('');
      setManualDate(format(new Date(), 'yyyy-MM-dd'));
      setManualDesc('');
      setShowManualForm(false);
      await loadEntries();
      onUpdate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('この工数記録を削除しますか？')) return;
    try {
      await taskService.deleteTimeEntry(taskId, entryId);
      await loadEntries();
      onUpdate?.();
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (entry: TimeEntry) => {
    const h = Math.floor(entry.hours);
    const m = Math.round((entry.hours - h) * 60);
    setEditingId(entry.id);
    setEditHours(String(h));
    setEditMinutes(String(m));
    setEditDesc(entry.description || '');
  };

  const handleEditSave = async (entryId: string) => {
    const h = parseFloat(editHours || '0');
    const m = parseFloat(editMinutes || '0');
    const totalHours = h + m / 60;
    if (totalHours <= 0) return;
    try {
      await taskService.updateTimeEntry(taskId, entryId, {
        hours: Math.round(totalHours * 100) / 100,
        description: editDesc || undefined,
      });
      setEditingId(null);
      await loadEntries();
      onUpdate?.();
    } catch (e) {
      console.error(e);
    }
  };

  // 集計
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const todayHours = entries
    .filter(e => isToday(parseISO(e.date)))
    .reduce((sum, e) => sum + e.hours, 0);
  const weekHours = entries
    .filter(e => isThisWeek(parseISO(e.date), { locale: ja }))
    .reduce((sum, e) => sum + e.hours, 0);
  const myHours = entries
    .filter(e => e.userId === currentUserId)
    .reduce((sum, e) => sum + e.hours, 0);

  const progressPct = estimatedHours && estimatedHours > 0
    ? Math.min(100, Math.round((totalHours / estimatedHours) * 100))
    : null;

  if (isLoading) {
    return <div className="text-gray-500 text-sm py-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
          <div className="text-xs text-blue-600 font-medium mb-1">今日</div>
          <div className="text-xl font-bold text-blue-700">{formatHours(todayHours)}</div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
          <div className="text-xs text-purple-600 font-medium mb-1">今週</div>
          <div className="text-xl font-bold text-purple-700">{formatHours(weekHours)}</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
          <div className="text-xs text-green-600 font-medium mb-1">自分の合計</div>
          <div className="text-xl font-bold text-green-700">{formatHours(myHours)}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-600 font-medium mb-1">全体合計</div>
          <div className="text-xl font-bold text-gray-700">{formatHours(totalHours)}</div>
        </div>
      </div>

      {/* 見積工数に対する進捗バー */}
      {estimatedHours && estimatedHours > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              見積工数に対する消化率
            </span>
            <span className={`font-semibold ${progressPct! >= 100 ? 'text-red-600' : 'text-gray-700'}`}>
              {formatHours(totalHours)} / {formatHours(estimatedHours)} ({progressPct}%)
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${progressPct! >= 100 ? 'bg-red-500' : progressPct! >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, progressPct!)}%` }}
            />
          </div>
          {progressPct! >= 100 && (
            <p className="text-xs text-red-500 mt-1">
              見積工数を {formatHours(totalHours - estimatedHours)} 超過しています
            </p>
          )}
          {estimatedHours > totalHours && (
            <p className="text-xs text-gray-500 mt-1">
              残り {formatHours(estimatedHours - totalHours)}
            </p>
          )}
        </div>
      )}

      {/* タイマー */}
      <div className={`border rounded-lg p-4 ${isRunning ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          タイマーで記録
          {isRunning && (
            <span className="ml-auto text-xs text-blue-600 font-medium flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              計測中
            </span>
          )}
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`text-3xl font-mono font-bold tabular-nums ${isRunning ? 'text-blue-600' : 'text-gray-400'}`}>
            {formatDuration(timerSeconds)}
          </div>
          {!isRunning ? (
            <button
              onClick={handleStartTimer}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              開始
            </button>
          ) : (
            <>
              <button
                onClick={handleStopTimer}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Square className="w-4 h-4" />
                停止して保存
              </button>
              <button
                onClick={handleCancelTimer}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                破棄
              </button>
            </>
          )}
        </div>
        {isRunning && timerStart && (
          <p className="text-xs text-blue-500 mt-2">
            開始: {format(timerStart, 'HH:mm', { locale: ja })}
          </p>
        )}
      </div>

      {/* 手動入力 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            手動で記録
          </h3>
          {!showManualForm && (
            <button
              onClick={() => setShowManualForm(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + 追加
            </button>
          )}
        </div>

        {showManualForm && (
          <div className="space-y-3">
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">時間</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  placeholder="0"
                  value={manualHours}
                  onChange={e => setManualHours(e.target.value)}
                  className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pb-1.5 text-gray-500">時間</div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">分</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={manualMinutes}
                  onChange={e => setManualMinutes(e.target.value)}
                  className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pb-1.5 text-gray-500">分</div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">日付</label>
              <input
                type="date"
                value={manualDate}
                onChange={e => setManualDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">作業内容（任意）</label>
              <input
                type="text"
                placeholder="作業の説明..."
                value={manualDesc}
                onChange={e => setManualDesc(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleManualSubmit}
                disabled={isSaving || (parseFloat(manualHours || '0') === 0 && parseFloat(manualMinutes || '0') === 0)}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => setShowManualForm(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 記録一覧 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            記録一覧
          </h3>
          <span className="text-xs text-gray-500">{entries.length}件</span>
        </div>

        {entries.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            工数の記録がありません
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {entries.map(entry => (
              <div key={entry.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                {editingId === entry.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={editHours}
                        onChange={e => setEditHours(e.target.value)}
                        className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-gray-500 text-sm">時間</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={editMinutes}
                        onChange={e => setEditMinutes(e.target.value)}
                        className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-gray-500 text-sm">分</span>
                    </div>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      placeholder="作業内容"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleEditSave(entry.id)} className="text-green-600 hover:text-green-800">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">
                          {formatHours(entry.hours)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(parseISO(entry.date), 'M月d日(E)', { locale: ja })}
                          {isToday(parseISO(entry.date)) && (
                            <span className="ml-1 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-xs font-medium">今日</span>
                          )}
                        </span>
                        <span className="text-xs text-gray-400">
                          {entry.user.name}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.description}</p>
                      )}
                      {entry.startTime && entry.endTime && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(parseISO(entry.startTime), 'HH:mm')} - {format(parseISO(entry.endTime), 'HH:mm')}
                        </p>
                      )}
                    </div>
                    {entry.userId === currentUserId && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(entry)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
