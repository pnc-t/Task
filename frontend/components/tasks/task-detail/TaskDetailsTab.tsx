'use client';

import { Task, Milestone, Tag } from '@/types/task';
import { ProjectMember } from '@/types/project';
import { DependencyManager } from './DependencyManager';
import { MilestoneSelector } from './MilestoneSelector';
import { TagManager } from './TagManager';

interface TaskDetailsTabProps {
  task: Task;
  projectTasks: Task[];
  projectMilestones: Milestone[];
  projectTags: Tag[];
  projectMembers: ProjectMember[];
  onAddDependency: (dependsOnId: string) => Promise<void>;
  onRemoveDependency: (dependsOnId: string) => Promise<void>;
  onSelectMilestone: (milestoneId: string | null) => Promise<void>;
  onCreateMilestone: (name: string, dueDate: string) => Promise<void>;
  onAddTag: (tagId: string) => Promise<void>;
  onRemoveTag: (tagId: string) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<void>;
}

export function TaskDetailsTab({
  task,
  projectTasks,
  projectMilestones,
  projectTags,
  onAddDependency,
  onRemoveDependency,
  onSelectMilestone,
  onCreateMilestone,
  onAddTag,
  onRemoveTag,
  onCreateTag,
}: TaskDetailsTabProps) {
  return (
    <div className="space-y-6">
      {/* 依存関係 */}
      <DependencyManager
        task={task}
        projectTasks={projectTasks}
        onAddDependency={onAddDependency}
        onRemoveDependency={onRemoveDependency}
      />

      {/* マイルストーン */}
      <MilestoneSelector
        currentMilestone={task.milestone}
        projectMilestones={projectMilestones}
        onSelectMilestone={onSelectMilestone}
        onCreateMilestone={onCreateMilestone}
      />

      {/* タグ */}
      <TagManager
        taskTags={task.tags || []}
        projectTags={projectTags}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
        onCreateTag={onCreateTag}
      />
    </div>
  );
}