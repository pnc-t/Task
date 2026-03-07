'use client';

import { useState } from 'react';
import { Tag as TagIcon, Plus, X } from 'lucide-react';
import { Tag, TaskTag } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TagManagerProps {
  taskTags: TaskTag[];
  projectTags: Tag[];
  onAddTag: (tagId: string) => Promise<void>;
  onRemoveTag: (tagId: string) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<void>;
}

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
];

export function TagManager({
  taskTags,
  projectTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
}: TagManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const currentTagIds = taskTags.map(tt => tt.tag.id);
  const availableTags = projectTags.filter(t => !currentTagIds.includes(t.id));

  const handleAddTag = async (tagId: string) => {
    setIsLoading(true);
    try {
      await onAddTag(tagId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    setIsLoading(true);
    try {
      await onRemoveTag(tagId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsLoading(true);
    try {
      await onCreateTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setIsCreating(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-sm text-gray-900">タグ</span>
            {taskTags.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {taskTags.length}
              </span>
            )}
          </div>
          {!isAdding && !isCreating && (
            <button
              onClick={() => setIsAdding(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* 現在のタグ */}
        {taskTags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {taskTags.map((taskTag) => (
              <span
                key={taskTag.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: taskTag.tag.color }}
              >
                {taskTag.tag.name}
                <button
                  onClick={() => handleRemoveTag(taskTag.tag.id)}
                  disabled={isLoading}
                  className="hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-3">タグなし</p>
        )}

        {/* タグ追加フォーム */}
        {isAdding && (
          <div className="space-y-2 mb-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700">タグを追加</p>
            {availableTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    disabled={isLoading}
                    className="px-2 py-1 rounded-full text-xs font-medium text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: tag.color }}
                  >
                    + {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">追加可能なタグがありません</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreating(true)}
              >
                新規作成
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAdding(false)}
              >
                閉じる
              </Button>
            </div>
          </div>
        )}

        {/* 新規タグ作成フォーム */}
        {isCreating && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700">新規タグ作成</p>
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="タグ名"
              className="text-sm"
            />
            <div>
              <p className="text-xs text-gray-500 mb-2">色を選択</p>
              <div className="flex gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      newTagColor === color ? 'border-gray-900' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || isLoading}
              >
                作成
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewTagName('');
                }}
              >
                キャンセル
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}