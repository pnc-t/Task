'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectMember } from '@/types/project';
import { projectService } from '@/services/project.service';
import { userService } from '@/services/user.service';
import { invitationService } from '@/services/invitation.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Trash2, Crown, Shield, User as UserIcon, Search, Mail } from 'lucide-react';
import { ProjectInvitationsList } from '@/components/invitations/project-invitations-list';
import { UserAvatar } from '@/components/ui/user-avatar';

interface MemberManagementProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  onUpdate: () => void;
}

interface SearchedUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export function MemberManagement({ open, onClose, project, onUpdate }: MemberManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invitationRefreshTrigger, setInvitationRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setIsSearching(true);
    try {
      const results = await userService.searchUsers(searchQuery);
      // 既存メンバーを除外
      const existingMemberIds = project.members.map(m => m.user.id);
      const filteredResults = results.filter(
        (user: SearchedUser) => !existingMemberIds.includes(user.id)
      );
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedUser) {
      setError('ユーザーを選択してください');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await invitationService.inviteMember(project.id, {
        email: selectedUser.email,
        role,
      });
      setSuccess(`${selectedUser.name} さんに招待を送信しました`);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      setRole('member');
      setInvitationRefreshTrigger((prev) => prev + 1);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || '招待の送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`${memberName} さんをメンバーから削除してもよろしいですか？`)) {
      return;
    }

    try {
      await projectService.removeMember(project.id, memberId);
      setSuccess(`${memberName} さんを削除しました`);
      onUpdate();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'メンバーの削除に失敗しました');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'オーナー';
      case 'admin':
        return '管理者';
      default:
        return 'メンバー';
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">メンバー管理</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* タブ */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'members'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              メンバー ({project.members.length})
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'invitations'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              招待状況
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'members' ? (
              <>
                {/* メンバー招待フォーム */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">ユーザーを招待</h3>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm mb-4">
                      {success}
                    </div>
                  )}

                  {/* ユーザー検索 */}
                  <div className="mb-4">
                    <Label htmlFor="search">ユーザーを検索</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="名前またはメールアドレスで検索"
                        className="pl-10"
                      />
                    </div>

                    {/* 検索結果 */}
                    {searchQuery.length >= 2 && (
                      <div className="mt-2 bg-white border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                        {isSearching ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            検索中...
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="divide-y divide-gray-200">
                            {searchResults.map((user) => (
                              <button
                                key={user.id}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSearchQuery('');
                                  setSearchResults([]);
                                }}
                                className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <UserAvatar name={user.name} avatar={user.avatar} size="md" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">
                            ユーザーが見つかりませんでした
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 選択されたユーザー */}
                  {selectedUser && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={selectedUser.name} avatar={selectedUser.avatar} size="md" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                            <p className="text-xs text-gray-600">{selectedUser.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedUser(null)}
                          className="p-1 hover:bg-blue-100 rounded"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 役割選択 */}
                  <div className="mb-4">
                    <Label htmlFor="role">役割</Label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
                      className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="member">メンバー</option>
                      <option value="admin">管理者</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleInviteMember}
                    disabled={isLoading || !selectedUser}
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {isLoading ? '送信中...' : '招待を送信'}
                  </Button>
                </div>

                {/* メンバーリスト */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    現在のメンバー ({project.members.length})
                  </h3>
                  <div className="space-y-2">
                    {project.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar name={member.user.name} avatar={member.user.avatar} size="lg" />
                          <div>
                            <p className="font-medium text-gray-900">{member.user.name}</p>
                            <p className="text-sm text-gray-500">{member.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200">
                            {getRoleIcon(member.role)}
                            <span className="text-sm font-medium text-gray-700">
                              {getRoleLabel(member.role)}
                            </span>
                          </div>
                          {member.role !== 'owner' && (
                            <button
                              onClick={() => handleRemoveMember(member.id, member.user.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <ProjectInvitationsList
                projectId={project.id}
                refreshTrigger={invitationRefreshTrigger}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}