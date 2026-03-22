'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Task } from '@/types/task';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, ExternalLink, Clock, Flag, CheckCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getEventColor } from './calendar-colors';

interface EventPopoverProps {
  task: Task;
  anchorRect: DOMRect;
  onClose: () => void;
}

export function EventPopover({ task, anchorRect, onClose }: EventPopoverProps) {
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // ポップオーバーの位置を計算
  useEffect(() => {
    if (!popoverRef.current) return;
    const popover = popoverRef.current;
    const popoverRect = popover.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let top = anchorRect.bottom + 8;
    let left = anchorRect.left;

    // 下に収まらなければ上に表示
    if (top + popoverRect.height > viewportH - 16) {
      top = anchorRect.top - popoverRect.height - 8;
    }
    // 左に収まらなければ調整
    if (left + popoverRect.width > viewportW - 16) {
      left = viewportW - popoverRect.width - 16;
    }
    if (left < 16) left = 16;
    if (top < 16) top = 16;

    setPosition({ top, left });
  }, [anchorRect]);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // 次のtickで追加（クリックイベントのバブリングを防ぐ）
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const color = getEventColor(task);

  const statusInfo = (() => {
    if (task.status === 'done') return { label: '完了', icon: CheckCircle, textColor: 'text-green-600' };
    if (task.status === 'in_progress') return { label: '進行中', icon: Clock, textColor: 'text-blue-600' };
    return { label: '未着手', icon: Clock, textColor: 'text-gray-500' };
  })();

  const priorityInfo = (() => {
    switch (task.priority) {
      case 'high': return { label: '高', color: 'text-red-600 bg-red-50' };
      case 'medium': return { label: '中', color: 'text-amber-600 bg-amber-50' };
      case 'low': return { label: '低', color: 'text-green-600 bg-green-50' };
      default: return { label: '-', color: 'text-gray-500 bg-gray-50' };
    }
  })();

  const StatusIcon = statusInfo.icon;

  return createPortal(
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: 'none' }}>
      <div
        ref={popoverRef}
        className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 w-80 overflow-hidden"
        style={{ top: position.top, left: position.left, pointerEvents: 'auto' }}
      >
        {/* カラーストライプ */}
        <div className="h-2 w-full" style={{ backgroundColor: color.bg }} />

        {/* ヘッダー */}
        <div className="px-4 pt-3 pb-2 flex items-start justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex-1 pr-2 leading-snug">
            {task.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-4 pb-4 space-y-3">
          {/* 日時 */}
          {(task.startDate || task.dueDate) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>
                {task.startDate && format(parseISO(task.startDate), 'M月d日(E)', { locale: ja })}
                {task.startDate && task.dueDate && ' – '}
                {task.dueDate && format(parseISO(task.dueDate), 'M月d日(E)', { locale: ja })}
              </span>
            </div>
          )}

          {/* ステータス・優先度 */}
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusInfo.textColor} bg-opacity-10`}>
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityInfo.color}`}>
              優先度: {priorityInfo.label}
            </span>
          </div>

          {/* 担当者 */}
          {(task.assignee || (task.assignees && task.assignees.length > 0)) && (
            <div className="flex items-center gap-2">
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <UserAvatar name={task.assignee.name} avatar={task.assignee.avatar} size="xs" />
                  <span className="text-sm text-gray-700">{task.assignee.name}</span>
                </div>
              ) : task.assignees && task.assignees.length > 0 ? (
                <div className="flex items-center gap-1">
                  {task.assignees.slice(0, 3).map((a) => (
                    <UserAvatar key={a.user.id} name={a.user.name} avatar={a.user.avatar} size="xs" />
                  ))}
                  {task.assignees.length > 3 && (
                    <span className="text-xs text-gray-500 ml-1">+{task.assignees.length - 3}</span>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* 説明 */}
          {task.description && (
            <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
          )}

          {/* アクション */}
          <button
            onClick={() => router.push(`/tasks/${task.id}`)}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium pt-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            詳細を開く
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
