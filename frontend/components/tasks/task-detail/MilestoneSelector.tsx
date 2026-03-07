'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Flag, Plus, X, CheckCircle, Clock } from 'lucide-react';
import { Milestone } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MilestoneSelectorProps {
  currentMilestone?: {
    id: string;
    name: string;
    dueDate: string;
    status: string;
  };
  projectMilestones: Milestone[];
  onSelectMilestone: (milestoneId: string | null) => Promise<void>;
  onCreateMilestone: (name: string, dueDate: string) => Promise<void>;
}

export function MilestoneSelector({
  currentMilestone,
  projectMilestones,
  onSelectMilestone,
  onCreateMilestone,
}: MilestoneSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (milestoneId: string | null) => {
    setIsLoading(true);
    try {
      await onSelectMilestone(milestoneId);
      setIsSelecting(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newMilestoneName.trim() || !newMilestoneDueDate) return;

    setIsLoading(true);
    try {
      await onCreateMilestone(newMilestoneName.trim(), newMilestoneDueDate);
      setNewMilestoneName('');
      setNewMilestoneDueDate('');
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
            <Flag className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-sm text-gray-900">マイルストーン</span>
          </div>
          {!isSelecting && !isCreating && (
            <button
              onClick={() => setIsSelecting(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* 現在のマイルストーン */}
        {currentMilestone ? (
          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-2">
              {currentMilestone.status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-indigo-600" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{currentMilestone.name}</p>
                <p className="text-xs text-gray-500">
                  期限: {format(parseISO(currentMilestone.dueDate), 'yyyy/MM/dd', { locale: ja })}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSelect(null)}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-3">マイルストーン未設定</p>
        )}

        {/* マイルストーン選択 */}
        {isSelecting && (
          <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700">マイルストーンを選択</p>
            {projectMilestones.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {projectMilestones
                  .filter(m => m.id !== currentMilestone?.id)
                  .map((milestone) => (
                    <button
                      key={milestone.id}
                      onClick={() => handleSelect(milestone.id)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-indigo-500 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {milestone.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Flag className="w-4 h-4 text-indigo-600" />
                        )}
                        <span className="text-sm font-medium">{milestone.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(parseISO(milestone.dueDate), 'M/d')}
                      </span>
                    </button>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">マイルストーンがありません</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsSelecting(false);
                  setIsCreating(true);
                }}
              >
                新規作成
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsSelecting(false)}
              >
                閉じる
              </Button>
            </div>
          </div>
        )}

        {/* 新規マイルストーン作成 */}
        {isCreating && (
          <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700">新規マイルストーン作成</p>
            <div>
              <Label htmlFor="milestoneName" className="text-xs">名前</Label>
              <Input
                id="milestoneName"
                value={newMilestoneName}
                onChange={(e) => setNewMilestoneName(e.target.value)}
                placeholder="マイルストーン名"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="milestoneDueDate" className="text-xs">期限日</Label>
              <Input
                id="milestoneDueDate"
                type="date"
                value={newMilestoneDueDate}
                onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newMilestoneName.trim() || !newMilestoneDueDate || isLoading}
              >
                作成
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewMilestoneName('');
                  setNewMilestoneDueDate('');
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