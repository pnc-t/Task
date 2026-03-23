'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, CheckSquare, Activity, Settings, X, Bell, Mail, Bot, ChevronDown, ChevronRight, Circle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { projectService } from '@/services/project.service';
import { Project } from '@/types/project';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
  { name: 'プロジェクト', href: '/projects', icon: FolderKanban },
  { name: 'タスク', href: '/tasks', icon: CheckSquare },
  { name: 'AIチャット', href: '/chat', icon: Bot },
  { name: '通知', href: '/notifications', icon: Bell },
  { name: '招待', href: '/invitations', icon: Mail },
  { name: 'レポート', href: '/reports', icon: BarChart3 },
  { name: 'アクティビティ', href: '/activity', icon: Activity },
  { name: '設定', href: '/settings', icon: Settings },
];

const MAX_SIDEBAR_PROJECTS = 8;

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(true);

  useEffect(() => {
    projectService.getAll()
      .then((data) => setProjects(data.slice(0, MAX_SIDEBAR_PROJECTS)))
      .catch(() => {});
  }, []);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-30 w-52 bg-white border-r border-gray-200',
          'transform transition-transform duration-200 ease-in-out lg:transform-none flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-200">
          <h2 className="text-lg font-semibold">メニュー</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose()}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* プロジェクト一覧 */}
        {projects.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-3 flex-1 overflow-y-auto">
            <button
              onClick={() => setProjectsOpen(!projectsOpen)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
            >
              <span>プロジェクト</span>
              {projectsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {projectsOpen && (
              <div className="mt-2 space-y-0.5">
                {projects.map((project) => {
                  const isActive = pathname === `/projects/${project.id}`;
                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      onClick={() => onClose()}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors truncate',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <Circle className="w-2 h-2 flex-shrink-0 fill-current" />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  );
                })}
                <Link
                  href="/projects"
                  onClick={() => onClose()}
                  className="block px-2 py-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  すべて表示 →
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}