'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useNotificationSettingsStore } from '@/lib/notification-settings-store';
import { NotificationPreferences, NotificationType } from '@/types/notification';
import { Button } from '@/components/ui/button';

const NOTIFICATION_TYPES: {
  type: NotificationType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    type: 'task_assigned',
    label: 'タスク割り当て',
    description: 'あなたにタスクが割り当てられた時',
    icon: '📋',
  },
  {
    type: 'task_due_soon',
    label: '期限が近づいている',
    description: 'タスクの期限が近づいた時',
    icon: '⏰',
  },
  {
    type: 'comment_added',
    label: 'コメント追加',
    description: 'あなたのタスクにコメントが追加された時',
    icon: '💬',
  },
  {
    type: 'status_changed',
    label: 'ステータス変更',
    description: 'あなたのタスクのステータスが変わった時',
    icon: '🔄',
  },
  {
    type: 'project_invitation',
    label: 'プロジェクト招待',
    description: 'プロジェクトに招待された時',
    icon: '✉️',
  },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const enabled = useNotificationSettingsStore((s) => s.enabled);
  const toggle = useNotificationSettingsStore((s) => s.toggle);
  const reset = useNotificationSettingsStore((s) => s.reset);
  const preferences = useNotificationSettingsStore(
    useShallow((s) => ({
      task_assigned: s.task_assigned,
      task_due_soon: s.task_due_soon,
      comment_added: s.comment_added,
      status_changed: s.status_changed,
      project_invitation: s.project_invitation,
    }))
  );

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        戻る
      </button>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">通知設定</h1>
        <p className="text-gray-600 mb-6">受け取る通知の種類を管理してください</p>

        {/* グローバルトグル */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
          <div>
            <p className="font-semibold text-gray-900">通知を有効にする</p>
            <p className="text-sm text-gray-500">全通知のオン / オフ切り替え</p>
          </div>
          <Toggle checked={enabled} onChange={() => toggle('enabled')} />
        </div>

        {/* 通知種類ごとのトグル */}
        <div className={`space-y-0 border border-gray-200 rounded-lg overflow-hidden ${!enabled ? 'opacity-50' : ''}`}>
          {NOTIFICATION_TYPES.map((item, index) => (
            <div
              key={item.type}
              className={`flex items-center justify-between p-4 ${
                index !== NOTIFICATION_TYPES.length - 1 ? 'border-b border-gray-200' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl leading-tight">{item.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
              <Toggle
                checked={preferences[item.type]}
                onChange={() => toggle(item.type as keyof NotificationPreferences)}
              />
            </div>
          ))}
        </div>

        {/* リセットボタン */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
          <Button type="button" variant="outline" onClick={reset}>
            デフォルトにリセット
          </Button>
        </div>
      </div>
    </div>
  );
}
