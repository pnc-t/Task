'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { userService } from '@/services/user.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('確認テキストが正しくありません');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await userService.deleteAccount(password);
      logout();
      router.push('/login?deleted=true');
    } catch (err: any) {
      setError(err.response?.data?.message || 'アカウントの削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        戻る
      </button>

      <div className="bg-white rounded-lg shadow border border-red-200 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">アカウントの削除</h1>
            <p className="text-gray-600">
              この操作は取り消すことができません。慎重に実行してください。
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h3 className="font-semibold text-red-900 mb-2">削除される内容</h3>
          <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
            <li>プロフィール情報</li>
            <li>作成したタスク</li>
            <li>プロジェクトメンバーシップ</li>
            <li>アクティビティ履歴</li>
            <li>すべての個人データ</li>
          </ul>
        </div>

        {!showConfirmation ? (
          <Button
            onClick={() => setShowConfirmation(true)}
            variant="outline"
            className="w-full text-red-600 border-red-300 hover:bg-red-50"
          >
            アカウントを削除する
          </Button>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="password">パスワードを入力</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="現在のパスワード"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confirm">
                確認のため <span className="font-bold text-red-600">DELETE</span> と入力してください
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                required
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false);
                  setPassword('');
                  setConfirmText('');
                  setError('');
                }}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isLoading || !password || confirmText !== 'DELETE'}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isLoading ? '削除中...' : '完全に削除する'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}