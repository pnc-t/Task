'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Task, Milestone } from '@/types/task';
import { taskService } from '@/services/task.service';
import { ChevronLeft, ChevronRight, Diamond } from 'lucide-react';
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks,
  isSameDay, parseISO, isAfter, startOfDay,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { CreateTaskDialog } from './create-task-dialog';

interface TaskCalendarWeekProps {
  tasks: Task[];
  onUpdate: () => void;
  milestones?: Milestone[];
  projectId?: string;
}

const HOUR_HEIGHT = 64;
const SNAP_MINUTES = 15;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MIN_BLOCK_HEIGHT = 32;

interface TaskBlock {
  task: Task;
  dayIndex: number;
  topPx: number;
  heightPx: number;
  isAllDay: boolean;
  col: number;
  totalCols: number;
}

function isAllDayTask(task: Task): boolean {
  if (!task.dueDate) return false;
  const due = parseISO(task.dueDate);
  if (task.startDate) {
    const start = parseISO(task.startDate);
    return start.getHours() === 0 && start.getMinutes() === 0 && due.getHours() === 0 && due.getMinutes() === 0;
  }
  return due.getHours() === 0 && due.getMinutes() === 0;
}

function assignOverlapColumns(blocks: TaskBlock[]): TaskBlock[] {
  if (blocks.length === 0) return blocks;
  const sorted = [...blocks].sort((a, b) => a.topPx - b.topPx);
  const groups: TaskBlock[][] = [];
  for (const block of sorted) {
    const blockEnd = block.topPx + block.heightPx;
    const overlapping = groups.find(g =>
      g.some(b => b.topPx < blockEnd && b.topPx + b.heightPx > block.topPx)
    );
    if (overlapping) {
      overlapping.push(block);
    } else {
      groups.push([block]);
    }
  }
  const result: TaskBlock[] = [];
  for (const group of groups) {
    const totalCols = group.length;
    group.forEach((block, colIdx) => {
      result.push({ ...block, col: colIdx, totalCols });
    });
  }
  return result;
}

export function TaskCalendarWeek({ tasks, onUpdate, milestones = [], projectId }: TaskCalendarWeekProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [createInfo, setCreateInfo] = useState<{ date: string; startTime?: string } | null>(null);

  const weekStart = startOfWeek(currentDate, { locale: ja });
  const weekEnd = endOfWeek(currentDate, { locale: ja });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      scrollRef.current.scrollTop = Math.max(0, now.getHours() * HOUR_HEIGHT - 120);
    }
  }, []);

  const taskBlocks = useMemo<TaskBlock[]>(() => {
    const blocks: TaskBlock[] = [];
    tasks.forEach(task => {
      if (!task.dueDate) return;
      const dueDate = parseISO(task.dueDate);

      if (isAllDayTask(task)) {
        const taskStart = task.startDate ? parseISO(task.startDate) : dueDate;
        weekDays.forEach((day, dayIndex) => {
          if (isSameDay(day, dueDate) || isSameDay(day, taskStart) ||
            (isAfter(day, startOfDay(taskStart)) && isAfter(startOfDay(dueDate), day))) {
            blocks.push({ task, dayIndex, topPx: 0, heightPx: 0, isAllDay: true, col: 0, totalCols: 1 });
          }
        });
        return;
      }

      const startDate = task.startDate ? parseISO(task.startDate) : dueDate;
      weekDays.forEach((day, dayIndex) => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999);
        if (isAfter(dayStart, dueDate) || isAfter(startOfDay(startDate), dayEnd)) return;
        if (!isSameDay(day, startDate) && !isSameDay(day, dueDate) &&
          !(isAfter(day, startOfDay(startDate)) && isAfter(startOfDay(dueDate), day))) return;

        let blockStartMin = isSameDay(day, startDate) ? startDate.getHours() * 60 + startDate.getMinutes() : 0;
        let blockEndMin = isSameDay(day, dueDate) ? dueDate.getHours() * 60 + dueDate.getMinutes() : 24 * 60;
        if (blockEndMin <= blockStartMin) blockEndMin = blockStartMin + 30;

        blocks.push({
          task, dayIndex,
          topPx: (blockStartMin / 60) * HOUR_HEIGHT,
          heightPx: Math.max(MIN_BLOCK_HEIGHT, ((blockEndMin - blockStartMin) / 60) * HOUR_HEIGHT),
          isAllDay: false, col: 0, totalCols: 1,
        });
      });
    });

    const withOverlap: TaskBlock[] = [];
    for (let d = 0; d < 7; d++) {
      const dayBlocks = blocks.filter(b => !b.isAllDay && b.dayIndex === d);
      withOverlap.push(...assignOverlapColumns(dayBlocks));
    }
    withOverlap.push(...blocks.filter(b => b.isAllDay));
    return withOverlap;
  }, [tasks, weekDays]);

  const allDayBlocks = taskBlocks.filter(b => b.isAllDay);
  const timedBlocks = taskBlocks.filter(b => !b.isAllDay);

  const allDayTasks = useMemo(() => {
    const seen = new Set<string>();
    return allDayBlocks.filter(b => { if (seen.has(b.task.id)) return false; seen.add(b.task.id); return true; });
  }, [allDayBlocks]);

  const getBlockStyle = (task: Task) => {
    if (task.status === 'done') return 'bg-green-50 border-green-500 text-green-800 hover:bg-green-100';
    if (task.status === 'in_progress') return 'bg-blue-50 border-blue-500 text-blue-800 hover:bg-blue-100';
    const today = startOfDay(new Date());
    const due = task.dueDate ? startOfDay(parseISO(task.dueDate)) : null;
    if (due && isAfter(today, due)) return 'bg-red-50 border-red-500 text-red-800 hover:bg-red-100';
    return 'bg-slate-50 border-slate-400 text-slate-700 hover:bg-slate-100';
  };

  const getTimeStyle = (task: Task) => {
    if (task.status === 'done') return 'text-green-600';
    if (task.status === 'in_progress') return 'text-blue-600';
    const today = startOfDay(new Date());
    const due = task.dueDate ? startOfDay(parseISO(task.dueDate)) : null;
    if (due && isAfter(today, due)) return 'text-red-500';
    return 'text-slate-500';
  };

  // Drag state
  const [dragState, setDragState] = useState<{
    taskId: string; mode: 'move' | 'resize';
    startX: number; startY: number;
    currentDayIndex: number; currentTopPx: number; currentHeightPx: number;
    originalDayIndex: number; originalTopPx: number; originalHeightPx: number;
  } | null>(null);
  const dragRef = useRef(dragState);
  dragRef.current = dragState;

  const handlePointerDown = useCallback((e: React.PointerEvent, block: TaskBlock, mode: 'move' | 'resize') => {
    e.preventDefault(); e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      taskId: block.task.id, mode,
      startX: e.clientX, startY: e.clientY,
      currentDayIndex: block.dayIndex, currentTopPx: block.topPx, currentHeightPx: block.heightPx,
      originalDayIndex: block.dayIndex, originalTopPx: block.topPx, originalHeightPx: block.heightPx,
    });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragRef.current;
    if (!ds) return;
    const container = scrollRef.current;
    if (!container) return;
    const gridEl = container.querySelector('[data-week-grid]') as HTMLElement | null;
    if (!gridEl) return;
    const colWidth = gridEl.clientWidth / 7;
    const deltaX = e.clientX - ds.startX;
    const deltaY = e.clientY - ds.startY;
    const snapPx = (SNAP_MINUTES / 60) * HOUR_HEIGHT;

    if (ds.mode === 'move') {
      const dayDelta = Math.round(deltaX / colWidth);
      const newDayIndex = Math.max(0, Math.min(6, ds.originalDayIndex + dayDelta));
      const snappedTop = Math.max(0, Math.round((ds.originalTopPx + deltaY) / snapPx) * snapPx);
      setDragState(prev => prev ? { ...prev, currentDayIndex: newDayIndex, currentTopPx: snappedTop } : null);
    } else {
      const snappedHeight = Math.max(snapPx, Math.round((ds.originalHeightPx + deltaY) / snapPx) * snapPx);
      setDragState(prev => prev ? { ...prev, currentHeightPx: snappedHeight } : null);
    }
  }, []);

  const handlePointerUp = useCallback(async (e: React.PointerEvent) => {
    const ds = dragRef.current;
    if (!ds) return;
    setDragState(null);
    const task = tasks.find(t => t.id === ds.taskId);
    if (!task) return;
    const newDay = weekDays[ds.currentDayIndex];
    const startMinutes = Math.round((ds.currentTopPx / HOUR_HEIGHT) * 60);
    const durationMinutes = Math.round((ds.currentHeightPx / HOUR_HEIGHT) * 60);
    const newStartDate = new Date(newDay);
    newStartDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    const newDueDate = new Date(newDay);
    const endMinutes = startMinutes + durationMinutes;
    newDueDate.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
    const oldStartMinutes = ds.originalTopPx / HOUR_HEIGHT * 60;
    const oldDuration = ds.originalHeightPx / HOUR_HEIGHT * 60;
    if (ds.currentDayIndex === ds.originalDayIndex &&
      Math.abs(startMinutes - oldStartMinutes) < 1 && Math.abs(durationMinutes - oldDuration) < 1) return;
    try {
      if (ds.mode === 'move') {
        await taskService.update(ds.taskId, { startDate: newStartDate.toISOString(), dueDate: newDueDate.toISOString() });
      } else {
        await taskService.update(ds.taskId, { dueDate: newDueDate.toISOString() });
      }
      onUpdate();
    } catch { onUpdate(); }
  }, [tasks, weekDays, onUpdate]);

  const clickTimerRef = useRef<{ x: number; y: number } | null>(null);

  const handleBlockPointerDown = useCallback((e: React.PointerEvent, block: TaskBlock) => {
    clickTimerRef.current = { x: e.clientX, y: e.clientY };
    handlePointerDown(e, block, 'move');
  }, [handlePointerDown]);

  const handleBlockPointerUp = useCallback((e: React.PointerEvent, block: TaskBlock) => {
    if (clickTimerRef.current) {
      const dx = Math.abs(e.clientX - clickTimerRef.current.x);
      const dy = Math.abs(e.clientY - clickTimerRef.current.y);
      if (dx < 5 && dy < 5) router.push(`/tasks/${block.task.id}`);
    }
    clickTimerRef.current = null;
    handlePointerUp(e);
  }, [router, handlePointerUp]);

  const getBlockDisplay = (block: TaskBlock) => {
    if (dragState && dragState.taskId === block.task.id && block.dayIndex === dragState.originalDayIndex) {
      return { dayIndex: dragState.currentDayIndex, topPx: dragState.currentTopPx, heightPx: dragState.currentHeightPx, isDragging: true };
    }
    return { dayIndex: block.dayIndex, topPx: block.topPx, heightPx: block.heightPx, isDragging: false };
  };

  const handleEmptySlotClick = useCallback((e: React.MouseEvent, dayIndex: number) => {
    if (dragState) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const totalMinutes = Math.floor((offsetY / HOUR_HEIGHT) * 60 / SNAP_MINUTES) * SNAP_MINUTES;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const day = weekDays[dayIndex];
    setCreateInfo({
      date: format(day, 'yyyy-MM-dd'),
      startTime: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    });
  }, [dragState, weekDays]);

  const now = new Date();
  const currentTimeTop = (now.getHours() * 60 + now.getMinutes()) / 60 * HOUR_HEIGHT;
  const isCurrentWeek = weekDays.some(d => isSameDay(d, now));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {format(weekStart, 'yyyy年 M月d日', { locale: ja })}
            <span className="text-gray-400 mx-2">–</span>
            {format(weekEnd, 'M月d日', { locale: ja })}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              今日
            </button>
            <button
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-gray-200">
        <div className="border-r border-gray-100" />
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const isSun = day.getDay() === 0;
          const isSat = day.getDay() === 6;
          const dayMilestones = milestones.filter(m => isSameDay(parseISO(m.dueDate), day));
          return (
            <div key={i} className={`py-3 text-center border-r border-gray-100 ${isToday ? 'bg-blue-50' : ''}`}>
              <div className={`text-xs font-medium mb-1 ${isSun ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-gray-500'}`}>
                {format(day, 'E', { locale: ja })}
              </div>
              <div className={`text-xl font-bold inline-flex items-center justify-center w-9 h-9 rounded-full mx-auto ${
                isToday
                  ? 'bg-blue-600 text-white'
                  : isSun ? 'text-red-500' : isSat ? 'text-blue-600' : 'text-gray-800'
              }`}>
                {format(day, 'd')}
              </div>
              {dayMilestones.map(m => (
                <div key={m.id} title={m.name} className="flex items-center justify-center mt-1 gap-1">
                  <Diamond className="w-3 h-3 text-purple-500 fill-current" />
                  <span className="text-[10px] text-purple-600 truncate max-w-[60px]">{m.name}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {allDayTasks.length > 0 && (
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-gray-200 bg-gray-50/30">
          <div className="border-r border-gray-100 text-xs text-gray-400 font-medium flex items-center justify-center py-2">終日</div>
          {weekDays.map((day, dayIndex) => {
            const dayAllDay = allDayBlocks.filter(b => b.dayIndex === dayIndex);
            return (
              <div key={dayIndex} className="border-r border-gray-100 p-1.5 min-h-[36px] space-y-0.5">
                {dayAllDay.map(block => (
                  <div
                    key={block.task.id}
                    onClick={() => router.push(`/tasks/${block.task.id}`)}
                    className={`text-xs font-medium px-2 py-1 rounded-md truncate cursor-pointer transition-opacity hover:opacity-80 ${
                      block.task.status === 'done'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {block.task.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)', minHeight: '400px' }}
        onPointerMove={dragState ? handlePointerMove : undefined}>
        <div className="grid grid-cols-[56px_repeat(7,1fr)] relative" data-week-grid>
          {/* Time labels */}
          <div className="border-r border-gray-100">
            {HOURS.map(hour => (
              <div key={hour} className="relative border-b border-gray-100" style={{ height: `${HOUR_HEIGHT}px` }}>
                {hour > 0 && (
                  <span className="absolute -top-2.5 right-2 text-[11px] font-medium text-gray-400 leading-none">
                    {hour}:00
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const isToday = isSameDay(day, new Date());
            const dayTimedBlocks = timedBlocks.filter(b => getBlockDisplay(b).dayIndex === dayIndex);

            return (
              <div
                key={dayIndex}
                className={`border-r border-gray-100 relative cursor-pointer ${isToday ? 'bg-blue-50/20' : 'hover:bg-gray-50/50'}`}
                onClick={e => handleEmptySlotClick(e, dayIndex)}
              >
                {HOURS.map(hour => (
                  <div key={hour} className="border-b border-gray-100" style={{ height: `${HOUR_HEIGHT}px` }} />
                ))}

                {/* Half-hour lines */}
                {HOURS.map(hour => (
                  <div
                    key={`half-${hour}`}
                    className="absolute left-0 right-0 border-b border-dashed border-gray-100 pointer-events-none"
                    style={{ top: `${hour * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                  />
                ))}

                {isCurrentWeek && isToday && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-400 z-20 pointer-events-none"
                    style={{ top: `${currentTimeTop}px` }}
                  >
                    <div className="absolute -top-1.5 -left-1 w-3 h-3 bg-red-400 rounded-full" />
                  </div>
                )}

                {dayTimedBlocks.map(block => {
                  const display = getBlockDisplay(block);
                  const GAP = 2;
                  const colFraction = 1 / block.totalCols;
                  const leftPct = block.col * colFraction * 100;
                  const widthCalc = block.totalCols > 1
                    ? `calc(${colFraction * 100}% - ${GAP}px)`
                    : `calc(100% - 4px)`;

                  return (
                    <div
                      key={`${block.task.id}-${block.dayIndex}`}
                      className={`absolute border-l-[3px] rounded-md px-2 py-1 overflow-hidden select-none z-10 transition-shadow
                        ${getBlockStyle(block.task)}
                        ${display.isDragging ? 'shadow-xl opacity-90 cursor-grabbing z-30 ring-2 ring-blue-400' : 'shadow-sm hover:shadow-md cursor-grab'}
                      `}
                      style={{
                        top: `${display.topPx + 1}px`,
                        height: `${Math.max(MIN_BLOCK_HEIGHT, display.heightPx - 2)}px`,
                        left: `calc(${leftPct}% + 2px)`,
                        width: widthCalc,
                      }}
                      onPointerDown={e => { e.stopPropagation(); handleBlockPointerDown(e, block); }}
                      onPointerUp={e => { e.stopPropagation(); handleBlockPointerUp(e, block); }}
                    >
                      <div className="text-xs font-semibold leading-snug truncate">{block.task.title}</div>
                      {display.heightPx > 48 && (
                        <div className={`text-[11px] mt-0.5 leading-none ${getTimeStyle(block.task)}`}>
                          {block.task.startDate ? format(parseISO(block.task.startDate), 'HH:mm') : ''}
                          {block.task.startDate && block.task.dueDate ? '–' : ''}
                          {block.task.dueDate ? format(parseISO(block.task.dueDate), 'HH:mm') : ''}
                        </div>
                      )}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-3 cursor-s-resize hover:bg-black/5 rounded-b-md"
                        onPointerDown={e => { e.stopPropagation(); handlePointerDown(e, block, 'resize'); }}
                        onPointerUp={e => { e.stopPropagation(); handlePointerUp(e); }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {createInfo && (
        <CreateTaskDialog
          open={!!createInfo}
          onClose={() => setCreateInfo(null)}
          onSuccess={() => { setCreateInfo(null); onUpdate(); }}
          projectId={projectId}
          initialDueDate={createInfo.date}
          initialStartDate={createInfo.date}
        />
      )}
    </div>
  );
}
