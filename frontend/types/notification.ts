export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  createdAt: string;
  userId: string;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_due_soon'
  | 'comment_added'
  | 'status_changed'
  | 'project_invitation';

export interface NotificationData {
  taskId?: string;
  projectId?: string;
  invitationId?: string;
  [key: string]: unknown;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  task_assigned: boolean;
  task_due_soon: boolean;
  comment_added: boolean;
  status_changed: boolean;
  project_invitation: boolean;
}
