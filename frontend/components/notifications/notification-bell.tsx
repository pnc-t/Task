'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { notificationService } from '@/services/notification.service';
import { Notification, NotificationType } from '@/types/notification';
import { wsClient } from '@/lib/websocket-client';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useNotificationSettingsStore } from '@/lib/notification-settings-store';

export function NotificationBell() {
  const router = useRouter();
  const isEnabled = useNotificationSettingsStore((s) => s.isEnabled);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [notifResponse, count] = await Promise.all([
        notificationService.getNotifications(1, 10),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(notifResponse.data);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const handleNewNotification = (notification: Notification) => {
      if (!isEnabled(notification.type)) return;
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
      setUnreadCount((prev) => prev + 1);
    };

    wsClient.on('notification:new', handleNewNotification);

    return () => {
      wsClient.off('notification:new', handleNewNotification);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(notificationId);
      const wasUnread = notifications.find((n) => n.id === notificationId)?.isRead === false;
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      notificationService.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (notification.data?.taskId) {
      router.push(`/tasks/${notification.data.taskId}`);
    } else if (notification.data?.projectId) {
      router.push(`/projects/${notification.data.projectId}`);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'task_due_soon':
        return '⏰';
      case 'comment_added':
        return '💬';
      case 'status_changed':
        return '🔄';
      case 'project_invitation':
        return '✉️';
      default:
        return '🔔';
    }
  };

  const filteredNotifications = useMemo(
    () => notifications.filter((n) => isEnabled(n.type)),
    [notifications, isEnabled]
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-md"
        aria-label="通知"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-20 border border-gray-200 max-h-[32rem] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">通知</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  すべて既読
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading && filteredNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">読み込み中...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>通知はありません</p>
                </div>
              ) : (
                <ul>
                  {filteredNotifications.map((notification) => (
                    <li
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              !notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: ja,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="既読にする"
                            >
                              <Check className="w-4 h-4 text-gray-500" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => {
                  router.push('/notifications');
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                すべての通知を見る
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => {
                  router.push('/settings/notifications');
                  setIsOpen(false);
                }}
                className="p-1.5 hover:bg-gray-200 rounded"
                title="通知設定"
              >
                <Settings className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
