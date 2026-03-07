import { useState } from 'react';
import { Users, Plus, X, Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';

interface ProjectMember {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
  };
  role: string;
}

interface Assignee {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
  };
}

interface AssigneeManagerProps {
  assignees: Assignee[];
  projectMembers: ProjectMember[];
  onAddAssignee: (userId: string) => Promise<void>;
  onRemoveAssignee: (userId: string, userName: string) => Promise<void>;
}

export function AssigneeManager({
  assignees,
  projectMembers,
  onAddAssignee,
  onRemoveAssignee,
}: AssigneeManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getAvailableMembers = () => {
    const assignedUserIds = assignees?.map(a => a.user.id) || [];
    return projectMembers.filter(member =>
      !assignedUserIds.includes(member.user.id) &&
      member.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'owner':
        return { label: 'オーナー', color: 'bg-purple-100 text-purple-700' };
      case 'admin':
        return { label: '管理者', color: 'bg-blue-100 text-blue-700' };
      default:
        return { label: 'メンバー', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const availableMembers = getAvailableMembers();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">担当者</h4>
              <p className="text-xs text-gray-600">{assignees?.length || 0}人が担当中</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(!showModal)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              showModal 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
            }`}
          >
            {showModal ? (
              <X className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* 現在の担当者 */}
        <div className="space-y-2 mb-4">
          {assignees && assignees.length > 0 ? (
            assignees.map((assignee) => (
              <div
                key={assignee.id}
                className="group flex items-center justify-between p-3 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <UserAvatar name={assignee.user.name} avatar={assignee.user.avatar} size="lg" className="shadow-md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{assignee.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{assignee.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveAssignee(assignee.user.id, assignee.user.name)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="担当から外す"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">担当者が設定されていません</p>
              <p className="text-xs text-gray-400 mt-1">メンバーを追加しましょう</p>
            </div>
          )}
        </div>

        {/* プロジェクトメンバー一覧 */}
        {showModal && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="メンバーを検索..."
                  className="pl-10 h-10 text-sm bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {availableMembers.length > 0 ? (
                availableMembers.map((member) => {
                  const roleDisplay = getRoleDisplay(member.role);
                  return (
                    <button
                      key={member.id}
                      onClick={() => {
                        onAddAssignee(member.user.id);
                        setShowModal(false);
                        setSearchQuery('');
                      }}
                      className="w-full p-3 text-left hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar name={member.user.name} avatar={member.user.avatar} size="lg" className="shadow-md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {member.user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {member.user.email}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${roleDisplay.color}`}>
                          {roleDisplay.label}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {searchQuery ? '該当するメンバーが見つかりません' : 'すべてのメンバーが担当者に設定されています'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}