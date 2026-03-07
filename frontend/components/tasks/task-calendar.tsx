'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Task, Milestone } from '@/types/task';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ChevronLeft, ChevronRight, Diamond, AlertTriangle, Plus } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay,
  addMonths, subMonths, startOfWeek, endOfWeek, parseISO, isAfter, startOfDay,
  differenceInDays, addDays,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { TaskDndProvider } from '@/components/dnd/dnd-provider';
import { useTaskDrag } from '@/hooks/use-task-drag';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { CreateTaskDialog } from './create-task-dialog';

interface TaskCalendarProps {
  tasks: Task[];
  onUpdate: () => void;
  milestones?: Milestone[];
  projectId?: string;
}

interface MultiDayEventLayout {
  task: Task;
  col: number;
  span: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

const LANE_H = 26; // px per multi-day lane

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

function isMultiDay(task: Task): boolean {
  if (!task.dueDate || !task.startDate) return false;
  return differenceInDays(startOfDay(parseISO(task.dueDate)), startOfDay(parseISO(task.startDate))) >= 1;
}

function layoutWeekEvents(tasks: Task[], weekStart: Date, weekEnd: Date): MultiDayEventLayout[] {
  const events = tasks
    .filter(t => {
      if (!t.dueDate || !t.startDate) return false;
      const s = startOfDay(parseISO(t.startDate));
      const e = startOfDay(parseISO(t.dueDate));
      return differenceInDays(e, s) >= 1 && !isAfter(s, weekEnd) && !isAfter(weekStart, e);
    })
    .map(t => {
      const s = startOfDay(parseISO(t.startDate!));
      const e = startOfDay(parseISO(t.dueDate!));
      const visStart = isAfter(s, weekStart) ? s : weekStart;
      const visEnd = isAfter(e, weekEnd) ? weekEnd : e;
      const col = differenceInDays(visStart, weekStart);
      const endCol = differenceInDays(visEnd, weekStart);
      return { task: t, col, span: endCol - col + 1, lane: 0, continuesBefore: isAfter(weekStart, s), continuesAfter: isAfter(e, weekEnd) };
    })
    .sort((a, b) => a.col - b.col || b.span - a.span);

  const laneEnds: number[] = [];
  return events.map(ev => {
    let lane = laneEnds.findIndex(end => end < ev.col);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = ev.col + ev.span - 1;
    return { ...ev, lane };
  });
}

// ---- Status helpers ----
function getStatusBg(task: Task): string {
  if (task.status === 'done') return 'bg-emerald-500';
  if (task.status === 'in_progress') return 'bg-blue-500';
  const overdue = task.dueDate && isAfter(startOfDay(new Date()), startOfDay(parseISO(task.dueDate)));
  if (overdue) return 'bg-red-500';
  return 'bg-slate-400';
}

function getChipStyle(task: Task): { bg: string; border: string; text: string } {
  if (task.status === 'done') return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' };
  const overdue = task.dueDate && isAfter(startOfDay(new Date()), startOfDay(parseISO(task.dueDate)));
  if (overdue) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
  if (task.status === 'in_progress') return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' };
  return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' };
}

function getPriorityDot(p: string) {
  return p === 'high' ? 'bg-red-400' : p === 'medium' ? 'bg-amber-400' : 'bg-green-400';
}

function getStatusLabel(task: Task): string {
  if (task.status === 'done') return '完了';
  const overdue = task.dueDate && isAfter(startOfDay(new Date()), startOfDay(parseISO(task.dueDate)));
  if (overdue) return '遅延';
  if (task.status === 'in_progress') return '進行中';
  return '未着手';
}

// ---- Droppable cell (only tasks area) ----
function DroppableTasksArea({ day, isOverDrop, children, onClick }: {
  day: Date; isOverDrop: boolean; children: React.ReactNode; onClick: () => void;
}) {
  const { setNodeRef } = useDroppable({ id: format(day, 'yyyy-MM-dd') });
  return (
    <div ref={setNodeRef} onClick={onClick}
      className={`min-h-[80px] p-1.5 transition-colors ${isOverDrop ? 'bg-blue-50' : ''}`}>
      {children}
    </div>
  );
}

// ---- Draggable chip ----
function DraggableChip({ task, onClick }: { task: Task; onClick: (e: React.MouseEvent) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const chip = getChipStyle(task);
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border cursor-pointer mb-1
        hover:shadow-sm transition-all select-none
        ${chip.bg} ${chip.border} ${isDragging ? 'opacity-30' : ''}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getPriorityDot(task.priority)}`} />
      <span className={`truncate font-medium ${chip.text}`}>{task.title}</span>
    </div>
  );
}

// ---- Main ----
export function TaskCalendar({ tasks, onUpdate, milestones = [], projectId }: TaskCalendarProps) {
  const router = useRouter();
  const { updateTask } = useTaskDrag({ onUpdate });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [overDateId, setOverDateId] = useState<string | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ja });
  const calendarEnd = endOfWeek(monthEnd, { locale: ja });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = chunk(calendarDays, 7);

  const multiDayTasks = useMemo(() => tasks.filter(isMultiDay), [tasks]);
  const singleDayTasks = useMemo(() => tasks.filter(t => !isMultiDay(t)), [tasks]);

  const getSingleDay = (d: Date) => singleDayTasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), d));
  const getDayMilestones = (d: Date) => milestones.filter(m => isSameDay(parseISO(m.dueDate), d));

  const monthStats = useMemo(() => {
    const mt = tasks.filter(t => t.dueDate && isSameMonth(parseISO(t.dueDate), currentDate));
    return {
      total: mt.length,
      done: mt.filter(t => t.status === 'done').length,
      inProgress: mt.filter(t => t.status === 'in_progress').length,
      overdue: mt.filter(t => {
        const d = t.dueDate ? startOfDay(parseISO(t.dueDate)) : null;
        return d && isAfter(startOfDay(new Date()), d) && t.status !== 'done';
      }).length,
    };
  }, [tasks, currentDate]);

  const handleDragOver = useCallback((e: DragOverEvent) => setOverDateId(e.over?.id as string | null), []);
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setOverDateId(null);
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find(t => t.id === active.id);
    if (!task || !task.dueDate) return;
    const oldDue = parseISO(task.dueDate);
    const newDue = parseISO(over.id as string);
    if (isSameDay(oldDue, newDue)) return;
    newDue.setHours(oldDue.getHours(), oldDue.getMinutes());
    const data: Record<string, string> = { dueDate: newDue.toISOString() };
    if (task.startDate) {
      data.startDate = addDays(parseISO(task.startDate), differenceInDays(newDue, oldDue)).toISOString();
    }
    updateTask(active.id as string, data);
  }, [tasks, updateTask]);

  const selectedTasks = selectedDate ? tasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), selectedDate)) : [];

  return (
    <TaskDndProvider tasks={tasks} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* ===== カレンダー ===== */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {format(currentDate, 'yyyy年 M月', { locale: ja })}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="text-gray-500">全{monthStats.total}件</span>
                  <span className="text-emerald-600 font-medium">完了 {monthStats.done}</span>
                  <span className="text-blue-600 font-medium">進行中 {monthStats.inProgress}</span>
                  {monthStats.overdue > 0 && (
                    <span className="text-red-600 font-medium">遅延 {monthStats.overdue}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  今日
                </button>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
              {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                <div key={d} className={`py-2.5 text-center text-xs font-semibold tracking-wide uppercase
                  ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* 週ごとのレンダリング */}
            {weeks.map((week, wi) => {
              const weekStart = startOfDay(week[0]);
              const weekEnd = startOfDay(week[6]);
              const layout = layoutWeekEvents(multiDayTasks, weekStart, weekEnd);
              const maxLane = layout.length > 0 ? Math.max(...layout.map(e => e.lane)) + 1 : 0;

              return (
                <div key={wi} className="border-b border-gray-100 last:border-b-0">
                  {/* 日付行 */}
                  <div className="grid grid-cols-7">
                    {week.map((day, di) => {
                      const inMonth = isSameMonth(day, currentDate);
                      const isToday = isSameDay(day, new Date());
                      const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                      const dayStr = format(day, 'yyyy-MM-dd');
                      return (
                        <div key={di}
                          className={`flex items-center justify-between px-2 py-1.5 border-r border-gray-100 last:border-r-0 group
                            ${!inMonth ? 'bg-gray-50/70' : ''}
                            ${isSelected ? 'bg-blue-50' : ''}
                          `}
                        >
                          <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold
                            ${!inMonth ? 'text-gray-300'
                              : isToday ? 'bg-blue-500 text-white'
                              : day.getDay() === 0 ? 'text-red-500'
                              : day.getDay() === 6 ? 'text-blue-500'
                              : 'text-gray-700'
                            }`}
                          >
                            {format(day, 'd')}
                          </span>
                          {projectId && (
                            <button
                              onClick={e => { e.stopPropagation(); setCreateDate(dayStr); }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded transition-all"
                            >
                              <Plus className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* マルチデイバー（CSS Grid による正確な配置） */}
                  {maxLane > 0 && (
                    <div
                      className="relative border-b border-gray-50"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                        gridTemplateRows: `repeat(${maxLane}, ${LANE_H}px)`,
                        height: `${maxLane * LANE_H + 6}px`,
                        paddingTop: '3px',
                        paddingBottom: '3px',
                      }}
                    >
                      {/* 縦の区切り線 */}
                      {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="absolute top-0 bottom-0 border-r border-gray-100 pointer-events-none"
                          style={{ left: `${i / 7 * 100}%` }} />
                      ))}
                      {layout.map(ev => (
                        <button
                          key={ev.task.id}
                          className={`flex items-center text-xs text-white font-medium cursor-pointer
                            hover:brightness-90 active:brightness-75 transition-all truncate
                            ${getStatusBg(ev.task)}
                            ${ev.continuesBefore ? 'rounded-l-none pl-1.5' : 'rounded-l ml-0.5 pl-2'}
                            ${ev.continuesAfter ? 'rounded-r-none pr-0' : 'rounded-r mr-0.5'}
                          `}
                          style={{
                            gridColumn: `${ev.col + 1} / ${ev.col + ev.span + 1}`,
                            gridRow: `${ev.lane + 1}`,
                            height: `${LANE_H - 6}px`,
                          }}
                          onClick={() => router.push(`/tasks/${ev.task.id}`)}
                        >
                          {ev.continuesBefore
                            ? <span className="truncate text-white/90">‹ {ev.task.title}</span>
                            : <span className="truncate">{ev.task.title}</span>
                          }
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 単日タスクエリア */}
                  <div className="grid grid-cols-7">
                    {week.map((day, di) => {
                      const inMonth = isSameMonth(day, currentDate);
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const dayTasks = getSingleDay(day);
                      const dayMs = getDayMilestones(day);
                      const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                      const isExpanded = expandedDays.has(dayStr);
                      const MAX_SHOW = 3;
                      const shown = isExpanded ? dayTasks : dayTasks.slice(0, MAX_SHOW);

                      return (
                        <DroppableTasksArea
                          key={di}
                          day={day}
                          isOverDrop={overDateId === dayStr}
                          onClick={() => setSelectedDate(day)}
                        >
                          <div className={`h-full rounded-lg transition-colors
                            ${!inMonth ? '' : ''}
                            ${isSelected ? 'ring-2 ring-inset ring-blue-400 ring-offset-0' : ''}
                          `}>
                            {/* Milestones */}
                            {dayMs.map(m => (
                              <div key={m.id}
                                className="flex items-center gap-1.5 px-1.5 py-0.5 mb-1 rounded-sm bg-purple-50 border border-purple-100">
                                <Diamond className="w-3 h-3 text-purple-500 fill-current flex-shrink-0" />
                                <span className="text-xs text-purple-700 font-medium truncate">{m.name}</span>
                              </div>
                            ))}

                            {shown.map(task => (
                              <DraggableChip key={task.id} task={task}
                                onClick={e => { e.stopPropagation(); router.push(`/tasks/${task.id}`); }}
                              />
                            ))}

                            {!isExpanded && dayTasks.length > MAX_SHOW && (
                              <button
                                onClick={e => { e.stopPropagation(); setExpandedDays(s => new Set(s).add(dayStr)); }}
                                className="text-xs text-blue-500 hover:text-blue-700 font-medium px-1 py-0.5"
                              >
                                +{dayTasks.length - MAX_SHOW} 件
                              </button>
                            )}
                            {isExpanded && dayTasks.length > MAX_SHOW && (
                              <button
                                onClick={e => { e.stopPropagation(); setExpandedDays(s => { const n = new Set(s); n.delete(dayStr); return n; }); }}
                                className="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5"
                              >
                                折りたたむ
                              </button>
                            )}
                          </div>
                        </DroppableTasksArea>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== サイドパネル ===== */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-4">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base">
                {selectedDate ? format(selectedDate, 'M月d日(E)', { locale: ja }) : '日付を選択'}
              </h3>
              {selectedDate && (
                <p className="text-sm text-gray-500 mt-0.5">{selectedTasks.length} 件のタスク</p>
              )}
            </div>

            <div className="p-3 max-h-[480px] overflow-y-auto space-y-2">
              {/* Selected date milestones */}
              {selectedDate && getDayMilestones(selectedDate).map(m => (
                <div key={m.id} className="flex items-start gap-2 p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                  <Diamond className="w-4 h-4 text-purple-500 fill-current mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-purple-800">{m.name}</div>
                    {m.description && <div className="text-xs text-purple-600 mt-0.5">{m.description}</div>}
                  </div>
                </div>
              ))}

              {selectedDate && selectedTasks.length > 0 ? selectedTasks.map(task => {
                const chip = getChipStyle(task);
                return (
                  <div key={task.id} onClick={() => router.push(`/tasks/${task.id}`)}
                    className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${chip.bg} ${chip.border}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityDot(task.priority)}`} />
                      <span className={`font-semibold text-sm leading-snug ${chip.text}`}>{task.title}</span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${chip.bg} ${chip.text} ${chip.border}`}>
                        {getStatusLabel(task)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                        ${task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200'
                          : task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-green-50 text-green-700 border-green-200'}`}>
                        {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                    {(task.assignees && task.assignees.length > 0) && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-current/10">
                        <div className="flex -space-x-1">
                          {task.assignees.slice(0, 4).map(a => (
                            <UserAvatar key={a.id} name={a.user.name} avatar={a.user.avatar} size="xs" className="ring-1 ring-white" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {task.assignees.slice(0, 2).map(a => a.user.name).join(', ')}
                          {task.assignees.length > 2 && ` +${task.assignees.length - 2}`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }) : selectedDate ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-400">タスクがありません</p>
                  {projectId && (
                    <button onClick={() => setCreateDate(format(selectedDate, 'yyyy-MM-dd'))}
                      className="mt-2 flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 mx-auto font-medium">
                      <Plus className="w-4 h-4" /> タスクを追加
                    </button>
                  )}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">カレンダーから日付を選択してください</p>
              )}

              {/* 期限未設定 */}
              {(() => {
                const noDate = tasks.filter(t => !t.dueDate && t.status !== 'done');
                if (noDate.length === 0) return null;
                return (
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      期限未設定 ({noDate.length}件)
                    </h4>
                    {noDate.slice(0, 4).map(t => (
                      <div key={t.id} onClick={() => router.push(`/tasks/${t.id}`)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors mb-1">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getPriorityDot(t.priority)}`} />
                        <span className="text-xs text-gray-700 truncate">{t.title}</span>
                      </div>
                    ))}
                    {noDate.length > 4 && (
                      <p className="text-xs text-gray-400 text-center">他 {noDate.length - 4} 件</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {createDate && (
        <CreateTaskDialog
          open={!!createDate}
          onClose={() => setCreateDate(null)}
          onSuccess={() => { setCreateDate(null); onUpdate(); }}
          projectId={projectId}
          initialDueDate={createDate}
        />
      )}
    </TaskDndProvider>
  );
}
