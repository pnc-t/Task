'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { userService } from '@/services/user.service';
import { UserProfile } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Edit2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userService.getMe();
      setProfile(data);
      setFormData({
        name: data.name,
        bio: data.bio || '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      await userService.updateProfile(formData);
      await loadProfile();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'プロフィールの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
        <p className="text-gray-600 mt-1">アカウント情報の確認と編集</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* プロフィールカード */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex flex-col items-center">
              <AvatarUpload
                currentAvatar={profile.avatar}
                userName={profile.name}
                onUpdate={(avatarUrl) => {
                  setProfile({ ...profile, avatar: avatarUrl });
                  updateUser({ avatar: avatarUrl });
                }}
              />
              <h2 className="text-xl font-semibold text-gray-900 mt-4">{profile.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{profile.email}</p>

              <div className="w-full mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    登録日: {format(new Date(profile.createdAt), 'yyyy年M月d日', { locale: ja })}
                  </span>
                </div>
              </div>

              {profile._count && (
                <div className="w-full mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">統計</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {profile._count.projects}
                      </div>
                      <div className="text-xs text-gray-500">プロジェクト</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {profile._count.createdTasks}
                      </div>
                      <div className="text-xs text-gray-500">作成タスク</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {profile._count.tasks}
                      </div>
                      <div className="text-xs text-gray-500">担当タスク</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit2 className="w-4 h-4 mr-2" />
                  編集
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    キャンセル
                  </Button>
                  <Button onClick={handleSave} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">名前</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">{profile.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <p className="mt-1 text-gray-500 text-sm">
                  {profile.email} (変更不可)
                </p>
              </div>

              <div>
                <Label htmlFor="bio">自己紹介</Label>
                {isEditing ? (
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="mt-1 flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    placeholder="あなたについて教えてください"
                  />
                ) : (
                  <p className="mt-1 text-gray-900">
                    {profile.bio || '未設定'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* セキュリティ設定 */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">セキュリティ</h3>
            <div className="space-y-4">
              <Button
                onClick={() => router.push('/settings/password')}
                variant="outline"
                className="w-full justify-start"
              >
                パスワードを変更
              </Button>
              <Button
                onClick={() => router.push('/settings/account')}
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              >
                アカウントを削除
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}