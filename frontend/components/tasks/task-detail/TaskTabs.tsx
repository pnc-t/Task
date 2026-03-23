import { Flag, MessageSquare, CheckSquare, Paperclip, History, LucideIcon } from 'lucide-react';

export type TabId = 'overview' | 'comments' | 'subtasks' | 'files_time' | 'activity';

interface Tab {
  id: TabId;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface TaskTabsProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  counts: {
    comments: number;
    subtasks: number;
    attachments: number;
  };
}

export function TaskTabs({ activeTab, onTabChange, counts }: TaskTabsProps) {
  const tabs: Tab[] = [
    { id: 'overview', label: '概要', icon: Flag },
    { id: 'comments', label: 'コメント', icon: MessageSquare, count: counts.comments },
    { id: 'subtasks', label: 'サブタスク', icon: CheckSquare, count: counts.subtasks },
    { id: 'files_time', label: 'ファイル・工数', icon: Paperclip, count: counts.attachments },
    { id: 'activity', label: '履歴', icon: History },
  ];

  return (
    <div className="flex gap-1 -mb-px">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}