'use client';

import { useCallback, useRef } from 'react';
import { taskService } from '@/services/task.service';
import { UpdateTaskData } from '@/types/task';

interface UseTaskDragOptions {
  onUpdate: () => void;
}

export function useTaskDrag({ onUpdate }: UseTaskDragOptions) {
  const pendingRef = useRef(false);

  const updateTask = useCallback(
    async (taskId: string, data: Partial<UpdateTaskData>) => {
      if (pendingRef.current) return;
      pendingRef.current = true;

      try {
        await taskService.update(taskId, data);
        onUpdate();
      } catch (error) {
        console.error('Failed to update task via drag:', error);
        onUpdate(); // reload to rollback
      } finally {
        pendingRef.current = false;
      }
    },
    [onUpdate]
  );

  return { updateTask };
}
