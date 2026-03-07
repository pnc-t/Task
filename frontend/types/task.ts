export interface TaskAssignee {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  actualStartDate?: string;  // 実際の開始日時
  actualEndDate?: string;    // 実際の終了日時
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  assignees?: TaskAssignee[];
  project?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  dependencies?: TaskDependency[];
  dependents?: TaskDependent[];
  comments?: TaskComment[];
  subtasks?: Subtask[];
  attachments?: TaskAttachment[];
  activityLogs?: ActivityLog[];
  milestone?: {
    id: string;
    name: string;
    dueDate: string;
    status: string;
  };
  tags?: TaskTag[];
}

export interface TaskTag {
  id: string;
  tag: {
    id: string;
    name: string;
    color: string;
  };
}

export interface TaskDependency {
  id: string;
  dependsOn: {
    id: string;
    title: string;
    status: string;
  };
}

export interface TaskDependent {
  id: string;
  task: {
    id: string;
    title: string;
    status: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  priority?: 'low' | 'medium' | 'high';
  startDate?: string;
  dueDate?: string;
  dependsOn?: string[];
  estimatedHours?: number;
  progress?: number;
  milestoneId?: string;
  tagIds?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  startDate?: string;
  dueDate?: string;
  assigneeId?: string;
  projectId?: string;
  dependsOn?: string[];
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  milestoneId?: string | null;
  tagIds?: string[];
  actualStartDate?: string | null;  // 実際の開始日時
  actualEndDate?: string | null;    // 実際の終了日時
}

export interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  taskId: string;
}

export interface TaskAttachment {
  id: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

export interface ActivityLog {
  id: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  createdAt: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

// 工数記録
export interface TimeEntry {
  id: string;
  hours: number;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

export interface CreateTimeEntryData {
  hours: number;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

// マイルストーン
export interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'completed';
  projectId: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
}

// タグ
export interface Tag {
  id: string;
  name: string;
  color: string;
  projectId: string;
  createdAt: string;
  _count?: {
    tasks: number;
  };
}