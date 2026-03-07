'use client';

import { useRouter } from 'next/navigation';
import { User, Lock, Activity, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  const settings = [
    {
      icon: User,
      title: 'プロフィール',
      description: '名前や自己紹介を編集',
      href: '/profile',
      color: 'text-blue-600 bg-blue-100',
    },
    {
      icon: Lock,
      title: 'パスワード',
      description: 'パスワードを変更',
      href: '/settings/password',
      color: 'text-green-600 bg-green-100',
    },
    {
      icon: Activity,
      title: 'アクティビティ',
      description: '最近の活動履歴を表示',
      href: '/activity',
      color: 'text-purple-600 bg-purple-100',
    },
    {
      icon: Bell,
      title: '通知設定',
      description: '通知の種類やオン・オフを管理',
      href: '/settings/notifications',
      color: 'text-yellow-600 bg-yellow-100',
    },
    {
      icon: Shield,
      title: 'アカウント',
      description: 'アカウントの削除',
      href: '/settings/account',
      color: 'text-red-600 bg-red-100',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-600 mt-1">アカウント設定を管理</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settings.map((setting) => {
          const Icon = setting.icon;
          return (
            <button
              key={setting.title}
              onClick={() => router.push(setting.href)}
              className="bg-white rounded-lg shadow border border-gray-200 p-6 text-left hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${setting.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{setting.title}</h3>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}