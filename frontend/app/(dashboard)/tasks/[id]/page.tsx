'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Task, TaskComment, Subtask, TaskAttachment, ActivityLog } from '@/types/task';
import { taskService } from '@/services/task.service';
import { projectService } from '@/services/project.service';
import { useAuthStore } from '@/lib/auth-store';
import { useBreadcrumbStore } from '@/lib/breadcrumb-store';
import { wsClient } from '@/lib/websocket-client';
import { TaskHeader } from '@/components/tasks/task-detail/TaskHeader';
import { TaskTabs, TabId } from '@/components/tasks/task-detail/TaskTabs';
import { TaskOverviewTab } from '@/components/tasks/task-detail/TaskOverviewTab';
import { TaskCommentsTab } from '@/components/tasks/task-detail/TaskCommentsTab';
import { TaskSubtasksTab } from '@/components/tasks/task-detail/TaskSubtasksTab';
import { TaskAttachmentsTab } from '@/components/tasks/task-detail/TaskAttachmentsTab';
import { TaskActivityTab } from '@/components/tasks/task-detail/TaskActivityTab';
import { TaskSidebar } from '@/components/tasks/task-detail/TaskSidebar';
import { AssigneeManager } from '@/components/tasks/task-detail/AssigneeManager';
import { TaskDetailsTab } from '@/components/tasks/task-detail/TaskDetailsTab';
import { TimeTrackingTab } from '@/components/tasks/task-detail/TimeTrackingTab';
import { tagService } from '@/services/tag.service';
import { milestoneService } from '@/services/milestone.service';
import { Tag, Milestone } from '@/types/task';

interface ProjectMember {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  role: string;
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  // タスク基本情報
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // フォームデータ
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    startDate: '',
    startTime: '',
    dueDate: '',
    dueTime: '',
    estimatedHours: '',
    actualHours: '',
    progress: 0,
  });

  // タブごとのデータ
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // カウント（事前読み込み用）
  const [counts, setCounts] = useState({
    comments: 0,
    subtasks: 0,
    attachments: 0,
  });

  // その他の状態
  const [isUploading, setIsUploading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);

  // マイルストーン・タグ管理
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [projectTags, setProjectTags] = useState<Tag[]>([]);

  // タスク詳細の読み込み
  useEffect(() => {
    loadTaskDetail();
    loadAllCounts(); // カウントを事前に読み込む
  }, [resolvedParams.id]);

  // パンくずリスト
  const setSegments = useBreadcrumbStore(s => s.setSegments);
  useEffect(() => {
    if (task) {
      setSegments([
        { label: 'プロジェクト', href: '/projects' },
        { label: task.project?.name || 'プロジェクト', href: task.project?.id ? `/projects/${task.project.id}` : undefined },
        { label: task.title },
      ]);
    }
    return () => useBreadcrumbStore.getState().clear();
  }, [task, setSegments]);

  // プロジェクトメンバー、タスク、マイルストーン、タグの読み込み
  useEffect(() => {
    if (task?.project?.id) {
      loadProjectMembers();
      loadProjectTasks();
      loadProjectMilestones();
      loadProjectTags();
    }
  }, [task?.project?.id]);

  // WebSocketリスナー設定
  useEffect(() => {
    if (!task?.project?.id) return;

    const projectId = task.project.id;
    const taskId = resolvedParams.id;

    wsClient.joinProject(projectId);

    // タスク更新
    const handleTaskUpdated = (data: any) => {
      if (data.taskId === taskId) {
        loadTaskDetail();
        loadActivityLogs();
      }
    };

    // コメント関連
    const handleCommentAdded = (data: any) => {
      if (data.taskId === taskId) {
        loadComments();
        loadActivityLogs();
      }
    };

    const handleCommentUpdated = (data: any) => {
      if (data.taskId === taskId) {
        loadComments();
      }
    };

    const handleCommentDeleted = (data: any) => {
      if (data.taskId === taskId) {
        loadComments();
      }
    };

    // サブタスク関連
    const handleSubtaskAdded = (data: any) => {
      if (data.taskId === taskId) {
        loadSubtasks();
        loadActivityLogs();
      }
    };

    const handleSubtaskUpdated = (data: any) => {
      if (data.taskId === taskId) {
        loadSubtasks();
        loadActivityLogs();
      }
    };

    const handleSubtaskDeleted = (data: any) => {
      if (data.taskId === taskId) {
        loadSubtasks();
        loadActivityLogs();
      }
    };

    wsClient.on('task:updated', handleTaskUpdated);
    wsClient.on('comment:added', handleCommentAdded);
    wsClient.on('comment:updated', handleCommentUpdated);
    wsClient.on('comment:deleted', handleCommentDeleted);
    wsClient.on('subtask:added', handleSubtaskAdded);
    wsClient.on('subtask:updated', handleSubtaskUpdated);
    wsClient.on('subtask:deleted', handleSubtaskDeleted);

    return () => {
      wsClient.leaveProject(projectId);
      wsClient.off('task:updated', handleTaskUpdated);
      wsClient.off('comment:added', handleCommentAdded);
      wsClient.off('comment:updated', handleCommentUpdated);
      wsClient.off('comment:deleted', handleCommentDeleted);
      wsClient.off('subtask:added', handleSubtaskAdded);
      wsClient.off('subtask:updated', handleSubtaskUpdated);
      wsClient.off('subtask:deleted', handleSubtaskDeleted);
    };
  }, [task?.project?.id, resolvedParams.id]);

  // タブ切り替え時のデータ読み込み
  useEffect(() => {
    if (activeTab === 'comments' && comments.length === 0) {
      loadComments();
    } else if (activeTab === 'subtasks' && subtasks.length === 0) {
      loadSubtasks();
    } else if (activeTab === 'attachments' && attachments.length === 0) {
      loadAttachments();
    } else if (activeTab === 'activity' && activityLogs.length === 0) {
      loadActivityLogs();
    }
  }, [activeTab]);

  // すべてのカウントを事前に読み込む
  const loadAllCounts = async () => {
    try {
      const [commentsData, subtasksData, attachmentsData] = await Promise.all([
        taskService.getComments(resolvedParams.id).catch(() => []),
        taskService.getSubtasks(resolvedParams.id).catch(() => []),
        taskService.getAttachments(resolvedParams.id).catch(() => []),
      ]);

      setSubtasks(subtasksData);

      setCounts({
        comments: commentsData.length,
        subtasks: subtasksData.length,
        attachments: attachmentsData.length,
      });
    } catch (error) {
      console.error('Failed to load counts:', error);
    }
  };

  const loadTaskDetail = async () => {
    setIsLoading(true);
    try {
      const data = await taskService.getById(resolvedParams.id);
      setTask(data);

      let startDateStr = '';
      let startTimeStr = '';
      let dueDateStr = '';
      let dueTimeStr = '';

      if (data.startDate) {
        const startDateTime = parseISO(data.startDate);
        startDateStr = format(startDateTime, 'yyyy-MM-dd');
        startTimeStr = format(startDateTime, 'HH:mm');
      }

      if (data.dueDate) {
        const dueDateTime = parseISO(data.dueDate);
        dueDateStr = format(dueDateTime, 'yyyy-MM-dd');
        dueTimeStr = format(dueDateTime, 'HH:mm');
      }

      setFormData({
        title: data.title,
        description: data.description || '',
        status: data.status,
        priority: data.priority,
        startDate: startDateStr,
        startTime: startTimeStr,
        dueDate: dueDateStr,
        dueTime: dueTimeStr,
        estimatedHours: data.estimatedHours?.toString() || '',
        actualHours: data.actualHours?.toString() || '',
        progress: data.progress || 0,
      });

      // 進捗率の設定
      setProgressPercent(data.progress || 0);
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectMembers = async () => {
    if (!task?.project?.id) return;

    try {
      const project = await projectService.getById(task.project.id);
      setProjectMembers(project.members);
    } catch (error) {
      console.error('Failed to load project members:', error);
    }
  };

  const loadProjectTasks = async () => {
    if (!task?.project?.id) return;

    try {
      const tasks = await taskService.getAll(task.project.id);
      setProjectTasks(tasks);
    } catch (error) {
      console.error('Failed to load project tasks:', error);
    }
  };

  const loadProjectMilestones = async () => {
    if (!task?.project?.id) return;

    try {
      const milestones = await milestoneService.getAll(task.project.id);
      setProjectMilestones(milestones);
    } catch (error) {
      console.error('Failed to load project milestones:', error);
    }
  };

  const loadProjectTags = async () => {
    if (!task?.project?.id) return;

    try {
      const tags = await tagService.getAll(task.project.id);
      setProjectTags(tags);
    } catch (error) {
      console.error('Failed to load project tags:', error);
    }
  };

  const loadComments = async () => {
    try {
      const data = await taskService.getComments(resolvedParams.id);
      setComments(data);
      setCounts(prev => ({ ...prev, comments: data.length }));
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const loadSubtasks = async () => {
    try {
      const data = await taskService.getSubtasks(resolvedParams.id);
      setSubtasks(data);
      setCounts(prev => ({ ...prev, subtasks: data.length }));
    } catch (error) {
      console.error('Failed to load subtasks:', error);
    }
  };

  const loadAttachments = async () => {
    try {
      const data = await taskService.getAttachments(resolvedParams.id);
      setAttachments(data);
      setCounts(prev => ({ ...prev, attachments: data.length }));
    } catch (error) {
      console.error('Failed to load attachments:', error);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const data = await taskService.getActivityLogs(resolvedParams.id);
      setActivityLogs(data);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    }
  };

  // タスク更新
  const handleUpdate = async () => {
    if (!task) return;

    setIsLoading(true);
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

      await taskService.update(task.id, {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        startDate: startDateISO,
        dueDate: dueDateISO,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        actualHours: formData.actualHours ? parseFloat(formData.actualHours) : undefined,
        progress: formData.progress,
      });
      setIsEditing(false);
      await loadTaskDetail();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (task) {
      let startDateStr = '';
      let startTimeStr = '';
      let dueDateStr = '';
      let dueTimeStr = '';

      if (task.startDate) {
        const startDateTime = parseISO(task.startDate);
        startDateStr = format(startDateTime, 'yyyy-MM-dd');
        startTimeStr = format(startDateTime, 'HH:mm');
      }

      if (task.dueDate) {
        const dueDateTime = parseISO(task.dueDate);
        dueDateStr = format(dueDateTime, 'yyyy-MM-dd');
        dueTimeStr = format(dueDateTime, 'HH:mm');
      }

      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        startDate: startDateStr,
        startTime: startTimeStr,
        dueDate: dueDateStr,
        dueTime: dueTimeStr,
        estimatedHours: task.estimatedHours?.toString() || '',
        actualHours: task.actualHours?.toString() || '',
        progress: task.progress || 0,
      });
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('このタスクを削除してもよろしいですか?')) {
      return;
    }

    try {
      await taskService.delete(task.id);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // ステータス変更
  const handleQuickStatusChange = async (newStatus: Task['status']) => {
    if (!task || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      await taskService.update(task.id, { status: newStatus });
      await loadTaskDetail();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 優先度変更
  const handleQuickPriorityChange = async (newPriority: Task['priority']) => {
    if (!task || isUpdatingPriority) return;

    setIsUpdatingPriority(true);
    try {
      await taskService.update(task.id, { priority: newPriority });
      await loadTaskDetail();
    } catch (error) {
      console.error('Failed to update priority:', error);
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  // マイルストーン変更
  const handleMilestoneChange = async (milestoneId: string | null) => {
    if (!task) return;

    try {
      await taskService.update(task.id, { milestoneId: milestoneId || undefined });
      await loadTaskDetail();
    } catch (error) {
      console.error('Failed to update milestone:', error);
    }
  };

  // タグ変更
  const handleTagsChange = async (tagIds: string[]) => {
    if (!task) return;

    try {
      await taskService.update(task.id, { tagIds });
      await loadTaskDetail();
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  // 進捗率更新
  const handleProgressUpdate = async () => {
    if (!task) return;

    try {
      let newStatus = task.status;
      if (progressPercent === 100) {
        newStatus = 'done';
      } else if (progressPercent > 0) {
        newStatus = 'in_progress';
      } else {
        newStatus = 'todo';
      }

      if (newStatus !== task.status) {
        await taskService.update(task.id, { status: newStatus });
        await loadTaskDetail();
      }

      setIsEditingProgress(false);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleCancelProgress = () => {
    setIsEditingProgress(false);
    if (task) {
      if (task.status === 'done') {
        setProgressPercent(100);
      } else if (task.status === 'in_progress') {
        setProgressPercent(50);
      } else {
        setProgressPercent(0);
      }
    }
  };

  // コメント関連
  const handleAddComment = async (content: string) => {
    await taskService.addComment(resolvedParams.id, content);
    await loadComments();
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    await taskService.updateComment(resolvedParams.id, commentId, content);
    await loadComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('このコメントを削除しますか?')) return;
    await taskService.deleteComment(resolvedParams.id, commentId);
    await loadComments();
  };

  // サブタスク関連
  const handleAddSubtask = async (title: string) => {
    await taskService.addSubtask(resolvedParams.id, title);
    await loadSubtasks();
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    await taskService.updateSubtask(resolvedParams.id, subtaskId, { completed: !completed });
    await loadSubtasks();
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!confirm('このサブタスクを削除しますか?')) return;
    await taskService.deleteSubtask(resolvedParams.id, subtaskId);
    await loadSubtasks();
  };

  // 添付ファイル関連
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await taskService.uploadAttachment(resolvedParams.id, file);
      }
      await loadAttachments();
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('この添付ファイルを削除しますか?')) return;
    await taskService.deleteAttachment(resolvedParams.id, attachmentId);
    await loadAttachments();
  };

  // 担当者関連
  const handleAddAssignee = async (userId: string) => {
    if (!task) return;
    await taskService.addAssignee(task.id, userId);
    await loadTaskDetail();
  };

  const handleRemoveAssignee = async (userId: string, userName: string) => {
    if (!task || !confirm(`${userName} さんを担当者から外しますか?`)) {
      return;
    }
    await taskService.removeAssignee(task.id, userId);
    await loadTaskDetail();
  };

  // 依存関係関連
  const handleAddDependency = async (dependsOnId: string) => {
    if (!task) return;
    await taskService.addDependency(task.id, dependsOnId);
    await loadTaskDetail();
  };

  const handleRemoveDependency = async (dependsOnId: string) => {
    if (!task) return;
    await taskService.removeDependency(task.id, dependsOnId);
    await loadTaskDetail();
  };

  // マイルストーン関連
  const handleSelectMilestone = async (milestoneId: string | null) => {
    if (!task) return;

    try {
      await taskService.update(task.id, { milestoneId: milestoneId || undefined });
      await loadTaskDetail();
    } catch (error) {
      console.error('Failed to update milestone:', error);
    }
  };

  const handleCreateMilestone = async (name: string, dueDate: string) => {
    if (!task?.project?.id) return;

    try {
      const dateISO = dueDate ? new Date(dueDate).toISOString() : new Date().toISOString();
      await milestoneService.create({
        name,
        dueDate: dateISO,
        projectId: task.project.id,
      });
      await loadProjectMilestones();
    } catch (error) {
      console.error('Failed to create milestone:', error);
    }
  };

  // タグ関連
  const handleAddTag = async (tagId: string) => {
    if (!task) return;

    try {
      await tagService.addTagToTask(task.id, tagId);
      await loadTaskDetail();
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!task) return;

    try {
      await tagService.removeTagFromTask(task.id, tagId);
      await loadTaskDetail();
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  const handleCreateTag = async (name: string, color: string) => {
    if (!task?.project?.id) return;

    try {
      await tagService.create({
        name,
        color,
        projectId: task.project.id,
      });
      await loadProjectTags();
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const completedSubtasksCount = subtasks.filter(s=>s.completed).length;

  // ローディング表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  // タスクが見つからない場合
  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">タスクが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <TaskHeader
        taskTitle={task.title}
        onBack={() => router.back()}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        isEditing={isEditing}
      />

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <TaskTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
          />
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* メインコンテンツエリア */}
          <div className="lg:col-span-3 space-y-6 min-h-0">
            {activeTab === 'overview' && (
              <TaskOverviewTab
                task={task}
                isEditing={isEditing}
                formData={formData}
                isLoading={isLoading}
                progressPercent={progressPercent}
                isEditingProgress={isEditingProgress}
                onFormChange={(data) => setFormData({ ...formData, ...data })}
                onSave={handleUpdate}
                onCancel={handleCancel}
                onProgressChange={setProgressPercent}
                onSaveProgress={handleProgressUpdate}
                onCancelProgress={handleCancelProgress}
                onStartEditProgress={() => setIsEditingProgress(true)}
                subtasksCount={subtasks.length}
                completedSubtasksCount={completedSubtasksCount}
                onStatusChange={handleQuickStatusChange}
                onPriorityChange={handleQuickPriorityChange}
                isUpdatingStatus={isUpdatingStatus}
                isUpdatingPriority={isUpdatingPriority}
              />
            )}

            {activeTab === 'comments' && (
              <TaskCommentsTab
                comments={comments}
                currentUserId={user?.id}
                onAddComment={handleAddComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
              />
            )}

            {activeTab === 'subtasks' && (
              <TaskSubtasksTab
                subtasks={subtasks}
                onAddSubtask={handleAddSubtask}
                onToggleSubtask={handleToggleSubtask}
                onDeleteSubtask={handleDeleteSubtask}
              />
            )}

            {activeTab === 'attachments' && (
              <TaskAttachmentsTab
                attachments={attachments}
                isUploading={isUploading}
                onFileUpload={handleFileUpload}
                onDeleteAttachment={handleDeleteAttachment}
              />
            )}

            {activeTab === 'time' && (
              <TimeTrackingTab
                taskId={resolvedParams.id}
                estimatedHours={task.estimatedHours}
                currentUserId={user?.id}
                onUpdate={loadTaskDetail}
              />
            )}

            {activeTab === 'activity' && (
              <TaskActivityTab activityLogs={activityLogs} />
            )}

            {activeTab === 'details' && (
              <TaskDetailsTab
                task={task}
                projectTasks={projectTasks}
                projectMilestones={projectMilestones}
                projectTags={projectTags}
                projectMembers={projectMembers}
                onAddDependency={handleAddDependency}
                onRemoveDependency={handleRemoveDependency}
                onSelectMilestone={handleSelectMilestone}
                onCreateMilestone={handleCreateMilestone}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                onCreateTag={handleCreateTag}
              />
            )}
          </div>

          {/* サイドバー */}
          <div className="lg:col-span-1 lg:sticky lg:top-4 lg:self-start space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <AssigneeManager
              assignees={task.assignees || []}
              projectMembers={projectMembers}
              onAddAssignee={handleAddAssignee}
              onRemoveAssignee={handleRemoveAssignee}
            />

            <TaskSidebar task={task} />
          </div>
        </div>
      </div>
    </div>
  );
}