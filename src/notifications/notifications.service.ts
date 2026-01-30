import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketsGateway } from '../websockets/websockets.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private websockets: WebSocketsGateway,
  ) {}

  async create(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, message, data },
    });

    // リアルタイム通知を送信
    this.websockets.sendToUser(userId, 'notification:new', notification);

    this.logger.log(`Notification sent to user ${userId}: ${type}`);
    return notification;
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return { success: result.count > 0 };
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  async delete(userId: string, notificationId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
    return { success: result.count > 0 };
  }

  // ================ 通知ヘルパーメソッド ================

  async notifyTaskAssigned(
    taskId: string,
    taskTitle: string,
    assigneeId: string,
    assignerName: string,
  ) {
    await this.create(
      assigneeId,
      'task_assigned',
      'タスクが割り当てられました',
      `${assignerName}さんがあなたにタスク「${taskTitle}」を割り当てました`,
      { taskId },
    );
  }

  async notifyCommentAdded(
    taskId: string,
    taskTitle: string,
    userIds: string[],
    commenterName: string,
  ) {
    const uniqueUserIds = [...new Set(userIds)];
    for (const userId of uniqueUserIds) {
      await this.create(
        userId,
        'comment_added',
        '新しいコメント',
        `${commenterName}さんがタスク「${taskTitle}」にコメントしました`,
        { taskId },
      );
    }
  }

  async notifyStatusChanged(
    taskId: string,
    taskTitle: string,
    userIds: string[],
    newStatus: string,
    changerName: string,
  ) {
    const statusText: Record<string, string> = {
      todo: '未着手',
      in_progress: '進行中',
      done: '完了',
    };
    const statusLabel = statusText[newStatus] || newStatus;

    const uniqueUserIds = [...new Set(userIds)];
    for (const userId of uniqueUserIds) {
      await this.create(
        userId,
        'status_changed',
        'ステータス変更',
        `${changerName}さんがタスク「${taskTitle}」を「${statusLabel}」に変更しました`,
        { taskId },
      );
    }
  }

  async notifyProjectInvitation(
    userId: string,
    projectId: string,
    projectName: string,
    inviterName: string,
    invitationId: string,
  ) {
    await this.create(
      userId,
      'project_invitation',
      'プロジェクトへの招待',
      `${inviterName}さんからプロジェクト「${projectName}」への招待が届いています`,
      { projectId, invitationId },
    );
  }

  async notifyDueSoon(
    userId: string,
    taskId: string,
    taskTitle: string,
    daysUntilDue: number,
  ) {
    const message =
      daysUntilDue === 0
        ? `タスク「${taskTitle}」の期限は今日です`
        : `タスク「${taskTitle}」の期限まであと${daysUntilDue}日です`;

    await this.create(userId, 'task_due_soon', '期限が近づいています', message, {
      taskId,
    });
  }
}
