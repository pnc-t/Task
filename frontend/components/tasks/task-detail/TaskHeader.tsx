import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskHeaderProps {
  taskTitle?: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
}

export function TaskHeader({ taskTitle, onBack, onEdit, onDelete, isEditing }: TaskHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {taskTitle || 'タスク詳細'}
        </h1>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          {!isEditing && (
            <Button onClick={onEdit} variant="outline">
              <Edit2 className="w-4 h-4 mr-2" />
              編集
            </Button>
          )}
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}