import React from 'react';
import { Task, Milestone, Tag } from '@/types/task';
import { ProjectMember } from '@/types/project';
import { TaskEditForm } from './TaskEditForm';
import { DependencyManager } from './DependencyManager';
import { MilestoneSelector } from './MilestoneSelector';
import { TagManager } from './TagManager';
import { differenceInDays, isAfter, startOfDay, parseISO, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { sanitizeText } from '@/lib/sanitize';
import { InlineEdit } from '@/components/ui/inline-edit';

interface TaskOverviewTabProps {
  task: Task;
  isEditing: boolean;
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
  progressPercent: number;
  isEditingProgress: boolean;
  onFormChange: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onProgressChange: (value: number) => void;
  onSaveProgress: () => void;
  onCancelProgress: () => void;
  onStartEditProgress: () => void;
  subtasksCount?: number;
  completedSubtasksCount?: number;
  // ステータス・優先度変更
  onStatusChange?: (status: Task['status']) => void;
  onPriorityChange?: (priority: Task['priority']) => void;
  isUpdatingStatus?: boolean;
  isUpdatingPriority?: boolean;
  // 依存/マイルストーン/タグ（旧detailsタブから統合）
  projectTasks?: Task[];
  projectMilestones?: Milestone[];
  projectTags?: Tag[];
  onAddDependency?: (dependsOnId: string) => Promise<void>;
  onRemoveDependency?: (dependsOnId: string) => Promise<void>;
  onSelectMilestone?: (milestoneId: string | null) => Promise<void>;
  onCreateMilestone?: (name: string, dueDate: string) => Promise<void>;
  onAddTag?: (tagId: string) => Promise<void>;
  onRemoveTag?: (tagId: string) => Promise<void>;
  onCreateTag?: (name: string, color: string) => Promise<void>;
}

export function TaskOverviewTab({
  task,
  isEditing,
  formData,
  isLoading,
  progressPercent,
  isEditingProgress,
  onFormChange,
  onSave,
  onCancel,
  onProgressChange,
  onSaveProgress,
  onCancelProgress,
  onStartEditProgress,
  subtasksCount = 0,
  completedSubtasksCount = 0,
  onStatusChange,
  onPriorityChange,
  isUpdatingStatus = false,
  isUpdatingPriority = false,
  projectTasks = [],
  projectMilestones = [],
  projectTags = [],
  onAddDependency,
  onRemoveDependency,
  onSelectMilestone,
  onCreateMilestone,
  onAddTag,
  onRemoveTag,
  onCreateTag,
}: TaskOverviewTabProps) {
  // 進捗率を計算（task.progress を優先）
  const calculateProgress = () => {
    // task.progress が設定されている場合はそれを使用
    if (task.progress !== undefined && task.progress !== null) {
      return task.progress;
    }

    // サブタスクがある場合はサブタスクベースの進捗
    if (subtasksCount > 0) {
      return Math.round((completedSubtasksCount / subtasksCount) * 100);
    }

    // サブタスクがない場合はステータスベースの進捗
    if (task.status === 'done') return 100;
    if (task.status === 'in_progress') return 50;
    return 0;
  };

  const actualProgress = calculateProgress();

  const getProgressInfo = () => {
    const today = startOfDay(new Date());
    const createdDate = startOfDay(parseISO(task.createdAt));
    const dueDate = task.dueDate ? startOfDay(parseISO(task.dueDate)) : null;

    if (!dueDate) {
      return {
        status: 'no-deadline',
        message: '期限が設定されていません',
        daysInfo: null,
        color: 'bg-gray-100 text-gray-600',
        borderColor: 'border-gray-300',
        icon: Clock,
      };
    }

    const remainingDays = differenceInDays(dueDate, today);

    if (task.status === 'done') {
      const completedDate = startOfDay(parseISO(task.updatedAt));
      const daysBeforeDue = differenceInDays(dueDate, completedDate);

      if (daysBeforeDue > 0) {
        return {
          status: 'completed-early',
          message: `期限より${daysBeforeDue}日早く完了`,
          daysInfo: daysBeforeDue,
          color: 'bg-green-50 text-green-700',
          borderColor: 'border-green-300',
          icon: TrendingUp,
        };
      } else if (daysBeforeDue < 0) {
        return {
          status: 'completed-late',
          message: `期限より${Math.abs(daysBeforeDue)}日遅れて完了`,
          daysInfo: Math.abs(daysBeforeDue),
          color: 'bg-orange-50 text-orange-700',
          borderColor: 'border-orange-300',
          icon: TrendingDown,
        };
      } else {
        return {
          status: 'completed-on-time',
          message: '期限通りに完了',
          daysInfo: 0,
          color: 'bg-green-50 text-green-700',
          borderColor: 'border-green-300',
          icon: CheckCircle,
        };
      }
    }

    if (isAfter(today, dueDate)) {
      return {
        status: 'overdue',
        message: `期限を${Math.abs(remainingDays)}日超過`,
        daysInfo: Math.abs(remainingDays),
        color: 'bg-red-50 text-red-700',
        borderColor: 'border-red-300',
        icon: AlertTriangle,
      };
    }

    if (remainingDays <= 3) {
      return {
        status: 'urgent',
        message: `残り${remainingDays}日`,
        daysInfo: remainingDays,
        color: 'bg-orange-50 text-orange-700',
        borderColor: 'border-orange-300',
        icon: Clock,
      };
    }

    return {
      status: 'on-track',
      message: `残り${remainingDays}日`,
      daysInfo: remainingDays,
      color: 'bg-blue-50 text-blue-700',
      borderColor: 'border-blue-300',
      icon: Clock,
    };
  };

  const progressInfo = getProgressInfo();
  const ProgressIcon = progressInfo.icon;

  const hoursDifference = task.estimatedHours && task.actualHours
    ? task.actualHours - task.estimatedHours
    : null;

  const handleInlineSave = async (field: string, value: string) => {
    onFormChange({ [field]: value });
    const updatedFormData = { ...formData, [field]: value };
    // Trigger save with the updated data
    onFormChange(updatedFormData);
    await onSave();
  };

  return (
    <div className="space-y-6">
      {isEditing ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <TaskEditForm
            formData={formData}
            isLoading={isLoading}
            onFormChange={onFormChange}
            onSave={onSave}
            onCancel={onCancel}
          />
        </div>
      ) : (
        <>
          {/* タイトルと説明 */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <InlineEdit
              value={task.title}
              onSave={(v) => handleInlineSave('title', v)}
              displayClassName="text-2xl font-bold text-gray-900 mb-4"
              placeholder="タスクタイトル"
            />
            <div className="mt-4">
              <InlineEdit
                value={task.description || ''}
                onSave={(v) => handleInlineSave('description', v)}
                type="textarea"
                displayClassName="text-gray-700"
                emptyText="説明を追加..."
                placeholder="タスクの説明"
              />
            </div>
          </div>

          {/* キー情報サマリー */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* ステータス */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">ステータス</p>
                <div className="flex gap-1">
                  {(['todo', 'in_progress', 'done'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => onStatusChange?.(status)}
                      disabled={isUpdatingStatus || task.status === status}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        task.status === status
                          ? status === 'done' ? 'bg-green-500 text-white' :
                            status === 'in_progress' ? 'bg-blue-500 text-white' :
                            'bg-gray-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {status === 'done' ? '完了' : status === 'in_progress' ? '進行中' : '未着手'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 優先度 */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">優先度</p>
                <div className="flex gap-1">
                  {(['low', 'medium', 'high'] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => onPriorityChange?.(priority)}
                      disabled={isUpdatingPriority || task.priority === priority}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                        task.priority === priority
                          ? priority === 'high' ? 'bg-red-500 text-white' :
                            priority === 'medium' ? 'bg-yellow-500 text-white' :
                            'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${isUpdatingPriority ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {priority === 'high' ? '高' : priority === 'medium' ? '中' : '低'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 期限 */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  期限
                </p>
                {task.dueDate ? (
                  <div className="text-sm font-semibold text-gray-900">
                    {format(parseISO(task.dueDate), 'M/d (E)', { locale: ja })}
                    <span className="text-xs text-gray-500 ml-1">
                      {format(parseISO(task.dueDate), 'HH:mm')}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">未設定</span>
                )}
              </div>

              {/* 担当者 */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  担当者
                </p>
                {task.assignees && task.assignees.length > 0 ? (
                  <div className="flex items-center -space-x-2">
                    {task.assignees.slice(0, 4).map((a) => (
                      <UserAvatar
                        key={a.id}
                        name={a.user.name}
                        avatar={a.user.avatar}
                        size="sm"
                        className="w-7 h-7 ring-2 ring-white"
                      />
                    ))}
                    {task.assignees.length > 4 && (
                      <span className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 ring-2 ring-white">
                        +{task.assignees.length - 4}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">未割当</span>
                )}
              </div>
            </div>
          </div>

          {/* 進捗ステータスカード */}
          <div className={`rounded-lg shadow border-2 ${progressInfo.borderColor} p-6 ${progressInfo.color}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow">
                <ProgressIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium opacity-80">進捗状況</p>
                <p className="text-xl font-bold">{progressInfo.message}</p>
              </div>
            </div>

            {/* プログレスバー */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {subtasksCount > 0 ? `サブタスク完了率 (${completedSubtasksCount}/${subtasksCount})` : '完了率'}
                </span>
                <span className="font-bold">{actualProgress}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-50 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-current h-3 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${actualProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* 工数情報のみ表示 */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3">⏱️ 工数情報</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-[10px] text-gray-600 mb-1">推定</p>
                <p className="text-lg font-bold text-gray-900">
                  {task.estimatedHours ? `${task.estimatedHours}h` : '-'}
                </p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-[10px] text-gray-600 mb-1">実績</p>
                <p className="text-lg font-bold text-gray-900">
                  {task.actualHours ? `${task.actualHours}h` : '-'}
                </p>
              </div>
              <div className={`rounded p-2 ${
                hoursDifference === null ? 'bg-gray-50' :
                hoursDifference < 0 ? 'bg-green-50' : 'bg-orange-50'
              }`}>
                <p className="text-[10px] text-gray-600 mb-1">差分</p>
                {hoursDifference !== null ? (
                  <p className={`text-lg font-bold ${
                    hoursDifference < 0 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {hoursDifference > 0 ? '+' : ''}{hoursDifference}h
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">-</p>
                )}
              </div>
            </div>
          </div>

          {/* 依存関係 */}
          {onAddDependency && onRemoveDependency && (
            <DependencyManager
              task={task}
              projectTasks={projectTasks}
              onAddDependency={onAddDependency}
              onRemoveDependency={onRemoveDependency}
            />
          )}

          {/* マイルストーン */}
          {onSelectMilestone && onCreateMilestone && (
            <MilestoneSelector
              currentMilestone={task.milestone}
              projectMilestones={projectMilestones}
              onSelectMilestone={onSelectMilestone}
              onCreateMilestone={onCreateMilestone}
            />
          )}

          {/* タグ */}
          {onAddTag && onRemoveTag && onCreateTag && (
            <TagManager
              taskTags={task.tags || []}
              projectTags={projectTags}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
              onCreateTag={onCreateTag}
            />
          )}
        </>
      )}
    </div>
  );
}