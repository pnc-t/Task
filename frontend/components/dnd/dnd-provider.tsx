'use client';

import { ReactNode, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { Task } from '@/types/task';
import { TaskDragOverlay } from './task-drag-overlay';

interface TaskDndProviderProps {
  children: ReactNode;
  tasks: Task[];
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function TaskDndProvider({
  children,
  tasks,
  onDragStart,
  onDragOver,
  onDragEnd,
}: TaskDndProviderProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });

  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const taskId = event.active.id as string;
      const task = tasks.find((t) => t.id === taskId);
      if (task) setActiveTask(task);
      onDragStart?.(event);
    },
    [tasks, onDragStart]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      onDragEnd(event);
    },
    [onDragEnd]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      onDragOver?.(event);
    },
    [onDragOver]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart({ active }) {
            const task = tasks.find((t) => t.id === active.id);
            return `「${task?.title || ''}」をドラッグ中`;
          },
          onDragOver({ active, over }) {
            if (over) {
              return `ドロップ先: ${over.id}`;
            }
            return 'ドロップ先なし';
          },
          onDragEnd({ active, over }) {
            if (over) {
              return `「${tasks.find((t) => t.id === active.id)?.title || ''}」を移動しました`;
            }
            return 'ドラッグをキャンセルしました';
          },
          onDragCancel() {
            return 'ドラッグをキャンセルしました';
          },
        },
      }}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeTask && <TaskDragOverlay task={activeTask} />}
      </DragOverlay>
    </DndContext>
  );
}
