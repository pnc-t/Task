import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

interface TaskEditFormProps {
  formData: {
    title: string;
    description: string;
    startDate: string;
    startTime: string;
    dueDate: string;
    dueTime: string;
    estimatedHours: string;
    actualHours: string;
    progress: number;
  };
  isLoading: boolean;
  onFormChange: (data: Partial<TaskEditFormProps['formData']>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function TaskEditForm({ formData, isLoading, onFormChange, onSave, onCancel }: TaskEditFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">タスク名</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onFormChange({ title: e.target.value })}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">説明</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          rows={6}
          className="mt-1 flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        />
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
              onChange={(e) => onFormChange({ startDate: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="startTime" className="text-xs text-gray-500">時刻</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => onFormChange({ startTime: e.target.value })}
              className="mt-1"
              disabled={!formData.startDate}
            />
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
              onChange={(e) => onFormChange({ dueDate: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="dueTime" className="text-xs text-gray-500">時刻</Label>
            <Input
              id="dueTime"
              type="time"
              value={formData.dueTime}
              onChange={(e) => onFormChange({ dueTime: e.target.value })}
              className="mt-1"
              disabled={!formData.dueDate}
            />
          </div>
        </div>
      </div>

      <div>
        <Label>工数管理</Label>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div>
            <Label htmlFor="estimatedHours" className="text-xs text-gray-500">見積工数（時間）</Label>
            <Input
              id="estimatedHours"
              type="number"
              min="0"
              step="0.5"
              value={formData.estimatedHours}
              onChange={(e) => onFormChange({ estimatedHours: e.target.value })}
              className="mt-1"
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="actualHours" className="text-xs text-gray-500">実績工数（時間）</Label>
            <Input
              id="actualHours"
              type="number"
              min="0"
              step="0.5"
              value={formData.actualHours}
              onChange={(e) => onFormChange({ actualHours: e.target.value })}
              className="mt-1"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="progress">進捗率: {formData.progress}%</Label>
        <input
          id="progress"
          type="range"
          min="0"
          max="100"
          step="5"
          value={formData.progress}
          onChange={(e) => onFormChange({ progress: parseInt(e.target.value) })}
          className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          キャンセル
        </Button>
        <Button onClick={onSave} disabled={isLoading} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  );
}