'use client';

import { useState, useEffect } from 'react';
import { taskService } from '@/services/task.service';
import { projectService } from '@/services/project.service';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Clock } from 'lucide-react';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId?: string;
  initialDueDate?: string;  // 'yyyy-MM-dd'
  initialStartDate?: string; // 'yyyy-MM-dd'
}

export function CreateTaskDialog({ open, onClose, onSuccess, projectId, initialDueDate, initialStartDate }: CreateTaskDialogProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectId || '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    startDate: '',
    startTime: '09:00',
    dueDate: '',
    dueTime: '09:00',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && !projectId) {
      loadProjects();
    }
  }, [open, projectId]);

  useEffect(() => {
    if (open) {
      setFormData({
        title: '',
        description: '',
        projectId: projectId || '',
        priority: 'medium',
        startDate: initialStartDate || '',
        startTime: '09:00',
        dueDate: initialDueDate || '',
        dueTime: '09:00',
      });
      setError('');
    }
  }, [open, projectId, initialDueDate, initialStartDate]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.projectId) {
      setError('必須項目を入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let startDateISO: string | undefined = undefined;
      let dueDateISO: string | undefined = undefined;

      if (formData.startDate) {
        const startDateTimeStr = formData.startTime
          ? `${formData.startDate}T${formData.startTime}:00`
          : `${formData.startDate}T09:00:00`;

        startDateISO = new Date(startDateTimeStr).toISOString();
      }

      if (formData.dueDate) {
        const dateTimeStr = formData.dueTime
          ? `${formData.dueDate}T${formData.dueTime}:00`
          : `${formData.dueDate}T09:00:00`;

        dueDateISO = new Date(dateTimeStr).toISOString();
      }

      const taskData = {
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        priority: formData.priority,
        startDate: startDateISO,
        dueDate: dueDateISO,
      };

      await taskService.create(taskData);
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'タスクの作成に失敗しました';
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">新規タスク</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="title">タスク名 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="タスクのタイトル"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">説明</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="タスクの詳細"
              rows={3}
              className="mt-1 flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!projectId && (
            <div>
              <Label htmlFor="projectId">プロジェクト *</Label>
              <select
                id="projectId"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">プロジェクトを選択</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="priority">優先度</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          <div>
            <Label>開始日</Label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <Label htmlFor="startDate" className="text-xs text-gray-500">日付</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="startTime" className="text-xs text-gray-500">時刻</Label>
                <div className="relative mt-1">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="pl-9"
                    disabled={!formData.startDate}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>期限</Label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <Label htmlFor="dueDate" className="text-xs text-gray-500">日付</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dueTime" className="text-xs text-gray-500">時刻</Label>
                <div className="relative mt-1">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="dueTime"
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    className="pl-9"
                    disabled={!formData.dueDate}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
              {isLoading ? '作成中...' : '作成'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}