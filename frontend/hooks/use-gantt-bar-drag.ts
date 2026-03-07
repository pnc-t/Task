'use client';

import { useState, useRef, useCallback } from 'react';
import { taskService } from '@/services/task.service';
import { addDays, parseISO } from 'date-fns';

export type GanttDragMode = 'move' | 'resize-left' | 'resize-right';

export interface GanttDragState {
  taskId: string;
  mode: GanttDragMode;
  startX: number;
  /** Pixel offset accumulated during drag */
  deltaX: number;
  /** Original bar left position in px */
  originalLeft: number;
  /** Original bar width in px */
  originalWidth: number;
}

interface UseGanttBarDragOptions {
  cellWidth: number;
  days: Date[];
  onUpdate: () => void;
}

export function useGanttBarDrag({ cellWidth, days, onUpdate }: UseGanttBarDragOptions) {
  const [dragState, setDragState] = useState<GanttDragState | null>(null);
  const dragRef = useRef<GanttDragState | null>(null);
  const didDragRef = useRef(false);

  const onPointerDown = useCallback(
    (
      e: React.PointerEvent,
      taskId: string,
      mode: GanttDragMode,
      barLeft: number,
      barWidth: number
    ) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const state: GanttDragState = {
        taskId,
        mode,
        startX: e.clientX,
        deltaX: 0,
        originalLeft: barLeft,
        originalWidth: barWidth,
      };
      dragRef.current = state;
      didDragRef.current = false;
      setDragState(state);
    },
    []
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragRef.current;
    if (!ds) return;

    const deltaX = e.clientX - ds.startX;
    if (Math.abs(deltaX) > 3) didDragRef.current = true;

    const updated = { ...ds, deltaX };
    dragRef.current = updated;
    setDragState(updated);
  }, []);

  const onPointerUp = useCallback(
    async (e: React.PointerEvent) => {
      const ds = dragRef.current;
      if (!ds) return;

      dragRef.current = null;
      setDragState(null);

      if (!didDragRef.current) return; // was a click, not a drag

      const daysDelta = Math.round(ds.deltaX / cellWidth);
      if (daysDelta === 0 && ds.mode !== 'resize-left' && ds.mode !== 'resize-right') return;

      try {
        // We need to find the task to get current dates - read from DOM data attrs
        const taskEl = document.querySelector(`[data-gantt-task-id="${ds.taskId}"]`);
        const startDateStr = taskEl?.getAttribute('data-start-date') || null;
        const dueDateStr = taskEl?.getAttribute('data-due-date') || null;

        const updateData: Record<string, string> = {};

        if (ds.mode === 'move') {
          if (startDateStr) {
            updateData.startDate = addDays(parseISO(startDateStr), daysDelta).toISOString();
          }
          if (dueDateStr) {
            updateData.dueDate = addDays(parseISO(dueDateStr), daysDelta).toISOString();
          }
        } else if (ds.mode === 'resize-left') {
          if (startDateStr) {
            updateData.startDate = addDays(parseISO(startDateStr), daysDelta).toISOString();
          }
        } else if (ds.mode === 'resize-right') {
          if (dueDateStr) {
            updateData.dueDate = addDays(parseISO(dueDateStr), daysDelta).toISOString();
          }
        }

        if (Object.keys(updateData).length > 0) {
          await taskService.update(ds.taskId, updateData);
          onUpdate();
        }
      } catch (error) {
        console.error('Failed to update task via gantt drag:', error);
        onUpdate();
      }
    },
    [cellWidth, onUpdate]
  );

  /** Did the user actually drag (vs click)? */
  const didDrag = useCallback(() => didDragRef.current, []);

  /** Compute preview bar style given drag state */
  const getPreviewStyle = useCallback(
    (taskId: string, originalLeft: number, originalWidth: number) => {
      if (!dragState || dragState.taskId !== taskId) {
        return { left: `${originalLeft}px`, width: `${originalWidth}px` };
      }

      const ds = dragState;
      let left = originalLeft;
      let width = originalWidth;

      if (ds.mode === 'move') {
        left = ds.originalLeft + ds.deltaX;
      } else if (ds.mode === 'resize-left') {
        left = ds.originalLeft + ds.deltaX;
        width = ds.originalWidth - ds.deltaX;
      } else if (ds.mode === 'resize-right') {
        width = ds.originalWidth + ds.deltaX;
      }

      width = Math.max(cellWidth, width);

      return { left: `${left}px`, width: `${width}px` };
    },
    [dragState, cellWidth]
  );

  /** Get date preview text during drag */
  const getDatePreview = useCallback(
    (taskId: string, startDateStr: string | undefined, dueDateStr: string | undefined) => {
      if (!dragState || dragState.taskId !== taskId) return null;

      const daysDelta = Math.round(dragState.deltaX / cellWidth);
      if (daysDelta === 0) return null;

      let newStart: Date | null = null;
      let newEnd: Date | null = null;

      if (dragState.mode === 'move') {
        if (startDateStr) newStart = addDays(parseISO(startDateStr), daysDelta);
        if (dueDateStr) newEnd = addDays(parseISO(dueDateStr), daysDelta);
      } else if (dragState.mode === 'resize-left') {
        if (startDateStr) newStart = addDays(parseISO(startDateStr), daysDelta);
        if (dueDateStr) newEnd = parseISO(dueDateStr);
      } else if (dragState.mode === 'resize-right') {
        if (startDateStr) newStart = parseISO(startDateStr);
        if (dueDateStr) newEnd = addDays(parseISO(dueDateStr), daysDelta);
      }

      return { newStart, newEnd };
    },
    [dragState, cellWidth]
  );

  return {
    dragState,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    didDrag,
    getPreviewStyle,
    getDatePreview,
  };
}
