'use client';

import { useState, useCallback } from 'react';
import { Task } from '@/types/task';
import { TaskCard } from './task-card';
import { TaskDndProvider } from '@/components/dnd/dnd-provider';
import { useTaskDrag } from '@/hooks/use-task-drag';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core';

interface TaskBoardProps {
  tasks: {
    todo: Task[];
    in_progress: Task[];
    done: Task[];
  };
  onUpdate: () => void;
}

function DroppableColumn({
  id,
  title,
  tasks,
  onUpdate,
  isOver,
}: {
  id: string;
  title: string;
  tasks: Task[];
  onUpdate: () => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50 rounded-lg p-4 transition-all duration-200 ${
        isOver ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <DraggableTaskCard key={task.id} task={task} onUpdate={onUpdate} />
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            タスクなし
          </p>
        )}
      </div>
    </div>
  );
}

function DraggableTaskCard({
  task,
  onUpdate,
}: {
  task: Task;
  onUpdate: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`transition-opacity ${isDragging ? 'opacity-30' : ''}`}
    >
      <TaskCard task={task} onUpdate={onUpdate} />
    </div>
  );
}

export function TaskBoard({ tasks, onUpdate }: TaskBoardProps) {
  const { updateTask } = useTaskDrag({ onUpdate });
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const allTasks = [...tasks.todo, ...tasks.in_progress, ...tasks.done];

  const columns = [
    { id: 'todo', title: '未着手', tasks: tasks.todo },
    { id: 'in_progress', title: '進行中', tasks: tasks.in_progress },
    { id: 'done', title: '完了', tasks: tasks.done },
  ];

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverColumnId(event.over?.id as string | null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setOverColumnId(null);
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const newStatus = over.id as Task['status'];

      // Find current task status
      const task = allTasks.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) return;

      updateTask(taskId, { status: newStatus });
    },
    [allTasks, updateTask]
  );

  return (
    <TaskDndProvider
      tasks={allTasks}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <DroppableColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={column.tasks}
            onUpdate={onUpdate}
            isOver={overColumnId === column.id}
          />
        ))}
      </div>
    </TaskDndProvider>
  );
}
